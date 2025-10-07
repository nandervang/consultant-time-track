// CV Generation API types and interfaces

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  industry_focus: string;
  layout_structure: Record<string, unknown>;
  styling_config: Record<string, unknown>;
  sections_config: Record<string, unknown>;
  is_premium: boolean;
  is_active: boolean;
  preview_image_url?: string;
  created_at: string;
}

export interface CVPersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  profilePhoto?: string;
}

export interface CVSummary {
  introduction: string;
  keyStrengths: string[];
  careerObjective?: string;
}

export interface CVExperienceItem {
  company: string;
  position: string;
  period: string;
  description: string;
  technologies: string[];
  achievements: string[];
}

export interface CVEducationItem {
  institution: string;
  degree: string;
  field: string;
  period: string;
  gpa?: string;
}

export interface CVSkillCategory {
  category: string;
  items: string[];
}

export interface CVProjectItem {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface CVCertificationItem {
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
}

export interface CVLanguageItem {
  language: string;
  proficiency: string;
}

export interface CVCourseItem {
  name: string;
  provider: string;
  completionDate: string;
  duration?: string;
  credentialId?: string;
  url?: string;
}

export interface CVTemplateSettings {
  template: string;
  theme: string;
  showPhoto: boolean;
  showReferences: boolean;
  language: string;
  fontSize: string;
  margins: string;
  colorScheme: string;
}

export interface CVGenerationData {
  personalInfo: CVPersonalInfo;
  summary: CVSummary;
  experience: CVExperienceItem[];
  education: CVEducationItem[];
  skills: CVSkillCategory[];
  projects: CVProjectItem[];
  certifications: CVCertificationItem[];
  courses: CVCourseItem[];
  languages: CVLanguageItem[];
  templateSettings: CVTemplateSettings;
  template?: string;
  format?: string;
}

export interface CVCustomization {
  colorScheme: string;
  fontFamily: string;
  fontSize: string;
  spacing: string;
}

export interface CVGenerationResult {
  data?: {
    fileUrl?: string;
    format?: string;
    results?: Record<string, {
      success: boolean;
      fileUrl?: string;
      error?: string;
    }>;
    summary?: {
      successful: number;
      total: number;
    };
  };
  error?: string;
}

export interface CVVersion {
  id: string;
  cv_profile_id: string;
  version_name: string;
  version_number: number;
  data: CVGenerationData; // This maps to snapshot_data in DB
  role_focus?: string;
  language: 'en' | 'sv';
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface CVGenerationJob {
  id: string;
  cv_profile_id: string;
  version_id: string;
  template_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  formats: string[];
  results?: Record<string, CVGenerationResult>;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}