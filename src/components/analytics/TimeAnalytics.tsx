import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar, Activity } from 'lucide-react';
import { useTimeEntries, TimeEntry } from '@/hooks/useTimeEntries';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { formatSEK } from '@/lib/currency';
import { isWithinInterval, parseISO, format } from 'date-fns';

interface TimeAnalyticsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface TimeMetrics {
  totalHours: number;
  billableHours: number;
  billableRate: number;
  averageHoursPerDay: number;
  totalSessions: number;
  averageSessionLength: number;
  estimatedRevenue: number;
  productivity: number;
}

interface ProjectTimeData {
  projectId: string;
  projectName: string;
  clientName: string;
  hours: number;
  percentage: number;
  estimatedValue: number;
}

interface DailyTimeData {
  date: string;
  hours: number;
  sessions: number;
}

export function TimeAnalytics({ dateRange }: TimeAnalyticsProps) {
  const { entries: timeEntries, loading: timeEntriesLoading } = useTimeEntries();
  const { projects } = useProjects();
  const { clients } = useClients();
  const [metrics, setMetrics] = useState<TimeMetrics>({
    totalHours: 0,
    billableHours: 0,
    billableRate: 0,
    averageHoursPerDay: 0,
    totalSessions: 0,
    averageSessionLength: 0,
    estimatedRevenue: 0,
    productivity: 0,
  });
  const [projectTimeData, setProjectTimeData] = useState<ProjectTimeData[]>([]);
  const [dailyTimeData, setDailyTimeData] = useState<DailyTimeData[]>([]);

  useEffect(() => {
    if (!timeEntries || timeEntriesLoading) return;

    const filteredEntries = timeEntries.filter((entry: TimeEntry) => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, {
        start: dateRange.from,
        end: dateRange.to,
      });
    });

    // Calculate time metrics
    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
    
    // Calculate billable hours (assuming all tracked time is billable for now)
    const billableHours = totalHours;
    const billableRate = billableHours > 0 ? 100 : 0;

    // Calculate daily averages
    const daysDiff = Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
    const averageHoursPerDay = totalHours / daysDiff;

    // Calculate session metrics
    const totalSessions = filteredEntries.length;
    const averageSessionLength = totalSessions > 0 ? totalHours / totalSessions : 0;

    // Estimate revenue (using average hourly rate - you might want to get this from project settings)
    const averageHourlyRate = 1000; // Default rate in SEK - should come from user settings
    const estimatedRevenue = billableHours * averageHourlyRate;

    // Calculate productivity (hours worked vs expected work hours)
    const expectedHoursPerDay = 8; // Standard work day
    const expectedTotalHours = daysDiff * expectedHoursPerDay;
    const productivity = expectedTotalHours > 0 ? (totalHours / expectedTotalHours) * 100 : 0;

    setMetrics({
      totalHours,
      billableHours,
      billableRate,
      averageHoursPerDay,
      totalSessions,
      averageSessionLength,
      estimatedRevenue,
      productivity: Math.min(productivity, 100), // Cap at 100%
    });

    // Calculate project time distribution
    const projectTime = new Map<string, { hours: number; name: string; clientName: string; rate: number }>();
    
    filteredEntries.forEach((entry: TimeEntry) => {
      const project = projects.find(p => p.id === entry.project_id);
      const client = clients.find(c => c.id === project?.client_id);
      const projectId = project?.id || 'unknown';
      const projectName = project?.name || 'Unknown Project';
      const clientName = client?.name || 'Unknown Client';
      const hourlyRate = project?.hourly_rate || averageHourlyRate;

      const existing = projectTime.get(projectId) || { 
        hours: 0, 
        name: projectName, 
        clientName,
        rate: hourlyRate 
      };
      projectTime.set(projectId, {
        ...existing,
        hours: existing.hours + entry.hours,
      });
    });

    const projectTimeArray = Array.from(projectTime.entries()).map(([projectId, data]) => ({
      projectId,
      projectName: data.name,
      clientName: data.clientName,
      hours: data.hours,
      percentage: totalHours > 0 ? (data.hours / totalHours) * 100 : 0,
      estimatedValue: data.hours * data.rate,
    }));

    projectTimeArray.sort((a, b) => b.hours - a.hours);
    setProjectTimeData(projectTimeArray);

    // Calculate daily time data for trends
    const dailyData = new Map<string, { hours: number; sessions: number }>();
    
    filteredEntries.forEach((entry: TimeEntry) => {
      const dateKey = entry.date;
      const existing = dailyData.get(dateKey) || { hours: 0, sessions: 0 };
      dailyData.set(dateKey, {
        hours: existing.hours + entry.hours,
        sessions: existing.sessions + 1,
      });
    });

    const dailyArray = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      hours: data.hours,
      sessions: data.sessions,
    }));

    dailyArray.sort((a, b) => a.date.localeCompare(b.date));
    setDailyTimeData(dailyArray);
  }, [timeEntries, timeEntriesLoading, dateRange, projects, clients]);

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (timeEntriesLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Hours',
      value: formatDuration(metrics.totalHours),
      description: `${metrics.totalSessions} work sessions`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Daily Average',
      value: formatDuration(metrics.averageHoursPerDay),
      description: 'Per work day',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Estimated Revenue',
      value: formatSEK(metrics.estimatedRevenue),
      description: 'Based on tracked time',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Productivity',
      value: `${metrics.productivity.toFixed(1)}%`,
      description: 'Of expected work hours',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Time Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Productivity and Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Productivity Overview
            </CardTitle>
            <CardDescription>
              Your work patterns and efficiency metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{formatDuration(metrics.averageSessionLength)}</div>
                <p className="text-xs text-gray-500">Avg Session</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{metrics.productivity.toFixed(1)}%</div>
                <p className="text-xs text-gray-500">Productivity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trends</CardTitle>
            <CardDescription>
              Daily time tracking patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyTimeData.length > 0 ? (
              <div className="space-y-2">
                {dailyTimeData.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {format(parseISO(day.date), 'MMM d')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{formatDuration(day.hours)}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {day.sessions} sessions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No time data for selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Time Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Time by Project</CardTitle>
          <CardDescription>
            How you've allocated your time across different projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectTimeData.length > 0 ? (
            <div className="space-y-4">
              {projectTimeData.slice(0, 10).map((project) => (
                <div key={project.projectId} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.projectName}</p>
                    <p className="text-sm text-gray-500">{project.clientName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">{formatDuration(project.hours)}</div>
                      <div className="text-xs text-gray-500">
                        {formatSEK(project.estimatedValue)}
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {project.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {projectTimeData.length > 10 && (
                <p className="text-sm text-gray-500 text-center pt-2 border-t">
                  And {projectTimeData.length - 10} more projects...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No time entries found for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
