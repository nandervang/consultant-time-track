# Cash Flow Management Specification

**Spec ID:** 007-A  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The Cash Flow Management feature provides comprehensive financial forecasting, income/expense tracking, and cash flow visualization for consultant business planning. It enables users to monitor financial health, predict future cash positions, and make informed business decisions.

### Business Start Date Handling

**Key Feature:** The system respects the business start date (September 2025) to ensure accurate financial reporting:

- **Pre-Business Months**: Months before September 2025 display in the interface but show zero income, expenses, and balance
- **Business Start Month**: September 2025 begins with the initial business balance (50,000 SEK)
- **Data Filtering**: Historical entries dated before business start are filtered out from calculations
- **Cumulative Balance**: Only accumulates from the business start month forward, preventing historical data from affecting current projections

## Feature Requirements

### Functional Requirements

#### Core Cash Flow Capabilities

**Financial Forecasting**
- Monthly cash flow projections based on scheduled income and expenses
- Recurring payment calculations (salary, subscriptions, regular expenses)
- Invoice payment predictions based on client payment terms
- Scenario planning with adjustable parameters

**Income Tracking**
- Invoice revenue tracking with payment status
- Project-based income categorization
- Recurring income streams (retainer clients, subscriptions)
- Currency conversion support (multi-currency businesses)

**Expense Management**
- Business expense categorization and tracking
- Recurring expense automation (rent, software subscriptions)
- Tax provision calculations (VAT, employer tax reserves)
- Capital expense planning and depreciation

**Visualization & Reporting**
- Interactive cash flow charts and graphs
- Monthly/quarterly/yearly views
- Cash position trending analysis
- Export capabilities for financial planning

### Technical Specifications

#### Data Models

```typescript
interface CashFlowEntry {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  source_type: 'invoice' | 'salary' | 'expense' | 'tax' | 'manual';
  source_id?: string;
  status: 'confirmed' | 'projected' | 'pending';
  created_at: string;
  updated_at: string;
}

interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // Every X periods
  start_date: string;
  end_date?: string;
  day_of_month?: number; // For monthly recurrence
  day_of_week?: number; // For weekly recurrence
}

interface CashFlowProjection {
  month: string;
  opening_balance: number;
  total_income: number;
  total_expenses: number;
  net_flow: number;
  closing_balance: number;
  is_projection: boolean;
}
```

#### Cash Flow Calculation Hook

```typescript
export const useCashFlowCalculations = () => {
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'6months' | '12months' | '24months'>('12months');

  const calculateCashFlow = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      // Fetch confirmed transactions
      const { data: confirmedEntries } = await supabase
        .from('cash_flow_entries')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'confirmed');

      // Generate recurring projections
      const recurringProjections = generateRecurringProjections(startDate, endDate);
      
      // Fetch invoice-based projections
      const invoiceProjections = await generateInvoiceProjections(startDate, endDate);
      
      // Combine and calculate monthly summaries
      const monthlyProjections = calculateMonthlyProjections(
        confirmedEntries, 
        recurringProjections, 
        invoiceProjections
      );
      
      setProjections(monthlyProjections);
    } catch (error) {
      console.error('Cash flow calculation failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projections,
    loading,
    timeframe,
    setTimeframe,
    calculateCashFlow,
    recalculate: () => calculateCashFlow(getStartDate(), getEndDate())
  };
};
```

### User Interface Specifications

#### Cash Flow Dashboard

```typescript
// Main cash flow overview component
const CashFlowDashboard = () => {
  const { projections, loading, timeframe, setTimeframe } = useCashFlowCalculations();

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow</h1>
          <p className="text-muted-foreground">
            Financial forecasting and cash position tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="12months">12 Months</SelectItem>
              <SelectItem value="24months">24 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              As of {formatDate(new Date())}
            </p>
          </CardContent>
        </Card>
        
        {/* Additional metric cards */}
      </div>

      {/* Cash flow chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Projection</CardTitle>
          <CardDescription>
            Income, expenses, and net cash flow over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={projections} />
        </CardContent>
      </Card>

      {/* Monthly breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowTable projections={projections} />
        </CardContent>
      </Card>
    </div>
  );
};
```

#### Interactive Cash Flow Chart

```typescript
interface CashFlowChartProps {
  data: CashFlowProjection[];
}

const CashFlowChart = ({ data }: CashFlowChartProps) => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickFormatter={(value) => format(new Date(value), 'MMM yyyy')}
          />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip 
            labelFormatter={(value) => format(new Date(value), 'MMMM yyyy')}
            formatter={(value: number, name: string) => [
              formatCurrency(value), 
              name.replace('_', ' ').toUpperCase()
            ]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="total_income" 
            stroke="#22c55e" 
            strokeWidth={2}
            name="Income"
          />
          <Line 
            type="monotone" 
            dataKey="total_expenses" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Expenses"
          />
          <Line 
            type="monotone" 
            dataKey="closing_balance" 
            stroke="#3b82f6" 
            strokeWidth={3}
            name="Cash Balance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### Database Schema

#### Cash Flow Entries Table

```sql
CREATE TABLE cash_flow_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB,
  source_type TEXT NOT NULL CHECK (source_type IN ('invoice', 'salary', 'expense', 'tax', 'manual')),
  source_id UUID, -- Reference to invoice, salary, etc.
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'projected', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_cash_flow_user_date ON cash_flow_entries(user_id, date);
CREATE INDEX idx_cash_flow_type_status ON cash_flow_entries(type, status);
CREATE INDEX idx_cash_flow_source ON cash_flow_entries(source_type, source_id);
```

#### Row Level Security

```sql
-- Enable RLS
ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;

-- Policy for user access
CREATE POLICY "Users can access own cash flow entries" 
ON cash_flow_entries FOR ALL 
USING (auth.uid() = user_id);

-- Policy for automated systems (tax calculations, etc.)
CREATE POLICY "System can create cash flow entries"
ON cash_flow_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Business Logic

#### Recurring Entry Generation

```typescript
const generateRecurringProjections = (startDate: string, endDate: string) => {
  const projections: CashFlowEntry[] = [];
  
  // Fetch recurring templates
  const recurringEntries = getRecurringEntries();
  
  recurringEntries.forEach(template => {
    if (!template.recurrence_pattern) return;
    
    const occurrences = calculateOccurrences(
      template.recurrence_pattern,
      startDate,
      endDate
    );
    
    occurrences.forEach(date => {
      projections.push({
        ...template,
        id: `projected-${template.id}-${date}`,
        date,
        status: 'projected'
      });
    });
  });
  
  return projections;
};

const calculateOccurrences = (
  pattern: RecurrencePattern,
  startDate: string,
  endDate: string
): string[] => {
  const dates: string[] = [];
  let currentDate = new Date(Math.max(
    new Date(pattern.start_date).getTime(),
    new Date(startDate).getTime()
  ));
  const end = new Date(Math.min(
    pattern.end_date ? new Date(pattern.end_date).getTime() : Infinity,
    new Date(endDate).getTime()
  ));

  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    
    // Calculate next occurrence based on frequency
    switch (pattern.frequency) {
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + pattern.interval);
        break;
      case 'quarterly':
        currentDate.setMonth(currentDate.getMonth() + (3 * pattern.interval));
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + pattern.interval);
        break;
      // Additional frequency handling...
    }
  }
  
  return dates;
};
```

#### Integration with Other Systems

```typescript
// Integration with invoice system
const generateInvoiceProjections = async (startDate: string, endDate: string) => {
  const { data: unpaidInvoices } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('status', 'sent')
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  return unpaidInvoices?.map(invoice => ({
    id: `invoice-projection-${invoice.id}`,
    user_id: invoice.user_id,
    date: estimatePaymentDate(invoice.due_date, invoice.clients?.payment_terms),
    amount: invoice.total_amount,
    type: 'income' as const,
    category: 'Client Payment',
    description: `Invoice ${invoice.invoice_number} - ${invoice.clients?.name}`,
    is_recurring: false,
    source_type: 'invoice' as const,
    source_id: invoice.id,
    status: 'projected' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })) || [];
};

// Integration with tax system
const generateTaxProjections = async (year: number) => {
  const taxEntries = await supabase
    .from('tax_entries')
    .select('*')
    .eq('year', year)
    .eq('status', 'pending');

  return taxEntries.data?.map(taxEntry => ({
    id: `tax-projection-${taxEntry.id}`,
    user_id: taxEntry.user_id,
    date: taxEntry.due_date,
    amount: -taxEntry.amount, // Negative for expense
    type: 'expense' as const,
    category: 'Tax Payment',
    description: taxEntry.description,
    is_recurring: false,
    source_type: 'tax' as const,
    source_id: taxEntry.id,
    status: 'projected' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })) || [];
};
```

### Performance Considerations

#### Caching Strategy

```typescript
// Cache monthly calculations
const useCachedProjections = () => {
  const [cache, setCache] = useState<Map<string, CashFlowProjection[]>>(new Map());
  
  const getCachedProjections = (cacheKey: string) => {
    return cache.get(cacheKey);
  };
  
  const setCachedProjections = (cacheKey: string, data: CashFlowProjection[]) => {
    setCache(prev => new Map(prev.set(cacheKey, data)));
  };
  
  const invalidateCache = (pattern?: string) => {
    if (pattern) {
      const keysToDelete = Array.from(cache.keys()).filter(key => 
        key.includes(pattern)
      );
      keysToDelete.forEach(key => cache.delete(key));
    } else {
      cache.clear();
    }
    setCache(new Map(cache));
  };
  
  return { getCachedProjections, setCachedProjections, invalidateCache };
};
```

#### Bulk Calculations

```typescript
// Efficient monthly aggregation with business start date handling
const calculateMonthlyProjections = (
  confirmedEntries: CashFlowEntry[],
  projectedEntries: CashFlowEntry[]
): CashFlowProjection[] => {
  const businessStartMonth = '2025-09'; // Business started September 2025
  const allEntries = [...confirmedEntries, ...projectedEntries];
  
  // Filter out entries before business start date
  const validEntries = allEntries.filter(entry => {
    const entryMonth = format(new Date(entry.date), 'yyyy-MM');
    return entryMonth >= businessStartMonth;
  });
  
  const monthlyGroups = groupBy(validEntries, entry => 
    format(new Date(entry.date), 'yyyy-MM')
  );
  
  let runningBalance = 0; // Start with 0, will be set to initial balance for business start month
  
  return Object.entries(monthlyGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, entries]) => {
      const income = entries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
        
      const expenses = entries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      
      const netFlow = income - expenses;
      
      // Set initial balance for business start month
      if (month === businessStartMonth && runningBalance === 0) {
        runningBalance = 50000; // Initial business balance
      }
      
      const openingBalance = runningBalance;
      runningBalance += netFlow;
      
      return {
        month,
        opening_balance: openingBalance,
        total_income: income,
        total_expenses: expenses,
        net_flow: netFlow,
        closing_balance: runningBalance,
        is_projection: entries.some(e => e.status === 'projected')
      };
    });
};
```

### Accessibility & User Experience

#### Keyboard Navigation

```typescript
// Chart keyboard navigation
const ChartKeyboardNavigation = () => {
  const [selectedDataPoint, setSelectedDataPoint] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          setSelectedDataPoint(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setSelectedDataPoint(prev => Math.min(data.length - 1, prev + 1));
          break;
        case 'Enter':
          // Announce selected data point details
          announceDataPoint(data[selectedDataPoint]);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [data]);
};
```

#### Screen Reader Support

```typescript
// Data table with proper ARIA labels
<Table role="table" aria-label="Monthly cash flow projections">
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Month</TableHead>
      <TableHead scope="col">Opening Balance</TableHead>
      <TableHead scope="col">Income</TableHead>
      <TableHead scope="col">Expenses</TableHead>
      <TableHead scope="col">Net Flow</TableHead>
      <TableHead scope="col">Closing Balance</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {projections.map((projection) => (
      <TableRow key={projection.month}>
        <TableCell>
          <time dateTime={projection.month}>
            {format(new Date(projection.month), 'MMMM yyyy')}
          </time>
        </TableCell>
        <TableCell className="font-mono">
          {formatCurrency(projection.opening_balance)}
        </TableCell>
        {/* Additional cells with proper formatting */}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Testing Requirements

#### Unit Tests

```typescript
describe('Cash Flow Calculations', () => {
  it('calculates monthly projections correctly');
  it('handles recurring entries properly');
  it('integrates invoice projections');
  it('generates tax payment projections');
  it('maintains running balance accuracy');
});

describe('Cash Flow UI Components', () => {
  it('renders chart with correct data');
  it('responds to timeframe changes');
  it('exports data correctly');
  it('handles loading states');
});
```

#### Integration Tests

```typescript
describe('Cash Flow System Integration', () => {
  it('updates projections when invoices change');
  it('reflects tax calculations in projections');
  it('handles salary payment integration');
  it('maintains data consistency across features');
});
```

---

This specification ensures the Cash Flow feature provides comprehensive financial planning capabilities while maintaining data accuracy and user experience consistency across the application.