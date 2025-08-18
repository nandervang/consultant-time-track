-- Create dashboard_layouts table for persisting widget arrangements
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own dashboard layouts
CREATE POLICY "Users can view own dashboard layouts" ON dashboard_layouts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own dashboard layouts
CREATE POLICY "Users can insert own dashboard layouts" ON dashboard_layouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own dashboard layouts
CREATE POLICY "Users can update own dashboard layouts" ON dashboard_layouts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own dashboard layouts
CREATE POLICY "Users can delete own dashboard layouts" ON dashboard_layouts
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_layouts_updated_at();
