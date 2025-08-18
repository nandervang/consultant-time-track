import { FolderOpen, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard';
import { formatSEK } from '../../../lib/currency';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useTimeEntries } from '@/hooks/useTimeEntries';

export default function ProjectsOverviewCard({ widget, isDarkMode }: WidgetProps) {
  const { projects } = useProjects();
  const { clients } = useClients();
  const { entries } = useTimeEntries();
  
  // Get active projects with calculated data
  const activeProjects = projects
    .filter(project => project.status === 'active')
    .slice(0, 3) // Show only top 3 for widget
    .map(project => {
      const client = clients.find(c => c.id === project.client_id);
      
      // Calculate hours logged for this project
      const projectEntries = entries.filter(entry => entry.project_id === project.id);
      const hoursLogged = projectEntries.reduce((sum, entry) => sum + entry.hours, 0);
      
      // Calculate progress (if budget exists, use hours vs estimated hours)
      let progress = 0;
      if (project.budget && project.hourly_rate) {
        const estimatedHours = project.budget / project.hourly_rate;
        progress = Math.min((hoursLogged / estimatedHours) * 100, 100);
      } else {
        // Default progress calculation based on time span if dates exist
        if (project.start_date && project.end_date) {
          const start = new Date(project.start_date);
          const end = new Date(project.end_date);
          const now = new Date();
          const totalDuration = end.getTime() - start.getTime();
          const elapsed = now.getTime() - start.getTime();
          progress = Math.max(0, Math.min((elapsed / totalDuration) * 100, 100));
        } else {
          // Fallback: use hours as rough progress indicator
          progress = Math.min(hoursLogged * 2, 100); // Assume 50 hours = 100%
        }
      }
      
      return {
        id: project.id,
        name: project.name,
        client: client?.name || 'No Client',
        status: project.status || 'active',
        progress: Math.round(progress),
        hoursLogged: Math.round(hoursLogged * 10) / 10, // Round to 1 decimal
        budget: project.budget || 0,
        deadline: project.end_date,
        hourlyRate: project.hourly_rate
      };
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'planning': return 'text-yellow-600 bg-yellow-100';
      case 'on-hold': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'planning': return 'Planning';
      case 'on-hold': return 'On Hold';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const isDeadlineNear = (deadline: string | null | undefined) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  };

  const formatDeadline = (deadline: string | null | undefined) => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    return `Due ${date.toLocaleDateString('sv-SE')}`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Active Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeProjects.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">No active projects</p>
            </div>
          ) : (
            activeProjects.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{project.name}</h4>
                    <p className="text-xs text-muted-foreground">{project.client}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isDeadlineNear(project.deadline) && (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{project.progress}% complete</span>
                    <span>{project.hoursLogged}h logged</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{project.budget > 0 ? formatSEK(project.budget) : 'No budget'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDeadline(project.deadline)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
