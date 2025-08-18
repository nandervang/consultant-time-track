import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface MonthlySettings {
  id?: string;
  user_id: string;
  year: number;
  month: number;
  billing_percentage: number;
  absence_percentage: number;
  created_at?: string;
  updated_at?: string;
}

export function useMonthlySettings() {
  const { user } = useAuth();
  const [monthlySettings, setMonthlySettings] = useState<MonthlySettings[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMonthlySettings = useCallback(async (year?: number) => {
    if (!user) return;

    try {
      setLoading(true);
      const currentYear = year || new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('monthly_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .order('month');

      if (error) throw error;
      setMonthlySettings(data || []);
    } catch (error) {
      console.error('Error loading monthly settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getMonthSettings = useCallback((year: number, month: number): MonthlySettings | null => {
    return monthlySettings.find(s => s.year === year && s.month === month) || null;
  }, [monthlySettings]);

  const upsertMonthSettings = useCallback(async (settings: Omit<MonthlySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      console.log('Attempting to upsert monthly settings:', { user_id: user.id, ...settings });
      
      const { data, error } = await supabase
        .from('monthly_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,year,month'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}. The monthly_settings table might not exist.`);
      }

      console.log('Successfully saved monthly settings:', data);

      // Update local state
      setMonthlySettings(prev => {
        const filtered = prev.filter(s => !(s.year === settings.year && s.month === settings.month));
        return [...filtered, data].sort((a, b) => a.month - b.month);
      });

      return data;
    } catch (error) {
      console.error('Error saving monthly settings:', error);
      throw error;
    }
  }, [user]);

  const getCurrentMonthSettings = useCallback((): MonthlySettings => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const existing = getMonthSettings(year, month);
    if (existing) return existing;

    // Return default values if no settings exist for current month
    return {
      user_id: user?.id || '',
      year,
      month,
      billing_percentage: 94,
      absence_percentage: 15
    };
  }, [user, getMonthSettings]);

  useEffect(() => {
    if (user) {
      loadMonthlySettings();
    }
  }, [user, loadMonthlySettings]);

  return {
    monthlySettings,
    loading,
    loadMonthlySettings,
    getMonthSettings,
    upsertMonthSettings,
    getCurrentMonthSettings
  };
}
