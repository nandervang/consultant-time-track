import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, Users, TrendingUp, Receipt, Target, Activity } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { formatSEK } from '@/lib/currency';
import { isWithinInterval, parseISO } from 'date-fns';
import { InvoiceItem } from '@/types/invoice';
import { TimeEntry } from '@/hooks/useTimeEntries';

interface AnalyticsOverviewProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface OverviewMetrics {
  totalRevenue: number;
  totalHours: number;
  activeClients: number;
  growthRate: number;
  averageHourlyRate: number;
  productivityScore: number;
}

export function AnalyticsOverview({ dateRange }: AnalyticsOverviewProps) {
  const { invoiceItems, loading: invoicesLoading } = useInvoices();
  const { entries: timeEntries, loading: timeEntriesLoading } = useTimeEntries();
  const { clients } = useClients();
  const { projects } = useProjects();
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalRevenue: 0,
    totalHours: 0,
    activeClients: 0,
    growthRate: 0,
    averageHourlyRate: 0,
    productivityScore: 0,
  });

  useEffect(() => {
    if (!invoiceItems || !timeEntries || invoicesLoading || timeEntriesLoading) return;

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

    // Calculate total revenue
    const totalRevenue = filteredInvoices.reduce((sum: number, invoice: InvoiceItem) => sum + invoice.total_amount, 0);

    // Calculate total hours
    const totalHours = filteredTimeEntries.reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0);

    // Calculate active clients
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

    // Calculate growth rate (vs previous period)
    const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
    const previousPeriodStart = new Date(dateRange.from.getTime() - periodLength);
    const previousPeriodEnd = new Date(dateRange.to.getTime() - periodLength);

    const previousPeriodInvoices = invoiceItems.filter((invoice: InvoiceItem) => {
      const invoiceDate = parseISO(invoice.invoice_date);
      return isWithinInterval(invoiceDate, {
        start: previousPeriodStart,
        end: previousPeriodEnd,
      });
    });

    const previousRevenue = previousPeriodInvoices.reduce((sum: number, invoice: InvoiceItem) => sum + invoice.total_amount, 0);
    const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Calculate average hourly rate
    const averageHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

    // Calculate productivity score (simplified)
    const expectedWorkDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    const expectedHours = expectedWorkDays * 8; // 8 hours per day
    const productivityScore = expectedHours > 0 ? Math.min((totalHours / expectedHours) * 100, 100) : 0;

    setMetrics({
      totalRevenue,
      totalHours,
      activeClients,
      growthRate,
      averageHourlyRate,
      productivityScore,
    });
  }, [invoiceItems, timeEntries, invoicesLoading, timeEntriesLoading, dateRange, clients, projects]);

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const loading = invoicesLoading || timeEntriesLoading;

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: formatSEK(metrics.totalRevenue),
      description: `${metrics.growthRate >= 0 ? '+' : ''}${metrics.growthRate.toFixed(1)}% vs previous period`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Hours',
      value: formatDuration(metrics.totalHours),
      description: 'Time tracked this period',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Clients',
      value: metrics.activeClients.toString(),
      description: 'Clients with activity',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg Hourly Rate',
      value: formatSEK(metrics.averageHourlyRate),
      description: 'Revenue per hour',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Productivity',
      value: `${metrics.productivityScore.toFixed(1)}%`,
      description: 'Of expected work hours',
      icon: Activity,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Growth Trend',
      value: `${metrics.growthRate >= 0 ? '+' : ''}${metrics.growthRate.toFixed(1)}%`,
      description: 'Revenue growth rate',
      icon: TrendingUp,
      color: metrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.growthRate >= 0 ? 'bg-green-100' : 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Summary Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Revenue Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="font-semibold">{formatSEK(metrics.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Hourly Rate</span>
              <span className="font-semibold">{formatSEK(metrics.averageHourlyRate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Growth Rate</span>
              <span className={`font-semibold ${metrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Hours</span>
              <span className="font-semibold">{formatDuration(metrics.totalHours)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Clients</span>
              <span className="font-semibold">{metrics.activeClients}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Productivity Score</span>
              <span className="font-semibold">{metrics.productivityScore.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
