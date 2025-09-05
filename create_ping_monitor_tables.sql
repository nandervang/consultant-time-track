-- Create Ping Monitor Tables
-- Run this script in your Supabase SQL editor

-- Create ping_targets table
CREATE TABLE IF NOT EXISTS ping_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  method VARCHAR(10) DEFAULT 'GET',
  headers JSONB DEFAULT '{}',
  body TEXT,
  timeout INTEGER DEFAULT 10, -- seconds
  expected_status INTEGER[] DEFAULT ARRAY[200, 201, 202, 204],
  expected_text TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ping_results table
CREATE TABLE IF NOT EXISTS ping_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES ping_targets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time DECIMAL(10,2), -- milliseconds
  status VARCHAR(20) NOT NULL, -- 'success', 'failure', 'timeout'
  status_code INTEGER,
  response_text TEXT,
  response_size INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ping_settings table
CREATE TABLE IF NOT EXISTS ping_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interval_minutes INTEGER DEFAULT 5,
  timeout_seconds INTEGER DEFAULT 10,
  retries INTEGER DEFAULT 3,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ping_targets_user_id ON ping_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_ping_targets_enabled ON ping_targets(enabled);
CREATE INDEX IF NOT EXISTS idx_ping_results_target_id ON ping_results(target_id);
CREATE INDEX IF NOT EXISTS idx_ping_results_user_id ON ping_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ping_results_timestamp ON ping_results(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE ping_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ping_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ping_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Ping targets policies
CREATE POLICY "Users can view their own ping targets" ON ping_targets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own ping targets" ON ping_targets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ping targets" ON ping_targets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own ping targets" ON ping_targets
  FOR DELETE USING (user_id = auth.uid());

-- Ping results policies
CREATE POLICY "Users can view their own ping results" ON ping_results
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own ping results" ON ping_results
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own ping results" ON ping_results
  FOR DELETE USING (user_id = auth.uid());

-- Ping settings policies
CREATE POLICY "Users can view their own ping settings" ON ping_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own ping settings" ON ping_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ping settings" ON ping_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own ping settings" ON ping_settings
  FOR DELETE USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_ping_targets_updated_at
  BEFORE UPDATE ON ping_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ping_settings_updated_at
  BEFORE UPDATE ON ping_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON ping_targets TO authenticated;
GRANT ALL ON ping_results TO authenticated;
GRANT ALL ON ping_settings TO authenticated;

-- Create a view for uptime statistics
CREATE OR REPLACE VIEW ping_uptime_stats AS
SELECT 
  pt.id as target_id,
  pt.name as target_name,
  pt.url,
  pt.user_id,
  COUNT(pr.id) as total_checks,
  COUNT(CASE WHEN pr.status = 'success' THEN 1 END) as successful_checks,
  ROUND(
    (COUNT(CASE WHEN pr.status = 'success' THEN 1 END)::decimal / NULLIF(COUNT(pr.id), 0)) * 100, 
    2
  ) as uptime_percentage,
  AVG(CASE WHEN pr.status = 'success' THEN pr.response_time END) as avg_response_time,
  MAX(pr.timestamp) as last_check,
  (
    SELECT pr2.status 
    FROM ping_results pr2 
    WHERE pr2.target_id = pt.id 
    ORDER BY pr2.timestamp DESC 
    LIMIT 1
  ) as current_status
FROM ping_targets pt
LEFT JOIN ping_results pr ON pt.id = pr.target_id
WHERE pt.enabled = true
GROUP BY pt.id, pt.name, pt.url, pt.user_id;

-- Grant access to the view
GRANT SELECT ON ping_uptime_stats TO authenticated;

-- Success message
SELECT 'Ping Monitor tables created successfully!' as message;
