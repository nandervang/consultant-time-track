import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useCVProfiles } from '@/hooks/useCVProfiles';

interface CreateCVProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCVProfileDialog({ open, onOpenChange }: CreateCVProfileDialogProps) {
  const { createProfile } = useCVProfiles();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_role: '',
    location: '',
    phone: '',
    email: '',
    linkedin_url: '',
    github_url: '',
    website_url: '',
    summary: '',
    key_attributes: [] as string[]
  });
  const [newAttribute, setNewAttribute] = useState('');

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addKeyAttribute = () => {
    if (newAttribute.trim() && !formData.key_attributes.includes(newAttribute.trim())) {
      setFormData(prev => ({
        ...prev,
        key_attributes: [...prev.key_attributes, newAttribute.trim()]
      }));
      setNewAttribute('');
    }
  };

  const removeKeyAttribute = (attribute: string) => {
    setFormData(prev => ({
      ...prev,
      key_attributes: prev.key_attributes.filter(attr => attr !== attribute)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      await createProfile({
        ...formData,
        is_active: true
      });
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        target_role: '',
        location: '',
        phone: '',
        email: '',
        linkedin_url: '',
        github_url: '',
        website_url: '',
        summary: '',
        key_attributes: []
      });
    } catch (error) {
      console.error('Failed to create CV profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New CV Profile</DialogTitle>
          <DialogDescription>
            Create a new CV profile tailored for specific roles or industries.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Profile Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Senior Full Stack Developer"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this CV version"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="target_role">Target Role</Label>
              <Input
                id="target_role"
                value={formData.target_role}
                onChange={(e) => handleInputChange('target_role', e.target.value)}
                placeholder="e.g., Full Stack Developer"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Stockholm, Sweden"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="e.g., +46 70 123 4567"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="e.g., your.email@example.com"
              />
            </div>

            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                placeholder="e.g., https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                value={formData.github_url}
                onChange={(e) => handleInputChange('github_url', e.target.value)}
                placeholder="e.g., https://github.com/yourusername"
              />
            </div>

            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="e.g., https://yourportfolio.com"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="summary">Professional Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Brief professional summary highlighting your expertise and goals"
                rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Key Role Attributes</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newAttribute}
                  onChange={(e) => setNewAttribute(e.target.value)}
                  placeholder="Add a key attribute"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyAttribute())}
                />
                <Button type="button" onClick={addKeyAttribute} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.key_attributes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.key_attributes.map((attribute, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {attribute}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeKeyAttribute(attribute)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? 'Creating...' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
