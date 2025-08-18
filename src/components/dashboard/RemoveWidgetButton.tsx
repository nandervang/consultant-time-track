import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RemoveWidgetButtonProps {
  widgetId: string;
  widgetTitle: string;
  onRemove: (widgetId: string) => void;
  className?: string;
}

export default function RemoveWidgetButton({ 
  widgetId, 
  widgetTitle, 
  onRemove, 
  className = "" 
}: RemoveWidgetButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRemove = () => {
    onRemove(widgetId);
    setShowConfirm(false);
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className={`h-8 w-8 bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700 ${className}`}
        onClick={() => setShowConfirm(true)}
        title="Remove widget"
      >
        <X className="h-4 w-4" />
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove Widget
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the "{widgetTitle}" widget from your dashboard? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
