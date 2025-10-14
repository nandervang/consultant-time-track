// CV Generation API Client
import { CV_API_CONFIG } from '../config/api';

interface ConsultantCVPayload {
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    profileImage?: string;
  };
  company: string;
  summary: {
    introduction: string;
    highlights: string[];
    specialties: string[];
  };
  employment: Array<{
    period: string;
    position: string;
    company: string;
    description: string;
    technologies: string[];
    achievements: string[];
  }>;
  projects: Array<{
    period: string;
    type: string;
    title: string;
    description: string;
    technologies: string[];
  }>;
  education: Array<{
    period: string;
    degree: string;
    institution: string;
    specialization?: string;
  }>;
  certifications: Array<{
    year: string;
    title: string;
    issuer: string;
    description?: string;
  }>;
  competencies: Array<{
    category: string;
    items: string[];
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  template: string;
  format: string;
  styling: {
    primaryColor: string;
    accentColor: string;
  };
}

interface CVGenerationResult {
  success: boolean;
  data?: {
    url: string;
    filename: string;
  };
  error?: string;
}

interface CVTemplate {
  id: string;
  name: string;
  description: string;
}

interface BatchResult {
  success: boolean;
  data?: {
    formats: Array<{
      format: string;
      url: string;
      filename: string;
    }>;
  };
  error?: string;
}

class CVGenerationAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async generateCV(cvData: ConsultantCVPayload): Promise<CVGenerationResult> {
    try {
      console.log('Generating CV with Netlify Functions at:', this.baseUrl);
      
      const response = await fetch(`${this.baseUrl}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(cvData),
        signal: AbortSignal.timeout(45000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('CV Generation API Error:', error);
      
      if (error.name === 'TimeoutError') {
        throw new Error('CV generation timed out. Serverless functions may take longer on first request (cold start). Please try again.');
      }
      if (error.message.includes('Function invocation timeout')) {
        throw new Error('Generation timed out. This can happen with complex CVs or during cold starts. Please try again in a moment.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to reach CV generation service. Check if the Netlify function is deployed and accessible.');
      }
      throw error;
    }
  }

  async getTemplates(): Promise<CVTemplate[]> {
    return [
      {
        id: 'andervang-consulting',
        name: 'Andervang Consulting',
        description: 'Professional consultant CV template with modern design'
      },
      {
        id: 'modern',
        name: 'Modern',
        description: 'Clean and contemporary design'
      },
      {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional professional format'
      }
    ];
  }

  async generateAllFormats(cvData: ConsultantCVPayload): Promise<BatchResult> {
    const response = await fetch(`${this.baseUrl}/api/batch/formats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify(cvData),
      signal: AbortSignal.timeout(90000)
    });
    
    return await response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: { 'X-API-Key': this.apiKey },
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  validatePayload(payload: ConsultantCVPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload.personalInfo?.name) {
      errors.push('Personal info: Name is required');
    }
    
    if (!payload.personalInfo?.title) {
      errors.push('Personal info: Title is required');
    }
    
    if (!payload.personalInfo?.email) {
      errors.push('Personal info: Email is required');
    }

    if (!payload.template) {
      errors.push('Template is required');
    }

    if (!payload.format) {
      errors.push('Format is required');
    }

    if (payload.format && !['pdf', 'docx', 'html'].includes(payload.format)) {
      errors.push('Format must be one of: pdf, docx, html');
    }

    const validTemplates = ['andervang-consulting', 'modern', 'classic'];
    if (payload.template && !validTemplates.includes(payload.template)) {
      errors.push(`Template must be one of: ${validTemplates.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async downloadCV(fileUrl: string, filename: string): Promise<void> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download CV: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download CV file');
    }
  }

  async checkHealth(): Promise<void> {
    const isHealthy = await this.healthCheck();
    if (!isHealthy) {
      throw new Error('CV Generation API is not available');
    }
  }
}

export const cvAPI = new CVGenerationAPI(CV_API_CONFIG);
export const cvGenerationAPI = cvAPI;

export async function generateSingleFormatCV(payload: ConsultantCVPayload): Promise<CVGenerationResult> {
  return cvAPI.generateCV(payload);
}

export async function generateMultipleFormats(
  basePayload: Omit<ConsultantCVPayload, 'format'>,
  formats: Array<'pdf' | 'docx' | 'html'>
): Promise<Record<string, CVGenerationResult>> {
  const results: Record<string, CVGenerationResult> = {};
  
  for (const format of formats) {
    const payload = { ...basePayload, format };
    results[format] = await cvAPI.generateCV(payload);
  }
  
  return results;
}

export async function downloadGeneratedCV(fileUrl: string, filename: string): Promise<void> {
  return cvAPI.downloadCV(fileUrl, filename);
}

export async function checkAPIHealth(): Promise<boolean> {
  try {
    await cvAPI.checkHealth();
    return true;
  } catch {
    return false;
  }
}
