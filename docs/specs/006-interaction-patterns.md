# Interaction Patterns Specification

**Spec ID:** 006  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

This specification defines the user interaction patterns, keyboard shortcuts, navigation behaviors, and feedback mechanisms that create a consistent and efficient user experience across the Consultant Time Tracking System.

## Navigation Patterns

### Primary Navigation

#### Smart Search (⌘K)
- **Trigger**: ⌘K (Cmd+K) or Ctrl+K from anywhere
- **Behavior**: Focus search input, show contextual help
- **Usage**: Primary method for navigation and quick actions
- **Fallback**: Header search input always available

#### Sidebar Navigation
- **Structure**: Hierarchical menu with clear visual hierarchy
- **Behavior**: Persistent navigation for secondary access
- **States**: Active page highlighted, hover states for discovery
- **Mobile**: Collapsible drawer on smaller screens

#### Breadcrumb Navigation
- **Usage**: Context awareness for deep navigation
- **Behavior**: Clickable path segments for quick backtracking
- **Display**: Show current location in application hierarchy

### Secondary Navigation

#### Tab Navigation
```typescript
// Tab pattern for related content
<Tabs defaultValue="overview" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    {/* Overview content */}
  </TabsContent>
  {/* Additional tab content */}
</Tabs>
```

#### Pagination
```typescript
// Standard pagination pattern
<div className="flex items-center justify-between">
  <div className="text-sm text-muted-foreground">
    Showing 1-10 of 247 results
  </div>
  <div className="flex items-center space-x-2">
    <Button variant="outline" size="sm" disabled={currentPage === 1}>
      Previous
    </Button>
    <Button variant="outline" size="sm">
      Next
    </Button>
  </div>
</div>
```

## Keyboard Shortcuts

### Global Shortcuts

```typescript
// Application-wide shortcuts
'⌘K' | 'Ctrl+K'     → Open Smart Search
'⌘D' | 'Ctrl+D'     → Dashboard (when search focused)
'⌘N' | 'Ctrl+N'     → Quick create (context dependent)
'⌘S' | 'Ctrl+S'     → Save current form
'Escape'            → Close modals/dropdowns
'⌘/' | 'Ctrl+/'     → Show keyboard shortcuts help
```

### Form Shortcuts

```typescript
// Form interaction shortcuts
'Tab'               → Next field
'Shift+Tab'         → Previous field
'Enter'             → Submit form (if no multi-line text focused)
'⌘Enter' | 'Ctrl+Enter' → Force submit form
'Escape'            → Cancel/close form
```

### List Navigation

```typescript
// List and table navigation
'ArrowUp'           → Previous item
'ArrowDown'         → Next item
'Enter'             → Select/open item
'Space'             → Toggle selection (multi-select)
'⌘A' | 'Ctrl+A'     → Select all items
```

### Modal Shortcuts

```typescript
// Modal dialog shortcuts
'Escape'            → Close modal
'Tab'               → Cycle through modal elements
'Enter'             → Confirm action (on primary button)
'⌘W' | 'Ctrl+W'     → Close modal (alternative)
```

## Form Handling Patterns

### Form Validation

#### Real-time Validation
```typescript
// Immediate feedback pattern
const [errors, setErrors] = useState<Record<string, string>>({});

const validateField = (name: string, value: string) => {
  const fieldErrors = { ...errors };
  
  switch (name) {
    case 'email':
      if (!value.includes('@')) {
        fieldErrors.email = 'Valid email required';
      } else {
        delete fieldErrors.email;
      }
      break;
    // Additional validation rules
  }
  
  setErrors(fieldErrors);
};

// Usage in form
<Input
  name="email"
  onChange={(e) => {
    setValue(e.target.value);
    validateField('email', e.target.value);
  }}
  className={cn(errors.email && "border-destructive")}
/>
{errors.email && (
  <p className="text-sm text-destructive">{errors.email}</p>
)}
```

#### Form Submission States
```typescript
// Loading state management
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (data: FormData) => {
  setIsSubmitting(true);
  try {
    await submitForm(data);
    toast.success('Form submitted successfully');
    // Redirect or reset form
  } catch (error) {
    toast.error('Submission failed. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

// UI feedback
<Button 
  type="submit" 
  disabled={isSubmitting || hasErrors}
  className="min-w-[100px]"
>
  {isSubmitting ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      Saving...
    </>
  ) : (
    'Save Changes'
  )}
</Button>
```

### Auto-save Patterns

```typescript
// Debounced auto-save
const useAutoSave = (data: any, saveFunction: (data: any) => Promise<void>) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (data && Object.keys(data).length > 0) {
        setSaving(true);
        try {
          await saveFunction(data);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setSaving(false);
        }
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [data, saveFunction]);

  return { lastSaved, saving };
};

// Auto-save indicator
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  {saving ? (
    <>
      <Loader2 className="h-3 w-3 animate-spin" />
      Saving...
    </>
  ) : lastSaved ? (
    <>
      <Check className="h-3 w-3 text-green-500" />
      Saved {formatTime(lastSaved)}
    </>
  ) : null}
</div>
```

## Feedback Patterns

### Toast Notifications

```typescript
// Success feedback
toast.success('Invoice created successfully', {
  description: 'Invoice #INV-001 has been sent to the client.',
  action: {
    label: 'View',
    onClick: () => navigate('/invoicing/INV-001'),
  },
});

// Error feedback
toast.error('Failed to save changes', {
  description: 'Please check your connection and try again.',
  action: {
    label: 'Retry',
    onClick: () => handleRetry(),
  },
});

// Information feedback
toast.info('Tax calculation completed', {
  description: 'Your VAT has been calculated for 2025.',
});

// Warning feedback
toast.warning('Unsaved changes', {
  description: 'You have unsaved changes that will be lost.',
  action: {
    label: 'Save',
    onClick: () => handleSave(),
  },
});
```

### Loading States

#### Button Loading States
```typescript
// Primary button loading
<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      Processing...
    </>
  ) : (
    'Submit Form'
  )}
</Button>

// Icon button loading
<Button variant="ghost" size="icon" disabled={loading}>
  {loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <RefreshCw className="h-4 w-4" />
  )}
</Button>
```

#### Content Loading States
```typescript
// Skeleton loading for cards
const SkeletonCard = () => (
  <Card>
    <CardHeader>
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
      </div>
    </CardContent>
  </Card>
);

// Table loading state
const TableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        {columns.map((_, index) => (
          <TableHead key={index}>
            <div className="h-4 bg-muted rounded animate-pulse" />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {columns.map((_, colIndex) => (
            <TableCell key={colIndex}>
              <div className="h-4 bg-muted rounded animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
```

### Progress Indicators

```typescript
// Progress bar for multi-step processes
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Processing invoice...</span>
    <span>{progress}%</span>
  </div>
  <Progress value={progress} className="w-full" />
</div>

// Step indicator for wizards
<div className="flex items-center space-x-4">
  {steps.map((step, index) => (
    <div key={step.id} className="flex items-center">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
        index < currentStep ? "bg-primary text-primary-foreground" :
        index === currentStep ? "bg-primary/20 text-primary border-2 border-primary" :
        "bg-muted text-muted-foreground"
      )}>
        {index < currentStep ? (
          <Check className="h-4 w-4" />
        ) : (
          index + 1
        )}
      </div>
      {index < steps.length - 1 && (
        <div className={cn(
          "w-12 h-0.5",
          index < currentStep ? "bg-primary" : "bg-muted"
        )} />
      )}
    </div>
  ))}
</div>
```

## Modal and Dialog Patterns

### Modal Behavior

```typescript
// Standard modal with proper focus management
const [open, setOpen] = useState(false);

// Focus trap and escape key handling
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
    }
  };

  if (open) {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'unset';
  };
}, [open]);

// Modal structure
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        Describe what this modal does
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Modal content */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Confirmation Dialogs

```typescript
// Destructive action confirmation
const ConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description,
  isDestructive = false 
}: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className={cn(
          isDestructive && "text-destructive"
        )}>
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirm}
          className={cn(
            isDestructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          )}
        >
          {isDestructive ? 'Delete' : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
```

## Data Interaction Patterns

### Search and Filter

```typescript
// Search with debouncing
const useSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, debouncedQuery };
};

// Filter interface
<div className="flex items-center space-x-4">
  <div className="relative flex-1">
    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Search..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="pl-8"
    />
  </div>
  <Select value={filter} onValueChange={setFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Filter by status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Status</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Bulk Actions

```typescript
// Multi-select with bulk actions
const [selectedItems, setSelectedItems] = useState<string[]>([]);

const toggleSelection = (id: string) => {
  setSelectedItems(prev => 
    prev.includes(id) 
      ? prev.filter(item => item !== id)
      : [...prev, id]
  );
};

const toggleSelectAll = () => {
  setSelectedItems(prev => 
    prev.length === items.length ? [] : items.map(item => item.id)
  );
};

// Bulk action bar
{selectedItems.length > 0 && (
  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
    <span className="text-sm">
      {selectedItems.length} items selected
    </span>
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={handleBulkEdit}>
        Edit
      </Button>
      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
        Delete
      </Button>
    </div>
  </div>
)}
```

## Error Handling Patterns

### Error States

```typescript
// Error boundary fallback
const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <AlertCircle className="h-12 w-12 text-destructive" />
    <div className="text-center space-y-2">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
    </div>
    <div className="flex space-x-2">
      <Button onClick={resetErrorBoundary}>
        Try Again
      </Button>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Reload Page
      </Button>
    </div>
  </div>
);

// Empty state pattern
const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <Icon className="h-12 w-12 text-muted-foreground" />
    <div className="text-center space-y-2">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground max-w-sm">{description}</p>
    </div>
    {action && action}
  </div>
);
```

### Retry Mechanisms

```typescript
// Retry with exponential backoff
const useRetry = (fn: () => Promise<void>, maxRetries = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async () => {
    if (retryCount >= maxRetries) return;
    
    setIsRetrying(true);
    try {
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      );
      await fn();
      setRetryCount(0);
    } catch (error) {
      setRetryCount(prev => prev + 1);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  };

  return { retry, retryCount, isRetrying, canRetry: retryCount < maxRetries };
};
```

---

These interaction patterns ensure consistent, accessible, and intuitive user experiences throughout the application while providing clear feedback and maintaining user context.