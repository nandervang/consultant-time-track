// Data Transformer: Convert internal CV format to API payload format
import type { CVGenerationData } from '@/types/cvGeneration';
import type { CVAPIPayload, CVAPICompetency } from '@/types/cv-api-types';
import type { ConsultantCVPayload } from '@/services/cv-generation-api';
import { niklasCV } from '../data/niklasCV';

/**
 * Transform CVAPIPayload to ConsultantCVPayload format
 * This function handles the type conversion between our internal API format
 * and the cv-gen repository's expected format
 */
export function convertToConsultantPayload(apiPayload: CVAPIPayload): ConsultantCVPayload {
  // Map our CVAPIPayload structure to ConsultantCVPayload structure
  const consultantPayload: ConsultantCVPayload = {
    personalInfo: {
      name: apiPayload.personalInfo.name,
      title: apiPayload.personalInfo.title,
      email: apiPayload.personalInfo.email,
      phone: apiPayload.personalInfo.phone || '',
      location: apiPayload.personalInfo.location || '',
      profileImage: apiPayload.personalInfo.profileImage
    },
    company: apiPayload.company,
    summary: {
      introduction: apiPayload.summary.introduction,
      highlights: apiPayload.summary.highlights,
      specialties: apiPayload.summary.specialties || []
    },
    employment: (apiPayload.employment || []).map(emp => ({
      period: emp.period,
      position: emp.position,
      company: emp.company,
      description: emp.description,
      technologies: emp.technologies || [],
      achievements: emp.achievements || []
    })),
    projects: (apiPayload.projects || []).map(proj => ({
      period: proj.period,
      type: proj.type,
      title: proj.title,
      description: proj.description,
      technologies: proj.technologies || []
    })),
    education: (apiPayload.education || []).map(edu => ({
      period: edu.period,
      degree: edu.degree,
      institution: edu.institution,
      specialization: edu.specialization
    })),
    certifications: (apiPayload.certifications || []).map(cert => ({
      year: cert.year,
      title: cert.title,
      issuer: cert.issuer,
      description: cert.description
    })),
    competencies: (apiPayload.competencies || []).map(comp => ({
      category: comp.category,
      items: comp.skills?.map(skill => skill.name) || []
    })),
    languages: (apiPayload.languages || []).map(lang => ({
      language: lang.language,
      proficiency: lang.proficiency
    })),
    template: apiPayload.template || 'andervang-consulting',
    format: apiPayload.format || 'pdf',
    styling: {
      primaryColor: apiPayload.styling?.primaryColor || '#003D82',
      accentColor: apiPayload.styling?.accentColor || '#FF6B35'
    }
  };

  return consultantPayload;
}

/**
 * Transform internal CV data structure to CV Generation API payload format
 */
export function transformToAPIPayload(
  cvData: CVGenerationData,
  options: {
    format?: 'pdf' | 'docx' | 'html';
    template?: 'andervang-consulting' | 'modern' | 'classic';
    company?: string;
  } = {}
): CVAPIPayload {
  const {
    format = 'pdf',
    template = 'andervang-consulting',
    company = 'Frank Digital AB'
  } = options;

  return {
    // Personal information (enhanced with all available fields)
    personalInfo: {
      name: cvData.personalInfo?.name || '',
      title: cvData.personalInfo?.title || '',
      email: cvData.personalInfo?.email || '',
      phone: cvData.personalInfo?.phone || '',
      location: cvData.personalInfo?.location || '',
      profileImage: cvData.personalInfo?.profilePhoto,
      linkedIn: cvData.personalInfo?.linkedIn,
      github: cvData.personalInfo?.github,
      website: cvData.personalInfo?.website
    },

    // Company name
    company,

    // Summary transformation
    summary: {
      introduction: cvData.summary?.introduction || '',
      highlights: cvData.summary?.keyStrengths || [],
      specialties: cvData.summary?.specialties || []
    },

    // Employment history (experience → employment)
    employment: cvData.experience?.map(exp => ({
      period: exp.period || '',
      position: exp.position || '',
      company: exp.company || '',
      description: exp.description || '',
      technologies: exp.technologies || [],
      achievements: exp.achievements || []
    })),

    // Projects transformation
    projects: cvData.projects?.map(proj => ({
      period: proj.period || 'Projektperiod',
      type: proj.type || 'Utvecklare',
      title: proj.name || '',
      description: proj.description || '',
      technologies: proj.technologies || [],
      achievements: proj.achievements || []
    })),

    // Education transformation
    education: cvData.education?.map(edu => ({
      period: edu.period || '',
      degree: edu.degree || '',
      institution: edu.institution || '',
      specialization: edu.field
    })),

    // Certifications transformation
    certifications: cvData.certifications?.map(cert => ({
      year: cert.date || '',
      title: cert.name || '',
      issuer: cert.issuer || '',
      description: cert.credentialId ? `Credential ID: ${cert.credentialId}` : undefined
    })),

    // Courses transformation (NEW)
    courses: cvData.courses?.map(course => ({
      name: course.name || '',
      provider: course.provider || '',
      completionDate: course.completionDate || '',
      duration: course.duration,
      credentialId: course.credentialId,
      url: course.url
    })),

    // Skills → Competencies transformation (grouping by proficiency)
    competencies: transformSkillsToCompetencies(cvData.skills || []),

    // Languages (direct mapping)
    languages: cvData.languages?.map(lang => ({
      language: lang.language || '',
      proficiency: lang.proficiency || ''
    })),

    // NEW SECTIONS: Roles, Competency Categories, and Closing
    roles: cvData.roles?.map(role => ({
      title: role.title || '',
      skills: role.skills || []
    })),

    competencyCategories: cvData.competencies?.map(comp => ({
      category: comp.category || '',
      skills: comp.skills?.map(skill => ({
        name: skill.name || '',
        level: skill.level || 'Intermediate',
        yearsOfExperience: skill.yearsOfExperience
      })) || []
    })),

    closing: cvData.closing ? {
      text: cvData.closing.text || '',
      contact: {
        email: cvData.closing.contact?.email || cvData.personalInfo?.email || '',
        phone: cvData.closing.contact?.phone || cvData.personalInfo?.phone || '',
        location: cvData.closing.contact?.location || cvData.personalInfo?.location || '',
        company: cvData.closing.contact?.company || company
      }
    } : undefined,

    templateSettings: cvData.templateSettings ? {
      template: cvData.templateSettings.template || template,
      theme: cvData.templateSettings.theme || 'blue',
      showPhoto: cvData.templateSettings.showPhoto ?? true,
      showReferences: cvData.templateSettings.showReferences ?? false,
      language: cvData.templateSettings.language || 'en',
      fontSize: cvData.templateSettings.fontSize || 'medium',
      margins: cvData.templateSettings.margins || 'normal',
      colorScheme: cvData.templateSettings.colorScheme || 'blue'
    } : undefined,

    // Template and format
    template,
    format,

    // Styling from template settings
    styling: {
      primaryColor: cvData.templateSettings?.colorScheme === 'blue' ? '#003D82' : undefined,
      accentColor: '#FF6B35',
      fontSize: (cvData.templateSettings?.fontSize === 'small' || 
                 cvData.templateSettings?.fontSize === 'large' || 
                 cvData.templateSettings?.fontSize === 'medium') 
                ? cvData.templateSettings.fontSize 
                : 'medium',
      spacing: cvData.templateSettings?.margins === 'compact' ? 'compact' : 
               cvData.templateSettings?.margins === 'relaxed' ? 'relaxed' : 'normal'
    }
  };
}

/**
 * Transform consultant data to Andervang CV format
 */
export function transformConsultantToAndervangCV(consultant: any): any {
  return {
    personalInfo: {
      name: `${consultant.firstName} ${consultant.lastName}`,
      title: consultant.currentRole || consultant.jobTitle || "Consultant",
      email: consultant.email,
      phone: consultant.phone || "",
      location: consultant.location || "",
      profileImage: consultant.profilePicture ? convertImageToBase64(consultant.profilePicture) : undefined
    },
    
    company: consultant.companyName || "Andervang Consulting",
    
    summary: {
      introduction: consultant.professionalSummary || consultant.bio || "",
      highlights: consultant.keyStrengths || [],
      specialties: consultant.specializations || []
    },
    
    employment: consultant.workHistory?.map((job: any) => ({
      period: formatPeriod(job.startDate, job.endDate),
      position: job.position,
      company: job.company,
      description: job.description,
      technologies: job.technologies || [],
      achievements: job.achievements || []
    })) || [],
    
    projects: consultant.projects?.map((project: any) => ({
      period: formatPeriod(project.startDate, project.endDate),
      type: project.role || 'Utvecklare',
      title: project.name,
      description: project.description,
      technologies: project.technologies || []
    })) || [],
    
    education: consultant.education?.map((edu: any) => ({
      period: formatPeriod(edu.startYear, edu.endYear),
      degree: edu.degree,
      institution: edu.institution,
      specialization: edu.specialization
    })) || [],
    
    certifications: consultant.certifications?.map((cert: any) => ({
      year: cert.year || cert.dateIssued,
      title: cert.name,
      issuer: cert.issuer,
      description: cert.description
    })) || [],
    
    competencies: transformSkillsToCompetencies(consultant.skills || []),
    
    languages: consultant.languages?.map((lang: any) => ({
      language: lang.language,
      proficiency: lang.proficiency
    })) || [],
    
    template: 'andervang-consulting', // Now supported by Netlify functions
    format: 'pdf',
    
    styling: {
      primaryColor: consultant.brandColors?.primary || "#003D82",
      accentColor: consultant.brandColors?.accent || "#FF6B35"
    }
  };
}

/**
 * Transform skills array (grouped by category) to competencies (grouped by proficiency level)
 */
function transformSkillsToCompetencies(
  skills: Array<{ category: string; items: string[] }>
): CVAPICompetency[] {
  if (!skills || skills.length === 0) return [];

  // Define proficiency mapping based on skill categories
  const categoryToProficiency: Record<string, string> = {
    'Expert inom området': 'expert',
    'Mycket hög kompetens': 'advanced',
    'Hög kompetens': 'advanced',
    'Grundläggande kompetens': 'intermediate'
  };

  // Map categories to proficiency levels
  const competencies: CVAPICompetency[] = [];

  // Group all skills by estimated proficiency
  skills.forEach(skillGroup => {
    const category = inferCompetencyCategory(skillGroup.category);
    const level = categoryToProficiency[category] || 'advanced';

    // Create competency entry
    const existingCompetency = competencies.find(c => c.category === category);
    
    const skillItems = skillGroup.items.map(skillName => ({
      name: skillName,
      level: level as 'beginner' | 'intermediate' | 'advanced' | 'expert'
    }));

    if (existingCompetency) {
      existingCompetency.skills.push(...skillItems);
    } else {
      competencies.push({
        category,
        skills: skillItems
      });
    }
  });

  return competencies;
}

/**
 * Infer competency category from skill category name
 */
function inferCompetencyCategory(categoryName: string): string {
  const lowerCategory = categoryName.toLowerCase();

  // Map technical categories to proficiency levels
  if (lowerCategory.includes('frontend') || 
      lowerCategory.includes('backend') ||
      lowerCategory.includes('tillgänglighet')) {
    return 'Expert inom området';
  }
  
  if (lowerCategory.includes('devops') || 
      lowerCategory.includes('cms') ||
      lowerCategory.includes('analys')) {
    return 'Mycket hög kompetens';
  }
  
  if (lowerCategory.includes('ledarskap') || 
      lowerCategory.includes('process')) {
    return 'Hög kompetens';
  }

  // Default to high competency
  return 'Hög kompetens';
}

/**
 * Helper function to format date periods
 * Converts various date formats to Swedish format: "månad år - månad år"
 */
export function formatPeriod(startDate: string, endDate?: string | null): string {
  if (!startDate) return '';
  
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 
                 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  
  const formatDate = (dateStr: string): string => {
    // Handle various date formats
    if (dateStr.includes('-')) {
      const [year, month] = dateStr.split('-');
      const monthIndex = parseInt(month) - 1;
      return `${months[monthIndex]} ${year}`;
    }
    
    // If already formatted, return as is
    return dateStr;
  };

  const formattedStart = formatDate(startDate);
  
  if (!endDate || endDate === 'pågående' || endDate.toLowerCase() === 'current') {
    return `${formattedStart} - pågående`;
  }
  
  const formattedEnd = formatDate(endDate);
  return `${formattedStart} - ${formattedEnd}`;
}

/**
 * Validate CV data before transformation
 */
export function validateCVData(cvData: CVGenerationData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!cvData.personalInfo?.name) {
    errors.push('Personal info: Name is required');
  }
  
  if (!cvData.personalInfo?.title) {
    errors.push('Personal info: Title is required');
  }
  
  if (!cvData.personalInfo?.email) {
    errors.push('Personal info: Email is required');
  }

  if (!cvData.summary?.introduction) {
    errors.push('Summary: Introduction is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Convert image file to Base64 string
 */
function convertImageToBase64(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}
