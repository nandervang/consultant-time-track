interface CVAPIConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  isDev: boolean;
  useLocalAPI: boolean;
  headers: {
    'Content-Type': string;
    'X-API-Key': string;
  };
}

const isDev = import.meta.env.DEV as boolean;
const useLocalAPI = import.meta.env.VITE_USE_LOCAL_CV_API === 'true';

// Determine which API URL to use based on the flag
const getAPIUrl = (): string => {
  if (useLocalAPI) {
    return import.meta.env.VITE_CV_API_URL_LOCAL || 'http://localhost:8888/.netlify/functions';
  }
  return import.meta.env.VITE_CV_API_URL_REMOTE || 'https://andervang-cv.netlify.app/.netlify/functions';
};

export const CV_API_CONFIG: CVAPIConfig = {
  // Use local or remote based on environment flag
  baseUrl: getAPIUrl(),
  
  // API key (required for Netlify Functions)
  apiKey: import.meta.env.VITE_CV_API_KEY || 'dev-api-key-12345',
  
  // Increase timeout for serverless functions
  timeout: 45000, // 45 seconds (increased for cold starts)
  
  // Development flags
  isDev,
  useLocalAPI,

  // Default headers for all requests
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_CV_API_KEY || 'dev-api-key-12345'
  }
};