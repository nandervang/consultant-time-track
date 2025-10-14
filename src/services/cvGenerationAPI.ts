import { CVGenerationData, CVCustomization } from '@/types/cvGeneration';

// API Payload interface based on OpenAPI specification
interface APIPayload {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    website?: string;
    linkedin?: string;
    github?: string;
    profilePhoto?: string;
    title?: string;
  };
  summary?: {
    introduction?: string;
    specialties?: string[];
  };
  roles?: Array<{
    title: string;
    skills: string[];
  }>;
  experience?: Array<{
    company: string;
    title: string;
    period: string;
    description?: string;
    achievements?: string[];
    technologies?: string[];
  }>;
  skills?: Array<{
    category: string;
    items: string[];
  }>;
  competencies?: Array<{
    category: string;
    skills: Array<{
      name: string;
      level: string;
      yearsOfExperience?: number;
    }>;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    period: string;
    gpa?: string;
  }>;
  projects?: Array<{
    name: string;
    title?: string;
    type?: string;
    description: string;
    technologies: string[];
    url?: string;
    period?: string;
    achievements?: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
  }>;
  courses?: Array<{
    name: string;
    provider: string;
    completionDate: string;
    credentialId?: string;
    url?: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  closing?: {
    text: string;
    contact: {
      email: string;
      phone: string;
      location: string;
      company: string;
    };
  };
  template: string;
  format: string;
}

// CV Generation API Client
const CV_API_CONFIG = {
  baseUrl: import.meta.env.VITE_CV_API_URL || 'https://andervang-cv.netlify.app/.netlify/functions',
  apiKey: import.meta.env.VITE_CV_API_KEY || 'dev-api-key-12345',
  timeout: 45000 // 45 seconds for generation requests (increased for serverless)
};

export class CVGenerationAPI {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config = CV_API_CONFIG) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers
      },
      ...options
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Provide specific error messages for common issues
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your CV_API_KEY configuration.');
        }
        if (response.status === 404) {
          throw new Error(`API endpoint not found: ${endpoint}`);
        }
        if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API permissions.');
        }
        
        // Try to get error message from response
        let errorMessage = `API request failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        console.error('CV API Error:', error.message);
        throw error;
      }
      console.error('CV API Error:', error);
      throw new Error('Unknown API error occurred');
    }
  }

  // Check API health
  async checkHealth() {
    try {
      // Check the health endpoint specifically
      const result = await this.makeRequest('/health');
      return { 
        status: 'healthy', 
        message: 'API is accessible',
        ...result
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'API not accessible'
      };
    }
  }

  // Get available templates
  async getTemplates() {
    return this.makeRequest('/api/templates');
  }

  // Transform internal CV data to API payload format
  private transformToAPIPayload(cvData: CVGenerationData): APIPayload {
    // Transform according to OpenAPI specification
    const payload = {
      personalInfo: {
        name: cvData.personalInfo.name,
        email: cvData.personalInfo.email,
        phone: cvData.personalInfo.phone,
        location: cvData.personalInfo.location,
        summary: cvData.summary?.introduction,
        website: cvData.personalInfo.website,
        linkedin: cvData.personalInfo.linkedIn,
        github: cvData.personalInfo.github,
        profilePhoto: cvData.personalInfo.profilePhoto,
        title: cvData.personalInfo.title
      },
      // Enhanced summary with specialties
      summary: cvData.summary ? {
        introduction: cvData.summary.introduction,
        specialties: cvData.summary.specialties
      } : undefined,
      // Professional roles section
      roles: cvData.roles?.map(role => ({
        title: role.title,
        skills: role.skills
      })),
      experience: cvData.experience.map(exp => ({
        company: exp.company,
        title: exp.position, // Map position to title
        period: exp.period,
        description: exp.description,
        achievements: exp.achievements,
        technologies: exp.technologies
      })),
      skills: cvData.skills.map(skill => ({
        category: skill.category,
        items: skill.items
      })),
      // Enhanced competencies with skill levels
      competencies: cvData.competencies?.map(comp => ({
        category: comp.category,
        skills: comp.skills.map(skill => ({
          name: skill.name,
          level: skill.level,
          yearsOfExperience: skill.yearsOfExperience
        }))
      })),
      education: cvData.education?.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        period: edu.period,
        gpa: edu.gpa
      })) || [],
      // Enhanced projects with type field
      projects: cvData.projects?.map(project => ({
        name: project.name,
        title: project.name, // API accepts both name and title
        type: project.type, // Required for Andervang template
        description: project.description,
        technologies: project.technologies,
        url: project.url,
        period: project.period,
        achievements: project.achievements
      })) || [],
      certifications: cvData.certifications?.map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        date: cert.date,
        credentialId: cert.credentialId
      })) || [],
      // Courses section
      courses: cvData.courses?.map(course => ({
        name: course.name,
        provider: course.provider,
        completionDate: course.completionDate,
        credentialId: course.credentialId,
        url: course.url
      })) || [],
      languages: cvData.languages?.map(lang => ({
        language: lang.language,
        proficiency: lang.proficiency
      })) || [],
      // Closing section
      closing: cvData.closing ? {
        text: cvData.closing.text,
        contact: cvData.closing.contact
      } : undefined,
      template: cvData.template || cvData.templateSettings?.template || 'andervang-consulting',
      format: cvData.format || 'pdf' // Required field
    };

    // Remove undefined/null values
    return JSON.parse(JSON.stringify(payload));
  }

  // Generate CV
  async generateCV(cvData: CVGenerationData) {
    const apiPayload = this.transformToAPIPayload(cvData);
    return this.makeRequest('/api/generate/complete', {
      method: 'POST',
      body: JSON.stringify(apiPayload)
    });
  }

  // Generate all formats
  async generateAllFormats(cvData: CVGenerationData) {
    return this.makeRequest('/api/batch/formats', {
      method: 'POST',
      body: JSON.stringify(cvData)
    });
  }

  // Preview template with customization
  async previewTemplate(templateId: string, customization: CVCustomization) {
    return this.makeRequest('/api/customization/preview', {
      method: 'POST',
      body: JSON.stringify({ templateId, customization })
    });
  }
}

// Initialize API client
export const cvGenerationAPI = new CVGenerationAPI();