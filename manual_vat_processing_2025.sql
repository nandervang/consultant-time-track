-- Manual VAT Processing for 2025
-- Run this script to manually create MOMS tax entry for 2025 (payable in January 2026)
-- This should be automatic when you enable VAT settings, but you can run this manually if needed

DO $$
DECLARE
    user_record RECORD;
    invoice_record RECORD;
    expense_record RECORD;
    income_total DECIMAL(10,2) := 0;
    income_vat_total DECIMAL(10,2) := 0;
    expense_total DECIMAL(10,2) := 0;
    expense_vat_total DECIMAL(10,2) := 0;
    net_vat_owed DECIMAL(10,2) := 0;
    payment_date DATE;
    existing_entry_id UUID;
BEGIN
    -- Get current user and VAT settings
    SELECT 
        id,
        auto_generate_yearly_vat,
        vat_rate_income,
        vat_rate_expense,
        vat_payment_month,
        vat_payment_day
    INTO user_record
    FROM user_profiles 
    WHERE id = auth.uid();
    
    IF NOT user_record.auto_generate_yearly_vat THEN
        RAISE NOTICE 'VAT auto-generation is disabled for user. Enable it in Settings → Skatt tab.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Processing VAT for 2025 (payment in 2026) for user % with rates: Income %%, Expense %%', 
        user_record.id, user_record.vat_rate_income, user_record.vat_rate_expense;
    
    -- Calculate income VAT from invoices for 2025 (invoices are created WITHOUT VAT)
    FOR invoice_record IN 
        SELECT total_amount, description, due_date
        FROM invoice_items 
        WHERE user_id = user_record.id
        AND EXTRACT(year FROM due_date) = 2025
        AND status = 'sent'
    LOOP
        income_total := income_total + invoice_record.total_amount;
        RAISE NOTICE 'Invoice: % - Amount: %, Due: %', 
            invoice_record.description, invoice_record.total_amount, invoice_record.due_date;
    END LOOP;
    
    -- Calculate income VAT (25% of invoice amounts)
    income_vat_total := income_total * (user_record.vat_rate_income / 100);
    
    -- Calculate expense VAT deductible from expenses for 2025 (expenses INCLUDE VAT)
    -- Include both manual entries and recurring instances, but exclude budget templates
    FOR expense_record IN 
        SELECT amount, description, date, category
        FROM cash_flow_entries 
        WHERE user_id = user_record.id
        AND type = 'expense'
        AND EXTRACT(year FROM date) = 2025
        AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
        AND (is_budget_entry = false OR is_recurring_instance = true) -- Exclude budget templates, include actual expenses
    LOOP
        expense_total := expense_total + expense_record.amount;
        RAISE NOTICE 'Expense: % - Amount: %, Date: %, Category: %', 
            expense_record.description, expense_record.amount, expense_record.date, expense_record.category;
    END LOOP;
    
    -- Calculate VAT portion of expenses (VAT = total - (total / 1.25))
    expense_vat_total := expense_total - (expense_total / (1 + user_record.vat_rate_expense / 100));
    
    -- Calculate net VAT owed
    net_vat_owed := income_vat_total - expense_vat_total;
    
    RAISE NOTICE '=== VAT CALCULATION SUMMARY FOR 2025 ===';
    RAISE NOTICE 'Total Income (excluding VAT): %', income_total;
    RAISE NOTICE 'Income VAT owed (%%): %', user_record.vat_rate_income, income_vat_total;
    RAISE NOTICE 'Total Expenses (including VAT): %', expense_total;
    RAISE NOTICE 'Expense VAT deductible (%%): %', user_record.vat_rate_expense, expense_vat_total;
    RAISE NOTICE 'Net MOMS owed: %', net_vat_owed;
    
    -- Only create entry if VAT is owed
    IF net_vat_owed <= 0 THEN
        RAISE NOTICE 'No VAT owed for 2025. No entry will be created.';
        RETURN;
    END IF;
    
    -- Check if entry already exists
    SELECT id INTO existing_entry_id
    FROM cash_flow_entries 
    WHERE user_id = user_record.id
    AND category = 'MOMS Tax'
    AND description LIKE '%2025%'
    LIMIT 1;
    
    IF existing_entry_id IS NOT NULL THEN
        RAISE NOTICE 'MOMS tax entry already exists for 2025: %', existing_entry_id;
        RETURN;
    END IF;
    
    -- Calculate payment date (default: February 12, 2026)
    payment_date := MAKE_DATE(
        2026, 
        COALESCE(user_record.vat_payment_month, 2),
        LEAST(COALESCE(user_record.vat_payment_day, 12), 28)
    );
    
    -- Create the MOMS tax entry
    INSERT INTO cash_flow_entries (
        user_id,
        type,
        amount,
        description,
        category,
        date,
        is_recurring,
        is_budget_entry,
        is_recurring_instance,
        vat_amount,
        amount_excluding_vat,
        vat_rate
    ) VALUES (
        user_record.id,
        'expense',
        net_vat_owed,
        'MOMS Tax 2025 (Income VAT: ' || income_vat_total || ' - Expense VAT: ' || expense_vat_total || ')',
        'MOMS Tax',
        payment_date,
        false,
        false,
        false,
        0, -- This is the payment, not a VAT-inclusive transaction
        net_vat_owed,
        0
    ) RETURNING id INTO existing_entry_id;
    
    RAISE NOTICE '✅ Created MOMS tax entry: % for amount % due on %', 
        existing_entry_id, net_vat_owed, payment_date;
        
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error processing VAT: %', SQLERRM;
END $$;

-- Show the results
SELECT 
    'MOMS Tax Entry for 2025' as result,
    id,
    amount,
    description,
    date as payment_date,
    created_at
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND category = 'MOMS Tax'
AND description LIKE '%2025%'
ORDER BY created_at DESC
LIMIT 1;

-- Also show any existing 2025 invoices and expenses for reference
SELECT 
    'Invoice Summary 2025' as info,
    COUNT(*) as invoice_count,
    SUM(total_amount) as total_income_excluding_vat,
    ROUND(SUM(total_amount) * 0.25, 2) as income_vat_25_percent
FROM invoice_items 
WHERE user_id = auth.uid()
AND EXTRACT(year FROM due_date) = 2025
AND status = 'sent';

SELECT 
    'Expense Summary 2025 (Actual Expenses Only)' as info,
    COUNT(*) as expense_count,
    SUM(amount) as total_expenses_including_vat,
    ROUND(SUM(amount) - (SUM(amount) / 1.25), 2) as expense_vat_deductible
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
AND (is_budget_entry = false OR is_recurring_instance = true); -- Only actual expenses