import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { JobApplication } from '@/types/cv';
import { useAuth } from './useAuth';

export function useJobApplications(cvProfileId?: string) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchApplications = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          cv_profiles!inner(
            id,
            title,
            user_id
          )
        `)
        .eq('cv_profiles.user_id', user.id)
        .order('application_date', { ascending: false });

      if (cvProfileId) {
        query = query.eq('cv_profile_id', cvProfileId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, cvProfileId]);

  const createApplication = async (applicationData: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .insert([applicationData])
        .select()
        .single();

      if (error) throw error;
      setApplications(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create application');
    }
  };

  const updateApplication = async (id: string, updates: Partial<JobApplication>) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setApplications(prev => prev.map(a => a.id === id ? data : a));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update application');
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setApplications(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete application');
    }
  };

  const getApplicationStats = () => {
    const total = applications.length;
    const byStatus = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const interviewRate = total > 0 ? ((byStatus.interview || 0) / total) * 100 : 0;
    const successRate = total > 0 ? (((byStatus.offered || 0) + (byStatus.accepted || 0)) / total) * 100 : 0;

    return {
      total,
      byStatus,
      interviewRate: Math.round(interviewRate),
      successRate: Math.round(successRate),
      pending: (byStatus.applied || 0) + (byStatus.interview || 0),
    };
  };

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    createApplication,
    updateApplication,
    deleteApplication,
    getApplicationStats,
    refetch: fetchApplications
  };
}
