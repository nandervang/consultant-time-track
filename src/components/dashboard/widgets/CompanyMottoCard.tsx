import { useState } from 'react';
import { Edit3, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WidgetProps } from '@/types/dashboard';

export default function CompanyMottoCard({ widget, isDarkMode }: WidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [motto, setMotto] = useState(
    (widget.config?.motto as string) || "Building the future, one project at a time."
  );
  const [tempMotto, setTempMotto] = useState(motto);

  const handleSave = () => {
    setMotto(tempMotto);
    setIsEditing(false);
    // TODO: Save to database
  };

  const handleCancel = () => {
    setTempMotto(motto);
    setIsEditing(false);
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6 flex items-center justify-center h-full">
        <div className="text-center w-full">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={tempMotto}
                onChange={(e) => setTempMotto(e.target.value)}
                className="text-center text-lg font-medium"
                placeholder="Enter your company motto..."
              />
              <div className="flex justify-center gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center leading-tight">
                {motto}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="opacity-60 hover:opacity-100"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit Motto
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
