-- Add support for MongoDB monitoring
-- Add type column to distinguish between HTTP and MongoDB targets
ALTER TABLE ping_targets 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'http' CHECK (type IN ('http', 'mongodb'));

-- Add MongoDB configuration as JSONB
ALTER TABLE ping_targets 
ADD COLUMN IF NOT EXISTS mongodb_config JSONB;

-- Create index for type column for better performance
CREATE INDEX IF NOT EXISTS idx_ping_targets_type ON ping_targets(type);

-- Update existing records to have type 'http'
UPDATE ping_targets SET type = 'http' WHERE type IS NULL;

-- Add comment explaining the mongodb_config structure
COMMENT ON COLUMN ping_targets.mongodb_config IS 'Configuration for MongoDB monitoring: {database: string, collection: string, operation: "ping"|"count"|"find", query: string}';
