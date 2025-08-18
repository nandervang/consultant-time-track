import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  hourly_rate: number | null;
  currency: string | null;
  status: 'active' | 'inactive' | 'archived';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  hourly_rate?: number;
  currency?: string;
  status?: 'active' | 'inactive' | 'archived';
  notes?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string;
}

export function useClients(userId?: string | null) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveUserId = userId || user?.id;

  // Fetch clients
  const fetchClients = async () => {
    if (!effectiveUserId) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      
      // Fallback to localStorage
      const savedClients = localStorage.getItem(`clients_${effectiveUserId}`);
      if (savedClients) {
        setClients(JSON.parse(savedClients));
      }
    } finally {
      setLoading(false);
    }
  };

  // Add new client
  const addClient = async (clientData: CreateClientData): Promise<Client | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const newClient = {
        ...clientData,
        user_id: effectiveUserId,
        currency: clientData.currency || 'SEK',
        status: clientData.status || 'active' as const,
      };

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([newClient])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setClients(prev => [data, ...prev]);
        
        // Save to localStorage as backup
        const updatedClients = [data, ...clients];
        localStorage.setItem(`clients_${effectiveUserId}`, JSON.stringify(updatedClients));
        
        return data;
      }

      return null;
    } catch (err) {
      console.error('Error adding client:', err);
      
      // Fallback to localStorage
      const fallbackClient: Client = {
        id: `local_${Date.now()}`,
        name: clientData.name,
        email: clientData.email || null,
        phone: clientData.phone || null,
        company: clientData.company || null,
        address: clientData.address || null,
        hourly_rate: clientData.hourly_rate || null,
        notes: clientData.notes || null,
        user_id: effectiveUserId,
        currency: clientData.currency || 'SEK',
        status: clientData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updatedClients = [fallbackClient, ...clients];
      setClients(updatedClients);
      localStorage.setItem(`clients_${effectiveUserId}`, JSON.stringify(updatedClients));
      
      throw err;
    }
  };

  // Update client
  const updateClient = async (updateData: UpdateClientData): Promise<Client | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { id, ...clientData } = updateData;

      const { data, error: updateError } = await supabase
        .from('clients')
        .update({
          ...clientData,
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
        setClients(prev => prev.map(client => 
          client.id === id ? data : client
        ));
        
        // Update localStorage
        const updatedClients = clients.map(client => 
          client.id === id ? data : client
        );
        localStorage.setItem(`clients_${effectiveUserId}`, JSON.stringify(updatedClients));
        
        return data;
      }

      return null;
    } catch (err) {
      console.error('Error updating client:', err);
      throw err;
    }
  };

  // Delete client
  const deleteClient = async (clientId: string): Promise<void> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', effectiveUserId);

      if (deleteError) {
        throw deleteError;
      }

      setClients(prev => prev.filter(client => client.id !== clientId));
      
      // Update localStorage
      const updatedClients = clients.filter(client => client.id !== clientId);
      localStorage.setItem(`clients_${effectiveUserId}`, JSON.stringify(updatedClients));
    } catch (err) {
      console.error('Error deleting client:', err);
      throw err;
    }
  };

  // Get client by ID
  const getClientById = (clientId: string): Client | undefined => {
    return clients.find(client => client.id === clientId);
  };

  // Get active clients
  const getActiveClients = (): Client[] => {
    return clients.filter(client => client.status === 'active');
  };

  // Archive client (soft delete)
  const archiveClient = async (clientId: string): Promise<void> => {
    await updateClient({ id: clientId, status: 'archived' });
  };

  // Activate client
  const activateClient = async (clientId: string): Promise<void> => {
    await updateClient({ id: clientId, status: 'active' });
  };

  useEffect(() => {
    fetchClients();
  }, [effectiveUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    getActiveClients,
    archiveClient,
    activateClient,
    refetch: fetchClients,
  };
}
