-- Update cv_versions table to support enhanced CV generation features

-- Add new columns to cv_versions table
ALTER TABLE cv_versions 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS data JSONB, -- The CV generation data
ADD COLUMN IF NOT EXISTS role_focus VARCHAR(255), -- Target role for this version
ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'en' CHECK (language IN ('en', 'sv')),
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrate existing data if needed
UPDATE cv_versions 
SET data = snapshot_data 
WHERE data IS NULL AND snapshot_data IS NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cv_versions_is_current ON cv_versions(cv_profile_id, is_current);
CREATE INDEX IF NOT EXISTS idx_cv_versions_version_number ON cv_versions(cv_profile_id, version_number);

-- Update trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_cv_versions_updated_at 
BEFORE UPDATE ON cv_versions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();