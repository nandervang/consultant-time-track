import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { formatSEK } from '@/lib/currency';
import { format } from 'date-fns';

export default function OverdueInvoicesCard() {
  const { invoiceItems } = useInvoices();
  const { clients } = useClients();

  const overdueInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return invoiceItems
      .filter(item => {
        // Only include items that have a due_date, are past due, and not paid
        if (!item.due_date || item.status === 'paid') return false;
        
        const dueDate = new Date(item.due_date);
        return dueDate < today;
      })
      .sort((a, b) => {
        // Sort by most overdue first (oldest due_date first)
        const aDate = new Date(a.due_date!);
        const bDate = new Date(b.due_date!);
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 10) // Show up to 10 overdue invoices
      .map(item => {
        const client = clients.find(c => c.id === item.client_id);
        const dueDate = new Date(item.due_date!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - dueDate.getTime();
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let urgency: 'critical' | 'high' | 'medium' = 'medium';
        if (daysOverdue > 30) urgency = 'critical';
        else if (daysOverdue > 14) urgency = 'high';
        
        return {
          ...item,
          clientName: client?.name || 'Unknown Client',
          daysOverdue,
          urgency
        };
      });
  }, [invoiceItems, clients]);

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-red-400" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-200 text-red-900 border-red-300';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-red-50 text-red-700 border-red-150';
    }
  };

  const getDaysOverdueText = (days: number) => {
    if (days === 1) return '1 day overdue';
    return `${days} days overdue`;
  };

  const totalOverdueAmount = overdueInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);

  if (overdueInvoices.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Overdue Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
            <p>No overdue invoices</p>
            <p className="text-sm">All payments are on track!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Overdue Invoices
          <Badge variant="destructive" className="ml-auto">
            {overdueInvoices.length}
          </Badge>
        </CardTitle>
        {totalOverdueAmount > 0 && (
          <div className="text-sm text-muted-foreground">
            Total overdue: <span className="font-semibold text-red-600">{formatSEK(totalOverdueAmount)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {overdueInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getUrgencyIcon(invoice.urgency)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate text-red-900">{invoice.clientName}</p>
                    <Badge variant="outline" className={`text-xs ${getUrgencyColor(invoice.urgency)}`}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-red-700 truncate">
                    {invoice.description}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0 ml-2">
                <div className="font-medium text-sm text-red-900">{formatSEK(invoice.total_amount)}</div>
                <div className="text-xs font-medium text-red-600">
                  {getDaysOverdueText(invoice.daysOverdue)}
                </div>
                <div className="text-xs text-red-600">
                  Due: {format(new Date(invoice.due_date!), 'MMM d')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
