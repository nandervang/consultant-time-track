import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CVProfile } from '@/types/cv';
import { useAuth } from './useAuth';

export function useCVProfiles() {
  const [profiles, setProfiles] = useState<CVProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cv_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createProfile = async (profileData: Omit<CVProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('cv_profiles')
        .insert([{ ...profileData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setProfiles(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create profile');
    }
  };

  const updateProfile = async (id: string, updates: Partial<CVProfile>) => {
    try {
      const { data, error } = await supabase
        .from('cv_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setProfiles(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cv_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  const duplicateProfile = async (id: string, newTitle: string) => {
    const originalProfile = profiles.find(p => p.id === id);
    if (!originalProfile) throw new Error('Profile not found');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, user_id: _userId, created_at: _createdAt, updated_at: _updatedAt, ...profileData } = originalProfile;
    
    return createProfile({
      ...profileData,
      title: newTitle,
      is_active: false // New duplicates start as inactive
    });
  };

  const setActiveProfile = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // First, set all profiles to inactive
      const { error: deactivateError } = await supabase
        .from('cv_profiles')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (deactivateError) throw deactivateError;

      // Then set the selected profile as active
      const { data, error } = await supabase
        .from('cv_profiles')
        .update({ is_active: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProfiles(prev => prev.map(p => ({
        ...p,
        is_active: p.id === id
      })));

      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to set active profile');
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
    setActiveProfile,
    refetch: fetchProfiles
  };
}
