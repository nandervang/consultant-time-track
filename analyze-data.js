// Quick analysis of the provided data
const cashFlowData = require('./cash_flow_entries_rows (2).json');
const invoiceData = require('./invoice_items_rows (2).json');

console.log('=== CASH FLOW ENTRIES ANALYSIS ===');
console.log('Total entries:', cashFlowData.length);

// Analyze budget entries
const budgetEntries = cashFlowData.filter(entry => entry.is_budget_entry === true);
console.log('Budget entries:', budgetEntries.length);
budgetEntries.forEach(entry => {
  console.log(`- ${entry.description}: ${entry.amount} (recurring: ${entry.is_recurring})`);
});

// Analyze manual entries (non-budget, non-generated)
const manualEntries = cashFlowData.filter(entry => 
  entry.is_budget_entry !== true && 
  !entry.description?.toLowerCase().includes('budget')
);
console.log('Manual entries:', manualEntries.length);

// Analyze recurring entries
const recurringEntries = cashFlowData.filter(entry => entry.is_recurring === true);
console.log('Recurring entries:', recurringEntries.length);

console.log('\n=== INVOICE ITEMS ANALYSIS ===');
console.log('Total invoices:', invoiceData.length);

// Analyze by status
const statusBreakdown = {};
invoiceData.forEach(inv => {
  statusBreakdown[inv.status] = (statusBreakdown[inv.status] || 0) + 1;
});
console.log('Status breakdown:', statusBreakdown);

// Analyze invoices with due dates
const invoicesWithDueDates = invoiceData.filter(inv => inv.due_date !== null);
console.log('Invoices with due dates:', invoicesWithDueDates.length);

// Analyze invoices that should be included (sent/overdue/paid)
const includableInvoices = invoiceData.filter(inv => 
  ['sent', 'overdue', 'paid'].includes(inv.status) && inv.due_date !== null
);
console.log('Invoices that should be included in cash flow:', includableInvoices.length);