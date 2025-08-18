import { Clock, DollarSign, FileText, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard';

export default function RecentActivitiesCard({ widget, isDarkMode }: WidgetProps) {
  // Mock data - replace with real data later
  const activities = [
    {
      id: 1,
      type: 'time',
      message: 'Logged 3.5 hours on Project Alpha',
      time: '2 hours ago',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'invoice',
      message: 'Invoice #1024 sent to Client Corp',
      time: '4 hours ago',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'payment',
      message: 'Received 50,000 kr payment',
      time: '1 day ago',
      icon: DollarSign,
      color: 'text-purple-600'
    },
    {
      id: 4,
      type: 'client',
      message: 'New client meeting scheduled',
      time: '2 days ago',
      icon: User,
      color: 'text-orange-600'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-full bg-muted flex-shrink-0`}>
                  <Icon className={`h-3 w-3 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-relaxed">
                    {activity.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
