-- Phase 4: CV Generation, Export & Analytics Enhancement Migration
-- Advanced CV generation, export capabilities, and analytics

-- Create CV templates table
CREATE TABLE IF NOT EXISTS cv_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(100) NOT NULL, -- 'modern', 'classic', 'creative', 'technical', 'academic'
  industry_focus VARCHAR(100), -- 'tech', 'consulting', 'academic', 'creative', 'general'
  layout_structure JSONB NOT NULL, -- JSON describing the layout structure
  styling_config JSONB NOT NULL, -- Colors, fonts, spacing configuration
  sections_config JSONB NOT NULL, -- Which sections to include and their order
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  preview_image_url VARCHAR(500),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CV generations table (track generated CVs)
CREATE TABLE IF NOT EXISTS cv_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_profile_id UUID NOT NULL REFERENCES cv_profiles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES cv_templates(id),
  job_application_id UUID REFERENCES job_applications(id), -- Optional: link to specific job application
  generation_config JSONB NOT NULL, -- Configuration used for this generation
  content_data JSONB NOT NULL, -- The actual content data used
  output_format VARCHAR(50) NOT NULL, -- 'pdf', 'html', 'docx', 'json'
  file_url VARCHAR(500), -- URL to the generated file
  file_size_bytes INTEGER,
  generation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CV analytics table
CREATE TABLE IF NOT EXISTS cv_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_profile_id UUID NOT NULL REFERENCES cv_profiles(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL, -- 'generation', 'download', 'view', 'application_link'
  metric_value DECIMAL(10,2) NOT NULL DEFAULT 1,
  metadata JSONB, -- Additional data like template_id, format, etc.
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  date_bucket DATE GENERATED ALWAYS AS (DATE(recorded_at)) STORED
);

-- Create CV customization presets table
CREATE TABLE IF NOT EXISTS cv_customization_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_profile_id UUID NOT NULL REFERENCES cv_profiles(id) ON DELETE CASCADE,
  preset_name VARCHAR(255) NOT NULL,
  job_type VARCHAR(100), -- 'frontend', 'backend', 'fullstack', 'consulting', etc.
  industry VARCHAR(100),
  sections_priority JSONB NOT NULL, -- Which sections to emphasize
  content_filters JSONB NOT NULL, -- Filters for selecting relevant content
  template_preferences JSONB, -- Preferred templates and styling
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create export queue table for async processing
CREATE TABLE IF NOT EXISTS export_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_profile_id UUID NOT NULL REFERENCES cv_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  export_type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'html'
  template_id UUID REFERENCES cv_templates(id),
  customization_config JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
  progress_percentage INTEGER DEFAULT 0,
  result_url VARCHAR(500),
  error_details TEXT,
  estimated_completion_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced motivation texts with rich content support
ALTER TABLE motivation_texts 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'plain_text', -- 'plain_text', 'rich_text', 'markdown'
ADD COLUMN IF NOT EXISTS rich_content JSONB, -- Rich text content in structured format
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tone VARCHAR(50), -- 'professional', 'casual', 'enthusiastic', 'technical'
ADD COLUMN IF NOT EXISTS target_keywords TEXT[], -- SEO/ATS keywords
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_prompt_used TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cv_templates_type_industry ON cv_templates(template_type, industry_focus);
CREATE INDEX IF NOT EXISTS idx_cv_templates_active ON cv_templates(is_active, is_premium);

CREATE INDEX IF NOT EXISTS idx_cv_generations_profile ON cv_generations(cv_profile_id);
CREATE INDEX IF NOT EXISTS idx_cv_generations_status ON cv_generations(generation_status);
CREATE INDEX IF NOT EXISTS idx_cv_generations_created ON cv_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_cv_generations_template ON cv_generations(template_id);

CREATE INDEX IF NOT EXISTS idx_cv_analytics_profile_date ON cv_analytics(cv_profile_id, date_bucket);
CREATE INDEX IF NOT EXISTS idx_cv_analytics_metric_type ON cv_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_cv_analytics_recorded ON cv_analytics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_cv_customization_profile ON cv_customization_presets(cv_profile_id);
CREATE INDEX IF NOT EXISTS idx_cv_customization_default ON cv_customization_presets(is_default);

CREATE INDEX IF NOT EXISTS idx_export_queue_user ON export_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_export_queue_status ON export_queue(status);
CREATE INDEX IF NOT EXISTS idx_export_queue_created ON export_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_motivation_texts_content_type ON motivation_texts(content_type);
CREATE INDEX IF NOT EXISTS idx_motivation_texts_version ON motivation_texts(version_number);

-- Create RLS policies
ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_customization_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for cv_templates (public read, admin write)
CREATE POLICY "Anyone can view active templates" ON cv_templates
  FOR SELECT USING (is_active = true);

-- RLS policies for cv_generations
CREATE POLICY "Users can view their own CV generations" ON cv_generations
  FOR SELECT USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create CV generations for their profiles" ON cv_generations
  FOR INSERT WITH CHECK (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own CV generations" ON cv_generations
  FOR UPDATE USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for cv_analytics
CREATE POLICY "Users can view their own CV analytics" ON cv_analytics
  FOR SELECT USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own CV analytics" ON cv_analytics
  FOR INSERT WITH CHECK (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for cv_customization_presets
CREATE POLICY "Users can manage their own customization presets" ON cv_customization_presets
  FOR ALL USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for export_queue
CREATE POLICY "Users can manage their own export jobs" ON export_queue
  FOR ALL USING (user_id = auth.uid());

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_cv_templates_updated_at ON cv_templates;
CREATE TRIGGER update_cv_templates_updated_at
  BEFORE UPDATE ON cv_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cv_customization_presets_updated_at ON cv_customization_presets;
CREATE TRIGGER update_cv_customization_presets_updated_at
  BEFORE UPDATE ON cv_customization_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper functions for CV analytics
CREATE OR REPLACE FUNCTION record_cv_metric(
  profile_id UUID,
  metric_type VARCHAR,
  metric_value DECIMAL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  analytics_id UUID;
BEGIN
  INSERT INTO cv_analytics (cv_profile_id, metric_type, metric_value, metadata)
  VALUES (profile_id, metric_type, metric_value, metadata)
  RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get CV analytics summary
CREATE OR REPLACE FUNCTION get_cv_analytics_summary(profile_id UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  total_generations INTEGER,
  total_downloads INTEGER,
  most_used_template VARCHAR,
  most_popular_format VARCHAR,
  generation_trend JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH analytics_data AS (
    SELECT 
      metric_type,
      COUNT(*) as count,
      metadata
    FROM cv_analytics 
    WHERE cv_profile_id = profile_id 
      AND recorded_at >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
    GROUP BY metric_type, metadata
  ),
  template_usage AS (
    SELECT 
      metadata->>'template_id' as template_id,
      COUNT(*) as usage_count
    FROM cv_analytics 
    WHERE cv_profile_id = profile_id 
      AND metric_type = 'generation'
      AND metadata->>'template_id' IS NOT NULL
      AND recorded_at >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
    GROUP BY metadata->>'template_id'
    ORDER BY usage_count DESC
    LIMIT 1
  ),
  format_usage AS (
    SELECT 
      metadata->>'format' as format,
      COUNT(*) as usage_count
    FROM cv_analytics 
    WHERE cv_profile_id = profile_id 
      AND metric_type IN ('generation', 'download')
      AND metadata->>'format' IS NOT NULL
      AND recorded_at >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
    GROUP BY metadata->>'format'
    ORDER BY usage_count DESC
    LIMIT 1
  )
  SELECT 
    COALESCE((SELECT count FROM analytics_data WHERE metric_type = 'generation'), 0)::INTEGER,
    COALESCE((SELECT count FROM analytics_data WHERE metric_type = 'download'), 0)::INTEGER,
    COALESCE((SELECT template_id FROM template_usage), 'none'),
    COALESCE((SELECT format FROM format_usage), 'none'),
    '{"trend": "data not available"}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger motivation text analysis
CREATE OR REPLACE FUNCTION update_motivation_text_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update word count
  NEW.word_count = array_length(string_to_array(trim(NEW.content), ' '), 1);
  
  -- Estimate reading time (average 200 words per minute)
  NEW.reading_time_minutes = GREATEST(1, ROUND(NEW.word_count / 200.0));
  
  -- Auto-increment version if content changed
  IF TG_OP = 'UPDATE' AND OLD.content != NEW.content THEN
    NEW.version_number = COALESCE(OLD.version_number, 0) + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS motivation_text_metrics_trigger ON motivation_texts;
CREATE TRIGGER motivation_text_metrics_trigger
  BEFORE INSERT OR UPDATE ON motivation_texts
  FOR EACH ROW
  EXECUTE FUNCTION update_motivation_text_metrics();

-- Insert default CV templates
INSERT INTO cv_templates (name, description, template_type, industry_focus, layout_structure, styling_config, sections_config, is_active) VALUES
('Modern Professional', 'Clean, modern design perfect for tech and consulting roles', 'modern', 'tech', 
 '{"header": "top", "sidebar": "left", "content": "main", "footer": "bottom"}',
 '{"primaryColor": "#2563eb", "accentColor": "#1e40af", "fontFamily": "Inter", "fontSize": "11pt"}',
 '{"sections": ["header", "summary", "experience", "skills", "education", "certifications"], "emphasis": "experience"}',
 true),

('Classic Executive', 'Traditional, conservative layout for senior roles', 'classic', 'consulting',
 '{"header": "top", "content": "single_column", "footer": "minimal"}',
 '{"primaryColor": "#374151", "accentColor": "#6b7280", "fontFamily": "Times", "fontSize": "12pt"}',
 '{"sections": ["header", "summary", "experience", "education", "skills"], "emphasis": "leadership"}',
 true),

('Creative Portfolio', 'Vibrant design for creative and design roles', 'creative', 'creative',
 '{"header": "side", "portfolio": "grid", "content": "asymmetric"}',
 '{"primaryColor": "#7c3aed", "accentColor": "#a855f7", "fontFamily": "Poppins", "fontSize": "10pt"}',
 '{"sections": ["header", "portfolio", "experience", "skills", "education"], "emphasis": "portfolio"}',
 true),

('Technical Specialist', 'Technical focus with emphasis on skills and projects', 'technical', 'tech',
 '{"header": "minimal", "skills": "prominent", "projects": "detailed"}',
 '{"primaryColor": "#059669", "accentColor": "#10b981", "fontFamily": "JetBrains Mono", "fontSize": "10pt"}',
 '{"sections": ["header", "skills", "projects", "experience", "certifications", "education"], "emphasis": "technical"}',
 true);

-- Grant necessary permissions
GRANT ALL ON cv_templates TO authenticated;
GRANT ALL ON cv_generations TO authenticated;
GRANT ALL ON cv_analytics TO authenticated;
GRANT ALL ON cv_customization_presets TO authenticated;
GRANT ALL ON export_queue TO authenticated;
GRANT EXECUTE ON FUNCTION record_cv_metric(UUID, VARCHAR, DECIMAL, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cv_analytics_summary(UUID, INTEGER) TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Phase 4: CV Generation & Export Enhancement migration completed successfully!';
  RAISE NOTICE 'Tables created: cv_templates, cv_generations, cv_analytics, cv_customization_presets, export_queue';
  RAISE NOTICE 'Enhanced motivation_texts with rich content support';
  RAISE NOTICE 'Default templates: Modern Professional, Classic Executive, Creative Portfolio, Technical Specialist';
  RAISE NOTICE 'Analytics functions: record_cv_metric, get_cv_analytics_summary';
END $$;
