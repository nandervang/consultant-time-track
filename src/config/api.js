const isDev = import.meta.env.DEV;

export const CV_API_CONFIG = {
  // Use your deployed Netlify functions
  baseUrl: import.meta.env.VITE_CV_API_URL || 'https://andervang-cv.netlify.app/.netlify/functions',
  
  // API key (required for Netlify Functions)
  apiKey: import.meta.env.VITE_CV_API_KEY || 'dev-api-key-12345',
  
  // Increase timeout for serverless functions
  timeout: 45000, // 45 seconds (increased for cold starts)
  
  // Development flag
  isDev,

  // Default headers for all requests
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_CV_API_KEY || 'dev-api-key-12345'
  }
};