-- ============================================
-- Daily Focus Table Migration
-- Purpose: Store daily focus and goals for weekly planning
-- Run this in Supabase SQL Editor
-- ============================================

-- Create the daily_focus table
CREATE TABLE IF NOT EXISTS public.daily_focus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  focus TEXT CHECK (char_length(focus) <= 500),
  goals TEXT CHECK (char_length(goals) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_focus_user_date_key UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_focus_user_date ON public.daily_focus(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.daily_focus ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view their own daily focus" ON public.daily_focus;
DROP POLICY IF EXISTS "Users can insert their own daily focus" ON public.daily_focus;
DROP POLICY IF EXISTS "Users can update their own daily focus" ON public.daily_focus;
DROP POLICY IF EXISTS "Users can delete their own daily focus" ON public.daily_focus;

-- Create RLS policies
CREATE POLICY "Users can view their own daily focus"
  ON public.daily_focus FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily focus"
  ON public.daily_focus FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily focus"
  ON public.daily_focus FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily focus"
  ON public.daily_focus FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_daily_focus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_daily_focus_updated_at ON public.daily_focus;
CREATE TRIGGER set_daily_focus_updated_at
  BEFORE UPDATE ON public.daily_focus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_focus_updated_at();

-- Grant permissions to authenticated users
GRANT ALL ON public.daily_focus TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
