// Test transformation of niklasCV data

// Since we can't directly import TS files in Node, we'll create the transformation manually
// Based on the niklasCV data structure

const niklasCV = {
  personalInfo: {
    name: "Niklas Andervang",
    title: "Senior front-end/fullstack utvecklare & tillgänglighetsexpert",
    email: "niklas.andervang@frankdigital.se",
    phone: "+46702441323",
    location: "Stockholm, Sverige",
    linkedIn: "https://linkedin.com/in/niklasandervang",
    github: "https://github.com/nandervang",
    website: "https://andervang.com",
    profilePhoto: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
  },
  
  summary: {
    introduction: "Niklas är en senior frontend/fullstack utvecklare som är bred med sin kompetens och kan röra sig i flera roller. Niklas har stor erfarenhet från flertalet frontend-ramverk, dev-ops teknik och moderna arkitekturlösningar under de ca 15 år som Niklas arbetat som utvecklare. Niklas jobbar ofta UI nära och med sin långa erfarenhet är Niklas ofta ett bollplank för UX och design kring förbättring av flöden och interaktion men även utformning av komponenter.",
    keyStrengths: [
      "Senior frontend/fullstack utvecklare med 15+ års erfarenhet",
      "Bred kompetens inom flera frontend-ramverk och arkitekturlösningar", 
      "Tillgänglighetsexpert med IAAP CPACC certifiering",
      "Erfaren inom UX och design för förbättring av flöden och interaktion",
      "Stark bakgrund inom analys, SEO och värdeskapande",
      "Mentorskap, Scrum Master och teamledarskap"
    ],
    careerObjective: "Niklas har också ett stort intresse för analys och SEO och brinner för att skapa värde och förbättring. Som person är Niklas noggrann och trivs med att ha ett brett perspektiv till saker och ting.",
    specialties: ["React", "TypeScript", "Tillgänglighet", "DevOps", "Scrum Master", "Next.js"]
  },

  roles: [
    {
      title: "Frontend Specialist",
      skills: ["React", "TypeScript", "CSS", "HTML", "Next.js", "Gatsby.js", "Vue.js", "Angular"]
    }
  ],

  // Sample experience (first two entries)
  experience: [
    {
      company: "Cisco",
      position: "Front-end / Fullstack utvecklare / Tillgänglighetsexpert", 
      period: "juni 2024 - pågående",
      description: "Niklas jobbade i teamet för deras externa webbplats cisco.com/se. Stora delar av arbetet handlade om migrering och uppgradering av befintliga komponenter, sidor och mallar till en nyare teknisk plattform.",
      technologies: ["DevOps", "Tillgänglighet", "TypeScript", "WCAG", "Test och validering", "React", "Contentful", "Next.js", "MongoDB", "Event hantering"],
      achievements: [
        "Migrering och uppgradering av komponenter till nyare teknisk plattform",
        "Utveckling av nya funktioner och förbättringar"
      ]
    }
  ],

  projects: [
    {
      name: "Digitalidag.se - Tillgänglig Webbplats",
      type: "Tillgänglig Webbplats",
      period: "mars 2024 - maj 2024",
      description: "Ny webbplats byggd från grunden med fokus på tillgänglighet och användarupplevelse för Post och telestyrelsen PTS.",
      technologies: ["React", "TypeScript", "Next.js", "Contentful", "MongoDB", "WCAG"],
      url: "https://digitalidag.se",
      achievements: [
        "Byggde helt ny webbplats från grunden med fokus på tillgänglighet"
      ]
    }
  ],

  education: [
    {
      institution: "Blekinge Tekniska Högskola",
      degree: "Kandidatexamen", 
      field: "Interaktionsdesign (MDA)",
      period: "2008-2011"
    }
  ],

  certifications: [
    {
      name: "Certified Professional in Accessibility Core Competencies (CPACC)",
      issuer: "IAAP", 
      date: "2022",
      credentialId: "CPACC-2022-NA-001"
    }
  ],

  courses: [
    {
      name: "Advanced React Performance Optimization",
      provider: "Frontend Masters",
      completionDate: "2023-08-15",
      duration: "8 hours",
      credentialId: "FM-2023-ARPO-001",
      url: "https://frontendmasters.com/courses/react-performance/"
    }
  ],

  skills: [
    {
      category: "Frontend Utveckling",
      items: ["React", "TypeScript", "JavaScript", "HTML & CSS", "Next.js", "Gatsby.js", "Redux", "Vue.js", "Angular", "Svelte"]
    }
  ],

  languages: [
    {
      language: "Svenska",
      proficiency: "Modersmål"
    }
  ],

  competencies: [
    {
      category: "Frontend Utveckling",
      skills: [
        { name: "React", level: "Expert", yearsOfExperience: 8 },
        { name: "TypeScript", level: "Expert", yearsOfExperience: 6 }
      ]
    }
  ],

  closing: {
    text: "Tack för att du tog dig tid att läsa mitt CV. Jag ser fram emot möjligheten att diskutera hur jag kan bidra till ert team.",
    contact: {
      email: "niklas@andervang.com",
      phone: "+46 70 244 13 23", 
      location: "Stockholm, Sverige",
      company: "Andervang Consulting"
    }
  },

  templateSettings: {
    template: "andervang-consulting",
    theme: "blue",
    fontSize: "medium", 
    showPhoto: true,
    showReferences: false,
    language: "sv",
    margins: "normal",
    colorScheme: "blue"
  },

  template: "andervang-consulting",
  format: "pdf"
};

// Transform function implementation
function transformToAPIPayload(cvData, options = {}) {
  const { format = 'pdf', template = 'andervang-consulting', company = 'Frank Digital AB' } = options;

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

    // Courses transformation
    courses: cvData.courses?.map(course => ({
      name: course.name || '',
      provider: course.provider || '',
      completionDate: course.completionDate || '',
      duration: course.duration,
      credentialId: course.credentialId,
      url: course.url
    })),

    // Skills → Competencies transformation
    competencies: transformSkillsToCompetencies(cvData.skills || []),

    // Languages (direct mapping)
    languages: cvData.languages?.map(lang => ({
      language: lang.language || '',
      proficiency: lang.proficiency || ''
    })),

    // Roles
    roles: cvData.roles?.map(role => ({
      title: role.title || '',
      skills: role.skills || []
    })),

    // Competency Categories
    competencyCategories: cvData.competencies?.map(comp => ({
      category: comp.category || '',
      skills: comp.skills?.map(skill => ({
        name: skill.name || '',
        level: skill.level || 'Intermediate',
        yearsOfExperience: skill.yearsOfExperience
      })) || []
    })),

    // Closing
    closing: cvData.closing ? {
      text: cvData.closing.text || '',
      contact: {
        email: cvData.closing.contact?.email || cvData.personalInfo?.email || '',
        phone: cvData.closing.contact?.phone || cvData.personalInfo?.phone || '',
        location: cvData.closing.contact?.location || cvData.personalInfo?.location || '',
        company: cvData.closing.contact?.company || company
      }
    } : undefined,

    // Template Settings
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

    // Styling
    styling: {
      primaryColor: cvData.templateSettings?.colorScheme === 'blue' ? '#003D82' : undefined,
      accentColor: '#FF6B35',
      fontSize: cvData.templateSettings?.fontSize || 'medium',
      spacing: cvData.templateSettings?.margins === 'compact' ? 'compact' : 
               cvData.templateSettings?.margins === 'relaxed' ? 'relaxed' : 'normal'
    }
  };
}

function transformSkillsToCompetencies(skills) {
  if (!skills || skills.length === 0) return [];

  const categoryToProficiency = {
    'Expert inom området': 'expert',
    'Mycket hög kompetens': 'advanced',
    'Hög kompetens': 'advanced',
    'Grundläggande kompetens': 'intermediate'
  };

  const competencies = [];

  skills.forEach(skillGroup => {
    const category = inferCompetencyCategory(skillGroup.category);
    const level = categoryToProficiency[category] || 'advanced';

    const skillItems = skillGroup.items.map(skillName => ({
      name: skillName,
      level: level
    }));

    const existingCompetency = competencies.find(c => c.category === category);
    
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

function inferCompetencyCategory(categoryName) {
  const lowerCategory = categoryName.toLowerCase();

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

  return 'Hög kompetens';
}

// Transform the data
const apiPayload = transformToAPIPayload(niklasCV, {
  format: 'pdf',
  template: 'andervang-consulting',
  company: 'Frank Digital AB'
});

console.log('=== CV API PAYLOAD ===');
console.log(JSON.stringify(apiPayload, null, 2));