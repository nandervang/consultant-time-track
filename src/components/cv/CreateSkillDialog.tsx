import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCVProfiles } from '@/hooks/useCVProfiles';
import { SKILL_LEVELS, SKILL_CATEGORIES } from '@/types/cv';
import { supabase } from '@/lib/supabase';
import { Loader2, Star } from 'lucide-react';

interface CreateSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCvProfileId?: string;
  onSkillCreated?: () => void;
}

export function CreateSkillDialog({ 
  open, 
  onOpenChange, 
  defaultCvProfileId,
  onSkillCreated
}: CreateSkillDialogProps) {
  const { profiles } = useCVProfiles();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cv_profile_id: defaultCvProfileId || '',
    skill_name: '',
    skill_level: 3 as 1 | 2 | 3 | 4 | 5,
    category: '',
    years_of_experience: '',
    last_used_date: '',
    is_highlighted: false,
  });

  const createSkill = async (skillData: {
    cv_profile_id: string;
    skill_name: string;
    skill_level: number;
    category?: string;
    years_of_experience?: number;
    last_used_date?: string;
    is_highlighted: boolean;
    sort_order: number;
  }) => {
    const { data, error } = await supabase
      .from('cv_skills')
      .insert([skillData])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cv_profile_id || !formData.skill_name) {
      return;
    }

    setIsLoading(true);
    try {
      await createSkill({
        cv_profile_id: formData.cv_profile_id,
        skill_name: formData.skill_name,
        skill_level: formData.skill_level,
        category: formData.category || undefined,
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : undefined,
        last_used_date: formData.last_used_date || undefined,
        is_highlighted: formData.is_highlighted,
        sort_order: 0,
      });
      
      // Reset form
      setFormData({
        cv_profile_id: defaultCvProfileId || '',
        skill_name: '',
        skill_level: 3 as 1 | 2 | 3 | 4 | 5,
        category: '',
        years_of_experience: '',
        last_used_date: '',
        is_highlighted: false,
      });
      
      onSkillCreated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create skill:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSkillLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-700 border-red-200';
      case 2: return 'bg-orange-100 text-orange-700 border-orange-200';
      case 3: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 4: return 'bg-blue-100 text-blue-700 border-blue-200';
      case 5: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
          <DialogDescription>
            Add a new skill with Kammarkollegiet competency level (1-5)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CV Profile Selection */}
          <div className="space-y-2">
            <Label htmlFor="cv_profile_id">CV Profile *</Label>
            <select
              id="cv_profile_id"
              value={formData.cv_profile_id}
              onChange={(e) => updateField('cv_profile_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Select CV profile"
              required
            >
              <option value="">Select a CV profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.title} {profile.target_role && `(${profile.target_role})`}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Name */}
          <div className="space-y-2">
            <Label htmlFor="skill_name">Skill Name *</Label>
            <Input
              id="skill_name"
              value={formData.skill_name}
              onChange={(e) => updateField('skill_name', e.target.value)}
              placeholder="e.g. React, Project Management, Java"
              required
            />
          </div>

          {/* Skill Level */}
          <div className="space-y-3">
            <Label>Competency Level (Kammarkollegiet Scale) *</Label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(SKILL_LEVELS).map(([level, { label, description }]) => (
                <label
                  key={level}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    formData.skill_level === parseInt(level) 
                      ? getSkillLevelColor(parseInt(level)) + ' ring-2 ring-offset-1'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="skill_level"
                    value={level}
                    checked={formData.skill_level === parseInt(level)}
                    onChange={(e) => updateField('skill_level', parseInt(e.target.value))}
                    className="mt-0.5 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{level}. {label}</span>
                      {parseInt(level) >= 4 && <Star className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Select skill category"
            >
              <option value="">Select a category</option>
              {SKILL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="years_of_experience">Years of Experience</Label>
              <Input
                id="years_of_experience"
                type="number"
                min="0"
                max="50"
                value={formData.years_of_experience}
                onChange={(e) => updateField('years_of_experience', e.target.value)}
                placeholder="e.g. 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_used_date">Last Used</Label>
              <Input
                id="last_used_date"
                type="date"
                value={formData.last_used_date}
                onChange={(e) => updateField('last_used_date', e.target.value)}
              />
            </div>
          </div>

          {/* Highlight Skill */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_highlighted"
              checked={formData.is_highlighted}
              onCheckedChange={(checked) => updateField('is_highlighted', checked)}
            />
            <Label htmlFor="is_highlighted" className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Highlight this skill (show prominently on CV)
            </Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Skill
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
