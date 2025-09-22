# Testing Strategy Documentation

**Spec ID:** 019-A  
**Status:** Comprehensive  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

This document outlines the comprehensive testing strategy for the Consultant Time Tracking application. The testing approach includes unit testing, integration testing, end-to-end testing, performance testing, and security testing to ensure application reliability and quality.

## Testing Philosophy

### Testing Pyramid

```text
Testing Strategy Pyramid
├── Unit Tests (70%)
│   ├── Component Testing
│   ├── Hook Testing
│   ├── Utility Function Testing
│   └── Business Logic Testing
│
├── Integration Tests (20%)
│   ├── API Integration Testing
│   ├── Database Integration Testing
│   ├── Component Integration Testing
│   └── External Service Testing
│
├── End-to-End Tests (10%)
│   ├── User Journey Testing
│   ├── Critical Path Testing
│   ├── Browser Compatibility Testing
│   └── Performance Testing
│
└── Specialized Testing
    ├── Security Testing
    ├── Accessibility Testing
    ├── Visual Regression Testing
    └── Load Testing
```

### Testing Principles

**Coverage Goals:**

- Unit Tests: 80%+ code coverage
- Integration Tests: Cover all API endpoints
- E2E Tests: Cover critical user journeys
- Performance: All pages load under 2 seconds

**Quality Gates:**

- All tests must pass before deployment
- No critical security vulnerabilities
- Performance budgets met
- Accessibility standards (WCAG 2.1 AA) compliance

## Unit Testing Framework

### Test Configuration

**Vitest Setup:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
    },
  },
});
```

**Test Setup:**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock environment variables
vi.mock('@/config/environment', () => ({
  getEnvironmentConfig: () => ({
    supabase: {
      url: 'http://localhost:54321',
      anonKey: 'test-anon-key',
    },
    features: {
      enableDebugMode: true,
      enableBetaFeatures: false,
      enableAnalytics: false,
    },
  }),
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  })),
}));

// Mock window APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto API for encryption tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      importKey: vi.fn(),
      deriveKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
    },
  },
});
```

### Component Testing

**Component Test Utilities:**

```typescript
// src/test/utils/render.tsx
import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

// Create test wrapper with all providers
const createWrapper = (options: CustomRenderOptions = {}) => {
  const { initialEntries = ['/'], queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }) } = options;

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function
export const render = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const Wrapper = createWrapper(options);
  return rtlRender(ui, { wrapper: Wrapper, ...options });
};

// Export everything from testing-library
export * from '@testing-library/react';
```

**Component Test Examples:**

```typescript
// src/components/dashboard/widgets/__tests__/TimeEntriesWidget.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/render';
import { TimeEntriesWidget } from '../TimeEntriesWidget';
import { useTimeEntries } from '@/hooks/useTimeEntries';

// Mock the hook
vi.mock('@/hooks/useTimeEntries');

const mockUseTimeEntries = vi.mocked(useTimeEntries);

const mockTimeEntries = [
  {
    id: '1',
    project_id: 'project-1',
    user_id: 'user-1',
    date: '2025-09-22',
    start_time: '09:00',
    end_time: '17:00',
    hours: 8,
    description: 'Development work',
    entry_type: 'work' as const,
    created_at: '2025-09-22T09:00:00Z',
    updated_at: '2025-09-22T17:00:00Z',
  },
];

describe('TimeEntriesWidget', () => {
  beforeEach(() => {
    mockUseTimeEntries.mockReturnValue({
      data: mockTimeEntries,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      addTimeEntry: vi.fn(),
      updateTimeEntry: vi.fn(),
      deleteTimeEntry: vi.fn(),
    });
  });

  it('renders time entries correctly', () => {
    render(<TimeEntriesWidget />);
    
    expect(screen.getByText('Recent Time Entries')).toBeInTheDocument();
    expect(screen.getByText('Development work')).toBeInTheDocument();
    expect(screen.getByText('8.0 hours')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseTimeEntries.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      addTimeEntry: vi.fn(),
      updateTimeEntry: vi.fn(),
      deleteTimeEntry: vi.fn(),
    });

    render(<TimeEntriesWidget />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load time entries';
    mockUseTimeEntries.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error(errorMessage),
      refetch: vi.fn(),
      addTimeEntry: vi.fn(),
      updateTimeEntry: vi.fn(),
      deleteTimeEntry: vi.fn(),
    });

    render(<TimeEntriesWidget />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('calls addTimeEntry when adding new entry', async () => {
    const mockAddTimeEntry = vi.fn();
    mockUseTimeEntries.mockReturnValue({
      data: mockTimeEntries,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      addTimeEntry: mockAddTimeEntry,
      updateTimeEntry: vi.fn(),
      deleteTimeEntry: vi.fn(),
    });

    render(<TimeEntriesWidget />);
    
    // Open add entry form
    fireEvent.click(screen.getByText('Add Entry'));
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New task' },
    });
    fireEvent.change(screen.getByLabelText('Hours'), {
      target: { value: '4' },
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Save Entry'));
    
    await waitFor(() => {
      expect(mockAddTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'New task',
          hours: 4,
        })
      );
    });
  });

  it('filters entries by date range', () => {
    render(<TimeEntriesWidget />);
    
    // Test date filter functionality
    const dateFilter = screen.getByLabelText('Filter by date');
    fireEvent.change(dateFilter, { target: { value: '2025-09-22' } });
    
    // Verify filtered results
    expect(screen.getByText('Development work')).toBeInTheDocument();
  });

  it('handles empty state correctly', () => {
    mockUseTimeEntries.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      addTimeEntry: vi.fn(),
      updateTimeEntry: vi.fn(),
      deleteTimeEntry: vi.fn(),
    });

    render(<TimeEntriesWidget />);
    
    expect(screen.getByText('No time entries found')).toBeInTheDocument();
    expect(screen.getByText('Start tracking your time')).toBeInTheDocument();
  });
});
```

### Hook Testing

**Custom Hook Test Utilities:**

```typescript
// src/test/utils/hook-wrapper.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

export const createHookWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};
```

**Hook Test Examples:**

```typescript
// src/hooks/__tests__/useTimeEntries.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTimeEntries } from '../useTimeEntries';
import { createHookWrapper } from '@/test/utils/hook-wrapper';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

const mockSupabase = vi.mocked(supabase);

describe('useTimeEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches time entries successfully', async () => {
    const mockData = [
      {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        date: '2025-09-22',
        hours: 8,
        description: 'Development work',
        entry_type: 'work',
      },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    } as any);

    const { result } = renderHook(() => useTimeEntries(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    const mockError = new Error('Database connection failed');

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    } as any);

    const { result } = renderHook(() => useTimeEntries(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('adds time entry successfully', async () => {
    const newEntry = {
      project_id: 'project-1',
      date: '2025-09-22',
      hours: 4,
      description: 'Testing work',
      entry_type: 'work' as const,
    };

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: [{ id: '2', ...newEntry }], error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);

    const { result } = renderHook(() => useTimeEntries(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.addTimeEntry(newEntry);

    expect(mockSupabase.from).toHaveBeenCalledWith('time_entries');
  });

  it('handles real-time updates', async () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };

    mockSupabase.channel.mockReturnValue(mockChannel);

    renderHook(() => useTimeEntries(), {
      wrapper: createHookWrapper(),
    });

    expect(mockSupabase.channel).toHaveBeenCalledWith('time_entries');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'time_entries' },
      expect.any(Function)
    );
  });
});
```

### Utility Function Testing

```typescript
// src/utils/__tests__/dateUtils.test.ts
import { describe, it, expect } from 'vitest';
import {
  formatDate,
  parseTimeEntry,
  calculateDuration,
  getWeekDates,
  isValidTimeRange,
} from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-09-22T10:30:00Z');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2025-09-22');
      expect(formatDate(date, 'MMM d, yyyy')).toBe('Sep 22, 2025');
    });

    it('handles invalid dates', () => {
      expect(formatDate(new Date('invalid'), 'yyyy-MM-dd')).toBe('Invalid Date');
    });
  });

  describe('parseTimeEntry', () => {
    it('parses time string correctly', () => {
      expect(parseTimeEntry('09:30')).toEqual({ hours: 9, minutes: 30 });
      expect(parseTimeEntry('23:59')).toEqual({ hours: 23, minutes: 59 });
    });

    it('handles invalid time formats', () => {
      expect(parseTimeEntry('invalid')).toBeNull();
      expect(parseTimeEntry('25:00')).toBeNull();
      expect(parseTimeEntry('12:60')).toBeNull();
    });
  });

  describe('calculateDuration', () => {
    it('calculates duration correctly', () => {
      expect(calculateDuration('09:00', '17:00')).toBe(8);
      expect(calculateDuration('09:30', '12:45')).toBe(3.25);
    });

    it('handles overnight duration', () => {
      expect(calculateDuration('23:00', '02:00')).toBe(3);
    });

    it('handles invalid inputs', () => {
      expect(calculateDuration('invalid', '12:00')).toBe(0);
      expect(calculateDuration('09:00', 'invalid')).toBe(0);
    });
  });

  describe('getWeekDates', () => {
    it('returns correct week dates', () => {
      const date = new Date('2025-09-22'); // Monday
      const weekDates = getWeekDates(date);
      
      expect(weekDates).toHaveLength(7);
      expect(weekDates[0].getDay()).toBe(1); // Monday
      expect(weekDates[6].getDay()).toBe(0); // Sunday
    });
  });

  describe('isValidTimeRange', () => {
    it('validates time ranges correctly', () => {
      expect(isValidTimeRange('09:00', '17:00')).toBe(true);
      expect(isValidTimeRange('09:00', '09:00')).toBe(false);
      expect(isValidTimeRange('17:00', '09:00')).toBe(false);
    });
  });
});
```

## Integration Testing

### API Integration Tests

```typescript
// src/test/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Use test Supabase instance
const supabase = createClient(
  process.env.VITE_TEST_SUPABASE_URL!,
  process.env.VITE_TEST_SUPABASE_ANON_KEY!
);

describe('API Integration Tests', () => {
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Create test user and project
    const { data: user } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456',
    });
    
    testUserId = user.user!.id;

    const { data: project } = await supabase
      .from('projects')
      .insert({
        name: 'Test Project',
        client_id: 'test-client-id',
        user_id: testUserId,
      })
      .select()
      .single();

    testProjectId = project.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('time_entries').delete().eq('user_id', testUserId);
    await supabase.from('projects').delete().eq('id', testProjectId);
    await supabase.auth.signOut();
  });

  describe('Time Entries API', () => {
    it('creates time entry successfully', async () => {
      const newEntry = {
        project_id: testProjectId,
        user_id: testUserId,
        date: '2025-09-22',
        start_time: '09:00',
        end_time: '17:00',
        hours: 8,
        description: 'Integration test work',
        entry_type: 'work',
      };

      const { data, error } = await supabase
        .from('time_entries')
        .insert(newEntry)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject(newEntry);
      expect(data.id).toBeDefined();
    });

    it('fetches time entries with filters', async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', testUserId)
        .eq('date', '2025-09-22');

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].description).toBe('Integration test work');
    });

    it('updates time entry', async () => {
      const { data: entries } = await supabase
        .from('time_entries')
        .select('id')
        .eq('user_id', testUserId)
        .limit(1);

      const entryId = entries![0].id;

      const { data, error } = await supabase
        .from('time_entries')
        .update({ description: 'Updated description' })
        .eq('id', entryId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.description).toBe('Updated description');
    });

    it('enforces RLS policies', async () => {
      // Try to access another user's data
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', 'different-user-id');

      expect(data).toHaveLength(0); // Should return empty due to RLS
    });
  });

  describe('Real-time Subscriptions', () => {
    it('receives real-time updates', async () => {
      return new Promise((resolve) => {
        const channel = supabase
          .channel('test-time-entries')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'time_entries',
              filter: `user_id=eq.${testUserId}`,
            },
            (payload) => {
              expect(payload.new).toMatchObject({
                description: 'Real-time test entry',
              });
              channel.unsubscribe();
              resolve(true);
            }
          )
          .subscribe();

        // Insert a new entry to trigger the subscription
        setTimeout(async () => {
          await supabase.from('time_entries').insert({
            project_id: testProjectId,
            user_id: testUserId,
            date: '2025-09-22',
            hours: 1,
            description: 'Real-time test entry',
            entry_type: 'work',
          });
        }, 100);
      });
    });
  });
});
```

### Component Integration Tests

```typescript
// src/test/integration/dashboard.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/render';
import { Dashboard } from '@/pages/Dashboard';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

describe('Dashboard Integration', () => {
  beforeEach(() => {
    // Reset MSW handlers
    server.resetHandlers();
  });

  it('loads and displays dashboard widgets', async () => {
    // Mock successful API responses
    server.use(
      rest.get('*/time_entries*', (req, res, ctx) => {
        return res(
          ctx.json({
            data: [
              {
                id: '1',
                description: 'Development work',
                hours: 8,
                date: '2025-09-22',
              },
            ],
          })
        );
      }),
      rest.get('*/cash_flow_entries*', (req, res, ctx) => {
        return res(
          ctx.json({
            data: [
              {
                id: '1',
                description: 'Invoice payment',
                amount: 5000,
                type: 'income',
              },
            ],
          })
        );
      })
    );

    render(<Dashboard />);

    // Wait for widgets to load
    await waitFor(() => {
      expect(screen.getByText('Development work')).toBeInTheDocument();
      expect(screen.getByText('Invoice payment')).toBeInTheDocument();
    });

    // Verify widget interactions
    const addWidgetButton = screen.getByText('Add Widget');
    fireEvent.click(addWidgetButton);

    expect(screen.getByText('Choose Widget Type')).toBeInTheDocument();
  });

  it('handles widget configuration', async () => {
    render(<Dashboard />);

    // Open widget configuration
    const configButton = screen.getByLabelText('Configure widget');
    fireEvent.click(configButton);

    // Update widget settings
    const sizeSelect = screen.getByLabelText('Widget size');
    fireEvent.change(sizeSelect, { target: { value: 'large' } });

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByText('Widget Configuration')).not.toBeInTheDocument();
    });
  });

  it('handles drag and drop reordering', async () => {
    render(<Dashboard />);

    // Wait for widgets to load
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });

    // Simulate drag and drop (simplified)
    const widget = screen.getByTestId('time-entries-widget');
    const targetPosition = screen.getByTestId('widget-drop-zone');

    fireEvent.dragStart(widget);
    fireEvent.dragOver(targetPosition);
    fireEvent.drop(targetPosition);

    await waitFor(() => {
      // Verify widget position changed
      expect(widget).toHaveAttribute('data-position', '1');
    });
  });
});
```

## End-to-End Testing

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up and sign in', async ({ page }) => {
    await page.goto('/');

    // Navigate to sign up
    await page.click('text=Sign Up');
    
    // Fill sign up form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.fill('[data-testid="confirm-password"]', 'TestPassword123!');
    
    // Submit form
    await page.click('[data-testid="signup-button"]');
    
    // Verify email confirmation message
    await expect(page.locator('text=Check your email')).toBeVisible();
    
    // Navigate to sign in (simulate email confirmation)
    await page.goto('/auth/signin');
    
    // Fill sign in form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    
    // Submit form
    await page.click('[data-testid="signin-button"]');
    
    // Verify successful sign in
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });

  test('handles invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    
    await page.click('[data-testid="signin-button"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('password reset flow', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.click('text=Forgot password?');
    
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.click('[data-testid="reset-button"]');
    
    await expect(page.locator('text=Reset link sent')).toBeVisible();
  });
});
```

```typescript
// e2e/time-tracking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Time Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="signin-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('creates a new time entry', async ({ page }) => {
    // Navigate to time entries
    await page.click('text=Time Tracking');
    
    // Open new entry form
    await page.click('[data-testid="add-time-entry"]');
    
    // Fill form
    await page.selectOption('[data-testid="project-select"]', 'project-1');
    await page.fill('[data-testid="description"]', 'E2E test work');
    await page.fill('[data-testid="date"]', '2025-09-22');
    await page.fill('[data-testid="start-time"]', '09:00');
    await page.fill('[data-testid="end-time"]', '17:00');
    
    // Submit form
    await page.click('[data-testid="save-entry"]');
    
    // Verify entry appears in list
    await expect(page.locator('text=E2E test work')).toBeVisible();
    await expect(page.locator('text=8.0 hours')).toBeVisible();
  });

  test('edits existing time entry', async ({ page }) => {
    await page.goto('/time-entries');
    
    // Click edit on first entry
    await page.locator('[data-testid="time-entry-item"]').first().hover();
    await page.click('[data-testid="edit-entry"]');
    
    // Update description
    await page.fill('[data-testid="description"]', 'Updated description');
    await page.click('[data-testid="save-entry"]');
    
    // Verify update
    await expect(page.locator('text=Updated description')).toBeVisible();
  });

  test('filters time entries by date', async ({ page }) => {
    await page.goto('/time-entries');
    
    // Set date filter
    await page.fill('[data-testid="date-filter"]', '2025-09-22');
    
    // Verify filtered results
    const entries = page.locator('[data-testid="time-entry-item"]');
    await expect(entries).toHaveCount(1);
  });

  test('time tracking timer functionality', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Start timer
    await page.click('[data-testid="start-timer"]');
    
    // Verify timer is running
    await expect(page.locator('[data-testid="timer-status"]')).toContainText('Running');
    
    // Stop timer
    await page.click('[data-testid="stop-timer"]');
    
    // Verify entry creation dialog
    await expect(page.locator('text=Save Time Entry')).toBeVisible();
  });
});
```

## Performance Testing

### Core Web Vitals Testing

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('meets Core Web Vitals thresholds', async ({ page }) => {
    // Navigate to main page
    await page.goto('/');
    
    // Measure page load performance
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {
            FCP: 0,
            LCP: 0,
            FID: 0,
            CLS: 0,
          };
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              metrics.FCP = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.LCP = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              metrics.FID = entry.processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              metrics.CLS += entry.value;
            }
          });
          
          resolve(metrics);
        });
        
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    // Assert Core Web Vitals thresholds
    expect(performanceMetrics.FCP).toBeLessThan(1800); // First Contentful Paint < 1.8s
    expect(performanceMetrics.LCP).toBeLessThan(2500); // Largest Contentful Paint < 2.5s
    expect(performanceMetrics.FID).toBeLessThan(100);  // First Input Delay < 100ms
    expect(performanceMetrics.CLS).toBeLessThan(0.1);  // Cumulative Layout Shift < 0.1
  });

  test('bundle size within limits', async ({ page }) => {
    // Navigate and wait for all resources
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Calculate total bundle size
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter(resource => resource.name.includes('.js') || resource.name.includes('.css'))
        .reduce((total, resource) => total + (resource.transferSize || 0), 0);
    });
    
    // Assert bundle size is under 500KB
    expect(resourceSizes).toBeLessThan(500 * 1024);
  });

  test('database query performance', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Measure dashboard load time
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="dashboard-loaded"]');
    const loadTime = Date.now() - startTime;
    
    // Assert dashboard loads within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });
});
```

### Load Testing

```typescript
// scripts/load-test.ts
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete within 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be less than 10%
  },
};

const BASE_URL = 'https://your-app.vercel.app';

export default function () {
  // Test homepage
  const homeResponse = http.get(`${BASE_URL}/`);
  check(homeResponse, {
    'Homepage status is 200': (r) => r.status === 200,
    'Homepage loads within 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // Test API endpoints (with authentication)
  const authHeaders = {
    'Authorization': `Bearer ${__ENV.TEST_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const timeEntriesResponse = http.get(`${BASE_URL}/api/time-entries`, {
    headers: authHeaders,
  });
  check(timeEntriesResponse, {
    'Time entries API status is 200': (r) => r.status === 200,
    'Time entries API responds within 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test creating time entry
  const newEntry = {
    project_id: 'test-project',
    date: '2025-09-22',
    hours: 8,
    description: 'Load test entry',
    entry_type: 'work',
  };

  const createResponse = http.post(
    `${BASE_URL}/api/time-entries`,
    JSON.stringify(newEntry),
    { headers: authHeaders }
  );
  check(createResponse, {
    'Create time entry status is 201': (r) => r.status === 201,
    'Create time entry responds within 1s': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}
```

## Accessibility Testing

### Automated Accessibility Tests

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('dashboard meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Navigate through main elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
    
    // Test escape key functionality
    await page.click('[data-testid="add-widget-button"]');
    await expect(page.locator('[data-testid="widget-dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="widget-dialog"]')).not.toBeVisible();
  });

  test('screen reader compatibility', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for proper ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || textContent).toBeTruthy();
    }
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    expect(headingCount).toBeGreaterThan(0);
    
    // Verify main heading exists
    await expect(page.locator('h1')).toBeVisible();
  });

  test('color contrast meets standards', async ({ page }) => {
    await page.goto('/dashboard');
    
    const contrastResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include(['color-contrast'])
      .analyze();
    
    expect(contrastResults.violations).toEqual([]);
  });
});
```

## Visual Regression Testing

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('dashboard visual consistency', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid="current-time"],
        [data-testid="last-updated"] {
          visibility: hidden;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('dashboard.png');
  });

  test('responsive design consistency', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 },   // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`dashboard-${viewport.width}x${viewport.height}.png`);
    }
  });

  test('component visual consistency', async ({ page }) => {
    await page.goto('/components'); // Storybook or component showcase
    
    const components = [
      'time-entries-widget',
      'cash-flow-widget',
      'project-summary-widget',
    ];
    
    for (const component of components) {
      const element = page.locator(`[data-testid="${component}"]`);
      await expect(element).toHaveScreenshot(`${component}.png`);
    }
  });
});
```

## Test Data Management

### Test Database Setup

```typescript
// src/test/fixtures/database.ts
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.VITE_TEST_SUPABASE_URL!,
  process.env.VITE_TEST_SUPABASE_SERVICE_KEY!
);

export const createTestUser = async (email: string, password: string) => {
  const { data, error } = await testSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (error) throw error;
  return data.user;
};

export const createTestProject = async (userId: string, name: string) => {
  const { data, error } = await testSupabase
    .from('projects')
    .insert({
      name,
      user_id: userId,
      status: 'active',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const cleanupTestData = async (userId: string) => {
  await testSupabase.from('time_entries').delete().eq('user_id', userId);
  await testSupabase.from('projects').delete().eq('user_id', userId);
  await testSupabase.auth.admin.deleteUser(userId);
};

export const seedTestData = async (userId: string) => {
  // Create test projects
  const projects = await Promise.all([
    createTestProject(userId, 'Test Project 1'),
    createTestProject(userId, 'Test Project 2'),
  ]);

  // Create test time entries
  const timeEntries = await testSupabase
    .from('time_entries')
    .insert([
      {
        project_id: projects[0].id,
        user_id: userId,
        date: '2025-09-22',
        hours: 8,
        description: 'Development work',
        entry_type: 'work',
      },
      {
        project_id: projects[1].id,
        user_id: userId,
        date: '2025-09-21',
        hours: 4,
        description: 'Meeting',
        entry_type: 'meeting',
      },
    ])
    .select();

  return { projects, timeEntries: timeEntries.data };
};
```

### Mock Service Worker Setup

```typescript
// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const handlers = [
  // Time entries API
  rest.get('*/time_entries*', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: '1',
            project_id: 'project-1',
            user_id: 'user-1',
            date: '2025-09-22',
            hours: 8,
            description: 'Mock development work',
            entry_type: 'work',
          },
        ],
      })
    );
  }),
  
  rest.post('*/time_entries', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: {
          id: 'new-entry-id',
          ...req.body,
        },
      })
    );
  }),
  
  // Projects API
  rest.get('*/projects*', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: 'project-1',
            name: 'Mock Project',
            client_id: 'client-1',
            status: 'active',
          },
        ],
      })
    );
  }),
  
  // Auth API
  rest.post('*/auth/v1/token*', (req, res, ctx) => {
    return res(
      ctx.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
        },
      })
    );
  }),
];

export const server = setupServer(...handlers);
```

---

This comprehensive testing strategy documentation provides a solid foundation for ensuring the quality and reliability of the consultant time tracking application through automated testing at all levels.
