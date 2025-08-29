// CV/Resume related types

export interface CVProfile {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  profile_image_url?: string;
  target_role?: string;
  location?: string;
  phone?: string;
  email?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  summary?: string;
  key_attributes?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CVVersion {
  id: string;
  cv_profile_id: string;
  version_name: string;
  snapshot_data: Record<string, unknown>; // JSONB data
  created_at: string;
}

export interface CVExperience {
  id: string;
  cv_profile_id: string;
  company_name: string;
  role_title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  location?: string;
  achievements?: string[];
  skills_used?: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CVProject {
  id: string;
  cv_profile_id: string;
  project_name: string;
  client_company?: string;
  description?: string;
  my_role?: string;
  start_date: string;
  end_date?: string;
  technologies_used?: string[];
  achievements?: string[];
  project_url?: string;
  repository_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CVEducation {
  id: string;
  cv_profile_id: string;
  institution_name: string;
  degree: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CVSkill {
  id: string;
  cv_profile_id: string;
  skill_name: string;
  skill_level: 1 | 2 | 3 | 4; // Kalmar scale
  category?: string;
  years_of_experience?: number;
  last_used_date?: string;
  is_highlighted: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CVLanguage {
  id: string;
  cv_profile_id: string;
  language_name: string;
  proficiency_level: 1 | 2 | 3 | 4;
  proficiency_description?: string;
  certifications?: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  cv_profile_id: string;
  company_name: string;
  job_title: string;
  job_url?: string;
  application_date: string;
  status: 'applied' | 'interview' | 'rejected' | 'offered' | 'accepted' | 'withdrawn';
  cover_letter?: string;
  job_highlights?: string;
  custom_summary?: string;
  interview_notes?: string;
  follow_up_date?: string;
  salary_range?: string;
  location?: string;
  remote_option: boolean;
  created_at: string;
  updated_at: string;
}

export interface CVReference {
  id: string;
  cv_profile_id: string;
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  notes?: string;
  can_contact: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CVCertification {
  id: string;
  cv_profile_id: string;
  name: string;
  issuing_organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Skill level descriptions for the Kalmar scale
export const SKILL_LEVELS = {
  1: { label: 'Basic', description: 'Limited experience, requires guidance' },
  2: { label: 'Intermediate', description: 'Some experience, can work independently' },
  3: { label: 'Advanced', description: 'Extensive experience, can mentor others' },
  4: { label: 'Expert', description: 'Deep expertise, recognized authority' }
} as const;

// Language proficiency levels
export const LANGUAGE_LEVELS = {
  1: { label: 'Basic', description: 'Can understand and use basic phrases' },
  2: { label: 'Conversational', description: 'Can handle routine communications' },
  3: { label: 'Fluent', description: 'Can communicate effectively in most situations' },
  4: { label: 'Native', description: 'Native or near-native proficiency' }
} as const;

// Job application status options
export const APPLICATION_STATUSES = {
  applied: { label: 'Applied', color: 'blue' },
  interview: { label: 'Interview', color: 'yellow' },
  rejected: { label: 'Rejected', color: 'red' },
  offered: { label: 'Offered', color: 'green' },
  accepted: { label: 'Accepted', color: 'green' },
  withdrawn: { label: 'Withdrawn', color: 'gray' }
} as const;

// Common skill categories
export const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frameworks & Libraries',
  'Databases',
  'Cloud Platforms',
  'Development Tools',
  'Project Management',
  'Soft Skills',
  'Languages',
  'Certifications'
] as const;
