// CV Generation API Type Definitions
// These types match the API payload structure expected by the CV Generation API

export interface CVAPIPersonalInfo {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  profileImage?: string; // Base64 encoded image
  linkedIn?: string;
  github?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

export interface CVAPISummary {
  introduction: string;
  highlights: string[];
  specialties?: string[];
  careerObjective?: string;
}

export interface CVAPIEmployment {
  period: string;
  position: string;
  company: string;
  description: string;
  technologies?: string[];
  achievements?: string[];
  keyAchievements?: string[]; // Additional achievements field
  url?: string; // Company URL
  location?: string; // Work location
}

export interface CVAPIProject {
  period: string;
  type: string;
  title: string;
  description: string;
  technologies: string[];
  achievements?: string[];
  url?: string; // Project URL/Link
  keyAchievements?: string[]; // Additional achievements
}

export interface CVAPIEducation {
  period: string;
  degree: string;
  institution: string;
  specialization?: string;
  gpa?: string;
  location?: string;
  honors?: string[];
}

export interface CVAPICertification {
  year: string;
  title: string;
  issuer: string;
  description?: string;
  credentialId?: string;
  url?: string; // Certification URL/verification link
  expirationDate?: string;
}

export interface CVAPISkill {
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface CVAPISkillCategory {
  category: string;
  items: Array<{
    name: string;
    level?: number; // 1-5 rating scale
  }>;
}

export interface CVAPICompetency {
  category: string;
  skills: CVAPISkill[];
}

export interface CVAPILanguage {
  language: string;
  proficiency: string;
}

// New interfaces for missing sections
export interface CVAPIRole {
  title: string;
  skills: string[];
}

export interface CVAPICompetencySkill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience?: number;
}

export interface CVAPICompetencyCategory {
  category: string;
  skills: CVAPICompetencySkill[];
}

export interface CVAPIClosing {
  text: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    company: string;
  };
}

export interface CVAPICourse {
  name: string;
  provider: string;
  completionDate: string;
  duration?: string;
  credentialId?: string;
  url?: string;
  status?: 'completed' | 'in-progress' | 'audit';
  grade?: string;
}

export interface CVAPITemplateSettings {
  template: string;
  theme: string;
  showPhoto: boolean;
  showReferences: boolean;
  language: string;
  fontSize: string;
  margins: string;
  colorScheme: string;
}

export interface CVAPIStyling {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSize?: 'small' | 'medium' | 'large';
  spacing?: 'compact' | 'normal' | 'relaxed';
}

// Main payload interface for CV Generation API
export interface CVAPIPayload {
  // Required fields
  personalInfo: CVAPIPersonalInfo;
  company: string;
  
  // Professional summary
  summary: CVAPISummary;
  
  // Optional sections
  employment?: CVAPIEmployment[];
  projects?: CVAPIProject[];
  education?: CVAPIEducation[];
  certifications?: CVAPICertification[];
  courses?: CVAPICourse[];
  skills?: CVAPISkillCategory[]; // Direct mapping from Skills tab
  competencies?: CVAPICompetency[]; // Transformed/grouped skills for compatibility
  languages?: CVAPILanguage[];
  
  // New sections for comprehensive CV support
  roles?: CVAPIRole[];
  competencyCategories?: CVAPICompetencyCategory[];
  closing?: CVAPIClosing;
  templateSettings?: CVAPITemplateSettings;
  
  // Template and format selection
  template: 'andervang-consulting' | 'modern' | 'classic';
  format: 'pdf' | 'docx' | 'html';
  
  // Styling customization
  styling?: CVAPIStyling;
}

// API Response types
export interface CVAPISuccessResponse {
  success: true;
  data: {
    fileUrl: string;
    format: string;
    template: string;
    generatedAt: string;
  };
}

export interface CVAPIErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

export type CVAPIResponse = CVAPISuccessResponse | CVAPIErrorResponse;

// Multiple format generation response
export interface CVAPIMultiFormatResponse {
  success: boolean;
  results?: {
    [format: string]: {
      success: boolean;
      fileUrl?: string;
      error?: string;
    };
  };
}
