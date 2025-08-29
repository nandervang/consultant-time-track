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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, XCircle, Download, Settings, FileText } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { 
  fortnoxService, 
  getStoredFortnoxConfig,
  type FortnoxExportResult 
} from '@/lib/fortnox';
import { FortnoxConfigDialog } from './FortnoxConfigDialog';
import { formatSEK } from '@/lib/currency';
import type { InvoiceItem } from '@/types/invoice';

interface ExtendedFortnoxExportResult extends FortnoxExportResult {
  clientName?: string;
  itemCount?: number;
  items?: string[];
}

interface FortnoxExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FortnoxExportDialog({ open, onOpenChange }: FortnoxExportDialogProps) {
  const { invoiceItems, markAsInvoiced } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [groupByClient, setGroupByClient] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResults, setExportResults] = useState<ExtendedFortnoxExportResult[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);

  // Get only draft items (ready for export)
  const exportableItems = invoiceItems.filter(item => item.status === 'draft');

  useEffect(() => {
    if (open) {
      // Check if Fortnox is configured
      const config = getStoredFortnoxConfig();
      setIsConfigured(!!config);
      
      if (config) {
        fortnoxService.configure(config);
      }
      
      // Reset state
      setSelectedItems(new Set());
      setExportResults([]);
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
    if (!isConfigured) {
      setConfigDialogOpen(true);
      return;
    }

    if (selectedItems.size === 0) {
      return;
    }

    setExporting(true);
    setExportResults([]);

    try {
      const itemsToExport = exportableItems.filter(item => selectedItems.has(item.id));
      const results: ExtendedFortnoxExportResult[] = [];

      if (groupByClient) {
        // Export by client groups
        const clientGroups = groupItemsByClient(itemsToExport);
        
        for (const [clientId, items] of clientGroups) {
          const client = getClientInfo(clientId);
          const clientName = client?.name || 'Unknown Client';
          
          const result = await fortnoxService.exportInvoiceItems(
            items,
            clientName,
            client?.email || undefined,
            client?.company || undefined
          );
          
          results.push({
            ...result,
            clientName,
            itemCount: items.length,
            items: items.map(item => item.id),
          });
        }
      } else {
        // Export all items as single invoice (use first client)
        const firstClient = getClientInfo(itemsToExport[0]?.client_id || '');
        const clientName = firstClient?.name || 'Mixed Clients';
        
        const result = await fortnoxService.exportInvoiceItems(
          itemsToExport,
          clientName,
          firstClient?.email || undefined,
          firstClient?.company || undefined
        );
        
        results.push({
          ...result,
          clientName,
          itemCount: itemsToExport.length,
          items: itemsToExport.map(item => item.id),
        });
      }

      setExportResults(results);

      // Mark successfully exported items as 'sent'
      const successfulExports = results.filter(r => r.success);
      const exportedItemIds = successfulExports.flatMap(r => r.items || []);
      
      if (exportedItemIds.length > 0) {
        await markAsInvoiced(exportedItemIds);
      }

    } catch (error) {
      console.error('Export failed:', error);
      setExportResults([{
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      }]);
    } finally {
      setExporting(false);
    }
  };

  const totalAmount = exportableItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.total_amount, 0);

  const selectedClientGroups = groupItemsByClient(
    exportableItems.filter(item => selectedItems.has(item.id))
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export to Fortnox
            </DialogTitle>
            <DialogDescription>
              Export invoice items to Fortnox as invoices. Only draft items can be exported.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Configuration Status */}
            {!isConfigured && (
              <Alert variant="destructive">
                <AlertDescription>
                  Fortnox integration is not configured. Please configure your API credentials first.
                </AlertDescription>
              </Alert>
            )}

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
                    Create separate invoices for each client
                  </label>
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
                        <span>Invoices to create:</span>
                        <span>{selectedClientGroups.size}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Results */}
            {exportResults.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Export Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {exportResults.map((result, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <div className="flex-1">
                          {result.success ? (
                            <>
                              <div>Invoice created successfully</div>
                              {result.invoiceNumber && (
                                <div className="text-xs">Invoice #: {result.invoiceNumber}</div>
                              )}
                            </>
                          ) : (
                            <div>Failed: {result.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {!isConfigured && (
              <Button 
                variant="outline" 
                onClick={() => setConfigDialogOpen(true)}
                className="mr-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure Fortnox
              </Button>
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            
            <Button 
              onClick={handleExport}
              disabled={!isConfigured || selectedItems.size === 0 || exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Fortnox
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FortnoxConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        onConfigured={() => {
          setIsConfigured(true);
          setConfigDialogOpen(false);
        }}
      />
    </>
  );
}
