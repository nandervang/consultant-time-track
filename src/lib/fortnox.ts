/**
 * Fortnox API integration for exporting invoices
 * https://developer.fortnox.se/
 */

import { InvoiceItem } from '../types/invoice';

export interface FortnoxConfig {
  accessToken: string;
  clientSecret: string;
  baseUrl?: string;
}

export interface FortnoxCustomer {
  CustomerNumber?: string;
  Name: string;
  Email?: string;
  Phone?: string;
  Address1?: string;
  Address2?: string;
  ZipCode?: string;
  City?: string;
  Country?: string;
  OrganisationNumber?: string;
}

export interface FortnoxInvoiceRow {
  ArticleNumber?: string;
  Description: string;
  Price: number;
  Quantity?: number;
  Unit?: string;
  VAT?: number;
}

export interface FortnoxInvoice {
  CustomerNumber: string;
  InvoiceDate: string;
  DueDate?: string;
  Currency: string;
  Language?: string;
  InvoiceRows: FortnoxInvoiceRow[];
  Remarks?: string;
}

export interface FortnoxExportResult {
  success: boolean;
  invoiceNumber?: string;
  documentNumber?: string;
  error?: string;
}

class FortnoxService {
  private config: FortnoxConfig | null = null;

  configure(config: FortnoxConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.fortnox.se/3',
    };
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: Record<string, unknown>) {
    if (!this.config) {
      throw new Error('Fortnox service not configured. Please set API credentials.');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Access-Token': this.config.accessToken,
      'Client-Secret': this.config.clientSecret,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Fortnox API error (${response.status}): ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fortnox API request failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/companyinformation');
      return true;
    } catch (error) {
      console.error('Fortnox connection test failed:', error);
      return false;
    }
  }

  async getCustomers(): Promise<FortnoxCustomer[]> {
    try {
      const response = await this.makeRequest('/customers');
      return response.Customers || [];
    } catch (error) {
      console.error('Failed to fetch Fortnox customers:', error);
      return [];
    }
  }

  async createCustomer(customer: FortnoxCustomer): Promise<FortnoxCustomer | null> {
    try {
      const response = await this.makeRequest('/customers', 'POST', { Customer: customer });
      return response.Customer || null;
    } catch (error) {
      console.error('Failed to create Fortnox customer:', error);
      return null;
    }
  }

  async findOrCreateCustomer(
    clientName: string, 
    clientEmail?: string, 
    clientCompany?: string
  ): Promise<string | null> {
    try {
      // First, try to find existing customer
      const customers = await this.getCustomers();
      const existingCustomer = customers.find(
        c => c.Name === clientName || c.Name === clientCompany
      );

      if (existingCustomer && existingCustomer.CustomerNumber) {
        return existingCustomer.CustomerNumber;
      }

      // Create new customer if not found
      const newCustomer: FortnoxCustomer = {
        Name: clientCompany || clientName,
        Email: clientEmail,
      };

      const createdCustomer = await this.createCustomer(newCustomer);
      return createdCustomer?.CustomerNumber || null;
    } catch (error) {
      console.error('Failed to find or create customer:', error);
      return null;
    }
  }

  async createInvoice(invoice: FortnoxInvoice): Promise<FortnoxExportResult> {
    try {
      const response = await this.makeRequest('/invoices', 'POST', { Invoice: invoice });
      
      if (response.Invoice) {
        return {
          success: true,
          invoiceNumber: response.Invoice.InvoiceNumber,
          documentNumber: response.Invoice.DocumentNumber,
        };
      }

      return {
        success: false,
        error: 'No invoice data returned from Fortnox',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  convertInvoiceItemsToFortnox(
    items: InvoiceItem[],
    customerNumber: string,
    clientName: string
  ): FortnoxInvoice {
    const invoiceRows: FortnoxInvoiceRow[] = items.map(item => ({
      Description: item.description,
      Price: item.hourly_rate || item.fixed_amount || 0,
      Quantity: item.hours || 1,
      Unit: item.hours ? 'h' : 'st',
      VAT: 25, // Default Swedish VAT rate
    }));

    const invoiceDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now

    return {
      CustomerNumber: customerNumber,
      InvoiceDate: invoiceDate,
      DueDate: dueDate,
      Currency: 'SEK',
      Language: 'SV',
      InvoiceRows: invoiceRows,
      Remarks: `Exported from consultant time tracker - ${items.length} items for ${clientName}`,
    };
  }

  async exportInvoiceItems(
    items: InvoiceItem[],
    clientName: string,
    clientEmail?: string,
    clientCompany?: string
  ): Promise<FortnoxExportResult> {
    try {
      if (!this.config) {
        return {
          success: false,
          error: 'Fortnox service not configured',
        };
      }

      if (items.length === 0) {
        return {
          success: false,
          error: 'No invoice items to export',
        };
      }

      // Find or create customer
      const customerNumber = await this.findOrCreateCustomer(clientName, clientEmail, clientCompany);
      
      if (!customerNumber) {
        return {
          success: false,
          error: 'Failed to find or create customer in Fortnox',
        };
      }

      // Convert items to Fortnox format
      const fortnoxInvoice = this.convertInvoiceItemsToFortnox(items, customerNumber, clientName);

      // Create invoice in Fortnox
      const result = await this.createInvoice(fortnoxInvoice);

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Generate a plain text invoice format suitable for manual invoice creation
   */
  generatePlainTextInvoice(
    items: InvoiceItem[],
    clientName: string,
    clientEmail?: string,
    clientCompany?: string,
    invoiceNumber?: string
  ): string {
    if (items.length === 0) {
      return 'No items to export';
    }

    const invoiceDate = new Date().toLocaleDateString('sv-SE');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE');
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total_amount, 0);
    const vatRate = 0.25; // 25% Swedish VAT
    const vatAmount = subtotal * vatRate;
    const totalAmount = subtotal + vatAmount;

    // Format currency values
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        minimumFractionDigits: 2
      }).format(amount);
    };

    let text = '';
    
    // Header
    text += '='.repeat(60) + '\n';
    text += '                         FAKTURA\n';
    text += '='.repeat(60) + '\n\n';

    // Invoice details
    text += `Fakturanummer: ${invoiceNumber || 'XXXX'}\n`;
    text += `Fakturadatum: ${invoiceDate}\n`;
    text += `Förfallodatum: ${dueDate}\n`;
    text += `Valuta: SEK\n\n`;

    // Client information
    text += 'KUND:\n';
    text += '-'.repeat(20) + '\n';
    if (clientCompany) {
      text += `Företag: ${clientCompany}\n`;
    }
    text += `Namn: ${clientName}\n`;
    if (clientEmail) {
      text += `E-post: ${clientEmail}\n`;
    }
    text += '\n';

    // Invoice items
    text += 'FAKTURARADER:\n';
    text += '-'.repeat(60) + '\n';
    text += `${'Beskrivning'.padEnd(30)} ${'Tim/Ant'.padStart(8)} ${'Pris'.padStart(10)} ${'Summa'.padStart(10)}\n`;
    text += '-'.repeat(60) + '\n';

    items.forEach(item => {
      const description = item.description.length > 28 
        ? item.description.substring(0, 25) + '...' 
        : item.description;
      
      let quantity: string;
      let rate: string;
      
      if (item.hours && item.hourly_rate) {
        quantity = item.hours.toFixed(2);
        rate = formatCurrency(item.hourly_rate);
      } else {
        quantity = '1.00';
        rate = formatCurrency(item.fixed_amount || 0);
      }
      
      const total = formatCurrency(item.total_amount);
      
      text += `${description.padEnd(30)} ${quantity.padStart(8)} ${rate.padStart(10)} ${total.padStart(10)}\n`;
    });

    text += '-'.repeat(60) + '\n';

    // Totals
    text += '\nSUMMERING:\n';
    text += '-'.repeat(30) + '\n';
    text += `Summa exkl. moms: ${formatCurrency(subtotal).padStart(15)}\n`;
    text += `Moms (25%): ${formatCurrency(vatAmount).padStart(21)}\n`;
    text += `TOTALT: ${formatCurrency(totalAmount).padStart(23)}\n\n`;

    // Additional information
    text += 'BETALNINGSINFORMATION:\n';
    text += '-'.repeat(30) + '\n';
    text += 'Betalningsvillkor: 30 dagar\n';
    text += 'Dröjsmålsränta: 2% per månad\n\n';

    // Footer with detailed item descriptions
    if (items.some(item => item.description.length > 28 || item.notes)) {
      text += 'DETALJERADE BESKRIVNINGAR:\n';
      text += '-'.repeat(40) + '\n';
      items.forEach((item, index) => {
        text += `${index + 1}. ${item.description}\n`;
        if (item.notes) {
          text += `   Anteckningar: ${item.notes}\n`;
        }
        if (item.hours && item.hourly_rate) {
          text += `   ${item.hours} timmar à ${formatCurrency(item.hourly_rate)}\n`;
        }
        text += '\n';
      });
    }

    text += 'Exporterad från Konsult Tid System - ' + new Date().toLocaleString('sv-SE') + '\n';
    text += '='.repeat(60);

    return text;
  }

  /**
   * Download plain text invoice as a text file
   */
  downloadPlainTextInvoice(
    items: InvoiceItem[],
    clientName: string,
    clientEmail?: string,
    clientCompany?: string,
    invoiceNumber?: string
  ): void {
    const textContent = this.generatePlainTextInvoice(
      items, 
      clientName, 
      clientEmail, 
      clientCompany, 
      invoiceNumber
    );

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `faktura_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

export const fortnoxService = new FortnoxService();

// Helper function to validate Fortnox configuration
export function validateFortnoxConfig(config: Partial<FortnoxConfig>): config is FortnoxConfig {
  return !!(config.accessToken && config.clientSecret);
}

// Helper function to get stored Fortnox configuration
export function getStoredFortnoxConfig(): FortnoxConfig | null {
  try {
    const stored = localStorage.getItem('fortnox_config');
    if (!stored) return null;

    const config = JSON.parse(stored);
    return validateFortnoxConfig(config) ? config : null;
  } catch {
    return null;
  }
}

// Helper function to store Fortnox configuration
export function storeFortnoxConfig(config: FortnoxConfig): void {
  localStorage.setItem('fortnox_config', JSON.stringify(config));
}

// Helper function to clear stored configuration
export function clearFortnoxConfig(): void {
  localStorage.removeItem('fortnox_config');
}
