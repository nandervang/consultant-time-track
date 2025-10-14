import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Copy, Trash2, Plus, FileText, X, Download } from 'lucide-react';
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import { SummaryForm } from './forms/SummaryForm';
import { ExperienceProjectsForm } from './forms/ExperienceProjectsForm';
import { EducationCertificationsForm } from './forms/EducationCertificationsForm';
import { SkillsForm } from './forms/SkillsForm';
import { LanguagesForm } from './forms/LanguagesForm';
import { TemplateSettingsForm } from './forms/TemplateSettingsForm';
import { CVGenerationPanel } from './CVGenerationPanel';
import { CVGenerationDialog } from './CVGenerationDialog';
import { RolesForm } from './forms/RolesForm';
import { CompetenciesForm } from './forms/CompetenciesForm';
import { ClosingForm } from './forms/ClosingForm';
import { useCVVersions } from '@/hooks/useCVVersions';
import { niklasCV } from '@/data/niklasCV';
import type { CVGenerationData } from '@/types/cvGeneration';

interface CVEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string; // This should actually be the CV profile ID
}

const defaultCVData: CVGenerationData = {
  personalInfo: {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedIn: '',
    github: '',
    profilePhoto: ''
  },
  summary: {
    introduction: '',
    keyStrengths: [],
    careerObjective: '',
    specialties: []
  },
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  courses: [],
  languages: [],
  skills: [],
  // New optional fields for Andervang Consulting template
  roles: [],
  competencies: [],
  closing: {
    text: 'Tack för att du tog dig tid att läsa mitt CV. Jag ser fram emot möjligheten att diskutera hur jag kan bidra till ert team.',
    contact: {
      email: '',
      phone: '',
      location: '',
      company: 'Andervang Consulting'
    }
  },
  templateSettings: {
    template: 'andervang-consulting',
    theme: 'blue',
    fontSize: 'medium',
    showPhoto: true,
    showReferences: false,
    language: 'en',
    margins: 'normal',
    colorScheme: 'blue'
  }
};

export function CVEditorModal({ isOpen, onClose, userId }: CVEditorModalProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [cvData, setCvData] = useState<CVGenerationData>(defaultCVData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [pendingVersionId, setPendingVersionId] = useState<string | null>(null);
  
  console.log('CVEditorModal rendered with userId:', userId, 'isOpen:', isOpen);
  
  const { 
    versions, 
    currentVersion, 
    loading, 
    error,
    createVersion,
    updateVersion,
    deleteVersion,
    duplicateVersion,
    setCurrentVersionById
  } = useCVVersions(userId);

  console.log('useCVVersions state:', { versions: versions.length, currentVersion: currentVersion?.version_name, loading, error });

  // Load current version data when it changes
  useEffect(() => {
    if (currentVersion?.data) {
      setCvData(currentVersion.data);
      setHasUnsavedChanges(false);
    }
  }, [currentVersion]);

  // Track changes to mark as unsaved
  useEffect(() => {
    if (currentVersion && JSON.stringify(cvData) !== JSON.stringify(currentVersion.data)) {
      setHasUnsavedChanges(true);
    }
  }, [cvData, currentVersion]);

  const handleDataChange = (section: keyof CVGenerationData, data: unknown) => {
    setCvData((prev: CVGenerationData) => ({
      ...prev,
      [section]: data
    }));
  };

  const handleSave = async () => {
    if (!currentVersion) {
      // Create new version
      const newVersion = await createVersion(`CV Version ${versions.length + 1}`, cvData);
      if (newVersion) {
        console.log('New version created successfully');
        setHasUnsavedChanges(false);
      }
    } else {
      // Update existing version
      const success = await updateVersion(currentVersion.id, { data: cvData });
      if (success) {
        console.log('Version updated successfully');
        setHasUnsavedChanges(false);
      }
    }
  };

  const handleCreateNewVersion = async () => {
    const versionName = prompt('Enter version name:');
    if (versionName && versionName.trim()) {
      const newVersion = await createVersion(versionName.trim(), cvData);
      if (newVersion) {
        console.log('New version created:', newVersion.version_name);
      }
    }
  };

  const handleDuplicateVersion = async () => {
    if (!currentVersion) return;
    
    const versionName = prompt('Enter name for duplicated version:', `${currentVersion.version_name} (Copy)`);
    if (versionName && versionName.trim()) {
      await duplicateVersion(currentVersion.id, versionName.trim());
    }
  };

  const handleDeleteVersion = async () => {
    if (!currentVersion || versions.length <= 1) return;
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentVersion) return;
    await deleteVersion(currentVersion.id);
    setShowDeleteDialog(false);
  };

  const handleVersionChange = async (versionId: string) => {
    if (hasUnsavedChanges) {
      setPendingVersionId(versionId);
      setShowUnsavedDialog(true);
    } else {
      await setCurrentVersionById(versionId);
    }
  };

  const handleUnsavedSaveAndSwitch = async () => {
    if (pendingVersionId) {
      await handleSave();
      await setCurrentVersionById(pendingVersionId);
      setShowUnsavedDialog(false);
      setPendingVersionId(null);
    }
  };

  const handleUnsavedDiscardAndSwitch = async () => {
    if (pendingVersionId) {
      await setCurrentVersionById(pendingVersionId);
      setShowUnsavedDialog(false);
      setPendingVersionId(null);
    }
  };

  const handleLoadSampleData = () => {
    // Load sample data and ensure it has the correct format for API compatibility
    const sampleData = {
      ...niklasCV as CVGenerationData,
      // Ensure template is set to a valid API template
      template: 'andervang-consulting',
      // Ensure format is set for API payload
      format: 'pdf'
    };
    
    setCvData(sampleData);
    setHasUnsavedChanges(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-none w-screen h-screen p-0 overflow-hidden m-0 rounded-none border-0">
        <DialogHeader className="px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">CV Editor</DialogTitle>
            
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 px-3 py-1">
                  Unsaved changes
                </Badge>
              )}
              
              {/* Version Selector */}
              {versions.length > 0 && (
                <Select value={currentVersion?.id || ''} onValueChange={handleVersionChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select version..." />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {version.version_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Version Management Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNewVersion}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleData}
                  className="gap-1 text-green-600 hover:text-green-700"
                >
                  <FileText className="h-4 w-4" />
                  Load Sample Data
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowGenerationDialog(true)}
                  className="gap-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Generate CV
                </Button>
                
                {currentVersion && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDuplicateVersion}
                      className="gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    
                    {versions.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteVersion}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>

              <Button 
                onClick={handleSave}
                disabled={!hasUnsavedChanges && !!currentVersion}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {currentVersion ? 'Save Changes' : 'Create Version'}
              </Button>

              {/* Close Button for Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="gap-1 ml-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* CV Editor Forms */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-10 bg-gray-50 mx-6 mt-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="competencies">Competencies</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="closing">Closing</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="personal" className="h-full p-6">
                  <PersonalInfoForm
                    data={cvData.personalInfo}
                    onChange={(data) => handleDataChange('personalInfo', data)}
                  />
                </TabsContent>

                <TabsContent value="summary" className="h-full p-6">
                  <SummaryForm
                    data={cvData.summary}
                    onChange={(data) => handleDataChange('summary', data)}
                  />
                </TabsContent>

                <TabsContent value="experience" className="h-full p-6">
                  <ExperienceProjectsForm
                    experienceData={cvData.experience}
                    projectsData={cvData.projects}
                    onExperienceChange={(data) => handleDataChange('experience', data)}
                    onProjectsChange={(data) => handleDataChange('projects', data)}
                  />
                </TabsContent>

                <TabsContent value="roles" className="h-full p-6">
                  <RolesForm
                    data={cvData.roles || []}
                    onChange={(data) => handleDataChange('roles', data)}
                  />
                </TabsContent>

                <TabsContent value="skills" className="h-full p-6">
                  <SkillsForm
                    data={cvData.skills}
                    onChange={(data) => handleDataChange('skills', data)}
                  />
                </TabsContent>

                <TabsContent value="competencies" className="h-full p-6">
                  <CompetenciesForm
                    data={cvData.competencies || []}
                    onChange={(data) => handleDataChange('competencies', data)}
                  />
                </TabsContent>

                <TabsContent value="skills" className="h-full p-6">
                  <SkillsForm
                    data={cvData.skills}
                    onChange={(data) => handleDataChange('skills', data)}
                  />
                </TabsContent>

                <TabsContent value="competencies" className="h-full p-6">
                  <CompetenciesForm
                    data={cvData.competencies || []}
                    onChange={(data) => handleDataChange('competencies', data)}
                  />
                </TabsContent>

                <TabsContent value="education" className="h-full p-6">
                  <EducationCertificationsForm
                    educationData={cvData.education}
                    certificationsData={cvData.certifications}
                    coursesData={cvData.courses}
                    onEducationChange={(data) => handleDataChange('education', data)}
                    onCertificationsChange={(data) => handleDataChange('certifications', data)}
                    onCoursesChange={(data) => handleDataChange('courses', data)}
                  />
                </TabsContent>

                <TabsContent value="languages" className="h-full p-6">
                  <LanguagesForm
                    data={cvData.languages}
                    onChange={(data) => handleDataChange('languages', data)}
                  />
                </TabsContent>

                <TabsContent value="closing" className="h-full p-6">
                  <ClosingForm
                    data={cvData.closing || { text: '', contact: { email: '', phone: '', location: '', company: '' } }}
                    onChange={(data) => handleDataChange('closing', data)}
                  />
                </TabsContent>

                <TabsContent value="template" className="h-full p-6">
                  <TemplateSettingsForm
                    data={cvData.templateSettings}
                    onChange={(data) => handleDataChange('templateSettings', data)}
                    profilePhoto={cvData.personalInfo.profilePhoto}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* CV Generation Panel */}
          <div className="w-96 border-l bg-gray-50/50">
            <CVGenerationPanel 
              cvData={cvData}
              profile={{
                id: userId,
                user_id: userId,
                title: cvData.personalInfo.title || 'CV Profile',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }}
              currentVersion={currentVersion}
            />
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-6 py-2 border-t bg-gray-50 text-xs text-gray-500">
            <div className="flex gap-4">
              <span>Versions: {versions.length}</span>
              <span>Current: {currentVersion?.version_name || 'None'}</span>
              <span>Changes: {hasUnsavedChanges ? 'Yes' : 'No'}</span>
              <span>Loading: {loading ? 'Yes' : 'No'}</span>
              {error && <span className="text-red-600">Error: {error}</span>}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Delete Version Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete CV Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>Are you sure you want to delete the version "{currentVersion?.version_name}"?</p>
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. The version and all its data will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Version
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>You have unsaved changes. What would you like to do?</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUnsavedDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleUnsavedDiscardAndSwitch}>
              Discard Changes
            </Button>
            <Button onClick={handleUnsavedSaveAndSwitch}>
              Save & Switch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CV Generation Dialog */}
      <CVGenerationDialog
        isOpen={showGenerationDialog}
        onClose={() => setShowGenerationDialog(false)}
        cvData={cvData}
      />
    </Dialog>
  );
}