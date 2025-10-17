import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Calendar } from 'lucide-react';
import { CVExperienceItem } from '@/types/cvGeneration';
import { useState } from 'react';

interface ExperienceFormProps {
  data: CVExperienceItem[];
  onChange: (data: CVExperienceItem[]) => void;
}

export function ExperienceForm({ data, onChange }: ExperienceFormProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const emptyExperience: CVExperienceItem = {
    company: '',
    position: '',
    period: '',
    description: '',
    technologies: [],
    achievements: [],
    url: '',
    location: ''
  };

  const [currentExperience, setCurrentExperience] = useState<CVExperienceItem>(emptyExperience);

  const addExperience = () => {
    if (currentExperience.company && currentExperience.position) {
      onChange([...data, currentExperience]);
      setCurrentExperience(emptyExperience);
      setIsAddingNew(false);
    }
  };

  const updateExperience = (index: number, updatedExperience: CVExperienceItem) => {
    const updated = data.map((exp, i) => i === index ? updatedExperience : exp);
    onChange(updated);
    setEditingIndex(null);
  };

  const removeExperience = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addTechnology = (experience: CVExperienceItem, tech: string) => {
    if (tech.trim() && !experience.technologies.includes(tech.trim())) {
      return {
        ...experience,
        technologies: [...experience.technologies, tech.trim()]
      };
    }
    return experience;
  };

  const removeTechnology = (experience: CVExperienceItem, index: number) => {
    return {
      ...experience,
      technologies: experience.technologies.filter((_, i) => i !== index)
    };
  };

  const addAchievement = (experience: CVExperienceItem, achievement: string) => {
    if (achievement.trim()) {
      return {
        ...experience,
        achievements: [...experience.achievements, achievement.trim()]
      };
    }
    return experience;
  };

  const removeAchievement = (experience: CVExperienceItem, index: number) => {
    return {
      ...experience,
      achievements: experience.achievements.filter((_, i) => i !== index)
    };
  };

  const ExperienceEditor = ({ 
    experience, 
    onChange, 
    onSave, 
    onCancel 
  }: {
    experience: CVExperienceItem;
    onChange: (exp: CVExperienceItem) => void;
    onSave: () => void;
    onCancel: () => void;
  }) => {
    const [newTech, setNewTech] = useState('');
    const [newAchievement, setNewAchievement] = useState('');

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {experience.company ? `${experience.position} at ${experience.company}` : 'New Experience'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={experience.company}
                onChange={(e) => onChange({ ...experience, company: e.target.value })}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={experience.position}
                onChange={(e) => onChange({ ...experience, position: e.target.value })}
                placeholder="Job title"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <Input
              id="period"
              value={experience.period}
              onChange={(e) => onChange({ ...experience, period: e.target.value })}
              placeholder="e.g., Jan 2020 - Dec 2023"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-url">Company URL (optional)</Label>
              <Input
                id="company-url"
                value={experience.url || ''}
                onChange={(e) => onChange({ ...experience, url: e.target.value })}
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Work Location</Label>
              <Input
                id="location"
                value={experience.location || ''}
                onChange={(e) => onChange({ ...experience, location: e.target.value })}
                placeholder="e.g., Stockholm, Sweden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={experience.description}
              onChange={(e) => onChange({ ...experience, description: e.target.value })}
              placeholder="Describe your role and responsibilities..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Technologies Used</Label>
            <div className="flex flex-wrap gap-2">
              {experience.technologies.map((tech, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tech}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onChange(removeTechnology(experience, index))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Add technology..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onChange(addTechnology(experience, newTech));
                    setNewTech('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  onChange(addTechnology(experience, newTech));
                  setNewTech('');
                }}
                disabled={!newTech.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Key Achievements</Label>
            <div className="space-y-2">
              {experience.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1">{achievement}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(removeAchievement(experience, index))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                placeholder="Add achievement..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onChange(addAchievement(experience, newAchievement));
                    setNewAchievement('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  onChange(addAchievement(experience, newAchievement));
                  setNewAchievement('');
                }}
                disabled={!newAchievement.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={!experience.company || !experience.position}>
              Save Experience
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Work Experience</CardTitle>
            <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew || editingIndex !== null}>
              <Plus className="h-4 w-4 mr-1" />
              Add Experience
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isAddingNew && (
        <ExperienceEditor
          experience={currentExperience}
          onChange={setCurrentExperience}
          onSave={addExperience}
          onCancel={() => {
            setIsAddingNew(false);
            setCurrentExperience(emptyExperience);
          }}
        />
      )}

      {data.map((experience, index) => (
        <div key={index}>
          {editingIndex === index ? (
            <ExperienceEditor
              experience={experience}
              onChange={(exp) => setCurrentExperience(exp)}
              onSave={() => updateExperience(index, currentExperience)}
              onCancel={() => {
                setEditingIndex(null);
                setCurrentExperience(emptyExperience);
              }}
            />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{experience.position}</CardTitle>
                    <p className="text-muted-foreground">{experience.company}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {experience.period}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingIndex(index);
                        setCurrentExperience(experience);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExperience(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {experience.description && (
                  <p className="text-sm">{experience.description}</p>
                )}
                
                {experience.technologies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Technologies:</p>
                    <div className="flex flex-wrap gap-1">
                      {experience.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {experience.achievements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Key Achievements:</p>
                    <ul className="text-sm space-y-1">
                      {experience.achievements.map((achievement, achievementIndex) => (
                        <li key={achievementIndex} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ))}

      {data.length === 0 && !isAddingNew && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No work experience added yet.</p>
            <Button 
              variant="outline" 
              onClick={() => setIsAddingNew(true)}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Experience
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}