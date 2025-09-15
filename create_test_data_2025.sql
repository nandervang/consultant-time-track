-- Create test data for 2025 to demonstrate VAT system
-- Run this SQL in your Supabase SQL editor to create sample 2025 data

-- Create some test invoice items for 2025 if they don't exist
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
    'Test Consulting 2025 - ' || EXTRACT(month FROM date_val) as description,
    8,  -- 8 hours
    2000, -- 2000 kr per hour (increased rate for 2025)
    16000, -- 16000 kr total (without VAT)
    'SEK',
    date_val::date as due_date,
    'sent' as status
FROM (
    VALUES 
        ('2025-01-15'::timestamp),
        ('2025-04-15'::timestamp),
        ('2025-07-15'::timestamp),
        ('2025-10-15'::timestamp)
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
    AND description LIKE 'Test Consulting 2025%'
    AND EXTRACT(year FROM due_date) = 2025
);

-- Create some test expense entries for 2025 (these include VAT already)
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
    'Test ' || expense_type || ' 2025 - ' || EXTRACT(month FROM date_val),
    expense_type,
    date_val::date,
    false,
    false
FROM (
    VALUES 
        ('2025-02-15'::timestamp, 'IT Services', 3000), -- 3000 kr including 25% VAT
        ('2025-05-15'::timestamp, 'Office Supplies', 750), -- 750 kr including 25% VAT  
        ('2025-08-15'::timestamp, 'Software License', 1500), -- 1500 kr including 25% VAT
        ('2025-11-15'::timestamp, 'Consulting', 2500) -- 2500 kr including 25% VAT
) as expenses(date_val, expense_type, amount_with_vat)
WHERE NOT EXISTS (
    SELECT 1 FROM cash_flow_entries 
    WHERE user_id = auth.uid() 
    AND description LIKE 'Test % 2025%'
    AND EXTRACT(year FROM date) = 2025
);

-- Calculate expected VAT for 2025
WITH vat_calculation_2025 AS (
    SELECT 
        -- Income from invoices 2025 (base amount without VAT)
        COALESCE((
            SELECT SUM(total_amount) 
            FROM invoice_items 
            WHERE user_id = auth.uid() 
            AND EXTRACT(year FROM due_date) = 2025
            AND status = 'sent'
        ), 0) as income_base,
        
        -- Expenses 2025 (including VAT) 
        COALESCE((
            SELECT SUM(amount)
            FROM cash_flow_entries 
            WHERE user_id = auth.uid() 
            AND type = 'expense'
            AND EXTRACT(year FROM date) = 2025
            AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
        ), 0) as expense_with_vat,
        
        -- VAT rates from settings
        COALESCE((SELECT vat_rate_income FROM user_profiles WHERE id = auth.uid()), 25) as income_vat_rate,
        COALESCE((SELECT vat_rate_expense FROM user_profiles WHERE id = auth.uid()), 25) as expense_vat_rate
)
SELECT 
    '=== EXPECTED VAT CALCULATION FOR 2025 ===' as info,
    income_base as "Income 2025 (excluding VAT)",
    ROUND(income_base * (income_vat_rate / 100), 2) as "Income VAT (25%)",
    expense_with_vat as "Expenses 2025 (including VAT)",
    ROUND(expense_with_vat - (expense_with_vat / (1 + expense_vat_rate / 100)), 2) as "Expense VAT deductible",
    ROUND(
        (income_base * (income_vat_rate / 100)) - 
        (expense_with_vat - (expense_with_vat / (1 + expense_vat_rate / 100))), 
        2
    ) as "Net MOMS owed 2025 → payable Jan 2026"
FROM vat_calculation_2025;

-- Show what we created for 2025
SELECT 'Test Invoice Items Created for 2025' as info, COUNT(*) as count
FROM invoice_items 
WHERE user_id = auth.uid() 
AND description LIKE 'Test Consulting 2025%'
AND EXTRACT(year FROM due_date) = 2025;

SELECT 'Test Expense Items Created for 2025' as info, COUNT(*) as count
FROM cash_flow_entries 
WHERE user_id = auth.uid() 
AND description LIKE 'Test % 2025%'
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025;