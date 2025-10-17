// Large CV Payload Optimization Test
async function testLargePayloadOptimization() {
  console.log('🧪 Testing Large CV Payload Optimization...');
  
  // Your actual payload size: 38,766 bytes
  console.log('📊 Your current CV stats:');
  console.log('• Employment entries: 35 (very large!)');
  console.log('• Payload size: 38,766 bytes');
  console.log('• This causes PDF generation timeouts');
  
  console.log('\n🔧 Optimization Strategy:');
  console.log('• Limit employment to 15 most recent entries');
  console.log('• Truncate descriptions to 400 characters');
  console.log('• Limit achievements to 3 per job');
  console.log('• Limit technologies to 10 per job');
  console.log('• Reduce skills and competencies');
  
  console.log('\n💡 Immediate Solutions:');
  console.log('1. Deploy updated code (auto-optimization)');
  console.log('2. Manually reduce employment entries');
  console.log('3. Shorten job descriptions');
  console.log('4. Try different template (some render faster)');
  
  // Test with smaller payload
  const smallerPayload = {
    personalInfo: {
      name: "Test User",
      title: "Developer",
      email: "test@example.com",
      phone: "+46 70 123 4567",
      location: "Stockholm"
    },
    company: "Test Company",
    summary: {
      introduction: "Short summary",
      highlights: ["Test 1", "Test 2"],
      specialties: ["React", "TypeScript"]
    },
    employment: [
      {
        period: "2024 - pågående",
        position: "Developer",
        company: "Test Co",
        description: "Short description",
        technologies: ["React", "TypeScript"],
        achievements: ["Achievement 1"]
      }
    ],
    projects: [],
    education: [],
    certifications: [],
    competencies: [{
      category: "Frontend",
      items: ["React", "TypeScript", "JavaScript"]
    }],
    skills: [{
      category: "Development",
      items: [
        { name: "React", level: 5 },
        { name: "TypeScript", level: 5 }
      ]
    }],
    languages: [{
      language: "Svenska",
      proficiency: "Modersmål"
    }],
    template: "andervang-consulting",
    format: "pdf",
    styling: {
      primaryColor: "#003D82",
      accentColor: "#FF6B35"
    }
  };
  
  console.log('\n🚀 Testing with optimized smaller payload...');
  console.log('📦 Test payload size:', JSON.stringify(smallerPayload).length, 'bytes');
  
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
      body: JSON.stringify(smallerPayload),
      signal: AbortSignal.timeout(120000)
    });
    
    console.log(`📡 Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Smaller payload works');
      console.log('💡 Solution: Reduce your CV content size');
      return result;
    } else {
      const errorText = await response.text();
      console.error('❌ Even small payload failed:', errorText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Recommendations specifically for your CV
function getPersonalizedRecommendations() {
  console.log('🎯 Personalized Recommendations for Your CV:');
  
  console.log('\n📝 Content Optimization:');
  console.log('• Combine similar roles (e.g., merge multiple short contracts)');
  console.log('• Keep only last 10-15 years of experience');
  console.log('• Shorten job descriptions to 2-3 sentences max');
  console.log('• Limit achievements to top 3 per role');
  console.log('• Remove older/less relevant technologies');
  
  console.log('\n⚡ Quick Wins:');
  console.log('• Remove base64 profile image (saves ~1KB)');
  console.log('• Reduce competencies categories from 3 to 2');
  console.log('• Limit skills per category to 8-10');
  console.log('• Combine similar employment entries');
  
  console.log('\n🚀 Try This Order:');
  console.log('1. Deploy updated code (gets auto-optimization)');
  console.log('2. If still failing, manually reduce content');
  console.log('3. Test with minimal template first');
  console.log('4. Gradually add content back');
}

if (typeof window !== 'undefined') {
  window.testLargePayloadOptimization = testLargePayloadOptimization;
  window.getPersonalizedRecommendations = getPersonalizedRecommendations;
  
  console.log('🧪 Large payload optimization test loaded');
  console.log('👉 Run testLargePayloadOptimization() - test smaller payload');
  console.log('👉 Run getPersonalizedRecommendations() - get specific advice');
}