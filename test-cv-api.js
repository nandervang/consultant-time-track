// Simple test script to verify CV API endpoints
const baseUrl = 'https://andervang-cv.netlify.app';

async function testAPI() {
  console.log('Testing CV API endpoints...\n');
  
  // Test 1: Health check (main page)
  try {
    console.log('1. Testing main page health check...');
    const healthResponse = await fetch(`${baseUrl}/`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   OK: ${healthResponse.ok}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Templates endpoint
  try {
    console.log('\n2. Testing templates endpoint...');
    const templatesResponse = await fetch(`${baseUrl}/api/templates`);
    console.log(`   Status: ${templatesResponse.status}`);
    console.log(`   OK: ${templatesResponse.ok}`);
    if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      console.log(`   Templates found: ${Array.isArray(templates) ? templates.length : 'Unknown'}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Generation endpoint (without payload - should return error but indicate endpoint exists)
  try {
    console.log('\n3. Testing generation endpoint...');
    const generateResponse = await fetch(`${baseUrl}/api/generate/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(`   Status: ${generateResponse.status}`);
    console.log(`   Endpoint exists: ${generateResponse.status !== 404}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\nAPI test complete!');
}

testAPI();