import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Edit, Eye, User, Trash2 } from 'lucide-react';
import { CVEditorModal } from '@/components/cv/CVEditorModal';
import { useCVProfiles } from '@/hooks/useCVProfiles';
import { CVProfile } from '@/types/cv';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function CVManager() {
  const [showCVEditor, setShowCVEditor] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<CVProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<CVProfile | null>(null);
  
  const { profiles, loading, createProfile, deleteProfile } = useCVProfiles();

  const handleCreateNew = async () => {
    const newProfile = await createProfile({
      title: `CV Profile ${profiles.length + 1}`,
      target_role: 'Software Developer',
      is_active: profiles.length === 0
    });
    
    if (newProfile) {
      setSelectedProfile(newProfile);
      setShowCVEditor(true);
    }
  };

  const handleEditProfile = (profile: CVProfile) => {
    setSelectedProfile(profile);
    setShowCVEditor(true);
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
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New CV Profile
        </Button>
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
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
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
                      <CardTitle className="text-lg">{profile.title}</CardTitle>
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
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
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
    </div>
  );
}