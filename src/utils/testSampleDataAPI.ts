// Real API test for sample data
import { CVGenerationAPI } from '@/services/cvGenerationAPI';
import { niklasCV } from '@/data/niklasCV';
import type { CVGenerationData } from '@/types/cvGeneration';

export async function testSampleDataWithRealAPI() {
  console.log('🚀 Testing sample data with real CV API...');
  
  try {
    // Prepare sample data (same as handleLoadSampleData)
    const sampleData: CVGenerationData = {
      ...niklasCV as CVGenerationData,
      template: 'andervang-consulting',
      format: 'pdf'
    };
    
    console.log('📋 Sample data prepared:', {
      personalInfoName: sampleData.personalInfo.name,
      experienceCount: sampleData.experience.length,
      skillsCount: sampleData.skills.length,
      template: sampleData.template,
      format: sampleData.format
    });
    
    // Test API connection first
    const api = new CVGenerationAPI();
    
    console.log('🔍 Testing API health check...');
    const healthResult = await api.checkHealth();
    console.log('✅ Health check result:', healthResult);
    
    console.log('📄 Testing CV generation with sample data...');
    const generateResult = await api.generateCV(sampleData);
    console.log('✅ CV generation result:', {
      success: !!generateResult?.data?.fileUrl,
      format: generateResult?.data?.format,
      generatedAt: generateResult?.data?.generatedAt,
      filename: generateResult?.data?.filename,
      hasFileUrl: !!generateResult?.data?.fileUrl
    });
    
    return {
      success: true,
      healthCheck: healthResult,
      generation: generateResult
    };
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Add to console for manual testing
if (typeof window !== 'undefined') {
  type TestFunction = () => Promise<{ success: boolean; healthCheck?: unknown; generation?: unknown; error?: string }>;
  (window as { testSampleAPIReal?: TestFunction }).testSampleAPIReal = testSampleDataWithRealAPI;
  console.log('🧪 Real API test loaded. Run testSampleAPIReal() in console to test with actual API.');
}