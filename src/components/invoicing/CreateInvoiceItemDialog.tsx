import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { CreateInvoiceItemData } from '@/types/invoice';

interface CreateInvoiceItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceItemDialog({ open, onOpenChange }: CreateInvoiceItemDialogProps) {
  const { addInvoiceItem } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { toast } = useToast();

  // Debug logging
  console.log('Dialog opened, clients:', clients, 'projects:', projects);

  const [formData, setFormData] = useState<Partial<CreateInvoiceItemData>>({
    client_id: '',
    project_id: '',
    description: '',
    quantity: 1,
    rate: 0,
    type: 'hourly',
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
  });

  const [loading, setLoading] = useState(false);

  const selectedClient = clients.find(c => c.id === formData.client_id);
  const clientProjects = projects.filter(p => p.client_id === formData.client_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.project_id || !formData.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await addInvoiceItem(formData as CreateInvoiceItemData);
      toast({
        title: 'Success',
        description: 'Invoice item created successfully',
      });
      onOpenChange(false);
      setFormData({
        client_id: '',
        project_id: '',
        description: '',
        quantity: 1,
        rate: 0,
        type: 'hourly',
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create invoice item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      project_id: '', // Reset project when client changes
      rate: clients.find(c => c.id === clientId)?.hourly_rate || 0,
    }));
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      rate: project?.hourly_rate || selectedClient?.hourly_rate || prev.rate || 0,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Invoice Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <select
                id="client"
                title="Select client"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.client_id}
                onChange={(e) => handleClientChange(e.target.value)}
                required
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <select
                id="project"
                title="Select project"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.project_id}
                onChange={(e) => handleProjectChange(e.target.value)}
                disabled={!formData.client_id}
                required
              >
                <option value="">Select project</option>
                {clientProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the work performed..."
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                title="Select type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'hourly' | 'fixed' }))}
              >
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed Price</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                {formData.type === 'hourly' ? 'Hours' : 'Quantity'}
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.25"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  quantity: parseFloat(e.target.value) || 0 
                }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">
                {formData.type === 'hourly' ? 'Rate/Hour' : 'Total Price'}
              </Label>
              <Input
                id="rate"
                type="number"
                min="0"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  rate: parseFloat(e.target.value) || 0 
                }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          {formData.quantity && formData.rate && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Amount:</div>
              <div className="text-lg font-semibold">
                {new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: 'SEK',
                }).format((formData.quantity || 0) * (formData.rate || 0))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invoice Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
