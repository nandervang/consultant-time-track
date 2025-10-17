// Data Transformer: Convert internal CV format to API payload format
import type { CVGenerationData } from '@/types/cvGeneration';
import type { CVAPIPayload, CVAPICompetency } from '@/types/cv-api-types';
import type { ConsultantCVPayload } from '@/services/cv-generation-api';

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
      profileImage: apiPayload.personalInfo.profileImage,
      linkedIn: apiPayload.personalInfo.linkedIn,
      github: apiPayload.personalInfo.github,
      website: apiPayload.personalInfo.website,
      twitter: apiPayload.personalInfo.twitter,
      instagram: apiPayload.personalInfo.instagram,
      facebook: apiPayload.personalInfo.facebook
    },
    company: apiPayload.company,
    summary: {
      introduction: apiPayload.summary.introduction,
      highlights: apiPayload.summary.highlights,
      specialties: apiPayload.summary.specialties || []
    },
    careerObjective: apiPayload.summary.careerObjective || '',
    employment: (apiPayload.employment || []).map(emp => ({
      period: emp.period,
      position: emp.position,
      company: emp.company,
      description: emp.description,
      technologies: emp.technologies || [],
      achievements: emp.achievements || []
    })),
    roles: (apiPayload.roles || []).map(role => ({
      name: role.title || '',
      description: '',
      responsibilities: role.skills || []
    })),
    projects: (apiPayload.projects || []).map(proj => ({
      period: proj.period,
      type: proj.type,
      title: proj.title,
      description: proj.description,
      technologies: proj.technologies || [],
      achievements: proj.achievements || [],
      url: proj.url
    })),
    education: (apiPayload.education || []).map(edu => ({
      period: edu.period,
      degree: edu.degree,
      institution: edu.institution,
      specialization: edu.specialization,
      honors: Array.isArray(edu.honors) ? edu.honors.join(', ') : edu.honors,
      location: edu.location
    })),
    certifications: (apiPayload.certifications || []).map(cert => ({
      year: cert.year,
      title: cert.title,
      issuer: cert.issuer,
      description: cert.description,
      url: cert.url,
      expiration: cert.expirationDate
    })),
    courses: (apiPayload.courses || []).map(course => ({
      name: course.name,
      institution: course.provider,
      year: course.completionDate,
      description: course.duration,
      status: course.status,
      grade: course.grade
    })),
    skills: (apiPayload.skills || []).map(skillGroup => ({
      category: skillGroup.category,
      items: skillGroup.items?.map(item => ({
        name: item.name,
        level: item.level
      })) || []
    })),
    competencies: (apiPayload.competencies || []).map(comp => ({
      category: comp.category,
      items: comp.skills?.map(skill => skill.name) || []
    })),
    languages: (apiPayload.languages || []).map(lang => ({
      language: lang.language,
      proficiency: lang.proficiency
    })),
    closing: apiPayload.closing ? {
      statement: apiPayload.closing.text || '',
      signature: '',
      date: '',
      location: apiPayload.closing.contact?.location || ''
    } : undefined,
    template: apiPayload.template || 'andervang-consulting',
    format: apiPayload.format || 'pdf',
    styling: {
      primaryColor: apiPayload.styling?.primaryColor || '#003D82',
      accentColor: apiPayload.styling?.accentColor || '#FF6B35'
    },
    templateSettings: apiPayload.templateSettings ? {
      template: apiPayload.templateSettings.template,
      colorScheme: apiPayload.templateSettings.colorScheme || apiPayload.templateSettings.theme,
      fontSize: apiPayload.templateSettings.fontSize,
      spacing: apiPayload.templateSettings.margins,
      showPhoto: apiPayload.templateSettings.showPhoto,
      showSocial: true,
      headerStyle: 'default',
      sectionOrder: []
    } : undefined
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
      website: cvData.personalInfo?.website,
      twitter: cvData.personalInfo?.twitter,
      instagram: cvData.personalInfo?.instagram,
      facebook: cvData.personalInfo?.facebook
    },

    // Company name
    company,

    // Summary transformation
    summary: {
      introduction: cvData.summary?.introduction || '',
      highlights: cvData.summary?.keyStrengths || [],
      specialties: cvData.summary?.specialties || [],
      careerObjective: cvData.summary?.careerObjective
    },

    // Employment history (experience → employment) with all fields
    employment: cvData.experience?.map(exp => ({
      period: exp.period || '',
      position: exp.position || '',
      company: exp.company || '',
      description: exp.description || '',
      technologies: exp.technologies || [],
      achievements: exp.achievements || [],
      url: exp.url,
      location: exp.location
    })),

    // Projects transformation with all fields
    projects: cvData.projects?.map(proj => ({
      period: proj.period || 'Projektperiod',
      type: proj.type || 'Utvecklare',
      title: proj.name || '',
      description: proj.description || '',
      technologies: proj.technologies || [],
      achievements: proj.achievements || [],
      url: proj.url
    })),

    // Education transformation with all fields
    education: cvData.education?.map(edu => ({
      period: edu.period || '',
      degree: edu.degree || '',
      institution: edu.institution || '',
      specialization: edu.field,
      gpa: edu.gpa,
      location: edu.location,
      honors: edu.honors
    })),

    // Certifications transformation with all fields
    certifications: cvData.certifications?.map(cert => ({
      year: cert.date || '',
      title: cert.name || '',
      issuer: cert.issuer || '',
      description: cert.credentialId ? `Credential ID: ${cert.credentialId}` : undefined,
      credentialId: cert.credentialId,
      url: cert.url,
      expirationDate: cert.expirationDate
    })),

    // Courses transformation with all fields (NEW)
    courses: cvData.courses?.map(course => ({
      name: course.name || '',
      provider: course.provider || '',
      completionDate: course.completionDate || '',
      duration: course.duration,
      credentialId: course.credentialId,
      url: course.url,
      status: course.status,
      grade: course.grade
    })),

    // Skills (direct mapping from Skills tab)
    skills: cvData.skills?.map(skillGroup => ({
      category: skillGroup.category || '',
      items: skillGroup.items?.map(item => {
        if (typeof item === 'string') {
          return { name: item, level: 3 }; // Default level for string items
        } else {
          return {
            name: item.name || '',
            level: item.level || 3
          };
        }
      }) || []
    })) || [],

    // Skills → Competencies transformation (grouping by proficiency) - kept for compatibility
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

    // Competencies (direct mapping from Competencies tab)
    competencyCategories: cvData.competencies?.map(comp => ({
      category: comp.category || '',
      skills: comp.skills?.map(skill => ({
        name: skill.name || '',
        level: skill.level || 'Intermediate',
        yearsOfExperience: skill.yearsOfExperience
      })) || []
    })) || [],

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
  skills: Array<{ category: string; items: (string | { name: string; level?: number })[] }>
): CVAPICompetency[] {
  if (!skills || skills.length === 0) return [];

  // Define level mapping from 1-5 rating to proficiency levels
  const levelToProficiency: Record<number, 'beginner' | 'intermediate' | 'advanced' | 'expert'> = {
    1: 'beginner',    // Grundläggande
    2: 'intermediate', // Grundläggande+
    3: 'intermediate', // Mellannivå
    4: 'advanced',    // Avancerad
    5: 'expert'       // Expert
  };

  // Group all skills by proficiency level 
  const competencies: CVAPICompetency[] = [];

  skills.forEach(skillGroup => {
    skillGroup.items.forEach(item => {
      let skillName: string;
      let proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';

      if (typeof item === 'string') {
        skillName = item;
        proficiencyLevel = 'intermediate'; // Default for legacy string items
      } else {
        skillName = item.name;
        proficiencyLevel = levelToProficiency[item.level || 3] || 'intermediate';
      }

      // Find or create competency category based on proficiency level
      const category = getCompetencyCategoryName(proficiencyLevel);
      
      const existingCompetency = competencies.find(c => c.category === category);
      
      const skillItem = {
        name: skillName,
        level: proficiencyLevel
      };

      if (existingCompetency) {
        existingCompetency.skills.push(skillItem);
      } else {
        competencies.push({
          category,
          skills: [skillItem]
        });
      }
    });
  });

  return competencies;
}

/**
 * Get competency category name based on proficiency level
 */
function getCompetencyCategoryName(level: 'beginner' | 'intermediate' | 'advanced' | 'expert'): string {
  const categoryNames: Record<string, string> = {
    'expert': 'Expert inom området',
    'advanced': 'Mycket hög kompetens', 
    'intermediate': 'Hög kompetens',
    'beginner': 'Grundläggande kompetens'
  };
  
  return categoryNames[level] || 'Hög kompetens';
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
