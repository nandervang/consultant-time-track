-- Add MongoDB monitoring support to existing ping_targets table
-- Run this in Supabase SQL Editor

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

SELECT 'MongoDB support added successfully!' as message;
