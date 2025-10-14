// Test utility for CV Generation API
import { cvGenerationAPI } from '@/services/cvGenerationAPI';

// Minimal test payload that matches OpenAPI specification
export const createTestPayload = () => {
  return {
    personalInfo: {
      name: "John Doe",
      title: "Software Developer", // This will be mapped to experience.title
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      linkedIn: "https://linkedin.com/in/johndoe",
      github: "https://github.com/johndoe",
      website: "https://johndoe.dev"
    },
    summary: {
      introduction: "Experienced software developer with 5+ years of expertise in full-stack development",
      keyStrengths: ["React", "Node.js", "TypeScript"],
      careerObjective: "Seeking senior developer role"
    },
    experience: [
      {
        company: "TechCorp Inc",
        position: "Senior Developer", // This will be mapped to title
        period: "2022 - Present",
        description: "Lead development team for web applications",
        technologies: ["React", "Node.js", "PostgreSQL"],
        achievements: [
          "Increased application performance by 40%",
          "Led migration to microservices architecture"
        ]
      }
    ],
    skills: [
      {
        category: "Frontend Technologies",
        items: ["React", "Vue.js", "TypeScript", "Next.js"]
      },
      {
        category: "Backend Technologies",
        items: ["Node.js", "Python", "PostgreSQL", "MongoDB"]
      }
    ],
    education: [
      {
        institution: "University of California, Berkeley",
        degree: "Bachelor of Science in Computer Science",
        field: "Computer Science",
        period: "2014 - 2018",
        gpa: "3.8/4.0"
      }
    ],
    projects: [],
    certifications: [],
    courses: [],
    languages: [
      {
        language: "English",
        proficiency: "Native"
      }
    ],
    templateSettings: {
      template: "andervang-consulting",
      theme: "professional",
      showPhoto: false,
      showReferences: false,
      language: "en",
      fontSize: "medium",
      margins: "normal",
      colorScheme: "blue"
    },
    template: "andervang-consulting",
    format: "pdf"
  };
};

// Test function to check API connectivity
export const testCVAPIConnection = async () => {
  console.log('🧪 Testing CV API Connection...');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const health = await cvGenerationAPI.checkHealth();
    console.log('✅ Health check result:', health);

    // Test 2: Get Templates
    console.log('2. Testing templates endpoint...');
    const templates = await cvGenerationAPI.getTemplates();
    console.log('✅ Templates result:', templates);

    // Test 3: Generate CV (optional - only if health passes)
    if (health.status === 'healthy') {
      console.log('3. Testing CV generation...');
      const testData = createTestPayload();
      const result = await cvGenerationAPI.generateCV(testData);
      console.log('✅ CV Generation result:', result);
    }

    return { success: true, health, templates };
  } catch (error) {
    console.error('❌ API Test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Quick test for CORS/connectivity issues
export const quickAPITest = async () => {
  try {
    console.log('🚀 Quick API Test...');
    const health = await cvGenerationAPI.checkHealth();
    console.log('Result:', health);
    return health;
  } catch (error) {
    console.error('Quick test failed:', error);
    throw error;
  }
};