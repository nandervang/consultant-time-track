import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, Clock } from 'lucide-react';
import { useState } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { InvoiceSummaryCards } from '@/components/invoicing/InvoiceSummaryCards';
import { ClientOverviewCard } from '@/components/invoicing/ClientOverviewCard';
import { RecentInvoiceItems } from '@/components/invoicing/RecentInvoiceItems';
import { QuickActionsCard } from '@/components/invoicing/QuickActionsCard';
import { MonthlyRevenueChart } from '@/components/invoicing/MonthlyRevenueChart';
import { CreateInvoiceItemDialog } from '@/components/invoicing/CreateInvoiceItemDialog';
import { TimeEntryToInvoiceDialog } from '@/components/invoicing/TimeEntryToInvoiceDialog';
import { FortnoxExportDialog } from '@/components/invoicing/FortnoxExportDialog';
import { PlainTextExportDialog } from '@/components/invoicing/PlainTextExportDialog';

export default function InvoicingPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useState(false);
  const [fortnoxDialogOpen, setFortnoxDialogOpen] = useState(false);
  const [plainTextDialogOpen, setPlainTextDialogOpen] = useState(false);
  
  const { 
    invoiceItems, 
    loading: invoicesLoading, 
    getInvoiceSummary, 
    getClientSummaries 
  } = useInvoices();
  
  const { clients, loading: clientsLoading } = useClients();
  const { projects, loading: projectsLoading } = useProjects();

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
    // TODO: Open dialog to mark items as invoiced
    console.log('Mark as invoiced');
  };

  const handleMarkAsPaid = () => {
    // TODO: Open dialog to mark items as paid
    console.log('Mark as paid');
  };

  const handleExportToFortnox = () => {
    setFortnoxDialogOpen(true);
  };

  const handleExportPlainText = () => {
    setPlainTextDialogOpen(true);
  };

  const handleClientClick = (clientId: string) => {
    // TODO: Navigate to client detail view or open modal
    console.log('Client clicked:', clientId);
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Client Overview */}
        <ClientOverviewCard
          clients={clientSummaries}
          loading={loading}
          onClientClick={handleClientClick}
        />

        {/* Recent Items */}
        <RecentInvoiceItems
          items={invoiceItems}
          loading={loading}
          onItemClick={handleItemClick}
          clients={clients}
          projects={projects}
        />

        {/* Quick Actions */}
        <QuickActionsCard
          onCreateInvoiceItem={handleCreateInvoiceItem}
          onCreateFromTime={handleCreateFromTime}
          onMarkAsInvoiced={handleMarkAsInvoiced}
          onMarkAsPaid={handleMarkAsPaid}
          onExportToFortnox={handleExportToFortnox}
          onExportPlainText={handleExportPlainText}
        />
      </div>

      {/* Monthly Revenue Chart */}
      <div className="grid grid-cols-1">
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
    </div>
  );
}
