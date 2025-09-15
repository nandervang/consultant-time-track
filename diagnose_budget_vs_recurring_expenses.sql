-- Diagnose Budget vs Recurring Expense Issue for VAT Calculation
-- This will show the difference between budget entries and their recurring instances

-- Show budget entries (original monthly budget items)
SELECT 
    'Budget Entries (Original)' as entry_type,
    id,
    amount,
    description,
    category,
    date,
    is_budget_entry,
    is_recurring,
    is_recurring_instance,
    ROUND(amount - (amount / 1.25), 2) as vat_deductible_portion
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
AND is_budget_entry = true
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
ORDER BY category, date;

-- Show recurring instances (generated from budget entries)
SELECT 
    'Recurring Instances (Generated from Budget)' as entry_type,
    id,
    amount,
    description,
    category,
    date,
    is_budget_entry,
    is_recurring,
    is_recurring_instance,
    ROUND(amount - (amount / 1.25), 2) as vat_deductible_portion
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
AND is_recurring_instance = true
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
ORDER BY category, date;

-- Show manual entries (neither budget nor recurring)
SELECT 
    'Manual Entries' as entry_type,
    id,
    amount,
    description,
    category,
    date,
    is_budget_entry,
    is_recurring,
    is_recurring_instance,
    ROUND(amount - (amount / 1.25), 2) as vat_deductible_portion
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
AND is_budget_entry = false
AND is_recurring_instance = false
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
ORDER BY category, date;

-- Summary by entry type
SELECT 
    'Summary by Entry Type' as analysis,
    CASE 
        WHEN is_budget_entry = true THEN 'Budget Entry'
        WHEN is_recurring_instance = true THEN 'Recurring Instance'
        ELSE 'Manual Entry'
    END as entry_type,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    ROUND(SUM(amount - (amount / 1.25)), 2) as total_vat_deductible
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
GROUP BY 
    CASE 
        WHEN is_budget_entry = true THEN 'Budget Entry'
        WHEN is_recurring_instance = true THEN 'Recurring Instance'
        ELSE 'Manual Entry'
    END
ORDER BY total_amount DESC;

-- Check what the current VAT query actually finds
SELECT 
    'Current VAT Query Results' as analysis,
    COUNT(*) as expense_count,
    SUM(amount) as total_expenses,
    ROUND(SUM(amount - (amount / 1.25)), 2) as vat_deductible,
    'This is what the VAT calculation currently sees' as note
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND date >= '2025-01-01'
AND date <= '2025-12-31'
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax');

-- Recommended: Include ALL actual expense instances (not the budget templates)
SELECT 
    'Recommended VAT Calculation (All Actual Expenses)' as analysis,
    COUNT(*) as expense_count,
    SUM(amount) as total_expenses,
    ROUND(SUM(amount - (amount / 1.25)), 2) as vat_deductible,
    'This should be used for VAT calculation' as note
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND date >= '2025-01-01'
AND date <= '2025-12-31'
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
-- Include both manual entries and recurring instances, but NOT budget templates
AND (is_budget_entry = false OR is_recurring_instance = true);