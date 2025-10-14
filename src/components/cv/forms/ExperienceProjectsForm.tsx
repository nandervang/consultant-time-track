import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Briefcase, Code } from 'lucide-react';
import { CVExperienceItem, CVProjectItem } from '@/types/cvGeneration';

interface ExperienceProjectsFormProps {
  experienceData: CVExperienceItem[];
  projectsData: CVProjectItem[];
  onExperienceChange: (data: CVExperienceItem[]) => void;
  onProjectsChange: (data: CVProjectItem[]) => void;
}

export function ExperienceProjectsForm({ 
  experienceData, 
  projectsData,
  onExperienceChange, 
  onProjectsChange 
}: ExperienceProjectsFormProps) {
  const [activeSubTab, setActiveSubTab] = useState('experience');

  // Experience handlers
  const addExperience = () => {
    const newExperience: CVExperienceItem = {
      company: '',
      position: '',
      period: '',
      description: '',
      technologies: [],
      achievements: []
    };
    onExperienceChange([...experienceData, newExperience]);
  };

  const removeExperience = (index: number) => {
    const updated = experienceData.filter((_, i) => i !== index);
    onExperienceChange(updated);
  };

  const updateExperience = (index: number, field: keyof CVExperienceItem, value: string | string[]) => {
    const updated = experienceData.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onExperienceChange(updated);
  };

  // Project handlers
  const addProject = () => {
    const newProject: CVProjectItem = {
      name: '',
      description: '',
      technologies: [],
      url: '',
      type: '', // Required for Andervang template
      period: '',
      achievements: []
    };
    onProjectsChange([...projectsData, newProject]);
  };

  const removeProject = (index: number) => {
    const updated = projectsData.filter((_, i) => i !== index);
    onProjectsChange(updated);
  };

  const updateProject = (index: number, field: keyof CVProjectItem, value: string | string[]) => {
    const updated = projectsData.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onProjectsChange(updated);
  };

  const handleTechnologiesChange = (index: number, value: string, isExperience: boolean = true) => {
    const technologies = value.split(',').map(tech => tech.trim()).filter(tech => tech);
    if (isExperience) {
      updateExperience(index, 'technologies', technologies);
    } else {
      updateProject(index, 'technologies', technologies);
    }
  };

  const handleAchievementsChange = (index: number, value: string) => {
    const achievements = value.split('\n').map(achievement => achievement.trim()).filter(achievement => achievement);
    updateExperience(index, 'achievements', achievements);
  };

  const handleProjectAchievementsChange = (index: number, value: string) => {
    const achievements = value.split('\n').map(achievement => achievement.trim()).filter(achievement => achievement);
    updateProject(index, 'achievements', achievements);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Experience</h2>
        <p className="text-muted-foreground">
          Add your work experience and notable projects
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="experience" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Work Experience
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <Code className="h-4 w-4" />
            Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="experience" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Work Experience</h3>
              <p className="text-sm text-muted-foreground">Your professional work history</p>
            </div>
            <Button onClick={addExperience} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Experience
            </Button>
          </div>

          {experienceData.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No experience added</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Start by adding your work experience
                </p>
                <Button onClick={addExperience} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Experience
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {experienceData.map((experience, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Experience {index + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`company-${index}`}>Company *</Label>
                        <Input
                          id={`company-${index}`}
                          placeholder="Company name"
                          value={experience.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`position-${index}`}>Position *</Label>
                        <Input
                          id={`position-${index}`}
                          placeholder="Job title"
                          value={experience.position}
                          onChange={(e) => updateExperience(index, 'position', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`period-${index}`}>Period</Label>
                      <Input
                        id={`period-${index}`}
                        placeholder="e.g., Jan 2020 - Present"
                        value={experience.period}
                        onChange={(e) => updateExperience(index, 'period', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`description-${index}`}>Description</Label>
                      <Textarea
                        id={`description-${index}`}
                        placeholder="Describe your role and responsibilities..."
                        value={experience.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`technologies-${index}`}>Technologies</Label>
                      <Input
                        id={`technologies-${index}`}
                        placeholder="React, TypeScript, Node.js (comma-separated)"
                        value={experience.technologies.join(', ')}
                        onChange={(e) => handleTechnologiesChange(index, e.target.value, true)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`achievements-${index}`}>Key Achievements</Label>
                      <Textarea
                        id={`achievements-${index}`}
                        placeholder="• Increased performance by 40%&#10;• Led a team of 5 developers&#10;• Implemented new architecture"
                        value={experience.achievements.join('\n')}
                        onChange={(e) => handleAchievementsChange(index, e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter each achievement on a new line
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Projects</h3>
              <p className="text-sm text-muted-foreground">Notable projects you've worked on</p>
            </div>
            <Button onClick={addProject} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </div>

          {projectsData.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Code className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No projects added</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Start by adding your notable projects
                </p>
                <Button onClick={addProject} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projectsData.map((project, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Project {index + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`project-name-${index}`}>Project Name *</Label>
                      <Input
                        id={`project-name-${index}`}
                        placeholder="Project name"
                        value={project.name}
                        onChange={(e) => updateProject(index, 'name', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`project-type-${index}`}>Project Type *</Label>
                        <Input
                          id={`project-type-${index}`}
                          placeholder="e.g., Fullstack Development, Frontend, Mobile App"
                          value={project.type || ''}
                          onChange={(e) => updateProject(index, 'type', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Required for Andervang Consulting template
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`project-period-${index}`}>Period</Label>
                        <Input
                          id={`project-period-${index}`}
                          placeholder="e.g., 2023-2024, Q1 2024"
                          value={project.period || ''}
                          onChange={(e) => updateProject(index, 'period', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`project-description-${index}`}>Description</Label>
                      <Textarea
                        id={`project-description-${index}`}
                        placeholder="Describe what the project does and your role in it..."
                        value={project.description}
                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`project-technologies-${index}`}>Technologies</Label>
                      <Input
                        id={`project-technologies-${index}`}
                        placeholder="React, TypeScript, PostgreSQL (comma-separated)"
                        value={project.technologies.join(', ')}
                        onChange={(e) => handleTechnologiesChange(index, e.target.value, false)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`project-url-${index}`}>Project URL</Label>
                      <Input
                        id={`project-url-${index}`}
                        type="url"
                        placeholder="https://github.com/username/project"
                        value={project.url || ''}
                        onChange={(e) => updateProject(index, 'url', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`project-achievements-${index}`}>Key Achievements</Label>
                      <Textarea
                        id={`project-achievements-${index}`}
                        placeholder="• Improved performance by 50%&#10;• Implemented accessibility features&#10;• Used by 10,000+ users"
                        value={(project.achievements || []).join('\n')}
                        onChange={(e) => handleProjectAchievementsChange(index, e.target.value)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter each achievement on a new line
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}