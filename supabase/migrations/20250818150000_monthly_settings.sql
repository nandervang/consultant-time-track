-- Create monthly settings table for tracking billing rates and absence per month
CREATE TABLE monthly_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  billing_percentage DECIMAL(5,2) DEFAULT 94.0,
  absence_percentage DECIMAL(5,2) DEFAULT 15.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one row per user per month
  UNIQUE(user_id, year, month)
);

-- Create index for faster lookups
CREATE INDEX idx_monthly_settings_user_date ON monthly_settings(user_id, year, month);

-- Add RLS policies
ALTER TABLE monthly_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly settings" ON monthly_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly settings" ON monthly_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly settings" ON monthly_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly settings" ON monthly_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE monthly_settings IS 'Monthly-specific billing and absence settings for users';
COMMENT ON COLUMN monthly_settings.billing_percentage IS 'Percentage of work hours that are billable for this month';
COMMENT ON COLUMN monthly_settings.absence_percentage IS 'Expected absence percentage for this month';
