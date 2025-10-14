import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';
import type { CVRole } from '@/types/cvGeneration';

interface RolesFormProps {
  data: CVRole[];
  onChange: (data: CVRole[]) => void;
}

export function RolesForm({ data, onChange }: RolesFormProps) {
  const [newSkill, setNewSkill] = useState('');
  const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);

  const addRole = () => {
    const newRole: CVRole = {
      title: 'New Role',
      skills: []
    };
    onChange([...data, newRole]);
    setEditingRoleIndex(data.length);
  };

  const updateRole = (index: number, field: keyof CVRole, value: string) => {
    const updatedRoles = data.map((role, i) => 
      i === index ? { ...role, [field]: value } : role
    );
    onChange(updatedRoles);
  };

  const removeRole = (index: number) => {
    const updatedRoles = data.filter((_, i) => i !== index);
    onChange(updatedRoles);
    if (editingRoleIndex === index) {
      setEditingRoleIndex(null);
    }
  };

  const addSkillToRole = (roleIndex: number) => {
    if (!newSkill.trim()) return;
    
    const updatedRoles = data.map((role, i) => 
      i === roleIndex 
        ? { ...role, skills: [...role.skills, newSkill.trim()] }
        : role
    );
    onChange(updatedRoles);
    setNewSkill('');
  };

  const removeSkillFromRole = (roleIndex: number, skillIndex: number) => {
    const updatedRoles = data.map((role, i) => 
      i === roleIndex 
        ? { ...role, skills: role.skills.filter((_, si) => si !== skillIndex) }
        : role
    );
    onChange(updatedRoles);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Professional Roles</h3>
          <p className="text-sm text-gray-600">
            Define role-based competencies for the Andervang Consulting template
          </p>
        </div>
        <Button onClick={addRole} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      <div className="grid gap-4">
        {data.map((role, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {editingRoleIndex === index ? (
                    <Input
                      value={role.title}
                      onChange={(e) => updateRole(index, 'title', e.target.value)}
                      onBlur={() => setEditingRoleIndex(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingRoleIndex(null);
                        }
                      }}
                      autoFocus
                      className="text-base font-semibold"
                    />
                  ) : (
                    <span 
                      onClick={() => setEditingRoleIndex(index)}
                      className="cursor-pointer hover:text-blue-600"
                    >
                      {role.title}
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRole(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Skills</Label>
                <div className="flex flex-wrap gap-1 mt-1 mb-2 min-h-[2rem]">
                  {role.skills.map((skill, skillIndex) => (
                    <Badge key={skillIndex} variant="secondary" className="gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-600" 
                        onClick={() => removeSkillFromRole(index, skillIndex)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkillToRole(index);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => addSkillToRole(index)}
                    size="sm"
                    disabled={!newSkill.trim()}
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
              <p className="text-gray-500 mb-4">No professional roles defined yet.</p>
              <Button onClick={addRole} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Role
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}