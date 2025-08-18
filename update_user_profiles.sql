-- Add time tracking settings to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS debit_rate_monthly DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS absence_percentage DECIMAL(5,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS work_hours_per_day DECIMAL(4,2) DEFAULT 8.0,
ADD COLUMN IF NOT EXISTS work_days_per_week INTEGER DEFAULT 5;

-- Add comment
COMMENT ON COLUMN user_profiles.debit_rate_monthly IS 'Monthly debit rate - percentage of work hours debited as billable each month (e.g. 94%)';
COMMENT ON COLUMN user_profiles.absence_percentage IS 'Expected absence percentage for calculations';
COMMENT ON COLUMN user_profiles.work_hours_per_day IS 'Standard working hours per day';
COMMENT ON COLUMN user_profiles.work_days_per_week IS 'Standard working days per week';
