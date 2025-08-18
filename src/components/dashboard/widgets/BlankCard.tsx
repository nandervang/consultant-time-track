import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WidgetProps } from '@/types/dashboard';

export default function BlankCard({ widget, isDarkMode }: WidgetProps) {
  return (
    <Card className="h-full border-dashed border-2">
      <CardContent className="p-6 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-sm mb-1">Add Content</h3>
            <p className="text-xs text-muted-foreground mb-3">
              This widget is ready for your content
            </p>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
