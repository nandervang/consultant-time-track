import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import type { CVCompetencyCategory, CVCompetencySkill } from '@/types/cvGeneration';

interface CompetenciesFormProps {
  data: CVCompetencyCategory[];
  onChange: (data: CVCompetencyCategory[]) => void;
}

const skillLevels: Array<CVCompetencySkill['level']> = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export function CompetenciesForm({ data, onChange }: CompetenciesFormProps) {
  const [newSkill, setNewSkill] = useState<Partial<CVCompetencySkill>>({
    name: '',
    level: 'Intermediate',
    yearsOfExperience: undefined
  });
  const [editingSkill, setEditingSkill] = useState<{categoryIndex: number, skillIndex: number} | null>(null);
  
  // Edit skill states
  const editSkillData = editingSkill ? data[editingSkill.categoryIndex].skills[editingSkill.skillIndex] : null;
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState<CVCompetencySkill['level']>('Intermediate');
  const [editYears, setEditYears] = useState<string>('');

  // Update edit states when editing skill changes
  useState(() => {
    if (editSkillData) {
      setEditName(editSkillData.name);
      setEditLevel(editSkillData.level);
      setEditYears(editSkillData.yearsOfExperience?.toString() || '');
    }
  });

  const addCategory = () => {
    const newCategory: CVCompetencyCategory = {
      category: 'New Category',
      skills: []
    };
    onChange([...data, newCategory]);
  };

  const updateCategory = (index: number, category: string) => {
    const updatedCategories = data.map((cat, i) => 
      i === index ? { ...cat, category } : cat
    );
    onChange(updatedCategories);
  };

  const removeCategory = (index: number) => {
    const updatedCategories = data.filter((_, i) => i !== index);
    onChange(updatedCategories);
  };

  const addSkillToCategory = (categoryIndex: number) => {
    if (!newSkill.name?.trim()) return;
    
    const skill: CVCompetencySkill = {
      name: newSkill.name.trim(),
      level: newSkill.level || 'Intermediate',
      yearsOfExperience: newSkill.yearsOfExperience
    };

    const updatedCategories = data.map((category, i) => 
      i === categoryIndex 
        ? { ...category, skills: [...category.skills, skill] }
        : category
    );
    onChange(updatedCategories);
    setNewSkill({ name: '', level: 'Intermediate', yearsOfExperience: undefined });
  };

  const updateSkill = (categoryIndex: number, skillIndex: number, updatedSkill: CVCompetencySkill) => {
    const updatedCategories = data.map((category, i) => 
      i === categoryIndex 
        ? { 
            ...category, 
            skills: category.skills.map((skill, si) => 
              si === skillIndex ? updatedSkill : skill
            )
          }
        : category
    );
    onChange(updatedCategories);
    setEditingSkill(null);
  };

  const removeSkillFromCategory = (categoryIndex: number, skillIndex: number) => {
    const updatedCategories = data.map((category, i) => 
      i === categoryIndex 
        ? { ...category, skills: category.skills.filter((_, si) => si !== skillIndex) }
        : category
    );
    onChange(updatedCategories);
  };

  const startEditingSkill = (categoryIndex: number, skillIndex: number) => {
    const skill = data[categoryIndex].skills[skillIndex];
    setEditName(skill.name);
    setEditLevel(skill.level);
    setEditYears(skill.yearsOfExperience?.toString() || '');
    setEditingSkill({ categoryIndex, skillIndex });
  };

  const saveEditedSkill = () => {
    if (!editingSkill) return;
    
    updateSkill(editingSkill.categoryIndex, editingSkill.skillIndex, {
      name: editName,
      level: editLevel,
      yearsOfExperience: editYears ? parseInt(editYears) : undefined
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Competencies</h3>
          <p className="text-sm text-gray-600">
            Define structured competencies with skill levels for detailed assessment
          </p>
        </div>
        <Button onClick={addCategory} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-6">
        {data.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Input
                  value={category.category}
                  onChange={(e) => updateCategory(categoryIndex, e.target.value)}
                  className="text-base font-semibold bg-transparent border-none p-0 h-auto"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCategory(categoryIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Skills List */}
              <div className="space-y-2">
                {category.skills.map((skill, skillIndex) => (
                  <div key={skillIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-sm text-gray-600">
                        Level: {skill.level}
                        {skill.yearsOfExperience && ` • ${skill.yearsOfExperience} years`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingSkill(categoryIndex, skillIndex)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkillFromCategory(categoryIndex, skillIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Skill */}
              <div className="grid grid-cols-12 gap-3 p-3 border border-dashed border-gray-300 rounded-lg">
                <div className="col-span-5">
                  <Label className="text-xs">Skill Name</Label>
                  <Input
                    placeholder="e.g., React"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Level</Label>
                  <Select 
                    value={newSkill.level} 
                    onValueChange={(value) => setNewSkill({ ...newSkill, level: value as CVCompetencySkill['level'] })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Years</Label>
                  <Input
                    type="number"
                    placeholder="Years"
                    value={newSkill.yearsOfExperience || ''}
                    onChange={(e) => setNewSkill({ 
                      ...newSkill, 
                      yearsOfExperience: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  <Button 
                    onClick={() => addSkillToCategory(categoryIndex)}
                    size="sm"
                    disabled={!newSkill.name?.trim()}
                    className="w-full"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {data.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500 mb-4">No competency categories defined yet.</p>
              <Button onClick={addCategory} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Skill Modal */}
      {editingSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Edit Skill</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Skill Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <Label>Level</Label>
                <Select value={editLevel} onValueChange={(value) => setEditLevel(value as CVCompetencySkill['level'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {skillLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  value={editYears}
                  onChange={(e) => setEditYears(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingSkill(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEditedSkill}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}