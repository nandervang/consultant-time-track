import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Project {
  id: string;
  name: string;
  color: string;
  user_id: string;
  client_id?: string | null;
  description?: string | null;
  status?: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  hourly_rate?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateProjectData {
  name: string;
  color: string;
  client_id?: string | null;
  description?: string;
  status?: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  budget?: number;
  hourly_rate?: number;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
}

export function useProjects(userId?: string | null) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveUserId = userId || user?.id;

  const defaultProjects = [
    { name: 'Cisco', color: '#3B82F6', status: 'active' as const },
    { name: 'PTS', color: '#10B981', status: 'active' as const },
    { name: 'Other', color: '#F59E0B', status: 'active' as const },
  ];

  // Fetch projects
  const fetchProjects = async () => {
    if (!effectiveUserId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data.length === 0) {
        // Create default projects for new users
        await createDefaultProjects();
      } else {
        setProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      
      // Fallback to localStorage
      const savedProjects = localStorage.getItem(`projects_${effectiveUserId}`);
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }
    } finally {
      setLoading(false);
    }
  };

  // Create default projects
  const createDefaultProjects = async () => {
    if (!effectiveUserId) return;

    try {
      const projectsToInsert = defaultProjects.map(project => ({
        ...project,
        user_id: effectiveUserId,
      }));

      const { data, error } = await supabase
        .from('projects')
        .insert(projectsToInsert)
        .select();

      if (error) throw error;
      setProjects(data || []);
      
      // Save to localStorage as backup
      localStorage.setItem(`projects_${effectiveUserId}`, JSON.stringify(data || []));
    } catch (err) {
      console.error('Error creating default projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to create default projects');
    }
  };

  // Add new project
  const addProject = async (projectData: CreateProjectData): Promise<Project | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const newProject = {
        ...projectData,
        user_id: effectiveUserId,
        status: projectData.status || 'planning' as const,
        // Ensure empty strings are converted to null for optional date fields
        start_date: projectData.start_date || null,
        end_date: projectData.end_date || null,
        // Ensure empty strings are converted to null for optional fields
        description: projectData.description || null,
        client_id: projectData.client_id || null,
      };

      console.log('Attempting to insert project:', newProject);

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      console.log('Project inserted successfully:', data);

      if (data) {
        setProjects(prev => [data, ...prev]);
        
        // Save to localStorage as backup
        const updatedProjects = [data, ...projects];
        localStorage.setItem(`projects_${effectiveUserId}`, JSON.stringify(updatedProjects));
        
        return data;
      }

      return null;
    } catch (err) {
      console.error('Error adding project:', err);
      
      // Fallback to localStorage
      const fallbackProject: Project = {
        id: `local_${Date.now()}`,
        name: projectData.name,
        color: projectData.color,
        client_id: projectData.client_id || null,
        description: projectData.description || null,
        status: projectData.status || 'planning',
        start_date: projectData.start_date || null,
        end_date: projectData.end_date || null,
        budget: projectData.budget || null,
        hourly_rate: projectData.hourly_rate || null,
        user_id: effectiveUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updatedProjects = [fallbackProject, ...projects];
      setProjects(updatedProjects);
      localStorage.setItem(`projects_${effectiveUserId}`, JSON.stringify(updatedProjects));
      
      throw err;
    }
  };

  // Update project
  const updateProject = async (updateData: UpdateProjectData): Promise<Project | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { id, ...projectData } = updateData;

      const { data, error: updateError } = await supabase
        .from('projects')
        .update({
          ...projectData,
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
        setProjects(prev => prev.map(project => 
          project.id === id ? data : project
        ));
        
        // Update localStorage
        const updatedProjects = projects.map(project => 
          project.id === id ? data : project
        );
        localStorage.setItem(`projects_${effectiveUserId}`, JSON.stringify(updatedProjects));
        
        return data;
      }

      return null;
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  // Delete project
  const deleteProject = async (projectId: string): Promise<void> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', effectiveUserId);

      if (deleteError) {
        throw deleteError;
      }

      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      // Update localStorage
      const updatedProjects = projects.filter(project => project.id !== projectId);
      localStorage.setItem(`projects_${effectiveUserId}`, JSON.stringify(updatedProjects));
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  // Get project by ID
  const getProjectById = (projectId: string): Project | undefined => {
    return projects.find(project => project.id === projectId);
  };

  // Get projects by client
  const getProjectsByClient = (clientId: string): Project[] => {
    return projects.filter(project => project.client_id === clientId);
  };

  // Get active projects
  const getActiveProjects = (): Project[] => {
    return projects.filter(project => project.status === 'active');
  };

  // Legacy function for backward compatibility
  const createProject = async (name: string, color: string) => {
    try {
      const project = await addProject({ name, color });
      return { data: project, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create project';
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [effectiveUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByClient,
    getActiveProjects,
    createProject, // Legacy compatibility
    refetch: fetchProjects,
  };
}