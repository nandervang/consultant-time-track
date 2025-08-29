import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Star, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useInvoices } from '@/hooks/useInvoices';
import { useTimeEntries, TimeEntry } from '@/hooks/useTimeEntries';
import { formatSEK } from '@/lib/currency';
import { isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import { InvoiceItem } from '@/types/invoice';

interface ClientAnalyticsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  newClients: number;
  retentionRate: number;
  averageProjectValue: number;
}

interface ClientPerformanceData {
  clientId: string;
  clientName: string;
  revenue: number;
  hours: number;
  projects: number;
  invoices: number;
  avgProjectValue: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'at-risk';
  healthScore: number;
}

export function ClientAnalytics({ dateRange }: ClientAnalyticsProps) {
  const { clients } = useClients();
  const { projects } = useProjects();
  const { invoiceItems, loading: invoicesLoading } = useInvoices();
  const { entries: timeEntries, loading: timeEntriesLoading } = useTimeEntries();
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    activeClients: 0,
    newClients: 0,
    retentionRate: 0,
    averageProjectValue: 0,
  });
  const [clientPerformanceData, setClientPerformanceData] = useState<ClientPerformanceData[]>([]);

  useEffect(() => {
    if (!clients || !projects || !invoiceItems || !timeEntries || invoicesLoading || timeEntriesLoading) return;

    // Filter data for the selected period
    const filteredInvoices = invoiceItems.filter((invoice: InvoiceItem) => {
      const invoiceDate = parseISO(invoice.invoice_date);
      return isWithinInterval(invoiceDate, {
        start: dateRange.from,
        end: dateRange.to,
      });
    });

    const filteredTimeEntries = timeEntries.filter((entry: TimeEntry) => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, {
        start: dateRange.from,
        end: dateRange.to,
      });
    });

    // Calculate basic client metrics
    const totalClients = clients.length;
    
    // Active clients = clients with activity (invoices or time entries) in the period
    const activeClientIds = new Set([
      ...filteredInvoices.map((invoice: InvoiceItem) => {
        const project = projects.find(p => p.id === invoice.project_id);
        return project?.client_id;
      }).filter(Boolean),
      ...filteredTimeEntries.map((entry: TimeEntry) => {
        const project = projects.find(p => p.id === entry.project_id);
        return project?.client_id;
      }).filter(Boolean)
    ]);
    
    const activeClients = activeClientIds.size;

    // New clients = clients created during the period (simplified)
    const newClients = 0; // Would need created_at field on clients

    // Calculate retention rate (simplified)
    const retentionRate = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;

    // Calculate average project value
    const totalProjectValue = filteredInvoices.reduce((sum: number, invoice: InvoiceItem) => sum + invoice.total_amount, 0);
    const totalProjectCount = new Set(filteredInvoices.map((invoice: InvoiceItem) => invoice.project_id)).size;
    const averageProjectValue = totalProjectCount > 0 ? totalProjectValue / totalProjectCount : 0;

    setMetrics({
      totalClients,
      activeClients,
      newClients,
      retentionRate,
      averageProjectValue,
    });

    // Calculate detailed client performance data
    const clientData = new Map<string, {
      name: string;
      revenue: number;
      hours: number;
      projects: Set<string>;
      invoices: number;
      lastActivity: Date;
    }>();

    // Initialize all clients
    clients.forEach((client) => {
      clientData.set(client.id, {
        name: client.name,
        revenue: 0,
        hours: 0,
        projects: new Set(),
        invoices: 0,
        lastActivity: new Date(0),
      });
    });

    // Aggregate invoice data
    filteredInvoices.forEach((invoice: InvoiceItem) => {
      const project = projects.find(p => p.id === invoice.project_id);
      if (project?.client_id && invoice.project_id && clientData.has(project.client_id)) {
        const client = clientData.get(project.client_id)!;
        client.revenue += invoice.total_amount;
        client.projects.add(invoice.project_id);
        client.invoices += 1;
        
        const invoiceDate = parseISO(invoice.invoice_date);
        if (invoiceDate > client.lastActivity) {
          client.lastActivity = invoiceDate;
        }
      }
    });

    // Aggregate time entry data
    filteredTimeEntries.forEach((entry: TimeEntry) => {
      const project = projects.find(p => p.id === entry.project_id);
      if (project?.client_id && clientData.has(project.client_id)) {
        const client = clientData.get(project.client_id)!;
        client.hours += entry.hours;
        client.projects.add(entry.project_id);
        
        const entryDate = parseISO(entry.date);
        if (entryDate > client.lastActivity) {
          client.lastActivity = entryDate;
        }
      }
    });

    // Convert to performance data array
    const performanceArray: ClientPerformanceData[] = Array.from(clientData.entries()).map(([clientId, data]) => {
      const projectCount = data.projects.size;
      const avgProjectValue = projectCount > 0 ? data.revenue / projectCount : 0;
      const daysSinceLastActivity = differenceInDays(new Date(), data.lastActivity);
      
      // Determine client status and health score
      let status: 'active' | 'inactive' | 'at-risk' = 'inactive';
      let healthScore = 0;
      
      if (data.revenue > 0 || data.hours > 0) {
        if (daysSinceLastActivity <= 30) {
          status = 'active';
          healthScore = 90 - Math.min(daysSinceLastActivity * 2, 40);
        } else if (daysSinceLastActivity <= 90) {
          status = 'at-risk';
          healthScore = 50 - Math.min((daysSinceLastActivity - 30) * 0.5, 25);
        } else {
          status = 'inactive';
          healthScore = Math.max(25 - (daysSinceLastActivity - 90) * 0.1, 0);
        }
      }

      return {
        clientId,
        clientName: data.name,
        revenue: data.revenue,
        hours: data.hours,
        projects: projectCount,
        invoices: data.invoices,
        avgProjectValue,
        lastActivity: data.lastActivity.toISOString(),
        status,
        healthScore: Math.round(healthScore),
      };
    });

    // Sort by revenue and health score
    performanceArray.sort((a, b) => {
      if (a.revenue !== b.revenue) return b.revenue - a.revenue;
      return b.healthScore - a.healthScore;
    });

    setClientPerformanceData(performanceArray);
  }, [clients, projects, invoiceItems, timeEntries, invoicesLoading, timeEntriesLoading, dateRange]);

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'at-risk': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthBarWidth = (score: number) => {
    if (score >= 90) return 'w-full';
    if (score >= 80) return 'w-5/6';
    if (score >= 70) return 'w-4/6';
    if (score >= 60) return 'w-3/6';
    if (score >= 50) return 'w-2/6';
    if (score >= 25) return 'w-1/6';
    return 'w-1/12';
  };

  if (invoicesLoading || timeEntriesLoading) {
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
      title: 'Total Clients',
      value: metrics.totalClients.toString(),
      description: `${metrics.activeClients} active this period`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Client Retention',
      value: `${metrics.retentionRate.toFixed(1)}%`,
      description: 'Activity retention rate',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'New Clients',
      value: metrics.newClients.toString(),
      description: 'Acquired this period',
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg Project Value',
      value: formatSEK(metrics.averageProjectValue),
      description: 'Per project average',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Client Overview Cards */}
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

      {/* Client Health Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {clientPerformanceData.filter(c => c.status === 'active').length}
            </div>
            <p className="text-sm text-green-600">Recent activity within 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              At-Risk Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {clientPerformanceData.filter(c => c.status === 'at-risk').length}
            </div>
            <p className="text-sm text-yellow-600">No activity in 30-90 days</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Inactive Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {clientPerformanceData.filter(c => c.status === 'inactive').length}
            </div>
            <p className="text-sm text-red-600">No activity in 90+ days</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Performance</CardTitle>
          <CardDescription>
            Detailed performance metrics for each client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientPerformanceData.length > 0 ? (
            <div className="space-y-4">
              {clientPerformanceData.slice(0, 15).map((client) => (
                <div key={client.clientId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(client.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{client.clientName}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{client.projects} projects</span>
                        <span>{client.invoices} invoices</span>
                        <span>{formatDuration(client.hours)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{formatSEK(client.revenue)}</div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatSEK(client.avgProjectValue)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">{client.healthScore}%</div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full bg-blue-500 transition-all ${getHealthBarWidth(client.healthScore)}`} />
                      </div>
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded capitalize ${
                      client.status === 'active' ? 'bg-green-100 text-green-700' :
                      client.status === 'at-risk' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                </div>
              ))}
              
              {clientPerformanceData.length > 15 && (
                <div className="text-center pt-4 border-t">
                  <Button variant="outline" size="sm">
                    View All {clientPerformanceData.length} Clients
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No client data found for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
