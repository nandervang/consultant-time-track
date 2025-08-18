import { TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { WidgetProps } from '@/types/dashboard';
import { formatSEK } from '../../../lib/currency';

export default function RevenueChartCard({ widget, isDarkMode }: WidgetProps) {
  // Mock data - replace with real data later
  const data = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 15000 },
    { month: 'Mar', revenue: 11000 },
    { month: 'Apr', revenue: 18000 },
    { month: 'May', revenue: 22000 },
    { month: 'Jun', revenue: 19000 },
  ];

  const currentMonth = data[data.length - 1]?.revenue || 0;
  const previousMonth = data[data.length - 2]?.revenue || 0;
  const growth = previousMonth ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Revenue Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current month revenue */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{formatSEK(currentMonth)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className={`h-4 w-4 ${growth > 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={growth > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(growth).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => [formatSEK(value), 'Revenue']}
                  labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, stroke: '#2563eb', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-muted-foreground">
            6-month revenue trend
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
