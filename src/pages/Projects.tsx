import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Briefcase, 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  Archive,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  Target,
  AlertCircle
} from 'lucide-react';
import { useProjects, Project, CreateProjectData } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import { useModalContext } from '@/contexts/ModalContext';
import { formatSEK } from '../lib/currency';

export default function ProjectsPage() {
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError, 
    addProject, 
    updateProject, 
    deleteProject,
    getProjectsByClient 
  } = useProjects();
  
  const { clients, loading: clientsLoading } = useClients();
  const modalContext = useModalContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Connect modal context to project form
  useEffect(() => {
    if (modalContext.projectModalOpen) {
      setShowAddForm(true);
      modalContext.setProjectModalOpen(false);
    }
  }, [modalContext.projectModalOpen, modalContext]);

  // Form state
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    color: '#3B82F6',
    description: '',
    client_id: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    budget: undefined,
    hourly_rate: undefined,
  });

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const client = clients.find(c => c.id === project.client_id);
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesClient = clientFilter === 'all' || project.client_id === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProject) {
        await updateProject({ ...formData, id: editingProject.id });
        setEditingProject(null);
      } else {
        await addProject(formData);
      }
      
      // Reset form
      setFormData({
        name: '',
        color: '#3B82F6',
        description: '',
        client_id: '',
        status: 'planning',
        start_date: '',
        end_date: '',
        budget: undefined,
        hourly_rate: undefined,
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving project:', err);
    }
  };

  // Handle edit
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      color: project.color,
      description: project.description || '',
      client_id: project.client_id || '',
      status: project.status || 'planning',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: project.budget || undefined,
      hourly_rate: project.hourly_rate || undefined,
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(projectId);
      } catch (err) {
        console.error('Error deleting project:', err);
      }
    }
  };

  // Handle archive/activate - using status changes instead
  const handleArchive = async (projectId: string) => {
    try {
      await updateProject({ id: projectId, status: 'cancelled' });
    } catch (err) {
      console.error('Error archiving project:', err);
    }
  };

  const handleActivate = async (projectId: string) => {
    try {
      await updateProject({ id: projectId, status: 'active' });
    } catch (err) {
      console.error('Error activating project:', err);
    }
  };

  // Get status info
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'on-hold':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' };
      case 'planning':
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20' };
      default:
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' };
    }
  };

  const getProjectProgress = (project: Project) => {
    if (!project.start_date) return null;
    
    const startDate = new Date(project.start_date);
    const endDate = project.end_date ? new Date(project.end_date) : new Date();
    const today = new Date();
    
    const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const passedDays = Math.max(0, (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.min(100, Math.max(0, (passedDays / totalDays) * 100));
  };

  if (projectsLoading || clientsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and track progress
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {projectsError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{projectsError}</p>
          </CardContent>
        </Card>
      )}

      {clients.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 dark:text-yellow-200">
                You need to add clients first before creating projects. 
                <a href="/clients" className="underline font-medium ml-1">Go to Clients</a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled')}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter projects by status"
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter projects by client"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.company ? `(${client.company})` : ''}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Project Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Client *</label>
                  <select
                    value={formData.client_id || ''}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="Select client for project"
                  >
                    <option value="">Select a client</option>
                    {clients.filter(c => c.status === 'active').map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    placeholder="Project description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled' })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Project status"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Budget (SEK)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      budget: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hourly Rate (SEK)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      hourly_rate: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Project Summary</label>
                  <p className="text-sm text-muted-foreground">
                    Configure your project settings above. Use the color to help identify projects in time tracking.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {editingProject ? 'Update Project' : 'Add Project'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProject(null);
                    setFormData({
                      name: '',
                      color: '#3B82F6',
                      description: '',
                      client_id: '',
                      status: 'planning',
                      start_date: '',
                      end_date: '',
                      budget: undefined,
                      hourly_rate: undefined,
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by adding your first project.'}
              </p>
              {!searchTerm && statusFilter === 'all' && clientFilter === 'all' && clients.length > 0 && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const statusInfo = getStatusInfo(project.status);
            const StatusIcon = statusInfo.icon;
            const client = clients.find(c => c.id === project.client_id);
            const progress = getProjectProgress(project);
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {client && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          {client.name}
                          {client.company && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {client.company}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded-full flex items-center gap-1 ${statusInfo.bg}`}>
                      <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                      <span className={`text-xs font-medium capitalize ${statusInfo.color}`}>
                        {project.status?.replace('-', ' ') || 'planning'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  
                  {/* Project Timeline */}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {project.start_date && new Date(project.start_date).toLocaleDateString('sv-SE')}
                        {project.start_date && project.end_date && ' - '}
                        {project.end_date && new Date(project.end_date).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  {progress !== null && project.status === 'active' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Budget and Rate */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {project.budget && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span>{formatSEK(project.budget)}</span>
                      </div>
                    )}
                    {project.hourly_rate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatSEK(project.hourly_rate)}/h</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Project Color and Type */}
                  <div className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: project.color || '#3B82F6' }}
                    />
                    <span>Project Color</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(project)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    
                    {project.status !== 'cancelled' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchive(project.id)}
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivate(project.id)}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Summary Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {projects.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {projects.filter(p => p.status === 'on-hold').length}
              </div>
              <div className="text-sm text-muted-foreground">On Hold</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {projects.filter(p => p.status === 'cancelled').length}
              </div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {projects.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
