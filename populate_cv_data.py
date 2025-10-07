#!/usr/bin/env python3
"""
Script to populate CV data from extracted text into the CV editor
"""

import json
import re
from datetime import datetime

# Extracted CV data
cv_text = """
Niklas Andervang
niklas.andervang@frankdigital.se
+46702441323
Senior front-end/fullstack utvecklare & tillgänglighetsexpert
"""

def extract_cv_data():
    """Extract structured data from the CV text"""
    
    # Personal Information
    personal_info = {
        "name": "Niklas Andervang",
        "title": "Senior front-end/fullstack utvecklare & tillgänglighetsexpert",
        "email": "niklas.andervang@frankdigital.se",
        "phone": "+46702441323",
        "location": "Stockholm, Sverige",
        "linkedIn": "",
        "github": "",
        "website": "",
        "profilePhoto": ""
    }
    
    # Summary/Profile
    summary = {
        "introduction": "Niklas är en senior frontend/fullstack utvecklare som är bred med sin kompetens och kan röra sig i flera roller. Niklas har stor erfarenhet från flertalet frontend-ramverk, dev-ops teknik och moderna arkitekturlösningar under de ca 15 år som Niklas arbetat som utvecklare. Niklas jobbar ofta UI nära och med sin långa erfarenhet är Niklas ofta ett bollplank för UX och design kring förbättring av flöden och interaktion men även utformning av komponenter.",
        "keyStrengths": [
            "Senior frontend/fullstack utvecklare med 15+ års erfarenhet",
            "Bred kompetens inom flera frontend-ramverk och arkitekturlösningar",
            "Tillgänglighetsexpert med IAAP CPACC certifiering",
            "Erfaren inom UX och design för förbättring av flöden och interaktion",
            "Stark bakgrund inom analys, SEO och värdeskapande",
            "Mentorskap, Scrum Master och teamledarskap"
        ],
        "careerObjective": "Niklas har också ett stort intresse för analys och SEO och brinner för att skapa värde och förbättring. Som person är Niklas noggrann och trivs med att ha ett brett perspektiv till saker och ting."
    }
    
    # Work Experience
    experience = [
        {
            "company": "Cisco",
            "position": "Front-end / Fullstack utvecklare",
            "period": "nov. 2024 - pågående",
            "description": "Niklas är med i ett team där man utforskar AI agenter för Ciscos alla olika typer av produkter och tjänster. Niklas jobbar med integration av backend och front end AI assistent chat interface.",
            "technologies": ["CI/CD", "Docker", "TypeScript", "Kubernetes", "React", "Open API"],
            "achievements": [
                "Utveckling av AI agenter för Ciscos produkter och tjänster",
                "Integration av backend och frontend för AI assistent chat interface"
            ]
        },
        {
            "company": "Digitalidag, Post och telestyrelsen PTS",
            "position": "Front-end / Fullstack utvecklare / Tillgänglighetsexpert",
            "period": "mars 2024 - okt. 2024",
            "description": "Vi fick i uppdrag att bygga en ny webb åt digitalidag.se utifrån deras tillgänglighetsgranskning av befintlig webb. Det resulterade i att vi byggde en ny webb från grunden som är helt skräddarsydd utifrån deras behov.",
            "technologies": ["DevOps", "Tillgänglighet", "TypeScript", "WCAG", "React", "Contentful", "Next.js", "MongoDB"],
            "achievements": [
                "Byggde helt ny webbplats från grunden med fokus på tillgänglighet",
                "Utvecklade custom gränssnitt för event hantering",
                "Säkerställde hög tillgänglighet för både användare och redaktörer",
                "Ansvarade för DevOps, integrationer och förvaltning"
            ]
        },
        {
            "company": "DePalma Workwear",
            "position": "Front-end / Fullstack utvecklare",
            "period": "nov. 2023 - juni 2024",
            "description": "DePalma Workwear / Goods är en webbplats med headless data arkitektur från Sanity CMS med flera integrationer som Shopify och Drip Marketing Automation.",
            "technologies": ["SEO", "CI/CD", "DevOps", "HTML & CSS", "Tillgänglighet", "WCAG", "Analytics", "Shopify", "React", "Gatsby.js", "Netlify", "Sanity"],
            "achievements": [
                "Underhöll webbplats med headless arkitektur",
                "Utvecklade nya funktioner och förbättringar",
                "Tog fram strategi för konvertering, tillgänglighet och SEO"
            ]
        },
        {
            "company": "Postnord International",
            "position": "Front-end / Fullstack utvecklare / Tillgänglighetsexpert",
            "period": "dec. 2023 - apr. 2024",
            "description": "I projektet skapas nya agnostiska komponenter och block som sedan används i Optimizely CMS. En stor tyngt lades på att validera tillgänglighet för nya och befintliga komponenterna.",
            "technologies": ["C#", "Kvalitetssäkring", "Tillgänglighet", "TypeScript", "WCAG", "Optimizely", "Stencil.js", ".NET", "Webcomponents"],
            "achievements": [
                "Skapade agnostiska komponenter för Optimizely CMS",
                "Validerade tillgänglighet för komponenter med modern teknologi",
                "Utvecklade webkomponenter som kan användas oavsett ramverk"
            ]
        },
        {
            "company": "Skandia",
            "position": "Front-end utvecklare / Tillgänglighetsexpert",
            "period": "mars 2023 - dec. 2023",
            "description": "Niklas hade en specialistroll som tillgänglighetsexpert i det centrala designsystem teamet på Skandia. I projektet skedde en förflyttning av ramverk och ombyggnad av samtliga komponenter för webb, app och interna system.",
            "technologies": ["Kvalitetssäkring", "Strategy", "Tillgänglighet", "BrowserStack", "AXE", "TypeScript", "WCAG", "React", "Storybook", "Figma", "Webdriver IO"],
            "achievements": [
                "Ledde tillgänglighetsarbetet för centralt designsystem",
                "Ombyggnad av komponenter för webb, app och interna system",
                "Dokumentation och granskning samt stöd för utvecklare och design",
                "Strategiarbete för organisationen"
            ]
        }
    ]
    
    # Projects (extracting some key projects)
    projects = [
        {
            "name": "Digitalidag.se - Tillgänglig Webbplats",
            "description": "Ny webbplats byggd från grunden med fokus på tillgänglighet och användarupplevelse för Post och telestyrelsen PTS. Inkluderar custom event hantering och hög tillgänglighetsnivå.",
            "technologies": ["React", "TypeScript", "Next.js", "Contentful", "MongoDB", "WCAG"],
            "url": "https://digitalidag.se"
        },
        {
            "name": "Skandia Designsystem",
            "description": "Centralt designsystem för Skandia med fokus på tillgänglighet. Ombyggnad av komponenter för webb, app och interna system med modern teknologi och kvalitetssäkring.",
            "technologies": ["React", "TypeScript", "Storybook", "Figma", "AXE", "Webdriver IO"],
            "url": ""
        },
        {
            "name": "SJ.se Mikrofrontend Arkitektur",
            "description": "Migrering från Angular.js till React med fokus på mikrofrontend arkitektur och komponentbibliotek. Inkluderar A/B testning och optimering med Adobe verktyg.",
            "technologies": ["React", "Redux", "TypeScript", "Micro Frontend", "Adobe Analytics", "Cypress"],
            "url": "https://sj.se"
        }
    ]
    
    # Education
    education = [
        {
            "institution": "Blekinge Tekniska Högskola",
            "degree": "Kandidatexamen",
            "field": "Interaktionsdesign (MDA)",
            "period": "2008-2011",
            "gpa": ""
        },
        {
            "institution": "Blekinge Tekniska Högskola",
            "degree": "Civilingenjör",
            "field": "Mekanik och teknik", 
            "period": "2007-2008",
            "gpa": ""
        }
    ]
    
    # Certifications
    certifications = [
        {
            "name": "Certified Professional in Accessibility Core Competencies (CPACC)",
            "issuer": "IAAP",
            "date": "2022",
            "credentialId": ""
        },
        {
            "name": "Agile core competence and fundamentals course",
            "issuer": "Valtech",
            "date": "2021",
            "credentialId": ""
        },
        {
            "name": "Web Accessibility by Google",
            "issuer": "Google",
            "date": "2019",
            "credentialId": ""
        },
        {
            "name": "Agile Scrum kurs",
            "issuer": "",
            "date": "2015", 
            "credentialId": ""
        }
    ]
    
    # Courses
    courses = [
        {
            "name": "Tillgänglighet konferens och workshops",
            "provider": "FUNKA",
            "completionDate": "2018",
            "duration": "",
            "credentialId": "",
            "url": ""
        },
        {
            "name": "UX kurser, Lean UX & UX strategi",
            "provider": "",
            "completionDate": "2015",
            "duration": "",
            "credentialId": "",
            "url": ""
        }
    ]
    
    # Skills
    skills = [
        {
            "category": "Frontend Utveckling",
            "items": ["React", "TypeScript", "JavaScript", "HTML & CSS", "Next.js", "Gatsby.js", "Redux"]
        },
        {
            "category": "Backend Utveckling", 
            "items": ["C#", ".NET Core", "Node.js", "Express", "PHP", "MySQL", "MongoDB"]
        },
        {
            "category": "Tillgänglighet & Kvalitet",
            "items": ["WCAG", "AXE", "Tillgänglighetstester", "BrowserStack", "Webdriver IO", "Cypress"]
        },
        {
            "category": "DevOps & Verktyg",
            "items": ["CI/CD", "Docker", "Kubernetes", "Azure", "Git", "GitHub"]
        },
        {
            "category": "CMS & E-handel",
            "items": ["Optimizely", "Episerver", "Contentful", "Sanity", "Shopify", "Strapi"]
        },
        {
            "category": "Analys & SEO",
            "items": ["Google Analytics", "Adobe Analytics", "SEO", "A/B Testing", "Google Tag Manager"]
        },
        {
            "category": "Ledarskap & Process",
            "items": ["Scrum Master", "Team Lead", "Mentor", "Agile", "Projektledning", "Strategi"]
        }
    ]
    
    # Languages
    languages = [
        {
            "language": "Svenska",
            "proficiency": "Modersmål"
        },
        {
            "language": "Engelska", 
            "proficiency": "Flytande"
        }
    ]
    
    # Template Settings
    template_settings = {
        "template": "modern",
        "theme": "blue", 
        "fontSize": "medium",
        "showPhoto": True,
        "showReferences": False,
        "language": "sv",
        "margins": "normal",
        "colorScheme": "blue"
    }
    
    return {
        "personalInfo": personal_info,
        "summary": summary,
        "experience": experience,
        "projects": projects,
        "education": education,
        "certifications": certifications,
        "courses": courses,
        "skills": skills,
        "languages": languages,
        "templateSettings": template_settings
    }

if __name__ == "__main__":
    cv_data = extract_cv_data()
    print(json.dumps(cv_data, indent=2, ensure_ascii=False))