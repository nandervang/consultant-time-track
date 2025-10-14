// Test utility to verify sample data works with API payload transformation
import { niklasCV } from '@/data/niklasCV';
import type { CVGenerationData } from '@/types/cvGeneration';

// Test payload transformation (this mirrors the logic in CVGenerationAPI)
function transformToAPIPayload(cvData: CVGenerationData) {
  const payload = {
    personalInfo: {
      name: cvData.personalInfo.name,
      email: cvData.personalInfo.email,
      phone: cvData.personalInfo.phone,
      location: cvData.personalInfo.location,
      summary: cvData.summary?.introduction,
      website: cvData.personalInfo.website,
      linkedin: cvData.personalInfo.linkedIn,
      github: cvData.personalInfo.github,
      profilePhoto: cvData.personalInfo.profilePhoto
    },
    experience: cvData.experience.map(exp => ({
      company: exp.company,
      title: exp.position, // Map position to title
      period: exp.period,
      description: exp.description,
      achievements: exp.achievements,
      technologies: exp.technologies
    })),
    skills: cvData.skills.map(skill => ({
      category: skill.category,
      items: skill.items
    })),
    education: cvData.education?.map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      period: edu.period,
      gpa: edu.gpa
    })) || [],
    projects: cvData.projects?.map(project => ({
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      url: project.url
    })) || [],
    certifications: cvData.certifications?.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
      credentialId: cert.credentialId
    })) || [],
    languages: cvData.languages?.map(lang => ({
      language: lang.language,
      proficiency: lang.proficiency
    })) || [],
    template: cvData.template || cvData.templateSettings?.template || 'andervang-consulting',
    format: cvData.format || 'pdf'
  };

  return JSON.parse(JSON.stringify(payload));
}

export function testSampleDataTransformation() {
  console.log('Testing sample data transformation...');
  
  // Add the required fields to sample data (same as handleLoadSampleData)
  const sampleData = {
    ...niklasCV as CVGenerationData,
    template: 'andervang-consulting',
    format: 'pdf'
  };
  
  try {
    const apiPayload = transformToAPIPayload(sampleData);
    
    // Validate required fields
    const validation = {
      hasPersonalInfoName: !!apiPayload.personalInfo.name,
      hasExperience: Array.isArray(apiPayload.experience) && apiPayload.experience.length > 0,
      hasValidExperienceTitle: apiPayload.experience.every((exp: { title: string }) => !!exp.title),
      hasSkills: Array.isArray(apiPayload.skills) && apiPayload.skills.length > 0,
      hasTemplate: !!apiPayload.template,
      hasFormat: !!apiPayload.format,
      experienceCount: apiPayload.experience.length,
      skillsCount: apiPayload.skills.length,
      // New validation for Andervang Consulting features
      hasRoles: Array.isArray(apiPayload.roles) && apiPayload.roles.length > 0,
      hasCompetencies: Array.isArray(apiPayload.competencies) && apiPayload.competencies.length > 0,
      hasSpecialties: Array.isArray(apiPayload.summary?.specialties) && apiPayload.summary.specialties.length > 0,
      hasProjectTypes: apiPayload.projects?.every((project: { type?: string }) => !!project.type) || false,
      hasClosing: !!apiPayload.closing?.text,
      rolesCount: apiPayload.roles?.length || 0,
      competenciesCount: apiPayload.competencies?.length || 0
    };
    
    console.log('✅ Sample data transformation successful!');
    console.log('Validation results:', validation);
    
    // Show first experience entry to verify title mapping
    if (apiPayload.experience.length > 0) {
      console.log('First experience entry:', {
        company: apiPayload.experience[0].company,
        title: apiPayload.experience[0].title,
        period: apiPayload.experience[0].period
      });
    }
    
    return { success: true, payload: apiPayload, validation };
  } catch (error) {
    console.error('❌ Sample data transformation failed:', error);
    return { success: false, error };
  }
}

// Run test if this file is executed directly (for development)
if (typeof window !== 'undefined' && (window as { testSampleData?: boolean }).testSampleData) {
  testSampleDataTransformation();
}