import { useState } from 'react';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  FolderOpen, 
  Activity, 
  Plus,
  Wallet,
  Target,
  Zap,
  PieChart,
  CreditCard,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardWidget, WidgetType } from '@/types/dashboard';

interface AddWidgetDialogProps {
  onAddWidget: (widget: DashboardWidget) => void;
  children: React.ReactNode;
}

const availableWidgets = [
  {
    type: 'today-time' as WidgetType,
    name: 'Today\'s Hours',
    description: 'Track your daily time logging progress',
    icon: Clock,
    category: 'Time',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'time-logged' as WidgetType,
    name: 'Monthly Time',
    description: 'Monitor your monthly time tracking progress',
    icon: Clock,
    category: 'Time',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'quick-stats' as WidgetType,
    name: 'Quick Stats',
    description: 'Key metrics at a glance',
    icon: BarChart3,
    category: 'Overview',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'projects-overview' as WidgetType,
    name: 'Projects Overview',
    description: 'Status of your active projects',
    icon: FolderOpen,
    category: 'Projects',
    size: { w: 2 as const, h: 1 }
  },
  {
    type: 'recent-activities' as WidgetType,
    name: 'Recent Activities',
    description: 'Latest actions and updates',
    icon: Activity,
    category: 'Overview',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'quick-actions' as WidgetType,
    name: 'Quick Actions',
    description: 'Fast access to common tasks',
    icon: Zap,
    category: 'Overview',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'monthly-expenses' as WidgetType,
    name: 'Monthly Expenses',
    description: 'Track your monthly expenses and trends',
    icon: DollarSign,
    category: 'Finance',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'revenue-chart' as WidgetType,
    name: 'Revenue Chart',
    description: 'Visual representation of revenue trends',
    icon: TrendingUp,
    category: 'Finance',
    size: { w: 2 as const, h: 1 }
  },
  {
    type: 'cash-flow' as WidgetType,
    name: 'Cash Flow',
    description: 'Monitor your cash flow and balance',
    icon: Wallet,
    category: 'Finance',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'cash-flow-projections' as WidgetType,
    name: 'Cash Flow Projections',
    description: 'Forecast future cash flow scenarios',
    icon: Target,
    category: 'Finance',
    size: { w: 2 as const, h: 1 }
  },
  {
    type: 'blank-card' as WidgetType,
    name: 'Custom Widget',
    description: 'Create your own custom content',
    icon: Plus,
    category: 'Custom',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'yearly-budget-chart' as WidgetType,
    name: 'Årsbudget vs Faktisk',
    description: 'Bar chart comparing yearly budget to actual spending',
    icon: BarChart3,
    category: 'Finance',
    size: { w: 2 as const, h: 1 }
  },
  {
    type: 'yearly-expense-distribution' as WidgetType,
    name: 'Årlig Utgiftsfördelning',
    description: 'Pie chart showing yearly expense distribution',
    icon: PieChart,
    category: 'Finance',
    size: { w: 2 as const, h: 1 }
  },
  {
    type: 'payment-sources' as WidgetType,
    name: 'Betalningskällor',
    description: 'Overview of payment sources with expense counts',
    icon: CreditCard,
    category: 'Finance',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'uptime-monitor' as WidgetType,
    name: 'Uptime Monitor',
    description: 'Monitor website uptime and response times',
    icon: Activity,
    category: 'Custom',
    size: { w: 2 as const, h: 1 }
  },
  {
    type: 'upcoming-invoices' as WidgetType,
    name: 'Ready to Create',
    description: 'Invoices ready to be created in the next 7 days',
    icon: Calendar,
    category: 'Finance',
    size: { w: 1 as const, h: 1 }
  },
  {
    type: 'overdue-invoices' as WidgetType,
    name: 'Overdue Invoices',
    description: 'Invoices past their due date that need attention',
    icon: AlertTriangle,
    category: 'Finance',
    size: { w: 1 as const, h: 1 }
  }
];

export default function AddWidgetDialog({ onAddWidget, children }: AddWidgetDialogProps) {
  const [open, setOpen] = useState(false);

  const handleAddWidget = (widgetType: WidgetType, size: { w: 1 | 2 | 3; h: number }) => {
    const widget = availableWidgets.find(w => w.type === widgetType);
    if (!widget) return;

    const newWidget: DashboardWidget = {
      id: Date.now().toString(),
      type: widgetType,
      title: widget.name,
      size: size,
      position: { x: 0, y: 999, w: size.w, h: size.h },
    };

    onAddWidget(newWidget);
    setOpen(false);
  };

  const categories = ['All', 'Overview', 'Finance', 'Time', 'Projects', 'Custom'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredWidgets = selectedCategory === 'All' 
    ? availableWidgets 
    : availableWidgets.filter(widget => widget.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Widget Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWidgets.map((widget) => {
              const Icon = widget.icon;
              return (
                <Card
                  key={widget.type}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleAddWidget(widget.type, widget.size)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm mb-1">{widget.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {widget.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {widget.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {widget.size.w}×{widget.size.h}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
