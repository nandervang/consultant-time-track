# Project Management Specification

**Spec ID:** 011-A  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The Project Management system provides comprehensive project lifecycle management for consultant businesses, including project creation, task organization, client associations, delivery tracking, and billing integration. It serves as the central hub for organizing work, tracking progress, and ensuring successful project delivery.

## Feature Requirements

### Functional Requirements

#### Core Project Management Capabilities

##### Project Lifecycle Management

- Complete project creation and configuration workflow
- Project status tracking (Planning, Active, On Hold, Completed, Cancelled)
- Milestone definition and progress tracking with visual indicators
- Deliverable management with approval workflows and client sign-offs
- Timeline management with Gantt charts and dependency tracking
- Project templates for common consulting engagements

##### Task and Work Organization

- Hierarchical task structure with subtasks and dependencies
- Task assignment and responsibility tracking
- Priority levels and urgency indicators with automated escalation
- Progress tracking with completion percentages and time estimates
- File attachments and documentation management
- Task templates and recurring task automation

##### Client and Stakeholder Integration

- Seamless client association and contact management
- Stakeholder communication and notification systems
- Client portal access for project visibility and collaboration
- Approval workflows for deliverables and milestone sign-offs
- Meeting scheduling and agenda management
- Change request tracking and impact analysis

### Technical Specifications

#### Data Models

```typescript
interface Project {
  id: string;
  user_id: string;
  
  // Basic information
  name: string;
  description: string;
  project_code?: string; // Unique identifier for billing
  type: 'consulting' | 'development' | 'design' | 'analysis' | 'training' | 'other';
  
  // Client and stakeholder information
  client_id: string;
  primary_contact_id?: string;
  stakeholders: ProjectStakeholder[];
  
  // Project scope and timeline
  start_date: string;
  end_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  
  // Financial information
  budget_type: 'fixed_price' | 'time_and_materials' | 'retainer';
  budget_amount?: number;
  hourly_rate?: number;
  currency: string;
  
  // Status and progress
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  progress_percentage: number;
  health_status: 'green' | 'yellow' | 'red';
  
  // Configuration
  billing_schedule: 'weekly' | 'biweekly' | 'monthly' | 'milestone_based';
  requires_client_approval: boolean;
  is_billable: boolean;
  
  // Metadata
  tags: string[];
  notes?: string;
  
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface ProjectStakeholder {
  contact_id: string;
  role: 'project_manager' | 'technical_lead' | 'client_lead' | 'approver' | 'observer';
  permissions: StakeholderPermissions;
  notification_preferences: NotificationPreferences;
}

interface StakeholderPermissions {
  can_view_budget: boolean;
  can_approve_deliverables: boolean;
  can_view_time_logs: boolean;
  can_create_tasks: boolean;
  can_modify_timeline: boolean;
}

interface Task {
  id: string;
  project_id: string;
  
  // Task details
  title: string;
  description: string;
  task_type: 'development' | 'design' | 'research' | 'meeting' | 'documentation' | 'testing' | 'other';
  
  // Hierarchy and organization
  parent_task_id?: string;
  sort_order: number;
  
  // Assignment and responsibility
  assigned_to?: string; // User ID or external contact
  created_by: string;
  
  // Timing and progress
  estimated_hours?: number;
  actual_hours?: number;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  
  // Status and priority
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress_percentage: number;
  
  // Dependencies and blocking
  depends_on: string[]; // Task IDs
  blocks: string[]; // Task IDs that this task blocks
  
  // Client interaction
  requires_client_approval: boolean;
  client_approved: boolean;
  client_feedback?: string;
  
  // Attachments and references
  attachments: TaskAttachment[];
  time_entries: string[]; // Time entry IDs
  
  created_at: string;
  updated_at: string;
}

interface TaskAttachment {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

interface ProjectMilestone {
  id: string;
  project_id: string;
  
  // Milestone details
  name: string;
  description: string;
  due_date: string;
  completed_at?: string;
  
  // Progress and dependencies
  progress_percentage: number;
  dependent_tasks: string[]; // Task IDs
  
  // Client interaction
  requires_client_approval: boolean;
  client_approved: boolean;
  approval_date?: string;
  
  // Deliverables
  deliverables: MilestoneDeliverable[];
  
  // Billing
  is_billing_milestone: boolean;
  invoice_id?: string;
  
  created_at: string;
  updated_at: string;
}

interface MilestoneDeliverable {
  name: string;
  description: string;
  file_url?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_feedback?: string;
}

interface ProjectTemplate {
  id: string;
  user_id: string;
  
  // Template information
  name: string;
  description: string;
  category: string;
  
  // Template configuration
  default_tasks: TemplateTask[];
  default_milestones: TemplateMilestone[];
  estimated_duration_days: number;
  
  // Settings
  is_public: boolean;
  usage_count: number;
  
  created_at: string;
  updated_at: string;
}

interface TemplateTask {
  title: string;
  description: string;
  task_type: Task['task_type'];
  estimated_hours: number;
  depends_on_tasks: string[]; // References to other template tasks
  day_offset: number; // Days from project start
}
```

#### Project Management Hook

```typescript
export const useProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(false);

  const createProject = useCallback(async (
    projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'progress_percentage' | 'health_status'>
  ) => {
    setLoading(true);
    try {
      // Generate project code if not provided
      const projectCode = projectData.project_code || 
        await generateProjectCode(projectData.name, projectData.client_id);

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          project_code: projectCode,
          progress_percentage: 0,
          health_status: 'green',
          currency: projectData.currency || 'SEK'
        }])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [...prev, data]);

      // Create default tasks if using template
      if (projectData.template_id) {
        await createTasksFromTemplate(data.id, projectData.template_id);
      }

      // Create cash flow projection
      await createProjectCashFlowProjection(data);

      return data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProjectStatus = useCallback(async (
    projectId: string, 
    status: Project['status'],
    completionData?: { actual_hours: number; final_notes: string }
  ) => {
    const updates: Partial<Project> = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed' && completionData) {
      updates.completed_at = new Date().toISOString();
      updates.actual_hours = completionData.actual_hours;
      updates.progress_percentage = 100;
      updates.notes = completionData.final_notes;
    }

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) throw error;

    setProjects(prev => prev.map(project => 
      project.id === projectId ? { ...project, ...updates } : project
    ));

    // Update project health and progress
    if (status === 'completed') {
      await finalizeProjectCompletion(projectId);
    }
  }, []);

  const createTask = useCallback(async (
    taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'progress_percentage' | 'actual_hours'>
  ) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...taskData,
        progress_percentage: 0,
        actual_hours: 0,
        created_by: getCurrentUserId()
      }])
      .select()
      .single();

    if (error) throw error;

    setTasks(prev => [...prev, data]);

    // Update project progress
    await recalculateProjectProgress(taskData.project_id);

    return data;
  }, []);

  const updateTaskStatus = useCallback(async (
    taskId: string,
    status: Task['status'],
    progressData?: { progress_percentage: number; hours_logged?: number }
  ) => {
    const updates: Partial<Task> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (progressData) {
      updates.progress_percentage = progressData.progress_percentage;
      if (progressData.hours_logged) {
        updates.actual_hours = (updates.actual_hours || 0) + progressData.hours_logged;
      }
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.progress_percentage = 100;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) throw error;

    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));

    // Update project progress
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await recalculateProjectProgress(task.project_id);
    }
  }, [tasks]);

  const getProjectAnalytics = useCallback(async (projectId: string) => {
    const [timeData, budgetData, taskData] = await Promise.all([
      getProjectTimeAnalytics(projectId),
      getProjectBudgetAnalytics(projectId),
      getProjectTaskAnalytics(projectId)
    ]);

    return {
      timeTracking: timeData,
      budgetUtilization: budgetData,
      taskCompletion: taskData,
      overallHealth: calculateProjectHealth(timeData, budgetData, taskData)
    };
  }, []);

  return {
    projects,
    selectedProject,
    tasks,
    milestones,
    loading,
    setSelectedProject,
    createProject,
    updateProjectStatus,
    createTask,
    updateTaskStatus,
    getProjectAnalytics,
    refreshData: () => Promise.all([fetchProjects(), fetchTasks(), fetchMilestones()])
  };
};
```

### User Interface Specifications

#### Project Dashboard

```typescript
const ProjectDashboard = () => {
  const { projects, loading } = useProjectManagement();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [filterStatus, setFilterStatus] = useState<Project['status'] | 'all'>('all');

  const filteredProjects = useMemo(() => {
    return projects.filter(project => 
      filterStatus === 'all' || project.status === filterStatus
    );
  }, [projects, filterStatus]);

  const projectStats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget_amount || 0), 0),
    totalHours: projects.reduce((sum, p) => sum + (p.actual_hours || 0), 0)
  }), [projects]);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">
            Track project progress and manage deliverables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Project statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {projectStats.active} active projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectStats.total > 0 ? 
                Math.round((projectStats.completed / projectStats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {projectStats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(projectStats.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalHours}</div>
            <p className="text-xs text-muted-foreground">
              Total time tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project content based on view mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <Card>
          <ProjectTable projects={filteredProjects} />
        </Card>
      )}

      {viewMode === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectGanttChart projects={filteredProjects} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

#### Project Detail View

```typescript
const ProjectDetail = ({ projectId }: { projectId: string }) => {
  const { selectedProject, tasks, milestones, getProjectAnalytics } = useProjectManagement();
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadProjectData = async () => {
      if (projectId) {
        const analyticsData = await getProjectAnalytics(projectId);
        setAnalytics(analyticsData);
      }
    };

    loadProjectData();
  }, [projectId, getProjectAnalytics]);

  if (!selectedProject) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Project header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
            <p className="text-muted-foreground">{selectedProject.client?.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <ProjectStatusBadge status={selectedProject.status} />
              <ProjectHealthIndicator health={selectedProject.health_status} />
              <Badge variant="outline">{selectedProject.type}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Log Time
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/tasks/new?project=${projectId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/invoices/new?project=${projectId}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project progress overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedProject.progress_percentage}%
            </div>
            <Progress 
              value={selectedProject.progress_percentage} 
              className="mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.budgetUtilization.used || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(selectedProject.budget_amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedProject.actual_hours || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              of {selectedProject.estimated_hours || 0}h estimated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.taskCompletion.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {analytics?.taskCompletion.total || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ProjectOverviewTab 
            project={selectedProject} 
            analytics={analytics} 
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <ProjectTasksTab 
            projectId={projectId} 
            tasks={tasks.filter(t => t.project_id === projectId)} 
          />
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <ProjectMilestonesTab 
            projectId={projectId} 
            milestones={milestones.filter(m => m.project_id === projectId)} 
          />
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <ProjectTimeTrackingTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <ProjectFilesTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### Database Schema

#### Project Management Tables

```sql
-- Main projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic information
  name TEXT NOT NULL,
  description TEXT,
  project_code TEXT,
  type TEXT NOT NULL CHECK (type IN ('consulting', 'development', 'design', 'analysis', 'training', 'other')),
  
  -- Client and stakeholder information
  client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
  primary_contact_id UUID REFERENCES client_contacts(id) ON DELETE SET NULL,
  stakeholders JSONB DEFAULT '[]',
  
  -- Project scope and timeline
  start_date DATE NOT NULL,
  end_date DATE,
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Financial information
  budget_type TEXT NOT NULL CHECK (budget_type IN ('fixed_price', 'time_and_materials', 'retainer')),
  budget_amount DECIMAL(12,2),
  hourly_rate DECIMAL(10,2),
  currency TEXT DEFAULT 'SEK',
  
  -- Status and progress
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  health_status TEXT DEFAULT 'green' CHECK (health_status IN ('green', 'yellow', 'red')),
  
  -- Configuration
  billing_schedule TEXT DEFAULT 'monthly' CHECK (billing_schedule IN ('weekly', 'biweekly', 'monthly', 'milestone_based')),
  requires_client_approval BOOLEAN DEFAULT FALSE,
  is_billable BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('development', 'design', 'research', 'meeting', 'documentation', 'testing', 'other')),
  
  -- Hierarchy and organization
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  
  -- Assignment and responsibility
  assigned_to UUID, -- Can be user_id or external contact
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timing and progress
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2) DEFAULT 0,
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Status and priority
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  -- Dependencies
  depends_on UUID[] DEFAULT '{}',
  blocks UUID[] DEFAULT '{}',
  
  -- Client interaction
  requires_client_approval BOOLEAN DEFAULT FALSE,
  client_approved BOOLEAN DEFAULT FALSE,
  client_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task attachments table
CREATE TABLE task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project milestones table
CREATE TABLE project_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Milestone details
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Progress and dependencies
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  dependent_tasks UUID[] DEFAULT '{}',
  
  -- Client interaction
  requires_client_approval BOOLEAN DEFAULT FALSE,
  client_approved BOOLEAN DEFAULT FALSE,
  approval_date DATE,
  
  -- Deliverables
  deliverables JSONB DEFAULT '[]',
  
  -- Billing
  is_billing_milestone BOOLEAN DEFAULT FALSE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project templates table
CREATE TABLE project_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template information
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  
  -- Template configuration
  default_tasks JSONB DEFAULT '[]',
  default_milestones JSONB DEFAULT '[]',
  estimated_duration_days INTEGER,
  
  -- Settings
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX idx_tasks_dates ON tasks(start_date, due_date);
CREATE INDEX idx_milestones_project_date ON project_milestones(project_id, due_date);
CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);

-- GIN indexes for array columns
CREATE INDEX idx_tasks_depends_on ON tasks USING GIN(depends_on);
CREATE INDEX idx_tasks_blocks ON tasks USING GIN(blocks);
CREATE INDEX idx_milestones_dependent_tasks ON project_milestones USING GIN(dependent_tasks);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);

-- Text search indexes
CREATE INDEX idx_projects_search ON projects USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(project_code, ''))
);
CREATE INDEX idx_tasks_search ON tasks USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Unique constraints
CREATE UNIQUE INDEX idx_projects_user_code ON projects(user_id, project_code) 
WHERE project_code IS NOT NULL;
```

#### Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

-- Project policies
CREATE POLICY "Users can access own projects" 
ON projects FOR ALL 
USING (auth.uid() = user_id);

-- Task policies (access through parent project)
CREATE POLICY "Users can access tasks in own projects" 
ON tasks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = tasks.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Task attachments policies
CREATE POLICY "Users can access attachments in own project tasks" 
ON task_attachments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM tasks 
    JOIN projects ON projects.id = tasks.project_id
    WHERE tasks.id = task_attachments.task_id 
    AND projects.user_id = auth.uid()
  )
);

-- Milestone policies
CREATE POLICY "Users can access milestones in own projects" 
ON project_milestones FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_milestones.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Template policies
CREATE POLICY "Users can access own templates and public templates" 
ON project_templates FOR SELECT 
USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can modify own templates" 
ON project_templates FOR INSERT, UPDATE, DELETE 
USING (auth.uid() = user_id);
```

### Business Logic

#### Project Progress Calculation

```typescript
const recalculateProjectProgress = async (projectId: string): Promise<void> => {
  // Get all tasks for the project
  const { data: tasks } = await supabase
    .from('tasks')
    .select('progress_percentage, estimated_hours')
    .eq('project_id', projectId);

  if (!tasks?.length) return;

  // Calculate weighted progress based on estimated hours
  const totalEstimatedHours = tasks.reduce((sum, task) => 
    sum + (task.estimated_hours || 1), 0
  );

  const weightedProgress = tasks.reduce((sum, task) => {
    const weight = (task.estimated_hours || 1) / totalEstimatedHours;
    return sum + (task.progress_percentage * weight);
  }, 0);

  // Update project progress
  await supabase
    .from('projects')
    .update({ 
      progress_percentage: Math.round(weightedProgress),
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId);
};

const calculateProjectHealth = (
  timeData: ProjectTimeAnalytics,
  budgetData: ProjectBudgetAnalytics,
  taskData: ProjectTaskAnalytics
): Project['health_status'] => {
  let healthScore = 100;

  // Time performance (30% weight)
  if (timeData.hoursOverBudget > 0) {
    const overBudgetPercentage = timeData.hoursOverBudget / timeData.estimatedHours;
    healthScore -= Math.min(overBudgetPercentage * 30, 30);
  }

  // Budget performance (40% weight)
  if (budgetData.overBudget > 0) {
    const overBudgetPercentage = budgetData.overBudget / budgetData.totalBudget;
    healthScore -= Math.min(overBudgetPercentage * 40, 40);
  }

  // Task completion rate (30% weight)
  const completionRate = taskData.completed / taskData.total;
  if (completionRate < 0.8) {
    healthScore -= (0.8 - completionRate) * 30;
  }

  if (healthScore >= 80) return 'green';
  if (healthScore >= 60) return 'yellow';
  return 'red';
};
```

#### Project Template System

```typescript
const createTasksFromTemplate = async (
  projectId: string,
  templateId: string
): Promise<void> => {
  const { data: template } = await supabase
    .from('project_templates')
    .select('default_tasks, default_milestones')
    .eq('id', templateId)
    .single();

  if (!template) return;

  const { data: project } = await supabase
    .from('projects')
    .select('start_date')
    .eq('id', projectId)
    .single();

  if (!project) return;

  const projectStartDate = new Date(project.start_date);

  // Create tasks from template
  const tasksToCreate = template.default_tasks.map((templateTask: TemplateTask) => ({
    project_id: projectId,
    title: templateTask.title,
    description: templateTask.description,
    task_type: templateTask.task_type,
    estimated_hours: templateTask.estimated_hours,
    start_date: addDays(projectStartDate, templateTask.day_offset).toISOString().split('T')[0],
    status: 'todo',
    priority: 'medium',
    created_by: getCurrentUserId()
  }));

  await supabase
    .from('tasks')
    .insert(tasksToCreate);

  // Create milestones from template
  const milestonesToCreate = template.default_milestones.map((milestone: TemplateMilestone) => ({
    project_id: projectId,
    name: milestone.name,
    description: milestone.description,
    due_date: addDays(projectStartDate, milestone.day_offset).toISOString().split('T')[0]
  }));

  await supabase
    .from('project_milestones')
    .insert(milestonesToCreate);
};
```

### Integration with Other Systems

#### Time Tracking Integration

```typescript
// Update project hours when time is logged
const handleTimeEntryCreation = async (timeEntry: TimeEntry) => {
  if (timeEntry.project_id) {
    // Update project actual hours
    await supabase.rpc('increment_project_hours', {
      project_id: timeEntry.project_id,
      hours_to_add: timeEntry.hours
    });

    // Update task hours if associated
    if (timeEntry.task_id) {
      await supabase.rpc('increment_task_hours', {
        task_id: timeEntry.task_id,
        hours_to_add: timeEntry.hours
      });

      // Recalculate task progress based on hours
      await updateTaskProgressFromHours(timeEntry.task_id);
    }

    // Recalculate project health
    await updateProjectHealth(timeEntry.project_id);
  }
};

// Auto-complete tasks when hours meet estimates
const updateTaskProgressFromHours = async (taskId: string) => {
  const { data: task } = await supabase
    .from('tasks')
    .select('estimated_hours, actual_hours, status')
    .eq('id', taskId)
    .single();

  if (task && task.estimated_hours && task.actual_hours >= task.estimated_hours) {
    if (task.status !== 'completed') {
      await supabase
        .from('tasks')
        .update({
          status: 'review',
          progress_percentage: 100
        })
        .eq('id', taskId);
    }
  }
};
```

#### Invoice Integration

```typescript
// Create invoice from project milestones
const createMilestoneInvoice = async (
  milestoneId: string,
  invoiceData: Partial<Invoice>
) => {
  const { data: milestone } = await supabase
    .from('project_milestones')
    .select('*, project:projects(*)')
    .eq('id', milestoneId)
    .single();

  if (!milestone || !milestone.is_billing_milestone) {
    throw new Error('Milestone is not configured for billing');
  }

  // Calculate invoice amount based on milestone completion
  const milestoneValue = milestone.project.budget_amount * 
    (milestone.progress_percentage / 100);

  const invoice = await createInvoice({
    ...invoiceData,
    client_id: milestone.project.client_id,
    project_id: milestone.project.id,
    subtotal: milestoneValue,
    description: `Milestone: ${milestone.name}`,
    milestone_id: milestoneId
  });

  // Link invoice to milestone
  await supabase
    .from('project_milestones')
    .update({ invoice_id: invoice.id })
    .eq('id', milestoneId);

  return invoice;
};
```

#### Client Integration

```typescript
// Update client relationship based on project success
const handleProjectCompletion = async (projectId: string) => {
  const { data: project } = await supabase
    .from('projects')
    .select('*, client:clients(*)')
    .eq('id', projectId)
    .single();

  if (!project) return;

  // Calculate project success metrics
  const budgetPerformance = project.actual_hours <= project.estimated_hours ? 1 : 0;
  const timePerformance = project.status === 'completed' ? 1 : 0;
  const overallSuccess = (budgetPerformance + timePerformance) / 2;

  // Update client relationship strength
  const relationshipDelta = overallSuccess > 0.7 ? 1 : (overallSuccess < 0.3 ? -1 : 0);
  
  if (relationshipDelta !== 0) {
    await supabase.rpc('update_client_relationship_strength', {
      client_id: project.client_id,
      delta: relationshipDelta
    });
  }

  // Record project completion interaction
  await supabase
    .from('client_interactions')
    .insert({
      client_id: project.client_id,
      type: 'contract',
      subject: 'Project Completion',
      description: `Project "${project.name}" completed successfully`,
      interaction_date: new Date().toISOString(),
      outcome: overallSuccess > 0.7 ? 'positive' : 'neutral',
      project_id: projectId
    });
};
```

### Performance Optimizations

#### Project Data Caching

```typescript
const useProjectCache = () => {
  const [cache, setCache] = useState<Map<string, CachedProjectData>>(new Map());

  const getCachedProject = (projectId: string) => {
    const cached = cache.get(projectId);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 minutes
      return cached.data;
    }
    return null;
  };

  const setCachedProject = (projectId: string, data: Project) => {
    setCache(prev => new Map(prev.set(projectId, {
      data,
      timestamp: Date.now()
    })));
  };

  return { getCachedProject, setCachedProject };
};
```

### Testing Requirements

#### Unit Tests

```typescript
describe('Project Management', () => {
  it('creates projects with correct defaults');
  it('calculates project progress accurately');
  it('determines project health status');
  it('handles task dependencies correctly');
  it('manages project templates');
});

describe('Task Management', () => {
  it('creates tasks with proper hierarchy');
  it('updates progress calculations');
  it('handles task completion workflows');
  it('manages task dependencies');
});
```

#### Integration Tests

```typescript
describe('Project System Integration', () => {
  it('integrates with time tracking');
  it('connects with invoice generation');
  it('updates client relationship data');
  it('maintains data consistency');
});
```

---

This specification ensures the Project Management system provides comprehensive project lifecycle management while maintaining integration with time tracking, invoicing, client management, and other business systems.