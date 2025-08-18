import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatSEK } from '../../../lib/currency';

interface CashFlowCardProps {
  isDarkMode?: boolean;
}

interface CashFlowData {
  month: string;
  balance: number;
  netFlow: number;
}

export default function CashFlowCard({ isDarkMode }: CashFlowCardProps) {
  // Mock data - replace with real data
  const cashFlowData: CashFlowData[] = [
    { month: 'Jan', balance: 45000, netFlow: 7000 },
    { month: 'Feb', balance: 53500, netFlow: 8500 },
    { month: 'Mar', balance: 59700, netFlow: 6200 },
    { month: 'Apr', balance: 70700, netFlow: 11000 },
    { month: 'May', balance: 79200, netFlow: 8500 },
    { month: 'Jun', balance: 88200, netFlow: 9000 },
  ];

  const currentBalance = cashFlowData[cashFlowData.length - 1].balance;
  const currentNetFlow = cashFlowData[cashFlowData.length - 1].netFlow;
  const previousNetFlow = cashFlowData[cashFlowData.length - 2].netFlow;
  const netFlowChange = currentNetFlow - previousNetFlow;
  const netFlowChangePercent = (netFlowChange / previousNetFlow) * 100;

  // Projected balance for next month based on current trend
  const projectedBalance = currentBalance + (currentNetFlow * 1.05);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Cash Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Current Balance</div>
            <div className="text-xl font-bold text-green-600">
              {formatSEK(currentBalance)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Monthly Net Flow</div>
            <div className={`text-xl font-bold flex items-center gap-1 ${
              currentNetFlow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {currentNetFlow >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {formatSEK(Math.abs(currentNetFlow))}
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData}>
              <XAxis 
                dataKey="month" 
                hide
              />
              <YAxis hide />
              <Tooltip 
                formatter={(value: number) => [formatSEK(value), 'Balance']}
                labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                  border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#16a34a" 
                strokeWidth={2}
                dot={false}
                name="Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-xs p-2 rounded ${
            netFlowChange >= 0 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {netFlowChange >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>
              {netFlowChange >= 0 ? '+' : ''}{netFlowChangePercent.toFixed(1)}% vs last month
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>Projected next month: {formatSEK(projectedBalance)}</span>
          </div>

          {currentNetFlow < 5000 && (
            <div className="flex items-center gap-2 text-xs p-2 rounded bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
              <AlertTriangle className="h-3 w-3" />
              <span>Consider increasing revenue streams</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Quick Actions</div>
          <div className="flex gap-2">
            <button className="flex-1 text-xs py-1 px-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded transition-colors">
              Add Income
            </button>
            <button className="flex-1 text-xs py-1 px-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded transition-colors">
              Log Expense
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
