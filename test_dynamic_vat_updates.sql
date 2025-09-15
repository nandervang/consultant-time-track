-- Test script to verify dynamic VAT recalculation
-- Run this to see current MOMS entries before testing

-- 1. Check current MOMS entries
SELECT 
    'Current MOMS Tax Entries' as status,
    id,
    description,
    amount,
    date,
    created_at
FROM cash_flow_entries 
WHERE category = 'MOMS Tax'
ORDER BY created_at DESC;

-- 2. Check current VAT settings
SELECT 
    'Current VAT Settings' as status,
    auto_generate_yearly_vat,
    vat_rate_income,
    vat_rate_expenses
FROM user_profiles 
WHERE user_id = auth.uid();

-- 3. Summary of test steps:
SELECT 
    'Test Steps for Dynamic VAT Updates' as info,
    '1. Enable VAT in Settings (Skatt tab) - should create MOMS entries' as step1,
    '2. Add a new invoice - MOMS entry should update automatically' as step2,
    '3. Add a new expense - MOMS entry should update automatically' as step3,
    '4. Check that totals reflect the new income/expense amounts' as step4,
    '5. Disable VAT in Settings - should remove all MOMS entries' as step5;

-- 4. Current year income and expense totals for reference
SELECT 
    'Current Totals for 2025' as info,
    (SELECT SUM(amount) FROM cash_flow_entries 
     WHERE type = 'income' AND EXTRACT(year FROM date) = 2025 AND user_id = auth.uid()
    ) as total_income_2025,
    (SELECT SUM(amount) FROM cash_flow_entries 
     WHERE type = 'expense' AND EXTRACT(year FROM date) = 2025 AND user_id = auth.uid()
     AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
    ) as total_business_expenses_2025;