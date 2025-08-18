import { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetEntry = Database['public']['Tables']['budget_entries']['Row'];
type BudgetEntryInsert = Database['public']['Tables']['budget_entries']['Insert'];

export function useBudgets(userId: string | null) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch budgets
  const fetchBudgets = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Add new budget
  const addBudget = async (budget: Omit<BudgetInsert, 'user_id'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      
      setBudgets(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add budget');
      return null;
    }
  };

  // Update budget
  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      setBudgets(prev => prev.map(budget => budget.id === id ? data : budget));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update budget');
      return null;
    }
  };

  // Delete budget
  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      
      setBudgets(prev => prev.filter(budget => budget.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete budget');
      return false;
    }
  };

  // Add budget entry
  const addBudgetEntry = async (entry: Omit<BudgetEntryInsert, 'user_id'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('budget_entries')
        .insert([{ ...entry, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add budget entry');
      return null;
    }
  };

  // Get budget status
  const getBudgetStatus = async () => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('budget_status')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get budget status');
      return [];
    }
  };

  // Get budget entries for a specific budget
  const getBudgetEntries = async (budgetId: string) => {
    try {
      const { data, error } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('budget_id', budgetId)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get budget entries');
      return [];
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [userId]); // fetchBudgets is stable, no need to include

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    addBudgetEntry,
    getBudgetStatus,
    getBudgetEntries,
    refetch: fetchBudgets
  };
}
