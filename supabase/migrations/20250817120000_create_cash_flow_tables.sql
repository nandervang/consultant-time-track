-- Create cash flow tables for consultant dashboard
-- This migration creates the essential tables for cash flow functionality

-- Create cash_flow_entries table
CREATE TABLE IF NOT EXISTS public.cash_flow_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
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

-- Create dashboard_widgets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
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

-- Create budgets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_limit DECIMAL(10,2) NOT NULL,
  period TEXT CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cash_flow_entries
DROP POLICY IF EXISTS "Users can view own cash flow entries" ON public.cash_flow_entries;
CREATE POLICY "Users can view own cash flow entries" ON public.cash_flow_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cash flow entries" ON public.cash_flow_entries;
CREATE POLICY "Users can insert own cash flow entries" ON public.cash_flow_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cash flow entries" ON public.cash_flow_entries;
CREATE POLICY "Users can update own cash flow entries" ON public.cash_flow_entries
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cash flow entries" ON public.cash_flow_entries;
CREATE POLICY "Users can delete own cash flow entries" ON public.cash_flow_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for dashboard_widgets
DROP POLICY IF EXISTS "Users can view own widgets" ON public.dashboard_widgets;
CREATE POLICY "Users can view own widgets" ON public.dashboard_widgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own widgets" ON public.dashboard_widgets;
CREATE POLICY "Users can insert own widgets" ON public.dashboard_widgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own widgets" ON public.dashboard_widgets;
CREATE POLICY "Users can update own widgets" ON public.dashboard_widgets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own widgets" ON public.dashboard_widgets;
CREATE POLICY "Users can delete own widgets" ON public.dashboard_widgets
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for budgets
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
CREATE POLICY "Users can insert own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_user_id ON public.cash_flow_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_date ON public.cash_flow_entries(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_type ON public.cash_flow_entries(type);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON public.dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
