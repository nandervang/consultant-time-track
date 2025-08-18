import { Clock, User, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';

export default function RecentActivitiesCard({ widget, isDarkMode }: WidgetProps) {
  const { entries } = useTimeEntries();
  const { projects } = useProjects();
  const { clients } = useClients();
  
  // Get recent time entries (last 10)
  const recentEntries = entries
    .slice(0, 10)
    .map(entry => {
      const project = projects.find(p => p.id === entry.project_id);
      const client = clients.find(c => c.id === project?.client_id);
      
      const timeSince = getTimeSince(entry.created_at);
      
      return {
        id: entry.id,
        type: 'time',
        message: `Logged ${entry.hours}h on ${project?.name || 'Unknown Project'}${client ? ` for ${client.name}` : ''}`,
        time: timeSince,
        icon: Clock,
        color: 'text-blue-600',
        date: entry.created_at
      };
    });

  // Get recent projects (last 5 created/updated)
  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 3)
    .map(project => {
      const client = clients.find(c => c.id === project.client_id);
      const timeSince = getTimeSince(project.created_at || '');
      
      return {
        id: `project-${project.id}`,
        type: 'project',
        message: `Created project "${project.name}"${client ? ` for ${client.name}` : ''}`,
        time: timeSince,
        icon: FolderOpen,
        color: 'text-green-600',
        date: project.created_at || ''
      };
    });

  // Get recent clients (last 3 created)
  const recentClients = clients
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 2)
    .map(client => {
      const timeSince = getTimeSince(client.created_at || '');
      
      return {
        id: `client-${client.id}`,
        type: 'client',
        message: `Added new client "${client.name}"${client.company ? ` (${client.company})` : ''}`,
        time: timeSince,
        icon: User,
        color: 'text-purple-600',
        date: client.created_at || ''
      };
    });

  // Combine and sort all activities by date
  const allActivities = [...recentEntries, ...recentProjects, ...recentClients]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6); // Show top 6 most recent activities

  function getTimeSince(dateString: string): string {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('sv-SE');
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allActivities.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">No recent activities</p>
            </div>
          ) : (
            allActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full bg-muted flex-shrink-0`}>
                    <Icon className={`h-3 w-3 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-relaxed">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
