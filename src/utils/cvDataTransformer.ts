import { CVProfile, CVSkill, CVLanguage } from '@/types/cv';
import { CVGenerationData, CVSkillCategory } from '@/types/cvGeneration';
import { EnhancedExperience, EnhancedProject } from '@/hooks/useEnhancedCV';
import { EnhancedEducation, EnhancedCertification } from '@/hooks/useEnhancedEducation';

export function transformProfileToCV(
  profile: CVProfile,
  experiences: EnhancedExperience[] = [],
  education: EnhancedEducation[] = [],
  certifications: EnhancedCertification[] = [],
  skills: CVSkill[] = [],
  projects: EnhancedProject[] = [],
  languages: CVLanguage[] = []
): CVGenerationData {
  return {
    personalInfo: {
      name: profile.title.split(' - ')[0] || 'Professional Name',
      title: profile.target_role || profile.title,
      email: profile.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      linkedIn: profile.linkedin_url,
      github: profile.github_url,
      website: profile.website_url,
      profilePhoto: profile.profile_image_url
    },
    
    summary: {
      introduction: profile.summary || '',
      keyStrengths: profile.key_attributes || [],
      careerObjective: profile.description
    },
    
    experience: experiences.map(exp => ({
      company: exp.company_name,
      position: exp.role_title,
      period: formatPeriod(exp.start_date, exp.end_date, exp.is_current),
      description: exp.description || '',
      technologies: exp.key_technologies || [],
      achievements: exp.achievements || []
    })),
    
    education: education.map(edu => ({
      institution: edu.institution_name,
      degree: edu.degree,
      field: edu.field_of_study || '',
      period: formatPeriod(edu.start_date, edu.end_date, edu.is_current),
      gpa: edu.grade
    })),
    
    skills: transformSkillsToCategories(skills),
    
    projects: projects.map(project => ({
      name: project.project_name,
      description: project.description || '',
      technologies: project.technologies_used || [],
      url: project.project_url
    })),
    
    certifications: certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuing_organization || '',
      date: cert.issue_date || cert.created_at.split('T')[0],
      credentialId: cert.credential_id
    })),
    
    languages: languages.map(lang => ({
      language: lang.language_name,
      proficiency: formatProficiency(lang.proficiency_level)
    })),

    templateSettings: {
      template: 'frank-digital',
      theme: 'blue',
      showPhoto: false,
      showReferences: true,
      language: 'en',
      fontSize: 'medium',
      margins: 'normal',
      colorScheme: '#0066cc'
    }
  };
}

function formatPeriod(startDate?: string, endDate?: string, isCurrent?: boolean): string {
  if (!startDate) return '';
  
  const start = new Date(startDate);
  const startFormatted = start.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  
  if (isCurrent) {
    return `${startFormatted} - Present`;
  }
  
  if (!endDate) {
    return startFormatted;
  }
  
  const end = new Date(endDate);
  const endFormatted = end.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  
  return `${startFormatted} - ${endFormatted}`;
}

function transformSkillsToCategories(skills: CVSkill[]): CVSkillCategory[] {
  const categories: Record<string, string[]> = {};
  
  skills.forEach(skill => {
    const category = skill.category || 'Technical Skills';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(skill.skill_name);
  });
  
  return Object.entries(categories).map(([category, items]) => ({
    category,
    items
  }));
}

function formatProficiency(level: number): string {
  switch (level) {
    case 1: return 'Beginner';
    case 2: return 'Elementary';
    case 3: return 'Intermediate';
    case 4: return 'Advanced';
    case 5: return 'Native';
    default: return 'Intermediate';
  }
}

export function createEmptyCV(): CVGenerationData {
  return {
    personalInfo: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      github: '',
      website: '',
      profilePhoto: ''
    },
    summary: {
      introduction: '',
      keyStrengths: [],
      careerObjective: ''
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    
    templateSettings: {
      template: 'frank-digital',
      theme: 'blue',
      showPhoto: false,
      showReferences: true,
      language: 'en',
      fontSize: 'medium',
      margins: 'normal',
      colorScheme: '#0066cc'
    }
  };
}