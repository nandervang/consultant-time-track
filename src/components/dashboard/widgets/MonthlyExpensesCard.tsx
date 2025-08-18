import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSEK } from '../../../lib/currency';
import { WidgetProps } from '@/types/dashboard';

export default function MonthlyExpensesCard({ widget, isDarkMode }: WidgetProps) {
  // Mock data - replace with real data later
  const currentExpenses = 4850;
  const lastMonthExpenses = 4200;
  const percentageChange = ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
  const isIncrease = percentageChange > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Monthly Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {formatSEK(currentExpenses)}
          </div>
          <div className="flex items-center gap-1 text-sm">
            {isIncrease ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
            <span className={isIncrease ? "text-red-500" : "text-green-500"}>
              {Math.abs(percentageChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Last month: {formatSEK(lastMonthExpenses)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
