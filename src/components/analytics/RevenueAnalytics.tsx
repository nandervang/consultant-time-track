import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { formatSEK } from '@/lib/currency';
import { InvoiceItem } from '@/types/invoice';
import { format, isWithinInterval, parseISO } from 'date-fns';

interface RevenueAnalyticsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface RevenueMetrics {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  averageInvoiceValue: number;
  invoiceCount: number;
  growthRate: number;
  collectionRate: number;
}

interface ClientRevenueData {
  clientId: string;
  clientName: string;
  revenue: number;
  invoiceCount: number;
  percentage: number;
}

export function RevenueAnalytics({ dateRange }: RevenueAnalyticsProps) {
  const { invoiceItems, loading: invoicesLoading } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    overdueRevenue: 0,
    averageInvoiceValue: 0,
    invoiceCount: 0,
    growthRate: 0,
    collectionRate: 0,
  });
  const [clientRevenueData, setClientRevenueData] = useState<ClientRevenueData[]>([]);

  useEffect(() => {
    if (!invoiceItems || invoicesLoading) return;

    const filteredInvoices = invoiceItems.filter((invoice: InvoiceItem) => {
      const invoiceDate = parseISO(invoice.invoice_date);
      return isWithinInterval(invoiceDate, {
        start: dateRange.from,
        end: dateRange.to,
      });
    });

    // Calculate revenue metrics
    const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const paidRevenue = filteredInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const pendingRevenue = filteredInvoices
      .filter(invoice => invoice.status === 'sent')
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const overdueRevenue = filteredInvoices
      .filter(invoice => {
        if (!invoice.due_date) return false;
        const dueDate = parseISO(invoice.due_date);
        return invoice.status === 'sent' && dueDate < new Date();
      })
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);

    const averageInvoiceValue = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;
    const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;

    // Calculate growth rate (compared to previous period)
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

    const previousRevenue = previousPeriodInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    setMetrics({
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      overdueRevenue,
      averageInvoiceValue,
      invoiceCount: filteredInvoices.length,
      growthRate,
      collectionRate,
    });

    // Calculate client revenue distribution
    const clientRevenue = new Map<string, { revenue: number; invoiceCount: number; name: string }>();
    
    filteredInvoices.forEach((invoice: InvoiceItem) => {
      const project = projects.find(p => p.id === invoice.project_id);
      const client = clients.find(c => c.id === project?.client_id);
      const clientId = client?.id || 'unknown';
      const clientName = client?.name || 'Unknown Client';

      const existing = clientRevenue.get(clientId) || { revenue: 0, invoiceCount: 0, name: clientName };
      clientRevenue.set(clientId, {
        revenue: existing.revenue + invoice.total_amount,
        invoiceCount: existing.invoiceCount + 1,
        name: clientName,
      });
    });

    const clientRevenueArray = Array.from(clientRevenue.entries()).map(([clientId, data]) => ({
      clientId,
      clientName: data.name,
      revenue: data.revenue,
      invoiceCount: data.invoiceCount,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }));

    clientRevenueArray.sort((a, b) => b.revenue - a.revenue);
    setClientRevenueData(clientRevenueArray);
  }, [invoiceItems, invoicesLoading, dateRange, clients, projects]);

  if (invoicesLoading) {
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
      title: 'Total Revenue',
      value: formatSEK(metrics.totalRevenue),
      description: `${metrics.growthRate >= 0 ? '+' : ''}${metrics.growthRate.toFixed(1)}% vs previous period`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Collected Revenue',
      value: formatSEK(metrics.paidRevenue),
      description: `${metrics.collectionRate.toFixed(1)}% collection rate`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Revenue',
      value: formatSEK(metrics.pendingRevenue),
      description: 'Awaiting payment',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Average Invoice',
      value: formatSEK(metrics.averageInvoiceValue),
      description: `${metrics.invoiceCount} invoices`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Overview Cards */}
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

      {/* Growth Indicator */}
      {metrics.growthRate !== 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {metrics.growthRate >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              Revenue Trend
            </CardTitle>
            <CardDescription>
              {metrics.growthRate >= 0 ? 'Revenue is growing' : 'Revenue has decreased'} by{' '}
              {Math.abs(metrics.growthRate).toFixed(1)}% compared to the previous period
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Overdue Revenue Alert */}
      {metrics.overdueRevenue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Overdue Revenue</CardTitle>
            <CardDescription className="text-red-600">
              You have {formatSEK(metrics.overdueRevenue)} in overdue invoices that need attention
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Client Revenue Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Client</CardTitle>
          <CardDescription>
            Revenue distribution across your clients for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientRevenueData.length > 0 ? (
            <div className="space-y-4">
              {clientRevenueData.slice(0, 10).map((client) => (
                <div key={client.clientId} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{client.clientName}</p>
                    <p className="text-sm text-gray-500">
                      {client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {client.percentage.toFixed(1)}%
                    </span>
                    <span className="font-medium">{formatSEK(client.revenue)}</span>
                  </div>
                </div>
              ))}
              {clientRevenueData.length > 10 && (
                <p className="text-sm text-gray-500 text-center pt-2 border-t">
                  And {clientRevenueData.length - 10} more clients...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No revenue data found for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Period Summary</CardTitle>
          <CardDescription>
            Revenue summary from {format(dateRange.from, 'MMM d, yyyy')} to {format(dateRange.to, 'MMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatSEK(metrics.paidRevenue)}</div>
              <p className="text-sm text-gray-500">Collected</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatSEK(metrics.pendingRevenue)}</div>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatSEK(metrics.overdueRevenue)}</div>
              <p className="text-sm text-gray-500">Overdue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
