import TimeLogger from '@/components/TimeLogger';
import DailySummary from '@/components/DailySummary';
import TableView from '@/components/TableView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimeTrackingPageProps {
  isDarkMode: boolean;
}

export default function TimeTrackingPage({ isDarkMode }: TimeTrackingPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground">
            Log your hours and track your productivity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Logger */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Log Time</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeLogger isDarkMode={isDarkMode} />
            </CardContent>
          </Card>
        </div>

        {/* Daily Summary */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <DailySummary isDarkMode={isDarkMode} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <TableView isDarkMode={isDarkMode} />
        </CardContent>
      </Card>
    </div>
  );
}
