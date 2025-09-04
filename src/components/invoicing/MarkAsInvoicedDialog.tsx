import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Receipt, Calendar, Building2 } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';

interface MarkAsInvoicedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarkAsInvoicedDialog({ open, onOpenChange }: MarkAsInvoicedDialogProps) {
  const { invoiceItems, markAsInvoiced } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { toast } = useToast();
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Only show draft items
  const draftItems = invoiceItems.filter(item => item.status === 'draft');

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === draftItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(draftItems.map(item => item.id));
    }
  };

  const handleMarkAsInvoiced = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to mark as invoiced',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await markAsInvoiced(selectedItems);
      toast({
        title: 'Success',
        description: `${selectedItems.length} item(s) marked as invoiced`,
      });
      setSelectedItems([]);
      onOpenChange(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update invoice items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getClient = (clientId: string | null) => {
    return clients.find(c => c.id === clientId);
  };

  const getProject = (projectId: string | null) => {
    return projects.find(p => p.id === projectId);
  };

  const totalSelectedAmount = selectedItems.reduce((sum, itemId) => {
    const item = draftItems.find(i => i.id === itemId);
    return sum + (item?.total_amount || 0);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Mark as Invoiced
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {draftItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No draft items available</p>
              <p className="text-sm">All items have already been invoiced or paid</p>
            </div>
          ) : (
            <>
              {/* Header with select all */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedItems.length === draftItems.length && draftItems.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-medium">
                    Select All ({draftItems.length} draft items)
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedItems.length > 0 && (
                    <span>
                      {selectedItems.length} selected • {formatSEK(totalSelectedAmount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-3">
                {draftItems
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((item) => {
                    const client = getClient(item.client_id);
                    const project = getProject(item.project_id);
                    const isSelected = selectedItems.includes(item.id);
                    
                    return (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleItemToggle(item.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleItemToggle(item.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium truncate">{item.description}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">Draft</Badge>
                                  <span className="font-semibold text-green-600">
                                    {formatSEK(item.total_amount)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  <span>{client?.name || 'Unknown Client'}</span>
                                </div>
                                <div>
                                  Project: {project?.name || 'No Project'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(item.invoice_date).toLocaleDateString('sv-SE')}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>
                                  {item.hours ? `${item.hours} hours @ ${formatSEK(item.hourly_rate || 0)}/h` : 'Fixed price'}
                                </span>
                                <span>
                                  Created: {new Date(item.created_at).toLocaleDateString('sv-SE')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {selectedItems.length > 0 && (
              <span>
                {selectedItems.length} item(s) selected • Total: {formatSEK(totalSelectedAmount)}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsInvoiced}
              disabled={selectedItems.length === 0 || loading}
            >
              {loading ? 'Updating...' : `Mark ${selectedItems.length} as Invoiced`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
