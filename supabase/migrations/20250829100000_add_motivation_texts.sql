-- Add motivation texts table for managing multiple versions

CREATE TABLE cv_motivation_texts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_profile_id UUID REFERENCES cv_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    purpose VARCHAR(100), -- e.g., 'General', 'Tech Role', 'Leadership', 'Startup', etc.
    is_default BOOLEAN DEFAULT false,
    word_count INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cv_motivation_texts ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their own motivation texts" ON cv_motivation_texts
    FOR ALL USING (auth.uid() = (SELECT user_id FROM cv_profiles WHERE id = cv_motivation_texts.cv_profile_id));

-- Index for performance
CREATE INDEX idx_cv_motivation_texts_profile_id ON cv_motivation_texts(cv_profile_id);

-- Trigger for updated_at
CREATE TRIGGER update_cv_motivation_texts_updated_at 
    BEFORE UPDATE ON cv_motivation_texts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-calculate word count
CREATE OR REPLACE FUNCTION calculate_word_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.word_count = array_length(string_to_array(trim(NEW.content), ' '), 1);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-calculate word count
CREATE TRIGGER calculate_motivation_text_word_count
    BEFORE INSERT OR UPDATE ON cv_motivation_texts
    FOR EACH ROW EXECUTE FUNCTION calculate_word_count();

-- Update skills table to use 1-5 scale (Kammarkollegiet scale)
ALTER TABLE cv_skills ALTER COLUMN skill_level TYPE INTEGER;
ALTER TABLE cv_skills DROP CONSTRAINT cv_skills_skill_level_check;
ALTER TABLE cv_skills ADD CONSTRAINT cv_skills_skill_level_check 
    CHECK (skill_level >= 1 AND skill_level <= 5);

-- Update languages table to use 1-5 scale  
ALTER TABLE cv_languages ALTER COLUMN proficiency_level TYPE INTEGER;
ALTER TABLE cv_languages DROP CONSTRAINT cv_languages_proficiency_level_check;
ALTER TABLE cv_languages ADD CONSTRAINT cv_languages_proficiency_level_check 
    CHECK (proficiency_level >= 1 AND proficiency_level <= 5);
