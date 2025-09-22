# Dashboard and Widgets System Specification

**Spec ID:** 014-A  
**Status:** Partially Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The Dashboard and Widgets System provides a customizable, drag-and-drop dashboard interface for consultant businesses. Users can personalize their workspace with various widgets that display real-time business metrics, time tracking data, financial information, and quick actions. The system follows a modular architecture with responsive design and persistent user preferences.

## Implementation Status

### ✅ Fully Implemented Features

#### Core Dashboard Framework
- **DashboardGrid Component** - Main grid layout with drag-and-drop functionality
- **Widget Management System** - Add, remove, resize, and reorder widgets
- **Responsive Grid Layout** - CSS Grid with 1-3 column spans and auto-sizing
- **Widget Persistence** - Supabase integration with localStorage fallback
- **User Authentication Integration** - Per-user widget configurations

#### Widget Infrastructure
- **WidgetProps Interface** - Standardized widget component interface
- **Widget Registration System** - Central widget component mapping
- **Add Widget Dialog** - Category-filtered widget selection interface
- **Widget Controls** - Hover controls for resize, remove, and drag operations
- **Empty State Handling** - Onboarding flow for new users

#### Fully Functional Widgets (6/18)

1. **Company Motto Card** ✅
   - **Status**: Complete with real data integration
   - **Features**: Editable motto and subtext, beautiful background effects
   - **Data Source**: `user_profiles` table via `useUserProfile` hook
   - **UI**: Background beams, dark/light mode support, inline editing

2. **Time Logged Card** ✅
   - **Status**: Complete with real data integration
   - **Features**: Monthly progress tracking, target calculations, user settings
   - **Data Source**: `time_entries` table via `useTimeEntries` hook
   - **UI**: Progress bar, target visualization, Swedish month names

3. **Uptime Monitor Card** ✅
   - **Status**: Complete with real functionality
   - **Features**: API/MongoDB monitoring, response time tracking, alerts
   - **Data Source**: Real API calls and MongoDB connections
   - **UI**: Status indicators, charts, configuration forms

4. **Quick Actions Card** ✅
   - **Status**: Complete with navigation integration
   - **Features**: Grid of common actions with icons and colors
   - **Data Source**: Static configuration with routing
   - **UI**: 2x2 grid layout, hover effects, semantic colors

5. **Recent Activities Card** ✅
   - **Status**: Complete with real data integration
   - **Features**: Recent time entries with project/client context
   - **Data Source**: `time_entries` with joined `projects` and `clients`
   - **UI**: Timeline layout, relative timestamps, context icons

6. **Blank Card** ✅
   - **Status**: Complete as placeholder widget
   - **Features**: Dashed border, add content CTA, configuration button
   - **Data Source**: None (placeholder)
   - **UI**: Centered content, plus icon, action button

### 🚧 Partially Implemented (Mock Data) Widgets (12/18)

7. **Monthly Expenses Card** ⚠️
   - **Status**: Mock data implementation
   - **Current**: Hardcoded values (`currentExpenses = 4850`)
   - **Missing**: Real expense tracking integration
   - **Required Integration**: Budget/expense tracking system

8. **Revenue Chart Card** ⚠️
   - **Status**: Mock data implementation
   - **Current**: Hardcoded chart data
   - **Missing**: Real revenue data from invoicing system
   - **Required Integration**: Invoice data aggregation

9. **Today Time Card** ⚠️
   - **Status**: Partial implementation
   - **Current**: May have real time data
   - **Missing**: Validation and testing needed
   - **Required Integration**: Daily time aggregation

10. **Quick Stats Card** ⚠️
    - **Status**: Mock data implementation
    - **Current**: Hardcoded statistics
    - **Missing**: Real business metrics calculation
    - **Required Integration**: Cross-system data aggregation

11. **Projects Overview Card** ⚠️
    - **Status**: Mock data implementation
    - **Current**: Hardcoded project data
    - **Missing**: Real project management integration
    - **Required Integration**: Projects system from spec 011-A

12. **Cash Flow Card** ⚠️
    - **Status**: Mock data implementation
    - **Current**: Hardcoded cash flow values
    - **Missing**: Real financial data integration
    - **Required Integration**: Cash flow system from spec 007-A

13. **Cash Flow Projections Card** ⚠️
    - **Status**: Mock data implementation
    - **Current**: Hardcoded projection data
    - **Missing**: Real projection calculations
    - **Required Integration**: Financial forecasting system

14. **Yearly Budget Chart Card** ⚠️
    - **Status**: Uses `useBudgetLogic` hook
    - **Current**: May have partial real data
    - **Missing**: Full budget system integration
    - **Required Integration**: Budget management system

15. **Yearly Expense Distribution Card** ⚠️
    - **Status**: Mock data implementation
    - **Current**: Hardcoded pie chart data
    - **Missing**: Real expense categorization
    - **Required Integration**: Expense tracking system

16. **Payment Sources Card** ⚠️
    - **Status**: Mock data implementation
    - **Current**: Hardcoded payment data
    - **Missing**: Real payment method tracking
    - **Required Integration**: Payment system integration

17. **Upcoming Invoices Card** ⚠️
    - **Status**: Partial implementation
    - **Current**: May connect to invoice system
    - **Missing**: Validation and optimization needed
    - **Required Integration**: Invoicing system from spec 008-A

18. **Overdue Invoices Card** ⚠️
    - **Status**: Partial implementation
    - **Current**: May connect to invoice system
    - **Missing**: Validation and optimization needed
    - **Required Integration**: Invoicing system from spec 008-A

## Technical Architecture

### Data Models

```typescript
interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: { x: number; y: number; w: number; h: number };
  config?: Record<string, unknown>;
  data?: unknown;
}

interface WidgetSize {
  w: 1 | 2 | 3; // width units (1=small, 2=medium, 3=large)
  h: number; // height in grid units
}

type WidgetType = 
  | 'company-motto'
  | 'monthly-expenses'
  | 'time-logged'
  | 'today-time'
  | 'revenue-chart'
  | 'cash-flow'
  | 'cash-flow-projections'
  | 'quick-actions'
  | 'projects-overview'
  | 'budget-status'
  | 'quick-stats'
  | 'recent-activities'
  | 'client-overview'
  | 'invoice-status'
  | 'yearly-budget-chart'
  | 'yearly-expense-distribution'
  | 'payment-sources'
  | 'uptime-monitor'
  | 'upcoming-invoices'
  | 'overdue-invoices'
  | 'blank-card';

interface WidgetProps {
  widget: DashboardWidget;
  isDarkMode: boolean;
  onUpdateWidget?: (widget: DashboardWidget) => void;
  onRemoveWidget?: (widgetId: string) => void;
}

interface WidgetConfig {
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: WidgetSize;
  component: React.ComponentType<WidgetProps>;
  icon: React.ComponentType<{ className?: string }>;
  category: 'overview' | 'finance' | 'time' | 'projects' | 'custom';
}
```

### Database Schema

```sql
-- Dashboard widgets table
CREATE TABLE dashboard_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Widget identification
  widget_type TEXT NOT NULL,
  title TEXT NOT NULL,
  
  -- Layout and positioning
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 1 CHECK (width IN (1, 2, 3)),
  height INTEGER NOT NULL DEFAULT 1,
  
  -- Configuration and data
  config JSONB DEFAULT '{}',
  is_visible BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dashboard_widgets_user_visible ON dashboard_widgets(user_id, is_visible);
CREATE INDEX idx_dashboard_widgets_position ON dashboard_widgets(user_id, position_y, position_x);
CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);

-- Row Level Security
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own dashboard widgets" 
ON dashboard_widgets FOR ALL 
USING (auth.uid() = user_id);
```

### Widget Component Architecture

#### Base Widget Pattern

```typescript
// Standard widget component structure
export default function ExampleWidget({ widget, isDarkMode }: WidgetProps) {
  // 1. Data fetching with hooks
  const { data, loading, error } = useExampleData();
  
  // 2. Local state management
  const [localState, setLocalState] = useState();
  
  // 3. Derived calculations
  const computedValue = useMemo(() => {
    // Calculations based on data
  }, [data]);
  
  // 4. Loading and error states
  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">Failed to load data</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 5. Main widget UI
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Widget-specific content */}
      </CardContent>
    </Card>
  );
}
```

#### Widget Categories and Patterns

**1. Overview Widgets** (High-level business metrics)
- Pattern: Large numbers with trend indicators
- Data Sources: Aggregated cross-system data
- Examples: Quick Stats, Company Motto

**2. Finance Widgets** (Financial data and trends)
- Pattern: Charts, currency formatting, percentage changes
- Data Sources: Invoicing, expense tracking, cash flow systems
- Examples: Revenue Chart, Monthly Expenses, Cash Flow

**3. Time Widgets** (Time tracking and productivity)
- Pattern: Progress bars, hour calculations, targets
- Data Sources: Time entries, project associations
- Examples: Time Logged, Today Time, Recent Activities

**4. Project Widgets** (Project management data)
- Pattern: Lists, progress indicators, status badges
- Data Sources: Project management system
- Examples: Projects Overview, Client Overview

**5. Custom Widgets** (Specialized functionality)
- Pattern: Interactive forms, external integrations
- Data Sources: External APIs, custom configurations
- Examples: Uptime Monitor, Quick Actions

### Component Registration System

```typescript
// Widget component mapping in DashboardGrid.tsx
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
  'payment-sources': PaymentSourcesCard,
  'uptime-monitor': UptimeMonitorCard,
  'upcoming-invoices': UpcomingInvoicesCard,
  'overdue-invoices': OverdueInvoicesCard,
  'blank-card': BlankCard,
};

// Available widgets configuration in AddWidgetDialog.tsx
const availableWidgets = [
  {
    type: 'today-time' as WidgetType,
    name: 'Today\'s Hours',
    description: 'Track your daily time logging progress',
    icon: Clock,
    category: 'Time',
    size: { w: 1 as const, h: 1 }
  },
  // ... more widget configurations
];
```

### User Experience Patterns

#### Widget Interaction States

```typescript
// Hover controls for each widget
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
```

#### Responsive Design Patterns

```css
/* Grid layout classes */
.widget-small { @apply col-span-1; }
.widget-medium { @apply col-span-1 md:col-span-2; }
.widget-large { @apply col-span-1 md:col-span-2 lg:col-span-3; }

/* Grid container */
.dashboard-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min;
}
```

## Data Integration Patterns

### Real Data Widgets (Examples)

#### Company Motto Card
```typescript
// Uses useUserProfile hook for real data
const { profile, updateCompanyMotto, updateCompanySubtext } = useUserProfile();

// Data source: user_profiles table
// Fields: company_motto, company_subtext
// Features: Inline editing, background effects
```

#### Time Logged Card
```typescript
// Uses useTimeEntries hook with calculated targets
const { entries } = useTimeEntries();
const [userSettings, setUserSettings] = useState({ 
  billing_percentage: 94, 
  absence_percentage: 15 
});

// Data sources: 
// - time_entries table
// - monthly_settings table (user preferences)
// - user_profiles table (fallback settings)
// Features: Progress tracking, Swedish localization
```

### Mock Data Widgets (Need Integration)

#### Monthly Expenses Card
```typescript
// Current mock implementation
const currentExpenses = 4850;
const lastMonthExpenses = 4200;

// Required integration:
// - Expense tracking system
// - Budget management
// - Monthly aggregation queries
```

#### Revenue Chart Card
```typescript
// Current mock implementation  
const mockData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  // ...
];

// Required integration:
// - Invoicing system data
// - Payment tracking
// - Monthly revenue calculations
```

### Data Fetching Patterns

#### Hook-based Data Fetching
```typescript
// Custom hooks for widget data
export const useWidgetData = (widgetType: WidgetType) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getWidgetData(widgetType);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [widgetType]);

  return { data, loading, error };
};
```

#### Real-time Data Updates
```typescript
// Supabase subscriptions for live data
useEffect(() => {
  const subscription = supabase
    .channel(`dashboard_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'time_entries',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      // Update widget data
      refetchWidgetData();
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [userId]);
```

## Performance Optimization

### Lazy Loading and Code Splitting

```typescript
// Dynamic widget imports for better performance
const LazyCompanyMottoCard = lazy(() => import('./widgets/CompanyMottoCard'));
const LazyTimeLoggedCard = lazy(() => import('./widgets/TimeLoggedCard'));

// Widget component mapping with lazy loading
const widgetComponents: Record<string, React.ComponentType<WidgetProps>> = {
  'company-motto': LazyCompanyMottoCard,
  'time-logged': LazyTimeLoggedCard,
  // ...
};

// Suspense wrapper in DashboardGrid
<Suspense fallback={<WidgetSkeleton />}>
  <WidgetComponent widget={widget} isDarkMode={isDarkMode} />
</Suspense>
```

### Caching and Persistence

```typescript
// Widget state persistence with localStorage fallback
const saveToLocalStorage = (widgets: DashboardWidget[]) => {
  localStorage.setItem(`widgets_${userId}`, JSON.stringify(widgets));
};

const loadFromLocalStorage = (): DashboardWidget[] => {
  const saved = localStorage.getItem(`widgets_${userId}`);
  return saved ? JSON.parse(saved) : [];
};

// Supabase integration with offline support
const updateWidgets = async (newWidgets: DashboardWidget[]) => {
  // Immediate local update
  setWidgets(newWidgets);
  saveToLocalStorage(newWidgets);
  
  // Background sync to Supabase
  try {
    await syncToSupabase(newWidgets);
  } catch (error) {
    // Handle offline mode
    queueForSync(newWidgets);
  }
};
```

## Development Roadmap

### Phase 1: Complete Core Widget Integration (Priority: High)

1. **Monthly Expenses Card**
   - Connect to expense tracking system
   - Implement real data aggregation
   - Add trend calculations

2. **Revenue Chart Card**
   - Connect to invoicing system
   - Implement monthly revenue calculations
   - Add interactive chart features

3. **Projects Overview Card**
   - Connect to project management system (spec 011-A)
   - Implement project status tracking
   - Add project progress visualization

4. **Cash Flow Cards**
   - Connect to cash flow system (spec 007-A)
   - Implement real-time projections
   - Add interactive controls

### Phase 2: Enhanced Widget Features (Priority: Medium)

1. **Widget Configuration**
   - Settings modal for each widget
   - Customizable refresh intervals
   - User-defined data ranges

2. **Advanced Interactions**
   - Click-through navigation to detail pages
   - Inline editing capabilities
   - Export/sharing functionality

3. **Widget Marketplace**
   - Custom widget creation tools
   - Widget templates and presets
   - Import/export widget configurations

### Phase 3: Advanced Dashboard Features (Priority: Low)

1. **Multiple Dashboard Layouts**
   - Named dashboard configurations
   - Quick layout switching
   - Team/role-based templates

2. **Real-time Collaboration**
   - Shared dashboard views
   - Team widget configurations
   - Live data synchronization

3. **Advanced Analytics**
   - Dashboard usage analytics
   - Widget performance metrics
   - User engagement tracking

## Testing and Quality Assurance

### Widget Testing Patterns

```typescript
// Unit tests for widgets
describe('TimeLoggedCard', () => {
  it('displays correct monthly hours', () => {
    // Test time calculation logic
  });
  
  it('shows progress towards target', () => {
    // Test progress bar calculation
  });
  
  it('handles loading and error states', () => {
    // Test async data handling
  });
});

// Integration tests for dashboard
describe('DashboardGrid', () => {
  it('persists widget positions', () => {
    // Test drag and drop persistence
  });
  
  it('handles widget add/remove operations', () => {
    // Test widget management
  });
});
```

### Performance Testing

```typescript
// Performance monitoring for widgets
const WidgetPerformanceMonitor = ({ children }) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 100) {
        console.warn(`Widget took ${renderTime}ms to render`);
      }
    };
  }, []);
  
  return children;
};
```

## Accessibility and Usability

### Screen Reader Support

```typescript
// ARIA labels for widget controls
<Button
  aria-label={`Resize ${widget.title} widget. Currently ${currentSize} size.`}
  onClick={handleResize}
>
  <Maximize className="h-4 w-4" />
</Button>

// Keyboard navigation support
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleWidgetAction();
  }
};
```

### Mobile Optimization

```css
/* Mobile-responsive widget layouts */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .widget-controls {
    opacity: 1; /* Always show on mobile */
    position: relative;
    top: auto;
    right: auto;
  }
}
```

---

This specification provides a comprehensive overview of the current dashboard and widgets system, clearly distinguishing between fully implemented features with real data integration and components that still require backend connections. The modular architecture and standardized patterns make it straightforward to upgrade mock data widgets to full functionality as the backend systems become available.