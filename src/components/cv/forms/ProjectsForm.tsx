import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, ExternalLink } from 'lucide-react';
import { CVProjectItem } from '@/types/cvGeneration';
import { useState } from 'react';

interface ProjectsFormProps {
  data: CVProjectItem[];
  onChange: (data: CVProjectItem[]) => void;
}

export function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const emptyProject: CVProjectItem = {
    name: '',
    description: '',
    technologies: [],
    url: ''
  };

  const [currentProject, setCurrentProject] = useState<CVProjectItem>(emptyProject);

  const addProject = () => {
    if (currentProject.name && currentProject.description) {
      onChange([...data, currentProject]);
      setCurrentProject(emptyProject);
      setIsAddingNew(false);
    }
  };

  const updateProject = (index: number, updatedProject: CVProjectItem) => {
    const updated = data.map((project, i) => i === index ? updatedProject : project);
    onChange(updated);
    setEditingIndex(null);
  };

  const removeProject = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addTechnology = (project: CVProjectItem, tech: string) => {
    if (tech.trim() && !project.technologies.includes(tech.trim())) {
      return {
        ...project,
        technologies: [...project.technologies, tech.trim()]
      };
    }
    return project;
  };

  const removeTechnology = (project: CVProjectItem, index: number) => {
    return {
      ...project,
      technologies: project.technologies.filter((_, i) => i !== index)
    };
  };

  const ProjectEditor = ({ 
    project, 
    onChange, 
    onSave, 
    onCancel 
  }: {
    project: CVProjectItem;
    onChange: (project: CVProjectItem) => void;
    onSave: () => void;
    onCancel: () => void;
  }) => {
    const [newTech, setNewTech] = useState('');

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {project.name || 'New Project'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={project.name}
              onChange={(e) => onChange({ ...project, name: e.target.value })}
              placeholder="Project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-url">Project URL (optional)</Label>
            <Input
              id="project-url"
              value={project.url}
              onChange={(e) => onChange({ ...project, url: e.target.value })}
              placeholder="https://project-url.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={project.description}
              onChange={(e) => onChange({ ...project, description: e.target.value })}
              placeholder="Describe the project, your role, and key outcomes..."
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Technologies Used</Label>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tech}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onChange(removeTechnology(project, index))}
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
                    onChange(addTechnology(project, newTech));
                    setNewTech('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  onChange(addTechnology(project, newTech));
                  setNewTech('');
                }}
                disabled={!newTech.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={!project.name || !project.description}>
              Save Project
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
            <CardTitle>Projects & Portfolio</CardTitle>
            <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew || editingIndex !== null}>
              <Plus className="h-4 w-4 mr-1" />
              Add Project
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isAddingNew && (
        <ProjectEditor
          project={currentProject}
          onChange={setCurrentProject}
          onSave={addProject}
          onCancel={() => {
            setIsAddingNew(false);
            setCurrentProject(emptyProject);
          }}
        />
      )}

      {data.map((project, index) => (
        <div key={index}>
          {editingIndex === index ? (
            <ProjectEditor
              project={project}
              onChange={(proj) => setCurrentProject(proj)}
              onSave={() => updateProject(index, currentProject)}
              onCancel={() => {
                setEditingIndex(null);
                setCurrentProject(emptyProject);
              }}
            />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.url && (
                        <a 
                          href={project.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          title="View project"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingIndex(index);
                        setCurrentProject(project);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeProject(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{project.description}</p>
                
                {project.technologies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Technologies:</p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.url && (
                  <div>
                    <p className="text-sm font-medium mb-1">Project URL:</p>
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                      {project.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
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
            <p className="text-muted-foreground">No projects added yet.</p>
            <Button 
              variant="outline" 
              onClick={() => setIsAddingNew(true)}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}