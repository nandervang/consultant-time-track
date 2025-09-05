-- Fix existing MongoDB targets
-- Run this in Supabase SQL Editor to update existing MongoDB targets

-- Update MongoDB targets that have mongodb URLs but wrong type
UPDATE ping_targets 
SET type = 'mongodb',
    mongodb_config = jsonb_build_object(
        'database', 'digitalidag',
        'collection', 'partners', 
        'operation', 'count',
        'query', ''
    )
WHERE url LIKE 'mongodb%' AND (type IS NULL OR type = 'http');

-- Show updated targets
SELECT id, name, url, type, mongodb_config 
FROM ping_targets 
WHERE url LIKE 'mongodb%';

SELECT 'MongoDB targets updated successfully!' as message;
