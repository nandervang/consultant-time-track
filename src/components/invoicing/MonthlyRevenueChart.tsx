import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, MoreVertical } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import { InvoiceItem } from '@/types/invoice';

interface MonthlyRevenueChartProps {
  items: InvoiceItem[];
  loading?: boolean;
}

export function MonthlyRevenueChart({ items, loading }: MonthlyRevenueChartProps) {
  if (loading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  // Generate last 6 months of data
  const generateMonthlyData = () => {
    interface MonthData {
      month: string;
      monthKey: string;
      invoiced: number;
      paid: number;
      pending: number;
    }
    
    const months: MonthData[] = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      months.push({
        month: monthName,
        monthKey,
        invoiced: 0,
        paid: 0,
        pending: 0,
      });
    }
    
    // Aggregate data by month
    items.forEach(item => {
      const itemDate = new Date(item.date);
      const itemMonthKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = months.find(m => m.monthKey === itemMonthKey);
      if (monthData) {
        switch (item.status) {
          case 'invoiced':
            monthData.invoiced += item.amount;
            break;
          case 'paid':
            monthData.paid += item.amount;
            break;
          case 'pending':
            monthData.pending += item.amount;
            break;
        }
      }
    });
    
    return months;
  };

  const monthlyData = generateMonthlyData();
  const hasData = monthlyData.some(month => month.invoiced > 0 || month.paid > 0 || month.pending > 0);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm">
              {entry.name}: {formatSEK(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Monthly Revenue</CardTitle>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No revenue data yet</p>
              <p className="text-sm">Data will appear as you add invoice items</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="paid" 
                stackId="a" 
                fill="#10B981" 
                name="Paid"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="invoiced" 
                stackId="a" 
                fill="#3B82F6" 
                name="Invoiced"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="pending" 
                stackId="a" 
                fill="#F59E0B" 
                name="Pending"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
