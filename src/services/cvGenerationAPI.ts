import { CVGenerationData, CVCustomization } from '@/types/cvGeneration';

// Import the ConsultantCVPayload type from cv-generation-api
import type { ConsultantCVPayload } from './cv-generation-api';

// Use ConsultantCVPayload as the API format
type APIPayload = ConsultantCVPayload;

// Import the centralized configuration
import { CV_API_CONFIG } from '../config/api';

export class CVGenerationAPI {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    this.baseUrl = CV_API_CONFIG.baseUrl;
    this.apiKey = CV_API_CONFIG.apiKey;
    this.timeout = CV_API_CONFIG.timeout;
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

  // Transform internal CV data to ConsultantCVPayload format (matching cv-gen API)
  private transformToAPIPayload(cvData: CVGenerationData): APIPayload {
    // Transform to match the cv-gen API format
    const payload = {
      personalInfo: {
        name: cvData.personalInfo.name || '',
        title: cvData.personalInfo.title || '',
        email: cvData.personalInfo.email || '',
        phone: cvData.personalInfo.phone || '',
        location: cvData.personalInfo.location || '',
        profileImage: cvData.personalInfo.profilePhoto,
        linkedIn: cvData.personalInfo.linkedIn,
        github: cvData.personalInfo.github,
        website: cvData.personalInfo.website,
        twitter: cvData.personalInfo.twitter,
        instagram: cvData.personalInfo.instagram,
        facebook: cvData.personalInfo.facebook
      },
      company: 'Frank Digital AB', // Default company
      summary: {
        introduction: cvData.summary?.introduction || '',
        highlights: cvData.summary?.keyStrengths || [],
        specialties: cvData.summary?.specialties || []
      },
      careerObjective: cvData.summary?.careerObjective || '',
      employment: cvData.experience?.map(exp => ({
        period: exp.period || '',
        position: exp.position || '',
        company: exp.company || '',
        description: exp.description || '',
        technologies: exp.technologies || [],
        achievements: exp.achievements || []
      })) || [],
      roles: cvData.roles?.map(role => ({
        name: role.title || '',
        description: '',
        responsibilities: role.skills || []
      })) || [],
      projects: cvData.projects?.map(project => ({
        period: project.period || 'Projektperiod',
        type: project.type || 'Utvecklare',
        title: project.name || '',
        description: project.description || '',
        technologies: project.technologies || [],
        achievements: project.achievements || [],
        url: project.url
      })) || [],
      education: cvData.education?.map(edu => ({
        period: edu.period || '',
        degree: edu.degree || '',
        institution: edu.institution || '',
        specialization: edu.field,
        honors: edu.honors,
        location: edu.location
      })) || [],
      certifications: cvData.certifications?.map(cert => ({
        year: cert.date || '',
        title: cert.name || '',
        issuer: cert.issuer || '',
        description: cert.credentialId ? `Credential ID: ${cert.credentialId}` : undefined,
        url: cert.url,
        expiration: cert.expirationDate
      })) || [],
      courses: cvData.courses?.map(course => ({
        name: course.name || '',
        institution: course.provider || '',
        year: course.completionDate || '',
        description: course.duration,
        status: course.status,
        grade: course.grade
      })) || [],
      competencies: cvData.skills?.map(skill => ({
        category: skill.category,
        items: skill.items
      })) || [],
      languages: cvData.languages?.map(lang => ({
        language: lang.language || '',
        proficiency: lang.proficiency || ''
      })) || [],
      closing: cvData.closing ? {
        statement: cvData.closing.text || '',
        signature: '',
        date: '',
        location: cvData.closing.contact?.location || ''
      } : undefined,
      template: cvData.template || cvData.templateSettings?.template || 'andervang-consulting',
      format: cvData.format || 'pdf',
      styling: {
        primaryColor: cvData.templateSettings?.colorScheme === 'blue' ? '#003D82' : '#003D82',
        accentColor: '#FF6B35'
      },
      templateSettings: cvData.templateSettings ? {
        template: cvData.templateSettings.template,
        colorScheme: cvData.templateSettings.colorScheme,
        fontSize: cvData.templateSettings.fontSize,
        spacing: cvData.templateSettings.margins,
        showPhoto: true,
        showSocial: true,
        headerStyle: 'default',
        sectionOrder: []
      } : undefined
    };

    // Remove undefined/null values
    return JSON.parse(JSON.stringify(payload));
  }

  // Generate CV
  async generateCV(cvData: CVGenerationData) {
    const apiPayload = this.transformToAPIPayload(cvData);
    
    const endpoint = `${this.baseUrl}/api`;
    const isLocal = CV_API_CONFIG.useLocalAPI;
    
    console.log(`🚀 Generating CV with ${isLocal ? 'LOCAL' : 'REMOTE'} Netlify Functions`);
    console.log(`📡 Endpoint: ${endpoint}`);
    
    return this.makeRequest('/api', {
      method: 'POST',
      body: JSON.stringify(apiPayload)
    });
  }

  // Generate all formats
  async generateAllFormats(cvData: CVGenerationData) {
    const apiPayload = this.transformToAPIPayload(cvData);
    // Remove format field for batch generation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { format, ...batchPayload } = apiPayload;
    
    const endpoint = `${this.baseUrl}/api/batch/formats`;
    const isLocal = CV_API_CONFIG.useLocalAPI;
    
    console.log(`🚀 Generating all formats with ${isLocal ? 'LOCAL' : 'REMOTE'} Netlify Functions`);
    console.log(`📡 Endpoint: ${endpoint}`);
    
    return this.makeRequest('/api/batch/formats', {
      method: 'POST',
      body: JSON.stringify(batchPayload)
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