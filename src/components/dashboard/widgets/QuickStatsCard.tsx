import { Activity, Users, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard';

export default function QuickStatsCard({ widget, isDarkMode }: WidgetProps) {
  // Mock data - replace with real data later
  const stats = [
    {
      label: 'Active Projects',
      value: '8',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      darkBgColor: 'bg-blue-900/30'
    },
    {
      label: 'Clients',
      value: '12',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      darkBgColor: 'bg-green-900/30'
    },
    {
      label: 'Invoices',
      value: '24',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      darkBgColor: 'bg-purple-900/30'
    },
    {
      label: 'Avg Hours/Day',
      value: '7.2',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      darkBgColor: 'bg-orange-900/30'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${
                    isDarkMode ? stat.darkBgColor : stat.bgColor
                  }`}>
                    <Icon className={`h-3 w-3 ${stat.color}`} />
                  </div>
                  <div className="text-lg font-bold">{stat.value}</div>
                </div>
                <p className="text-xs text-muted-foreground leading-tight">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
