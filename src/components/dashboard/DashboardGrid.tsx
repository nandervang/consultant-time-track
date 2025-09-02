import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, GripVertical, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardWidget, WidgetProps } from '@/types/dashboard';
import { useWidgets } from '@/hooks/useWidgets';
import { useAuth } from '@/hooks/useAuth';
import CompanyMottoCard from './widgets/CompanyMottoCard';
import MonthlyExpensesCard from './widgets/MonthlyExpensesCard';
import TimeLoggedCard from './widgets/TimeLoggedCard';
import TodayTimeCard from './widgets/TodayTimeCard';
import RevenueChartCard from './widgets/RevenueChartCard';
import QuickStatsCard from './widgets/QuickStatsCard';
import QuickActionsCard from './widgets/QuickActionsCard';
import RecentActivitiesCard from './widgets/RecentActivitiesCard';
import ProjectsOverviewCard from './widgets/ProjectsOverviewCard';
import CashFlowCard from './widgets/CashFlowCard';
import CashFlowProjectionsCard from './widgets/CashFlowProjectionsCard';
import BlankCard from './widgets/BlankCard';
import YearlyBudgetChartCard from './widgets/YearlyBudgetChartCard';
import YearlyExpenseDistributionCard from './widgets/YearlyExpenseDistributionCard';
import AddWidgetDialog from './AddWidgetDialog';
import RemoveWidgetButton from './RemoveWidgetButton';

interface DashboardGridProps {
  isDarkMode: boolean;
}

const widgetComponents: Record<string, React.ComponentType<WidgetProps>> = {
  'company-motto': CompanyMottoCard,
  'monthly-expenses': MonthlyExpensesCard,
  'time-logged': TimeLoggedCard,
  'today-time': TodayTimeCard,
  'revenue-chart': RevenueChartCard,
  'quick-stats': QuickStatsCard,
  'quick-actions': QuickActionsCard,
  'recent-activities': RecentActivitiesCard,
  'projects-overview': ProjectsOverviewCard,
  'cash-flow': CashFlowCard,
  'cash-flow-projections': CashFlowProjectionsCard,
  'yearly-budget-chart': YearlyBudgetChartCard,
  'yearly-expense-distribution': YearlyExpenseDistributionCard,
  'blank-card': BlankCard,
};

export default function DashboardGrid({ isDarkMode }: DashboardGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { user } = useAuth();
  const { widgets, loading, updateWidgets, addWidget, removeWidget, updateWidget } = useWidgets(user?.id || null);

  const handleRemoveWidget = (widgetId: string) => {
    removeWidget(widgetId);
  };

  const handleResizeWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const newSize = widget.size.w === 1 ? 2 : widget.size.w === 2 ? 3 : 1;
    
    updateWidget(widgetId, {
      size: { ...widget.size, w: newSize as 1 | 2 | 3 },
      position: { ...widget.position, w: newSize }
    });
  };

  const handleDragEnd = (result: { destination?: { index: number } | null; source: { index: number } }) => {
    setIsDragging(false);
    
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions for all widgets
    const updatedItems = items.map((widget, index) => ({
      ...widget,
      position: { ...widget.position, y: index }
    }));

    updateWidgets(updatedItems);
  };

  const handleAddWidget = (widget: DashboardWidget) => {
    addWidget(widget);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const getWidgetSizeClass = (width: number) => {
    switch (width) {
      case 2:
        return 'col-span-1 md:col-span-2';
      case 3:
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
        <AddWidgetDialog onAddWidget={handleAddWidget}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </AddWidgetDialog>
      </div>

      {/* Widgets Grid */}
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Droppable droppableId="dashboard">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min"
            >
              {widgets.map((widget, index) => {
                const WidgetComponent = widgetComponents[widget.type] || BlankCard;
                
                return (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group ${getWidgetSizeClass(widget.size.w)} ${
                          snapshot.isDragging ? 'opacity-70 shadow-2xl z-50' : ''
                        }`}
                        style={provided.draggableProps.style}
                      >
                        {/* Widget Controls */}
                        <div className={`absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isDragging ? 'opacity-100' : ''
                        }`}>
                          {/* Resize button */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 hover:text-blue-700"
                            onClick={() => handleResizeWidget(widget.id)}
                            title={`Resize widget (currently ${widget.size.w === 1 ? 'small' : widget.size.w === 2 ? 'medium' : 'large'})`}
                          >
                            {widget.size.w === 1 ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
                          </Button>
                          
                          {/* Remove button */}
                          <RemoveWidgetButton
                            widgetId={widget.id}
                            widgetTitle={widget.title}
                            onRemove={handleRemoveWidget}
                          />
                          
                          {/* Drag handle */}
                          <div {...provided.dragHandleProps}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Drag to reorder">
                              <GripVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <WidgetComponent 
                          widget={widget} 
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty state */}
      {widgets.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium mb-1">No widgets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by adding your first widget to the dashboard
                </p>
                <AddWidgetDialog onAddWidget={handleAddWidget}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Widget
                  </Button>
                </AddWidgetDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
