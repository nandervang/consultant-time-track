import { useState, useEffect } from       if (error) throw error;

      // Enhance entries with editability information
      const enhancedEntries: EnhancedCashFlowEntry[] = (data || []).map(entry => ({
        ...entry,
        is_editable: !entry.is_budget_entry, // Only manual entries are editable
        source: entry.is_budget_entry ? 'budget' : 'manual'
      }));

      console.log('💰 Cash Flow Entries Loaded:', {
        total: enhancedEntries.length,
        manual: enhancedEntries.filter(e => e.source === 'manual').length,
        budget: enhancedEntries.filter(e => e.source === 'budget').length,
        income: enhancedEntries.filter(e => e.type === 'income').length,
        expenses: enhancedEntries.filter(e => e.type === 'expense').length
      });

      setEntries(enhancedEntries);supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type CashFlowEntry = Database['public']['Tables']['cash_flow_entries']['Row'];
type CashFlowInsert = Database['public']['Tables']['cash_flow_entries']['Insert'];
type CashFlowUpdate = Database['public']['Tables']['cash_flow_entries']['Update'];

// Enhanced entry type to distinguish editable vs read-only entries
interface EnhancedCashFlowEntry extends CashFlowEntry {
  is_editable: boolean;
  source: 'manual' | 'budget';
}

export function useCashFlow(userId: string | null) {
  const [entries, setEntries] = useState<EnhancedCashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch ALL cash flow entries (both manual and budget-generated)
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      // Extra safety filter to remove any budget-related entries
      const actualTransactions = (data || []).filter(entry => 
        !entry.is_budget_entry && 
        !entry.description?.toLowerCase().includes('budget') &&
        !entry.description?.toLowerCase().includes('årlig budget')
      );

      console.log('� Cash Flow Entries Loaded (ACTUAL TRANSACTIONS ONLY):', {
        rawEntries: data?.length || 0,
        cleanTransactions: actualTransactions.length,
        filtered: (data?.length || 0) - actualTransactions.length,
        income: actualTransactions.filter(e => e.type === 'income').length,
        expenses: actualTransactions.filter(e => e.type === 'expense').length
      });

      setEntries(actualTransactions);
    } catch (err) {
      console.error('Error loading cash flow data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addEntry = async (entryData: Omit<CashFlowInsert, 'user_id'>) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('cash_flow_entries')
        .insert([{ 
          ...entryData, 
          user_id: userId,
          is_budget_entry: false  // STRICTLY enforce actual transaction
        }])
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [data, ...prev]);
      console.log('✅ New actual transaction added:', data.description, data.amount);
    } catch (err) {
      console.error('Error adding cash flow entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (entryId: string, updates: CashFlowUpdate) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('cash_flow_entries')
        .update(updates)
        .eq('id', entryId)
        .eq('user_id', userId!)
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => prev.map(entry => 
        entry.id === entryId ? { ...entry, ...data } : entry
      ));
      console.log('✅ Transaction updated:', data.description, data.amount);
    } catch (err) {
      console.error('Error updating cash flow entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('cash_flow_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId!);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      console.log('✅ Transaction deleted');
    } catch (err) {
      console.error('Error deleting cash flow entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries
  };
}
