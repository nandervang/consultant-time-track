-- Phase 4: CV Generation, Export & Analytics Enhancement Migration
-- Run this script in your Supabase SQL editor

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
  job_application_id UUID, -- Optional: link to specific job application
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
  date_bucket DATE -- Will be set by trigger
);

-- Enhanced motivation texts with rich content support
ALTER TABLE cv_motivation_texts 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'plain_text', -- 'plain_text', 'rich_text', 'markdown'
ADD COLUMN IF NOT EXISTS rich_content JSONB, -- Rich text content in structured format
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

CREATE INDEX IF NOT EXISTS idx_cv_motivation_texts_content_type ON cv_motivation_texts(content_type);
CREATE INDEX IF NOT EXISTS idx_cv_motivation_texts_version ON cv_motivation_texts(version_number);

-- Create RLS policies
ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for cv_templates (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view active templates" ON cv_templates;
CREATE POLICY "Anyone can view active templates" ON cv_templates
  FOR SELECT USING (is_active = true);

-- RLS policies for cv_generations
DROP POLICY IF EXISTS "Users can view their own CV generations" ON cv_generations;
CREATE POLICY "Users can view their own CV generations" ON cv_generations
  FOR SELECT USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create CV generations for their profiles" ON cv_generations;
CREATE POLICY "Users can create CV generations for their profiles" ON cv_generations
  FOR INSERT WITH CHECK (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own CV generations" ON cv_generations;
CREATE POLICY "Users can update their own CV generations" ON cv_generations
  FOR UPDATE USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for cv_analytics
DROP POLICY IF EXISTS "Users can view their own CV analytics" ON cv_analytics;
CREATE POLICY "Users can view their own CV analytics" ON cv_analytics
  FOR SELECT USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own CV analytics" ON cv_analytics;
CREATE POLICY "Users can insert their own CV analytics" ON cv_analytics
  FOR INSERT WITH CHECK (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cv_templates_updated_at ON cv_templates;
CREATE TRIGGER update_cv_templates_updated_at
  BEFORE UPDATE ON cv_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to set date_bucket for analytics
CREATE OR REPLACE FUNCTION set_analytics_date_bucket()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_bucket = DATE(NEW.recorded_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for analytics date_bucket
DROP TRIGGER IF EXISTS set_cv_analytics_date_bucket ON cv_analytics;
CREATE TRIGGER set_cv_analytics_date_bucket
  BEFORE INSERT OR UPDATE ON cv_analytics
  FOR EACH ROW
  EXECUTE FUNCTION set_analytics_date_bucket();

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
 true)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON cv_templates TO authenticated;
GRANT ALL ON cv_generations TO authenticated;
GRANT ALL ON cv_analytics TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Phase 4: CV Generation & Export Enhancement migration completed successfully!';
  RAISE NOTICE 'Tables created: cv_templates, cv_generations, cv_analytics';
  RAISE NOTICE 'Enhanced motivation_texts with rich content support';
  RAISE NOTICE 'Default templates: Modern Professional, Classic Executive, Creative Portfolio, Technical Specialist';
END $$;
