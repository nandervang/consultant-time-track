import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import type { BudgetTotals } from '@/types/budget';

interface BudgetSummaryCardsProps {
  totals: BudgetTotals;
  getCurrentMonthName: () => string;
  getCurrentYear: () => string;
}

export function BudgetSummaryCards({ 
  totals, 
  getCurrentMonthName, 
  getCurrentYear 
}: BudgetSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Monthly Budget Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Månadsbudget (budgeterad)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatSEK(totals.monthly.budget)}</div>
          <p className="text-xs text-muted-foreground">{getCurrentMonthName()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Faktiska kostnader (månad)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatSEK(totals.monthly.spent)}</div>
          <p className="text-xs text-muted-foreground">
            {totals.monthly.percentage.toFixed(1)}% av budget
          </p>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(totals.monthly.percentage, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Annual Budget Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Årsbudget (budgeterad)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatSEK(totals.annual.budget)}</div>
          <p className="text-xs text-muted-foreground">{getCurrentYear()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Faktiska årrliga kostnader
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totals.annual.completed}/{totals.annual.completed + totals.annual.overdue}
          </div>
          <p className="text-xs text-muted-foreground">
            {totals.annual.overdue > 0 && (
              <span className="text-red-500">{totals.annual.overdue} försenade</span>
            )}
            {totals.annual.overdue === 0 && "Inga försenade"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}