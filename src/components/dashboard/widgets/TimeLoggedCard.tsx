import { Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard';

export default function TimeLoggedCard({ widget, isDarkMode }: WidgetProps) {
  // Mock data - replace with real data later
  const hoursThisMonth = 156;
  const targetHours = 160;
  const percentageOfTarget = (hoursThisMonth / targetHours) * 100;
  const remainingHours = targetHours - hoursThisMonth;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Logged This Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">
            {hoursThisMonth}h
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-muted-foreground">{percentageOfTarget.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(percentageOfTarget, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {remainingHours > 0 ? `${remainingHours}h remaining` : 'Target reached!'}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Target: {targetHours}h/month
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
