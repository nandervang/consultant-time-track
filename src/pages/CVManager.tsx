import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Briefcase, User, Trophy, BookOpen, Download, Copy, Archive, Edit, Trash2, Search, Filter, Star, MessageSquare, TrendingUp, GraduationCap, Palette, BarChart3, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCVProfiles } from '@/hooks/useCVProfiles';
import { useJobApplications } from '@/hooks/useJobApplications';
import { useAllCVSkills } from '@/hooks/useAllCVSkills';
import { CVProfile } from '@/types/cv';
import { useMotivationTexts } from '@/hooks/useMotivationTexts';
import { useEnhancedProjects, useEnhancedExperiences, useTechnologyTags, useAchievements } from '@/hooks/useEnhancedCV';
import { useEnhancedEducation, useEnhancedCertifications, useEducationTimeline } from '@/hooks/useEnhancedEducation';
import { useCVTemplates, useCVGenerations, useCVAnalytics } from '@/hooks/useCVGeneration';
import { CreateCVProfileDialog } from '@/components/cv/CreateCVProfileDialog';
import { CreateJobApplicationDialog } from '@/components/cv/CreateJobApplicationDialog';
import { CreateSkillDialog } from '@/components/cv/CreateSkillDialog';
import { CreateMotivationTextDialog } from '@/components/cv/CreateMotivationTextDialog';
import { MotivationTextCard } from '@/components/cv/MotivationTextCard';
import { EnhancedExperienceCard } from '@/components/cv/EnhancedExperienceCard';
import { EnhancedProjectCard } from '@/components/cv/EnhancedProjectCard';
import { EnhancedEducationCard } from '@/components/cv/EnhancedEducationCard';
import { EnhancedCertificationCard } from '@/components/cv/EnhancedCertificationCard';
import { CVTemplateSelector } from '@/components/cv/CVTemplateSelector';
import { formatDistanceToNow } from 'date-fns';
import { APPLICATION_STATUSES, SKILL_LEVELS } from '@/types/cv';

export default function CVManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<string>('all');
  const [selectedCVProfileId, setSelectedCVProfileId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showCVGeneration, setShowCVGeneration] = useState(false);
  
  const { profiles, loading: profilesLoading } = useCVProfiles();
  const { applications, loading: applicationsLoading, getApplicationStats } = useJobApplications();
  const { 
    skills: allSkills, 
    loading: skillsLoading, 
    getSkillsByCategory, 
    getSkillStats,
    deleteSkill,
    refetch: refetchSkills
  } = useAllCVSkills();
  
  // Use the first active profile or first profile as default
  const defaultProfileId = profiles.find(p => p.is_active)?.id || profiles[0]?.id || null;
  const currentProfileId = selectedCVProfileId || defaultProfileId;
  
  const {
    motivationTexts,
    loading: motivationTextsLoading,
    createMotivationText,
    updateMotivationText,
    deleteMotivationText,
    duplicateMotivationText,
    setAsDefault,
    getAllPurposes
  } = useMotivationTexts(currentProfileId);

  // Enhanced CV hooks
  const {
    projects: enhancedProjects,
    loading: projectsLoading,
    createProject,
    updateProject,
    deleteProject,
    toggleFeatured: toggleProjectFeatured
  } = useEnhancedProjects(selectedCVProfileId);

  const {
    experiences: enhancedExperiences,
    loading: experiencesLoading,
    createExperience,
    updateExperience,
    deleteExperience
  } = useEnhancedExperiences(selectedCVProfileId);

  const {
    tags: technologyTags,
    loading: tagsLoading,
    createTag,
    updateTag,
    deleteTag,
    getAllCategories
  } = useTechnologyTags(selectedCVProfileId);

  const {
    achievements,
    loading: achievementsLoading,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    toggleFeatured: toggleAchievementFeatured
  } = useAchievements(selectedCVProfileId);

  // Enhanced Education hooks
  const {
    education: enhancedEducation,
    loading: educationLoading,
    createEducation,
    updateEducation,
    deleteEducation,
    toggleFeatured: toggleEducationFeatured
  } = useEnhancedEducation(selectedCVProfileId);

  const {
    certifications: enhancedCertifications,
    loading: certificationsLoading,
    createCertification,
    updateCertification,
    deleteCertification,
    toggleFeatured: toggleCertificationFeatured,
    getExpiringSoon,
    getExpired
  } = useEnhancedCertifications(selectedCVProfileId);

  const {
    timeline: educationTimeline,
    loading: timelineLoading,
    getTimelineByYear,
    getTimelineByType
  } = useEducationTimeline(selectedCVProfileId);

  // Phase 4: CV Generation hooks
  const {
    templates,
    loading: templatesLoading,
    getTemplatesByType,
    getTemplatesByIndustry
  } = useCVTemplates();

  const {
    generations,
    loading: generationsLoading,
    createGeneration,
    recordDownload,
    recordMetric
  } = useCVGenerations(selectedCVProfileId);

  const {
    analytics,
    summary: analyticsSummary,
    loading: analyticsLoading,
    getMetricsByType,
    getUsageByTimeframe
  } = useCVAnalytics(selectedCVProfileId);

  const stats = getApplicationStats();
  const activeProfiles = profiles.filter(p => p.is_active);

  // Filter applications based on search and status
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter skills based on search and category
  const filteredSkills = allSkills.filter(skill => {
    const matchesSearch = skillSearchTerm === '' || 
      skill.skill_name.toLowerCase().includes(skillSearchTerm.toLowerCase());
    const matchesCategory = skillCategoryFilter === 'all' || skill.category === skillCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getSkillLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-50 border-red-200 text-red-900';
      case 2: return 'bg-orange-50 border-orange-200 text-orange-900';
      case 3: return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 4: return 'bg-blue-50 border-blue-200 text-blue-900';
      case 5: return 'bg-green-50 border-green-200 text-green-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (confirm('Are you sure you want to delete this skill?')) {
      try {
        await deleteSkill(skillId);
        refetchSkills();
      } catch (error) {
        console.error('Failed to delete skill:', error);
      }
    }
  };

  const handleEditSkill = (skill: typeof allSkills[0]) => {
    // TODO: Implement edit skill functionality
    console.log('Edit skill:', skill);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-700';
      case 'interview': return 'bg-yellow-100 text-yellow-700';
      case 'offered': return 'bg-green-100 text-green-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'withdrawn': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CV & Resume Manager</h1>
          <p className="text-gray-600 mt-1">
            Manage your professional profiles and track job applications
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm">
            <Archive className="mr-2 h-4 w-4" />
            Versions
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New CV Profile
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="motivation" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Motivation Texts
          </TabsTrigger>
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Enhanced CV
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            CV Generation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  CV Profiles
                </CardTitle>
                <div className="p-2 rounded-full bg-blue-100">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profiles.length}</div>
                <p className="text-xs text-gray-500 mt-1">{activeProfiles.length} active profiles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Applications
                </CardTitle>
                <div className="p-2 rounded-full bg-green-100">
                  <Briefcase className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.pending} in progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Interview Rate
                </CardTitle>
                <div className="p-2 rounded-full bg-purple-100">
                  <Trophy className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.interviewRate}%</div>
                <p className="text-xs text-gray-500 mt-1">Success rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Success Rate
                </CardTitle>
                <div className="p-2 rounded-full bg-orange-100">
                  <BookOpen className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                <p className="text-xs text-gray-500 mt-1">Offers received</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Your latest job applications</CardDescription>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.slice(0, 3).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{app.job_title}</p>
                          <p className="text-sm text-gray-500">{app.company_name}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(app.status)}`}>
                            {APPLICATION_STATUSES[app.status as keyof typeof APPLICATION_STATUSES]?.label || app.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(app.application_date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No applications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CV Profiles</CardTitle>
                <CardDescription>Manage your different CV versions</CardDescription>
              </CardHeader>
              <CardContent>
                {profilesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : profiles.length > 0 ? (
                  <div className="space-y-4">
                    {profiles.slice(0, 3).map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{profile.title}</p>
                            {profile.is_active && (
                              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{profile.target_role || 'No target role specified'}</p>
                          <p className="text-xs text-gray-400">
                            Updated {formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No CV profiles yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      Create your first profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CV Profiles</CardTitle>
              <CardDescription>
                Create and manage different versions of your CV for different roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : profiles.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {profiles.map((profile) => (
                    <Card key={profile.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{profile.title}</CardTitle>
                            {profile.target_role && (
                              <CardDescription className="mt-1">{profile.target_role}</CardDescription>
                            )}
                          </div>
                          {profile.is_active && (
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                              Active
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {profile.description && (
                          <p className="text-sm text-gray-600 mb-3">{profile.description}</p>
                        )}
                        
                        {profile.key_attributes && profile.key_attributes.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Key Attributes:</p>
                            <div className="flex flex-wrap gap-1">
                              {profile.key_attributes.slice(0, 3).map((attr, index) => (
                                <span key={index} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {attr}
                                </span>
                              ))}
                              {profile.key_attributes.length > 3 && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  +{profile.key_attributes.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Updated {formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true })}</span>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No CV profiles yet</h3>
                  <p className="text-sm mb-4">Create your first CV profile to get started</p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create CV Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Filter by application status"
                >
                  <option value="all">All Statuses</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offered">Offered</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
            <Button onClick={() => setShowApplicationDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Job Applications</CardTitle>
                  <CardDescription>Track your job applications and their status</CardDescription>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredApplications.length} of {applications.length} applications
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredApplications.length > 0 ? (
                <div className="space-y-4">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                          <h3 className="font-medium text-lg">{app.job_title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(app.status)}`}>
                            {APPLICATION_STATUSES[app.status as keyof typeof APPLICATION_STATUSES]?.label || app.status}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium text-gray-900">{app.company_name}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                            <span>Applied: {new Date(app.application_date).toLocaleDateString()}</span>
                            <span className="hidden sm:block">•</span>
                            <span>{formatDistanceToNow(new Date(app.application_date), { addSuffix: true })}</span>
                            {app.salary_range && (
                              <>
                                <span className="hidden sm:block">•</span>
                                <span className="text-green-600 font-medium">{app.salary_range}</span>
                              </>
                            )}
                          </div>
                          {app.job_url && (
                            <a 
                              href={app.job_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline inline-block mt-1"
                            >
                              View Job Posting →
                            </a>
                          )}
                        </div>
                        {(app.interview_notes || app.job_highlights) && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            {app.job_highlights && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">Job Highlights:</p>
                                <p className="text-sm text-gray-700">{app.job_highlights}</p>
                              </div>
                            )}
                            {app.interview_notes && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 mb-1">Interview Notes:</p>
                                <p className="text-sm text-gray-700">{app.interview_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button variant="ghost" size="sm" title="Edit Application">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Delete Application">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm || statusFilter !== 'all' ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No applications found matching your criteria</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No job applications yet</p>
                  <p className="text-sm mt-1">Start tracking your job search progress</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowApplicationDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Application
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          {/* Search and Filter Bar for Skills */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search skills..."
                  value={skillSearchTerm}
                  onChange={(e) => setSkillSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={skillCategoryFilter}
                  onChange={(e) => setSkillCategoryFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Filter by skill category"
                >
                  <option value="all">All Categories</option>
                  {Object.keys(getSkillsByCategory()).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={() => setShowSkillDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </div>

          {/* Skills Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{getSkillStats().total}</p>
                    <p className="text-sm text-gray-600">Total Skills</p>
                  </div>
                  <Trophy className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{getSkillStats().highlighted}</p>
                    <p className="text-sm text-gray-600">Highlighted</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{getSkillStats().averageLevel}</p>
                    <p className="text-sm text-gray-600">Avg Level</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{getSkillStats().categories}</p>
                    <p className="text-sm text-gray-600">Categories</p>
                  </div>
                  <Archive className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Display */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Skills & Competencies</CardTitle>
                  <CardDescription>Kammarkollegiet competency scale (1-5)</CardDescription>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredSkills.length} of {allSkills.length} skills
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {skillsLoading ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredSkills.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md ${getSkillLevelColor(skill.skill_level)} ${
                        skill.is_highlighted ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{skill.skill_name}</h3>
                            {skill.is_highlighted && <Star className="h-4 w-4 text-yellow-600" />}
                          </div>
                          
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Nivå {skill.skill_level}: {SKILL_LEVELS[skill.skill_level as keyof typeof SKILL_LEVELS]?.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {SKILL_LEVELS[skill.skill_level as keyof typeof SKILL_LEVELS]?.description}
                            </p>
                          </div>

                          {skill.category && (
                            <div className="mt-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                {skill.category}
                              </span>
                            </div>
                          )}

                          {skill.years_of_experience && (
                            <div className="mt-2 text-xs text-gray-500">
                              {skill.years_of_experience} år erfarenhet
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit Skill"
                            onClick={() => handleEditSkill(skill)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Delete Skill"
                            onClick={() => handleDeleteSkill(skill.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : skillSearchTerm || skillCategoryFilter !== 'all' ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No skills found matching your criteria</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      setSkillSearchTerm('');
                      setSkillCategoryFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No skills added yet</p>
                  <p className="text-sm mt-1">Start building your competency profile</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowSkillDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Skill
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Analytics</CardTitle>
              <CardDescription>
                Insights into your job search performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics coming soon</h3>
                <p className="text-sm mb-4">Detailed analytics will be available when you have more data</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motivation" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Motivation Texts</h2>
              <p className="text-gray-600">Manage your motivation texts for different types of applications</p>
            </div>
            {selectedCVProfileId && (
              <CreateMotivationTextDialog 
                cvProfileId={selectedCVProfileId}
                onCreateMotivationText={createMotivationText}
                existingPurposes={getAllPurposes()}
              />
            )}
          </div>

          {/* CV Profile Selection */}
          {profiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select CV Profile</CardTitle>
                <CardDescription>
                  Choose which CV profile to manage motivation texts for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select 
                  value={selectedCVProfileId || ''} 
                  onChange={(e) => setSelectedCVProfileId(e.target.value || null)}
                  className="w-full p-2 border rounded-md"
                  aria-label="Select CV Profile"
                >
                  <option value="">Select a CV profile...</option>
                  {profiles.map((profile: CVProfile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.title}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          {/* Motivation Texts List */}
          {selectedCVProfileId && (
            <div className="space-y-4">
              {motivationTextsLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2">Loading motivation texts...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : motivationTexts.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-gray-500">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No motivation texts yet</h3>
                      <p className="text-sm mb-4">Create your first motivation text to get started</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {motivationTexts.map((motivationText) => (
                    <MotivationTextCard
                      key={motivationText.id}
                      motivationText={motivationText}
                      onUpdate={updateMotivationText}
                      onDelete={deleteMotivationText}
                      onDuplicate={duplicateMotivationText}
                      onSetAsDefault={setAsDefault}
                      existingPurposes={getAllPurposes()}
                      cvProfileId={selectedCVProfileId}
                      onCreateMotivationText={createMotivationText}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enhanced" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Enhanced CV Management</h2>
              <p className="text-gray-600">Advanced project and experience management with technology tracking</p>
            </div>
          </div>

          {/* CV Profile Selection */}
          {profiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select CV Profile</CardTitle>
                <CardDescription>
                  Choose which CV profile to manage enhanced features for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select 
                  value={selectedCVProfileId || ''} 
                  onChange={(e) => setSelectedCVProfileId(e.target.value || null)}
                  className="w-full p-2 border rounded-md"
                  aria-label="Select CV Profile"
                >
                  <option value="">Select a CV profile...</option>
                  {profiles.map((profile: CVProfile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.title}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          {selectedCVProfileId && (
            <div className="space-y-8">
              {/* Enhanced Projects Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Enhanced Projects</h3>
                  <Button onClick={() => {/* TODO: Add create project dialog */}}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </div>
                
                {projectsLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2">Loading projects...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : enhancedProjects.length === 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-gray-500">
                        <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                        <p className="text-sm mb-4">Create your first enhanced project to get started</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {enhancedProjects.map((project) => (
                      <EnhancedProjectCard
                        key={project.id}
                        project={project}
                        onEdit={(project) => {/* TODO: Add edit handler */}}
                        onDelete={deleteProject}
                        onToggleFeatured={toggleProjectFeatured}
                        onAddAchievement={(projectId) => {/* TODO: Add achievement handler */}}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Enhanced Experiences Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Enhanced Experiences</h3>
                  <Button onClick={() => {/* TODO: Add create experience dialog */}}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </div>
                
                {experiencesLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2">Loading experiences...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : enhancedExperiences.length === 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-gray-500">
                        <Trophy className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No experiences yet</h3>
                        <p className="text-sm mb-4">Create your first enhanced experience to get started</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {enhancedExperiences.map((experience) => (
                      <EnhancedExperienceCard
                        key={experience.id}
                        experience={experience}
                        onEdit={(experience) => {/* TODO: Add edit handler */}}
                        onDelete={deleteExperience}
                        onAddAchievement={(experienceId) => {/* TODO: Add achievement handler */}}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Technology Tags Overview */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Technology Tags</h3>
                  <Button onClick={() => {/* TODO: Add create tag dialog */}}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Technology
                  </Button>
                </div>
                
                {tagsLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2">Loading technology tags...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : technologyTags.length === 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-gray-500">
                        <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No technology tags yet</h3>
                        <p className="text-sm mb-4">Technology tags will be automatically created when you add them to projects and experiences</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Technology Overview</CardTitle>
                      <CardDescription>
                        Your most used technologies across projects and experiences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getAllCategories().map((category) => (
                          <div key={category}>
                            <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
                            <div className="flex flex-wrap gap-2">
                              {technologyTags
                                .filter(tag => tag.category === category)
                                .slice(0, 10) // Show top 10 per category
                                .map((tag) => (
                                <Badge 
                                  key={tag.id} 
                                  variant="secondary" 
                                  className="text-xs"
                                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                >
                                  {tag.name} ({tag.usage_count})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          {!selectedCVProfileId ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a CV profile to manage education and certifications</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Education Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education
                    </span>
                    <Button 
                      size="sm"
                      onClick={() => {/* TODO: Add create education handler */}}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Manage educational background and qualifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {educationLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading education...</p>
                    </div>
                  ) : enhancedEducation.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No education entries yet</p>
                      <p className="text-sm text-gray-400">Add your educational background to get started</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {enhancedEducation.map((education) => (
                        <EnhancedEducationCard
                          key={education.id}
                          education={education}
                          onEdit={(education) => {/* TODO: Add edit handler */}}
                          onDelete={(educationId) => deleteEducation(educationId)}
                          onToggleFeatured={(educationId) => toggleEducationFeatured(educationId)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certifications Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Certifications
                      {getExpiringSoon().length > 0 && (
                        <Badge variant="destructive">
                          {getExpiringSoon().length} Expiring Soon
                        </Badge>
                      )}
                    </span>
                    <Button 
                      size="sm"
                      onClick={() => {/* TODO: Add create certification handler */}}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Certification
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Track professional certifications and their expiry dates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {certificationsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading certifications...</p>
                    </div>
                  ) : enhancedCertifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No certifications yet</p>
                      <p className="text-sm text-gray-400">Add professional certifications to track your credentials</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {enhancedCertifications.map((certification) => (
                        <EnhancedCertificationCard
                          key={certification.id}
                          certification={certification}
                          onEdit={(certification) => {/* TODO: Add edit handler */}}
                          onDelete={(certificationId) => deleteCertification(certificationId)}
                          onToggleFeatured={(certificationId) => toggleCertificationFeatured(certificationId)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Education Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Education Timeline
                  </CardTitle>
                  <CardDescription>
                    Visual timeline of educational achievements and certifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timelineLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading timeline...</p>
                    </div>
                  ) : educationTimeline.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No timeline data available</p>
                      <p className="text-sm text-gray-400">Add education or certifications to see your timeline</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {educationTimeline.map((item, index) => (
                        <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                          <div className="flex-shrink-0 w-20 text-sm text-gray-500 font-medium">
                            {item.start_date ? new Date(item.start_date).getFullYear() : 'N/A'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={item.item_type === 'education' ? 'default' : 'secondary'}>
                                {item.item_type === 'education' ? 'Education' : 'Certification'}
                              </Badge>
                              <h4 className="font-medium">{item.title}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{item.institution_provider}</p>
                            {item.end_date && !item.is_ongoing && (
                              <p className="text-sm text-gray-500 mt-1">
                                Completed: {new Date(item.end_date).getFullYear()}
                              </p>
                            )}
                            {item.is_ongoing && (
                              <p className="text-sm text-gray-500 mt-1">Ongoing</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="generation" className="space-y-6">
          {profiles.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No CV Profiles Found</h3>
              <p className="text-gray-500 mb-6">Create your first CV profile to start generating professional CVs</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First CV Profile
              </Button>
            </div>
          ) : !selectedCVProfileId ? (
            <div className="space-y-6">
              {/* CV Profile Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Select CV Profile
                  </CardTitle>
                  <CardDescription>
                    Choose which CV profile to use for generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map((profile) => (
                      <Card 
                        key={profile.id} 
                        className="cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
                        onClick={() => setSelectedCVProfileId(profile.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{profile.title}</h4>
                            {profile.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          {profile.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {profile.description}
                            </p>
                          )}
                          {profile.target_role && (
                            <p className="text-xs text-gray-500">
                              Target: {profile.target_role}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Profile Header */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-blue-900">
                          {profiles.find(p => p.id === selectedCVProfileId)?.title}
                        </h4>
                        <p className="text-sm text-blue-600">
                          {profiles.find(p => p.id === selectedCVProfileId)?.target_role || 'CV Profile Selected'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedCVProfileId(null)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Change Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    CV Templates
                  </CardTitle>
                  <CardDescription>
                    Choose from professional templates designed for different industries and roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CVTemplateSelector
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={(template) => {
                      setSelectedTemplate(template)
                      recordMetric('template_view', 1, { template_id: template.id })
                      setShowCVGeneration(true)
                    }}
                    loading={templatesLoading}
                  />
                </CardContent>
              </Card>

              {/* CV Generation Interface */}
              {selectedTemplate && showCVGeneration && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <FileText className="h-5 w-5" />
                      Generate CV with {selectedTemplate.name}
                    </CardTitle>
                    <CardDescription>
                      Create a professional CV using the selected template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <h4 className="font-medium">{selectedTemplate.name}</h4>
                        <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{selectedTemplate.template_type}</Badge>
                          <Badge variant="outline">{selectedTemplate.industry_focus}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(null)
                            setShowCVGeneration(false)
                          }}
                        >
                          Change Template
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!selectedCVProfileId) {
                              alert('Please select a CV profile first')
                              return
                            }
                            
                            try {
                              const generation = await createGeneration({
                                template_id: selectedTemplate.id,
                                generation_config: selectedTemplate.sections_config,
                                content_data: {}, // This would contain the actual CV data
                                output_format: 'html'
                              })
                              
                              if (generation) {
                                alert('CV generation started! Check the Recent Generations section below.')
                                setSelectedTemplate(null)
                                setShowCVGeneration(false)
                              }
                            } catch (error) {
                              alert('Failed to start CV generation. Please try again.')
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate CV
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Generations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Recent Generations
                    </span>
                    <Badge variant="secondary">
                      {generations.length} total
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Your recently generated CVs and their download status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generationsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading generations...</p>
                    </div>
                  ) : generations.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No CV generations yet</p>
                      <p className="text-sm text-gray-400">Generate your first professional CV using the templates above</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {generations.slice(0, 5).map((generation) => (
                        <div key={generation.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {generation.output_format.toUpperCase()} CV - {new Date(generation.created_at).toLocaleDateString()}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Status: <Badge variant={generation.generation_status === 'completed' ? 'default' : 'secondary'}>
                                {generation.generation_status}
                              </Badge>
                              {generation.download_count > 0 && (
                                <span className="ml-2">• Downloaded {generation.download_count} times</span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {generation.file_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => recordDownload(generation.id)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {!selectedCVProfileId ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a CV profile to view analytics and insights</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Analytics Summary */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CV Generations</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsLoading ? '...' : analyticsSummary?.total_generations || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Total generated CVs</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsLoading ? '...' : analyticsSummary?.total_downloads || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Total downloads</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Used Template</CardTitle>
                    <Palette className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold truncate">
                      {analyticsLoading ? '...' : analyticsSummary?.most_used_template || 'None'}
                    </div>
                    <p className="text-xs text-muted-foreground">Preferred template</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Popular Format</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {analyticsLoading ? '...' : (analyticsSummary?.most_popular_format || 'None').toUpperCase()}
                    </div>
                    <p className="text-xs text-muted-foreground">Most downloaded format</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your CV generation and download activity over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading analytics...</p>
                    </div>
                  ) : analytics.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No activity data yet</p>
                      <p className="text-sm text-gray-400">Generate and download CVs to see analytics</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.slice(0, 10).map((metric) => (
                        <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {metric.metric_type === 'generation' && <FileText className="h-5 w-5 text-blue-500" />}
                            {metric.metric_type === 'download' && <Download className="h-5 w-5 text-green-500" />}
                            {metric.metric_type === 'view' && <Eye className="h-5 w-5 text-purple-500" />}
                            <div>
                              <p className="font-medium capitalize">{metric.metric_type}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(metric.recorded_at).toLocaleDateString()} at{' '}
                                {new Date(metric.recorded_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            Value: {metric.metric_value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

      </Tabs>

      <CreateCVProfileDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
      
      <CreateJobApplicationDialog 
        open={showApplicationDialog} 
        onOpenChange={setShowApplicationDialog} 
      />
      
      <CreateSkillDialog 
        open={showSkillDialog} 
        onOpenChange={setShowSkillDialog}
        onSkillCreated={refetchSkills}
      />
    </div>
  );
}
