import { CVGenerationData, CVCustomization } from '@/types/cvGeneration';

// CV Generation API Client
const CV_API_CONFIG = {
  baseUrl: import.meta.env.VITE_CV_API_URL || 'https://andervang-cv.netlify.app',
  apiKey: import.meta.env.VITE_CV_API_KEY || 'dev-api-key-12345',
  timeout: 30000 // 30 seconds for generation requests
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
      // Use templates endpoint as health check since it supports CORS
      const result = await this.makeRequest('/api/templates');
      return { 
        status: 'healthy', 
        message: 'API is accessible',
        templatesCount: result?.data?.length || 0
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

  // Generate CV
  async generateCV(cvData: CVGenerationData) {
    return this.makeRequest('/api/generate/complete', {
      method: 'POST',
      body: JSON.stringify(cvData)
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