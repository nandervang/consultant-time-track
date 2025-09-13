import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type CashFlowEntry = Database['public']['Tables']['cash_flow_entries']['Row'];
type CashFlowInsert = Database['public']['Tables']['cash_flow_entries']['Insert'];
type CashFlowUpdate = Database['public']['Tables']['cash_flow_entries']['Update'];

// Enhanced entry type to distinguish editable vs read-only entries
interface EnhancedCashFlowEntry extends CashFlowEntry {
  is_editable: boolean;
  source: 'manual' | 'budget' | 'invoice';
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
      const { data: cashFlowData, error: cashFlowError } = await supabase
        .from('cash_flow_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (cashFlowError) throw cashFlowError;

      // Fetch invoice items with status 'sent' to include as expected income
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoice_items')
        .select(`
          id,
          description,
          total_amount,
          due_date,
          currency,
          status,
          created_at,
          client_id,
          project_id
        `)
        .eq('user_id', userId)
        .eq('status', 'sent')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: false });

      if (invoiceError) throw invoiceError;

      console.log('📄 Invoice Items Fetched:', {
        total: (invoiceData || []).length,
        items: invoiceData?.map(item => ({
          id: item.id,
          description: item.description,
          amount: item.total_amount,
          due_date: item.due_date,
          status: item.status
        }))
      });

      // Create enhanced cash flow entries from manual/budget entries
      const enhancedCashFlowEntries: EnhancedCashFlowEntry[] = (cashFlowData || []).map(entry => {
        // Determine source and editability
        let source: 'manual' | 'budget' | 'invoice' = 'manual';
        let isEditable = true;

        if (entry.is_budget_entry) {
          source = 'budget';
          isEditable = false; // Budget entries are read-only
        }

        // Debug logging for specific entries
        if (entry.description?.toLowerCase().includes('intershape') || 
            entry.description?.toLowerCase().includes('digitalidg')) {
          console.log(`🔍 DEBUG Entry "${entry.description}":`, {
            id: entry.id,
            is_budget_entry: entry.is_budget_entry,
            source,
            is_editable: isEditable,
            raw_entry: entry
          });
        }

        return {
          ...entry,
          is_editable: isEditable,
          source
        };
      });

      // Create enhanced invoice entries as expected income
      const enhancedInvoiceEntries: EnhancedCashFlowEntry[] = (invoiceData || []).map(invoiceItem => {
        return {
          id: `invoice_${invoiceItem.id}`, // Prefix to distinguish from manual entries
          user_id: userId,
          type: 'income' as const,
          amount: invoiceItem.total_amount,
          description: `Invoice: ${invoiceItem.description}`,
          category: 'Client Payment',
          date: invoiceItem.due_date!, // Use due_date as the cash flow date
          is_recurring: false,
          recurring_interval: null,
          next_due_date: null,
          is_budget_entry: false,
          is_recurring_instance: false,
          project_id: invoiceItem.project_id,
          client_id: invoiceItem.client_id,
          created_at: invoiceItem.created_at,
          updated_at: new Date().toISOString(),
          is_editable: false, // Invoice entries are read-only
          source: 'invoice' as const
        };
      });

      // Combine all entries
      const allEnhancedEntries = [...enhancedCashFlowEntries, ...enhancedInvoiceEntries];

      console.log('💰 Cash Flow Entries Loaded:', {
        total: allEnhancedEntries.length,
        manual: allEnhancedEntries.filter(e => e.source === 'manual').length,
        budget: allEnhancedEntries.filter(e => e.source === 'budget').length,
        invoice: allEnhancedEntries.filter(e => e.source === 'invoice').length,
        income: allEnhancedEntries.filter(e => e.type === 'income').length,
        expenses: allEnhancedEntries.filter(e => e.type === 'expense').length,
        editable: allEnhancedEntries.filter(e => e.is_editable).length,
        readonly: allEnhancedEntries.filter(e => !e.is_editable).length
      });

      setEntries(allEnhancedEntries);
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
          user_id: userId
          // Don't force is_budget_entry to false - respect what's passed in
        }])
        .select()
        .single();

      if (error) throw error;

      // Add as enhanced entry - determine source and editability based on is_budget_entry
      const enhancedEntry: EnhancedCashFlowEntry = {
        ...data,
        is_editable: !data.is_budget_entry, // Budget entries are not editable, manual entries are
        source: data.is_budget_entry ? 'budget' : 'manual'
      };

      setEntries(prev => [enhancedEntry, ...prev]);
      console.log('✅ New entry added:', data.description, data.amount, 
                  data.is_budget_entry ? '[BUDGET]' : '[MANUAL]');
    } catch (err) {
      console.error('Error adding cash flow entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (entryId: string, updates: CashFlowUpdate) => {
    const entry = entries.find(e => e.id === entryId);
    
    // Prevent editing budget-sourced entries
    if (!entry || !entry.is_editable) {
      setError('Budget entries cannot be edited from cash flow page');
      console.warn('Attempted to edit read-only budget entry:', entryId);
      return;
    }

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
        entry.id === entryId 
          ? { ...entry, ...data, is_editable: true, source: 'manual' as const }
          : entry
      ));
      console.log('✅ Manual entry updated:', data.description, data.amount);
    } catch (err) {
      console.error('Error updating cash flow entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    let entry = entries.find(e => e.id === entryId);
    let actualEntryId = entryId;
    
    // Handle recurring generated instances
    if (!entry && entryId.includes('_recurring_')) {
      const originalId = entryId.split('_recurring_')[0];
      entry = entries.find(e => e.id === originalId);
      actualEntryId = originalId;
      
      console.log(`🔄 Recurring instance delete - converting to original entry:`, {
        generatedId: entryId,
        originalId: actualEntryId,
        foundOriginal: !!entry
      });
    }
    
    console.log(`🗑️ DELETE ATTEMPT for "${entry?.description}":`, {
      entryId,
      actualEntryId,
      found: !!entry,
      is_editable: entry?.is_editable,
      source: entry?.source,
      is_budget_entry: entry?.is_budget_entry,
      totalEntries: entries.length,
      entryIds: entries.map(e => ({ id: e.id, desc: e.description?.substring(0, 20) }))
    });

    // Special check for invoice entries - they should never be deletable
    if (actualEntryId.startsWith('invoice_')) {
      const errorMsg = 'Invoice entries cannot be deleted from cash flow page';
      setError(errorMsg);
      console.warn('❌ Delete blocked:', errorMsg, { entryId: actualEntryId });
      return;
    }
    
    // Prevent deleting budget-sourced entries
    if (!entry || !entry.is_editable) {
      const errorMsg = !entry 
        ? 'Entry not found' 
        : `${entry.source} entries cannot be deleted from cash flow page`;
      setError(errorMsg);
      console.warn('❌ Delete blocked:', errorMsg, { entry, entryId: actualEntryId, availableIds: entries.map(e => e.id) });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('cash_flow_entries')
        .delete()
        .eq('id', actualEntryId)
        .eq('user_id', userId!);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== actualEntryId));
      console.log('✅ Manual entry deleted');
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