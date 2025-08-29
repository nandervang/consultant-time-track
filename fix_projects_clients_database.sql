-- Comprehensive database fix for projects-clients relationship
-- Run this step by step in your Supabase SQL Editor

-- STEP 1: Check current database state
SELECT '=== STEP 1: Database State Check ===' as step;

-- Check if tables exist
SELECT 
  'Tables status' as check_type,
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'clients') as clients_table_exists,
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'projects') as projects_table_exists,
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'invoice_items') as invoice_items_table_exists;

-- Check projects table structure
SELECT 'Projects table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- STEP 2: Add missing columns to projects table
SELECT '=== STEP 2: Adding Missing Columns ===' as step;

-- Add client_id column if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')) DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- STEP 3: Create invoice_items table if it doesn't exist
SELECT '=== STEP 3: Creating invoice_items table ===' as step;

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  hours DECIMAL(5,2),
  hourly_rate DECIMAL(10,2),
  fixed_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SEK',
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue')) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Users can manage own invoice items" ON invoice_items;
CREATE POLICY "Users can manage own invoice items"
  ON invoice_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- STEP 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_user_id ON invoice_items(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_client_id ON invoice_items(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_project_id ON invoice_items(project_id);

-- STEP 5: Get current user and create sample data
SELECT '=== STEP 4: Creating Sample Data ===' as step;

-- First, let's see what users we have
SELECT 'Available users:' as info;
SELECT id, email FROM auth.users LIMIT 5;

-- Create a function to safely get a user ID
CREATE OR REPLACE FUNCTION get_test_user_id() RETURNS UUID AS $$
BEGIN
  -- Try to get the authenticated user first
  IF auth.uid() IS NOT NULL THEN
    RETURN auth.uid();
  END IF;
  
  -- Otherwise get the first user from the database
  RETURN (SELECT id FROM auth.users LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create sample data using this function
DO $$
DECLARE
  test_user_id UUID;
  client1_id UUID;
  client2_id UUID;
  client3_id UUID;
BEGIN
  test_user_id := get_test_user_id();
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found in database. Please ensure you have users before running this script.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Creating sample data for user: %', test_user_id;
  
  -- Insert sample clients
  INSERT INTO clients (user_id, name, email, company, hourly_rate, status)
  VALUES 
    (test_user_id, 'Acme Corp', 'contact@acme.com', 'Acme Corporation', 1200.00, 'active'),
    (test_user_id, 'TechStart Inc', 'hello@techstart.com', 'TechStart Incorporated', 1500.00, 'active'),
    (test_user_id, 'Local Business', 'info@localbiz.com', 'Local Business Solutions', 900.00, 'active')
  ON CONFLICT (user_id, name) DO UPDATE SET
    email = EXCLUDED.email,
    company = EXCLUDED.company,
    hourly_rate = EXCLUDED.hourly_rate,
    status = EXCLUDED.status
  RETURNING id INTO client1_id;
  
  -- Get the client IDs
  SELECT id INTO client1_id FROM clients WHERE user_id = test_user_id AND name = 'Acme Corp';
  SELECT id INTO client2_id FROM clients WHERE user_id = test_user_id AND name = 'TechStart Inc';
  SELECT id INTO client3_id FROM clients WHERE user_id = test_user_id AND name = 'Local Business';
  
  -- Insert sample projects with client relationships
  INSERT INTO projects (user_id, name, color, client_id, description, status, hourly_rate)
  VALUES 
    (test_user_id, 'Website Redesign', '#3B82F6', client1_id, 'Complete website redesign with modern UI/UX', 'active', 1200.00),
    (test_user_id, 'Mobile App Development', '#10B981', client2_id, 'Native mobile app for iOS and Android', 'active', 1500.00),
    (test_user_id, 'Consulting Services', '#F59E0B', client3_id, 'Business strategy and technical consulting', 'active', 900.00)
  ON CONFLICT (user_id, name) DO UPDATE SET
    color = EXCLUDED.color,
    client_id = EXCLUDED.client_id,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    hourly_rate = EXCLUDED.hourly_rate;
    
  RAISE NOTICE 'Sample data created successfully!';
END;
$$;

-- STEP 6: Verify everything is working
SELECT '=== STEP 5: Verification ===' as step;

-- Show created clients
SELECT 'Created clients:' as info;
SELECT c.id, c.name, c.company, c.hourly_rate, c.user_id
FROM clients c
WHERE c.user_id = get_test_user_id()
ORDER BY c.name;

-- Show created projects with client relationships
SELECT 'Created projects with clients:' as info;
SELECT 
  p.id, 
  p.name as project_name, 
  c.name as client_name,
  p.hourly_rate,
  p.status,
  p.user_id
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.user_id = get_test_user_id()
ORDER BY p.name;

-- Check foreign key relationships
SELECT 'Foreign key check:' as info;
SELECT 
  COUNT(*) as total_projects,
  COUNT(p.client_id) as projects_with_clients,
  COUNT(c.id) as valid_client_relationships
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.user_id = get_test_user_id();

SELECT '=== Database setup complete! ===' as final_step;
