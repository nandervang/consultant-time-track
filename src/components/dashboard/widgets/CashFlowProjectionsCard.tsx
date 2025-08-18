import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Target, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatSEK } from '../../../lib/currency';

interface CashFlowProjectionsCardProps {
  isDarkMode?: boolean;
}

interface ProjectionData {
  month: string;
  conservative: number;
  realistic: number;
  optimistic: number;
  isProjection?: boolean;
}

export default function CashFlowProjectionsCard({ isDarkMode }: CashFlowProjectionsCardProps) {
  // Mock data - current + projections
  const projectionData: ProjectionData[] = [
    { month: 'Apr', conservative: 70700, realistic: 70700, optimistic: 70700 },
    { month: 'May', conservative: 79200, realistic: 79200, optimistic: 79200 },
    { month: 'Jun', conservative: 88200, realistic: 88200, optimistic: 88200 },
    { month: 'Jul', conservative: 93000, realistic: 97000, optimistic: 102000, isProjection: true },
    { month: 'Aug', conservative: 97500, realistic: 105500, optimistic: 116000, isProjection: true },
    { month: 'Sep', conservative: 101800, realistic: 114200, optimistic: 131500, isProjection: true },
  ];

  const currentBalance = 88200;
  const projectedGrowth = ((114200 - 88200) / 88200) * 100;
  
  // Calculate cash runway (months until balance reaches critical level)
  const monthlyBurnRate = 18500; // Average monthly expenses
  const cashRunway = Math.floor(currentBalance / monthlyBurnRate);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Cash Flow Projections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded bg-green-50 dark:bg-green-900/20">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">Conservative</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatSEK(projectionData[projectionData.length - 1].conservative)}
            </div>
          </div>
          <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Realistic</div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {formatSEK(projectionData[projectionData.length - 1].realistic)}
            </div>
          </div>
          <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/20">
            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Optimistic</div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
              {formatSEK(projectionData[projectionData.length - 1].optimistic)}
            </div>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatSEK(value), 
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
                labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                  border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="optimistic" 
                stackId="1" 
                stroke="#9333ea" 
                fill="#9333ea" 
                fillOpacity={0.1}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <Area 
                type="monotone" 
                dataKey="realistic" 
                stackId="2" 
                stroke="#2563eb" 
                fill="#2563eb" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="conservative" 
                stackId="3" 
                stroke="#16a34a" 
                fill="#16a34a" 
                fillOpacity={0.3}
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-3 w-3" />
              <span>3-Month Growth</span>
            </div>
            <span className="font-medium">+{projectedGrowth.toFixed(1)}%</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Calendar className="h-3 w-3" />
              <span>Cash Runway</span>
            </div>
            <span className="font-medium">{cashRunway} months</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Target className="h-3 w-3" />
              <span>Goal: 1,500,000 kr</span>
            </div>
            <span className="font-medium">75% achieved</span>
          </div>
        </div>

        {/* Warning/Alert */}
        {cashRunway < 6 && (
          <div className="flex items-center gap-2 text-xs p-2 rounded bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
            <AlertCircle className="h-3 w-3" />
            <span>Consider building larger cash reserves</span>
          </div>
        )}

        {/* Model Assumptions */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">Model Assumptions</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>• Conservative: 5% growth/month</div>
            <div>• Realistic: 8% growth/month</div>
            <div>• Optimistic: 12% growth/month</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
