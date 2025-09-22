# API Architecture & Integration Patterns

**Spec ID:** 016-A  
**Status:** Comprehensive  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

This document provides comprehensive documentation of the API architecture, data access patterns, and integration strategies used in the Consultant Time Tracking application. The system follows a client-side architecture with Supabase as the backend-as-a-service, implementing sophisticated patterns for data management, real-time updates, and external integrations.

## Architecture Overview

### Technology Stack

**Frontend Architecture:**
- **React 18** with TypeScript for type safety
- **Custom Hooks Pattern** for data fetching and state management
- **Supabase Client** for database operations and authentication
- **Real-time Subscriptions** for live data updates
- **Local Storage Fallbacks** for offline resilience

**Backend Services:**
- **Supabase PostgreSQL** with Row Level Security (RLS)
- **Supabase Auth** for user management and JWT tokens
- **External APIs** (Fortnox, MongoDB monitoring)
- **Serverless Functions** for specialized operations

### Data Flow Architecture

```
Client Application
    ├── Custom Hooks (Data Layer)
    │   ├── useAuth() ──────────── Supabase Auth
    │   ├── useTimeEntries() ───── time_entries table
    │   ├── useCashFlow() ──────── cash_flow_entries table
    │   ├── useProjects() ──────── projects table
    │   └── useSettings() ──────── user_profiles + monthly_settings
    │
    ├── Real-time Subscriptions ── Supabase Realtime
    ├── Local Storage Caching ──── Offline Support
    └── External Integrations
        ├── Fortnox API ────────── Invoice Export
        ├── MongoDB Monitor ────── Uptime Monitoring
        └── Future APIs ────────── Extensible Pattern
```

## Custom Hooks Architecture

### Core Data Management Pattern

All data operations follow a consistent custom hooks pattern that provides:

- **Centralized State Management** - Single source of truth per data type
- **Automatic Loading States** - Built-in loading, error, and success states
- **Real-time Updates** - Supabase subscriptions for live data
- **Optimistic Updates** - Immediate UI updates with rollback on failure
- **Error Handling** - Consistent error reporting and recovery

#### Standard Hook Structure

```typescript
// Standard hook pattern used throughout the application
export function useDataType() {
  // State Management
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Data Fetching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data || []);
      
      // Cache to localStorage for offline support
      localStorage.setItem(`cache_${user.id}_table_name`, JSON.stringify(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Load from cache if available
      const cached = localStorage.getItem(`cache_${user.id}_table_name`);
      if (cached) {
        setData(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Real-time Subscriptions
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`table_name_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'table_name',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Handle real-time updates
        handleRealtimeUpdate(payload);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user?.id]);

  // CRUD Operations
  const createItem = async (itemData: CreateItemData) => {
    try {
      // Optimistic update
      const tempId = `temp_${Date.now()}`;
      const optimisticItem = { ...itemData, id: tempId, user_id: user.id };
      setData(prev => [optimisticItem, ...prev]);

      const { data, error } = await supabase
        .from('table_name')
        .insert({
          ...itemData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic update with real data
      setData(prev => prev.map(item => 
        item.id === tempId ? data : item
      ));

      return data;
    } catch (err) {
      // Rollback optimistic update
      setData(prev => prev.filter(item => !item.id.startsWith('temp_')));
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refetch: fetchData
  };
}
```

### Authentication Hook (`useAuth`)

**Purpose:** Centralized authentication state management with Supabase Auth

```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Session Management
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Authentication Methods
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Profile Management
  const getUserProfile = async () => {
    if (!user?.id) return { data: null, error: new Error('No user') };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getUserProfile,
    updateUserProfile,
  };
}
```

**Key Features:**
- Automatic session restoration on app load
- Real-time auth state changes
- Profile management integration
- Password reset and update flows

### Time Tracking Hook (`useTimeEntries`)

**Purpose:** Manage time entries with project associations and real-time updates

```typescript
export function useTimeEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch with Project Joins
  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          project:projects(
            id,
            name,
            color,
            client:clients(
              id,
              name,
              company
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch time entries');
    } finally {
      setLoading(false);
    }
  };

  // Real-time Updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`time_entries_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'time_entries',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
          case 'INSERT':
            setEntries(prev => [newRecord, ...prev]);
            break;
          case 'UPDATE':
            setEntries(prev => prev.map(entry => 
              entry.id === newRecord.id ? newRecord : entry
            ));
            break;
          case 'DELETE':
            setEntries(prev => prev.filter(entry => entry.id !== oldRecord.id));
            break;
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user?.id]);

  return {
    entries,
    loading,
    error,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    refetch: fetchTimeEntries
  };
}
```

**Key Features:**
- Complex joins with projects and clients
- Real-time updates for collaborative environments
- Optimistic updates for better UX
- Automatic date sorting and filtering

### Cash Flow Management (`useCashFlow`)

**Purpose:** Financial transaction management with VAT calculations and recurring entries

```typescript
export function useCashFlow(userId: string | null) {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced Filtering and Aggregation
  const fetchEntries = useCallback(async (filters?: {
    type?: 'income' | 'expense';
    category?: string;
    dateRange?: { start: Date; end: Date };
  }) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('cash_flow_entries')
        .select(`
          *,
          project:projects(id, name, color),
          client:clients(id, name, company)
        `)
        .eq('user_id', userId);

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.dateRange) {
        query = query
          .gte('date', filters.dateRange.start.toISOString().split('T')[0])
          .lte('date', filters.dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cash flow entries');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // VAT Calculations
  const addEntry = async (entryData: CreateCashFlowEntry) => {
    try {
      // Calculate VAT if not provided
      let processedData = { ...entryData };
      
      if (!processedData.vat_amount && processedData.vat_rate > 0) {
        const amountExcludingVat = processedData.amount / (1 + processedData.vat_rate / 100);
        processedData.amount_excluding_vat = amountExcludingVat;
        processedData.vat_amount = processedData.amount - amountExcludingVat;
      }

      const { data, error } = await supabase
        .from('cash_flow_entries')
        .insert({
          ...processedData,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setEntries(prev => [data, ...prev]);
      
      // Trigger VAT recalculation if needed
      if (data.type === 'expense' || data.type === 'income') {
        updateCurrentVatCalculations().catch(console.warn);
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      throw err;
    }
  };

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries
  };
}
```

**Key Features:**
- Automatic VAT calculations
- Complex filtering and date range queries
- Integration with project and client data
- Support for recurring transactions

## External API Integration Patterns

### Fortnox Accounting Integration

**Purpose:** Export invoices to Fortnox accounting system

```typescript
class FortnoxService {
  private config: FortnoxConfig | null = null;

  configure(config: FortnoxConfig) {
    this.config = config;
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' = 'GET', 
    data?: Record<string, unknown>
  ) {
    if (!this.config) {
      throw new Error('Fortnox service not configured');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Access-Token': this.config.accessToken,
      'Client-Secret': this.config.clientSecret,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Fortnox API error (${response.status}): ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fortnox API request failed:', error);
      throw error;
    }
  }

  async exportInvoice(invoiceItems: InvoiceItem[]): Promise<FortnoxExportResult> {
    try {
      // Group items by client
      const clientGroups = invoiceItems.reduce((groups, item) => {
        const clientId = item.client_id;
        if (!groups[clientId]) groups[clientId] = [];
        groups[clientId].push(item);
        return groups;
      }, {} as Record<string, InvoiceItem[]>);

      const results: FortnoxExportResult[] = [];

      for (const [clientId, items] of Object.entries(clientGroups)) {
        const client = items[0].client;
        
        // Create or get customer
        const customer = await this.ensureCustomer({
          name: client.name,
          email: client.email,
          company: client.company,
          // ... other customer fields
        });

        // Create invoice
        const invoice = await this.createInvoice({
          CustomerNumber: customer.CustomerNumber,
          InvoiceDate: new Date().toISOString().split('T')[0],
          DueDate: this.calculateDueDate(client.payment_terms || 30),
          InvoiceRows: items.map(item => ({
            ArticleNumber: `SERVICE-${item.project_id}`,
            Description: item.description,
            Quantity: item.hours || 1,
            Price: item.hourly_rate || item.fixed_amount,
            Unit: item.hours ? 'tim' : 'st',
            VAT: 25 // Swedish standard VAT
          }))
        });

        results.push({
          success: true,
          invoiceNumber: invoice.DocumentNumber,
          fortnoxUrl: `https://apps.fortnox.se/invoice/${invoice.DocumentNumber}`,
          items: items.length
        });
      }

      return {
        success: true,
        results,
        totalInvoices: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }
}
```

### MongoDB Monitoring Integration

**Purpose:** Monitor external MongoDB databases for uptime and performance

```typescript
// Client-side monitoring hook
export function usePingMonitor() {
  const [targets, setTargets] = useState<PingTarget[]>([]);
  const [results, setResults] = useState<Map<string, PingResult>>(new Map());

  const pingMongoDB = useCallback(async (target: PingTarget) => {
    const startTime = performance.now();
    
    try {
      // Check for backend MongoDB monitoring service
      const mongodbApiEndpoint = import.meta.env.VITE_MONGODB_API_ENDPOINT;
      const webhookSecret = import.meta.env.VITE_MONGODB_WEBHOOK_SECRET;
      
      if (mongodbApiEndpoint && webhookSecret) {
        // Use real backend service
        const response = await fetch(mongodbApiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': webhookSecret
          },
          body: JSON.stringify({
            uri: target.url,
            database: target.mongodb_config?.database || 'digitalidag',
            collection: target.mongodb_config?.collection || 'partners',
            operation: target.mongodb_config?.operation || 'ping',
            query: target.mongodb_config?.query || '{}'
          })
        });
        
        const result = await response.json();
        const responseTime = performance.now() - startTime;
        
        if (response.ok && result.status === 'success') {
          return {
            responseTime: result.responseTime || responseTime,
            status: 'success',
            responseText: result.message
          };
        } else {
          return {
            responseTime: responseTime,
            status: 'failure',
            error: result.error || 'MongoDB API request failed',
            responseText: result.message
          };
        }
      } else {
        // Fallback to simulation for development
        return simulateMongoDBConnection(target);
      }
    } catch (error) {
      return {
        responseTime: performance.now() - startTime,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }, []);

  return {
    targets,
    results,
    pingMongoDB,
    addTarget,
    removeTarget
  };
}
```

## Real-time Data Synchronization

### Supabase Realtime Integration

**Pattern:** Consistent real-time updates across all data types

```typescript
// Generic real-time subscription pattern
const useRealtimeSubscription = <T>(
  tableName: string,
  userId: string,
  onUpdate: (payload: RealtimePayload<T>) => void
) => {
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`${tableName}_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: `user_id=eq.${userId}`
      }, onUpdate)
      .subscribe();

    return () => subscription.unsubscribe();
  }, [tableName, userId, onUpdate]);
};

// Usage in data hooks
const handleRealtimeUpdate = useCallback((payload: RealtimePayload<TimeEntry>) => {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  switch (eventType) {
    case 'INSERT':
      setEntries(prev => {
        // Avoid duplicates from optimistic updates
        const exists = prev.some(entry => entry.id === newRecord.id);
        if (exists) return prev;
        return [newRecord, ...prev];
      });
      break;
      
    case 'UPDATE':
      setEntries(prev => prev.map(entry => 
        entry.id === newRecord.id ? { ...entry, ...newRecord } : entry
      ));
      break;
      
    case 'DELETE':
      setEntries(prev => prev.filter(entry => entry.id !== oldRecord.id));
      break;
  }
}, []);
```

### Optimistic Updates Pattern

**Purpose:** Immediate UI feedback with automatic rollback on failure

```typescript
const createWithOptimisticUpdate = async (
  newItem: CreateItemData,
  setData: React.Dispatch<React.SetStateAction<Item[]>>
) => {
  // Generate temporary ID for optimistic update
  const tempId = `temp_${Date.now()}_${Math.random()}`;
  const optimisticItem: Item = {
    ...newItem,
    id: tempId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // 1. Immediate UI update (optimistic)
    setData(prev => [optimisticItem, ...prev]);

    // 2. Make API call
    const { data, error } = await supabase
      .from('table_name')
      .insert(newItem)
      .select()
      .single();

    if (error) throw error;

    // 3. Replace optimistic item with real data
    setData(prev => prev.map(item => 
      item.id === tempId ? data : item
    ));

    return data;
  } catch (error) {
    // 4. Rollback on failure
    setData(prev => prev.filter(item => item.id !== tempId));
    throw error;
  }
};
```

## Error Handling and Recovery

### Centralized Error Management

```typescript
// Global error context
interface ErrorContextType {
  errors: AppError[];
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

export const useErrorContext = () => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: AppError) => {
    const errorWithId = {
      ...error,
      id: error.id || `error_${Date.now()}`,
      timestamp: new Date()
    };

    setErrors(prev => [...prev, errorWithId]);

    // Auto-remove after timeout
    if (error.autoRemove !== false) {
      setTimeout(() => {
        removeError(errorWithId.id);
      }, error.timeout || 5000);
    }
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  return {
    errors,
    addError,
    removeError,
    clearErrors: () => setErrors([])
  };
};

// Error boundary for React components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    // Log to error reporting service
    if (import.meta.env.PROD) {
      // Analytics/monitoring service integration
      trackError(error, { errorInfo, timestamp: new Date() });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="text-gray-600">
              We've been notified and are working on a fix.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Network Error Recovery

```typescript
// Retry mechanism for failed requests
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
};

// Usage in data hooks
const fetchWithRetry = useCallback(async () => {
  try {
    await withRetry(async () => {
      const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setData(data || []);
    }, 3, 1000);
  } catch (error) {
    // Final fallback to cached data
    const cached = localStorage.getItem(`cache_${user.id}_table_name`);
    if (cached) {
      setData(JSON.parse(cached));
      addError({
        type: 'warning',
        message: 'Using cached data due to network issues',
        details: 'Some data may be outdated. Check your connection.'
      });
    } else {
      setError(error instanceof Error ? error.message : 'Failed to load data');
    }
  }
}, [user?.id]);
```

## Performance Optimization Patterns

### Data Pagination and Lazy Loading

```typescript
// Infinite scroll hook for large datasets
export function useInfiniteScroll<T>(
  fetchFn: (offset: number, limit: number) => Promise<T[]>,
  pageSize: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newData = await fetchFn(offset, pageSize);
      
      if (newData.length < pageSize) {
        setHasMore(false);
      }

      setData(prev => [...prev, ...newData]);
      setOffset(prev => prev + pageSize);
    } catch (error) {
      console.error('Failed to load more data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, offset, pageSize, loading, hasMore]);

  return {
    data,
    loading,
    hasMore,
    loadMore
  };
}
```

### Data Caching Strategy

```typescript
// Intelligent caching with TTL
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const dataCache = new DataCache();

// Usage in hooks
const fetchDataWithCache = useCallback(async (cacheKey: string) => {
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached) {
    setData(cached);
    setLoading(false);
    return;
  }

  // Fetch from API
  const { data, error } = await supabase
    .from('table_name')
    .select('*');

  if (error) throw error;

  // Cache the result
  dataCache.set(cacheKey, data, 5 * 60 * 1000);
  setData(data || []);
}, []);
```

## Security and Data Protection

### Row Level Security (RLS) Integration

```typescript
// RLS-aware query patterns
const secureQuery = async (tableName: string, userId: string) => {
  // RLS automatically filters by user_id, but we include it for clarity
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId); // Redundant but explicit

  if (error) {
    // Handle RLS policy violations
    if (error.code === 'PGRST301') {
      throw new Error('Access denied: insufficient permissions');
    }
    throw error;
  }

  return data;
};
```

### Data Encryption for Sensitive Information

```typescript
// Client-side encryption for sensitive documents
class EncryptionService {
  async encryptSensitiveContent(content: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      
      // Generate salt
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Derive key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );
      
      // Combine salt + iv + encrypted data
      const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      return btoa(String.fromCharCode.apply(null, Array.from(result)));
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  async decryptSensitiveContent(encryptedContent: string, password: string): Promise<string> {
    try {
      const data = new Uint8Array(
        atob(encryptedContent)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      
      // Extract salt, iv, and encrypted data
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);
      
      // Derive key
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }
}
```

## Testing and Development Patterns

### Mock Data Providers

```typescript
// Mock data for development and testing
export class MockDataProvider {
  static createMockUser(): User {
    return {
      id: 'mock-user-id',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      // ... other user properties
    };
  }

  static createMockTimeEntries(count: number = 10): TimeEntry[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `mock-entry-${index}`,
      user_id: 'mock-user-id',
      project_id: `mock-project-${index % 3}`,
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hours: Math.random() * 8 + 1,
      comment: `Mock work on task ${index + 1}`,
      is_billable: Math.random() > 0.2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project: MockDataProvider.createMockProject()
    }));
  }

  static createMockProject(): Project {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    return {
      id: 'mock-project-id',
      user_id: 'mock-user-id',
      name: 'Mock Project',
      color: colors[Math.floor(Math.random() * colors.length)],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// Development mode data injection
const useMockData = () => {
  const isDevelopment = import.meta.env.DEV;
  const enableMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  
  return isDevelopment && enableMockData;
};
```

---

This API architecture documentation provides a comprehensive overview of the data access patterns, integration strategies, and best practices used throughout the consultant time tracking application. The system's modular hook-based architecture enables maintainable, testable, and scalable code while providing excellent user experience through optimistic updates and real-time synchronization.