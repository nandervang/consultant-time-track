-- Debug script to check employer tax functionality
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check if settings columns exist
SELECT 'Settings columns check' as check_type, 
       column_name, 
       data_type, 
       column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
AND column_name IN ('auto_generate_employer_tax', 'employer_tax_payment_date')
ORDER BY column_name;

-- 2. Check user settings (replace YOUR_USER_ID with your actual user ID from auth.users)
SELECT 'User settings' as check_type,
       id,
       auto_generate_employer_tax,
       employer_tax_payment_date,
       company_name
FROM user_profiles 
WHERE id = 'YOUR_USER_ID';  -- Replace this with your actual user ID

-- 3. Check salary payments for October 2024
SELECT 'October salary payments' as check_type,
       sp.id,
       sp.year,
       sp.month,
       sp.salary_amount,
       sp.total_amount,
       sp.status,
       sp.cash_flow_entry_id,
       sp.employer_tax_entry_id,
       se.name as employee_name
FROM salary_payments sp
JOIN salary_employees se ON sp.employee_id = se.id
WHERE sp.year = 2024 
AND sp.month = 10;

-- 4. Check ALL cash flow entries to see if employer tax entries exist
SELECT 'All cash flow entries' as check_type,
       id,
       type,
       amount,
       description,
       category,
       date,
       created_at
FROM cash_flow_entries 
WHERE user_id = 'YOUR_USER_ID'  -- Replace this with your actual user ID
ORDER BY created_at DESC
LIMIT 20;

-- 5. Look specifically for employer tax entries
SELECT 'Employer tax entries' as check_type,
       id,
       type,
       amount,
       description,
       category,
       date,
       created_at
FROM cash_flow_entries 
WHERE user_id = 'YOUR_USER_ID'  -- Replace this with your actual user ID
AND (category ILIKE '%tax%' OR description ILIKE '%tax%' OR description ILIKE '%employer%')
ORDER BY created_at DESC;