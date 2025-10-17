// CV Generation API Client
import { CV_API_CONFIG } from '../config/api';

export interface ConsultantCVPayload {
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    profileImage?: string;
    linkedIn?: string;
    github?: string;
    website?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  company: string;
  summary: {
    introduction: string;
    highlights: string[];
    specialties: string[];
  };
  careerObjective?: string;
  employment: Array<{
    period: string;
    position: string;
    company: string;
    description: string;
    technologies: string[];
    achievements: string[];
  }>;
  roles?: Array<{
    name: string;
    description?: string;
    responsibilities: string[];
  }>;
  projects: Array<{
    period: string;
    type: string;
    title: string;
    description: string;
    technologies: string[];
    achievements?: string[];
    url?: string;
  }>;
  education: Array<{
    period: string;
    degree: string;
    institution: string;
    specialization?: string;
    honors?: string;
    location?: string;
  }>;
  certifications: Array<{
    year: string;
    title: string;
    issuer: string;
    description?: string;
    url?: string;
    expiration?: string;
  }>;
  courses?: Array<{
    name: string;
    institution: string;
    year: string;
    description?: string;
    status?: string;
    grade?: string;
  }>;
  skills?: Array<{
    category: string;
    items: Array<{
      name: string;
      level?: number; // 1-5 rating scale
    }>;
  }>;
  competencies: Array<{
    category: string;
    items: string[];
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  closing?: {
    statement: string;
    signature?: string;
    date?: string;
    location?: string;
  };
  template: string;
  format: string;
  styling: {
    primaryColor: string;
    accentColor: string;
  };
  templateSettings?: {
    template?: string;
    colorScheme?: string;
    fontSize?: string;
    spacing?: string;
    showPhoto?: boolean;
    showSocial?: boolean;
    headerStyle?: string;
    sectionOrder?: string[];
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
  private warmupInterval: number | null = null;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    
    // Start function warming for production
    if (!CV_API_CONFIG.isDev && !CV_API_CONFIG.useLocalAPI) {
      this.startFunctionWarming();
    }
  }

  /**
   * Periodically ping the health endpoint to keep the function warm
   */
  private startFunctionWarming() {
    // Ping every 4 minutes (Netlify functions timeout at 10 minutes)
    this.warmupInterval = window.setInterval(async () => {
      try {
        console.log('🔥 Warming up CV generation function...');
        await this.healthCheck();
      } catch (error) {
        console.warn('⚠️ Function warming failed:', error);
      }
    }, 4 * 60 * 1000) as unknown as number;
  }

  /**
   * Stop function warming (cleanup)
   */
  public stopFunctionWarming() {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = null;
      console.log('🛑 Function warming stopped');
    }
  }

  /**
   * Optimize payload to reduce PDF generation time
   */
  private optimizePayload(cvData: ConsultantCVPayload): ConsultantCVPayload {
    const optimized = { ...cvData };
    
    // Truncate very long text fields that might cause timeouts
    const truncateText = (text: string, maxLength: number) => {
      if (text && text.length > maxLength) {
        console.warn(`⚠️ Truncating text from ${text.length} to ${maxLength} characters to prevent timeout`);
        return text.substring(0, maxLength) + '...';
      }
      return text;
    };

    // Limit employment entries to prevent timeout (keep most recent)
    if (optimized.employment && optimized.employment.length > 15) {
      console.warn(`⚠️ Limiting employment entries from ${optimized.employment.length} to 15 to prevent timeout`);
      optimized.employment = optimized.employment.slice(0, 15);
    }

    // Truncate long descriptions more aggressively
    if (optimized.employment) {
      optimized.employment = optimized.employment.map(emp => ({
        ...emp,
        description: truncateText(emp.description, 400),
        achievements: emp.achievements?.slice(0, 3) || [], // Limit achievements
        technologies: emp.technologies?.slice(0, 10) || [] // Limit technologies
      }));
    }

    if (optimized.projects) {
      optimized.projects = optimized.projects.map(proj => ({
        ...proj,
        description: truncateText(proj.description, 300),
        achievements: proj.achievements?.slice(0, 3) || [],
        technologies: proj.technologies?.slice(0, 8) || []
      }));
    }

    // Limit and truncate skills
    if (optimized.skills) {
      optimized.skills = optimized.skills.slice(0, 6).map(skillCat => ({
        ...skillCat,
        items: skillCat.items?.slice(0, 8) || []
      }));
    }

    // Limit competencies
    if (optimized.competencies) {
      optimized.competencies = optimized.competencies.slice(0, 3).map(comp => ({
        ...comp,
        items: comp.items?.slice(0, 15) || []
      }));
    }

    // Truncate summary sections
    if (optimized.summary) {
      optimized.summary = {
        ...optimized.summary,
        introduction: truncateText(optimized.summary.introduction, 300),
        highlights: optimized.summary.highlights?.slice(0, 4) || [],
        specialties: optimized.summary.specialties?.slice(0, 6) || []
      };
    }

    // Log optimization results
    console.log('📊 Payload optimization summary:', {
      employment: `${cvData.employment?.length || 0} → ${optimized.employment?.length || 0}`,
      skills: `${cvData.skills?.length || 0} → ${optimized.skills?.length || 0}`,
      competencies: `${cvData.competencies?.length || 0} → ${optimized.competencies?.length || 0}`,
      originalSize: JSON.stringify(cvData).length,
      optimizedSize: JSON.stringify(optimized).length
    });

    return optimized;
  }

  async generateCV(cvData: ConsultantCVPayload): Promise<CVGenerationResult> {
    const endpoint = `${this.baseUrl}/api`;
    const isLocal = CV_API_CONFIG.useLocalAPI;
    
    console.log(`🚀 Generating CV with ${isLocal ? 'LOCAL' : 'REMOTE'} Netlify Functions`);
    console.log(`📡 Endpoint: ${endpoint}`);
    
    // Validate payload before sending
    const validation = this.validatePayload(cvData);
    if (!validation.valid) {
      console.error('❌ Payload validation failed:', validation.errors);
      throw new Error(`Invalid payload: ${validation.errors.join(', ')}`);
    }
    
    // Log payload size for debugging
    const payloadSize = JSON.stringify(cvData).length;
    console.log(`📦 Payload size: ${payloadSize} bytes`);
    
      // Log essential payload info for debugging
      console.log('📋 Payload summary:', {
        name: cvData.personalInfo?.name,
        template: cvData.template,
        format: cvData.format,
        sectionsCount: {
          employment: cvData.employment?.length || 0,
          projects: cvData.projects?.length || 0,
          education: cvData.education?.length || 0,
          competencies: cvData.competencies?.length || 0,
          skills: cvData.skills?.length || 0,
          languages: cvData.languages?.length || 0
        }
      });

      // Check for potentially problematic content and optimize if needed
      const originalSize = JSON.stringify(cvData).length;
      let optimizedData = cvData;
      
      if (originalSize > 30000) {
        console.warn('⚠️ Large payload detected:', originalSize, 'bytes - optimizing to prevent PDF generation timeouts');
        optimizedData = this.optimizePayload(cvData);
        const optimizedSize = JSON.stringify(optimizedData).length;
        console.log('✂️ Payload optimized:', originalSize, '→', optimizedSize, 'bytes');
      }
      
      // Retry logic for cold starts and 502 errors
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay (cold start recovery)`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          mode: 'cors', // Explicitly enable CORS
          credentials: 'omit', // Don't send cookies
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-Key': this.apiKey,
            'Origin': window.location.origin, // Add origin header
            'User-Agent': 'CV-Generator/1.0'
          },
          body: JSON.stringify(optimizedData),
          signal: AbortSignal.timeout(120000) // Increase timeout to 2 minutes for cold starts
        });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
          } catch {
            console.error('❌ Could not read error response body');
          }
          
          // Handle 502 errors specially for retry logic
          if (response.status === 502) {
            const coldStartError = new Error(
              attempt >= maxRetries 
                ? `CV generation is currently experiencing delays due to server cold starts. This is normal for the first request after inactivity. Please try again in a moment - subsequent requests will be faster.`
                : `Server is starting up (cold start) - attempting retry ${attempt}/${maxRetries}...`
            );
            lastError = coldStartError;
            if (attempt < maxRetries) {
              console.warn(`⚠️ 502 cold start detected on attempt ${attempt}, retrying...`);
              continue; // Retry this attempt
            }
            throw coldStartError;
          }
          
          // Other errors - don't retry
          if (response.status === 404) {
            throw new Error(`Not Found (404): The CV generation endpoint was not found. Please check if the service is properly deployed.`);
          } else if (response.status === 413) {
            throw new Error(`Payload Too Large (413): The CV data is too large to process. Try reducing the amount of content.`);
          } else if (response.status === 429) {
            throw new Error(`Rate Limited (429): Too many requests. Please wait a moment before trying again.`);
          } else if (response.status === 500) {
            // Handle 500 errors with more specific messaging
            let errorMessage = `Internal Server Error (500): ${response.statusText}`;
            if (errorText) {
              try {
                const errorData = JSON.parse(errorText);
                if (errorData.error?.code === 'PDF_GENERATION_FAILED') {
                  errorMessage = `PDF generation timed out on the server. This can happen with large CVs or during high server load. `;
                  if (errorData.error.fallbackAvailable) {
                    errorMessage += `A fallback option may be available - please try again or contact support.`;
                  } else {
                    errorMessage += `Please try reducing the content size or try again later.`;
                  }
                } else {
                  errorMessage += ` - ${errorData.error?.message || errorText}`;
                }
              } catch {
                errorMessage += errorText ? ` - ${errorText}` : '';
              }
            }
            throw new Error(errorMessage);
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
          }
        }

        const result = await response.json();
        console.log('✅ CV Generation successful:', result);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        // Handle network errors that might be cold starts
        if (error instanceof Error) {
          if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            console.warn(`⚠️ Timeout error on attempt ${attempt}, will retry...`);
            if (attempt < maxRetries) continue;
            throw new Error('The CV generation service is taking longer than expected to respond. This often happens during "cold starts" when the service hasn\'t been used recently. Please wait a moment and try again.');
          }
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn(`⚠️ Network error on attempt ${attempt}, will retry...`);
            if (attempt < maxRetries) continue;
            throw new Error('Unable to connect to the CV generation service. This could be due to the service starting up (cold start) or temporary network issues. Please try again in a moment.');
          }
        }
        
        // For other errors, don't retry
        throw error;
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('CV generation failed after multiple attempts');
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
    const validation = this.validatePayload(cvData);
    if (!validation.valid) {
      throw new Error(`Invalid payload: ${validation.errors.join(', ')}`);
    }
    
    const response = await fetch(`${this.baseUrl}/api/batch/formats`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': this.apiKey,
        'Origin': window.location.origin
      },
      body: JSON.stringify(cvData),
      signal: AbortSignal.timeout(120000) // Longer timeout for batch processing
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: { 
          'Accept': 'application/json',
          'X-API-Key': this.apiKey,
          'Origin': window.location.origin
        },
        signal: AbortSignal.timeout(10000)
      });
      return response.ok;
    } catch (error) {
      console.warn('Health check failed:', error);
      return false;
    }
  }

  validatePayload(payload: ConsultantCVPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required personal info
    if (!payload.personalInfo?.name?.trim()) {
      errors.push('Personal info: Name is required and cannot be empty');
    }
    
    if (!payload.personalInfo?.title?.trim()) {
      errors.push('Personal info: Title is required and cannot be empty');
    }
    
    if (!payload.personalInfo?.email?.trim()) {
      errors.push('Personal info: Email is required and cannot be empty');
    }

    // Required company
    if (!payload.company?.trim()) {
      errors.push('Company name is required');
    }

    // Required template and format
    if (!payload.template?.trim()) {
      errors.push('Template is required');
    }

    if (!payload.format?.trim()) {
      errors.push('Format is required');
    }

    // Validate format
    if (payload.format && !['pdf', 'docx', 'html'].includes(payload.format.toLowerCase())) {
      errors.push('Format must be one of: pdf, docx, html');
    }

    // Validate template
    const validTemplates = ['andervang-consulting', 'modern', 'classic'];
    if (payload.template && !validTemplates.includes(payload.template.toLowerCase())) {
      errors.push(`Template must be one of: ${validTemplates.join(', ')}`);
    }

    // Validate required arrays are present (can be empty but must exist)
    if (!Array.isArray(payload.employment)) {
      errors.push('Employment array is required (can be empty)');
    }
    
    if (!Array.isArray(payload.projects)) {
      errors.push('Projects array is required (can be empty)');
    }
    
    if (!Array.isArray(payload.competencies)) {
      errors.push('Competencies array is required (can be empty)');
    }
    
    if (!Array.isArray(payload.languages)) {
      errors.push('Languages array is required (can be empty)');
    }

    // Check for circular references or problematic data
    try {
      const jsonString = JSON.stringify(payload);
      if (jsonString.length > 5 * 1024 * 1024) { // 5MB limit
        errors.push('Payload is too large (over 5MB)');
      }
    } catch {
      errors.push('Payload contains circular references or non-serializable data');
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
