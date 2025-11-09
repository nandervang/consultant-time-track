import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface DailyFocus {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  focus: string;
  goals: string;
  created_at: string;
  updated_at: string;
}

export interface DailyFocusInput {
  date: string;
  focus: string;
  goals: string;
}

export function useDailyFocus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [focusData, setFocusData] = useState<DailyFocus[]>([]);
  const [loading, setLoading] = useState(true);

  // Get dates for the next 2 weeks (Monday to Friday only)
  const getNextTwoWeeks = useCallback(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentDay = today.getDay();
    
    // If it's Saturday (6) or Sunday (0), start from next Monday
    // Otherwise, start from current week's Monday
    let startMonday: Date;
    
    if (currentDay === 0) {
      // Sunday - next Monday is tomorrow
      startMonday = new Date(today);
      startMonday.setDate(today.getDate() + 1);
    } else if (currentDay === 6) {
      // Saturday - next Monday is in 2 days
      startMonday = new Date(today);
      startMonday.setDate(today.getDate() + 2);
    } else {
      // Weekday - find this week's Monday
      const daysUntilMonday = 1 - currentDay;
      startMonday = new Date(today);
      startMonday.setDate(today.getDate() + daysUntilMonday);
    }
    
    startMonday.setHours(0, 0, 0, 0);
    
    // Get 10 weekdays (2 weeks, Mon-Fri)
    const date = new Date(startMonday);
    while (dates.length < 10) {
      const dayOfWeek = date.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    
    return dates;
  }, []);

  // Fetch focus data for the next 2 weeks
  const fetchFocusData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const dates = getNextTwoWeeks();
      const startDate = dates[0].toISOString().split('T')[0];
      const endDate = dates[dates.length - 1].toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_focus')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      setFocusData(data || []);
    } catch (error) {
      console.error('Error fetching focus data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load focus data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, getNextTwoWeeks, toast]);

  // Update or insert focus data with auto-save
  const updateFocus = useCallback(async (input: DailyFocusInput) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_focus')
        .upsert(
          {
            user_id: user.id,
            date: input.date,
            focus: input.focus,
            goals: input.goals,
          },
          {
            onConflict: 'user_id,date',
          }
        )
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setFocusData((prev) => {
        const index = prev.findIndex((item) => item.date === input.date);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data].sort((a, b) => a.date.localeCompare(b.date));
      });
    } catch (error) {
      console.error('Error updating focus:', error);
      toast({
        title: 'Error',
        description: 'Failed to save focus data',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Get focus data for a specific date
  const getFocusForDate = useCallback(
    (date: string): DailyFocus | null => {
      return focusData.find((item) => item.date === date) || null;
    },
    [focusData]
  );

  useEffect(() => {
    fetchFocusData();
  }, [fetchFocusData]);

  return {
    focusData,
    loading,
    updateFocus,
    getFocusForDate,
    getNextTwoWeeks,
    refetch: fetchFocusData,
  };
}
