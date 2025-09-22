# Invoicing System Specification

**Spec ID:** 008-A  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The Invoicing System provides comprehensive client billing, payment tracking, invoice generation, and automated tax calculations for consultant businesses. It integrates seamlessly with the Tax Automation System to ensure Swedish tax compliance and connects with Time Tracking for automated billing.

## Feature Requirements

### Functional Requirements

#### Core Invoicing Capabilities

##### Invoice Generation

- Professional invoice templates with company branding
- Automatic invoice numbering with customizable formats
- Multi-currency support with automatic conversion
- Line item management with quantities, rates, and descriptions
- Tax calculations (VAT/MOMS 25%, employer tax integration)
- Due date calculations based on client payment terms
- PDF generation with professional formatting

##### Client Billing Management

- Client-specific billing rates and terms
- Project-based billing with time tracking integration
- Recurring invoice automation for retainer clients
- Payment term management (Net 30, Net 15, etc.)
- Late payment fee calculations and automation
- Bulk invoicing for multiple clients/projects

##### Payment Tracking

- Payment status monitoring (Draft, Sent, Paid, Overdue)
- Payment recording with bank reconciliation
- Automated reminder system for overdue invoices
- Payment method tracking (bank transfer, card, etc.)
- Partial payment support with remaining balance calculations
- Cash flow impact analysis

### Technical Specifications

#### Data Models

```typescript
interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  project_id?: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  payment_terms: number; // Days
  
  // Financial details
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  exchange_rate?: number; // For non-SEK currencies
  
  // Payment tracking
  paid_amount: number;
  paid_date?: string;
  payment_method?: string;
  
  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  time_entry_ids?: string[]; // Link to time tracking entries
  created_at: string;
}

interface InvoiceTemplate {
  id: string;
  user_id: string;
  name: string;
  company_info: CompanyInfo;
  design_settings: InvoiceDesign;
  is_default: boolean;
  created_at: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  org_number: string;
  vat_number: string;
  email: string;
  phone: string;
  website?: string;
  logo_url?: string;
}

interface InvoiceDesign {
  primary_color: string;
  font_family: string;
  header_style: 'minimal' | 'standard' | 'detailed';
  footer_text?: string;
  show_payment_instructions: boolean;
}
```

#### Invoice Management Hook

```typescript
export const useInvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const createInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(invoiceData.user_id);
      
      // Calculate taxes
      const taxCalculations = calculateInvoiceTaxes(invoiceData.subtotal, invoiceData.vat_rate);
      
      const newInvoice = {
        ...invoiceData,
        invoice_number: invoiceNumber,
        vat_amount: taxCalculations.vat_amount,
        total_amount: taxCalculations.total_amount,
        paid_amount: 0,
        status: 'draft' as const
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select()
        .single();

      if (error) throw error;

      setInvoices(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInvoiceStatus = useCallback(async (
    invoiceId: string, 
    status: Invoice['status'],
    paymentData?: { amount: number; date: string; method: string }
  ) => {
    const updates: Partial<Invoice> = { status };
    
    if (paymentData && status === 'paid') {
      updates.paid_amount = paymentData.amount;
      updates.paid_date = paymentData.date;
      updates.payment_method = paymentData.method;
    }

    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId);

    if (error) throw error;

    // Update local state
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, ...updates } : inv
    ));

    // Create cash flow entry for payment
    if (status === 'paid' && paymentData) {
      await createCashFlowEntry({
        type: 'income',
        amount: paymentData.amount,
        date: paymentData.date,
        category: 'Client Payment',
        description: `Payment for invoice ${getInvoiceNumber(invoiceId)}`,
        source_type: 'invoice',
        source_id: invoiceId
      });
    }
  }, []);

  const generatePDF = useCallback(async (invoiceId: string) => {
    const invoice = await getInvoiceWithDetails(invoiceId);
    return await generateInvoicePDF(invoice);
  }, []);

  return {
    invoices,
    loading,
    selectedInvoice,
    setSelectedInvoice,
    createInvoice,
    updateInvoiceStatus,
    generatePDF,
    refreshInvoices: () => fetchInvoices()
  };
};
```

### User Interface Specifications

#### Invoice Dashboard

```typescript
const InvoiceDashboard = () => {
  const { invoices, loading } = useInvoiceManagement();
  const [filterStatus, setFilterStatus] = useState<Invoice['status'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
      const matchesSearch = searchTerm === '' || 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [invoices, filterStatus, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage client billing and payment tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link to="/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(calculateOutstanding(invoices))}
            </div>
            <p className="text-xs text-muted-foreground">
              {getOutstandingCount(invoices)} unpaid invoices
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(calculateMonthlyTotal(invoices))}
            </div>
            <p className="text-xs text-muted-foreground">
              {getMonthlyCount(invoices)} invoices
            </p>
          </CardContent>
        </Card>

        {/* Additional metric cards */}
      </div>

      {/* Filters and search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoice_number}
                </TableCell>
                <TableCell>{invoice.client?.name}</TableCell>
                <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                <TableCell>{formatDate(invoice.due_date)}</TableCell>
                <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-right">
                  <InvoiceActions invoice={invoice} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
```

#### Invoice Creation Form

```typescript
const InvoiceForm = () => {
  const { clients } = useClients();
  const { projects } = useProjects();
  const { createInvoice } = useInvoiceManagement();
  
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: '',
      project_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      payment_terms: 30,
      vat_rate: 0.25, // 25% Swedish VAT
      currency: 'SEK',
      items: []
    }
  });

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const invoice = await createInvoice(data);
      toast.success('Invoice created successfully');
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Invoice</CardTitle>
        <CardDescription>
          Generate a professional invoice for your client
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Client and project selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects
                          .filter(p => p.client_id === form.watch('client_id'))
                          .map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Invoice details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SEK">SEK</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Invoice items */}
            <InvoiceItemsList 
              control={form.control} 
              currency={form.watch('currency')}
            />

            {/* Tax summary */}
            <InvoiceTaxSummary 
              subtotal={calculateSubtotal(form.watch('items'))}
              vatRate={form.watch('vat_rate')}
              currency={form.watch('currency')}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/invoices">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
```

### Database Schema

#### Invoice Tables

```sql
-- Main invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_terms INTEGER DEFAULT 30,
  
  -- Financial details
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_rate DECIMAL(5,4) NOT NULL DEFAULT 0.25,
  vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'SEK',
  exchange_rate DECIMAL(10,6),
  
  -- Payment tracking
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_date DATE,
  payment_method TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link invoice items to time entries
CREATE TABLE invoice_item_time_entries (
  invoice_item_id UUID REFERENCES invoice_items(id) ON DELETE CASCADE,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  PRIMARY KEY (invoice_item_id, time_entry_id)
);

-- Invoice templates table
CREATE TABLE invoice_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_info JSONB NOT NULL,
  design_settings JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_client_date ON invoices(client_id, issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status IN ('sent', 'overdue');
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Unique constraint for invoice numbers per user
CREATE UNIQUE INDEX idx_invoices_user_number ON invoices(user_id, invoice_number);

-- Ensure only one default template per user
CREATE UNIQUE INDEX idx_templates_user_default ON invoice_templates(user_id) 
WHERE is_default = TRUE;
```

#### Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- Invoice policies
CREATE POLICY "Users can access own invoices" 
ON invoices FOR ALL 
USING (auth.uid() = user_id);

-- Invoice items policies (access through parent invoice)
CREATE POLICY "Users can access own invoice items" 
ON invoice_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  )
);

-- Template policies
CREATE POLICY "Users can access own templates" 
ON invoice_templates FOR ALL 
USING (auth.uid() = user_id);
```

### Business Logic

#### Invoice Number Generation

```typescript
const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const { data: lastInvoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .like('invoice_number', `${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastInvoice) {
    return `${year}-001`;
  }

  const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1]);
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
  
  return `${year}-${nextNumber}`;
};
```

#### Tax Calculations

```typescript
const calculateInvoiceTaxes = (subtotal: number, vatRate: number) => {
  const vatAmount = subtotal * vatRate;
  const totalAmount = subtotal + vatAmount;
  
  return {
    subtotal,
    vat_rate: vatRate,
    vat_amount: Number(vatAmount.toFixed(2)),
    total_amount: Number(totalAmount.toFixed(2))
  };
};

// Integration with Swedish tax system
const createTaxEntries = async (invoice: Invoice) => {
  if (invoice.status === 'paid' && invoice.vat_amount > 0) {
    // Create VAT entry for tax reporting
    await supabase.from('tax_entries').insert({
      user_id: invoice.user_id,
      type: 'vat_collected',
      amount: invoice.vat_amount,
      description: `VAT from invoice ${invoice.invoice_number}`,
      date: invoice.paid_date,
      source_type: 'invoice',
      source_id: invoice.id
    });
  }
};
```

#### Payment Processing

```typescript
const processPayment = async (
  invoiceId: string, 
  paymentData: PaymentData
) => {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (!invoice) throw new Error('Invoice not found');

  const isFullPayment = paymentData.amount >= invoice.total_amount;
  const newStatus = isFullPayment ? 'paid' : 'sent';

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      paid_amount: invoice.paid_amount + paymentData.amount,
      paid_date: isFullPayment ? paymentData.date : invoice.paid_date,
      payment_method: paymentData.method,
      status: newStatus
    })
    .eq('id', invoiceId);

  // Create cash flow entry
  await supabase.from('cash_flow_entries').insert({
    user_id: invoice.user_id,
    type: 'income',
    amount: paymentData.amount,
    date: paymentData.date,
    category: 'Client Payment',
    description: `Payment for invoice ${invoice.invoice_number}`,
    source_type: 'invoice',
    source_id: invoiceId,
    status: 'confirmed'
  });

  // Create tax entries if fully paid
  if (isFullPayment) {
    await createTaxEntries(invoice);
  }

  return { success: true, newStatus };
};
```

### PDF Generation

#### Invoice PDF Template

```typescript
import jsPDF from 'jspdf';

const generateInvoicePDF = async (invoice: InvoiceWithDetails): Promise<Blob> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  // Header with company info and logo
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - 40, 30, { align: 'right' });
  
  // Company information
  const companyInfo = await getUserCompanyInfo(invoice.user_id);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  let yPos = 50;
  pdf.text(companyInfo.name, 20, yPos);
  yPos += 5;
  pdf.text(companyInfo.address, 20, yPos);
  yPos += 5;
  pdf.text(`Org.nr: ${companyInfo.org_number}`, 20, yPos);
  yPos += 5;
  pdf.text(`VAT: ${companyInfo.vat_number}`, 20, yPos);

  // Invoice details
  pdf.setFont('helvetica', 'bold');
  pdf.text('Invoice Details', pageWidth - 80, 50);
  pdf.setFont('helvetica', 'normal');
  
  yPos = 60;
  pdf.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - 80, yPos);
  yPos += 7;
  pdf.text(`Issue Date: ${formatDate(invoice.issue_date)}`, pageWidth - 80, yPos);
  yPos += 7;
  pdf.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 80, yPos);

  // Client information
  yPos = 90;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bill To:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  
  yPos += 10;
  pdf.text(invoice.client.name, 20, yPos);
  yPos += 5;
  pdf.text(invoice.client.address, 20, yPos);
  if (invoice.client.org_number) {
    yPos += 5;
    pdf.text(`Org.nr: ${invoice.client.org_number}`, 20, yPos);
  }

  // Invoice items table
  yPos = 130;
  drawInvoiceItemsTable(pdf, invoice.items, yPos);

  // Total calculations
  const totalsY = yPos + (invoice.items.length * 10) + 20;
  drawInvoiceTotals(pdf, invoice, totalsY, pageWidth);

  // Payment instructions
  if (companyInfo.payment_instructions) {
    const instructionsY = totalsY + 40;
    pdf.setFontSize(10);
    pdf.text('Payment Instructions:', 20, instructionsY);
    pdf.text(companyInfo.payment_instructions, 20, instructionsY + 7);
  }

  return pdf.output('blob');
};

const drawInvoiceItemsTable = (
  pdf: jsPDF, 
  items: InvoiceItem[], 
  startY: number
) => {
  const headers = ['Description', 'Qty', 'Rate', 'Amount'];
  const columnWidths = [100, 20, 30, 30];
  const startX = 20;
  
  // Table headers
  pdf.setFont('helvetica', 'bold');
  pdf.setFillColor(240, 240, 240);
  pdf.rect(startX, startY, 180, 8, 'F');
  
  let xPos = startX + 2;
  headers.forEach((header, index) => {
    pdf.text(header, xPos, startY + 5);
    xPos += columnWidths[index];
  });

  // Table rows
  pdf.setFont('helvetica', 'normal');
  let yPos = startY + 12;
  
  items.forEach((item) => {
    xPos = startX + 2;
    pdf.text(item.description, xPos, yPos);
    xPos += columnWidths[0];
    
    pdf.text(item.quantity.toString(), xPos, yPos);
    xPos += columnWidths[1];
    
    pdf.text(formatCurrency(item.unit_price), xPos, yPos);
    xPos += columnWidths[2];
    
    pdf.text(formatCurrency(item.total_price), xPos, yPos);
    
    yPos += 10;
  });
};

const drawInvoiceTotals = (
  pdf: jsPDF, 
  invoice: Invoice, 
  startY: number, 
  pageWidth: number
) => {
  const rightAlign = pageWidth - 20;
  let yPos = startY;

  // Subtotal
  pdf.text('Subtotal:', rightAlign - 60, yPos);
  pdf.text(formatCurrency(invoice.subtotal), rightAlign, yPos, { align: 'right' });
  yPos += 7;

  // VAT
  pdf.text(`VAT (${(invoice.vat_rate * 100).toFixed(0)}%):`, rightAlign - 60, yPos);
  pdf.text(formatCurrency(invoice.vat_amount), rightAlign, yPos, { align: 'right' });
  yPos += 7;

  // Total
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total:', rightAlign - 60, yPos);
  pdf.text(formatCurrency(invoice.total_amount), rightAlign, yPos, { align: 'right' });
};
```

### Integration with Other Systems

#### Time Tracking Integration

```typescript
const createInvoiceFromTimeEntries = async (
  clientId: string,
  projectId: string,
  timeEntryIds: string[],
  hourlyRate: number
) => {
  // Fetch time entries
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('*')
    .in('id', timeEntryIds)
    .eq('status', 'approved');

  if (!timeEntries?.length) {
    throw new Error('No approved time entries found');
  }

  // Group by description/task
  const groupedEntries = groupBy(timeEntries, 'description');
  
  const invoiceItems = Object.entries(groupedEntries).map(([description, entries]) => {
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    
    return {
      description,
      quantity: totalHours,
      unit_price: hourlyRate,
      total_price: totalHours * hourlyRate,
      time_entry_ids: entries.map(e => e.id)
    };
  });

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total_price, 0);

  // Create invoice
  const invoice = await createInvoice({
    client_id: clientId,
    project_id: projectId,
    subtotal,
    items: invoiceItems
  });

  // Mark time entries as billed
  await supabase
    .from('time_entries')
    .update({ 
      status: 'billed',
      invoice_id: invoice.id 
    })
    .in('id', timeEntryIds);

  return invoice;
};
```

#### Tax System Integration

```typescript
// Automatic tax calculations when invoice is paid
const handleInvoicePayment = async (invoiceId: string, paymentDate: string) => {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, client:clients(*)')
    .eq('id', invoiceId)
    .single();

  if (!invoice) return;

  // Create VAT entry
  if (invoice.vat_amount > 0) {
    await supabase.from('tax_calculations').insert({
      user_id: invoice.user_id,
      year: new Date(paymentDate).getFullYear(),
      quarter: getQuarter(paymentDate),
      type: 'vat_collected',
      amount: invoice.vat_amount,
      description: `VAT from invoice ${invoice.invoice_number}`,
      source_type: 'invoice',
      source_id: invoice.id
    });
  }

  // Trigger income tax calculation update
  await recalculateIncomeTax(invoice.user_id, new Date(paymentDate).getFullYear());
};
```

### Performance Optimizations

#### Pagination and Filtering

```typescript
const useInvoicePagination = (pageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<InvoiceFilters>({});

  const fetchInvoices = useCallback(async () => {
    const offset = (currentPage - 1) * pageSize;
    
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(name, email),
        project:projects(name)
      `, { count: 'exact' })
      .eq('user_id', getCurrentUserId())
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters.date_from) {
      query = query.gte('issue_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('issue_date', filters.date_to);
    }

    const { data, count, error } = await query;
    
    if (error) throw error;
    
    setTotalCount(count || 0);
    return data;
  }, [currentPage, pageSize, filters]);

  return {
    currentPage,
    setCurrentPage,
    totalCount,
    filters,
    setFilters,
    fetchInvoices,
    totalPages: Math.ceil(totalCount / pageSize)
  };
};
```

### Testing Requirements

#### Unit Tests

```typescript
describe('Invoice Management', () => {
  it('generates correct invoice numbers');
  it('calculates taxes properly');
  it('handles payment processing');
  it('creates cash flow entries on payment');
  it('integrates with time tracking');
});

describe('Invoice PDF Generation', () => {
  it('generates properly formatted PDFs');
  it('includes all required information');
  it('handles multiple currencies');
  it('applies correct tax calculations');
});
```

#### Integration Tests

```typescript
describe('Invoice System Integration', () => {
  it('creates invoices from time entries');
  it('updates cash flow on payment');
  it('triggers tax calculations');
  it('handles recurring invoice automation');
});
```

---

This specification ensures the Invoicing System provides comprehensive billing capabilities while maintaining integration with tax automation, time tracking, and cash flow management systems.