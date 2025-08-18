-- Temporary solution: Add current month settings to user_profiles
-- This can be used while we set up the monthly_settings table properly

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_month_billing_percentage DECIMAL(5,2) DEFAULT 94.0,
ADD COLUMN IF NOT EXISTS current_month_absence_percentage DECIMAL(5,2) DEFAULT 15.0,
ADD COLUMN IF NOT EXISTS current_month_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
ADD COLUMN IF NOT EXISTS current_month_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW());

-- Add comments
COMMENT ON COLUMN user_profiles.current_month_billing_percentage IS 'Current month billing percentage';
COMMENT ON COLUMN user_profiles.current_month_absence_percentage IS 'Current month absence percentage';
COMMENT ON COLUMN user_profiles.current_month_year IS 'Year for current month settings';
COMMENT ON COLUMN user_profiles.current_month_month IS 'Month for current month settings';
