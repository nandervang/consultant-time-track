import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface TechnologyTag {
  id: string
  cv_profile_id: string
  name: string
  category: string
  color: string
  usage_count: number
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  cv_profile_id: string
  experience_id?: string
  project_id?: string
  title: string
  description: string
  achievement_type: string
  quantified_impact?: string
  impact_value?: number
  impact_unit?: string
  date_achieved?: string
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface EnhancedProject {
  id: string
  cv_profile_id: string
  project_name: string
  client_company?: string
  description?: string
  my_role?: string
  start_date: string
  end_date?: string
  technologies_used: string[]
  achievements: string[]
  project_url?: string
  repository_url?: string
  project_type?: string
  project_status: string
  team_size?: number
  budget_range?: string
  duration_months?: number
  client_industry?: string
  challenges_overcome: string[]
  methodologies_used: string[]
  is_featured: boolean
  confidential: boolean
  sort_order: number
  created_at: string
  updated_at: string
  technology_names?: string[]
  technology_categories?: string[]
  achievement_count?: number
  achievements_titles?: string[]
}

export interface EnhancedExperience {
  id: string
  cv_profile_id: string
  company_name: string
  role_title: string
  description?: string
  start_date: string
  end_date?: string
  is_current: boolean
  location?: string
  achievements: string[]
  skills_used: string[]
  employment_type?: string
  company_industry?: string
  company_size?: string
  key_technologies: string[]
  team_size?: number
  reporting_to?: string
  budget_responsibility?: number
  currency: string
  sort_order: number
  created_at: string
  updated_at: string
  technology_names?: string[]
  technology_categories?: string[]
  achievement_count?: number
  achievements_titles?: string[]
}

export interface CreateTechnologyTagData {
  cv_profile_id: string
  name: string
  category: string
  color?: string
}

export interface CreateAchievementData {
  cv_profile_id: string
  experience_id?: string
  project_id?: string
  title: string
  description: string
  achievement_type: string
  quantified_impact?: string
  impact_value?: number
  impact_unit?: string
  date_achieved?: string
  is_featured?: boolean
  sort_order?: number
}

export function useEnhancedProjects(cvProfileId: string | null) {
  const [projects, setProjects] = useState<EnhancedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!cvProfileId) {
      setProjects([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_projects')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [cvProfileId])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = async (projectData: Partial<EnhancedProject>): Promise<EnhancedProject | null> => {
    try {
      const { data, error } = await supabase
        .from('cv_projects')
        .insert([{
          ...projectData,
          cv_profile_id: cvProfileId
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchProjects() // Refresh the list
      return data
    } catch (err) {
      console.error('Error creating project:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const updateProject = async (id: string, updates: Partial<EnhancedProject>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_projects')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      await fetchProjects() // Refresh the list
      return true
    } catch (err) {
      console.error('Error updating project:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchProjects() // Refresh the list
      return true
    } catch (err) {
      console.error('Error deleting project:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const toggleFeatured = async (id: string): Promise<boolean> => {
    const project = projects.find(p => p.id === id)
    if (!project) return false

    return updateProject(id, { is_featured: !project.is_featured })
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    toggleFeatured
  }
}

export function useEnhancedExperiences(cvProfileId: string | null) {
  const [experiences, setExperiences] = useState<EnhancedExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExperiences = useCallback(async () => {
    if (!cvProfileId) {
      setExperiences([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_experiences')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('start_date', { ascending: false }) // Most recent first

      if (error) throw error
      setExperiences(data || [])
    } catch (err) {
      console.error('Error fetching experiences:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [cvProfileId])

  useEffect(() => {
    fetchExperiences()
  }, [fetchExperiences])

  const createExperience = async (experienceData: Partial<EnhancedExperience>): Promise<EnhancedExperience | null> => {
    try {
      const { data, error } = await supabase
        .from('cv_experiences')
        .insert([{
          ...experienceData,
          cv_profile_id: cvProfileId
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchExperiences() // Refresh the list
      return data
    } catch (err) {
      console.error('Error creating experience:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const updateExperience = async (id: string, updates: Partial<EnhancedExperience>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_experiences')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      await fetchExperiences() // Refresh the list
      return true
    } catch (err) {
      console.error('Error updating experience:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const deleteExperience = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_experiences')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchExperiences() // Refresh the list
      return true
    } catch (err) {
      console.error('Error deleting experience:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  return {
    experiences,
    loading,
    error,
    fetchExperiences,
    createExperience,
    updateExperience,
    deleteExperience
  }
}

export function useTechnologyTags(cvProfileId: string | null) {
  const [tags, setTags] = useState<TechnologyTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    if (!cvProfileId) {
      setTags([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_technology_tags')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('usage_count', { ascending: false })

      if (error) throw error
      setTags(data || [])
    } catch (err) {
      console.error('Error fetching technology tags:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [cvProfileId])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const createTag = async (tagData: CreateTechnologyTagData): Promise<TechnologyTag | null> => {
    try {
      const { data, error } = await supabase
        .from('cv_technology_tags')
        .insert([tagData])
        .select()
        .single()

      if (error) throw error
      
      await fetchTags() // Refresh the list
      return data
    } catch (err) {
      console.error('Error creating technology tag:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const updateTag = async (id: string, updates: Partial<TechnologyTag>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_technology_tags')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      await fetchTags() // Refresh the list
      return true
    } catch (err) {
      console.error('Error updating technology tag:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const deleteTag = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_technology_tags')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchTags() // Refresh the list
      return true
    } catch (err) {
      console.error('Error deleting technology tag:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const getTagsByCategory = (category: string) => {
    return tags.filter(tag => tag.category === category)
  }

  const getAllCategories = () => {
    return [...new Set(tags.map(tag => tag.category))].filter(Boolean)
  }

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    getTagsByCategory,
    getAllCategories
  }
}

export function useAchievements(cvProfileId: string | null) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAchievements = useCallback(async () => {
    if (!cvProfileId) {
      setAchievements([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_achievements')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('date_achieved', { ascending: false })

      if (error) throw error
      setAchievements(data || [])
    } catch (err) {
      console.error('Error fetching achievements:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [cvProfileId])

  useEffect(() => {
    fetchAchievements()
  }, [fetchAchievements])

  const createAchievement = async (achievementData: CreateAchievementData): Promise<Achievement | null> => {
    try {
      const { data, error } = await supabase
        .from('cv_achievements')
        .insert([achievementData])
        .select()
        .single()

      if (error) throw error
      
      await fetchAchievements() // Refresh the list
      return data
    } catch (err) {
      console.error('Error creating achievement:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const updateAchievement = async (id: string, updates: Partial<Achievement>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_achievements')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      await fetchAchievements() // Refresh the list
      return true
    } catch (err) {
      console.error('Error updating achievement:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const deleteAchievement = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_achievements')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchAchievements() // Refresh the list
      return true
    } catch (err) {
      console.error('Error deleting achievement:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const toggleFeatured = async (id: string): Promise<boolean> => {
    const achievement = achievements.find(a => a.id === id)
    if (!achievement) return false

    return updateAchievement(id, { is_featured: !achievement.is_featured })
  }

  const getAchievementsByType = (type: string) => {
    return achievements.filter(achievement => achievement.achievement_type === type)
  }

  const getFeaturedAchievements = () => {
    return achievements.filter(achievement => achievement.is_featured)
  }

  return {
    achievements,
    loading,
    error,
    fetchAchievements,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    toggleFeatured,
    getAchievementsByType,
    getFeaturedAchievements
  }
}
