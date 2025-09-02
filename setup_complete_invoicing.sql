-- Setup complete invoicing functionality
-- Run this in your Supabase SQL Editor

-- First, update the projects table to include client_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'client_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Also add other missing columns to projects table
DO $$
BEGIN
    -- Add description column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE projects ADD COLUMN description TEXT;
    END IF;
    
    -- Add status column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE projects ADD COLUMN status TEXT CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')) DEFAULT 'active';
    END IF;
    
    -- Add start_date column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE projects ADD COLUMN start_date DATE;
    END IF;
    
    -- Add end_date column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'end_date'
    ) THEN
        ALTER TABLE projects ADD COLUMN end_date DATE;
    END IF;
    
    -- Add budget column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'budget'
    ) THEN
        ALTER TABLE projects ADD COLUMN budget DECIMAL(10,2);
    END IF;
    
    -- Add hourly_rate column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'hourly_rate'
    ) THEN
        ALTER TABLE projects ADD COLUMN hourly_rate DECIMAL(10,2);
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE projects ADD COLUMN updated_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create invoice_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0, -- hours or units
  rate DECIMAL(10,2) NOT NULL DEFAULT 0, -- hourly rate or fixed price
  amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- quantity * rate
  type VARCHAR(10) NOT NULL DEFAULT 'hourly' CHECK (type IN ('hourly', 'fixed')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
  invoice_number VARCHAR(100), -- reference to invoice number when invoiced
  time_entry_ids UUID[], -- array of time entry IDs if created from time tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance on invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_user_id ON invoice_items(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_client_id ON invoice_items(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_project_id ON invoice_items(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_status ON invoice_items(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_date ON invoice_items(date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_created_at ON invoice_items(created_at);

-- Enable RLS on invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for invoice_items
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view their own invoice items" ON invoice_items;
    DROP POLICY IF EXISTS "Users can insert their own invoice items" ON invoice_items;
    DROP POLICY IF EXISTS "Users can update their own invoice items" ON invoice_items;
    DROP POLICY IF EXISTS "Users can delete their own invoice items" ON invoice_items;
    
    -- Create new policies
    CREATE POLICY "Users can view their own invoice items" ON invoice_items
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own invoice items" ON invoice_items
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own invoice items" ON invoice_items
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own invoice items" ON invoice_items
      FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Add trigger to update updated_at timestamp for invoice_items
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_invoice_items_updated_at
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add function to automatically calculate amount for invoice_items
CREATE OR REPLACE FUNCTION calculate_invoice_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount = NEW.quantity * NEW.rate;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS calculate_invoice_item_amount_trigger
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_item_amount();

-- Function to create sample data for the current user
CREATE OR REPLACE FUNCTION create_sample_data_for_user()
RETURNS void AS $$
DECLARE
    current_user_id UUID := auth.uid();
    client1_id UUID;
    client2_id UUID;
    client3_id UUID;
    project1_id UUID;
    project2_id UUID;
    project3_id UUID;
BEGIN
    -- Only create sample data if user has no clients yet
    IF NOT EXISTS (SELECT 1 FROM clients WHERE user_id = current_user_id) THEN
        
        -- Create sample clients
        INSERT INTO clients (user_id, name, email, company, hourly_rate, currency, status) VALUES
        (current_user_id, 'TechCorp AB', 'contact@techcorp.se', 'TechCorp AB', 1200, 'SEK', 'active') RETURNING id INTO client1_id;
        
        INSERT INTO clients (user_id, name, email, company, hourly_rate, currency, status) VALUES
        (current_user_id, 'StartupXYZ', 'hello@startupxyz.com', 'StartupXYZ Inc', 1000, 'SEK', 'active') RETURNING id INTO client2_id;
        
        INSERT INTO clients (user_id, name, email, company, hourly_rate, currency, status) VALUES
        (current_user_id, 'BigCorp Inc', 'procurement@bigcorp.com', 'BigCorp International', 1500, 'SEK', 'active') RETURNING id INTO client3_id;
        
        -- Create sample projects
        INSERT INTO projects (user_id, name, color, client_id, description, status, hourly_rate) VALUES
        (current_user_id, 'Web Development', '#3B82F6', client1_id, 'Modern web application development', 'active', 1200) RETURNING id INTO project1_id;
        
        INSERT INTO projects (user_id, name, color, client_id, description, status, hourly_rate) VALUES
        (current_user_id, 'Consulting', '#10B981', client2_id, 'Strategic technology consulting', 'active', 1000) RETURNING id INTO project2_id;
        
        INSERT INTO projects (user_id, name, color, client_id, description, status, hourly_rate) VALUES
        (current_user_id, 'System Analysis', '#F59E0B', client3_id, 'Enterprise system analysis and optimization', 'active', 1500) RETURNING id INTO project3_id;
        
        -- Create some sample time entries
        INSERT INTO time_entries (user_id, project_id, date, hours, comment) VALUES
        (current_user_id, project1_id, CURRENT_DATE - INTERVAL '2 days', 8.0, 'Frontend development work'),
        (current_user_id, project1_id, CURRENT_DATE - INTERVAL '1 day', 6.5, 'Backend API implementation'),
        (current_user_id, project2_id, CURRENT_DATE - INTERVAL '3 days', 4.0, 'Strategy meeting and planning'),
        (current_user_id, project3_id, CURRENT_DATE - INTERVAL '1 day', 5.5, 'System architecture review');
        
        -- Create some sample invoice items
        INSERT INTO invoice_items (user_id, client_id, project_id, description, quantity, rate, type, date, status) VALUES
        (current_user_id, client1_id, project1_id, 'Web Development - Phase 1', 40.0, 1200, 'hourly', CURRENT_DATE - INTERVAL '1 week', 'pending'),
        (current_user_id, client2_id, project2_id, 'Strategic Consulting Package', 1, 25000, 'fixed', CURRENT_DATE - INTERVAL '3 days', 'invoiced'),
        (current_user_id, client3_id, project3_id, 'System Analysis Report', 20.0, 1500, 'hourly', CURRENT_DATE - INTERVAL '5 days', 'paid');
        
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instructions for users:
-- To create sample data, run: SELECT create_sample_data_for_user();
