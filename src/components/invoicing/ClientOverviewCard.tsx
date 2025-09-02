import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Building2 } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import { ClientInvoiceSummary } from '@/types/invoice';

interface ClientOverviewCardProps {
  clients: ClientInvoiceSummary[];
  loading?: boolean;
  onClientClick?: (clientId: string) => void;
}

export function ClientOverviewCard({ clients, loading, onClientClick }: ClientOverviewCardProps) {
  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Client Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-4 h-full">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topClients = clients.slice(0, 8); // Show more clients

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
        <CardTitle className="text-lg">Client Overview</CardTitle>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1 overflow-y-auto">
          {topClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex-1 flex flex-col justify-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No client data available</p>
              <p className="text-sm">Add some invoice items to see client overview</p>
            </div>
          ) : (
            topClients.map((client) => (
              <div
                key={client.client_id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onClientClick?.(client.client_id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{client.client_name}</h4>
                    {client.company && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {client.company}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-sm text-gray-600">
                    <span>{client.itemCount} items</span>
                    <span>{client.projectCount} projects</span>
                  </div>
                </div>
                <div className="text-right">
                  {client.totalUnbilled > 0 && (
                    <div className="flex items-center gap-1 text-orange-600 font-medium mb-1">
                      <span className="text-xs text-muted-foreground">SEK</span>
                      <span className="text-sm">{formatSEK(client.totalUnbilled)}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Total: {formatSEK(client.totalPaid + client.totalSent + client.totalUnbilled)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {clients.length > 8 && (
          <div className="mt-3 flex-shrink-0">
            <Button variant="outline" className="w-full" size="sm">
              View All Clients ({clients.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
