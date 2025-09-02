import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Cell, Pie, Tooltip, Legend } from 'recharts';
import { formatSEK } from '@/lib/currency';
import type { AnnualBudgetItem } from '@/types/budget';

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
  annualItems: AnnualBudgetItem[];
  isDarkMode: boolean;
}

export function BudgetCharts({ chartData, pieData, annualItems, isDarkMode }: BudgetChartsProps) {
  if (chartData.length === 0 && annualItems.length === 0) return null;

  // Transform annual items data for the yearly charts
  const yearlyChartData = annualItems.map(item => ({
    name: item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
    fullName: item.name,
    budgeted: item.budgeted,
    spent: item.spent,
    remaining: Math.max(0, item.budgeted - item.spent)
  }));

  const yearlyPieData = annualItems
    .filter(item => item.spent > 0)
    .map(item => ({
      name: item.name,
      value: item.spent,
      color: item.color
    }));

  return (
    <div className="space-y-8">
      {/* Monthly Charts */}
      {chartData.length > 0 && (
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
                    <Tooltip 
                      formatter={(value: number) => [formatSEK(value), '']}
                      labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                        border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
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
                      <Tooltip 
                        formatter={(value: number) => [formatSEK(value), 'Spenderat']}
                        labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                          border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }}
                      />
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
      )}

      {/* Yearly Charts */}
      {annualItems.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Årsbudget vs Faktisk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {yearlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                          const item = yearlyChartData.find(d => d.name === label);
                          return item?.fullName || label;
                        }}
                        labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                          border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px' }}
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
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Inga årliga budgetposter att visa
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Årlig Utgiftsfördelning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {yearlyPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={yearlyPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {yearlyPieData.map((entry, index) => (
                          <Cell key={`yearly-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatSEK(value), 'Spenderat']}
                        labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                          border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Inga årliga utgifter att visa än
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}