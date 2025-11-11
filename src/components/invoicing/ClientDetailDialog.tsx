import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [editDueDateOption, setEditDueDateOption] = useState<'20' | '30' | '90' | 'custom'>('20');
  const [sortBy, setSortBy] = useState<'invoice_date' | 'created_at' | 'total_amount' | 'status' | 'description'>('invoice_date');
  const [showPaidItems, setShowPaidItems] = useState(false);

  // Helper function to calculate due date based on invoice date and days
  const calculateDueDate = (invoiceDate: string, days: number): string => {
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // Determine which due date option is currently selected based on the dates
  const determineDueDateOption = (invoiceDate: string, dueDate: string): '20' | '30' | '90' | 'custom' => {
    const invoiceDateObj = new Date(invoiceDate);
    const dueDateObj = new Date(dueDate);
    const diffTime = dueDateObj.getTime() - invoiceDateObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 20) return '20';
    if (diffDays === 30) return '30';
    if (diffDays === 90) return '90';
    return 'custom';
  };

  // Handle due date option change in edit mode
  const handleEditDueDateOptionChange = (option: '20' | '30' | '90' | 'custom') => {
    setEditDueDateOption(option);
    
    if (option !== 'custom' && editForm.invoice_date) {
      const days = parseInt(option);
      const newDueDate = calculateDueDate(editForm.invoice_date, days);
      setEditForm(prev => ({ ...prev, due_date: newDueDate }));
    }
  };

  // Sort items function
  const sortItems = (items: InvoiceItem[]) => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'invoice_date': {
          // For invoice date, sort chronologically with closest dates first
          const aDate = new Date(a.invoice_date).getTime();
          const bDate = new Date(b.invoice_date).getTime();
          
          // Simple chronological sort - closest dates first
          return aDate - bDate;
        }
        case 'created_at': {
          const aDate = new Date(a.created_at).getTime();
          const bDate = new Date(b.created_at).getTime();
          return bDate - aDate; // Newest created first
        }
        case 'total_amount': {
          return b.total_amount - a.total_amount; // Highest amount first
        }
        case 'status': {
          // Sort by status priority: draft, sent, overdue, paid
          const statusOrder = { draft: 1, sent: 2, overdue: 3, paid: 4 };
          const aValue = statusOrder[a.status as keyof typeof statusOrder] || 5;
          const bValue = statusOrder[b.status as keyof typeof statusOrder] || 5;
          return aValue - bValue;
        }
        case 'description': {
          return a.description.toLowerCase().localeCompare(b.description.toLowerCase());
        }
        default: {
          // Default to invoice_date sorting
          const aDate = new Date(a.invoice_date).getTime();
          const bDate = new Date(b.invoice_date).getTime();
          return aDate - bDate;
        }
      }
    });
  };

  const client = clients.find(c => c.id === clientId);
  const allClientItems = invoiceItems.filter(item => item.client_id === clientId);
  // Filter out paid items unless showPaidItems is true
  const clientItems = showPaidItems 
    ? allClientItems 
    : allClientItems.filter(item => item.status !== 'paid');
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
    
    const editData = {
      id: item.id,
      description: item.description,
      client_id: item.client_id || undefined,
      project_id: item.project_id || undefined,
      quantity: getInvoiceItemQuantity(item),
      rate: getInvoiceItemUnitRate(item),
      type: getInvoiceItemType(item),
      invoice_date: item.invoice_date,
      due_date: item.due_date || undefined,
      status: item.status,
      notes: item.notes || undefined,
    };
    
    setEditForm(editData);
    
    // Determine due date option
    if (item.invoice_date && item.due_date) {
      const option = determineDueDateOption(item.invoice_date, item.due_date);
      setEditDueDateOption(option);
    } else {
      setEditDueDateOption('20');
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleEditSave = async () => {
    if (!editingItem || !editForm.id) return;

    // Validate dates
    if (editForm.invoice_date && editForm.due_date) {
      const invoiceDate = new Date(editForm.invoice_date);
      const dueDate = new Date(editForm.due_date);
      
      if (invoiceDate > dueDate) {
        toast({
          title: 'Error',
          description: 'Invoice date cannot be after due date',
          variant: 'destructive',
        });
        return;
      }
    }

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
    return allClientItems.reduce(
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
                <Badge variant="outline">
                  {clientItems.length} {clientItems.length === 1 ? 'item' : 'items'}
                  {!showPaidItems && allClientItems.length !== clientItems.length && ' (paid hidden)'}
                </Badge>
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
                <>
                  {/* Sorting Controls */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="sort-by" className="text-sm font-medium">Sort by:</Label>
                      <select
                        id="sort-by"
                        title="Sort items by"
                        className="flex h-9 w-auto rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      >
                        <option value="invoice_date">Invoice Date</option>
                        <option value="created_at">Created Date</option>
                        <option value="total_amount">Amount</option>
                        <option value="status">Status</option>
                        <option value="description">Description</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="show-paid" 
                        checked={showPaidItems}
                        onCheckedChange={(checked) => setShowPaidItems(checked === true)}
                      />
                      <Label htmlFor="show-paid" className="text-sm font-medium cursor-pointer">
                        Show paid items
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {sortItems(clientItems).map((item) => (
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
                                <Label htmlFor={`invoice_date-${item.id}`}>Invoice Date</Label>
                                <Input
                                  id={`invoice_date-${item.id}`}
                                  type="date"
                                  value={editForm.invoice_date || ''}
                                  onChange={(e) => {
                                    const invoiceDate = e.target.value;
                                    setEditForm(prev => ({ 
                                      ...prev, 
                                      invoice_date: invoiceDate
                                    }));
                                    
                                    // Auto-update due date if not custom
                                    if (editDueDateOption !== 'custom') {
                                      const days = parseInt(editDueDateOption);
                                      const newDueDate = calculateDueDate(invoiceDate, days);
                                      setEditForm(prev => ({ ...prev, due_date: newDueDate }));
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`due_date-${item.id}`}>Due Date</Label>
                                <div className="space-y-2">
                                  <select
                                    title="Select due date option"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editDueDateOption}
                                    onChange={(e) => handleEditDueDateOptionChange(e.target.value as '20' | '30' | '90' | 'custom')}
                                  >
                                    <option value="20">20 days</option>
                                    <option value="30">30 days</option>
                                    <option value="90">90 days</option>
                                    <option value="custom">Custom date</option>
                                  </select>
                                  
                                  {editDueDateOption === 'custom' && (
                                    <Input
                                      id={`due_date-${item.id}`}
                                      type="date"
                                      value={editForm.due_date || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))}
                                    />
                                  )}
                                  
                                  {editDueDateOption !== 'custom' && (
                                    <div className="text-sm text-muted-foreground">
                                      Due: {editForm.due_date && new Date(editForm.due_date).toLocaleDateString('sv-SE')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
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
                                Invoice: {new Date(item.invoice_date).toLocaleDateString('sv-SE')}
                              </div>
                              {item.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Due: {new Date(item.due_date).toLocaleDateString('sv-SE')}
                                </div>
                              )}
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
                </>
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
