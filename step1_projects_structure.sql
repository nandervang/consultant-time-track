-- Step 1: Check projects table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;
