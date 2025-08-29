-- Check current database structure and data
-- Run this in your Supabase SQL Editor

-- 1. Check what columns exist in the projects table
SELECT 'Projects table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 2. Check what columns exist in the clients table
SELECT 'Clients table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- 3. Check current user ID
SELECT 'Current user:' as info;
SELECT auth.uid() as current_user_id;

-- 4. Check existing projects and their client relationships
SELECT 'Existing projects:' as info;
SELECT p.id, p.name, p.color, p.client_id, p.status, p.user_id, c.name as client_name
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. Check existing clients
SELECT 'Existing clients:' as info;
SELECT id, name, company, user_id
FROM clients
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if there are any foreign key constraints
SELECT 'Foreign key constraints:' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('projects', 'clients', 'invoice_items');
