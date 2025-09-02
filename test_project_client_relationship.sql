-- Test script to debug project-client relationship issues
-- Run this step by step in your Supabase SQL Editor

-- Step 1: Get current user info
SELECT 'Step 1 - Current user info:' as step;
SELECT 
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'Not authenticated - use manual user ID'
    ELSE 'Authenticated'
  END as auth_status;

-- Step 2: Show existing clients for current user
SELECT 'Step 2 - Your clients:' as step;
SELECT id, name, company, status, user_id
FROM clients 
WHERE user_id = COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))
ORDER BY name;

-- Step 3: Show existing projects for current user
SELECT 'Step 3 - Your projects:' as step;
SELECT 
  p.id, 
  p.name, 
  p.client_id,
  c.name as client_name,
  p.status,
  p.user_id
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.user_id = COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))
ORDER BY p.name;

-- Step 4: Test inserting a project with client relationship
-- First, get a client ID to test with
WITH test_client AS (
  SELECT id, name FROM clients 
  WHERE user_id = COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))
  LIMIT 1
)
SELECT 'Step 4 - Test project creation:' as step;

-- This will show what data we'll use for testing
SELECT 
  'Will create test project with client:' as action,
  tc.id as client_id,
  tc.name as client_name,
  COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)) as user_id
FROM test_client tc;

-- Step 5: Actually insert a test project (uncomment if you want to test)
/*
WITH test_client AS (
  SELECT id, name FROM clients 
  WHERE user_id = COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))
  LIMIT 1
)
INSERT INTO projects (user_id, name, color, client_id, description, status)
SELECT 
  COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)),
  'Test Project - ' || tc.name,
  '#FF5722',
  tc.id,
  'Test project to verify client relationship works',
  'active'
FROM test_client tc
WHERE NOT EXISTS (
  SELECT 1 FROM projects 
  WHERE name = 'Test Project - ' || tc.name 
  AND user_id = COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))
);
*/

-- Step 6: Verify the relationship works
SELECT 'Step 6 - Verify relationships:' as step;
SELECT 
  p.name as project_name,
  c.name as client_name,
  p.client_id,
  p.user_id
FROM projects p
JOIN clients c ON p.client_id = c.id
WHERE p.user_id = COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))
ORDER BY p.created_at DESC;
