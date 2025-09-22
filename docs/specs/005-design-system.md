# Design System Specification

**Spec ID:** 005  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

This specification defines the design system, visual language, and UI consistency guidelines for the Consultant Time Tracking System. It establishes standards for ShadCN component usage, theming, responsive design, and visual hierarchy.

## Design Principles

### Core Principles

**Consistency**
- Unified visual language across all interfaces
- Predictable interaction patterns
- Consistent component behavior

**Clarity**
- Clear information hierarchy
- Intuitive navigation patterns  
- Accessible design choices

**Efficiency**
- Streamlined workflows
- Minimal cognitive load
- Fast, responsive interactions

**Professionalism**
- Business-appropriate aesthetics
- Trust-building visual design
- Clean, modern interface

## Typography System

### Font Hierarchy

```css
/* Primary Font Stack */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;

/* Monospace for code/data */
font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", 
             Consolas, "Courier New", monospace;
```

### Type Scale

```css
/* Heading Styles */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }    /* h1 */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* h2 */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }      /* h3 */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }   /* h4 */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }  /* h5 */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; }     /* Body */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }  /* Small */
.text-xs { font-size: 0.75rem; line-height: 1rem; }      /* Extra small */
```

### Typography Usage

```typescript
// Heading hierarchy
<h1 className="text-4xl font-bold">Page Title</h1>
<h2 className="text-3xl font-semibold">Section Title</h2>
<h3 className="text-2xl font-medium">Subsection Title</h3>

// Body text
<p className="text-base">Standard paragraph text</p>
<p className="text-sm text-muted-foreground">Secondary information</p>

// Monospace for data
<span className="font-mono text-sm">$1,234.56</span>
<code className="font-mono text-xs bg-muted px-1 rounded">code</code>
```

## Color System

### Theme Structure

```typescript
// Light Theme Colors
const lightTheme = {
  background: "hsl(0 0% 100%)",
  foreground: "hsl(222.2 84% 4.9%)",
  
  primary: "hsl(222.2 47.4% 11.2%)",
  primaryForeground: "hsl(210 40% 98%)",
  
  secondary: "hsl(210 40% 96%)",
  secondaryForeground: "hsl(222.2 84% 4.9%)",
  
  muted: "hsl(210 40% 96%)",
  mutedForeground: "hsl(215.4 16.3% 46.9%)",
  
  accent: "hsl(210 40% 96%)",
  accentForeground: "hsl(222.2 84% 4.9%)",
  
  destructive: "hsl(0 72.2% 50.6%)",
  destructiveForeground: "hsl(210 40% 98%)",
  
  border: "hsl(214.3 31.8% 91.4%)",
  input: "hsl(214.3 31.8% 91.4%)",
  ring: "hsl(222.2 84% 4.9%)"
};

// Dark Theme Colors  
const darkTheme = {
  background: "hsl(222.2 84% 4.9%)",
  foreground: "hsl(210 40% 98%)",
  
  primary: "hsl(210 40% 98%)",
  primaryForeground: "hsl(222.2 47.4% 11.2%)",
  
  secondary: "hsl(217.2 32.6% 17.5%)",
  secondaryForeground: "hsl(210 40% 98%)",
  
  muted: "hsl(217.2 32.6% 17.5%)",
  mutedForeground: "hsl(215 20.2% 65.1%)",
  
  accent: "hsl(217.2 32.6% 17.5%)",
  accentForeground: "hsl(210 40% 98%)",
  
  destructive: "hsl(0 62.8% 30.6%)",
  destructiveForeground: "hsl(210 40% 98%)",
  
  border: "hsl(217.2 32.6% 17.5%)",
  input: "hsl(217.2 32.6% 17.5%)",
  ring: "hsl(212.7 26.8% 83.9%)"
};
```

### Semantic Color Usage

```typescript
// Status Colors
const statusColors = {
  success: "hsl(142.1 76.2% 36.3%)",    // Green
  warning: "hsl(32.6 95.3% 44.1%)",     // Orange  
  error: "hsl(0 72.2% 50.6%)",          // Red
  info: "hsl(221.2 83.2% 53.3%)",       // Blue
};

// Usage examples
<Badge variant="success">Paid</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Overdue</Badge>
```

### Brand Colors

```typescript
// Accent colors for features
const featureColors = {
  create: "hsl(142.1 76.2% 36.3%)",     // Green for create actions
  navigate: "hsl(221.2 83.2% 53.3%)",   // Blue for navigation
  financial: "hsl(32.6 95.3% 44.1%)",   // Orange for money/tax
};
```

## ShadCN Component Standards

### Button Variants

```typescript
// Primary Actions
<Button variant="default">Save Changes</Button>
<Button variant="default" size="sm">Quick Action</Button>

// Secondary Actions  
<Button variant="secondary">Cancel</Button>
<Button variant="outline">Edit</Button>

// Destructive Actions
<Button variant="destructive">Delete</Button>

// Subtle Actions
<Button variant="ghost">View Details</Button>
<Button variant="link">Learn More</Button>

// Icon Buttons
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

### Form Components

```typescript
// Standard Form Field
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input 
    id="email"
    type="email" 
    placeholder="Enter your email"
    className="w-full"
  />
  <p className="text-sm text-muted-foreground">
    We'll never share your email.
  </p>
</div>

// Form Validation States
<Input 
  className={cn(
    "w-full",
    error && "border-destructive focus-visible:ring-destructive"
  )}
/>
{error && (
  <p className="text-sm text-destructive">{error}</p>
)}
```

### Card Layout Patterns

```typescript
// Standard Content Card
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Optional description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    <Button>Primary Action</Button>
    <Button variant="outline">Secondary Action</Button>
  </CardFooter>
</Card>

// Data Display Card
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
    <DollarSign className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$45,231.89</div>
    <p className="text-xs text-muted-foreground">
      +20.1% from last month
    </p>
  </CardContent>
</Card>
```

### Table Patterns

```typescript
// Standard Data Table
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(item.status)}>
            {item.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-mono">
          {formatCurrency(item.amount)}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Layout System

### Grid System

```typescript
// Responsive Grid Layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>

// Dashboard Layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card className="col-span-1 md:col-span-2 lg:col-span-2">
    {/* Wide widget */}
  </Card>
  <Card>
    {/* Standard widget */}  
  </Card>
  <Card>
    {/* Standard widget */}
  </Card>
</div>
```

### Spacing System

```css
/* Tailwind Spacing Scale */
.space-y-1 > * + * { margin-top: 0.25rem; }   /* 4px */
.space-y-2 > * + * { margin-top: 0.5rem; }    /* 8px */
.space-y-3 > * + * { margin-top: 0.75rem; }   /* 12px */
.space-y-4 > * + * { margin-top: 1rem; }      /* 16px */
.space-y-6 > * + * { margin-top: 1.5rem; }    /* 24px */
.space-y-8 > * + * { margin-top: 2rem; }      /* 32px */

/* Padding Scale */
.p-2 { padding: 0.5rem; }    /* 8px */
.p-4 { padding: 1rem; }      /* 16px */
.p-6 { padding: 1.5rem; }    /* 24px */
.p-8 { padding: 2rem; }      /* 32px */
```

### Container Patterns

```typescript
// Page Container
<div className="container mx-auto px-4 py-8">
  <div className="space-y-8">
    {/* Page content */}
  </div>
</div>

// Section Container
<section className="space-y-6">
  <div className="space-y-2">
    <h2 className="text-3xl font-semibold">Section Title</h2>
    <p className="text-muted-foreground">Section description</p>
  </div>
  <div className="space-y-4">
    {/* Section content */}
  </div>
</section>
```

## Icon System

### Icon Library Standards

```typescript
// Lucide React Icons
import { 
  Search, Plus, Edit, Trash2, Settings, User, 
  DollarSign, Clock, FileText, Users, BarChart3,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, X, AlertCircle, Info, ExternalLink
} from 'lucide-react';

// Icon Sizing
<Search className="h-4 w-4" />        // Small icons (16px)
<User className="h-5 w-5" />          // Medium icons (20px) 
<Settings className="h-6 w-6" />      // Large icons (24px)
<BarChart3 className="h-8 w-8" />     // Extra large icons (32px)
```

### Icon Usage Patterns

```typescript
// Icon with Text
<div className="flex items-center gap-2">
  <Clock className="h-4 w-4 text-muted-foreground" />
  <span>Time Tracking</span>
</div>

// Icon Button
<Button variant="ghost" size="icon">
  <Edit className="h-4 w-4" />
  <span className="sr-only">Edit item</span>
</Button>

// Status Icons
<div className="flex items-center gap-2">
  <Check className="h-4 w-4 text-green-500" />
  <span>Completed</span>
</div>
```

## Responsive Design

### Breakpoint System

```css
/* Tailwind Breakpoints */
/* sm: 640px and up */
/* md: 768px and up */
/* lg: 1024px and up */
/* xl: 1280px and up */
/* 2xl: 1536px and up */
```

### Responsive Patterns

```typescript
// Mobile-First Layout
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

// Conditional Visibility
<div className="hidden md:block">
  {/* Desktop only */}
</div>
<div className="block md:hidden">
  {/* Mobile only */}
</div>

// Responsive Text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
```

### Mobile Optimizations

```typescript
// Touch-Friendly Buttons
<Button className="min-h-[44px] min-w-[44px]">
  Touch Target
</Button>

// Mobile Navigation
<div className="md:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-6 w-6" />
      </Button>
    </SheetTrigger>
    <SheetContent>
      {/* Mobile menu */}
    </SheetContent>
  </Sheet>
</div>
```

## Animation Standards

### Transition Patterns

```css
/* Standard Transitions */
.transition-colors { transition: color 150ms ease-in-out; }
.transition-transform { transition: transform 150ms ease-in-out; }
.transition-opacity { transition: opacity 150ms ease-in-out; }

/* Hover Effects */
.hover\\:scale-105:hover { transform: scale(1.05); }
.hover\\:bg-accent:hover { background-color: hsl(var(--accent)); }
```

### Loading States

```typescript
// Loading Spinner
<div className="flex items-center justify-center p-4">
  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
</div>

// Skeleton Loading
<div className="space-y-2">
  <div className="h-4 bg-muted rounded animate-pulse" />
  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
</div>
```

## Accessibility Standards

### Color Contrast

- **AA Standard**: 4.5:1 for normal text, 3:1 for large text
- **AAA Standard**: 7:1 for normal text, 4.5:1 for large text
- **Focus Indicators**: Visible focus states on all interactive elements

### Keyboard Navigation

```typescript
// Focus Management
<Button 
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Accessible Button
</Button>

// Skip Links
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>
```

### ARIA Labels

```typescript
// Screen Reader Support
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

<Input 
  aria-describedby="email-help"
  aria-invalid={!!error}
/>
<div id="email-help" className="text-sm text-muted-foreground">
  Enter a valid email address
</div>
```

## Component Documentation

### Component Props Interface

```typescript
interface ComponentProps {
  // Required props
  children: React.ReactNode;
  
  // Optional styling
  className?: string;
  
  // Variant options
  variant?: 'default' | 'secondary' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  
  // Event handlers
  onClick?: () => void;
  
  // State props
  disabled?: boolean;
  loading?: boolean;
}
```

### Usage Documentation

```typescript
/**
 * Button Component
 * 
 * @example
 * <Button variant="default" onClick={handleSave}>
 *   Save Changes
 * </Button>
 * 
 * @example
 * <Button variant="destructive" size="sm" disabled>
 *   Delete Item
 * </Button>
 */
export const Button = ({ variant = 'default', ...props }: ButtonProps) => {
  // Component implementation
};
```

---

This design system specification ensures visual consistency, accessibility, and maintainability across the entire application while following modern design principles and best practices.