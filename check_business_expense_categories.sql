-- Check what types of business expenses typically include VAT
-- These should all be included in the VAT deduction calculation

SELECT 
    'Common Business Expense Categories with VAT' as info,
    'These expense types typically include 25% Swedish VAT and should be deductible:' as explanation;

-- Show expenses that SHOULD be included (business expenses with VAT)
SELECT 
    'Business Expenses That Should Include VAT' as category_type,
    category,
    COUNT(*) as count,
    SUM(amount) as total_with_vat,
    ROUND(SUM(amount - (amount / 1.25)), 2) as vat_deductible,
    'Should be included in MOMS calculation' as note
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
-- These are typical business expenses that include VAT
AND category IN (
    'IT Services', 'Software License', 'Office Supplies', 'Equipment',
    'Professional Services', 'Consulting', 'Marketing', 'Travel',
    'Utilities', 'Rent', 'Insurance', 'Subscriptions', 'Tools',
    'Training', 'Books', 'Communication', 'Website', 'Hosting'
)
GROUP BY category
ORDER BY total_with_vat DESC;

-- Show expenses that should be EXCLUDED (personal/non-deductible)
SELECT 
    'Non-Business Expenses (Correctly Excluded)' as category_type,
    category,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    'Correctly excluded from VAT calculation' as note
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
-- These should be excluded from VAT calculation
AND category IN (
    'Salary', 'Employer Tax', 'MOMS Tax', 'Personal', 'Loan Payment',
    'Tax Payment', 'Dividend', 'Owners Withdrawal'
)
GROUP BY category
ORDER BY total_amount DESC;

-- Show ALL other expenses that might need categorization
SELECT 
    'Other Expenses (Check if these should include VAT)' as category_type,
    category,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    array_agg(DISTINCT description ORDER BY description) as sample_descriptions,
    'Review these - should they include VAT?' as note
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND type = 'expense'
AND EXTRACT(year FROM date) = 2025
-- Expenses not in the common categories above
AND category NOT IN (
    'IT Services', 'Software License', 'Office Supplies', 'Equipment',
    'Professional Services', 'Consulting', 'Marketing', 'Travel',
    'Utilities', 'Rent', 'Insurance', 'Subscriptions', 'Tools',
    'Training', 'Books', 'Communication', 'Website', 'Hosting',
    'Salary', 'Employer Tax', 'MOMS Tax', 'Personal', 'Loan Payment',
    'Tax Payment', 'Dividend', 'Owners Withdrawal'
)
GROUP BY category
ORDER BY total_amount DESC;

-- Final calculation check
SELECT 
    'VAT Calculation Summary' as summary,
    (SELECT SUM(amount) FROM cash_flow_entries 
     WHERE user_id = auth.uid() AND type = 'expense' 
     AND EXTRACT(year FROM date) = 2025 
     AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
    ) as total_business_expenses,
    ROUND((SELECT SUM(amount - (amount / 1.25)) FROM cash_flow_entries 
           WHERE user_id = auth.uid() AND type = 'expense' 
           AND EXTRACT(year FROM date) = 2025 
           AND category NOT IN ('Salary', 'Employer Tax', 'MOMS Tax')
          ), 2) as calculated_vat_deductible;