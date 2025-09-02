/**
 * Test file to demonstrate the plain text export functionality
 * This would normally be run in a test environment
 */

import { fortnoxService } from '../src/lib/fortnox';
import type { InvoiceItem } from '../src/types/invoice';

// Sample invoice items for testing
const sampleInvoiceItems: InvoiceItem[] = [
  {
    id: '1',
    user_id: 'test-user',
    client_id: 'client-1',
    project_id: 'project-1',
    description: 'Web development - Frontend React components',
    hours: 8.5,
    hourly_rate: 800,
    fixed_amount: null,
    total_amount: 6800,
    currency: 'SEK',
    invoice_date: '2025-08-29',
    due_date: '2025-09-28',
    status: 'draft',
    notes: 'Implemented user authentication and dashboard layout',
    created_at: '2025-08-29T10:00:00Z',
    updated_at: '2025-08-29T10:00:00Z'
  },
  {
    id: '2',
    user_id: 'test-user',
    client_id: 'client-1',
    project_id: 'project-1',
    description: 'Database optimization and API improvements',
    hours: 4.0,
    hourly_rate: 800,
    fixed_amount: null,
    total_amount: 3200,
    currency: 'SEK',
    invoice_date: '2025-08-29',
    due_date: '2025-09-28',
    status: 'draft',
    notes: 'Optimized queries and improved response times',
    created_at: '2025-08-29T14:00:00Z',
    updated_at: '2025-08-29T14:00:00Z'
  },
  {
    id: '3',
    user_id: 'test-user',
    client_id: 'client-1',
    project_id: 'project-2',
    description: 'Project setup and documentation',
    hours: null,
    hourly_rate: null,
    fixed_amount: 5000,
    total_amount: 5000,
    currency: 'SEK',
    invoice_date: '2025-08-29',
    due_date: '2025-09-28',
    status: 'draft',
    notes: 'Initial project setup, documentation, and planning',
    created_at: '2025-08-29T16:00:00Z',
    updated_at: '2025-08-29T16:00:00Z'
  }
];

// Test function to generate plain text invoice
function testPlainTextExport() {
  console.log('Testing Plain Text Export Function');
  console.log('===================================\n');
  
  const result = fortnoxService.generatePlainTextInvoice(
    sampleInvoiceItems,
    'Tech Solutions AB',
    'contact@techsolutions.se',
    'Tech Solutions AB',
    'INV-2025-001'
  );
  
  console.log(result);
  console.log('\n===================================');
  console.log('Test completed successfully!');
}

// Example of how the function would be called in the application
function exampleUsage() {
  console.log('\nExample Usage:');
  console.log('==============');
  console.log('// In your component:');
  console.log('fortnoxService.downloadPlainTextInvoice(');
  console.log('  selectedInvoiceItems,');
  console.log('  clientName,');
  console.log('  clientEmail,');
  console.log('  clientCompany,');
  console.log('  invoiceNumber');
  console.log(');');
  console.log('\n// This will download a .txt file with readable invoice data');
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testPlainTextExport();
  exampleUsage();
}

export { testPlainTextExport, exampleUsage, sampleInvoiceItems };
