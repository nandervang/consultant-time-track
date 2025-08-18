import { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';

type CashFlowEntry = Database['public']['Tables']['cash_flow_entries']['Row'];
type CashFlowInsert = Database['public']['Tables']['cash_flow_entries']['Insert'];
type CashFlowUpdate = Database['public']['Tables']['cash_flow_entries']['Update'];

export function useCashFlow(userId: string | null) {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cash flow entries
  const fetchEntries = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Add new cash flow entry
  const addEntry = async (entry: Omit<CashFlowInsert, 'user_id'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .insert([{ ...entry, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      
      setEntries(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      return null;
    }
  };

  // Update cash flow entry
  const updateEntry = async (id: string, updates: CashFlowUpdate) => {
    try {
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      setEntries(prev => prev.map(entry => entry.id === id ? data : entry));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      return null;
    }
  };

  // Delete cash flow entry
  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cash_flow_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      
      setEntries(prev => prev.filter(entry => entry.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      return false;
    }
  };

  // Get cash flow summary
  const getCashFlowSummary = async (startDate?: string, endDate?: string) => {
    if (!userId) return null;

    try {
      let query = supabase
        .from('cash_flow_entries')
        .select('type, amount, date')
        .eq('user_id', userId);

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) throw error;

      const summary = data?.reduce((acc, entry) => {
        if (entry.type === 'income') {
          acc.totalIncome += entry.amount;
        } else {
          acc.totalExpenses += entry.amount;
        }
        return acc;
      }, { totalIncome: 0, totalExpenses: 0 });

      return {
        ...summary,
        netFlow: summary ? summary.totalIncome - summary.totalExpenses : 0
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get summary');
      return null;
    }
  };

  // Get entries by category
  const getEntriesByCategory = async (type: 'income' | 'expense') => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .select('category, amount')
        .eq('user_id', userId)
        .eq('type', type);

      if (error) throw error;

      const categoryTotals = data?.reduce((acc, entry) => {
        acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(categoryTotals || {}).map(([category, amount]) => ({
        category,
        amount
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get categories');
      return [];
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [userId]); // fetchEntries is stable, no need to include

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    getCashFlowSummary,
    getEntriesByCategory,
    refetch: fetchEntries
  };
}
