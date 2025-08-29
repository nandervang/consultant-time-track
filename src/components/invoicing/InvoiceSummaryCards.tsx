import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Receipt, Users } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import { InvoiceSummary } from '@/types/invoice';

interface InvoiceSummaryCardsProps {
  summary: InvoiceSummary;
  loading?: boolean;
}

export function InvoiceSummaryCards({ summary, loading }: InvoiceSummaryCardsProps) {
  // Simple SEK text component
  const SekIcon = ({ className }: { className?: string }) => (
    <span className={`font-bold ${className}`}>SEK</span>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardTitle>
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
      title: 'Unbilled Work',
      value: formatSEK(summary.totalUnbilled),
      description: `${summary.itemCount} items pending`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Invoiced',
      value: formatSEK(summary.totalSent),
      description: 'Awaiting payment',
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Paid',
      value: formatSEK(summary.totalPaid),
      description: 'Completed revenue',
      icon: SekIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Clients',
      value: summary.clientCount.toString(),
      description: 'With unbilled work',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
  );
}
