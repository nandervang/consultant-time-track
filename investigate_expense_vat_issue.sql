-- Investigation: Are we missing expenses due to category filtering?
-- This will help identify if the VAT calculation is excluding legitimate business expenses

-- First, let's see ALL expense categories in 2025
SELECT 
    'All Expense Categories in 2025' as analysis,
    category,
    COUNT(*) as expense_count,
    SUM(amount) as total_amount,
    ROUND(SUM(amount - (amount / 1.25)), 2) as vat_deductible_if_included,
    -- Show which ones are currently excluded
    CASE 
        WHEN category IN ('Salary', 'Employer Tax', 'MOMS Tax') THEN '❌ EXCLUDED'
        ELSE '✅ INCLUDED'
    END as current_vat_status
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
GROUP BY category
ORDER BY total_amount DESC;

-- Check if there are expenses with NULL category or unexpected categories
SELECT 
    'Expenses with NULL or unusual categories' as analysis,
    COALESCE(category, 'NULL_CATEGORY') as category,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    array_agg(DISTINCT description) as sample_descriptions
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
AND (category IS NULL OR category NOT IN (
    'IT Services', 'Office Supplies', 'Software License', 'Consulting',
    'Equipment', 'Travel', 'Marketing', 'Professional Services',
    'Salary', 'Employer Tax', 'MOMS Tax'
))
GROUP BY category
ORDER BY total_amount DESC;

-- Test the exact same query that the code uses
SELECT 
    'Expenses INCLUDED by code query' as analysis,
    category,
    amount,
    description,
    date
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND date >= '2025-01-01'
AND date <= '2025-12-31'
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
ORDER BY amount DESC;

-- Total that should be included in VAT calculation
SELECT 
    'Total VAT Deductible (matching code logic)' as analysis,
    COUNT(*) as expense_count,
    SUM(amount) as total_expenses_with_vat,
    ROUND(SUM(amount - (amount / 1.25)), 2) as total_vat_deductible
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND date >= '2025-01-01'
AND date <= '2025-12-31'
AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax');

-- Compare with actual MOMS Tax entry
SELECT 
    'Actual MOMS Tax Entry for 2025' as analysis,
    description,
    amount as moms_tax_owed,
    -- Try to extract the expense VAT from description
    CASE 
        WHEN description ~ 'Expense VAT: ([0-9.]+)' THEN 
            (regexp_match(description, 'Expense VAT: ([0-9.]+)'))[1]::numeric
        ELSE NULL
    END as expense_vat_in_description
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND category = 'MOMS Tax'
AND description LIKE '%2025%';