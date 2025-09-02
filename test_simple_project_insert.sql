-- Test if we can insert a simple project
-- Run this in your Supabase SQL Editor

-- First, let's see the current projects table structure
SELECT 'Projects table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Check any constraints on the projects table
SELECT 'Table constraints:' as info;
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'projects'
ORDER BY tc.constraint_type, kcu.column_name;

-- Test a simple insert (you can modify the user_id to match yours)
-- First get your user ID
SELECT 'Your user ID:' as info;
SELECT auth.uid() as your_user_id;

-- Now test inserting a simple project
-- Replace the user_id below with your actual user ID from above
INSERT INTO projects (user_id, name, color)
VALUES (
    COALESCE(auth.uid(), '51768f62-2bfd-4825-9835-fd86739f8600'), 
    'Test Project Simple', 
    '#FF0000'
)
RETURNING *;
