# CV Manager Specification

**Spec ID:** 009-A  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The CV Manager provides comprehensive resume generation, skill tracking, experience management, and PDF export capabilities for consultant businesses. It enables automated CV creation based on projects, skills development tracking, and professional presentation of capabilities to clients.

## Feature Requirements

### Functional Requirements

#### Core CV Management Capabilities

##### Resume Generation

- Automated CV creation from project data and skill profiles
- Multiple professional templates with customizable layouts
- Dynamic content generation based on target client/role
- PDF export with professional formatting and typography
- Multi-language support (Swedish, English) with automatic translation
- Version control and history tracking for different CV variants

##### Skill Tracking & Development

- Comprehensive skill taxonomy with categories and proficiency levels
- Automatic skill detection from project descriptions and tasks
- Skill development tracking over time with progress visualization
- Endorsement and validation system for skill verification
- Technology stack tracking with version and experience details
- Certification and training record management

##### Experience Management

- Project-based experience extraction and organization
- Role and responsibility documentation with achievement metrics
- Client testimonial and reference management
- Portfolio integration with project showcases and case studies
- Timeline visualization of career progression and skill development
- Industry and domain expertise categorization

### Technical Specifications

#### Data Models

```typescript
interface CVProfile {
  id: string;
  user_id: string;
  
  // Personal information
  personal_info: PersonalInfo;
  professional_summary: string;
  
  // CV configuration
  template_id: string;
  target_role?: string;
  target_industry?: string;
  language: 'sv' | 'en';
  
  // Content sections
  skills_focus: string[]; // Skill IDs to highlight
  project_selections: ProjectSelection[];
  education_entries: EducationEntry[];
  certification_entries: CertificationEntry[];
  
  // Metadata
  version: number;
  is_active: boolean;
  last_generated: string;
  created_at: string;
  updated_at: string;
}

interface PersonalInfo {
  full_name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  profile_image_url?: string;
}

interface Skill {
  id: string;
  user_id: string;
  name: string;
  category: SkillCategory;
  proficiency_level: 1 | 2 | 3 | 4 | 5; // Beginner to Expert
  years_experience: number;
  last_used: string;
  is_core_skill: boolean;
  endorsements: SkillEndorsement[];
  project_associations: string[]; // Project IDs
  created_at: string;
  updated_at: string;
}

interface SkillCategory {
  id: string;
  name: string;
  type: 'technical' | 'soft' | 'domain' | 'tool' | 'language';
  parent_category_id?: string;
}

interface ProjectSelection {
  project_id: string;
  include_in_cv: boolean;
  custom_description?: string;
  highlighted_achievements: string[];
  skill_highlights: string[]; // Skill IDs to emphasize
  sort_order: number;
}

interface ExperienceEntry {
  id: string;
  user_id: string;
  type: 'employment' | 'consulting' | 'project' | 'volunteer';
  
  // Basic information
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  
  // Detailed information
  description: string;
  key_responsibilities: string[];
  achievements: Achievement[];
  technologies_used: string[]; // Skill IDs
  
  // Metadata
  created_at: string;
  updated_at: string;
}

interface Achievement {
  description: string;
  metrics?: {
    value: number;
    unit: string;
    context: string;
  };
  impact_level: 'low' | 'medium' | 'high';
}

interface CVTemplate {
  id: string;
  name: string;
  description: string;
  layout_type: 'traditional' | 'modern' | 'creative' | 'minimal';
  color_scheme: string;
  typography_settings: TypographySettings;
  section_config: SectionConfiguration;
  is_default: boolean;
  preview_url: string;
}

interface TypographySettings {
  header_font: string;
  body_font: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface SectionConfiguration {
  show_professional_summary: boolean;
  show_skills_section: boolean;
  show_experience_details: boolean;
  show_education: boolean;
  show_certifications: boolean;
  show_projects: boolean;
  skills_display_format: 'list' | 'bars' | 'tags' | 'grid';
  experience_format: 'detailed' | 'compact' | 'timeline';
}
```

#### CV Generation Hook

```typescript
export const useCVGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [cvProfiles, setCVProfiles] = useState<CVProfile[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<CVTemplate[]>([]);

  const generateCV = useCallback(async (profileId: string, options?: GenerationOptions) => {
    setIsGenerating(true);
    try {
      // Fetch CV profile with all related data
      const profile = await fetchCVProfileWithData(profileId);
      
      // Process and format content
      const processedContent = await processProfileContent(profile, options);
      
      // Generate PDF
      const pdfBlob = await generateCVPDF(processedContent, profile.template_id);
      
      // Update generation timestamp
      await supabase
        .from('cv_profiles')
        .update({ last_generated: new Date().toISOString() })
        .eq('id', profileId);

      return {
        pdf: pdfBlob,
        content: processedContent,
        metadata: {
          generated_at: new Date().toISOString(),
          template_used: profile.template_id,
          target_role: profile.target_role
        }
      };
    } catch (error) {
      console.error('CV generation failed:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const createCVProfile = useCallback(async (profileData: Omit<CVProfile, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('cv_profiles')
      .insert([{
        ...profileData,
        version: 1,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    setCVProfiles(prev => [...prev, data]);
    return data;
  }, []);

  const updateSkillProficiency = useCallback(async (
    skillId: string, 
    newLevel: number,
    projectContext?: string
  ) => {
    const updates: Partial<Skill> = {
      proficiency_level: newLevel as Skill['proficiency_level'],
      last_used: new Date().toISOString()
    };

    // If updating from project context, add project association
    if (projectContext) {
      const { data: skill } = await supabase
        .from('skills')
        .select('project_associations')
        .eq('id', skillId)
        .single();

      if (skill && !skill.project_associations.includes(projectContext)) {
        updates.project_associations = [...skill.project_associations, projectContext];
      }
    }

    const { error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', skillId);

    if (error) throw error;
  }, []);

  return {
    cvProfiles,
    availableTemplates,
    isGenerating,
    generateCV,
    createCVProfile,
    updateSkillProficiency,
    refreshData: () => Promise.all([fetchCVProfiles(), fetchTemplates()])
  };
};
```

### User Interface Specifications

#### CV Manager Dashboard

```typescript
const CVManagerDashboard = () => {
  const { cvProfiles, availableTemplates } = useCVGeneration();
  const { skills } = useSkills();
  const { projects } = useProjects();

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CV Manager</h1>
          <p className="text-muted-foreground">
            Generate professional CVs and manage your skills portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/cv/skills">
              <User className="h-4 w-4 mr-2" />
              Manage Skills
            </Link>
          </Button>
          <Button asChild>
            <Link to="/cv/new">
              <Plus className="h-4 w-4 mr-2" />
              New CV Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CV Profiles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cvProfiles.length}</div>
            <p className="text-xs text-muted-foreground">
              {cvProfiles.filter(p => p.is_active).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Tracked</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skills.length}</div>
            <p className="text-xs text-muted-foreground">
              {skills.filter(s => s.is_core_skill).length} core skills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Included</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getIncludedProjectsCount(cvProfiles, projects)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all CV profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Generated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getLastGenerationDate(cvProfiles)}
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent CV
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CV Profiles */}
      <Card>
        <CardHeader>
          <CardTitle>CV Profiles</CardTitle>
          <CardDescription>
            Manage your different CV configurations for various roles and clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cvProfiles.map((profile) => (
              <CVProfileCard 
                key={profile.id} 
                profile={profile} 
                onGenerate={() => handleGenerate(profile.id)}
                onEdit={() => navigate(`/cv/edit/${profile.id}`)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Portfolio</CardTitle>
          <CardDescription>
            Track your skill development and proficiency levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkillsOverview skills={skills} />
        </CardContent>
      </Card>
    </div>
  );
};
```

#### CV Profile Editor

```typescript
const CVProfileEditor = ({ profileId }: { profileId?: string }) => {
  const { createCVProfile, updateCVProfile } = useCVGeneration();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { skills } = useSkills();
  const { templates } = useTemplates();

  const form = useForm<CVProfileFormData>({
    resolver: zodResolver(cvProfileSchema),
    defaultValues: {
      personal_info: {
        full_name: '',
        title: '',
        email: '',
        phone: '',
        location: '',
      },
      professional_summary: '',
      template_id: '',
      language: 'en',
      skills_focus: [],
      project_selections: [],
      education_entries: [],
      certification_entries: []
    }
  });

  const onSubmit = async (data: CVProfileFormData) => {
    try {
      if (profileId) {
        await updateCVProfile(profileId, data);
        toast.success('CV profile updated successfully');
      } else {
        const newProfile = await createCVProfile(data);
        toast.success('CV profile created successfully');
        navigate(`/cv/profile/${newProfile.id}`);
      }
    } catch (error) {
      toast.error('Failed to save CV profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {profileId ? 'Edit CV Profile' : 'Create CV Profile'}
          </h1>
          <p className="text-muted-foreground">
            Configure your CV for different roles and clients
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Basic contact details and professional identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="personal_info.full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personal_info.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Senior Software Consultant"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personal_info.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personal_info.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="professional_summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Summary</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief overview of your experience and expertise..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      A compelling summary of your professional background and key strengths
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Template and Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>CV Configuration</CardTitle>
              <CardDescription>
                Template selection and targeting options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="template_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="sv">Svenska</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Role (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Technical Lead"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Focus</CardTitle>
              <CardDescription>
                Select key skills to highlight in this CV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkillSelector
                skills={skills}
                selectedSkills={form.watch('skills_focus')}
                onSelectionChange={(selected) => 
                  form.setValue('skills_focus', selected)
                }
              />
            </CardContent>
          </Card>

          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Project Experience</CardTitle>
              <CardDescription>
                Choose projects to include and customize their presentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectSelector
                projects={projects}
                selections={form.watch('project_selections')}
                onSelectionsChange={(selections) => 
                  form.setValue('project_selections', selections)
                }
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/cv">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
```

### Database Schema

#### CV Management Tables

```sql
-- CV Profiles table
CREATE TABLE cv_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal information
  personal_info JSONB NOT NULL,
  professional_summary TEXT,
  
  -- Configuration
  template_id UUID REFERENCES cv_templates(id),
  target_role TEXT,
  target_industry TEXT,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'sv')),
  
  -- Content selections
  skills_focus UUID[] DEFAULT '{}',
  project_selections JSONB DEFAULT '[]',
  education_entries JSONB DEFAULT '[]',
  certification_entries JSONB DEFAULT '[]',
  
  -- Metadata
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  last_generated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills table
CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES skill_categories(id),
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  years_experience DECIMAL(3,1) DEFAULT 0,
  last_used DATE DEFAULT CURRENT_DATE,
  is_core_skill BOOLEAN DEFAULT FALSE,
  project_associations UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Skill categories table
CREATE TABLE skill_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('technical', 'soft', 'domain', 'tool', 'language')),
  parent_category_id UUID REFERENCES skill_categories(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill endorsements table
CREATE TABLE skill_endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  endorser_name TEXT NOT NULL,
  endorser_title TEXT,
  endorser_company TEXT,
  endorsement_text TEXT,
  endorsement_date DATE DEFAULT CURRENT_DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experience entries table
CREATE TABLE experience_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('employment', 'consulting', 'project', 'volunteer')),
  
  -- Basic information
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  
  -- Detailed information
  description TEXT,
  key_responsibilities TEXT[],
  achievements JSONB DEFAULT '[]',
  technologies_used UUID[], -- References to skills
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CV Templates table
CREATE TABLE cv_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  layout_type TEXT NOT NULL CHECK (layout_type IN ('traditional', 'modern', 'creative', 'minimal')),
  color_scheme TEXT DEFAULT '#000000',
  typography_settings JSONB NOT NULL,
  section_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  preview_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_cv_profiles_user ON cv_profiles(user_id);
CREATE INDEX idx_skills_user_category ON skills(user_id, category_id);
CREATE INDEX idx_skills_proficiency ON skills(proficiency_level, is_core_skill);
CREATE INDEX idx_experience_user_dates ON experience_entries(user_id, start_date, end_date);
CREATE INDEX idx_endorsements_skill ON skill_endorsements(skill_id);

-- GIN indexes for array columns
CREATE INDEX idx_skills_projects ON skills USING GIN(project_associations);
CREATE INDEX idx_cv_skills_focus ON cv_profiles USING GIN(skills_focus);

-- Text search indexes
CREATE INDEX idx_skills_name_search ON skills USING GIN(to_tsvector('english', name));
CREATE INDEX idx_experience_search ON experience_entries USING GIN(
  to_tsvector('english', title || ' ' || company || ' ' || COALESCE(description, ''))
);

-- Ensure only one default template
CREATE UNIQUE INDEX idx_cv_templates_default ON cv_templates(is_default) 
WHERE is_default = TRUE;
```

#### Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE cv_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_entries ENABLE ROW LEVEL SECURITY;

-- CV Profiles policies
CREATE POLICY "Users can access own cv profiles" 
ON cv_profiles FOR ALL 
USING (auth.uid() = user_id);

-- Skills policies
CREATE POLICY "Users can access own skills" 
ON skills FOR ALL 
USING (auth.uid() = user_id);

-- Endorsements policies (allow read access for skill validation)
CREATE POLICY "Users can access endorsements for own skills" 
ON skill_endorsements FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM skills 
    WHERE skills.id = skill_endorsements.skill_id 
    AND skills.user_id = auth.uid()
  )
);

-- Experience entries policies
CREATE POLICY "Users can access own experience" 
ON experience_entries FOR ALL 
USING (auth.uid() = user_id);
```

### Business Logic

#### CV Content Processing

```typescript
const processProfileContent = async (
  profile: CVProfile,
  options?: GenerationOptions
): Promise<ProcessedCVContent> => {
  // Fetch related data
  const [skills, projects, experience] = await Promise.all([
    fetchSkillsForProfile(profile),
    fetchProjectsForProfile(profile),
    fetchExperienceEntries(profile.user_id)
  ]);

  // Process skills with proficiency and relevance
  const processedSkills = await processSkillsForCV(skills, profile.skills_focus);
  
  // Process project experience with custom descriptions
  const processedProjects = await processProjectsForCV(
    projects, 
    profile.project_selections,
    processedSkills
  );

  // Generate achievement statements
  const achievementStatements = await generateAchievementStatements(
    experience,
    processedProjects,
    options?.target_role
  );

  // Apply language localization
  const localizedContent = await localizeContent(
    {
      skills: processedSkills,
      projects: processedProjects,
      achievements: achievementStatements,
      summary: profile.professional_summary
    },
    profile.language
  );

  return {
    personalInfo: profile.personal_info,
    professionalSummary: localizedContent.summary,
    skills: localizedContent.skills,
    experience: localizedContent.projects,
    achievements: localizedContent.achievements,
    education: profile.education_entries,
    certifications: profile.certification_entries,
    metadata: {
      generated_for: options?.target_role,
      skill_count: processedSkills.length,
      project_count: processedProjects.length
    }
  };
};

const processSkillsForCV = async (
  skills: Skill[],
  focusSkillIds: string[]
): Promise<ProcessedSkill[]> => {
  return skills
    .map(skill => ({
      ...skill,
      relevance_score: calculateRelevanceScore(skill, focusSkillIds),
      display_level: mapProficiencyToDisplay(skill.proficiency_level),
      recent_projects: getRecentProjectsForSkill(skill)
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score);
};

const generateAchievementStatements = async (
  experience: ExperienceEntry[],
  projects: ProcessedProject[],
  targetRole?: string
): Promise<string[]> => {
  const achievements: string[] = [];

  // Extract quantifiable achievements from experience
  experience.forEach(exp => {
    exp.achievements.forEach(achievement => {
      if (achievement.metrics && achievement.impact_level === 'high') {
        achievements.push(formatAchievementStatement(achievement));
      }
    });
  });

  // Extract project-based achievements
  projects.forEach(project => {
    if (project.highlighted_achievements.length > 0) {
      achievements.push(...project.highlighted_achievements);
    }
  });

  // Filter and prioritize based on target role
  if (targetRole) {
    return prioritizeAchievementsForRole(achievements, targetRole);
  }

  return achievements.slice(0, 5); // Top 5 achievements
};
```

#### Skill Detection and Auto-Update

```typescript
const detectSkillsFromProject = async (projectId: string): Promise<string[]> => {
  const { data: project } = await supabase
    .from('projects')
    .select('description, technology_stack, tasks')
    .eq('id', projectId)
    .single();

  if (!project) return [];

  // Combine text for analysis
  const projectText = [
    project.description,
    ...(project.technology_stack || []),
    ...(project.tasks || [])
  ].join(' ');

  // Use skill detection algorithm
  const detectedSkills = await analyzeTextForSkills(projectText);
  
  // Auto-create missing skills
  const existingSkills = await getCurrentUserSkills();
  const newSkills = detectedSkills.filter(skill => 
    !existingSkills.some(existing => 
      existing.name.toLowerCase() === skill.toLowerCase()
    )
  );

  // Create new skills with basic proficiency
  for (const skillName of newSkills) {
    await createSkillFromDetection(skillName, projectId);
  }

  // Update existing skills with project association
  for (const skillName of detectedSkills) {
    await updateSkillProjectAssociation(skillName, projectId);
  }

  return detectedSkills;
};

const analyzeTextForSkills = async (text: string): Promise<string[]> => {
  // Skill detection patterns
  const technicalPatterns = {
    languages: /\b(JavaScript|TypeScript|Python|Java|C#|Go|Rust|PHP)\b/gi,
    frameworks: /\b(React|Vue|Angular|Node\.js|Express|Django|Flask|Spring)\b/gi,
    databases: /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch)\b/gi,
    cloud: /\b(AWS|Azure|GCP|Docker|Kubernetes|Terraform)\b/gi,
    tools: /\b(Git|Jenkins|GitHub|Jira|Slack|Figma)\b/gi
  };

  const detectedSkills: Set<string> = new Set();

  // Apply pattern matching
  Object.values(technicalPatterns).forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => detectedSkills.add(match));
    }
  });

  // Use ML-based skill extraction for more advanced detection
  if (process.env.OPENAI_API_KEY) {
    const mlDetectedSkills = await extractSkillsWithAI(text);
    mlDetectedSkills.forEach(skill => detectedSkills.add(skill));
  }

  return Array.from(detectedSkills);
};
```

### PDF Generation

#### Professional CV PDF Generator

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const generateCVPDF = async (
  content: ProcessedCVContent,
  templateId: string
): Promise<Blob> => {
  const template = await getTemplate(templateId);
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Set up fonts and colors
  setupPDFStyling(pdf, template);
  
  let yPosition = 20;

  // Header with personal information
  yPosition = renderPersonalHeader(pdf, content.personalInfo, template, yPosition);
  
  // Professional summary
  if (content.professionalSummary) {
    yPosition = renderSection(
      pdf, 
      'Professional Summary', 
      content.professionalSummary,
      template,
      yPosition
    );
  }

  // Skills section
  if (content.skills.length > 0) {
    yPosition = renderSkillsSection(pdf, content.skills, template, yPosition);
  }

  // Experience section
  if (content.experience.length > 0) {
    yPosition = renderExperienceSection(pdf, content.experience, template, yPosition);
  }

  // Education section
  if (content.education.length > 0) {
    yPosition = renderEducationSection(pdf, content.education, template, yPosition);
  }

  // Certifications section
  if (content.certifications.length > 0) {
    yPosition = renderCertificationsSection(pdf, content.certifications, template, yPosition);
  }

  return pdf.output('blob');
};

const renderPersonalHeader = (
  pdf: jsPDF,
  personalInfo: PersonalInfo,
  template: CVTemplate,
  startY: number
): number => {
  const { typography_settings } = template;
  let yPos = startY;

  // Name
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(typography_settings.accent_color);
  pdf.text(personalInfo.full_name, 20, yPos);
  yPos += 8;

  // Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(typography_settings.text_color);
  pdf.text(personalInfo.title, 20, yPos);
  yPos += 10;

  // Contact information
  pdf.setFontSize(10);
  const contactInfo = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location
  ].filter(Boolean);

  contactInfo.forEach((info, index) => {
    if (index > 0) {
      pdf.text(' | ', pdf.getTextWidth(contactInfo.slice(0, index).join(' | ')) + 20, yPos);
    }
    pdf.text(info, pdf.getTextWidth(contactInfo.slice(0, index).join(' | ')) + 20 + (index > 0 ? 5 : 0), yPos);
  });

  yPos += 15;

  // Separator line
  pdf.setDrawColor(typography_settings.accent_color);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPos, 190, yPos);
  yPos += 10;

  return yPos;
};

const renderSkillsSection = (
  pdf: jsPDF,
  skills: ProcessedSkill[],
  template: CVTemplate,
  startY: number
): number => {
  let yPos = startY;
  
  // Section header
  yPos = renderSectionHeader(pdf, 'Skills & Expertise', template, yPos);

  const { skills_display_format } = template.section_config;
  
  switch (skills_display_format) {
    case 'bars':
      yPos = renderSkillsWithBars(pdf, skills, template, yPos);
      break;
    case 'tags':
      yPos = renderSkillsAsTags(pdf, skills, template, yPos);
      break;
    case 'grid':
      yPos = renderSkillsAsGrid(pdf, skills, template, yPos);
      break;
    default:
      yPos = renderSkillsAsList(pdf, skills, template, yPos);
  }

  return yPos + 10;
};

const renderSkillsWithBars = (
  pdf: jsPDF,
  skills: ProcessedSkill[],
  template: CVTemplate,
  startY: number
): number => {
  let yPos = startY;
  const barWidth = 80;
  const barHeight = 3;

  skills.slice(0, 12).forEach((skill) => {
    // Skill name
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(skill.name, 25, yPos);

    // Proficiency bar background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(120, yPos - 2, barWidth, barHeight, 'F');

    // Proficiency bar fill
    const fillWidth = (skill.proficiency_level / 5) * barWidth;
    pdf.setFillColor(template.typography_settings.accent_color);
    pdf.rect(120, yPos - 2, fillWidth, barHeight, 'F');

    yPos += 6;
  });

  return yPos;
};

const renderExperienceSection = (
  pdf: jsPDF,
  experience: ProcessedProject[],
  template: CVTemplate,
  startY: number
): number => {
  let yPos = startY;
  
  // Section header
  yPos = renderSectionHeader(pdf, 'Professional Experience', template, yPos);

  experience.forEach((project) => {
    // Check if we need a new page
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }

    // Project title and client
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(project.title, 25, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(project.client_name, 120, yPos);
    yPos += 6;

    // Duration
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(formatProjectDuration(project), 25, yPos);
    yPos += 8;

    // Description
    pdf.setFontSize(10);
    pdf.setTextColor(template.typography_settings.text_color);
    const descriptionLines = pdf.splitTextToSize(project.description, 160);
    pdf.text(descriptionLines, 25, yPos);
    yPos += descriptionLines.length * 4 + 4;

    // Key achievements
    if (project.highlighted_achievements.length > 0) {
      project.highlighted_achievements.forEach((achievement) => {
        pdf.text(`• ${achievement}`, 30, yPos);
        yPos += 5;
      });
      yPos += 3;
    }

    // Technologies used
    if (project.skill_highlights.length > 0) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Technologies: ${project.skill_highlights.join(', ')}`, 25, yPos);
      yPos += 8;
    }

    yPos += 5; // Spacing between projects
  });

  return yPos;
};
```

### Integration with Other Systems

#### Project Integration

```typescript
// Auto-update skills from completed projects
const handleProjectCompletion = async (projectId: string) => {
  // Detect new skills from project
  const detectedSkills = await detectSkillsFromProject(projectId);
  
  // Update skill proficiency based on project complexity and duration
  for (const skillName of detectedSkills) {
    await updateSkillFromProject(skillName, projectId);
  }

  // Update CV profiles that might benefit from this project
  const relevantProfiles = await findRelevantCVProfiles(detectedSkills);
  
  for (const profile of relevantProfiles) {
    await suggestProjectForCVProfile(profile.id, projectId);
  }
};

// Integration with time tracking
const calculateSkillUsageFromTimeEntries = async (userId: string) => {
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('*, project:projects(*)')
    .eq('user_id', userId)
    .gte('date', subMonths(new Date(), 6).toISOString());

  const skillUsage = new Map<string, { hours: number, lastUsed: string }>();

  for (const entry of timeEntries || []) {
    const projectSkills = await getSkillsForProject(entry.project_id);
    
    projectSkills.forEach(skill => {
      const current = skillUsage.get(skill.id) || { hours: 0, lastUsed: entry.date };
      skillUsage.set(skill.id, {
        hours: current.hours + entry.hours,
        lastUsed: max([current.lastUsed, entry.date])
      });
    });
  }

  // Update skill last_used dates and calculate experience
  for (const [skillId, usage] of skillUsage) {
    await supabase
      .from('skills')
      .update({
        last_used: usage.lastUsed,
        years_experience: calculateExperienceFromUsage(usage.hours)
      })
      .eq('id', skillId);
  }
};
```

### Performance Optimizations

#### CV Generation Caching

```typescript
const useCVGenerationCache = () => {
  const [cache, setCache] = useState<Map<string, CachedCVData>>(new Map());

  const getCachedCV = (profileId: string, contentHash: string) => {
    const cached = cache.get(profileId);
    return cached?.hash === contentHash ? cached.data : null;
  };

  const setCachedCV = (profileId: string, contentHash: string, data: ProcessedCVContent) => {
    setCache(prev => new Map(prev.set(profileId, {
      hash: contentHash,
      data,
      timestamp: Date.now()
    })));
  };

  const invalidateCache = (profileId?: string) => {
    if (profileId) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(profileId);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  };

  // Auto-cleanup old cache entries
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setCache(prev => {
        const filtered = new Map();
        prev.forEach((value, key) => {
          if (now - value.timestamp < 30 * 60 * 1000) { // 30 minutes
            filtered.set(key, value);
          }
        });
        return filtered;
      });
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  return { getCachedCV, setCachedCV, invalidateCache };
};
```

### Testing Requirements

#### Unit Tests

```typescript
describe('CV Generation', () => {
  it('processes profile content correctly');
  it('generates PDF with proper formatting');
  it('handles skill detection and updates');
  it('applies template styling correctly');
  it('manages multi-language content');
});

describe('Skill Management', () => {
  it('detects skills from project descriptions');
  it('updates proficiency levels accurately');
  it('manages skill endorsements');
  it('calculates relevance scores');
});
```

#### Integration Tests

```typescript
describe('CV System Integration', () => {
  it('updates skills from completed projects');
  it('reflects time tracking in skill usage');
  it('maintains data consistency across features');
  it('handles template customization');
});
```

---

This specification ensures the CV Manager provides comprehensive resume generation and skill tracking capabilities while maintaining integration with project management and time tracking systems.