export interface InvoiceItem {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  description: string;
  hours: number | null; // for hourly items
  hourly_rate: number | null; // hourly rate
  fixed_amount: number | null; // for fixed price items
  total_amount: number; // calculated total
  currency: string;
  invoice_date: string;
  due_date: string | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceItemData {
  client_id: string;
  project_id: string;
  description: string;
  quantity: number; // hours for hourly, 1 for fixed
  rate: number; // hourly rate or fixed amount
  type: 'hourly' | 'fixed';
  date: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

export interface UpdateInvoiceItemData extends Partial<CreateInvoiceItemData> {
  id: string;
}

export interface InvoiceSummary {
  totalUnbilled: number;
  totalDraft: number;
  totalSent: number;
  totalPaid: number;
  itemCount: number;
  clientCount: number;
}

export interface ClientInvoiceSummary {
  client_id: string;
  client_name: string;
  company?: string;
  totalUnbilled: number;
  totalDraft: number;
  totalSent: number;
  totalPaid: number;
  itemCount: number;
  projectCount: number;
  lastActivity: string;
}

export interface ProjectInvoiceSummary {
  project_id: string;
  project_name: string;
  client_id: string;
  client_name: string;
  totalUnbilled: number;
  totalDraft: number;
  totalSent: number;
  totalPaid: number;
  itemCount: number;
  totalHours: number;
  averageRate: number;
  lastActivity: string;
}
