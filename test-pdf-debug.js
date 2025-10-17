// PDF Generation Debug Test - Run this in production console
async function debugPDFTimeout() {
  console.log('🔍 Debugging PDF Generation Timeout...');
  
  // Test with minimal payload first
  const minimalPayload = {
    personalInfo: {
      name: 'Test User',
      title: 'Developer',
      email: 'test@example.com',
      phone: '+46 70 123 4567',
      location: 'Stockholm'
    },
    company: 'Test Co',
    summary: {
      introduction: 'Short intro',
      highlights: ['Quick test'],
      specialties: ['Testing']
    },
    employment: [],
    projects: [],
    education: [],
    certifications: [],
    competencies: [],
    skills: [],
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
  
  console.log('📦 Testing with minimal payload:', JSON.stringify(minimalPayload).length, 'bytes');
  
  try {
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
      body: JSON.stringify(minimalPayload),
      signal: AbortSignal.timeout(120000)
    });
    
    console.log(`📡 Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Minimal payload SUCCESS! PDF generation works with small data');
      console.log('💡 Issue is likely with your current CV data size/complexity');
      return result;
    } else {
      const errorText = await response.text();
      console.error('❌ Even minimal payload failed:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.code === 'PDF_GENERATION_FAILED') {
          console.log('🚨 PDF generation is failing even with minimal data');
          console.log('💡 This suggests a server-side issue with the PDF library');
        }
      } catch (e) {
        // Error text isn't JSON
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

async function analyzeCurrentPayload() {
  console.log('🔍 Analyzing your current CV payload...');
  
  // Try to get the current CV data from the page
  // This is a rough attempt - you may need to adapt based on your UI
  console.log('💡 To debug your specific payload:');
  console.log('1. Open DevTools Network tab');
  console.log('2. Try generating your CV');
  console.log('3. Look at the request payload in the failed request');
  console.log('4. Check for very long text fields that might cause timeouts');
  
  console.log('🔧 Potential solutions:');
  console.log('• Reduce text in job descriptions (limit to ~500 words each)');
  console.log('• Limit project descriptions (limit to ~300 words each)');
  console.log('• Reduce number of skills/competencies');
  console.log('• Try a different template');
}

if (typeof window !== 'undefined') {
  window.debugPDFTimeout = debugPDFTimeout;
  window.analyzeCurrentPayload = analyzeCurrentPayload;
  
  console.log('🔍 PDF Debug tools loaded:');
  console.log('👉 Run debugPDFTimeout() - test with minimal data');
  console.log('👉 Run analyzeCurrentPayload() - get optimization tips');
}