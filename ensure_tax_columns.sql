-- Check if user_profiles table has the required tax columns
-- If not, we need to add them

-- First check existing columns
\d user_profiles;

-- Add missing columns if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS auto_generate_employer_tax BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS employer_tax_payment_date INTEGER DEFAULT 12;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS auto_generate_yearly_vat BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS vat_rate_income NUMERIC DEFAULT 25;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS vat_rate_expenses NUMERIC DEFAULT 25;

-- Check the updated schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('auto_generate_employer_tax', 'employer_tax_payment_date', 'auto_generate_yearly_vat', 'vat_rate_income', 'vat_rate_expenses')
ORDER BY column_name;