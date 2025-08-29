-- Phase 3: Education & Certifications Enhancement Migration
-- Run this script in your Supabase SQL editor

-- Create enhanced education table
CREATE TABLE IF NOT EXISTS enhanced_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_profile_id UUID NOT NULL REFERENCES cv_profiles(id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  degree_type VARCHAR(100), -- Bachelor's, Master's, PhD, Certificate, etc.
  field_of_study VARCHAR(255),
  degree_name VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_ongoing BOOLEAN DEFAULT false,
  grade_gpa VARCHAR(50),
  grade_scale VARCHAR(50), -- "4.0 scale", "percentage", "letter grade", etc.
  honors VARCHAR(255), -- magna cum laude, dean's list, etc.
  location VARCHAR(255),
  description TEXT,
  courses TEXT[], -- Array of relevant courses
  skills_gained TEXT[], -- Skills acquired during education
  projects TEXT[], -- Academic projects
  thesis_topic VARCHAR(500),
  relevance_score INTEGER DEFAULT 1 CHECK (relevance_score BETWEEN 1 AND 5),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  verification_status VARCHAR(50) DEFAULT 'unverified', -- verified, unverified, pending
  verification_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enhanced certifications table
CREATE TABLE IF NOT EXISTS enhanced_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_profile_id UUID NOT NULL REFERENCES cv_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255) NOT NULL,
  credential_id VARCHAR(255),
  credential_url VARCHAR(500),
  issue_date DATE,
  expiration_date DATE,
  never_expires BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active', -- active, expired, suspended, revoked
  certification_type VARCHAR(100), -- professional, technical, academic, vendor, etc.
  skill_areas TEXT[], -- Areas of expertise this cert covers
  competency_level INTEGER DEFAULT 1 CHECK (competency_level BETWEEN 1 AND 5),
  continuing_education_hours INTEGER DEFAULT 0,
  renewal_requirements TEXT,
  cost_amount DECIMAL(10,2),
  cost_currency VARCHAR(10) DEFAULT 'SEK',
  study_hours INTEGER,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  relevance_score INTEGER DEFAULT 1 CHECK (relevance_score BETWEEN 1 AND 5),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  verification_status VARCHAR(50) DEFAULT 'verified',
  auto_renewal BOOLEAN DEFAULT false,
  reminder_days_before_expiry INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create education timeline view
CREATE OR REPLACE VIEW education_timeline AS
SELECT 
  e.id,
  e.cv_profile_id,
  'education' as item_type,
  e.id as item_id,
  COALESCE(e.degree_name, e.field_of_study, 'Education') as title,
  e.institution as institution_provider,
  e.start_date::text,
  e.end_date::text,
  e.is_ongoing,
  e.relevance_score as importance_score,
  e.created_at::text
FROM enhanced_education e
WHERE e.cv_profile_id IS NOT NULL

UNION ALL

SELECT 
  c.id,
  c.cv_profile_id,
  'certification' as item_type,
  c.id as item_id,
  c.name as title,
  c.issuing_organization as institution_provider,
  c.issue_date::text as start_date,
  c.expiration_date::text as end_date,
  CASE WHEN c.never_expires THEN true ELSE false END as is_ongoing,
  c.relevance_score as importance_score,
  c.created_at::text
FROM enhanced_certifications c
WHERE c.cv_profile_id IS NOT NULL

ORDER BY start_date DESC NULLS LAST;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_education_cv_profile ON enhanced_education(cv_profile_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_education_dates ON enhanced_education(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_education_featured ON enhanced_education(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_enhanced_education_relevance ON enhanced_education(relevance_score);

CREATE INDEX IF NOT EXISTS idx_enhanced_certifications_cv_profile ON enhanced_certifications(cv_profile_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_certifications_dates ON enhanced_certifications(issue_date, expiration_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_certifications_featured ON enhanced_certifications(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_enhanced_certifications_status ON enhanced_certifications(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_certifications_type ON enhanced_certifications(certification_type);

-- Create RLS policies
ALTER TABLE enhanced_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_certifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for enhanced_education
CREATE POLICY "Users can view their own education entries" ON enhanced_education
  FOR SELECT USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own education entries" ON enhanced_education
  FOR INSERT WITH CHECK (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own education entries" ON enhanced_education
  FOR UPDATE USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own education entries" ON enhanced_education
  FOR DELETE USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for enhanced_certifications
CREATE POLICY "Users can view their own certification entries" ON enhanced_certifications
  FOR SELECT USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own certification entries" ON enhanced_certifications
  FOR INSERT WITH CHECK (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own certification entries" ON enhanced_certifications
  FOR UPDATE USING (
    cv_profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own certification entries" ON enhanced_certifications
  FOR DELETE USING (
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

DROP TRIGGER IF EXISTS update_enhanced_education_updated_at ON enhanced_education;
CREATE TRIGGER update_enhanced_education_updated_at
  BEFORE UPDATE ON enhanced_education
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enhanced_certifications_updated_at ON enhanced_certifications;
CREATE TRIGGER update_enhanced_certifications_updated_at
  BEFORE UPDATE ON enhanced_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper functions for certification management
CREATE OR REPLACE FUNCTION get_expiring_certifications(profile_id UUID, days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  issuing_organization VARCHAR,
  expiration_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.issuing_organization,
    c.expiration_date,
    (c.expiration_date - CURRENT_DATE)::INTEGER as days_until_expiry
  FROM enhanced_certifications c
  WHERE c.cv_profile_id = profile_id
    AND c.status = 'active'
    AND c.never_expires = false
    AND c.expiration_date IS NOT NULL
    AND c.expiration_date <= (CURRENT_DATE + INTERVAL '1 day' * days_ahead)
    AND c.expiration_date >= CURRENT_DATE
  ORDER BY c.expiration_date ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_expired_certifications(profile_id UUID)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  issuing_organization VARCHAR,
  expiration_date DATE,
  days_expired INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.issuing_organization,
    c.expiration_date,
    (CURRENT_DATE - c.expiration_date)::INTEGER as days_expired
  FROM enhanced_certifications c
  WHERE c.cv_profile_id = profile_id
    AND c.never_expires = false
    AND c.expiration_date IS NOT NULL
    AND c.expiration_date < CURRENT_DATE
  ORDER BY c.expiration_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON enhanced_education TO authenticated;
GRANT ALL ON enhanced_certifications TO authenticated;
GRANT SELECT ON education_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_certifications(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expired_certifications(UUID) TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Phase 3: Education & Certifications Enhancement migration completed successfully!';
  RAISE NOTICE 'Tables created: enhanced_education, enhanced_certifications';
  RAISE NOTICE 'View created: education_timeline';
  RAISE NOTICE 'Helper functions: get_expiring_certifications, get_expired_certifications';
END $$;
