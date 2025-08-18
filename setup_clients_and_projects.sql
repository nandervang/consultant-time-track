-- Combined script to set up clients and update projects tables
-- Run this in Supabase SQL Editor

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    hourly_rate DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'SEK',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    notes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('Europe/Stockholm', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('Europe/Stockholm', now())
);

-- 2. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('Europe/Stockholm', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Create trigger for clients table
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for clients
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
CREATE POLICY "Users can view own clients" ON public.clients
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
CREATE POLICY "Users can insert own clients" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
CREATE POLICY "Users can update own clients" ON public.clients
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
CREATE POLICY "Users can delete own clients" ON public.clients
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Update projects table structure
DO $$ 
BEGIN 
    -- Add client_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN description TEXT;
    END IF;

    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'start_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN start_date DATE;
    END IF;

    -- Add end_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'end_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN end_date DATE;
    END IF;

    -- Add budget column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'budget'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN budget DECIMAL(12,2);
    END IF;

    -- Add hourly_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'hourly_rate'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN hourly_rate DECIMAL(10,2);
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- 7. Update projects status constraint
-- Remove existing status constraint if it exists (ignore errors if it doesn't exist)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Add the new status constraint for projects
ALTER TABLE public.projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled'));

-- Update any existing projects with invalid status values (only if status column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        UPDATE public.projects 
        SET status = 'active' 
        WHERE status NOT IN ('planning', 'active', 'on-hold', 'completed', 'cancelled') 
           OR status IS NULL;
    END IF;
END $$;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id_status ON public.projects(user_id, status);

-- 9. Insert sample clients (optional - remove this section if you don't want sample data)
INSERT INTO public.clients (name, email, company, hourly_rate, status, user_id, notes) 
SELECT 
    'Acme Corporation',
    'contact@acme.se',
    'Acme Corp AB',
    1200.00,
    'active',
    auth.uid(),
    'Main client for web development projects'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.clients (name, email, company, hourly_rate, status, user_id, notes) 
SELECT 
    'Tech Solutions',
    'info@techsolutions.se',
    'Tech Solutions Sweden AB',
    1500.00,
    'active',
    auth.uid(),
    'Enterprise client for consulting services'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.clients (name, email, company, hourly_rate, status, user_id, notes) 
SELECT 
    'StartupXYZ',
    'hello@startupxyz.se',
    'StartupXYZ',
    800.00,
    'active',
    auth.uid(),
    'Startup client with flexible budget'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
