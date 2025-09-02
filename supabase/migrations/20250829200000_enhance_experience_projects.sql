-- Phase 2: Enhanced Project Management and Experience

-- Add more fields to cv_experiences for better categorization and details
ALTER TABLE cv_experiences ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50); -- 'Full-time', 'Consulting', 'Freelance', 'Contract'
ALTER TABLE cv_experiences ADD COLUMN IF NOT EXISTS company_industry VARCHAR(100);
ALTER TABLE cv_experiences ADD COLUMN IF NOT EXISTS company_size VARCHAR(50); -- 'Startup', 'SME', 'Enterprise', 'Government'
ALTER TABLE cv_experiences ADD COLUMN IF NOT EXISTS key_technologies TEXT[];
ALTER TABLE cv_experiences ADD COLUMN IF NOT EXISTS team_size INTEGER;
ALTER TABLE cv_experiences ADD COLUMN IF NOT EXISTS reporting_to VARCHAR(255);
ALTER TABLE cv_experiences ADD COLUMN IF NOT EXISTS budget_responsibility DECIMAL(15,2);
ALTER TABLE cv_experiences ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'SEK';

-- Enhance cv_projects table for better project management
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50); -- 'Development', 'Consulting', 'Research', 'Training', etc.
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS project_status VARCHAR(50) DEFAULT 'Completed'; -- 'Completed', 'Ongoing', 'Paused', 'Cancelled'
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS team_size INTEGER;
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS budget_range VARCHAR(100);
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS duration_months DECIMAL(3,1);
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS client_industry VARCHAR(100);
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS challenges_overcome TEXT[];
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS methodologies_used TEXT[]; -- 'Agile', 'Scrum', 'Waterfall', etc.
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false; -- For highlighting key projects
ALTER TABLE cv_projects ADD COLUMN IF NOT EXISTS confidential BOOLEAN DEFAULT false; -- For NDA projects

-- Create technology tags table for better organization
CREATE TABLE IF NOT EXISTS cv_technology_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50), -- 'Language', 'Framework', 'Database', 'Tool', 'Platform', 'Methodology'
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    usage_count INTEGER DEFAULT 0, -- How many times this tag is used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for project technologies (many-to-many)
CREATE TABLE IF NOT EXISTS cv_project_technologies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES cv_projects(id) ON DELETE CASCADE,
    technology_tag_id UUID REFERENCES cv_technology_tags(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5), -- 1-5 scale
    was_primary_tech BOOLEAN DEFAULT false, -- Was this a main technology for the project?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id, technology_tag_id)
);

-- Create junction table for experience technologies
CREATE TABLE IF NOT EXISTS cv_experience_technologies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID REFERENCES cv_experiences(id) ON DELETE CASCADE,
    technology_tag_id UUID REFERENCES cv_technology_tags(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    years_used_in_role DECIMAL(3,1),
    was_primary_tech BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(experience_id, technology_tag_id)
);

-- Create achievements table for better achievement tracking
CREATE TABLE IF NOT EXISTS cv_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES cv_experiences(id) ON DELETE CASCADE NULL, -- Can be NULL for general achievements
    project_id UUID REFERENCES cv_projects(id) ON DELETE CASCADE NULL, -- Can be NULL for experience achievements
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    achievement_type VARCHAR(50), -- 'Performance', 'Innovation', 'Leadership', 'Cost_Saving', 'Process_Improvement'
    quantified_impact VARCHAR(255), -- e.g., "Reduced costs by 30%", "Improved performance by 2x"
    impact_value DECIMAL(15,2), -- Numerical value of impact
    impact_unit VARCHAR(50), -- 'Percentage', 'SEK', 'USD', 'Hours', 'Users', etc.
    date_achieved DATE,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CHECK ((experience_id IS NOT NULL AND project_id IS NULL) OR (experience_id IS NULL AND project_id IS NOT NULL) OR (experience_id IS NULL AND project_id IS NULL))
);

-- Create industry table for consistent industry categorization
CREATE TABLE IF NOT EXISTS cv_industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_industry_id UUID REFERENCES cv_industries(id), -- For sub-industries
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common industries
INSERT INTO cv_industries (name) VALUES 
    ('Technology'),
    ('Finance'),
    ('Healthcare'),
    ('Government'),
    ('Education'),
    ('Manufacturing'),
    ('Retail'),
    ('Consulting'),
    ('Media & Entertainment'),
    ('Transportation'),
    ('Real Estate'),
    ('Energy'),
    ('Telecommunications'),
    ('Non-profit'),
    ('Startups')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE cv_technology_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_project_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_experience_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_industries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can manage their own technology tags" ON cv_technology_tags
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_technology_tags.cv_profile_id));

CREATE POLICY "Users can manage their own project technologies" ON cv_project_technologies
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles cp JOIN cv_projects p ON cp.id = p.cv_profile_id WHERE p.id = cv_project_technologies.project_id));

CREATE POLICY "Users can manage their own experience technologies" ON cv_experience_technologies
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles cp JOIN cv_experiences e ON cp.id = e.cv_profile_id WHERE e.id = cv_experience_technologies.experience_id));

CREATE POLICY "Users can manage their own achievements" ON cv_achievements
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_achievements.cv_profile_id));

-- Industries are publicly readable but only admins can modify
CREATE POLICY "Industries are publicly readable" ON cv_industries
    FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_cv_technology_tags_profile_id ON cv_technology_tags(cv_profile_id);
CREATE INDEX idx_cv_technology_tags_category ON cv_technology_tags(category);
CREATE INDEX idx_cv_project_technologies_project_id ON cv_project_technologies(project_id);
CREATE INDEX idx_cv_project_technologies_tech_id ON cv_project_technologies(technology_tag_id);
CREATE INDEX idx_cv_experience_technologies_experience_id ON cv_experience_technologies(experience_id);
CREATE INDEX idx_cv_experience_technologies_tech_id ON cv_experience_technologies(technology_tag_id);
CREATE INDEX idx_cv_achievements_profile_id ON cv_achievements(cv_profile_id);
CREATE INDEX idx_cv_achievements_experience_id ON cv_achievements(experience_id);
CREATE INDEX idx_cv_achievements_project_id ON cv_achievements(project_id);
CREATE INDEX idx_cv_achievements_type ON cv_achievements(achievement_type);

-- Triggers for updated_at
CREATE TRIGGER update_cv_technology_tags_updated_at BEFORE UPDATE ON cv_technology_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_achievements_updated_at BEFORE UPDATE ON cv_achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update technology usage count
CREATE OR REPLACE FUNCTION update_technology_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE cv_technology_tags 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.technology_tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE cv_technology_tags 
        SET usage_count = usage_count - 1 
        WHERE id = OLD.technology_tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers to update usage count
CREATE TRIGGER update_project_tech_usage_count
    AFTER INSERT OR DELETE ON cv_project_technologies
    FOR EACH ROW EXECUTE FUNCTION update_technology_usage_count();

CREATE TRIGGER update_experience_tech_usage_count
    AFTER INSERT OR DELETE ON cv_experience_technologies
    FOR EACH ROW EXECUTE FUNCTION update_technology_usage_count();

-- Create view for comprehensive project information
CREATE OR REPLACE VIEW cv_projects_enhanced AS
SELECT 
    p.*,
    array_agg(DISTINCT tt.name) FILTER (WHERE tt.name IS NOT NULL) AS technology_names,
    array_agg(DISTINCT tt.category) FILTER (WHERE tt.category IS NOT NULL) AS technology_categories,
    COUNT(DISTINCT a.id) as achievement_count,
    array_agg(DISTINCT a.title) FILTER (WHERE a.title IS NOT NULL) AS achievements_titles
FROM cv_projects p
LEFT JOIN cv_project_technologies pt ON p.id = pt.project_id
LEFT JOIN cv_technology_tags tt ON pt.technology_tag_id = tt.id
LEFT JOIN cv_achievements a ON p.id = a.project_id
GROUP BY p.id;

-- Create view for comprehensive experience information
CREATE OR REPLACE VIEW cv_experiences_enhanced AS
SELECT 
    e.*,
    array_agg(DISTINCT tt.name) FILTER (WHERE tt.name IS NOT NULL) AS technology_names,
    array_agg(DISTINCT tt.category) FILTER (WHERE tt.category IS NOT NULL) AS technology_categories,
    COUNT(DISTINCT a.id) as achievement_count,
    array_agg(DISTINCT a.title) FILTER (WHERE a.title IS NOT NULL) AS achievements_titles
FROM cv_experiences e
LEFT JOIN cv_experience_technologies et ON e.id = et.experience_id
LEFT JOIN cv_technology_tags tt ON et.technology_tag_id = tt.id
LEFT JOIN cv_achievements a ON e.id = a.experience_id
GROUP BY e.id;
