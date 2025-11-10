import { addDays } from 'date-fns';

/**
 * Calculate projected payment date based on invoice date and payment terms
 * @param invoiceDate - The date the invoice was sent
 * @param paymentTermsDays - Number of days until payment (default 30)
 * @returns ISO date string for expected payment
 */
export function calculatePaymentDate(invoiceDate: string, paymentTermsDays: number = 30): string {
  const date = new Date(invoiceDate);
  const paymentDate = addDays(date, paymentTermsDays);
  return paymentDate.toISOString().slice(0, 10);
}

/**
 * Calculate growth rate from historical revenue data
 * @param historicalData - Array of monthly revenue values (oldest to newest)
 * @returns Growth rate as percentage
 */
export function calculateGrowthRate(historicalData: number[]): number {
  if (historicalData.length < 2) return 0;

  // Compare recent 3 months vs older 3 months
  const recentPeriod = historicalData.slice(-3);
  const olderPeriod = historicalData.slice(0, 3);

  const recentAvg = recentPeriod.reduce((a, b) => a + b, 0) / recentPeriod.length;
  const olderAvg = olderPeriod.reduce((a, b) => a + b, 0) / olderPeriod.length;

  if (olderAvg === 0) return 0;

  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

/**
 * Calculate value of unbilled hours
 * @param timeEntries - Array of time entries with hours and project info
 * @param getHourlyRate - Function to get hourly rate for a project
 * @returns Total value of unbilled hours
 */
export function calculateUnbilledHoursValue(
  timeEntries: Array<{ hours: number; project_id: string }>,
  getHourlyRate: (projectId: string) => number
): number {
  return timeEntries.reduce((sum, entry) => {
    const rate = getHourlyRate(entry.project_id);
    return sum + (entry.hours * rate);
  }, 0);
}

/**
 * Determine client payment terms in days
 * @param clientName - Name of the client
 * @returns Payment terms in days
 */
export function getPaymentTerms(clientName: string): number {
  // Special cases
  const specialTerms: Record<string, number> = {
    'Cisco': 90,
    'cisco': 90,
  };

  return specialTerms[clientName] || 30; // Default 30 days
}

/**
 * Calculate monthly burn rate from historical expenses
 * @param expenses - Array of expense amounts
 * @param months - Number of months the expenses cover
 * @returns Average monthly burn rate
 */
export function calculateBurnRate(expenses: number[], months: number): number {
  if (months === 0) return 0;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense, 0);
  return totalExpenses / months;
}

/**
 * Calculate cash runway in months
 * @param currentBalance - Current cash balance
 * @param monthlyBurnRate - Average monthly expenses
 * @returns Number of months until cash runs out
 */
export function calculateCashRunway(currentBalance: number, monthlyBurnRate: number): number {
  if (monthlyBurnRate === 0) return 12; // Assume healthy runway if no expenses
  return Math.floor(currentBalance / monthlyBurnRate);
}

/**
 * Project balance for a future month based on scenario
 * @param currentBalance - Starting balance
 * @param monthlyIncome - Expected income for the month
 * @param monthlyExpenses - Expected expenses for the month
 * @param monthsAhead - How many months in the future
 * @returns Projected balance
 */
export function projectBalance(
  currentBalance: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  monthsAhead: number
): number {
  const netCashFlow = monthlyIncome - monthlyExpenses;
  return Math.max(0, currentBalance + (netCashFlow * monthsAhead));
}

/**
 * Apply growth factor to a base value
 * @param baseValue - Starting value
 * @param growthRate - Growth rate as percentage
 * @param periods - Number of periods to apply growth
 * @returns Value with growth applied
 */
export function applyGrowth(baseValue: number, growthRate: number, periods: number): number {
  const growthFactor = 1 + (growthRate / 100);
  return baseValue * Math.pow(growthFactor, periods);
}
