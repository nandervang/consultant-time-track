-- Test query to check if the user_profiles table has the necessary columns
-- Run this in your Supabase SQL editor to verify the table structure

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
  AND column_name IN ('debit_rate_monthly', 'absence_percentage')
ORDER BY column_name;

-- If the columns don't exist, run this:
-- ALTER TABLE user_profiles 
-- ADD COLUMN IF NOT EXISTS debit_rate_monthly DECIMAL(5,2) DEFAULT 94.0,
-- ADD COLUMN IF NOT EXISTS absence_percentage DECIMAL(5,2) DEFAULT 15.0;
