import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useModalContext } from '@/contexts/ModalContext';
import { InvoiceSummaryCards } from '@/components/invoicing/InvoiceSummaryCards';
import { ClientOverviewCard } from '@/components/invoicing/ClientOverviewCard';
import { RecentInvoiceItems } from '@/components/invoicing/RecentInvoiceItems';
import { QuickActionsCard } from '@/components/invoicing/QuickActionsCard';
import { MonthlyRevenueChart } from '@/components/invoicing/MonthlyRevenueChart';
import { CreateInvoiceItemDialog } from '@/components/invoicing/CreateInvoiceItemDialog';
import { TimeEntryToInvoiceDialog } from '@/components/invoicing/TimeEntryToInvoiceDialog';
import { FortnoxExportDialog } from '@/components/invoicing/FortnoxExportDialog';
import { PlainTextExportDialog } from '@/components/invoicing/PlainTextExportDialog';
import { ClientDetailDialog } from '@/components/invoicing/ClientDetailDialog';
import { MarkAsInvoicedDialog } from '@/components/invoicing/MarkAsInvoicedDialog';
import { MarkAsPaidDialog } from '@/components/invoicing/MarkAsPaidDialog';

export default function InvoicingPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useState(false);
  const [fortnoxDialogOpen, setFortnoxDialogOpen] = useState(false);
  const [plainTextDialogOpen, setPlainTextDialogOpen] = useState(false);
  const [clientDetailDialogOpen, setClientDetailDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [markAsInvoicedDialogOpen, setMarkAsInvoicedDialogOpen] = useState(false);
  const [markAsPaidDialogOpen, setMarkAsPaidDialogOpen] = useState(false);
  
  const modalContext = useModalContext();
  
  const { 
    invoiceItems, 
    loading: invoicesLoading, 
    getInvoiceSummary, 
    getClientSummaries 
  } = useInvoices();
  
  const { clients, loading: clientsLoading } = useClients();
  const { projects, loading: projectsLoading } = useProjects();

  // Connect modal context to local state
  useEffect(() => {
    if (modalContext.invoiceModalOpen) {
      setCreateDialogOpen(true);
      modalContext.setInvoiceModalOpen(false);
    }
  }, [modalContext.invoiceModalOpen, modalContext]);

  const loading = invoicesLoading || clientsLoading || projectsLoading;
  const summary = getInvoiceSummary();
  const clientSummaries = getClientSummaries();

  const handleCreateInvoiceItem = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateFromTime = () => {
    setTimeEntryDialogOpen(true);
  };

  const handleMarkAsInvoiced = () => {
    setMarkAsInvoicedDialogOpen(true);
  };

  const handleMarkAsPaid = () => {
    setMarkAsPaidDialogOpen(true);
  };

  const handleExportToFortnox = () => {
    setFortnoxDialogOpen(true);
  };

  const handleExportPlainText = () => {
    setPlainTextDialogOpen(true);
  };

  const handleClientClick = (clientId: string) => {
    setSelectedClientId(clientId);
    setClientDetailDialogOpen(true);
  };

  const handleItemClick = (itemId: string) => {
    // TODO: Open edit dialog for invoice item
    console.log('Item clicked:', itemId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoicing</h1>
          <p className="text-gray-600 mt-1">
            Track unbilled work and manage invoice items for clients and projects
          </p>
        </div>
        <Button onClick={handleCreateInvoiceItem} className="sm:w-auto w-full">
          <Plus className="h-4 w-4 mr-2" />
          New Invoice Item
        </Button>
      </div>

      {/* Summary Cards */}
      <InvoiceSummaryCards summary={summary} loading={loading} />

      {/* Quick Actions Row */}
      <div className="w-full">
        <QuickActionsCard
          onCreateInvoiceItem={handleCreateInvoiceItem}
          onCreateFromTime={handleCreateFromTime}
          onMarkAsInvoiced={handleMarkAsInvoiced}
          onMarkAsPaid={handleMarkAsPaid}
          onExportToFortnox={handleExportToFortnox}
          onExportPlainText={handleExportPlainText}
        />
      </div>

      {/* Main Content Grid - 50/50 split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        {/* Client Overview - Takes 50% on large screens */}
        <div className="lg:col-span-1">
          <ClientOverviewCard
            clients={clientSummaries}
            loading={loading}
            onClientClick={handleClientClick}
          />
        </div>

        {/* Recent Items - Takes 50% on large screens */}
        <div className="lg:col-span-1">
          <RecentInvoiceItems
            items={invoiceItems}
            loading={loading}
            onItemClick={handleItemClick}
            clients={clients}
            projects={projects}
          />
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="grid grid-cols-1 min-h-[400px]">
        <MonthlyRevenueChart items={invoiceItems} loading={loading} />
      </div>

      {/* Empty State for New Users */}
      {!loading && invoiceItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoice items yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start tracking your unbilled work by creating invoice items for your clients and projects. 
              You can create items manually or convert time entries into billable items.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleCreateInvoiceItem}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Invoice Item
              </Button>
              <Button variant="outline" onClick={handleCreateFromTime}>
                <Clock className="h-4 w-4 mr-2" />
                Import from Time Tracking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Dialogs */}
      <CreateInvoiceItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <TimeEntryToInvoiceDialog
        open={timeEntryDialogOpen}
        onOpenChange={setTimeEntryDialogOpen}
      />
      <FortnoxExportDialog
        open={fortnoxDialogOpen}
        onOpenChange={setFortnoxDialogOpen}
      />
      <PlainTextExportDialog
        open={plainTextDialogOpen}
        onOpenChange={setPlainTextDialogOpen}
      />
      <ClientDetailDialog
        open={clientDetailDialogOpen}
        onOpenChange={setClientDetailDialogOpen}
        clientId={selectedClientId}
      />
      <MarkAsInvoicedDialog
        open={markAsInvoicedDialogOpen}
        onOpenChange={setMarkAsInvoicedDialogOpen}
      />
      <MarkAsPaidDialog
        open={markAsPaidDialogOpen}
        onOpenChange={setMarkAsPaidDialogOpen}
      />
    </div>
  );
}
