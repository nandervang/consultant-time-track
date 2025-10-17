import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, Brain, Star } from 'lucide-react';
import { CVSkillCategory } from '@/types/cvGeneration';
import { useState } from 'react';

interface Skill {
  name: string;
  level: number; // 1-5 rating scale
  category: string;
}

interface EnhancedSkillCategory {
  category: string;
  skills: Skill[];
}

interface SkillsFormProps {
  data: CVSkillCategory[];
  onChange: (data: CVSkillCategory[]) => void;
}

// Convert old format to new format with ratings
const convertToEnhancedFormat = (data: CVSkillCategory[]): EnhancedSkillCategory[] => {
  return data.map(cat => ({
    category: cat.category,
    skills: cat.items.map(item => {
      if (typeof item === 'string') {
        return {
          name: item,
          level: 3, // Default to intermediate level for string items
          category: cat.category
        };
      } else {
        return {
          name: item.name,
          level: item.level || 3, // Use existing level or default to intermediate
          category: cat.category
        };
      }
    })
  }));
};

// Convert back to enhanced format for API compatibility with skill levels
const convertToEnhancedAPIFormat = (data: EnhancedSkillCategory[]): CVSkillCategory[] => {
  return data.map(cat => ({
    category: cat.category,
    items: cat.skills.map(skill => ({
      name: skill.name,
      level: skill.level
    }))
  }));
};

export function SkillsForm({ data, onChange }: SkillsFormProps) {
  const [enhancedData, setEnhancedData] = useState<EnhancedSkillCategory[]>(
    () => convertToEnhancedFormat(data)
  );
  const [newCategory, setNewCategory] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(3);

  const updateData = (newEnhancedData: EnhancedSkillCategory[]) => {
    setEnhancedData(newEnhancedData);
    onChange(convertToEnhancedAPIFormat(newEnhancedData));
  };

  const addCategory = () => {
    if (newCategory.trim()) {
      const newCategories = [...enhancedData, { category: newCategory.trim(), skills: [] }];
      updateData(newCategories);
      setNewCategory('');
    }
  };

  const removeCategory = (index: number) => {
    const updated = enhancedData.filter((_, i) => i !== index);
    updateData(updated);
  };

  const addSkillToCategory = (categoryIndex: number) => {
    if (newSkill.trim()) {
      const updated = enhancedData.map((cat, index) => 
        index === categoryIndex 
          ? { 
              ...cat, 
              skills: [...cat.skills, { 
                name: newSkill.trim(), 
                level: newSkillLevel, 
                category: cat.category 
              }] 
            }
          : cat
      );
      updateData(updated);
      setNewSkill('');
      setNewSkillLevel(3);
    }
  };

  const removeSkillFromCategory = (categoryIndex: number, skillIndex: number) => {
    const updated = enhancedData.map((cat, index) => 
      index === categoryIndex 
        ? { ...cat, skills: cat.skills.filter((_, i) => i !== skillIndex) }
        : cat
    );
    updateData(updated);
  };

  const updateSkillLevel = (categoryIndex: number, skillIndex: number, newLevel: number) => {
    const updated = enhancedData.map((cat, index) => 
      index === categoryIndex 
        ? { 
            ...cat, 
            skills: cat.skills.map((skill, i) => 
              i === skillIndex ? { ...skill, level: newLevel } : skill
            )
          }
        : cat
    );
    updateData(updated);
  };

  const getRatingColor = (level: number) => {
    switch (level) {
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-blue-500';
      case 5: return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  const getRatingLabel = (level: number) => {
    switch (level) {
      case 1: return 'Grundläggande';
      case 2: return 'Någon erfarenhet';
      case 3: return 'God erfarenhet';
      case 4: return 'Mycket god erfarenhet';
      case 5: return 'Expert';
      default: return 'Ej bedömd';
    }
  };

  const StarRating = ({ level, onRatingChange, readonly = false }: { 
    level: number; 
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onRatingChange?.(star)}
            title={`Set rating to ${star} stars - ${getRatingLabel(star)}`}
            className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <Star 
              className={`h-4 w-4 ${star <= level ? getRatingColor(level) : 'text-gray-300'} ${
                star <= level ? 'fill-current' : ''
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {getRatingLabel(level)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Skills & Competencies</h2>
          <p className="text-muted-foreground">
            Add your technical and professional skills with Kammarkollegiet-style competency ratings
          </p>
        </div>
      </div>

      {/* Rating Scale Legend */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5" />
            Kompetensgradering (Kammarkollegiet-skala)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(level => (
              <div key={level} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <StarRating level={level} readonly />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add new category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Skill Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Category name (e.g., Programming Languages, Frameworks)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              className="flex-1"
            />
            <Button onClick={addCategory} disabled={!newCategory.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skill categories */}
      <div className="space-y-6">
        {enhancedData.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{category.category}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCategory(categoryIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Add skill to category */}
              <div className="mb-6 p-4 rounded-lg border-2 border-dashed border-muted">
                <Label className="text-sm font-medium mb-3 block">Add New Skill</Label>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Skill name"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkillToCategory(categoryIndex)}
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <Label className="text-xs text-muted-foreground mb-2 block">Competency Level</Label>
                    <StarRating 
                      level={newSkillLevel} 
                      onRatingChange={setNewSkillLevel}
                    />
                  </div>
                  <Button 
                    onClick={() => addSkillToCategory(categoryIndex)}
                    disabled={!newSkill.trim()}
                    size="lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </div>
              </div>

              {/* Skills list */}
              <div className="space-y-3">
                {category.skills.map((skill, skillIndex) => (
                  <div
                    key={skillIndex}
                    className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="font-medium text-lg">{skill.name}</span>
                      <StarRating 
                        level={skill.level}
                        onRatingChange={(newLevel) => updateSkillLevel(categoryIndex, skillIndex, newLevel)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkillFromCategory(categoryIndex, skillIndex)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {category.skills.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No skills added to this category yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {enhancedData.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No skill categories yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by adding a skill category above, then add individual skills with competency ratings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}