import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Cell, Pie } from 'recharts';

interface BudgetChartsProps {
  chartData: Array<{
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
  }>;
  pieData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  isDarkMode: boolean;
}

export function BudgetCharts({ chartData, pieData, isDarkMode }: BudgetChartsProps) {
  if (chartData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Månadsbudget vs Faktisk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                />
                <YAxis hide />
                <Bar dataKey="budgeted" fill="#e2e8f0" name="Budget" />
                <Bar dataKey="spent" fill="#2563eb" name="Spenderat" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utgiftsfördelning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Inga utgifter att visa än
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}