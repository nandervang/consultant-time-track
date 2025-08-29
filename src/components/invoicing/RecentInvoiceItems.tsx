import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Clock, Calendar } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import { InvoiceItem } from '@/types/invoice';

interface RecentInvoiceItemsProps {
  items: InvoiceItem[];
  loading?: boolean;
  onItemClick?: (itemId: string) => void;
  clients: Array<{ id: string; name: string; company?: string | null }>;
  projects: Array<{ id: string; name: string; color: string }>;
}

export function RecentInvoiceItems({ 
  items, 
  loading, 
  onItemClick, 
  clients, 
  projects 
}: RecentInvoiceItemsProps) {
  if (loading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">Recent Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
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

  const recentItems = items.slice(0, 6);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-orange-600 bg-orange-100';
      case 'sent':
        return 'text-blue-600 bg-blue-100';
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getProjectInfo = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project || { name: 'Unknown Project', color: '#9CA3AF' };
  };

  return (
    <Card className="h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Items</CardTitle>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No invoice items yet</p>
              <p className="text-sm">Create your first invoice item to track unbilled work</p>
            </div>
          ) : (
            recentItems.map((item) => {
              const client = getClientName(item.client_id || '');
              const project = getProjectInfo(item.project_id || '');
              
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onItemClick?.(item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-300"
                        style={{ backgroundColor: project.color || '#9CA3AF' }}
                      />
                      <h4 className="font-medium truncate">{item.description}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{client}</span>
                      <span>•</span>
                      <span>{project.name}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.invoice_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 font-medium">
                      <span className="text-xs text-muted-foreground">SEK</span>
                      <span>{formatSEK(item.total_amount)}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {items.length > 6 && (
          <Button variant="outline" className="w-full mt-3" size="sm">
            View All Items ({items.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
