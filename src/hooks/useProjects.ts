import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Project {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultProjects = [
    { name: 'Cisco', color: '#3B82F6' },
    { name: 'PTS', color: '#10B981' },
    { name: 'Other', color: '#F59E0B' },
  ];

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data.length === 0) {
        // Create default projects for new users
        await createDefaultProjects();
      } else {
        setProjects(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProjects = async () => {
    try {
      const projectsToInsert = defaultProjects.map(project => ({
        ...project,
        user_id: user!.id,
      }));

      const { data, error } = await supabase
        .from('projects')
        .insert(projectsToInsert)
        .select();

      if (error) throw error;
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create default projects');
    }
  };

  const createProject = async (name: string, color: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          color,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      setProjects(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create project';
      setError(error);
      return { data: null, error };
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    refetch: fetchProjects,
  };
}