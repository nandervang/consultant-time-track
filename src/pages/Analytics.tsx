import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsPageProps {
  isDarkMode: boolean;
}

export default function AnalyticsPage({ isDarkMode }: AnalyticsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and reports for your business
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Analytics and reporting features coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
