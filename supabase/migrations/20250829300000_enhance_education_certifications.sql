-- Phase 3: Enhanced Education & Certifications Management

-- Enhance cv_education table for better education tracking
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS education_type VARCHAR(50); -- 'University', 'Course', 'Bootcamp', 'Online', 'Workshop', 'Conference'
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS education_level VARCHAR(50); -- 'Bachelor', 'Master', 'PhD', 'Certificate', 'Diploma', 'Professional'
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS credits INTEGER; -- ECTS credits or equivalent
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS institution_country VARCHAR(100);
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS institution_website TEXT;
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS thesis_title TEXT;
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS thesis_description TEXT;
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS advisor_name VARCHAR(255);
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS skills_acquired TEXT[];
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS courses_completed TEXT[];
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS honors_awards TEXT[];
ALTER TABLE cv_education ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Enhance cv_certifications table
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS certification_type VARCHAR(50); -- 'Professional', 'Technical', 'Academic', 'Vendor', 'Industry'
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50); -- 'Beginner', 'Intermediate', 'Advanced', 'Expert'
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS study_hours INTEGER; -- Hours spent studying
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS exam_score VARCHAR(50); -- Score or grade achieved
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS renewal_required BOOLEAN DEFAULT false;
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'Verified'; -- 'Verified', 'Pending', 'Expired', 'Invalid'
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS skills_validated TEXT[]; -- Skills that this certification validates
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS prerequisites TEXT[]; -- Required certifications or experience
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS continuing_education_units DECIMAL(5,2); -- CEUs earned
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2); -- Cost of certification
ALTER TABLE cv_certifications ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'SEK';

-- Create training/courses table (separate from formal education)
CREATE TABLE IF NOT EXISTS cv_training_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL, -- 'Coursera', 'Udemy', 'LinkedIn Learning', 'Company Training', etc.
    course_type VARCHAR(50), -- 'Online', 'In-Person', 'Hybrid', 'Self-Paced', 'Instructor-Led'
    category VARCHAR(100), -- 'Technical', 'Leadership', 'Business', 'Soft Skills', 'Compliance'
    duration_hours DECIMAL(5,1),
    completion_date DATE,
    certificate_url TEXT,
    certificate_id VARCHAR(255),
    grade_score VARCHAR(50),
    skills_learned TEXT[],
    description TEXT,
    cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'SEK',
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conferences/events attended table
CREATE TABLE IF NOT EXISTS cv_conferences_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50), -- 'Conference', 'Workshop', 'Seminar', 'Meetup', 'Webinar', 'Summit'
    organizer VARCHAR(255),
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT false,
    start_date DATE NOT NULL,
    end_date DATE,
    attendance_type VARCHAR(50), -- 'Attendee', 'Speaker', 'Panelist', 'Organizer', 'Sponsor'
    session_topics TEXT[], -- Topics/sessions attended or presented
    presentation_title VARCHAR(255), -- If speaker/presenter
    presentation_url TEXT,
    key_takeaways TEXT[],
    networking_contacts INTEGER, -- Number of contacts made
    cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'SEK',
    certificate_earned BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning goals/objectives table
CREATE TABLE IF NOT EXISTS cv_learning_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    goal_title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'Technical', 'Leadership', 'Business', 'Personal Development'
    priority VARCHAR(20) DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
    target_completion_date DATE,
    status VARCHAR(50) DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    related_skills TEXT[],
    learning_methods TEXT[], -- 'Online Course', 'Book', 'Mentoring', 'Project Work', 'Conference'
    budget_allocated DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'SEK',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create education timeline view for better visualization
CREATE TABLE IF NOT EXISTS cv_education_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'Education', 'Certification', 'Course', 'Conference'
    item_id UUID NOT NULL, -- References the actual item ID
    title VARCHAR(255) NOT NULL,
    institution_provider VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT false,
    importance_score INTEGER DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE cv_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_conferences_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_education_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own training courses" ON cv_training_courses
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_training_courses.cv_profile_id));

CREATE POLICY "Users can manage their own conferences/events" ON cv_conferences_events
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_conferences_events.cv_profile_id));

CREATE POLICY "Users can manage their own learning goals" ON cv_learning_goals
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_learning_goals.cv_profile_id));

CREATE POLICY "Users can manage their own education timeline" ON cv_education_timeline
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_education_timeline.cv_profile_id));

-- Indexes for performance
CREATE INDEX idx_cv_training_courses_profile_id ON cv_training_courses(cv_profile_id);
CREATE INDEX idx_cv_training_courses_category ON cv_training_courses(category);
CREATE INDEX idx_cv_training_courses_completion_date ON cv_training_courses(completion_date);
CREATE INDEX idx_cv_conferences_events_profile_id ON cv_conferences_events(cv_profile_id);
CREATE INDEX idx_cv_conferences_events_event_type ON cv_conferences_events(event_type);
CREATE INDEX idx_cv_conferences_events_start_date ON cv_conferences_events(start_date);
CREATE INDEX idx_cv_learning_goals_profile_id ON cv_learning_goals(cv_profile_id);
CREATE INDEX idx_cv_learning_goals_status ON cv_learning_goals(status);
CREATE INDEX idx_cv_learning_goals_priority ON cv_learning_goals(priority);
CREATE INDEX idx_cv_education_timeline_profile_id ON cv_education_timeline(cv_profile_id);
CREATE INDEX idx_cv_education_timeline_item_type ON cv_education_timeline(item_type);
CREATE INDEX idx_cv_education_timeline_dates ON cv_education_timeline(start_date, end_date);

-- Triggers for updated_at
CREATE TRIGGER update_cv_training_courses_updated_at BEFORE UPDATE ON cv_training_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_conferences_events_updated_at BEFORE UPDATE ON cv_conferences_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_learning_goals_updated_at BEFORE UPDATE ON cv_learning_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update education timeline when items are added/updated
CREATE OR REPLACE FUNCTION sync_education_timeline()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle education items
    IF TG_TABLE_NAME = 'cv_education' THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            INSERT INTO cv_education_timeline (
                cv_profile_id, item_type, item_id, title, institution_provider, 
                start_date, end_date, is_ongoing, importance_score
            ) VALUES (
                NEW.cv_profile_id, 'Education', NEW.id, 
                NEW.degree || ' in ' || COALESCE(NEW.field_of_study, ''), 
                NEW.institution_name, NEW.start_date, NEW.end_date, 
                NEW.is_current, CASE WHEN NEW.is_featured THEN 9 ELSE 5 END
            )
            ON CONFLICT (cv_profile_id, item_type, item_id) DO UPDATE SET
                title = EXCLUDED.title,
                institution_provider = EXCLUDED.institution_provider,
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                is_ongoing = EXCLUDED.is_ongoing,
                importance_score = EXCLUDED.importance_score;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            DELETE FROM cv_education_timeline WHERE item_type = 'Education' AND item_id = OLD.id;
            RETURN OLD;
        END IF;
    END IF;
    
    -- Handle certification items
    IF TG_TABLE_NAME = 'cv_certifications' THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            INSERT INTO cv_education_timeline (
                cv_profile_id, item_type, item_id, title, institution_provider, 
                start_date, end_date, is_ongoing, importance_score
            ) VALUES (
                NEW.cv_profile_id, 'Certification', NEW.id, NEW.name, 
                NEW.issuing_organization, NEW.issue_date, NEW.expiry_date, 
                (NEW.expiry_date IS NULL OR NEW.expiry_date > CURRENT_DATE), 
                CASE WHEN NEW.is_featured THEN 8 ELSE 6 END
            )
            ON CONFLICT (cv_profile_id, item_type, item_id) DO UPDATE SET
                title = EXCLUDED.title,
                institution_provider = EXCLUDED.institution_provider,
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                is_ongoing = EXCLUDED.is_ongoing,
                importance_score = EXCLUDED.importance_score;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            DELETE FROM cv_education_timeline WHERE item_type = 'Certification' AND item_id = OLD.id;
            RETURN OLD;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Add unique constraint to education timeline to prevent duplicates
ALTER TABLE cv_education_timeline ADD CONSTRAINT unique_education_timeline_item 
    UNIQUE (cv_profile_id, item_type, item_id);

-- Triggers to sync education timeline
CREATE TRIGGER sync_education_timeline_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cv_education
    FOR EACH ROW EXECUTE FUNCTION sync_education_timeline();

CREATE TRIGGER sync_certification_timeline_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cv_certifications
    FOR EACH ROW EXECUTE FUNCTION sync_education_timeline();

-- Create comprehensive education view
CREATE OR REPLACE VIEW cv_education_comprehensive AS
SELECT 
    e.*,
    CASE 
        WHEN e.end_date IS NULL OR e.is_current THEN 'Ongoing'
        ELSE 'Completed'
    END as status,
    CASE 
        WHEN e.start_date IS NOT NULL AND e.end_date IS NOT NULL 
        THEN EXTRACT(YEAR FROM AGE(COALESCE(e.end_date, CURRENT_DATE), e.start_date)) * 12 + 
             EXTRACT(MONTH FROM AGE(COALESCE(e.end_date, CURRENT_DATE), e.start_date))
        ELSE NULL
    END as duration_months
FROM cv_education e;

-- Create certifications expiry tracking view
CREATE OR REPLACE VIEW cv_certifications_status AS
SELECT 
    c.*,
    CASE 
        WHEN c.expiry_date IS NULL THEN 'Permanent'
        WHEN c.expiry_date < CURRENT_DATE THEN 'Expired'
        WHEN c.expiry_date < CURRENT_DATE + INTERVAL '90 days' THEN 'Expiring Soon'
        ELSE 'Valid'
    END as status,
    CASE 
        WHEN c.expiry_date IS NOT NULL AND c.expiry_date > CURRENT_DATE 
        THEN EXTRACT(DAYS FROM (c.expiry_date - CURRENT_DATE))
        ELSE NULL
    END as days_until_expiry
FROM cv_certifications c;

-- Insert some common certification providers
INSERT INTO cv_industries (name) VALUES 
    ('Microsoft'),
    ('Google'),
    ('Amazon Web Services'),
    ('Oracle'),
    ('Cisco'),
    ('CompTIA'),
    ('PMI'),
    ('Scrum Alliance'),
    ('Linux Foundation'),
    ('Salesforce')
ON CONFLICT (name) DO NOTHING;
