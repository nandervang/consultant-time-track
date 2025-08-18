import { Activity, Users, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useTimeEntries } from '@/hooks/useTimeEntries';

export default function QuickStatsCard({ widget, isDarkMode }: WidgetProps) {
  const { projects } = useProjects();
  const { clients } = useClients();
  const { entries } = useTimeEntries();
  
  // Calculate active projects
  const activeProjects = projects.filter(p => p.status === 'active').length;
  
  // Calculate active clients
  const activeClients = clients.filter(c => c.status === 'active').length;
  
  // Calculate average hours per day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date + 'T00:00:00');
    return entryDate >= thirtyDaysAgo;
  });
  
  const totalHoursLast30Days = recentEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const uniqueDaysWorked = new Set(recentEntries.map(entry => entry.date)).size;
  const avgHoursPerDay = uniqueDaysWorked > 0 ? totalHoursLast30Days / uniqueDaysWorked : 0;
  
  // Calculate total entries (could represent invoices later)
  const totalEntries = entries.length;

  const stats = [
    {
      label: 'Active Projects',
      value: activeProjects.toString(),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      darkBgColor: 'bg-blue-900/30'
    },
    {
      label: 'Active Clients',
      value: activeClients.toString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      darkBgColor: 'bg-green-900/30'
    },
    {
      label: 'Time Entries',
      value: totalEntries.toString(),
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      darkBgColor: 'bg-purple-900/30'
    },
    {
      label: 'Avg Hours/Day',
      value: avgHoursPerDay.toFixed(1),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      darkBgColor: 'bg-orange-900/30'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${
                    isDarkMode ? stat.darkBgColor : stat.bgColor
                  }`}>
                    <Icon className={`h-3 w-3 ${stat.color}`} />
                  </div>
                  <div className="text-lg font-bold">{stat.value}</div>
                </div>
                <p className="text-xs text-muted-foreground leading-tight">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
