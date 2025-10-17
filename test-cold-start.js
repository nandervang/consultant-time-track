// Enhanced Cold Start Test - Run this in production console
async function testColdStartHandling() {
  console.log('🧪 Testing Enhanced Cold Start Handling...');
  
  const testPayload = {
    personalInfo: {
      name: 'Cold Start Test',
      title: 'Test Engineer',
      email: 'coldstart@test.com',
      phone: '+46 70 123 4567',
      location: 'Stockholm, Sweden'
    },
    company: 'Test Company',
    summary: {
      introduction: 'Testing cold start handling',
      highlights: ['Retry Logic', 'Exponential Backoff'],
      specialties: ['Error Handling', 'User Experience']
    },
    employment: [],
    projects: [],
    education: [],
    certifications: [],
    competencies: [{
      category: 'Testing',
      items: ['Cold Start Recovery']
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
  
  console.log('📦 Test payload size:', JSON.stringify(testPayload).length, 'bytes');
  console.log('🔄 This test includes retry logic for 502 errors and timeouts');
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting CV generation (with retry logic)...');
    
    // Simulate the enhanced API call with retry logic
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
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
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(120000) // 2 minute timeout
        });
        
        console.log(`📡 Attempt ${attempt} - Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          if (response.status === 502) {
            const errorMsg = `502 Bad Gateway (attempt ${attempt}/${maxRetries}) - Cold start detected`;
            console.warn(`⚠️ ${errorMsg}`);
            lastError = new Error(errorMsg);
            if (attempt < maxRetries) continue;
            throw lastError;
          }
          
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        const duration = Date.now() - startTime;
        
        console.log(`✅ SUCCESS! CV generated successfully on attempt ${attempt}`);
        console.log(`⏱️ Total time: ${duration}ms`);
        console.log(`📄 Result:`, {
          success: result.success,
          format: result.data?.format,
          filename: result.data?.filename,
          attempt: attempt,
          duration: `${duration}ms`
        });
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          console.warn(`⚠️ Timeout on attempt ${attempt}, will retry...`);
          if (attempt < maxRetries) continue;
        }
        
        if (error.message.includes('Failed to fetch')) {
          console.warn(`⚠️ Network error on attempt ${attempt}, will retry...`);
          if (attempt < maxRetries) continue;
        }
        
        // For other errors, don't retry
        throw error;
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ FAILED after ${duration}ms:`, error.message);
    
    if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
      console.log('💡 This is likely a cold start issue. The function needs time to initialize.');
      console.log('🔄 Try again in 30-60 seconds - subsequent requests should be faster.');
    }
    
    throw error;
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.testColdStartHandling = testColdStartHandling;
  console.log('🧪 Enhanced cold start test loaded');
  console.log('👉 Run testColdStartHandling() to test retry logic');
}