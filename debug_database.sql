-- Debug script to check database tables and data
-- Run this in your Supabase SQL Editor to diagnose the issue

-- Check if tables exist
SELECT 
  'clients' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'clients'
  ) as table_exists,
  COALESCE((
    SELECT count(*) 
    FROM clients 
    WHERE user_id = auth.uid()
  ), 0) as row_count;

-- Check projects table and its columns
SELECT 
  'projects' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'projects'
  ) as table_exists,
  EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'client_id'
  ) as has_client_id_column,
  COALESCE((
    SELECT count(*) 
    FROM projects 
    WHERE user_id = auth.uid()
  ), 0) as row_count;

-- Check invoice_items table
SELECT 
  'invoice_items' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'invoice_items'
  ) as table_exists,
  COALESCE((
    SELECT count(*) 
    FROM invoice_items 
    WHERE user_id = auth.uid()
  ), 0) as row_count;

-- Show current user ID for reference
SELECT auth.uid() as current_user_id;

-- If clients table exists, show sample data
SELECT 'Sample clients:' as info;
SELECT id, name, company FROM clients WHERE user_id = auth.uid() LIMIT 5;

-- If projects table exists, show sample data
SELECT 'Sample projects:' as info;
SELECT id, name, color, client_id FROM projects WHERE user_id = auth.uid() LIMIT 5;
