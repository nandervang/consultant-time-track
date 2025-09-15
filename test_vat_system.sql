-- Test MOMS (VAT) System 
-- Run this SQL in your Supabase SQL editor to create test data for demonstrating the VAT system

-- First, let's check current settings
SELECT 
    'Current VAT Settings' as info,
    auto_generate_yearly_vat,
    vat_rate_income,
    vat_rate_expense,
    vat_payment_month,
    vat_payment_day
FROM user_profiles 
WHERE id = (SELECT auth.uid()); -- Gets current user

-- Create some test invoice items for 2024 if they don't exist
-- Note: Replace with your actual user_id, project_id, and client_id
INSERT INTO invoice_items (
    user_id,
    project_id,
    client_id,
    description,
    quantity,
    rate,
    total_amount,
    currency,
    due_date,
    status
)
SELECT 
    auth.uid(),
    p.id as project_id,
    c.id as client_id,
    'Test Consulting Services - ' || EXTRACT(month FROM date_val) as description,
    10,  -- 10 hours
    1500, -- 1500 kr per hour
    15000, -- 15000 kr total (without VAT)
    'SEK',
    date_val::date as due_date,
    'sent' as status
FROM (
    VALUES 
        ('2024-03-15'::timestamp),
        ('2024-06-15'::timestamp),
        ('2024-09-15'::timestamp),
        ('2024-12-15'::timestamp)
) as dates(date_val)
CROSS JOIN (
    SELECT id FROM projects WHERE user_id = auth.uid() LIMIT 1
) p
CROSS JOIN (
    SELECT id FROM clients WHERE user_id = auth.uid() LIMIT 1
) c
WHERE NOT EXISTS (
    SELECT 1 FROM invoice_items 
    WHERE user_id = auth.uid() 
    AND description LIKE 'Test Consulting Services%'
    AND EXTRACT(year FROM due_date) = 2024
);

-- Create some test expense entries for 2024 (these include VAT already)
INSERT INTO cash_flow_entries (
    user_id,
    type,
    amount,
    description,
    category,
    date,
    is_recurring,
    is_budget_entry
)
SELECT 
    auth.uid(),
    'expense',
    amount_with_vat,
    'Test ' || expense_type || ' - ' || EXTRACT(month FROM date_val),
    expense_type,
    date_val::date,
    false,
    false
FROM (
    VALUES 
        ('2024-02-15'::timestamp, 'IT Services', 2500), -- 2500 kr including 25% VAT
        ('2024-05-15'::timestamp, 'Office Supplies', 625), -- 625 kr including 25% VAT  
        ('2024-08-15'::timestamp, 'Software License', 1250), -- 1250 kr including 25% VAT
        ('2024-11-15'::timestamp, 'Consulting', 3750) -- 3750 kr including 25% VAT
) as expenses(date_val, expense_type, amount_with_vat)
WHERE NOT EXISTS (
    SELECT 1 FROM cash_flow_entries 
    WHERE user_id = auth.uid() 
    AND description LIKE 'Test %'
    AND EXTRACT(year FROM date) = 2024
);

-- Show what we created
SELECT 'Test Invoice Items Created' as info, COUNT(*) as count
FROM invoice_items 
WHERE user_id = auth.uid() 
AND description LIKE 'Test Consulting Services%'
AND EXTRACT(year FROM due_date) = 2024;

SELECT 'Test Expense Items Created' as info, COUNT(*) as count
FROM cash_flow_entries 
WHERE user_id = auth.uid() 
AND description LIKE 'Test %'
AND type = 'expense'
AND EXTRACT(year FROM date) = 2024;

-- Calculate what the VAT should be for 2024
WITH vat_calculation AS (
    SELECT 
        -- Income from invoices (base amount without VAT)
        COALESCE((
            SELECT SUM(total_amount) 
            FROM invoice_items 
            WHERE user_id = auth.uid() 
            AND EXTRACT(year FROM due_date) = 2024
            AND status = 'sent'
        ), 0) as income_base,
        
        -- Expenses (including VAT) 
        COALESCE((
            SELECT SUM(amount)
            FROM cash_flow_entries 
            WHERE user_id = auth.uid() 
            AND type = 'expense'
            AND EXTRACT(year FROM date) = 2024
            AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
        ), 0) as expense_with_vat,
        
        -- VAT rates from settings
        COALESCE((SELECT vat_rate_income FROM user_profiles WHERE id = auth.uid()), 25) as income_vat_rate,
        COALESCE((SELECT vat_rate_expense FROM user_profiles WHERE id = auth.uid()), 25) as expense_vat_rate
)
SELECT 
    'Expected VAT Calculation for 2024' as info,
    income_base as "Income (excluding VAT)",
    ROUND(income_base * (income_vat_rate / 100), 2) as "Income VAT (25%)",
    expense_with_vat as "Expenses (including VAT)",
    ROUND(expense_with_vat - (expense_with_vat / (1 + expense_vat_rate / 100)), 2) as "Expense VAT deductible",
    ROUND(
        (income_base * (income_vat_rate / 100)) - 
        (expense_with_vat - (expense_with_vat / (1 + expense_vat_rate / 100))), 
        2
    ) as "Net MOMS owed"
FROM vat_calculation;

-- Check if MOMS tax entry exists for 2024
SELECT 
    'MOMS Tax Entries' as info,
    id,
    amount,
    description,
    date,
    created_at
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND category = 'MOMS Tax'
AND (
    description LIKE '%2024%' OR 
    EXTRACT(year FROM date) = 2025
)
ORDER BY date DESC;