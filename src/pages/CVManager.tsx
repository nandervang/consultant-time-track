import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Briefcase, User, Trophy, BookOpen, Download, Copy, Archive, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCVProfiles } from '@/hooks/useCVProfiles';
import { useJobApplications } from '@/hooks/useJobApplications';
import { CreateCVProfileDialog } from '@/components/cv/CreateCVProfileDialog';
import { formatDistanceToNow } from 'date-fns';
import { APPLICATION_STATUSES } from '@/types/cv';

export default function CVManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { profiles, loading: profilesLoading } = useCVProfiles();
  const { applications, loading: applicationsLoading, getApplicationStats } = useJobApplications();

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
        <TabsList className="grid w-full grid-cols-5">
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
            <Button>
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
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Application
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills & Competencies</CardTitle>
              <CardDescription>
                Manage your skills and track proficiency levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Trophy className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Skills management coming soon</h3>
                <p className="text-sm mb-4">Skills tracking with proficiency levels will be available soon</p>
                <Button disabled>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Skills
                </Button>
              </div>
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
      </Tabs>

      <CreateCVProfileDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
}
