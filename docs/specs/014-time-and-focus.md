# Time & Focus

## Overview

Time & Focus is a dual-purpose productivity system that combines weekly focus planning with time tracking. It helps consultants maintain clarity on their weekly priorities while accurately tracking billable hours.

## Core Components

### 1. Focus Planner (Default Tab)

A 2-week ahead planner that helps users define daily focus areas and goals.

#### Key Features

- **2-Week Rolling View**: Displays next 10 working days (Monday-Friday only)
- **Weekend Intelligence**: On Sat/Sun, automatically shifts view to show the next 2 working weeks
- **Real-time Auto-save**: Changes persist automatically (800ms debounce)
- **Past Days Protection**: Previous days display in grayscale and are read-only
- **Dynamic Sizing**: All input boxes grow together based on the day with most content
- **Color Intensity System**: Visual feedback based on content length

#### Daily Structure

Each day contains two text areas:

1. **Focus** (3-12 rows, 500 char limit)
   - Primary objectives for the day
   - Key priorities and targets
   - Multi-line support (Shift+Enter)

2. **Goals** (5-12 rows, 1000 char limit)
   - Specific tasks and milestones
   - Detailed action items
   - Multi-line support (Shift+Enter)

#### Visual Feedback

**Current & Future Days** (Light Mode):
- Empty state: White background
- Light content (1-3 lines): `bg-blue-50` or `bg-green-50`
- Moderate content (4-6 lines): `bg-blue-100` or `bg-green-100`
- Heavy content (7+ lines): `bg-blue-200` or `bg-green-200`

**Current & Future Days** (Dark Mode):
- Empty state: Dark background
- Light content: `bg-blue-900/30`
- Moderate content: `bg-blue-900/50`
- Heavy content: `bg-blue-700/70`

**Past Days**:
- Grayscale with intensity levels
- Same intensity logic but using gray color scale
- Read-only (no editing)

### 2. Time Tracking Tab

Comprehensive time logging system for billable hours tracking.

#### Features

- Project-based time logging
- Start/stop timer functionality
- Manual time entry
- Daily summary views
- Billable/non-billable categorization
- Integration with invoicing system

## Data Model

### daily_focus Table

```sql
CREATE TABLE daily_focus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  focus TEXT CHECK (char_length(focus) <= 500),
  goals TEXT CHECK (char_length(goals) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**Indexes**:
- `idx_daily_focus_user_date` on (user_id, date)

**RLS Policies**:
- Users can only read/write their own focus data
- Automatic user_id enforcement on insert

## Technical Implementation

### Hooks

#### useDailyFocus

```typescript
interface DailyFocusData {
  date: string;
  focus: string;
  goals: string;
  isPast: boolean;
  isWeekend: boolean;
}

const useDailyFocus = () => {
  const { data, updateFocus } = useDailyFocus();
  // Auto-save with 800ms debounce
  // Returns 2-week array of focus data
};
```

**Key Functions**:
- `getNextTwoWeeks()`: Generates working days array (Mon-Fri)
- `updateFocus(date, field, value)`: Debounced update function
- Weekend detection and view shifting logic

### Components

#### FocusPlanner.tsx

Main component rendering the 2-week grid view.

**Props**: None (uses context/hooks)

**Structure**:
- Weekly columns (2 columns)
- Daily cards (5 per week)
- Focus and Goals textareas per day
- Dynamic height calculation
- Color intensity system

**Key Logic**:
```typescript
// Calculate max rows for dynamic height
const maxFocusRows = Math.max(3, ...focusData.map(calcRows));
const maxGoalsRows = Math.max(5, ...focusData.map(calcRows));

// Color intensity based on line count
const getIntensityColor = (lineCount: number, isDark: boolean) => {
  if (lineCount === 0) return 'bg-white dark:bg-background';
  if (lineCount <= 3) return 'bg-blue-50 dark:bg-blue-900/30';
  if (lineCount <= 6) return 'bg-blue-100 dark:bg-blue-900/50';
  return 'bg-blue-200 dark:bg-blue-700/70';
};
```

## Navigation Integration

### Menu Item

- **Label**: "Time & Focus"
- **Icon**: Target (lucide-react)
- **Route**: `/time-focus`
- **Position**: Main navigation sidebar

### Smart Search Integration

The feature is accessible via ⌘K smart search:
- "time focus" → Opens Time & Focus page
- "focus planner" → Opens Time & Focus page (Focus tab)
- "time tracking" → Opens Time & Focus page (Time Tracking tab)

## User Experience

### Focus Planning Workflow

1. User navigates to Time & Focus
2. Default view shows Focus tab with 2-week planner
3. User sees current week and next week (Mon-Fri only)
4. For each day, user can:
   - Set daily focus (what matters most)
   - Define specific goals (actionable items)
5. Changes auto-save after 800ms
6. Visual feedback shows content density
7. Past days are grayed out and read-only

### Weekend Behavior

When user visits on Saturday or Sunday:
- System automatically shows next 2 complete working weeks
- Current weekend is skipped
- User can plan for upcoming Monday onwards

### Multi-line Input

- **Focus field**: Shift+Enter creates new line (up to 500 chars)
- **Goals field**: Shift+Enter creates new line (up to 1000 chars)
- All boxes resize together based on the day with most content
- Smooth height transitions (150ms ease-in-out)

## Performance Considerations

### Auto-save Optimization

- 800ms debounce prevents excessive database writes
- Only changed fields are updated
- Batch updates for multiple fields on same day

### Data Loading

- Fetch 2 weeks of data on mount
- Real-time subscription for cross-device sync
- Optimistic UI updates

## Future Enhancements

### Planned Features

1. **Focus Templates**
   - Save common focus patterns
   - Quick-apply to multiple days
   
2. **Weekly Review**
   - End-of-week summary
   - Completion tracking
   
3. **Focus Analytics**
   - Track focus areas over time
   - Identify patterns and trends
   
4. **Integration with Time Tracking**
   - Link time entries to daily focus
   - Show actual vs planned time allocation

5. **AI Suggestions**
   - Suggest focus areas based on calendar
   - Recommend goal prioritization

## Debugging

### Console Logging (Development)

The system includes debug logging for month generation in Cash Flow Projections:

```typescript
console.log('🔍 Current date:', today);
console.log('🔍 Current month index:', today.getMonth());
console.log(`🔍 Month ${i}:`, { projectionDate, monthKey, monthName });
```

This helps verify correct month calculation and display logic.

## Related Specifications

- [012-time-tracking.md](./012-time-tracking.md) - Time Tracking system details
- [003-smart-search.md](./003-smart-search.md) - Search integration
- [006-interaction-patterns.md](./006-interaction-patterns.md) - UX patterns

---

**Status**: ✅ Implemented  
**Last Updated**: November 9, 2025  
**Version**: 1.0
