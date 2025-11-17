import { useMemo } from 'react';
import { useTimeEntries } from './useTimeEntries';
import { useInvoices } from './useInvoices';
import { useCashFlow } from './useCashFlow';
import { useProjects } from './useProjects';
import { useAuth } from './useAuth';

export interface ProjectionScenario {
  conservative: number;
  realistic: number;
  optimistic: number;
}

export interface MonthProjection {
  month: string;
  monthName: string;
  conservative: number;
  realistic: number;
  optimistic: number;
  isProjection: boolean;
  details: {
    recurringIncome: number;
    expectedInvoices: number;
    unbilledHoursValue: number;
    projectedExpenses: number;
  };
}

export interface CashFlowInsights {
  unbilledHoursValue: number;
  unbilledHoursCount: number;
  pendingInvoicesValue: number;
  pendingInvoicesCount: number;
  averageMonthlyRevenue: number;
  averageMonthlyExpenses: number;
  growthRate: number;
  cashRunway: number;
}

export function useCashFlowProjections() {
  const { user } = useAuth();
  const { entries: timeEntries } = useTimeEntries();
  const { invoiceItems } = useInvoices(user?.id);
  const { entries: cashFlowEntries } = useCashFlow(user?.id || null);
  const { projects } = useProjects();

  // Calculate insights and projections
  const { insights, projections, currentBalance } = useMemo(() => {
    // 1. CALCULATE UNBILLED HOURS VALUE
    const unbilledTimeEntries = timeEntries.filter(entry => {
      // Check if this time entry has been invoiced
      const hasInvoice = invoiceItems.some(invoice => 
        invoice.project_id === entry.project_id &&
        invoice.invoice_date >= entry.date
      );
      return !hasInvoice;
    });

    const unbilledHoursValue = unbilledTimeEntries.reduce((sum, entry) => {
      const project = projects.find(p => p.id === entry.project_id);
      const hourlyRate = project?.hourly_rate || 850; // Default rate
      return sum + (entry.hours * hourlyRate);
    }, 0);

    const unbilledHoursCount = unbilledTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);

    // 2. CALCULATE PENDING INVOICES (sent but not paid)
    const pendingInvoices = invoiceItems.filter(invoice => 
      invoice.status === 'sent' || invoice.status === 'overdue'
    );

    const pendingInvoicesValue = pendingInvoices.reduce((sum, invoice) => 
      sum + invoice.total_amount, 0
    );

    // 3. CALCULATE RECURRING INCOME (from cash flow entries)
    const recurringIncomeEntries = cashFlowEntries.filter(entry => 
      entry.type === 'income' && 
      entry.is_recurring === true &&
      entry.is_budget_entry === false
    );

    const monthlyRecurringIncome = recurringIncomeEntries.reduce((sum, entry) => 
      sum + entry.amount, 0
    );

    // 4. HISTORICAL DATA (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const historicalInvoices = invoiceItems.filter(invoice => 
      invoice.status === 'paid' && 
      new Date(invoice.invoice_date) >= sixMonthsAgo
    );

    const monthlyRevenues = new Map<string, number>();
    historicalInvoices.forEach(invoice => {
      const month = invoice.invoice_date.slice(0, 7);
      monthlyRevenues.set(month, (monthlyRevenues.get(month) || 0) + invoice.total_amount);
    });

    const revenueValues = Array.from(monthlyRevenues.values());
    const averageMonthlyRevenue = revenueValues.length > 0 
      ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length 
      : 0;

    // 5. CALCULATE AVERAGE EXPENSES
    const historicalExpenses = cashFlowEntries.filter(entry => 
      entry.type === 'expense' &&
      entry.is_budget_entry === false &&
      new Date(entry.date) >= sixMonthsAgo
    );

    const monthlyExpenses = new Map<string, number>();
    historicalExpenses.forEach(expense => {
      const month = expense.date.slice(0, 7);
      monthlyExpenses.set(month, (monthlyExpenses.get(month) || 0) + expense.amount);
    });

    const expenseValues = Array.from(monthlyExpenses.values());
    const averageMonthlyExpenses = expenseValues.length > 0
      ? expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length
      : 0;

    // 6. CALCULATE GROWTH RATE (from revenue trend)
    let growthRate = 0;
    if (revenueValues.length >= 2) {
      const recent = revenueValues.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, revenueValues.length);
      const older = revenueValues.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, revenueValues.length);
      if (older > 0) {
        growthRate = ((recent - older) / older) * 100;
      }
    }

    // 7. CALCULATE CURRENT BALANCE
    const totalIncome = cashFlowEntries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpenses = cashFlowEntries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const currentBalance = totalIncome - totalExpenses + 50000; // Starting balance

    // 8. CALCULATE CASH RUNWAY
    const cashRunway = averageMonthlyExpenses > 0 
      ? Math.floor(currentBalance / averageMonthlyExpenses)
      : 12;

    // 9. BUILD PROJECTIONS (6 months forward)
    const projections: MonthProjection[] = [];
    const today = new Date();
    
    // Start from current month (not next month)
    for (let i = 0; i < 6; i++) {
      const projectionDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = projectionDate.toISOString().slice(0, 7);
      const monthName = projectionDate.toLocaleDateString('en-US', { month: 'short' });
      
      // First month is current (partial), rest are projections
      const isProjection = i > 0;
      
      // Base income components
      const recurringIncome = monthlyRecurringIncome;
      
      // Expected invoices (pending invoices with due dates in this month)
      const expectedInvoices = pendingInvoices
        .filter(inv => {
          if (!inv.due_date) return false;
          const dueMonth = inv.due_date.slice(0, 7);
          return dueMonth === monthKey;
        })
        .reduce((sum, inv) => sum + inv.total_amount, 0);
      
      // Unbilled hours conversion (phased over 3 months)
      const unbilledContribution = i < 3 ? (unbilledHoursValue / 3) : 0;
      
      // Historical baseline + growth
      const historicalBaseline = averageMonthlyRevenue || 0;
      const growthFactor = isProjection ? (1 + (growthRate / 100) * (i / 12)) : 1;
      
      // Projected expenses
      const projectedExpenses = averageMonthlyExpenses;

      // CONSERVATIVE: Recurring + 70% of invoices
      const conservative = recurringIncome + 
        (expectedInvoices * 0.7) - 
        projectedExpenses;
      
      // REALISTIC: Recurring + 90% invoices + 80% unbilled + historical growth
      const realistic = recurringIncome + 
        (expectedInvoices * 0.9) + 
        (unbilledContribution * 0.8) + 
        (historicalBaseline * growthFactor * 0.5) - 
        projectedExpenses;
      
      // OPTIMISTIC: All income + growth
      const optimistic = recurringIncome + 
        expectedInvoices + 
        unbilledContribution + 
        (historicalBaseline * growthFactor * 1.15) - 
        projectedExpenses;

      projections.push({
        month: monthKey,
        monthName,
        conservative: Math.max(0, currentBalance + conservative * (i + 1)),
        realistic: Math.max(0, currentBalance + realistic * (i + 1)),
        optimistic: Math.max(0, currentBalance + optimistic * (i + 1)),
        isProjection,
        details: {
          recurringIncome,
          expectedInvoices,
          unbilledHoursValue: unbilledContribution,
          projectedExpenses,
        },
      });
    }

    const insights: CashFlowInsights = {
      unbilledHoursValue,
      unbilledHoursCount,
      pendingInvoicesValue,
      pendingInvoicesCount: pendingInvoices.length,
      averageMonthlyRevenue,
      averageMonthlyExpenses,
      growthRate,
      cashRunway,
    };

    return { insights, projections, currentBalance };
  }, [timeEntries, invoiceItems, cashFlowEntries, projects]);

  return {
    insights,
    projections,
    currentBalance,
    loading: false,
  };
}
