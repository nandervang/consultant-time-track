import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Building2, 
  Calendar,
  DollarSign,
  Clock,
  FileText
} from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import { getInvoiceItemQuantity, getInvoiceItemUnitRate, getInvoiceItemType } from '@/lib/utils';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { InvoiceItem, UpdateInvoiceItemData } from '@/types/invoice';

interface ClientDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export function ClientDetailDialog({ open, onOpenChange, clientId }: ClientDetailDialogProps) {
  const { invoiceItems, updateInvoiceItem, deleteInvoiceItem } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { toast } = useToast();
  
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UpdateInvoiceItemData>>({});

  const client = clients.find(c => c.id === clientId);
  const clientItems = invoiceItems.filter(item => item.client_id === clientId);
  const clientProjects = projects.filter(p => p.client_id === clientId);

  // Reset editing state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setEditingItem(null);
      setEditForm({});
    }
  }, [open]);

  const handleEditStart = (item: InvoiceItem) => {
    setEditingItem(item.id);
    
    setEditForm({
      id: item.id,
      description: item.description,
      client_id: item.client_id || undefined,
      project_id: item.project_id || undefined,
      quantity: getInvoiceItemQuantity(item),
      rate: getInvoiceItemUnitRate(item),
      type: getInvoiceItemType(item),
      date: item.invoice_date,
      status: item.status,
      notes: item.notes || undefined,
    });
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleEditSave = async () => {
    if (!editingItem || !editForm.id) return;

    try {
      await updateInvoiceItem(editForm as UpdateInvoiceItemData);
      toast({
        title: 'Success',
        description: 'Invoice item updated successfully',
      });
      setEditingItem(null);
      setEditForm({});
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update invoice item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this invoice item?')) return;

    try {
      await deleteInvoiceItem(itemId);
      toast({
        title: 'Success',
        description: 'Invoice item deleted successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice item',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'outline';
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600';
      case 'sent': return 'text-blue-600';
      case 'paid': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const calculateSummary = () => {
    return clientItems.reduce(
      (acc, item) => {
        acc.totalItems++;
        acc.totalAmount += item.total_amount;
        
        switch (item.status) {
          case 'draft':
            acc.draftAmount += item.total_amount;
            acc.draftCount++;
            break;
          case 'sent':
            acc.sentAmount += item.total_amount;
            acc.sentCount++;
            break;
          case 'paid':
            acc.paidAmount += item.total_amount;
            acc.paidCount++;
            break;
          case 'overdue':
            acc.overdueAmount += item.total_amount;
            acc.overdueCount++;
            break;
        }
        
        return acc;
      },
      {
        totalItems: 0,
        totalAmount: 0,
        draftAmount: 0,
        draftCount: 0,
        sentAmount: 0,
        sentCount: 0,
        paidAmount: 0,
        paidCount: 0,
        overdueAmount: 0,
        overdueCount: 0,
      }
    );
  };

  const summary = calculateSummary();

  if (!client) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-5 w-5" />
            {client.name}
            {client.company && (
              <span className="text-sm text-muted-foreground">({client.company})</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Items</span>
                </div>
                <div className="text-2xl font-bold">{summary.totalItems}</div>
                <div className="text-sm text-muted-foreground">
                  {formatSEK(summary.totalAmount)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Draft</span>
                </div>
                <div className="text-2xl font-bold text-gray-600">{summary.draftCount}</div>
                <div className="text-sm text-muted-foreground">
                  {formatSEK(summary.draftAmount)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Sent</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{summary.sentCount}</div>
                <div className="text-sm text-muted-foreground">
                  {formatSEK(summary.sentAmount)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Paid</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{summary.paidCount}</div>
                <div className="text-sm text-muted-foreground">
                  {formatSEK(summary.paidAmount)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Invoice Items</span>
                <Badge variant="outline">{clientItems.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No invoice items found for this client</p>
                  <p className="text-sm">Create some invoice items to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientItems
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        {editingItem === item.id ? (
                          // Edit Mode
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`desc-${item.id}`}>Description</Label>
                                <Textarea
                                  id={`desc-${item.id}`}
                                  value={editForm.description || ''}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                  rows={2}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`project-${item.id}`}>Project</Label>
                                <Select
                                  value={editForm.project_id || ''}
                                  onValueChange={(value) => setEditForm(prev => ({ ...prev, project_id: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {clientProjects.map((project) => (
                                      <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <Label htmlFor={`type-${item.id}`}>Type</Label>
                                <Select
                                  value={editForm.type || 'hourly'}
                                  onValueChange={(value: 'hourly' | 'fixed') => setEditForm(prev => ({ ...prev, type: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hourly">Hourly</SelectItem>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor={`quantity-${item.id}`}>
                                  {editForm.type === 'hourly' ? 'Hours' : 'Quantity'}
                                </Label>
                                <Input
                                  id={`quantity-${item.id}`}
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  value={editForm.quantity || 0}
                                  onChange={(e) => setEditForm(prev => ({ 
                                    ...prev, 
                                    quantity: parseFloat(e.target.value) || 0 
                                  }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`rate-${item.id}`}>Rate</Label>
                                <Input
                                  id={`rate-${item.id}`}
                                  type="number"
                                  min="0"
                                  value={editForm.rate || 0}
                                  onChange={(e) => setEditForm(prev => ({ 
                                    ...prev, 
                                    rate: parseFloat(e.target.value) || 0 
                                  }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`status-${item.id}`}>Status</Label>
                                <Select
                                  value={editForm.status || 'draft'}
                                  onValueChange={(value: 'draft' | 'sent' | 'paid' | 'overdue') => 
                                    setEditForm(prev => ({ ...prev, status: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`date-${item.id}`}>Date</Label>
                                <Input
                                  id={`date-${item.id}`}
                                  type="date"
                                  value={editForm.date || ''}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Total Amount</Label>
                                <div className="text-lg font-semibold mt-2">
                                  {formatSEK((editForm.quantity || 0) * (editForm.rate || 0))}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={handleEditCancel}>
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleEditSave}>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{item.description}</h4>
                                  <Badge variant={getStatusBadgeVariant(item.status)}>
                                    {item.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {item.project_id && (
                                    <span>
                                      Project: {projects.find(p => p.id === item.project_id)?.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStart(item)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Type:</span>
                                <div className="font-medium">
                                  {item.hours ? 'Hourly' : 'Fixed'}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  {item.hours ? 'Hours:' : 'Quantity:'}
                                </span>
                                <div className="font-medium">
                                  {getInvoiceItemQuantity(item)}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Rate:</span>
                                <div className="font-medium">
                                  {formatSEK(item.hourly_rate || item.fixed_amount || 0)}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total:</span>
                                <div className={`font-semibold ${getStatusColor(item.status)}`}>
                                  {formatSEK(item.total_amount)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.invoice_date).toLocaleDateString('sv-SE')}
                              </div>
                              <div>
                                Created: {new Date(item.created_at).toLocaleDateString('sv-SE')}
                              </div>
                              {item.updated_at !== item.created_at && (
                                <div>
                                  Updated: {new Date(item.updated_at).toLocaleDateString('sv-SE')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
