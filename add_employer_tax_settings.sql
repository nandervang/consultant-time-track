-- Add employer tax settings columns to user_profiles table
-- Run this SQL in your Supabase SQL editor to enable settings functionality

-- Add the missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS auto_generate_employer_tax BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS employer_tax_payment_date INTEGER DEFAULT 25 CHECK (employer_tax_payment_date >= 1 AND employer_tax_payment_date <= 31),
ADD COLUMN IF NOT EXISTS work_hours_per_day DECIMAL(4,2) DEFAULT 8.0 CHECK (work_hours_per_day > 0),
ADD COLUMN IF NOT EXISTS work_days_per_week INTEGER DEFAULT 5 CHECK (work_days_per_week >= 1 AND work_days_per_week <= 7);

-- Add comments for clarity
COMMENT ON COLUMN public.user_profiles.auto_generate_employer_tax IS 'Whether to automatically generate employer tax cash flow entries when salary payments are scheduled';
COMMENT ON COLUMN public.user_profiles.employer_tax_payment_date IS 'Day of the month when employer tax should be paid (1-31)';
COMMENT ON COLUMN public.user_profiles.work_hours_per_day IS 'Standard working hours per day';
COMMENT ON COLUMN public.user_profiles.work_days_per_week IS 'Number of working days per week';

-- Update the updated_at timestamp trigger if it exists
-- (This assumes you have a trigger that updates the updated_at column)
UPDATE public.user_profiles SET updated_at = NOW() WHERE updated_at IS NOT NULL;

-- Verify the new columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
AND column_name IN ('auto_generate_employer_tax', 'employer_tax_payment_date', 'work_hours_per_day', 'work_days_per_week')
ORDER BY column_name;