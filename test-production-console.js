// Quick production test - copy this into browser console on production site
async function testProductionCVAPI() {
  console.log('🧪 Testing CV API from production browser environment...');
  
  const testPayload = {
    personalInfo: {
      name: 'Production Test User',
      title: 'Test Developer',
      email: 'test@example.com',
      phone: '+46 70 123 4567',
      location: 'Stockholm, Sweden'
    },
    company: 'Test Company',
    summary: {
      introduction: 'Production test',
      highlights: ['Test'],
      specialties: ['Testing']
    },
    employment: [],
    projects: [],
    education: [],
    certifications: [],
    competencies: [{
      category: 'Testing',
      items: ['Manual Testing']
    }],
    languages: [{
      language: 'English',
      proficiency: 'Fluent'
    }],
    template: 'andervang-consulting',
    format: 'pdf',
    styling: {
      primaryColor: '#003D82',
      accentColor: '#FF6B35'
    }
  };
  
  console.log('📦 Testing with payload size:', JSON.stringify(testPayload).length, 'bytes');
  console.log('🌐 Current origin:', window.location.origin);
  
  try {
    console.log('🚀 Making request to CV API...');
    
    const response = await fetch('https://andervang-cv.netlify.app/.netlify/functions/api', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': 'dev-api-key-12345',
        'Origin': window.location.origin
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📡 Response:', response.status, response.statusText);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! CV generation worked from production');
      console.log('📄 Result:', {
        success: result.success,
        format: result.data?.format,
        filename: result.data?.filename,
        generatedAt: result.data?.generatedAt,
        dataSize: result.data?.fileUrl ? 'Present (PDF data)' : 'Missing'
      });
      return result;
    } else {
      const errorText = await response.text();
      console.error('❌ FAILED! Response:', errorText);
      throw new Error(`${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ FAILED! Error:', error);
    
    if (error.message.includes('Failed to fetch')) {
      console.error('💡 This is likely a CORS or network issue');
    }
    
    throw error;
  }
}

// Auto-run if this file is being executed
if (typeof window !== 'undefined') {
  console.log('🧪 Production CV API test loaded');
  console.log('👉 Run testProductionCVAPI() in console to test');
  
  // Make it available globally
  window.testProductionCVAPI = testProductionCVAPI;
}