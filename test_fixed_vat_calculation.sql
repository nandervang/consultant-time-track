-- Test the Fixed VAT Calculation Logic
-- This should now properly include recurring instances and exclude budget templates

-- Show what expenses will now be included in VAT calculation
SELECT 
    'Expenses Included in VAT Calculation (FIXED)' as info,
    id,
    amount,
    description,
    category,
    date,
    CASE 
        WHEN is_budget_entry = true THEN '📝 Budget Template'
        WHEN is_recurring_instance = true THEN '🔁 Recurring Instance'
        ELSE '✏️ Manual Entry'
    END as entry_type,
    CASE 
        WHEN is_budget_entry = false OR is_recurring_instance = true THEN '✅ INCLUDED'
        ELSE '❌ EXCLUDED'
    END as vat_status,
    ROUND(amount - (amount / 1.25), 2) as vat_deductible
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
ORDER BY category, date;

-- New VAT calculation total
SELECT 
    'Fixed VAT Calculation for 2025' as result,
    COUNT(*) as expense_count,
    SUM(amount) as total_expenses_with_vat,
    ROUND(SUM(amount - (amount / 1.25)), 2) as total_vat_deductible,
    'This should be much higher now!' as note
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
AND (is_budget_entry = false OR is_recurring_instance = true);

-- Compare old vs new calculation
SELECT 
    'Comparison: Old vs New VAT Calculation' as comparison,
    
    -- Old method (all entries)
    (SELECT ROUND(SUM(amount - (amount / 1.25)), 2) 
     FROM cash_flow_entries 
     WHERE user_id = auth.uid() AND type = 'expense' AND EXTRACT(year FROM date) = 2025 
     AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
    ) as old_method_vat_deductible,
    
    -- New method (exclude budget templates)
    (SELECT ROUND(SUM(amount - (amount / 1.25)), 2) 
     FROM cash_flow_entries 
     WHERE user_id = auth.uid() AND type = 'expense' AND EXTRACT(year FROM date) = 2025 
     AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
     AND (is_budget_entry = false OR is_recurring_instance = true)
    ) as new_method_vat_deductible;

-- Show the corrected MOMS calculation
WITH corrected_vat_calc AS (
    SELECT 
        -- Income VAT from invoices
        COALESCE((
            SELECT SUM(total_amount) * 0.25
            FROM invoice_items 
            WHERE user_id = auth.uid() 
            AND EXTRACT(year FROM due_date) = 2025
            AND status = 'sent'
        ), 0) as income_vat,
        
        -- Expense VAT (corrected)
        COALESCE((
            SELECT SUM(amount - (amount / 1.25))
            FROM cash_flow_entries 
            WHERE user_id = auth.uid() 
            AND type = 'expense'
            AND EXTRACT(year FROM date) = 2025
            AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
            AND (is_budget_entry = false OR is_recurring_instance = true)
        ), 0) as expense_vat
)
SELECT 
    '=== CORRECTED MOMS CALCULATION FOR 2025 ===' as result,
    ROUND(income_vat, 2) as income_vat,
    ROUND(expense_vat, 2) as expense_vat_deductible,
    ROUND(income_vat - expense_vat, 2) as net_moms_owed_corrected,
    'This should match what you expect!' as note
FROM corrected_vat_calc;