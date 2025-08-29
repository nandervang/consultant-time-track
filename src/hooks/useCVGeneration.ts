import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Types for CV Generation & Export
export interface CVTemplate {
  id: string
  name: string
  description: string
  template_type: string
  industry_focus: string
  layout_structure: any
  styling_config: any
  sections_config: any
  is_premium: boolean
  is_active: boolean
  preview_image_url?: string
  created_at: string
}

export interface CVGeneration {
  id: string
  cv_profile_id: string
  template_id: string
  job_application_id?: string
  generation_config: any
  content_data: any
  output_format: string
  file_url?: string
  file_size_bytes?: number
  generation_status: string
  error_message?: string
  download_count: number
  last_downloaded_at?: string
  expires_at?: string
  created_at: string
}

export interface CVAnalytics {
  id: string
  cv_profile_id: string
  metric_type: string
  metric_value: number
  metadata?: any
  recorded_at: string
}

export interface CustomizationPreset {
  id: string
  cv_profile_id: string
  preset_name: string
  job_type?: string
  industry?: string
  sections_priority: any
  content_filters: any
  template_preferences?: any
  is_default: boolean
  created_at: string
}

export interface ExportJob {
  id: string
  cv_profile_id: string
  user_id: string
  export_type: string
  template_id?: string
  customization_config: any
  status: string
  progress_percentage: number
  result_url?: string
  error_details?: string
  estimated_completion_at?: string
  completed_at?: string
  created_at: string
}

export interface AnalyticsSummary {
  total_generations: number
  total_downloads: number
  most_used_template: string
  most_popular_format: string
  generation_trend: any
}

// Hook for CV Templates
export function useCVTemplates() {
  const [templates, setTemplates] = useState<CVTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_type', { ascending: true })

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const getTemplatesByType = (type: string) => {
    return templates.filter(template => template.template_type === type)
  }

  const getTemplatesByIndustry = (industry: string) => {
    return templates.filter(template => template.industry_focus === industry)
  }

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    getTemplatesByType,
    getTemplatesByIndustry
  }
}

// Hook for CV Generations
export function useCVGenerations(cvProfileId: string | null) {
  const [generations, setGenerations] = useState<CVGeneration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGenerations = async () => {
    if (!cvProfileId) {
      setGenerations([])
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_generations')
        .select(`
          *,
          cv_templates(name, template_type)
        `)
        .eq('cv_profile_id', cvProfileId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGenerations(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch generations')
    } finally {
      setLoading(false)
    }
  }

  const createGeneration = async (generationData: Partial<CVGeneration>) => {
    try {
      const { data, error } = await supabase
        .from('cv_generations')
        .insert([{
          cv_profile_id: cvProfileId,
          ...generationData
        }])
        .select()
        .single()

      if (error) throw error
      
      // Record analytics
      await recordMetric('generation', 1, {
        template_id: generationData.template_id,
        format: generationData.output_format
      })
      
      await fetchGenerations()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create generation')
      throw err
    }
  }

  const updateGeneration = async (id: string, updates: Partial<CVGeneration>) => {
    try {
      const { error } = await supabase
        .from('cv_generations')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await fetchGenerations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update generation')
      throw err
    }
  }

  const recordDownload = async (generationId: string) => {
    try {
      // Update download count
      const { error } = await supabase.rpc('increment_download_count', {
        generation_id: generationId
      })

      if (error) throw error

      // Record analytics
      await recordMetric('download', 1, { generation_id: generationId })
      await fetchGenerations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record download')
    }
  }

  const recordMetric = async (metricType: string, value: number = 1, metadata: any = {}) => {
    if (!cvProfileId) return

    try {
      await supabase.rpc('record_cv_metric', {
        profile_id: cvProfileId,
        metric_type: metricType,
        metric_value: value,
        metadata
      })
    } catch (err) {
      console.error('Failed to record metric:', err)
    }
  }

  useEffect(() => {
    fetchGenerations()
  }, [cvProfileId])

  return {
    generations,
    loading,
    error,
    createGeneration,
    updateGeneration,
    recordDownload,
    recordMetric,
    refetch: fetchGenerations
  }
}

// Hook for CV Analytics
export function useCVAnalytics(cvProfileId: string | null) {
  const [analytics, setAnalytics] = useState<CVAnalytics[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchAnalytics = async (daysBack: number = 30) => {
    if (!cvProfileId) {
      setAnalytics([])
      setSummary(null)
      return
    }

    try {
      setLoading(true)
      
      // Fetch raw analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('cv_analytics')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .gte('recorded_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false })

      if (analyticsError) throw analyticsError

      // Fetch analytics summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_cv_analytics_summary', {
          profile_id: cvProfileId,
          days_back: daysBack
        })

      if (summaryError) throw summaryError

      setAnalytics(analyticsData || [])
      setSummary(summaryData?.[0] || null)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const getMetricsByType = (type: string) => {
    return analytics.filter(a => a.metric_type === type)
  }

  const getUsageByTimeframe = (days: number) => {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return analytics.filter(a => new Date(a.recorded_at) >= cutoff)
  }

  useEffect(() => {
    fetchAnalytics()
  }, [cvProfileId])

  return {
    analytics,
    summary,
    loading,
    fetchAnalytics,
    getMetricsByType,
    getUsageByTimeframe
  }
}

// Hook for Customization Presets
export function useCustomizationPresets(cvProfileId: string | null) {
  const [presets, setPresets] = useState<CustomizationPreset[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPresets = async () => {
    if (!cvProfileId) {
      setPresets([])
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_customization_presets')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('is_default', { ascending: false })

      if (error) throw error
      setPresets(data || [])
    } catch (err) {
      console.error('Failed to fetch presets:', err)
    } finally {
      setLoading(false)
    }
  }

  const createPreset = async (presetData: Partial<CustomizationPreset>) => {
    try {
      const { data, error } = await supabase
        .from('cv_customization_presets')
        .insert([{
          cv_profile_id: cvProfileId,
          ...presetData
        }])
        .select()
        .single()

      if (error) throw error
      await fetchPresets()
      return data
    } catch (err) {
      console.error('Failed to create preset:', err)
      throw err
    }
  }

  const updatePreset = async (id: string, updates: Partial<CustomizationPreset>) => {
    try {
      const { error } = await supabase
        .from('cv_customization_presets')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await fetchPresets()
    } catch (err) {
      console.error('Failed to update preset:', err)
      throw err
    }
  }

  const deletePreset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cv_customization_presets')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchPresets()
    } catch (err) {
      console.error('Failed to delete preset:', err)
      throw err
    }
  }

  const setDefaultPreset = async (id: string) => {
    try {
      // First, unset all existing defaults
      await supabase
        .from('cv_customization_presets')
        .update({ is_default: false })
        .eq('cv_profile_id', cvProfileId)

      // Then set the new default
      await supabase
        .from('cv_customization_presets')
        .update({ is_default: true })
        .eq('id', id)

      await fetchPresets()
    } catch (err) {
      console.error('Failed to set default preset:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [cvProfileId])

  return {
    presets,
    loading,
    createPreset,
    updatePreset,
    deletePreset,
    setDefaultPreset,
    refetch: fetchPresets
  }
}

// Hook for Export Queue
export function useExportQueue() {
  const [jobs, setJobs] = useState<ExportJob[]>([])
  const [loading, setLoading] = useState(false)

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('export_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setJobs(data || [])
    } catch (err) {
      console.error('Failed to fetch export jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const createExportJob = async (jobData: Partial<ExportJob>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('export_queue')
        .insert([{
          user_id: user.id,
          ...jobData
        }])
        .select()
        .single()

      if (error) throw error
      await fetchJobs()
      return data
    } catch (err) {
      console.error('Failed to create export job:', err)
      throw err
    }
  }

  const updateJobStatus = async (id: string, status: string, updates: Partial<ExportJob> = {}) => {
    try {
      const { error } = await supabase
        .from('export_queue')
        .update({ status, ...updates })
        .eq('id', id)

      if (error) throw error
      await fetchJobs()
    } catch (err) {
      console.error('Failed to update job status:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  return {
    jobs,
    loading,
    createExportJob,
    updateJobStatus,
    refetch: fetchJobs
  }
}
