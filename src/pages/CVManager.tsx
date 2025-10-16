import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Edit, Eye, User, Trash2, Code, Terminal, Database, Cloud, Shield, Cpu, Network, GitBranch, Bug, Zap, Users, Target, Globe, Lightbulb, Brain, Eye as EyeIcon, Layers, Settings, Smartphone, Monitor, Server, Lock, TrendingUp } from 'lucide-react';
import { CVEditorModal } from '@/components/cv/CVEditorModal';
import CreateProfileDialog from '@/components/cv/CreateProfileDialog';
import EditProfileDialog from '@/components/cv/EditProfileDialog';
import { ProfileVersionsInfo } from '@/components/cv/ProfileVersionsInfo';
import { CVAPIStatus } from '@/components/CVAPIStatus';
import { generateSingleFormatCV, generateMultipleFormats } from '@/services/cv-generation-api';
import { transformToAPIPayload } from '@/utils/cv-data-transformer';
import type { CVAPIPayload } from '@/types/cv-api-types';
import type { ConsultantCVPayload } from '@/services/cv-generation-api';

// Convert CVAPIPayload to ConsultantCVPayload format
function convertToConsultantPayload(apiPayload: CVAPIPayload): ConsultantCVPayload {
  return {
    personalInfo: {
      name: apiPayload.personalInfo.name,
      title: apiPayload.personalInfo.title,
      email: apiPayload.personalInfo.email,
      phone: apiPayload.personalInfo.phone || '',
      location: apiPayload.personalInfo.location || '',
      profileImage: apiPayload.personalInfo.profileImage
    },
    company: apiPayload.company,
    summary: {
      introduction: apiPayload.summary.introduction,
      highlights: apiPayload.summary.highlights,
      specialties: apiPayload.summary.specialties || []
    },
    employment: (apiPayload.employment || []).map(emp => ({
      period: emp.period,
      position: emp.position,
      company: emp.company,
      description: emp.description,
      technologies: emp.technologies || [],
      achievements: emp.achievements || []
    })),
    projects: (apiPayload.projects || []).map(proj => ({
      period: proj.period,
      type: proj.type,
      title: proj.title,
      description: proj.description,
      technologies: proj.technologies || []
    })),
    education: apiPayload.education || [],
    certifications: apiPayload.certifications || [],
    competencies: (apiPayload.competencies || []).map(comp => ({
      category: comp.category,
      items: comp.skills.map(skill => skill.name)
    })),
    languages: apiPayload.languages || [],
    template: apiPayload.template,
    format: apiPayload.format,
    styling: {
      primaryColor: apiPayload.styling?.primaryColor || '#003D82',
      accentColor: apiPayload.styling?.accentColor || '#FF6B35'
    }
  };
}
import type { CVGenerationData } from '@/types/cvGeneration';
import { useCVProfiles } from '@/hooks/useCVProfiles';
import { CVProfile } from '@/types/cv';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

// Icon mapping for profile icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  developer: Code,
  'senior-dev': Terminal,
  architect: Layers,
  'scrum-master': Users,
  'ai-specialist': Brain,
  'accessibility-expert': EyeIcon,
  devops: Server,
  'cloud-engineer': Cloud,
  'security-expert': Shield,
  'database-admin': Database,
  'network-engineer': Network,
  'mobile-dev': Smartphone,
  'frontend-dev': Monitor,
  'backend-dev': Cpu,
  'fullstack-dev': Layers,
  'qa-engineer': Bug,
  'tech-lead': Target,
  'product-owner': TrendingUp,
  'solution-architect': Globe,
  'innovation-lead': Lightbulb,
  'automation-expert': Zap,
  'systems-admin': Settings,
  cybersecurity: Lock,
  'git-specialist': GitBranch,
  // Legacy mappings for backwards compatibility
  code: Code,
  terminal: Terminal,
  users: Users,
  target: Target,
  globe: Globe,
  lightbulb: Lightbulb,
  layers: Layers
};

const getColorClasses = (color: string) => {
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
  };
  
  return colorMap[color] || colorMap.blue;
};

interface ProfileIconProps {
  profile: CVProfile;
  size?: 'sm' | 'md' | 'lg';
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ profile, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  try {
    if (profile.profile_image_url) {
      const iconData = JSON.parse(profile.profile_image_url);
      const IconComponent = iconMap[iconData.iconId];
      const colors = getColorClasses(iconData.color || 'blue');
      
      if (IconComponent) {
        return (
          <div className={`${sizeClasses[size]} rounded-lg flex items-center justify-center border-2 ${colors.bg} ${colors.border}`}>
            <IconComponent className={`${iconSizeClasses[size]} ${colors.icon}`} />
          </div>
        );
      }
    }
  } catch {
    // Fall back to default icon if parsing fails
  }

  // Default fallback icon
  return (
    <div className={`${sizeClasses[size]} rounded-lg flex items-center justify-center border-2 bg-gray-100 border-gray-300`}>
      <User className={`${iconSizeClasses[size]} text-gray-600`} />
    </div>
  );
};

export default function CVManager() {
  const [showCVEditor, setShowCVEditor] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<CVProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<CVProfile | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<CVProfile | null>(null);
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  
  const { profiles, loading, createProfile, deleteProfile, updateProfile, setActiveProfile } = useCVProfiles();

  const handleCreateNew = () => {
    setShowCreateDialog(true);
  };

  const handleCreateProfile = async (profileData: {
    title: string;
    description?: string;
    target_role?: string;
    location?: string;
    profile_image_url?: string;
    is_active: boolean;
  }) => {
    const newProfile = await createProfile(profileData);
    
    if (newProfile) {
      setSelectedProfile(newProfile);
      setShowCVEditor(true);
    }
  };

  const handleEditProfile = (profile: CVProfile) => {
    setSelectedProfile(profile);
    setShowCVEditor(true);
  };

  const handleEditProfileMetadata = (profile: CVProfile) => {
    setProfileToEdit(profile);
    setShowEditProfileDialog(true);
  };

  const handleUpdateProfile = async (profileId: string, profileData: {
    title: string;
    description?: string;
    target_role?: string;
    location?: string;
    profile_image_url?: string;
  }) => {
    try {
      await updateProfile(profileId, profileData);
      setShowEditProfileDialog(false);
      setProfileToEdit(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const handleSetActiveProfile = async (profileId: string) => {
    try {
      await setActiveProfile(profileId);
    } catch (error) {
      console.error('Failed to set active profile:', error);
    }
  };

  // Helper function to get CV data for a profile
  const getCVDataForProfile = async (profileId: string): Promise<CVGenerationData | null> => {
    try {
      // Get the current CV version for this profile
      const { data: versions, error } = await supabase
        .from('cv_versions')
        .select('*')
        .eq('cv_profile_id', profileId)
        .eq('is_current', true)
        .single();

      if (error || !versions?.snapshot_data) {
        console.warn('No CV data found for profile', profileId);
        return null;
      }

      return versions.snapshot_data;
    } catch (error) {
      console.error('Error fetching CV data:', error);
      return null;
    }
  };

  const handleQuickGenerate = async (format: 'pdf' | 'docx' | 'html') => {
    const activeProfile = profiles.find(p => p.is_active);
    if (!activeProfile) return;

    const generationKey = `${activeProfile.id}-${format}`;
    setIsGenerating(prev => ({ ...prev, [generationKey]: true }));

    try {
      // Get CV data from the current version
      const cvData = await getCVDataForProfile(activeProfile.id);
      
      if (!cvData) {
        // If no CV data exists, open the CV editor instead
        setSelectedProfile(activeProfile);
        setShowCVEditor(true);
        return;
      }

      // Transform data and generate CV
      const apiPayload = transformToAPIPayload(cvData, {
        format,
        template: 'andervang-consulting',
        company: 'Frank Digital AB'
      });

      const consultantPayload = convertToConsultantPayload(apiPayload);
      const result = await generateSingleFormatCV(consultantPayload);
      
      if (result.success && result.data?.url) {
        // Create a download link and trigger download
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = `${activeProfile.title}_CV.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Failed to generate CV:', error);
      // Fallback to opening CV editor
      setSelectedProfile(activeProfile);
      setShowCVEditor(true);
    } finally {
      setIsGenerating(prev => ({ ...prev, [generationKey]: false }));
    }
  };

  const handleQuickGenerateAll = async () => {
    const activeProfile = profiles.find(p => p.is_active);
    if (!activeProfile) return;

    const generationKey = `${activeProfile.id}-all`;
    setIsGenerating(prev => ({ ...prev, [generationKey]: true }));

    try {
      // Get CV data from the current version
      const cvData = await getCVDataForProfile(activeProfile.id);
      
      if (!cvData) {
        // If no CV data exists, open the CV editor instead
        setSelectedProfile(activeProfile);
        setShowCVEditor(true);
        return;
      }

      // Transform data without format (for multi-format generation)
      const apiPayload = transformToAPIPayload(cvData, {
        format: 'pdf', // Default format, will be overridden
        template: 'andervang-consulting',
        company: 'Frank Digital AB'
      });

      const consultantPayload = convertToConsultantPayload(apiPayload);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { format, ...basePayload } = consultantPayload;
      const results = await generateMultipleFormats(basePayload, ['pdf', 'docx', 'html']);

      // Download all successful formats
      Object.entries(results).forEach(([format, result]) => {
        if (result.success && result.data?.url) {
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = result.data!.url;
            link.download = `${activeProfile.title}_CV.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, 100); // Small delay between downloads
        }
      });
    } catch (error) {
      console.error('Failed to generate CVs:', error);
      // Fallback to opening CV editor
      setSelectedProfile(activeProfile);
      setShowCVEditor(true);
    } finally {
      setIsGenerating(prev => ({ ...prev, [generationKey]: false }));
    }
  };

  const handleDeleteProfile = (profile: CVProfile) => {
    setProfileToDelete(profile);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;
    
    try {
      await deleteProfile(profileToDelete.id);
      setShowDeleteDialog(false);
      setProfileToDelete(null);
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading CV data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CV Manager</h1>
          <p className="text-muted-foreground">
            Create and manage your professional CV profiles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CVAPIStatus />
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New CV Profile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">
              CV profiles created
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Profile</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.find(p => p.is_active)?.title || 'None'}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Currently active
            </p>
            {profiles.find(p => p.is_active) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Quick CV Generation</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleQuickGenerate('pdf')}
                    disabled={isGenerating[`${profiles.find(p => p.is_active)?.id}-pdf`]}
                  >
                    {isGenerating[`${profiles.find(p => p.is_active)?.id}-pdf`] ? (
                      <>⏳ Generating...</>
                    ) : (
                      <>📄 PDF</>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleQuickGenerate('docx')}
                    disabled={isGenerating[`${profiles.find(p => p.is_active)?.id}-docx`]}
                  >
                    {isGenerating[`${profiles.find(p => p.is_active)?.id}-docx`] ? (
                      <>⏳ Generating...</>
                    ) : (
                      <>📝 DOCX</>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleQuickGenerate('html')}
                    disabled={isGenerating[`${profiles.find(p => p.is_active)?.id}-html`]}
                  >
                    {isGenerating[`${profiles.find(p => p.is_active)?.id}-html`] ? (
                      <>⏳ Generating...</>
                    ) : (
                      <>🌐 HTML</>
                    )}
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => handleQuickGenerateAll()}
                  disabled={isGenerating[`${profiles.find(p => p.is_active)?.id}-all`]}
                >
                  <FileText className="h-3 w-3" />
                  {isGenerating[`${profiles.find(p => p.is_active)?.id}-all`] ? (
                    'Generating All...'
                  ) : (
                    'Generate All Formats'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.length > 0 ? formatDistanceToNow(new Date(Math.max(...profiles.map(p => new Date(p.updated_at).getTime()))), { addSuffix: true }) : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent edit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CV Profiles Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Your CV Profiles</CardTitle>
          <CardDescription>
            Create and manage different CV profiles for various roles and industries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No CV profiles yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first CV profile to get started
              </p>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Profile
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile) => (
                <Card key={profile.id} className={`cursor-pointer transition-all hover:shadow-md ${profile.is_active ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ProfileIcon profile={profile} size="sm" />
                        <CardTitle className="text-lg">{profile.title}</CardTitle>
                      </div>
                      {profile.is_active && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Role:</span>
                        <span>{profile.target_role || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Location:</span>
                        <span>{profile.location || 'Not specified'}</span>
                      </div>
                      {profile.description && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Description:</span>
                          <span className="truncate">{profile.description}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Updated:</span>
                        <span>{formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true })}</span>
                      </div>
                      
                      {/* CV Variants Information */}
                      <div className="pt-2 border-t">
                        <ProfileVersionsInfo
                          profileId={profile.id}
                          onCreateVersion={() => {
                            setSelectedProfile(profile);
                            setShowCVEditor(true);
                          }}
                          onEditVersions={() => {
                            setSelectedProfile(profile);
                            setShowCVEditor(true);
                          }}
                        />
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditProfile(profile)}
                        className="flex-1 gap-2"
                      >
                        <Edit className="h-3 w-3" />
                        Edit CV
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditProfileMetadata(profile)}
                        className="gap-2"
                      >
                        <Settings className="h-3 w-3" />
                        Profile
                      </Button>
                      {!profile.is_active && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSetActiveProfile(profile.id)}
                          className="gap-2 text-green-600 hover:text-green-700 hover:border-green-300"
                        >
                          <Target className="h-3 w-3" />
                          Set Active
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteProfile(profile)}
                        className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Card */}
              <Card className="cursor-pointer transition-all hover:shadow-md border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full py-12">
                  <Plus className="h-8 w-8 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Add New Profile</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Create a CV profile for a different role or industry
                  </p>
                  <Button onClick={handleCreateNew} variant="outline" size="sm">
                    Create Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CV Editor Modal */}
      {showCVEditor && selectedProfile && (
        <CVEditorModal
          isOpen={showCVEditor}
          onClose={() => {
            setShowCVEditor(false);
            setSelectedProfile(null);
          }}
          userId={selectedProfile.id}
        />
      )}

      {/* Delete Profile Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete CV Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>Are you sure you want to delete the CV profile "{profileToDelete?.title}"?</p>
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. All CV versions and data associated with this profile will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Profile Dialog */}
      <CreateProfileDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateProfile}
        profilesCount={profiles.length}
      />

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={showEditProfileDialog}
        onClose={() => {
          setShowEditProfileDialog(false);
          setProfileToEdit(null);
        }}
        onSubmit={handleUpdateProfile}
        profile={profileToEdit}
      />
    </div>
  );
}