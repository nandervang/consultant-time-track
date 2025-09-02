export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
}

export interface AnnualBudgetItem {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  targetDate: string;
  status: 'pending' | 'completed' | 'overdue';
  color: string;
}

export interface BudgetTotals {
  monthly: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
  };
  annual: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    completed: number;
    overdue: number;
  };
}