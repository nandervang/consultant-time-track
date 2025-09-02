import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Download, FileText } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { fortnoxService } from '@/lib/fortnox';
import { formatSEK } from '@/lib/currency';
import type { InvoiceItem } from '@/types/invoice';

interface PlainTextExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlainTextExportDialog({ open, onOpenChange }: PlainTextExportDialogProps) {
  const { invoiceItems, markAsInvoiced } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [groupByClient, setGroupByClient] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [exported, setExported] = useState(false);

  // Get only draft items (ready for export)
  const exportableItems = invoiceItems.filter(item => item.status === 'draft');

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setSelectedItems(new Set());
      setInvoiceNumber('');
      setExported(false);
    }
  }, [open]);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === exportableItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(exportableItems.map(item => item.id)));
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getClientInfo = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const groupItemsByClient = (items: InvoiceItem[]) => {
    const groups = new Map<string, InvoiceItem[]>();
    
    items.forEach(item => {
      const clientId = item.client_id || 'no-client';
      if (!groups.has(clientId)) {
        groups.set(clientId, []);
      }
      groups.get(clientId)!.push(item);
    });
    
    return groups;
  };

  const handleExport = async () => {
    if (selectedItems.size === 0) {
      return;
    }

    const itemsToExport = exportableItems.filter(item => selectedItems.has(item.id));
    
    if (groupByClient) {
      // Export separate files for each client
      const clientGroups = groupItemsByClient(itemsToExport);
      
      clientGroups.forEach((items, clientId) => {
        const client = getClientInfo(clientId);
        const clientName = client?.name || 'Unknown Client';
        
        fortnoxService.downloadPlainTextInvoice(
          items,
          clientName,
          client?.email || undefined,
          client?.company || undefined,
          invoiceNumber || undefined
        );
      });
    } else {
      // Export all items as single file
      const firstClient = getClientInfo(itemsToExport[0]?.client_id || '');
      const clientName = firstClient?.name || 'Mixed Clients';
      
      fortnoxService.downloadPlainTextInvoice(
        itemsToExport,
        clientName,
        firstClient?.email || undefined,
        firstClient?.company || undefined,
        invoiceNumber || undefined
      );
    }

    // Mark items as exported (set status to 'sent')
    await markAsInvoiced(itemsToExport.map(item => item.id));
    
    setExported(true);
  };

  const totalAmount = exportableItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.total_amount, 0);

  const selectedClientGroups = groupItemsByClient(
    exportableItems.filter(item => selectedItems.has(item.id))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export as Plain Text
          </DialogTitle>
          <DialogDescription>
            Export invoice items as readable text files for manual invoice creation. 
            Only draft items can be exported.
          </DialogDescription>
        </DialogHeader>

        {exported ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Export Successful!
            </h3>
            <p className="text-gray-600">
              Your invoice{selectedClientGroups.size > 1 ? 's have' : ' has'} been downloaded as text file{selectedClientGroups.size > 1 ? 's' : ''}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Export Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="groupByClient"
                    checked={groupByClient}
                    onCheckedChange={setGroupByClient}
                  />
                  <label htmlFor="groupByClient" className="text-sm">
                    Create separate files for each client
                  </label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber" className="text-sm">
                    Invoice Number (optional)
                  </Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="e.g., INV-2025-001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to use placeholder (XXXX) in the exported file
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Item Selection */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Select Items ({exportableItems.length} available)
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedItems.size === exportableItems.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {exportableItems.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No draft items available for export
                    </p>
                  ) : (
                    exportableItems.map(item => (
                      <div key={item.id} className="flex items-center space-x-3 p-2 border rounded">
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {item.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getClientName(item.client_id || '')} • {getProjectName(item.project_id || '')}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {formatSEK(item.total_amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export Summary */}
            {selectedItems.size > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Export Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Selected items:</span>
                      <span>{selectedItems.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total amount:</span>
                      <span className="font-medium">{formatSEK(totalAmount)}</span>
                    </div>
                    {groupByClient && (
                      <div className="flex justify-between text-sm">
                        <span>Files to create:</span>
                        <span>{selectedClientGroups.size}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {exported ? 'Close' : 'Cancel'}
          </Button>
          
          {!exported && (
            <Button 
              onClick={handleExport}
              disabled={selectedItems.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Text Files
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
