-- Insert some sample CV data for testing

-- Sample CV Profile
INSERT INTO cv_profiles (
    user_id,
    title,
    description,
    target_role,
    location,
    phone,
    email,
    linkedin_url,
    github_url,
    summary,
    key_attributes
) VALUES (
    auth.uid(), -- This will use the current authenticated user
    'Senior Full Stack Developer',
    'Comprehensive CV profile targeting senior developer positions in tech companies',
    'Senior Full Stack Developer',
    'Stockholm, Sweden',
    '+46 70 123 4567',
    'your.email@example.com',
    'https://linkedin.com/in/yourprofile',
    'https://github.com/yourusername',
    'Experienced full stack developer with 8+ years of expertise in React, Node.js, and cloud technologies. Passionate about building scalable applications and leading development teams.',
    ARRAY['React/TypeScript Expert', 'Cloud Architecture', 'Team Leadership', 'Agile Development', 'Microservices']
);

-- Sample Skills (using the CV profile we just created)
INSERT INTO cv_skills (
    cv_profile_id,
    skill_name,
    skill_level,
    category,
    years_of_experience,
    is_highlighted
) VALUES 
    ((SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1), 'React', 4, 'Frontend', 5.0, true),
    ((SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1), 'TypeScript', 4, 'Programming Languages', 4.0, true),
    ((SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1), 'Node.js', 3, 'Backend', 4.0, true),
    ((SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1), 'PostgreSQL', 3, 'Databases', 3.0, false),
    ((SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1), 'AWS', 3, 'Cloud Platforms', 2.5, true),
    ((SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1), 'Docker', 2, 'DevOps', 2.0, false);

-- Sample Experience
INSERT INTO cv_experiences (
    cv_profile_id,
    company_name,
    role_title,
    description,
    start_date,
    end_date,
    is_current,
    location,
    achievements,
    skills_used
) VALUES (
    (SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1),
    'Tech Solutions AB',
    'Senior Full Stack Developer',
    'Led development of customer-facing web applications serving 100K+ users. Architected microservices backend and modern React frontend.',
    '2022-01-01',
    NULL,
    true,
    'Stockholm, Sweden',
    ARRAY['Increased application performance by 40%', 'Led team of 4 developers', 'Implemented CI/CD pipeline reducing deployment time by 60%'],
    ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker']
);

-- Sample Project
INSERT INTO cv_projects (
    cv_profile_id,
    project_name,
    client_company,
    description,
    my_role,
    start_date,
    end_date,
    technologies_used,
    achievements,
    project_url
) VALUES (
    (SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1),
    'E-commerce Platform Modernization',
    'Retail Giants Inc',
    'Complete modernization of legacy e-commerce platform handling millions of transactions daily',
    'Technical Lead & Senior Developer',
    '2023-03-01',
    '2023-11-30',
    ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'AWS Lambda', 'Stripe API'],
    ARRAY['Reduced page load times by 65%', 'Implemented real-time inventory system', 'Achieved 99.9% uptime'],
    'https://retailgiants.com'
);

-- Sample Education
INSERT INTO cv_education (
    cv_profile_id,
    institution_name,
    degree,
    field_of_study,
    start_date,
    end_date,
    grade,
    description
) VALUES (
    (SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1),
    'KTH Royal Institute of Technology',
    'Master of Science',
    'Computer Science',
    '2012-09-01',
    '2017-06-30',
    'Magna Cum Laude',
    'Specialized in software engineering and distributed systems. Thesis on microservices architecture patterns.'
);

-- Sample Languages
INSERT INTO cv_languages (
    cv_profile_id,
    language_name,
    proficiency_level,
    proficiency_description
) VALUES 
    ((SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1), 'Swedish', 4, 'Native'),
    ((SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1), 'English', 4, 'Fluent'),
    ((SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1), 'German', 2, 'Conversational');

-- Sample Job Application
INSERT INTO job_applications (
    cv_profile_id,
    company_name,
    job_title,
    job_url,
    application_date,
    status,
    job_highlights,
    custom_summary,
    salary_range,
    location,
    remote_option
) VALUES (
    (SELECT id FROM cv_profiles WHERE title = 'Senior Full Stack Developer' AND user_id = auth.uid() LIMIT 1),
    'Innovation Tech AB',
    'Lead Full Stack Developer',
    'https://innovationtech.se/careers/lead-developer',
    CURRENT_DATE - INTERVAL '5 days',
    'interview',
    'Leading team of 6 developers, React/Node.js stack, microservices architecture, 100K+ users',
    'Experienced full stack developer with proven track record in leading teams and building scalable applications. Perfect match for your React/Node.js requirements.',
    '65,000 - 75,000 SEK',
    'Stockholm (Hybrid)',
    true
);
