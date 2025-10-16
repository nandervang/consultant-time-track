import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Code, 
  Terminal,
  Database,
  Cloud,
  Shield,
  Cpu,
  Network,
  GitBranch,
  Bug,
  Zap,
  Users,
  Target,
  Globe,
  Lightbulb,
  Brain,
  Eye,
  Layers,
  Settings,
  Smartphone,
  Monitor,
  Server,
  Lock,
  TrendingUp
} from 'lucide-react';

interface CreateProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profileData: {
    title: string;
    description?: string;
    target_role?: string;
    location?: string;
    profile_image_url?: string;
    is_active: boolean;
  }) => Promise<void>;
  profilesCount: number;
}

interface IconOption {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  name: string;
}

const iconOptions: IconOption[] = [
  { id: 'developer', icon: Code, color: 'blue', name: 'Developer' },
  { id: 'senior-dev', icon: Terminal, color: 'indigo', name: 'Senior Developer' },
  { id: 'architect', icon: Layers, color: 'purple', name: 'Architect' },
  { id: 'scrum-master', icon: Users, color: 'green', name: 'Scrum Master' },
  { id: 'ai-specialist', icon: Brain, color: 'violet', name: 'AI Specialist' },
  { id: 'accessibility-expert', icon: Eye, color: 'orange', name: 'Accessibility Expert' },
  { id: 'devops', icon: Server, color: 'red', name: 'DevOps Engineer' },
  { id: 'cloud-engineer', icon: Cloud, color: 'sky', name: 'Cloud Engineer' },
  { id: 'security-expert', icon: Shield, color: 'emerald', name: 'Security Expert' },
  { id: 'database-admin', icon: Database, color: 'slate', name: 'Database Admin' },
  { id: 'network-engineer', icon: Network, color: 'cyan', name: 'Network Engineer' },
  { id: 'mobile-dev', icon: Smartphone, color: 'pink', name: 'Mobile Developer' },
  { id: 'frontend-dev', icon: Monitor, color: 'amber', name: 'Frontend Developer' },
  { id: 'backend-dev', icon: Cpu, color: 'zinc', name: 'Backend Developer' },
  { id: 'fullstack-dev', icon: Layers, color: 'teal', name: 'Fullstack Developer' },
  { id: 'qa-engineer', icon: Bug, color: 'rose', name: 'QA Engineer' },
  { id: 'tech-lead', icon: Target, color: 'lime', name: 'Tech Lead' },
  { id: 'product-owner', icon: TrendingUp, color: 'fuchsia', name: 'Product Owner' },
  { id: 'solution-architect', icon: Globe, color: 'stone', name: 'Solution Architect' },
  { id: 'innovation-lead', icon: Lightbulb, color: 'yellow', name: 'Innovation Lead' },
  { id: 'automation-expert', icon: Zap, color: 'orange', name: 'Automation Expert' },
  { id: 'systems-admin', icon: Settings, color: 'gray', name: 'Systems Admin' },
  { id: 'cybersecurity', icon: Lock, color: 'red', name: 'Cybersecurity' },
  { id: 'git-specialist', icon: GitBranch, color: 'green', name: 'Git Specialist' }
];

const getColorClasses = (color: string, isSelected: boolean) => {
  const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
    blue: { bg: 'bg-blue-100', border: 'border-blue-500', icon: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-100', border: 'border-indigo-500', icon: 'text-indigo-600' },
    green: { bg: 'bg-green-100', border: 'border-green-500', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-500', icon: 'text-purple-600' },
    pink: { bg: 'bg-pink-100', border: 'border-pink-500', icon: 'text-pink-600' },
    yellow: { bg: 'bg-yellow-100', border: 'border-yellow-500', icon: 'text-yellow-600' },
    orange: { bg: 'bg-orange-100', border: 'border-orange-500', icon: 'text-orange-600' },
    red: { bg: 'bg-red-100', border: 'border-red-500', icon: 'text-red-600' },
    cyan: { bg: 'bg-cyan-100', border: 'border-cyan-500', icon: 'text-cyan-600' },
    emerald: { bg: 'bg-emerald-100', border: 'border-emerald-500', icon: 'text-emerald-600' },
    slate: { bg: 'bg-slate-100', border: 'border-slate-500', icon: 'text-slate-600' },
    teal: { bg: 'bg-teal-100', border: 'border-teal-500', icon: 'text-teal-600' },
    rose: { bg: 'bg-rose-100', border: 'border-rose-500', icon: 'text-rose-600' },
    violet: { bg: 'bg-violet-100', border: 'border-violet-500', icon: 'text-violet-600' },
    amber: { bg: 'bg-amber-100', border: 'border-amber-500', icon: 'text-amber-600' },
    stone: { bg: 'bg-stone-100', border: 'border-stone-500', icon: 'text-stone-600' },
    zinc: { bg: 'bg-zinc-100', border: 'border-zinc-500', icon: 'text-zinc-600' },
    lime: { bg: 'bg-lime-100', border: 'border-lime-500', icon: 'text-lime-600' },
    fuchsia: { bg: 'bg-fuchsia-100', border: 'border-fuchsia-500', icon: 'text-fuchsia-600' },
    sky: { bg: 'bg-sky-100', border: 'border-sky-500', icon: 'text-sky-600' },
    gray: { bg: 'bg-gray-100', border: 'border-gray-500', icon: 'text-gray-600' },
  };
  
  const colors = colorMap[color] || colorMap.blue;
  return {
    bg: isSelected ? colors.bg : `${colors.bg.replace('100', '50')}`,
    border: colors.border,
    icon: colors.icon
  };
};

export default function CreateProfileDialog({ isOpen, onClose, onSubmit, profilesCount }: CreateProfileDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_role: '',
    location: '',
    selectedIcon: iconOptions[0]
  });

  const handleIconSelect = (iconOption: IconOption) => {
    setFormData(prev => ({ ...prev, selectedIcon: iconOption }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    const profileData = {
      title: formData.title,
      description: formData.description || undefined,
      target_role: formData.target_role || undefined,
      location: formData.location || undefined,
      profile_image_url: JSON.stringify({
        iconId: formData.selectedIcon.id,
        color: formData.selectedIcon.color,
        name: formData.selectedIcon.name
      }),
      is_active: profilesCount === 0
    };

    try {
      await onSubmit(profileData);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        target_role: '',
        location: '',
        selectedIcon: iconOptions[0]
      });
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Create New CV Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Profile Icon</Label>
            <div className="flex items-center gap-3 mb-4">
              {(() => {
                const colors = getColorClasses(formData.selectedIcon.color, true);
                return (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${colors.bg} ${colors.border}`}>
                    <formData.selectedIcon.icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                );
              })()}
              <div>
                <div className="font-medium">{formData.selectedIcon.name}</div>
                <div className="text-sm text-muted-foreground">Selected icon</div>
              </div>
            </div>
            
            <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
              {iconOptions.map((iconOption, index) => {
                const IconComponent = iconOption.icon;
                const isSelected = formData.selectedIcon.name === iconOption.name;
                const colors = getColorClasses(iconOption.color, isSelected);
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleIconSelect(iconOption)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 border-2 ${colors.bg} ${colors.border} ${
                      isSelected 
                        ? 'ring-2 ring-primary shadow-md' 
                        : 'hover:bg-gray-100 opacity-70 hover:opacity-100'
                    }`}
                    title={iconOption.name}
                  >
                    <IconComponent className={`h-5 w-5 ${colors.icon}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Profile Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Senior Full Stack Developer, Marketing Manager"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this CV profile..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_role">Target Role</Label>
              <Input
                id="target_role"
                value={formData.target_role}
                onChange={(e) => setFormData(prev => ({ ...prev, target_role: e.target.value }))}
                placeholder="e.g., Senior Developer, Consultant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Stockholm, Remote"
              />
            </div>
          </div>

          {profilesCount === 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will be your first CV profile and will be set as active by default.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
