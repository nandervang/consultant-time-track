import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useVatCalculations } from './useVatCalculations';
import { useClients } from './useClients';
import { useProjects } from './useProjects';
import { useTimeEntries } from './useTimeEntries';
import {
  InvoiceItem,
  CreateInvoiceItemData,
  UpdateInvoiceItemData,
  InvoiceSummary,
  ClientInvoiceSummary,
  ProjectInvoiceSummary,
} from '../types/invoice';

export function useInvoices(userId?: string | null) {
  const { user } = useAuth();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { entries: timeEntries } = useTimeEntries();
  const { updateCurrentVatCalculations } = useVatCalculations(userId || user?.id || null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveUserId = userId || user?.id;

  // Fetch invoice items
  const fetchInvoiceItems = useCallback(async () => {
    if (!effectiveUserId) {
      setInvoiceItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setInvoiceItems(data || []);
    } catch (err) {
      console.error('Error fetching invoice items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice items');
      
      // Fallback to localStorage
      const savedItems = localStorage.getItem(`invoice_items_${effectiveUserId}`);
      if (savedItems) {
        setInvoiceItems(JSON.parse(savedItems));
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  // Add new invoice item
  const addInvoiceItem = useCallback(async (itemData: CreateInvoiceItemData): Promise<InvoiceItem | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      // Calculate total amount based on type
      let totalAmount: number;
      if (itemData.type === 'hourly') {
        totalAmount = (itemData.quantity || 0) * (itemData.rate || 0);
      } else {
        totalAmount = itemData.rate || 0; // For fixed type, rate is the fixed amount
      }

      const newItem = {
        user_id: effectiveUserId,
        client_id: itemData.client_id || null,
        project_id: itemData.project_id || null,
        description: itemData.description,
        hours: itemData.type === 'hourly' ? itemData.quantity : null,
        hourly_rate: itemData.type === 'hourly' ? itemData.rate : null,
        fixed_amount: itemData.type === 'fixed' ? itemData.rate : null,
        total_amount: totalAmount,
        currency: 'SEK',
        invoice_date: itemData.date || new Date().toISOString().split('T')[0],
        status: itemData.status || 'draft',
      };

      const { data, error: insertError } = await supabase
        .from('invoice_items')
        .insert([newItem])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setInvoiceItems(prev => [data, ...prev]);
        
        // Save to localStorage as backup
        const updatedItems = [data, ...invoiceItems];
        localStorage.setItem(`invoice_items_${effectiveUserId}`, JSON.stringify(updatedItems));
        
        // Trigger VAT recalculation for updated income
        if (updateCurrentVatCalculations) {
          updateCurrentVatCalculations().catch(error => {
            console.log('VAT recalculation failed (non-critical):', error);
          });
        }
        
        return data;
      }

      return null;
    } catch (err) {
      console.error('Error adding invoice item:', err);
      
      // Fallback to localStorage
      const totalAmount = itemData.type === 'hourly' 
        ? (itemData.quantity || 0) * (itemData.rate || 0)
        : (itemData.rate || 0);
        
      const fallbackItem: InvoiceItem = {
        id: `local_${Date.now()}`,
        user_id: effectiveUserId,
        client_id: itemData.client_id || null,
        project_id: itemData.project_id || null,
        description: itemData.description,
        hours: itemData.type === 'hourly' ? itemData.quantity : null,
        hourly_rate: itemData.type === 'hourly' ? itemData.rate : null,
        fixed_amount: itemData.type === 'fixed' ? itemData.rate : null,
        total_amount: totalAmount,
        currency: 'SEK',
        invoice_date: itemData.date || new Date().toISOString().split('T')[0],
        due_date: null,
        status: itemData.status || 'draft',
        notes: itemData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updatedItems = [fallbackItem, ...invoiceItems];
      setInvoiceItems(updatedItems);
      localStorage.setItem(`invoice_items_${effectiveUserId}`, JSON.stringify(updatedItems));
      
      throw err;
    }
  }, [effectiveUserId, invoiceItems, updateCurrentVatCalculations]);

  // Update invoice item
  const updateInvoiceItem = useCallback(async (updateData: UpdateInvoiceItemData): Promise<InvoiceItem | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { id, ...itemData } = updateData;
      
      // Calculate new total amount if needed
      const updatedData: Record<string, unknown> = {};
      
      if (itemData.quantity !== undefined || itemData.rate !== undefined || itemData.type !== undefined) {
        const currentItem = invoiceItems.find(item => item.id === id);
        if (currentItem) {
          const type = itemData.type || (currentItem.hours ? 'hourly' : 'fixed');
          const quantity = itemData.quantity ?? (currentItem.hours || 1);
          const rate = itemData.rate ?? (currentItem.hourly_rate || currentItem.fixed_amount || 0);
          
          if (type === 'hourly') {
            updatedData.hours = quantity;
            updatedData.hourly_rate = rate;
            updatedData.fixed_amount = null;
            updatedData.total_amount = quantity * rate;
          } else {
            updatedData.hours = null;
            updatedData.hourly_rate = null;
            updatedData.fixed_amount = rate;
            updatedData.total_amount = rate;
          }
        }
      }
      
      // Add other fields
      if (itemData.description !== undefined) updatedData.description = itemData.description;
      if (itemData.client_id !== undefined) updatedData.client_id = itemData.client_id;
      if (itemData.project_id !== undefined) updatedData.project_id = itemData.project_id;
      if (itemData.date !== undefined) updatedData.invoice_date = itemData.date;
      if (itemData.status !== undefined) updatedData.status = itemData.status;
      if (itemData.notes !== undefined) updatedData.notes = itemData.notes;

      const { data, error: updateError } = await supabase
        .from('invoice_items')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', effectiveUserId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (data) {
        setInvoiceItems(prev => prev.map(item => 
          item.id === id ? data : item
        ));
        
        // Update localStorage
        const updatedItems = invoiceItems.map(item => 
          item.id === id ? data : item
        );
        localStorage.setItem(`invoice_items_${effectiveUserId}`, JSON.stringify(updatedItems));
        
        return data;
      }

      return null;
    } catch (err) {
      console.error('Error updating invoice item:', err);
      throw err;
    }
  }, [effectiveUserId, invoiceItems]);

  // Delete invoice item
  const deleteInvoiceItem = useCallback(async (itemId: string): Promise<void> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', effectiveUserId);

      if (deleteError) {
        throw deleteError;
      }

      setInvoiceItems(prev => prev.filter(item => item.id !== itemId));
      
      // Update localStorage
      const updatedItems = invoiceItems.filter(item => item.id !== itemId);
      localStorage.setItem(`invoice_items_${effectiveUserId}`, JSON.stringify(updatedItems));
    } catch (err) {
      console.error('Error deleting invoice item:', err);
      throw err;
    }
  }, [effectiveUserId, invoiceItems]);

  // Generate invoice summary
  const getInvoiceSummary = useCallback((): InvoiceSummary => {
    const summary = invoiceItems.reduce(
      (acc, item) => {
        acc.itemCount++;
        
        switch (item.status) {
          case 'draft':
            acc.totalDraft += item.total_amount;
            acc.totalUnbilled += item.total_amount;
            break;
          case 'sent':
            acc.totalSent += item.total_amount;
            break;
          case 'paid':
            acc.totalPaid += item.total_amount;
            break;
        }
        
        return acc;
      },
      {
        totalUnbilled: 0,
        totalDraft: 0,
        totalSent: 0,
        totalPaid: 0,
        itemCount: 0,
        clientCount: 0,
      }
    );

    // Count unique clients
    const uniqueClients = new Set(invoiceItems.map(item => item.client_id));
    summary.clientCount = uniqueClients.size;

    return summary;
  }, [invoiceItems]);

  // Generate client summaries
  const getClientSummaries = useCallback((): ClientInvoiceSummary[] => {
    const clientMap = new Map<string, ClientInvoiceSummary>();

    invoiceItems.forEach(item => {
      if (!item.client_id) return;
      
      const client = clients.find(c => c.id === item.client_id);
      if (!client) return;

      if (!clientMap.has(item.client_id)) {
        clientMap.set(item.client_id, {
          client_id: item.client_id,
          client_name: client.name,
          company: client.company || undefined,
          totalUnbilled: 0,
          totalDraft: 0,
          totalSent: 0,
          totalPaid: 0,
          itemCount: 0,
          projectCount: 0,
          lastActivity: item.created_at,
        });
      }

      const summary = clientMap.get(item.client_id)!;
      summary.itemCount++;
      
      if (item.created_at > summary.lastActivity) {
        summary.lastActivity = item.created_at;
      }

      switch (item.status) {
        case 'draft':
          summary.totalDraft += item.total_amount;
          summary.totalUnbilled += item.total_amount;
          break;
        case 'sent':
          summary.totalSent += item.total_amount;
          break;
        case 'paid':
          summary.totalPaid += item.total_amount;
          break;
      }
    });

    // Count unique projects per client
    const clientProjects = new Map<string, Set<string>>();
    invoiceItems.forEach(item => {
      if (!item.client_id || !item.project_id) return;
      
      if (!clientProjects.has(item.client_id)) {
        clientProjects.set(item.client_id, new Set());
      }
      clientProjects.get(item.client_id)!.add(item.project_id);
    });

    clientMap.forEach((summary, clientId) => {
      summary.projectCount = clientProjects.get(clientId)?.size || 0;
    });

    return Array.from(clientMap.values()).sort((a, b) => b.totalUnbilled - a.totalUnbilled);
  }, [invoiceItems, clients]);

  // Generate project summaries
  const getProjectSummaries = useCallback((): ProjectInvoiceSummary[] => {
    const projectMap = new Map<string, ProjectInvoiceSummary>();

    invoiceItems.forEach(item => {
      if (!item.project_id || !item.client_id) return;
      
      const project = projects.find(p => p.id === item.project_id);
      const client = clients.find(c => c.id === item.client_id);
      if (!project || !client) return;

      if (!projectMap.has(item.project_id)) {
        projectMap.set(item.project_id, {
          project_id: item.project_id,
          project_name: project.name,
          client_id: item.client_id,
          client_name: client.name,
          totalUnbilled: 0,
          totalDraft: 0,
          totalSent: 0,
          totalPaid: 0,
          itemCount: 0,
          totalHours: 0,
          averageRate: 0,
          lastActivity: item.created_at,
        });
      }

      const summary = projectMap.get(item.project_id)!;
      summary.itemCount++;
      
      if (item.created_at > summary.lastActivity) {
        summary.lastActivity = item.created_at;
      }

      if (item.hours) {
        summary.totalHours += item.hours;
      }

      switch (item.status) {
        case 'draft':
          summary.totalDraft += item.total_amount;
          summary.totalUnbilled += item.total_amount;
          break;
        case 'sent':
          summary.totalSent += item.total_amount;
          break;
        case 'paid':
          summary.totalPaid += item.total_amount;
          break;
      }
    });

    // Calculate average rates
    projectMap.forEach(summary => {
      const projectItems = invoiceItems.filter(item => item.project_id === summary.project_id);
      const totalAmount = projectItems.reduce((sum, item) => sum + item.total_amount, 0);
      const totalHours = projectItems.reduce((sum, item) => sum + (item.hours || 0), 0);
      summary.averageRate = totalHours > 0 ? totalAmount / totalHours : 0;
    });

    return Array.from(projectMap.values()).sort((a, b) => b.totalUnbilled - a.totalUnbilled);
  }, [invoiceItems, projects, clients]);

  // Create invoice item from time entries
  const createInvoiceFromTimeEntries = useCallback(async (
    timeEntryIds: string[],
    clientId: string,
    description?: string
  ): Promise<InvoiceItem | null> => {
    const selectedEntries = timeEntries.filter(entry => timeEntryIds.includes(entry.id));
    if (selectedEntries.length === 0) return null;

    const totalHours = selectedEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const project = projects.find(p => p.id === selectedEntries[0].project_id);
    const client = clients.find(c => c.id === clientId);
    
    if (!project || !client) return null;

    const rate = project.hourly_rate || client.hourly_rate || 0;
    
    return addInvoiceItem({
      client_id: clientId,
      project_id: selectedEntries[0].project_id,
      description: description || `${project.name} - ${totalHours} hours`,
      quantity: totalHours,
      rate,
      type: 'hourly',
      date: new Date().toISOString().split('T')[0],
    });
  }, [timeEntries, projects, clients, addInvoiceItem]);

  // Mark as invoiced
  const markAsInvoiced = useCallback(async (itemIds: string[]): Promise<void> => {
    const updatePromises = itemIds.map(id => 
      updateInvoiceItem({ 
        id, 
        status: 'sent'
      })
    );
    
    await Promise.all(updatePromises);
  }, [updateInvoiceItem]);

  // Mark as paid
  const markAsPaid = useCallback(async (itemIds: string[]): Promise<void> => {
    const updatePromises = itemIds.map(id => 
      updateInvoiceItem({ 
        id, 
        status: 'paid' 
      })
    );
    
    await Promise.all(updatePromises);
  }, [updateInvoiceItem]);

  useEffect(() => {
    fetchInvoiceItems();
  }, [fetchInvoiceItems]);

  return {
    invoiceItems,
    loading,
    error,
    addInvoiceItem,
    updateInvoiceItem,
    deleteInvoiceItem,
    getInvoiceSummary,
    getClientSummaries,
    getProjectSummaries,
    createInvoiceFromTimeEntries,
    markAsInvoiced,
    markAsPaid,
    refetch: fetchInvoiceItems,
  };
}
