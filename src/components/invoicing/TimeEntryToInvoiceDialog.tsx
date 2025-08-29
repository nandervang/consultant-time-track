import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useToast } from '@/hooks/use-toast';
import { formatSEK } from '@/lib/currency';
import { TimeEntry } from '@/hooks/useTimeEntries';

interface TimeEntryToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeEntryToInvoiceDialog({ open, onOpenChange }: TimeEntryToInvoiceDialogProps) {
  const { createInvoiceFromTimeEntries } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { entries } = useTimeEntries();
  const { toast } = useToast();

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter unbilled entries (for now, show all entries since we don't track invoice_item_id yet)
  const unbilledEntries = entries;

  // Group entries by project and client
  const groupedEntries = unbilledEntries.reduce((acc, entry) => {
    const project = projects.find(p => p.id === entry.project_id);
    const client = clients.find(c => c.id === project?.client_id);
    
    if (!project || !client) return acc;
    
    const key = `${client.id}-${project.id}`;
    if (!acc[key]) {
      acc[key] = {
        client,
        project,
        entries: []
      };
    }
    acc[key].entries.push(entry);
    return acc;
  }, {} as Record<string, { client: ReturnType<typeof useClients>['clients'][0]; project: ReturnType<typeof useProjects>['projects'][0]; entries: TimeEntry[] }>);

  const selectedEntriesData = unbilledEntries.filter(entry => 
    selectedEntries.includes(entry.id)
  );

  const totalHours = selectedEntriesData.reduce((sum, entry) => sum + entry.hours, 0);
  const totalAmount = selectedEntriesData.reduce((sum, entry) => {
    const project = projects.find(p => p.id === entry.project_id);
    const client = clients.find(c => c.id === project?.client_id);
    const rate = project?.hourly_rate || client?.hourly_rate || 0;
    return sum + (entry.hours * rate);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEntries.length === 0 || !selectedClient) {
      toast({
        title: 'Error',
        description: 'Please select time entries and a client',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createInvoiceFromTimeEntries(
        selectedEntries,
        selectedClient,
        description || `Time entries - ${totalHours} hours`
      );
      toast({
        title: 'Success',
        description: 'Invoice item created from time entries',
      });
      onOpenChange(false);
      setSelectedEntries([]);
      setSelectedClient('');
      setDescription('');
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

  const handleEntryToggle = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleGroupToggle = (groupEntries: TimeEntry[]) => {
    const groupIds = groupEntries.map(e => e.id);
    const allSelected = groupIds.every(id => selectedEntries.includes(id));
    
    if (allSelected) {
      setSelectedEntries(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedEntries(prev => [...new Set([...prev, ...groupIds])]);
    }
  };

  // Auto-select client when entries are selected
  useEffect(() => {
    if (selectedEntriesData.length > 0) {
      const firstEntry = selectedEntriesData[0];
      const project = projects.find(p => p.id === firstEntry.project_id);
      if (project?.client_id && !selectedClient) {
        setSelectedClient(project.client_id);
      }
    }
  }, [selectedEntriesData, projects, selectedClient]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Time Entries to Invoice Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.keys(groupedEntries).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No unbilled time entries found</p>
              <p className="text-sm">All your time entries have been converted to invoice items</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <Label>Select Time Entries to Convert:</Label>
                {Object.values(groupedEntries).map(({ client, project, entries }) => {
                  const groupHours = entries.reduce((sum, e) => sum + e.hours, 0);
                  const groupIds = entries.map(e => e.id);
                  const allSelected = groupIds.every(id => selectedEntries.includes(id));
                  const someSelected = groupIds.some(id => selectedEntries.includes(id));
                  
                  return (
                    <div key={`${client.id}-${project.id}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{client.name} - {project.name}</h4>
                          <p className="text-sm text-gray-600">{groupHours} hours total</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            title="Select all entries for this project"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={() => handleGroupToggle(entries)}
                            className="h-4 w-4"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleGroupToggle(entries)}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                title={`Select time entry for ${new Date(entry.date).toLocaleDateString()}`}
                                checked={selectedEntries.includes(entry.id)}
                                onChange={() => handleEntryToggle(entry.id)}
                                className="h-4 w-4"
                              />
                              <span>{new Date(entry.date).toLocaleDateString()}</span>
                              <span>{entry.hours}h</span>
                              {entry.comment && (
                                <span className="text-gray-600 truncate max-w-32">
                                  - {entry.comment}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedEntries.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="client">Client</Label>
                    <select
                      id="client"
                      title="Select client"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
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
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={`Time entries - ${totalHours} hours`}
                    />
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700">
                      <strong>Summary:</strong>
                    </div>
                    <div className="text-sm text-blue-600">
                      {selectedEntries.length} entries • {totalHours} hours • {formatSEK(totalAmount)}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {selectedEntries.length > 0 && (
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Invoice Item'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
