import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { WidgetProps } from '@/types/dashboard';
import { formatSEK } from '../../../lib/currency';
import { useBudgetLogic } from '../../../hooks/useBudgetLogic';

export default function YearlyBudgetChartCard({ isDarkMode }: WidgetProps) {
  const { annualItems } = useBudgetLogic();

  // Transform annual items data for the chart
  const chartData = annualItems.map(item => ({
    name: item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
    fullName: item.name,
    budgeted: item.budgeted,
    spent: item.spent,
    remaining: Math.max(0, item.budgeted - item.spent)
  }));

  // Calculate totals for summary
  const totalBudgeted = annualItems.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = annualItems.reduce((sum, item) => sum + item.spent, 0);
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Årsbudget vs Faktisk
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium">{formatSEK(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">Totalt spenderat</p>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatSEK(totalBudgeted)}</div>
              <p className="text-xs text-muted-foreground">Total budget</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Förbrukat</span>
              <span>{overallPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  overallPercentage > 100 ? 'bg-red-500' : overallPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatSEK(value), 
                      name === 'budgeted' ? 'Budget' : name === 'spent' ? 'Spenderat' : 'Återstår'
                    ]}
                    labelFormatter={(label) => {
                      const item = chartData.find(d => d.name === label);
                      return item?.fullName || label;
                    }}
                    labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                      border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px' }}
                    iconType="rect"
                  />
                  <Bar 
                    dataKey="budgeted" 
                    fill={isDarkMode ? '#475569' : '#e2e8f0'} 
                    name="Budget"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="spent" 
                    fill={isDarkMode ? '#3b82f6' : '#2563eb'} 
                    name="Spenderat"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              Inga årliga budgetposter att visa
            </div>
          )}

          {/* Status indicator */}
          <div className="text-xs text-muted-foreground">
            {annualItems.length} årliga budgetposter • Uppdateras i realtid
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
