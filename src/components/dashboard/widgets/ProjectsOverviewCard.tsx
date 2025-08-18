import { FolderOpen, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard';
import { formatSEK } from '../../../lib/currency';

export default function ProjectsOverviewCard({ widget, isDarkMode }: WidgetProps) {
  // Mock data - replace with real data later
  const projects = [
    {
      id: 1,
      name: 'Website Redesign',
      client: 'TechCorp',
      status: 'In Progress',
      progress: 75,
      hoursLogged: 45,
      budget: 8000,
      deadline: '2025-09-15'
    },
    {
      id: 2,
      name: 'Mobile App',
      client: 'StartupXYZ',
      status: 'Planning',
      progress: 25,
      hoursLogged: 12,
      budget: 15000,
      deadline: '2025-10-30'
    },
    {
      id: 3,
      name: 'Brand Identity',
      client: 'LocalBiz',
      status: 'Review',
      progress: 90,
      hoursLogged: 28,
      budget: 5000,
      deadline: '2025-08-25'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Planning': return 'text-yellow-600 bg-yellow-100';
      case 'Review': return 'text-purple-600 bg-purple-100';
      case 'Completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7;
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
          {projects.map((project) => (
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
                    {project.status}
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
                  <span>{formatSEK(project.budget)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
