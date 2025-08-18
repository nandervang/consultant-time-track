-- Manual table creation script for consultant time tracking functionality
-- Run this SQL directly in your Supabase SQL editor

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_motto TEXT DEFAULT 'Building the future, one project at a time.',
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Europe/Stockholm',
  currency TEXT DEFAULT 'SEK',
  hourly_rate DECIMAL(10,2),
  debit_rate_monthly DECIMAL(5,2) DEFAULT 94.0 CHECK (debit_rate_monthly >= 0 AND debit_rate_monthly <= 100),
  absence_percentage DECIMAL(5,2) DEFAULT 15.0 CHECK (absence_percentage >= 0 AND absence_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "consultant_users_can_view_own_profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "consultant_users_can_insert_own_profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "consultant_users_can_update_own_profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create cash_flow_entries table
CREATE TABLE IF NOT EXISTS public.cash_flow_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT CHECK (recurring_interval IN ('weekly', 'monthly', 'yearly')) NULL,
  next_due_date DATE NULL,
  project_id UUID NULL,
  client_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on cash_flow_entries
ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "consultant_users_can_view_own_cash_flow_entries" ON public.cash_flow_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "consultant_users_can_insert_own_cash_flow_entries" ON public.cash_flow_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "consultant_users_can_update_own_cash_flow_entries" ON public.cash_flow_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "consultant_users_can_delete_own_cash_flow_entries" ON public.cash_flow_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_user_id ON public.cash_flow_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_date ON public.cash_flow_entries(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_type ON public.cash_flow_entries(type);

-- Create dashboard_widgets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  title TEXT NOT NULL,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 1,
  config JSONB DEFAULT '{}',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on dashboard_widgets
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dashboard_widgets
CREATE POLICY "consultant_users_can_view_own_widgets" ON public.dashboard_widgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "consultant_users_can_insert_own_widgets" ON public.dashboard_widgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "consultant_users_can_update_own_widgets" ON public.dashboard_widgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "consultant_users_can_delete_own_widgets" ON public.dashboard_widgets
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for dashboard_widgets
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON public.dashboard_widgets(user_id);

-- Create monthly_settings table for month-specific billing and absence settings
CREATE TABLE IF NOT EXISTS public.monthly_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  billing_percentage DECIMAL(5,2) DEFAULT 94.0 CHECK (billing_percentage >= 0 AND billing_percentage <= 100),
  absence_percentage DECIMAL(5,2) DEFAULT 15.0 CHECK (absence_percentage >= 0 AND absence_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one row per user per month
  UNIQUE(user_id, year, month)
);

-- Enable RLS on monthly_settings
ALTER TABLE public.monthly_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monthly_settings
CREATE POLICY "consultant_users_can_view_own_monthly_settings" ON public.monthly_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "consultant_users_can_insert_own_monthly_settings" ON public.monthly_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "consultant_users_can_update_own_monthly_settings" ON public.monthly_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "consultant_users_can_delete_own_monthly_settings" ON public.monthly_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for monthly_settings
CREATE INDEX IF NOT EXISTS idx_monthly_settings_user_date ON public.monthly_settings(user_id, year, month);

-- Add comments
COMMENT ON COLUMN public.user_profiles.debit_rate_monthly IS 'Billing percentage - percentage of work hours that are actually billable';
COMMENT ON COLUMN public.user_profiles.absence_percentage IS 'Expected absence percentage for calculations';
COMMENT ON TABLE public.monthly_settings IS 'Monthly-specific billing and absence settings for users';
COMMENT ON COLUMN public.monthly_settings.billing_percentage IS 'Percentage of work hours that are billable for this month';
COMMENT ON COLUMN public.monthly_settings.absence_percentage IS 'Expected absence percentage for this month';
