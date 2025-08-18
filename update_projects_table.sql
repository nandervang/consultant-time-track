-- Update projects table to match the TypeScript interface
-- Add missing columns and update status enum

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
END $$;

-- Update the status column to allow the correct values
-- First, remove the existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%status%'
        AND table_name = 'projects'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
    END IF;
END $$;

-- Add the new status constraint
ALTER TABLE public.projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled'));

-- Update any existing projects with old status values
UPDATE public.projects 
SET status = 'active' 
WHERE status NOT IN ('planning', 'active', 'on-hold', 'completed', 'cancelled');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id_status ON public.projects(user_id, status);
