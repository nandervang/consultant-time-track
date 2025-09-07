import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { formatSEK } from '@/lib/currency';
import { format } from 'date-fns';

export default function UpcomingInvoicesCard() {
  const { invoiceItems } = useInvoices();
  const { clients } = useClients();
  const daysAhead = 7;

  const upcomingInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysAhead);
    futureDate.setHours(23, 59, 59, 999);

    return invoiceItems
      .filter(item => {
        const invoiceDate = new Date(item.invoice_date);
        // Show items that are ready to be created (invoice_date is approaching)
        return invoiceDate >= today && invoiceDate <= futureDate && item.status !== 'paid';
      })
      .sort((a, b) => {
        // Sort by proximity to today (closest invoice creation dates first)
        const aDate = new Date(a.invoice_date);
        const bDate = new Date(b.invoice_date);
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 5) // Show only top 5 upcoming
      .map(item => {
        const client = clients.find(c => c.id === item.client_id);
        const invoiceDate = new Date(item.invoice_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = invoiceDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let urgency: 'overdue' | 'urgent' | 'soon' | 'normal' = 'normal';
        if (diffDays < 0) urgency = 'overdue'; // Should have been created already
        else if (diffDays <= 2) urgency = 'urgent'; // Ready to create now
        else if (diffDays <= 4) urgency = 'soon'; // Create soon
        
        return {
          ...item,
          clientName: client?.name || 'Unknown Client',
          daysUntilCreation: diffDays,
          urgency
        };
      });
  }, [invoiceItems, clients, daysAhead]);

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'urgent':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'soon':
        return <Calendar className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getDaysText = (days: number) => {
    if (days < 0) return `${Math.abs(days)} days overdue to create`;
    if (days === 0) return 'Ready to create today';
    if (days === 1) return 'Ready to create tomorrow';
    return `Create in ${days} days`;
  };

  if (upcomingInvoices.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Ready to Create ({daysAhead} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No invoices ready to create</p>
            <p className="text-sm">All caught up for the next {daysAhead} days!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Ready to Create ({daysAhead} days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getUrgencyIcon(invoice.urgency)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{invoice.clientName}</p>
                    <Badge variant="outline" className={`text-xs ${getUrgencyColor(invoice.urgency)}`}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {invoice.description}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0 ml-2">
                <div className="font-medium text-sm">{formatSEK(invoice.total_amount)}</div>
                <div className="text-xs text-muted-foreground">
                  {getDaysText(invoice.daysUntilCreation)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(invoice.invoice_date), 'MMM d')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
