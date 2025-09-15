-- Test script to verify employer tax columns exist
-- Run this in Supabase SQL Editor AFTER running the main add_employer_tax_settings.sql

-- Check if the columns exist
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
AND column_name IN ('auto_generate_employer_tax', 'employer_tax_payment_date')
ORDER BY column_name;

-- If the above query returns 0 rows, the columns don't exist
-- If it returns 2 rows, the columns exist and you can proceed to check settings