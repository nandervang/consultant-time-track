-- Check the status constraint on invoice_items table
-- Run this in your Supabase SQL Editor

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c 
JOIN pg_namespace n ON n.oid = c.connamespace 
WHERE conname LIKE '%status%' 
  AND conrelid = 'invoice_items'::regclass;

-- Also check what the current table structure looks like
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
  AND column_name = 'status';
