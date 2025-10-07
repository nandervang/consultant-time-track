// Test script to verify PDF download functionality
import { downloadFile, generateCVFilename, getMimeType, isBase64DataUrl, extractBase64Content, base64ToBlob } from '../src/utils/fileDownload.js';

// Test the utility functions
console.log('Testing file download utilities...\n');

// Test 1: Check if base64 data URL detection works
const testDataUrl = 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8';
const testRegularUrl = 'https://example.com/file.pdf';

console.log('1. Base64 URL detection:');
console.log(`   Data URL detected: ${isBase64DataUrl(testDataUrl)}`); // Should be true
console.log(`   Regular URL detected: ${isBase64DataUrl(testRegularUrl)}`); // Should be false

// Test 2: Extract base64 content
console.log('\n2. Base64 content extraction:');
try {
  const extracted = extractBase64Content(testDataUrl);
  console.log(`   Extracted: ${extracted.substring(0, 20)}...`);
} catch (error) {
  console.log(`   Error: ${error.message}`);
}

// Test 3: Generate filename
console.log('\n3. Filename generation:');
const personalInfo = { fullName: 'John Doe' };
const filename = generateCVFilename(personalInfo, 'pdf', 'Frank Digital');
console.log(`   Generated filename: ${filename}`);

// Test 4: MIME type detection
console.log('\n4. MIME type detection:');
console.log(`   PDF MIME: ${getMimeType('pdf')}`);
console.log(`   HTML MIME: ${getMimeType('html')}`);
console.log(`   DOCX MIME: ${getMimeType('docx')}`);

// Test 5: Blob creation from base64
console.log('\n5. Blob creation test:');
try {
  const shortBase64 = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
  const blob = base64ToBlob(shortBase64, 'text/plain');
  console.log(`   Blob created: ${blob.size} bytes, type: ${blob.type}`);
} catch (error) {
  console.log(`   Error: ${error.message}`);
}

console.log('\nAll tests completed!');