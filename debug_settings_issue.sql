-- Debug settings saving and loading issues
-- Run this to understand what's happening

-- 1. Check if user_profiles exists and has correct structure
SELECT 
    'User Profiles Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Check if current user has a profile
SELECT 
    'Current User Profile' as info,
    user_id,
    company_name,
    auto_generate_employer_tax,
    employer_tax_payment_date,
    auto_generate_yearly_vat,
    vat_rate_income,
    vat_rate_expenses,
    created_at,
    updated_at
FROM user_profiles 
WHERE user_id = auth.uid();

-- 3. Check current user's cash flow entries for tax categories
SELECT 
    'Current Tax Entries in Cash Flow' as info,
    category,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM cash_flow_entries 
WHERE user_id = auth.uid()
AND category IN ('MOMS Tax', 'Employer Tax')
GROUP BY category
ORDER BY category;

-- 4. Get current user ID for debugging
SELECT 
    'Current User Info' as info,
    auth.uid() as user_id,
    auth.email() as email;