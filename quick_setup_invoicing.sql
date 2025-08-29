-- Quick setup for testing invoice functionality
-- Run this in your Supabase SQL Editor after running the debug script

-- First, make sure the projects table has the client_id column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')) DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Create invoice_items table if it doesn't exist
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

-- Enable RLS for invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policy for invoice_items
CREATE POLICY "Users can manage own invoice items"
  ON invoice_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create a function to insert sample data for any user
CREATE OR REPLACE FUNCTION create_sample_data_for_user(target_user_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  user_uuid UUID;
  client_count INTEGER;
  project_count INTEGER;
BEGIN
  -- Use provided user_id or try to get current auth user
  user_uuid := COALESCE(target_user_id, auth.uid());
  
  -- If still null, get the first user from auth.users (for testing)
  IF user_uuid IS NULL THEN
    SELECT id INTO user_uuid FROM auth.users LIMIT 1;
  END IF;
  
  -- If we still don't have a user, return error
  IF user_uuid IS NULL THEN
    RETURN 'ERROR: No user found. Please provide a user_id or ensure you are authenticated.';
  END IF;

  -- Insert sample clients for the user
  INSERT INTO clients (user_id, name, email, company, hourly_rate, status)
  VALUES 
    (user_uuid, 'Acme Corp', 'contact@acme.com', 'Acme Corporation', 1200.00, 'active'),
    (user_uuid, 'TechStart Inc', 'hello@techstart.com', 'TechStart Incorporated', 1500.00, 'active'),
    (user_uuid, 'Local Business', 'info@localbiz.com', 'Local Business Solutions', 900.00, 'active')
  ON CONFLICT (user_id, name) DO NOTHING;
  
  GET DIAGNOSTICS client_count = ROW_COUNT;

  -- Insert sample projects using the clients we just created
  INSERT INTO projects (user_id, name, color, client_id, description, status, hourly_rate)
  SELECT 
    user_uuid,
    CASE 
      WHEN c.name = 'Acme Corp' THEN 'Website Redesign'
      WHEN c.name = 'TechStart Inc' THEN 'Mobile App Development'
      WHEN c.name = 'Local Business' THEN 'Consulting Services'
      ELSE 'General Project'
    END,
    CASE 
      WHEN c.name = 'Acme Corp' THEN '#3B82F6'
      WHEN c.name = 'TechStart Inc' THEN '#10B981'
      WHEN c.name = 'Local Business' THEN '#F59E0B'
      ELSE '#64748B'
    END,
    c.id,
    CASE 
      WHEN c.name = 'Acme Corp' THEN 'Complete website redesign with modern UI/UX'
      WHEN c.name = 'TechStart Inc' THEN 'Native mobile app for iOS and Android'
      WHEN c.name = 'Local Business' THEN 'Business strategy and technical consulting'
      ELSE 'General project work'
    END,
    'active',
    CASE 
      WHEN c.name = 'Acme Corp' THEN 1200.00
      WHEN c.name = 'TechStart Inc' THEN 1500.00
      WHEN c.name = 'Local Business' THEN 900.00
      ELSE 1000.00
    END
  FROM clients c 
  WHERE c.user_id = user_uuid
  ON CONFLICT (user_id, name) DO NOTHING;
  
  GET DIAGNOSTICS project_count = ROW_COUNT;

  RETURN FORMAT('SUCCESS: Created sample data for user %s. Added %s clients and %s projects.', 
                user_uuid, client_count, project_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraints to prevent duplicates
ALTER TABLE clients ADD CONSTRAINT IF NOT EXISTS clients_user_name_unique UNIQUE (user_id, name);
ALTER TABLE projects ADD CONSTRAINT IF NOT EXISTS projects_user_name_unique UNIQUE (user_id, name);

-- Call the function to create sample data
-- This will work whether you're authenticated or not
SELECT create_sample_data_for_user();

-- Alternative: If the above doesn't work, you can manually specify a user ID
-- First, find your user ID:
SELECT 'Your available users:' as info;
SELECT id, email FROM auth.users LIMIT 5;

-- Then you can call the function with a specific user ID like this:
-- SELECT create_sample_data_for_user('your-user-id-here');

-- Verify the data was created
SELECT 'Sample data creation completed!' as result;

-- Show what was created (this will work for any user)
SELECT 'All clients in database:' as info;
SELECT u.email as user_email, c.name, c.company, c.hourly_rate 
FROM clients c 
JOIN auth.users u ON c.user_id = u.id 
LIMIT 10;

SELECT 'All projects in database:' as info;
SELECT u.email as user_email, p.name as project_name, c.name as client_name, p.hourly_rate 
FROM projects p 
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN clients c ON p.client_id = c.id 
LIMIT 10;
