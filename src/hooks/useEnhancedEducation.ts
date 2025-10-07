import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface EnhancedEducation {
  id: string
  cv_profile_id: string
  institution_name: string
  degree: string
  field_of_study?: string
  start_date?: string
  end_date?: string
  grade?: string
  description?: string
  education_type?: string
  education_level?: string
  credits?: number
  institution_country?: string
  institution_website?: string
  is_current: boolean
  thesis_title?: string
  thesis_description?: string
  advisor_name?: string
  skills_acquired: string[]
  courses_completed: string[]
  honors_awards: string[]
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
  status?: string
  duration_months?: number
}

export interface EnhancedCertification {
  id: string
  cv_profile_id: string
  name: string
  issuing_organization?: string
  issue_date?: string
  expiry_date?: string
  credential_id?: string
  credential_url?: string
  description?: string
  certification_type?: string
  difficulty_level?: string
  study_hours?: number
  exam_score?: string
  renewal_required: boolean
  verification_status: string
  skills_validated: string[]
  prerequisites: string[]
  continuing_education_units?: number
  is_featured: boolean
  cost?: number
  currency: string
  sort_order: number
  created_at: string
  updated_at: string
  status?: string
  days_until_expiry?: number
}

export interface TrainingCourse {
  id: string
  cv_profile_id: string
  course_name: string
  provider: string
  course_type?: string
  category?: string
  duration_hours?: number
  completion_date?: string
  certificate_url?: string
  certificate_id?: string
  grade_score?: string
  skills_learned: string[]
  description?: string
  cost?: number
  currency: string
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ConferenceEvent {
  id: string
  cv_profile_id: string
  event_name: string
  event_type?: string
  organizer?: string
  location?: string
  is_virtual: boolean
  start_date: string
  end_date?: string
  attendance_type?: string
  session_topics: string[]
  presentation_title?: string
  presentation_url?: string
  key_takeaways: string[]
  networking_contacts?: number
  cost?: number
  currency: string
  certificate_earned: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface LearningGoal {
  id: string
  cv_profile_id: string
  goal_title: string
  description?: string
  category?: string
  priority: string
  target_completion_date?: string
  status: string
  progress_percentage: number
  related_skills: string[]
  learning_methods: string[]
  budget_allocated?: number
  currency: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface EducationTimelineItem {
  id: string
  cv_profile_id: string
  item_type: string
  item_id: string
  title: string
  institution_provider?: string
  start_date?: string
  end_date?: string
  is_ongoing: boolean
  importance_score: number
  created_at: string
}

export function useEnhancedEducation(cvProfileId: string | null) {
  const [education, setEducation] = useState<EnhancedEducation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEducation = useCallback(async () => {
    if (!cvProfileId) {
      setEducation([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_education')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('start_date', { ascending: false })

      if (error) throw error
      setEducation(data || [])
    } catch (err) {
      console.error('Error fetching education:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [cvProfileId])

  useEffect(() => {
    fetchEducation()
  }, [fetchEducation])

  const createEducation = async (educationData: Partial<EnhancedEducation>): Promise<EnhancedEducation | null> => {
    try {
      const { data, error } = await supabase
        .from('cv_education')
        .insert([{
          ...educationData,
          cv_profile_id: cvProfileId
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchEducation()
      return data
    } catch (err) {
      console.error('Error creating education:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const updateEducation = async (id: string, updates: Partial<EnhancedEducation>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_education')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      await fetchEducation()
      return true
    } catch (err) {
      console.error('Error updating education:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const deleteEducation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_education')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchEducation()
      return true
    } catch (err) {
      console.error('Error deleting education:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const toggleFeatured = async (id: string): Promise<boolean> => {
    const item = education.find(e => e.id === id)
    if (!item) return false

    return updateEducation(id, { is_featured: !item.is_featured })
  }

  return {
    education,
    loading,
    error,
    fetchEducation,
    createEducation,
    updateEducation,
    deleteEducation,
    toggleFeatured
  }
}

export function useEnhancedCertifications(cvProfileId: string | null) {
  const [certifications, setCertifications] = useState<EnhancedCertification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCertifications = useCallback(async () => {
    if (!cvProfileId) {
      setCertifications([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_certifications')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('issue_date', { ascending: false })

      if (error) throw error
      setCertifications(data || [])
    } catch (err) {
      console.error('Error fetching certifications:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [cvProfileId])

  useEffect(() => {
    fetchCertifications()
  }, [fetchCertifications])

  const createCertification = async (certData: Partial<EnhancedCertification>): Promise<EnhancedCertification | null> => {
    try {
      const { data, error } = await supabase
        .from('cv_certifications')
        .insert([{
          ...certData,
          cv_profile_id: cvProfileId
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchCertifications()
      return data
    } catch (err) {
      console.error('Error creating certification:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const updateCertification = async (id: string, updates: Partial<EnhancedCertification>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_certifications')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      await fetchCertifications()
      return true
    } catch (err) {
      console.error('Error updating certification:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const deleteCertification = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_certifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchCertifications()
      return true
    } catch (err) {
      console.error('Error deleting certification:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const toggleFeatured = async (id: string): Promise<boolean> => {
    const item = certifications.find(c => c.id === id)
    if (!item) return false

    return updateCertification(id, { is_featured: !item.is_featured })
  }

  const getExpiringSoon = () => {
    return certifications.filter(cert => cert.status === 'Expiring Soon')
  }

  const getExpired = () => {
    return certifications.filter(cert => cert.status === 'Expired')
  }

  const getValidCertifications = () => {
    return certifications.filter(cert => cert.status === 'Valid' || cert.status === 'Permanent')
  }

  return {
    certifications,
    loading,
    error,
    fetchCertifications,
    createCertification,
    updateCertification,
    deleteCertification,
    toggleFeatured,
    getExpiringSoon,
    getExpired,
    getValidCertifications
  }
}

export function useTrainingCourses(cvProfileId: string | null) {
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    if (!cvProfileId) {
      setCourses([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_training_courses')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('completion_date', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [cvProfileId])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const createCourse = async (courseData: Partial<TrainingCourse>): Promise<TrainingCourse | null> => {
    try {
      const { data, error } = await supabase
        .from('cv_training_courses')
        .insert([{
          ...courseData,
          cv_profile_id: cvProfileId
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchCourses()
      return data
    } catch (err) {
      console.error('Error creating course:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const updateCourse = async (id: string, updates: Partial<TrainingCourse>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_training_courses')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      await fetchCourses()
      return true
    } catch (err) {
      console.error('Error updating course:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const deleteCourse = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_training_courses')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchCourses()
      return true
    } catch (err) {
      console.error('Error deleting course:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  const getCoursesByCategory = (category: string) => {
    return courses.filter(course => course.category === category)
  }

  const getAllCategories = () => {
    return [...new Set(courses.map(course => course.category))].filter(Boolean)
  }

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getCoursesByCategory,
    getAllCategories
  }
}

export function useEducationTimeline(cvProfileId: string | null) {
  const [timeline, setTimeline] = useState<EducationTimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTimeline = useCallback(async () => {
    if (!cvProfileId) {
      setTimeline([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_education_timeline')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('start_date', { ascending: false })

      if (error) throw error
      setTimeline(data || [])
    } catch (err) {
      console.error('Error fetching education timeline:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [cvProfileId])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  const getTimelineByYear = () => {
    const timelineByYear: { [year: string]: EducationTimelineItem[] } = {}
    
    timeline.forEach(item => {
      const year = item.start_date ? new Date(item.start_date).getFullYear().toString() : 'Unknown'
      if (!timelineByYear[year]) {
        timelineByYear[year] = []
      }
      timelineByYear[year].push(item)
    })
    
    return timelineByYear
  }

  const getTimelineByType = (type: string) => {
    return timeline.filter(item => item.item_type === type)
  }

  return {
    timeline,
    loading,
    error,
    fetchTimeline,
    getTimelineByYear,
    getTimelineByType
  }
}
