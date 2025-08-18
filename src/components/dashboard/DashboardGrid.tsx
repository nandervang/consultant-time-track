import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardWidget, WidgetProps } from '@/types/dashboard';
import CompanyMottoCard from './widgets/CompanyMottoCard';
import MonthlyExpensesCard from './widgets/MonthlyExpensesCard';
import TimeLoggedCard from './widgets/TimeLoggedCard';
import RevenueChartCard from './widgets/RevenueChartCard';
import QuickStatsCard from './widgets/QuickStatsCard';
import QuickActionsCard from './widgets/QuickActionsCard';
import RecentActivitiesCard from './widgets/RecentActivitiesCard';
import ProjectsOverviewCard from './widgets/ProjectsOverviewCard';
import CashFlowCard from './widgets/CashFlowCard';
import CashFlowProjectionsCard from './widgets/CashFlowProjectionsCard';
import BlankCard from './widgets/BlankCard';
import AddWidgetDialog from './AddWidgetDialog';

interface DashboardGridProps {
  widgets: DashboardWidget[];
  onUpdateWidgets: (widgets: DashboardWidget[]) => void;
  onAddWidget: (widget: DashboardWidget) => void;
  isDarkMode: boolean;
}

const widgetComponents: Record<string, React.ComponentType<WidgetProps>> = {
  'company-motto': CompanyMottoCard,
  'monthly-expenses': MonthlyExpensesCard,
  'time-logged': TimeLoggedCard,
  'revenue-chart': RevenueChartCard,
  'quick-stats': QuickStatsCard,
  'quick-actions': QuickActionsCard,
  'recent-activities': RecentActivitiesCard,
  'projects-overview': ProjectsOverviewCard,
  'cash-flow': CashFlowCard,
  'cash-flow-projections': CashFlowProjectionsCard,
  'blank-card': BlankCard,
};

export default function DashboardGrid({ 
  widgets, 
  onUpdateWidgets, 
  onAddWidget, 
  isDarkMode 
}: DashboardGridProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (result: { destination?: { index: number } | null; source: { index: number } }) => {
    setIsDragging(false);
    
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onUpdateWidgets(items);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const getGridColumns = () => {
    if (typeof window === 'undefined') return 'repeat(3, 1fr)';
    
    const width = window.innerWidth;
    if (width < 768) return 'repeat(1, 1fr)';
    if (width < 1024) return 'repeat(2, 1fr)';
    if (width < 1440) return 'repeat(3, 1fr)';
    return 'repeat(4, 1fr)';
  };

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
        <AddWidgetDialog onAddWidget={onAddWidget}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </AddWidgetDialog>
      </div>

      {/* Widgets Grid */}
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Droppable droppableId="dashboard" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-6 auto-rows-min"
              style={{
                gridTemplateColumns: getGridColumns(),
              }}
            >
              {widgets.map((widget, index) => {
                const WidgetComponent = widgetComponents[widget.type] || BlankCard;
                
                return (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group ${
                          widget.size.w === 2 ? 'col-span-2' : 
                          widget.size.w === 3 ? 'col-span-3' : ''
                        } ${snapshot.isDragging ? 'opacity-50' : ''}`}
                        style={{
                          ...provided.draggableProps.style,
                          gridColumn: `span ${Math.min(widget.size.w, 3)}`,
                        }}
                      >
                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className={`absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDragging ? 'opacity-100' : ''
                          }`}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <GripVertical className="h-4 w-4" />
                          </Button>
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
                <AddWidgetDialog onAddWidget={onAddWidget}>
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
