# Architecture Specification

**Spec ID:** 002  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

This specification defines the architectural patterns, technology stack implementation, and development standards for the Consultant Time Tracking System.

## Technology Stack Details

### React & TypeScript Configuration

#### React 18 Setup

```typescript
// Main App Structure
interface AppProps {
  children?: React.ReactNode;
}

// Strict TypeScript Configuration
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

#### Component Patterns

```typescript
// Standard Component Interface
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  // Feature-specific props...
}

// Hook Pattern
export const useFeature = () => {
  const [state, setState] = useState<FeatureState>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  return { state, loading, error, actions };
};
```

### ShadCN/UI Implementation

#### Core Components Used

- **Button** - Primary actions and interactions
- **Input** - Form data entry
- **Dialog** - Modal interactions
- **Card** - Content grouping
- **Table** - Data display
- **Select** - Option selection
- **Textarea** - Multi-line text input
- **Switch** - Boolean toggles
- **Toast** - Notifications

#### Component Customization Pattern

```typescript
// Standard component extension
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const CustomButton = ({ className, variant, size, ...props }: CustomButtonProps) => {
  return (
    <Button
      className={cn("custom-button-styles", className)}
      variant={variant}
      size={size}
      {...props}
    />
  );
};
```

### Routing Architecture

#### React Router Setup

```typescript
// App.tsx routing structure
<Router>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/time-tracking" element={<TimeTracking />} />
    <Route path="/budget" element={<Budget />} />
    <Route path="/cash-flow" element={<CashFlow />} />
    <Route path="/projects" element={<Projects />} />
    <Route path="/clients" element={<Clients />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/salary" element={<Salary />} />
    <Route path="/cv-manager" element={<CVManager />} />
    <Route path="/invoicing" element={<Invoicing />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Router>
```

#### Navigation Patterns

```typescript
// Programmatic navigation
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Standard navigation
navigate('/clients');

// Navigation with state
navigate('/invoicing', { state: { clientId: 'client-123' } });
```

### State Management Patterns

#### Context API Implementation

```typescript
// Modal Context Example
interface ModalContextType {
  expenseModalOpen: boolean;
  setExpenseModalOpen: (open: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};
```

#### Custom Hooks Pattern

```typescript
// Business logic hooks
export const useVatCalculations = () => {
  const [calculations, setCalculations] = useState<VatCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  
  const calculateYearlyVat = useCallback(async (year: number) => {
    setLoading(true);
    try {
      // Business logic implementation
      const result = await performVatCalculation(year);
      setCalculations(result);
    } catch (error) {
      console.error('VAT calculation failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { calculations, loading, calculateYearlyVat };
};
```

## File Organization Standards

### Directory Structure

```
src/
├── components/
│   ├── ui/                    # ShadCN base components
│   ├── layout/                # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MainLayout.tsx
│   │   └── SmartSearch.tsx
│   ├── budget/                # Feature components
│   ├── invoicing/
│   └── time-tracking/
├── pages/                     # Route components
├── hooks/                     # Custom hooks
├── contexts/                  # React contexts
├── lib/                       # Utilities
├── types/                     # TypeScript definitions
└── styles/                    # Global styles
```

### Naming Conventions

#### Files
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.ts`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Types**: PascalCase (`UserTypes.ts`)

#### Variables & Functions
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Variables**: camelCase (`userProfile`)
- **Functions**: camelCase (`calculateTax`)
- **Components**: PascalCase (`UserCard`)

### Import Organization

```typescript
// External libraries first
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal imports - UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Internal imports - Feature components
import { UserCard } from '@/components/UserCard';

// Internal imports - Hooks and utilities
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';

// Internal imports - Types
import type { User } from '@/types/UserTypes';
```

## Database Integration

### Supabase Configuration

```typescript
// Client setup
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Data Fetching Patterns

```typescript
// Standard data fetching hook
export const useSupabaseQuery = <T>(
  table: string,
  query?: string,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let queryBuilder = supabase.from(table).select(query || '*');
        
        const { data, error } = await queryBuilder;
        
        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};
```

## Error Handling Standards

### Error Boundary Implementation

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### Async Error Handling

```typescript
// Standard async operation with error handling
const handleAsyncOperation = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await performOperation();
    
    // Success handling
    setData(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed';
    setError(errorMessage);
    
    // Optional: Toast notification
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

## Performance Standards

### Component Optimization

```typescript
// Memoization patterns
const ExpensiveComponent = React.memo(({ data, onUpdate }: Props) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransformation(item));
  }, [data]);

  const handleUpdate = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);

  return <div>{/* Render optimized content */}</div>;
});
```

### Bundle Optimization

```typescript
// Lazy loading for routes
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const TimeTracking = lazy(() => import('@/pages/TimeTracking'));

// Code splitting usage
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/time-tracking" element={<TimeTracking />} />
  </Routes>
</Suspense>
```

## Testing Standards

### Component Testing

```typescript
// Standard component test structure
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Testing

```typescript
// Custom hook testing
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter Hook', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

## Development Workflow

### Code Quality Gates

1. **TypeScript Compilation** - No type errors allowed
2. **ESLint Validation** - Code style enforcement
3. **Unit Tests** - Component and hook testing
4. **Integration Tests** - Feature workflow validation

### Build Process

```bash
# Development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test

# Production build
npm run build
```

---

This architecture specification ensures consistent development patterns and maintainable code structure across the entire application.