/**
 * Test script for encryption functionality
 * Run with: node test-encryption.js
 */

// Since we're in Node.js, we need to use the crypto module instead of Web Crypto API
const crypto = require('crypto');

// Simple encryption test functions (Node.js compatible)
function encryptText(text, password) {
  const algorithm = 'aes-256-gcm';
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  
  // Derive key from password
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  // Create cipher
  const cipher = crypto.createCipherGCM(algorithm, key, iv);
  
  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Return encrypted data as JSON
  return JSON.stringify({
    data: encrypted,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  });
}

function decryptText(encryptedData, password) {
  const parsed = JSON.parse(encryptedData);
  const algorithm = 'aes-256-gcm';
  
  // Convert back from base64
  const salt = Buffer.from(parsed.salt, 'base64');
  const iv = Buffer.from(parsed.iv, 'base64');
  const authTag = Buffer.from(parsed.authTag, 'base64');
  
  // Derive the same key
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  // Create decipher
  const decipher = crypto.createDecipherGCM(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt
  let decrypted = decipher.update(parsed.data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Test the encryption
async function runTests() {
  console.log('🔐 Testing Encryption Functionality\n');
  
  const testCases = [
    {
      name: 'Simple Text',
      content: 'This is a secret message!',
      password: 'MySecurePassword123!'
    },
    {
      name: 'JSON Document',
      content: JSON.stringify({
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: 'Confidential client information goes here...'
          }]
        }]
      }),
      password: 'AnotherSecurePass456!'
    },
    {
      name: 'Special Characters',
      content: 'Client: Åsa Öberg\nProject: €1,000,000 deal\nNotes: Very sensitive! 🔒',
      password: 'Complex!Pa$$w0rd@2024'
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`Test ${i + 1}: ${test.name}`);
    console.log('─'.repeat(40));
    
    try {
      // Test encryption
      console.log('Original content:', test.content.substring(0, 50) + '...');
      
      const encrypted = encryptText(test.content, test.password);
      console.log('✅ Encryption successful');
      console.log('Encrypted size:', encrypted.length, 'bytes');
      
      // Verify it looks encrypted
      const parsedEncrypted = JSON.parse(encrypted);
      console.log('Encrypted data preview:', parsedEncrypted.data.substring(0, 20) + '...');
      
      // Test decryption with correct password
      const decrypted = decryptText(encrypted, test.password);
      console.log('✅ Decryption successful');
      
      // Verify content matches
      if (decrypted === test.content) {
        console.log('✅ Content verification passed');
      } else {
        console.log('❌ Content verification failed!');
        console.log('Expected:', test.content);
        console.log('Got:', decrypted);
      }
      
      // Test decryption with wrong password
      try {
        decryptText(encrypted, 'wrongpassword');
        console.log('❌ Security test failed - wrong password should not work!');
      } catch (error) {
        console.log('✅ Security test passed - wrong password correctly rejected');
      }
      
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
    
    console.log('');
  }
  
  // Performance test
  console.log('🚀 Performance Test');
  console.log('─'.repeat(40));
  
  const largeContent = 'A'.repeat(10000); // 10KB of data
  const password = 'PerformanceTestPassword123!';
  
  const startTime = Date.now();
  const encrypted = encryptText(largeContent, password);
  const encryptTime = Date.now() - startTime;
  
  const decryptStart = Date.now();
  const decrypted = decryptText(encrypted, password);
  const decryptTime = Date.now() - decryptStart;
  
  console.log(`Encryption time: ${encryptTime}ms`);
  console.log(`Decryption time: ${decryptTime}ms`);
  console.log(`Original size: ${largeContent.length} bytes`);
  console.log(`Encrypted size: ${encrypted.length} bytes`);
  console.log(`Compression ratio: ${(encrypted.length / largeContent.length * 100).toFixed(1)}%`);
  
  if (decrypted === largeContent) {
    console.log('✅ Performance test passed');
  } else {
    console.log('❌ Performance test failed');
  }
  
  console.log('\n🎉 All tests completed!');
  
  // Security recommendations
  console.log('\n🔒 Security Recommendations:');
  console.log('─'.repeat(40));
  console.log('✅ Use passwords with at least 12 characters');
  console.log('✅ Include uppercase, lowercase, numbers, and symbols');
  console.log('✅ Store master password in a password manager');
  console.log('✅ Never share encryption passwords');
  console.log('⚠️  Backup your master password securely');
  console.log('⚠️  If you lose the password, data cannot be recovered');
}

// Run the tests
runTests().catch(console.error);
