import { PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { WidgetProps } from '@/types/dashboard';
import { formatSEK } from '../../../lib/currency';
import { useBudgetLogic } from '../../../hooks/useBudgetLogic';

// Colors for the pie chart segments
const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];

export default function YearlyExpenseDistributionCard({ isDarkMode }: WidgetProps) {
  const { annualItems } = useBudgetLogic();

  // Transform annual items data for the pie chart (only items with spending)
  const pieData = annualItems
    .filter(item => item.spent > 0)
    .map((item, index) => ({
      name: item.name,
      value: item.spent,
      color: item.color || CHART_COLORS[index % CHART_COLORS.length],
      percentage: 0 // Will be calculated below
    }));

  // Calculate percentages
  const totalSpent = pieData.reduce((sum, item) => sum + item.value, 0);
  pieData.forEach(item => {
    item.percentage = totalSpent > 0 ? (item.value / totalSpent) * 100 : 0;
  });

  // Sort by value (largest first)
  pieData.sort((a, b) => b.value - a.value);

  // Calculate summary stats
  const itemsWithSpending = annualItems.filter(item => item.spent > 0).length;
  const totalItems = annualItems.length;
  const averageSpending = itemsWithSpending > 0 ? totalSpent / itemsWithSpending : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Årlig Utgiftsfördelning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">{formatSEK(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">Totalt spenderat</p>
            </div>
            <div>
              <div className="font-medium">{formatSEK(averageSpending)}</div>
              <p className="text-xs text-muted-foreground">Snitt per kategori</p>
            </div>
          </div>

          {/* Chart */}
          {pieData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={70}
                    dataKey="value"
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatSEK(value), 'Spenderat']}
                    labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                      border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Inga utgifter att visa än
            </div>
          )}

          {/* Legend - Top categories */}
          {pieData.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Största utgifter:</div>
              <div className="space-y-1">
                {pieData.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate max-w-24">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{formatSEK(item.value)}</span>
                      <span className="text-muted-foreground">({item.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
                {pieData.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{pieData.length - 3} fler kategorier
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status indicator */}
          <div className="text-xs text-muted-foreground">
            {itemsWithSpending} av {totalItems} kategorier med utgifter
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
