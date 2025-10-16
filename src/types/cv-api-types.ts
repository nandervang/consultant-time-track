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
}

export interface CVAPISummary {
  introduction: string;
  highlights: string[];
  specialties?: string[];
}

export interface CVAPIEmployment {
  period: string;
  position: string;
  company: string;
  description: string;
  technologies?: string[];
  achievements?: string[];
}

export interface CVAPIProject {
  period: string;
  type: string;
  title: string;
  description: string;
  technologies: string[];
  achievements?: string[];
}

export interface CVAPIEducation {
  period: string;
  degree: string;
  institution: string;
  specialization?: string;
}

export interface CVAPICertification {
  year: string;
  title: string;
  issuer: string;
  description?: string;
}

export interface CVAPISkill {
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
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
  competencies?: CVAPICompetency[];
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
