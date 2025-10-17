// Test script to debug CORS and API request issues
// This simulates the actual request that would be made in production

const testAPIRequest = async () => {
  console.log('🧪 Testing CV Generation API Request...\n');
  
  // Production API endpoint (same as in your app)
  const endpoint = 'https://andervang-cv.netlify.app/.netlify/functions/api';
  
  // Minimal test payload (matching your app's structure)
  const testPayload = {
    personalInfo: {
      name: 'Test User',
      title: 'Test Title',
      email: 'test@example.com',
      phone: '+46 70 123 4567',
      location: 'Stockholm, Sweden'
    },
    company: 'Test Company',
    summary: {
      introduction: 'Test introduction',
      highlights: ['Test highlight'],
      specialties: ['Test specialty']
    },
    employment: [],
    projects: [],
    education: [],
    certifications: [],
    competencies: [
      {
        category: 'Test Category',
        items: ['Test Skill']
      }
    ],
    languages: [
      {
        language: 'English',
        proficiency: 'Fluent'
      }
    ],
    template: 'andervang-consulting',
    format: 'pdf',
    styling: {
      primaryColor: '#003D82',
      accentColor: '#FF6B35'
    }
  };
  
  console.log('📡 Endpoint:', endpoint);
  console.log('📦 Payload size:', JSON.stringify(testPayload).length, 'bytes');
  
  try {
    console.log('\n🚀 Making API request...');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': 'dev-api-key-12345',
        'Origin': 'https://consultant-time-track.netlify.app'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        errorText = 'Could not read response body';
      }
      
      console.error('❌ Request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      // Analyze specific error types
      if (response.status === 502) {
        console.log('💡 502 Bad Gateway - Possible causes:');
        console.log('   - Netlify function crashed or timed out');
        console.log('   - Function not properly deployed');
        console.log('   - Cold start timeout');
        console.log('   - Invalid payload format');
      }
      
      if (response.status === 0 || errorText.includes('CORS')) {
        console.log('💡 CORS Issue - Possible causes:');
        console.log('   - API endpoint does not allow cross-origin requests');
        console.log('   - Missing CORS headers on server side');
        console.log('   - Preflight OPTIONS request failing');
      }
      
      return;
    }
    
    const result = await response.json();
    console.log('✅ Request successful!');
    console.log('📋 Response:', result);
    
  } catch (error) {
    console.error('❌ Request error:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('\n💡 "Failed to fetch" error - Possible causes:');
      console.log('   - Network connectivity issue');
      console.log('   - CORS policy blocking the request');
      console.log('   - Server not responding (502/503 error)');
      console.log('   - DNS resolution failure');
    }
    
    if (error.name === 'AbortError') {
      console.log('💡 Request was aborted (likely timeout)');
    }
  }
};

// Test a simple OPTIONS preflight request
const testPreflightRequest = async () => {
  console.log('\n🔍 Testing CORS Preflight (OPTIONS)...');
  
  try {
    const response = await fetch('https://andervang-cv.netlify.app/.netlify/functions/api', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://consultant-time-track.netlify.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, X-API-Key'
      }
    });
    
    console.log('OPTIONS Response:', response.status, response.statusText);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    });
    
  } catch (error) {
    console.error('OPTIONS request failed:', error);
  }
};

// Run tests
testAPIRequest().then(() => {
  return testPreflightRequest();
}).catch(console.error);