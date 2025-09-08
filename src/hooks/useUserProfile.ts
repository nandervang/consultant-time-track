import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  company_name?: string;
  company_motto?: string;
  company_subtext?: string;
  avatar_url?: string;
  timezone?: string;
  currency?: string;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([
              {
                id: user.id,
                company_motto: 'Building the future, one project at a time.',
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            toast({
              title: 'Error',
              description: 'Failed to create user profile',
              variant: 'destructive',
            });
          } else {
            setProfile(newProfile);
          }
        } else {
          console.error('Error fetching profile:', error);
          toast({
            title: 'Error',
            description: 'Failed to load user profile',
            variant: 'destructive',
          });
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Update company motto
  const updateCompanyMotto = async (motto: string) => {
    if (!user || !profile) return false;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          company_motto: motto,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating motto:', error);
        toast({
          title: 'Error',
          description: 'Failed to save company motto',
          variant: 'destructive',
        });
        return false;
      }

      setProfile(data);
      toast({
        title: 'Success',
        description: 'Company motto updated successfully',
      });
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Update entire profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return false;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'destructive',
        });
        return false;
      }

      setProfile(data);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Update company subtext specifically
  const updateCompanySubtext = async (subtext: string) => {
    if (!user || !profile) return false;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          company_subtext: subtext,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company subtext:', error);
        toast({
          title: 'Error',
          description: 'Failed to update company subtext',
          variant: 'destructive',
        });
        return false;
      }

      setProfile(data);
      toast({
        title: 'Success',
        description: 'Company subtext updated successfully',
      });
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    updateCompanyMotto,
    updateCompanySubtext,
    updateProfile,
    refetch: fetchProfile,
  };
}
