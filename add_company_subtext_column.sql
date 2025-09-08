-- Add company_subtext column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS company_subtext TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN user_profiles.company_subtext IS 'Company subtext or tagline for display purposes';
