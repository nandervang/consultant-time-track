import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDailyFocus, getISOWeekNumber } from '@/hooks/useDailyFocus';
import { format, isSameDay, isPast } from 'date-fns';
import { Target, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FocusPlanner() {
  const { loading, updateFocus, getFocusForDate, getNextTwoWeeks, refetch } = useDailyFocus();
  const [dates, setDates] = useState<Date[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [autoSaveTimers, setAutoSaveTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [maxContentHeight, setMaxContentHeight] = useState({ focus: 3, goals: 5 });

  useEffect(() => {
    setDates(getNextTwoWeeks(weekOffset));
    // Refetch data when week offset changes
    refetch(weekOffset);
  }, [getNextTwoWeeks, weekOffset, refetch]);

  // Navigation handlers
  const handlePreviousWeeks = () => {
    setWeekOffset(prev => prev - 2);
  };

  const handleNextWeeks = () => {
    setWeekOffset(prev => prev + 2);
  };

  const handleToday = () => {
    setWeekOffset(0);
  };

  // Split dates into two weeks
  const week1 = dates.slice(0, 5);
  const week2 = dates.slice(5, 10);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate dynamic heights based on all visible content
  useEffect(() => {
    let maxFocusLines = 3;
    let maxGoalsLines = 5;

    dates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const focusData = getFocusForDate(dateStr);
      
      if (focusData) {
        const focusLines = focusData.focus ? (focusData.focus.match(/\n/g) || []).length + 1 : 0;
        const goalsLines = focusData.goals ? (focusData.goals.match(/\n/g) || []).length + 1 : 0;
        
        maxFocusLines = Math.max(maxFocusLines, Math.min(focusLines, 8));
        maxGoalsLines = Math.max(maxGoalsLines, Math.min(goalsLines, 12));
      }
    });

    setMaxContentHeight({ focus: maxFocusLines, goals: maxGoalsLines });
  }, [dates, getFocusForDate]);

  // Handle input change with auto-save debounce
  const handleInputChange = useCallback(
    (date: string, field: 'focus' | 'goals', value: string) => {
      // Clear existing timer for this date+field
      const timerKey = `${date}-${field}`;
      const existingTimer = autoSaveTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer for auto-save (800ms debounce)
      const timer = setTimeout(() => {
        const currentData = getFocusForDate(date);
        updateFocus({
          date,
          focus: field === 'focus' ? value : currentData?.focus || '',
          goals: field === 'goals' ? value : currentData?.goals || '',
        });
        autoSaveTimers.delete(timerKey);
      }, 800);

      setAutoSaveTimers((prev) => new Map(prev).set(timerKey, timer));
    },
    [autoSaveTimers, getFocusForDate, updateFocus]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      autoSaveTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [autoSaveTimers]);

  const renderDayCard = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const focusData = getFocusForDate(dateStr);
    const isToday = isSameDay(date, today);
    const isPastDay = isPast(date) && !isToday;
    
    // Check if day has content for color intensity
    const hasContent = focusData && (focusData.focus || focusData.goals);
    
    // Count lines (newlines) to determine if it's getting too much
    const focusLines = focusData?.focus ? (focusData.focus.match(/\n/g) || []).length + 1 : 0;
    const goalsLines = focusData?.goals ? (focusData.goals.match(/\n/g) || []).length + 1 : 0;
    const totalLines = focusLines + goalsLines;
    
    // Check content levels
    const hasSignificantContent = focusData && 
      ((focusData.focus && focusData.focus.length > 30) || 
       (focusData.goals && focusData.goals.length > 80) ||
       totalLines >= 3);
    
    const hasTooMuchContent = totalLines >= 7 || 
      (focusData?.focus && focusData.focus.length > 300) ||
      (focusData?.goals && focusData.goals.length > 600);
    
    // Determine background color based on day of week and content
    const dayOfWeek = date.getDay();
    let bgColorClass = 'bg-background';
    
    if (isPastDay) {
      // Past days - gray scale based on content
      if (hasTooMuchContent) {
        bgColorClass = 'bg-gray-300 dark:bg-gray-700/60 border-gray-400 dark:border-gray-600';
      } else if (hasSignificantContent) {
        bgColorClass = 'bg-gray-200 dark:bg-gray-800/40';
      } else if (hasContent) {
        bgColorClass = 'bg-gray-100 dark:bg-gray-900/30';
      } else {
        bgColorClass = 'bg-gray-50 dark:bg-gray-950/20';
      }
    } else if (!isPastDay) {
      if (hasTooMuchContent) {
        // Very intense/saturated colors - warning that there's too much
        switch (dayOfWeek) {
          case 1: bgColorClass = 'bg-blue-200 dark:bg-blue-700/70 border-blue-400 dark:border-blue-500'; break;
          case 2: bgColorClass = 'bg-purple-200 dark:bg-purple-700/70 border-purple-400 dark:border-purple-500'; break;
          case 3: bgColorClass = 'bg-green-200 dark:bg-green-700/70 border-green-400 dark:border-green-500'; break;
          case 4: bgColorClass = 'bg-amber-200 dark:bg-amber-700/70 border-amber-400 dark:border-amber-500'; break;
          case 5: bgColorClass = 'bg-pink-200 dark:bg-pink-700/70 border-pink-400 dark:border-pink-500'; break;
        }
      } else if (hasSignificantContent) {
        // Vivid colors for days with significant content
        switch (dayOfWeek) {
          case 1: bgColorClass = 'bg-blue-100 dark:bg-blue-800/40'; break;
          case 2: bgColorClass = 'bg-purple-100 dark:bg-purple-800/40'; break;
          case 3: bgColorClass = 'bg-green-100 dark:bg-green-800/40'; break;
          case 4: bgColorClass = 'bg-amber-100 dark:bg-amber-800/40'; break;
          case 5: bgColorClass = 'bg-pink-100 dark:bg-pink-800/40'; break;
        }
      } else if (hasContent) {
        // Light colors for days with some content
        switch (dayOfWeek) {
          case 1: bgColorClass = 'bg-blue-50 dark:bg-blue-900/25'; break;
          case 2: bgColorClass = 'bg-purple-50 dark:bg-purple-900/25'; break;
          case 3: bgColorClass = 'bg-green-50 dark:bg-green-900/25'; break;
          case 4: bgColorClass = 'bg-amber-50 dark:bg-amber-900/25'; break;
          case 5: bgColorClass = 'bg-pink-50 dark:bg-pink-900/25'; break;
        }
      } else {
        // Very subtle colors for empty days
        switch (dayOfWeek) {
          case 1: bgColorClass = 'bg-blue-50/30 dark:bg-blue-950/15'; break;
          case 2: bgColorClass = 'bg-purple-50/30 dark:bg-purple-950/15'; break;
          case 3: bgColorClass = 'bg-green-50/30 dark:bg-green-950/15'; break;
          case 4: bgColorClass = 'bg-amber-50/30 dark:bg-amber-950/15'; break;
          case 5: bgColorClass = 'bg-pink-50/30 dark:bg-pink-950/15'; break;
        }
      }
    }

    return (
      <Card
        key={dateStr}
        className={cn(
          'transition-all duration-200 border',
          bgColorClass,
          isToday && 'ring-2 ring-primary shadow-lg'
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex flex-col">
              <span className={cn('text-lg', isToday && 'text-primary font-bold')}>
                {format(date, 'EEE')}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(date, 'MMM d')}
              </span>
            </span>
            {isToday && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                Today
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Focus
            </label>
            <Textarea
              placeholder="Main focus... (Press Enter for new line)"
              maxLength={500}
              rows={maxContentHeight.focus}
              defaultValue={focusData?.focus || ''}
              onChange={(e) => handleInputChange(dateStr, 'focus', e.target.value)}
              disabled={isPastDay}
              className={cn(
                'text-sm resize-none',
                isPastDay && 'cursor-not-allowed bg-muted'
              )}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Goals
            </label>
            <Textarea
              placeholder="Goals for the day... (Press Enter for new line)"
              maxLength={1000}
              rows={maxContentHeight.goals}
              defaultValue={focusData?.goals || ''}
              onChange={(e) => handleInputChange(dateStr, 'goals', e.target.value)}
              disabled={isPastDay}
              className={cn(
                'text-sm resize-none',
                isPastDay && 'cursor-not-allowed bg-muted'
              )}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousWeeks}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          disabled={weekOffset === 0}
        >
          Today
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextWeeks}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week 1 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Vecka {week1.length > 0 && getISOWeekNumber(week1[0])}: {week1.length > 0 && format(week1[0], 'MMM d')} -{' '}
            {week1.length > 0 && format(week1[week1.length - 1], 'MMM d, yyyy')}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {week1.map((date) => renderDayCard(date))}
        </div>
      </div>

      {/* Week 2 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Vecka {week2.length > 0 && getISOWeekNumber(week2[0])}: {week2.length > 0 && format(week2[0], 'MMM d')} -{' '}
            {week2.length > 0 && format(week2[week2.length - 1], 'MMM d, yyyy')}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {week2.map((date) => renderDayCard(date))}
        </div>
      </div>

      {/* Info text */}
      <p className="text-sm text-muted-foreground text-center">
        Focus and goals auto-save as you type. Press Enter for multiple lines. Past days are read-only.
      </p>
    </div>
  );
}
