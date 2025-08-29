-- Detailed diagnostic to find why projects aren't saving to clients
-- Run this in your Supabase SQL Editor

-- 1. Check what's currently in your database
SELECT 'Step 1: Current database contents' as step;

-- Check all columns in projects table
SELECT 'Projects table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 2. Check current users
SELECT 'Step 2: Available users' as step;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check existing clients
SELECT 'Step 3: Existing clients' as step;
SELECT 
  id, 
  name, 
  company, 
  user_id,
  created_at,
  email
FROM clients 
ORDER BY created_at DESC;

-- 4. Check existing projects with details
SELECT 'Step 4: Existing projects with client relationships' as step;
SELECT 
  p.id,
  p.name as project_name,
  p.color,
  p.client_id,
  p.status,
  p.description,
  p.user_id,
  p.created_at,
  c.name as client_name,
  c.company as client_company
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
ORDER BY p.created_at DESC;

-- 5. Check for orphaned projects (projects without valid client_id)
SELECT 'Step 5: Projects missing client relationships' as step;
SELECT 
  p.id,
  p.name,
  p.client_id,
  p.user_id,
  CASE 
    WHEN p.client_id IS NULL THEN 'No client assigned'
    WHEN c.id IS NULL THEN 'Invalid client_id (orphaned)'
    ELSE 'Valid relationship'
  END as relationship_status
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
ORDER BY p.created_at DESC;

-- 6. Test data integrity
SELECT 'Step 6: Data integrity check' as step;
SELECT 
  'Summary' as check_type,
  COUNT(*) as total_projects,
  COUNT(p.client_id) as projects_with_client_id,
  COUNT(c.id) as projects_with_valid_clients,
  COUNT(*) - COUNT(p.client_id) as projects_without_client,
  COUNT(p.client_id) - COUNT(c.id) as orphaned_projects
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id;

-- 7. Check RLS policies
SELECT 'Step 7: RLS Policies check' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'clients')
ORDER BY tablename, policyname;
