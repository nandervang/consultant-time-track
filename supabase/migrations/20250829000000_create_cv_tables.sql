-- Create CV/Resume management tables

-- Main CV profiles
CREATE TABLE cv_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    profile_image_url TEXT,
    target_role VARCHAR(255),
    location VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    summary TEXT,
    key_attributes TEXT[], -- Array of key role attributes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CV versions for backup/history
CREATE TABLE cv_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    version_name VARCHAR(255) NOT NULL,
    snapshot_data JSONB NOT NULL, -- Full CV data snapshot
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work experiences
CREATE TABLE cv_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for current position
    is_current BOOLEAN DEFAULT false,
    location VARCHAR(255),
    achievements TEXT[],
    skills_used TEXT[],
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE cv_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    client_company VARCHAR(255),
    description TEXT,
    my_role VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    technologies_used TEXT[],
    achievements TEXT[],
    project_url TEXT,
    repository_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Education
CREATE TABLE cv_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    institution_name VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    grade VARCHAR(50),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills with levels (1-4 scale)
CREATE TABLE cv_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 4),
    category VARCHAR(100), -- e.g., 'Programming', 'Languages', 'Tools'
    years_of_experience DECIMAL(3,1),
    last_used_date DATE,
    is_highlighted BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Languages
CREATE TABLE cv_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    language_name VARCHAR(100) NOT NULL,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 4),
    proficiency_description VARCHAR(100), -- e.g., 'Native', 'Fluent', 'Conversational', 'Basic'
    certifications TEXT[],
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications tracking
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    job_url TEXT,
    application_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'applied', -- applied, interview, rejected, offered, accepted
    cover_letter TEXT,
    job_highlights TEXT, -- Key points from job description
    custom_summary TEXT, -- Tailored summary for this application
    interview_notes TEXT,
    follow_up_date DATE,
    salary_range VARCHAR(100),
    location VARCHAR(255),
    remote_option BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- References
CREATE TABLE cv_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    relationship VARCHAR(100), -- e.g., 'Former Manager', 'Client', 'Colleague'
    notes TEXT,
    can_contact BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certifications and awards
CREATE TABLE cv_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(255),
    credential_url TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cv_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own CV profiles" ON cv_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own CV versions" ON cv_versions
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_versions.cv_profile_id));

CREATE POLICY "Users can view their own CV experiences" ON cv_experiences
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_experiences.cv_profile_id));

CREATE POLICY "Users can view their own CV projects" ON cv_projects
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_projects.cv_profile_id));

CREATE POLICY "Users can view their own CV education" ON cv_education
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_education.cv_profile_id));

CREATE POLICY "Users can view their own CV skills" ON cv_skills
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_skills.cv_profile_id));

CREATE POLICY "Users can view their own CV languages" ON cv_languages
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_languages.cv_profile_id));

CREATE POLICY "Users can view their own job applications" ON job_applications
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = job_applications.cv_profile_id));

CREATE POLICY "Users can view their own CV references" ON cv_references
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_references.cv_profile_id));

CREATE POLICY "Users can view their own CV certifications" ON cv_certifications
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_certifications.cv_profile_id));

-- Indexes for performance
CREATE INDEX idx_cv_profiles_user_id ON cv_profiles(user_id);
CREATE INDEX idx_cv_versions_profile_id ON cv_versions(cv_profile_id);
CREATE INDEX idx_cv_experiences_profile_id ON cv_experiences(cv_profile_id);
CREATE INDEX idx_cv_projects_profile_id ON cv_projects(cv_profile_id);
CREATE INDEX idx_cv_education_profile_id ON cv_education(cv_profile_id);
CREATE INDEX idx_cv_skills_profile_id ON cv_skills(cv_profile_id);
CREATE INDEX idx_cv_languages_profile_id ON cv_languages(cv_profile_id);
CREATE INDEX idx_job_applications_profile_id ON job_applications(cv_profile_id);
CREATE INDEX idx_cv_references_profile_id ON cv_references(cv_profile_id);
CREATE INDEX idx_cv_certifications_profile_id ON cv_certifications(cv_profile_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cv_profiles_updated_at BEFORE UPDATE ON cv_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_experiences_updated_at BEFORE UPDATE ON cv_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_projects_updated_at BEFORE UPDATE ON cv_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_education_updated_at BEFORE UPDATE ON cv_education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_skills_updated_at BEFORE UPDATE ON cv_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_languages_updated_at BEFORE UPDATE ON cv_languages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_references_updated_at BEFORE UPDATE ON cv_references FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_certifications_updated_at BEFORE UPDATE ON cv_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
