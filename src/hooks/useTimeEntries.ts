import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Project } from './useProjects';

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project_id: string;
  comment: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  project?: Project;
}

export interface TimeEntryInput {
  date: string;
  hours: number;
  project_id: string;
  comment?: string;
}

export function useTimeEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTimeEntries();
    } else {
      setEntries([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createTimeEntry = async (entryData: TimeEntryInput) => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ...entryData,
          user_id: user!.id,
        })
        .select(`
          *,
          project:projects(*)
        `)
        .single();

      if (error) throw error;
      setEntries(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create time entry';
      setError(error);
      return { data: null, error };
    }
  };

  const updateTimeEntry = async (id: string, updates: Partial<TimeEntryInput>) => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select(`
          *,
          project:projects(*)
        `)
        .single();

      if (error) throw error;
      setEntries(prev => prev.map(entry => entry.id === id ? data : entry));
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update time entry';
      setError(error);
      return { data: null, error };
    }
  };

  const deleteTimeEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      setEntries(prev => prev.filter(entry => entry.id !== id));
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete time entry';
      setError(error);
      return { error };
    }
  };

  return {
    entries,
    loading,
    error,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    refetch: fetchTimeEntries,
  };
}