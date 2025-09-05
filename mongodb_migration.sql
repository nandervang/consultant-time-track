-- MongoDB Support Migration for Supabase
-- Copy and paste this entire script into your Supabase SQL Editor

-- Add type column to distinguish between HTTP and MongoDB targets
ALTER TABLE ping_targets 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'http' 
CHECK (type IN ('http', 'mongodb'));

-- Add MongoDB configuration as JSONB
ALTER TABLE ping_targets 
ADD COLUMN IF NOT EXISTS mongodb_config JSONB;

-- Create index for type column for better performance
CREATE INDEX IF NOT EXISTS idx_ping_targets_type ON ping_targets(type);

-- Update existing records to have type 'http'
UPDATE ping_targets SET type = 'http' WHERE type IS NULL;

-- Add comments explaining the mongodb_config structure
COMMENT ON COLUMN ping_targets.mongodb_config IS 'MongoDB configuration: {database: string, collection: string, operation: "ping"|"count"|"find", query: string}';

-- Show success message
SELECT 'MongoDB support added successfully! You can now monitor MongoDB databases.' as message;

-- Show current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'ping_targets' 
ORDER BY ordinal_position;
