-- Debug Expense VAT Calculation for 2025
-- This will show exactly which expenses are being included in the VAT calculation

-- Show all expenses for 2025 that should be included in VAT calculation
SELECT 
    'All 2025 Expenses for VAT Calculation' as info,
    id,
    amount,
    description,
    category,
    date,
    -- Calculate VAT portion for each expense (assuming 25% VAT)
    ROUND(amount - (amount / 1.25), 2) as vat_portion_25_percent,
    -- Show what's excluded
    CASE 
        WHEN category IN ('Salary', 'Employer Tax', 'MOMS Tax') THEN 'EXCLUDED (Tax Category)'
        ELSE 'INCLUDED in VAT calculation'
    END as vat_status
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
ORDER BY date;

-- Summary of expenses by category
SELECT 
    'Expense Summary by Category (2025)' as info,
    category,
    COUNT(*) as expense_count,
    SUM(amount) as total_amount,
    ROUND(SUM(amount - (amount / 1.25)), 2) as total_vat_deductible,
    CASE 
        WHEN category IN ('Salary', 'Employer Tax', 'MOMS Tax') THEN 'EXCLUDED'
        ELSE 'INCLUDED'
    END as vat_calculation_status
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
GROUP BY category
ORDER BY total_amount DESC;

-- Total VAT calculation check
WITH expense_vat_calc AS (
    SELECT 
        SUM(amount) as total_expenses_including_vat,
        -- VAT deductible calculation: amount - (amount / 1.25)
        ROUND(SUM(amount - (amount / 1.25)), 2) as total_vat_deductible
    FROM cash_flow_entries 
    WHERE user_id = auth.uid()
    AND type = 'expense'
    AND EXTRACT(year FROM date) = 2025
    AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
)
SELECT 
    'VAT Calculation Check for 2025' as info,
    total_expenses_including_vat as "Total Expenses (including VAT)",
    total_vat_deductible as "VAT Deductible (should match MOMS entry)",
    -- Alternative calculation method for verification
    ROUND(total_expenses_including_vat * 0.2, 2) as "Alternative: 20% of total (25%/(100%+25%))"
FROM expense_vat_calc;

-- Check if there are expenses in other categories that might be missed
SELECT 
    'Expense Categories in 2025' as info,
    category,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
GROUP BY category
ORDER BY total_amount DESC;

-- Show current VAT settings
SELECT 
    'Current VAT Settings' as info,
    vat_rate_expense,
    auto_generate_yearly_vat
FROM user_profiles 
WHERE id = auth.uid();