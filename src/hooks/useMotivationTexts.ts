import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface MotivationText {
  id: string
  cv_profile_id: string
  title: string
  content: string
  purpose: string
  is_default: boolean
  word_count: number
  sort_order: number
  created_at: string
  updated_at: string
  // Rich text enhancement fields
  content_type?: string
  rich_content?: any
  reading_time_minutes?: number
  tone?: string
  target_keywords?: string[]
  version_number?: number
  is_ai_generated?: boolean
  ai_prompt_used?: string
}

export interface CreateMotivationTextData {
  cv_profile_id: string
  title: string
  content: string
  purpose: string
  is_default?: boolean
  sort_order?: number
  // Rich text enhancement fields
  content_type?: string
  rich_content?: any
  tone?: string
  target_keywords?: string[]
  is_ai_generated?: boolean
  ai_prompt_used?: string | null
}

export interface UpdateMotivationTextData {
  title?: string
  content?: string
  purpose?: string
  is_default?: boolean
  sort_order?: number
}

export function useMotivationTexts(cvProfileId: string | null) {
  const [motivationTexts, setMotivationTexts] = useState<MotivationText[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMotivationTexts = useCallback(async () => {
    if (!cvProfileId) {
      setMotivationTexts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('cv_motivation_texts')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setMotivationTexts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch motivation texts')
      console.error('Error fetching motivation texts:', err)
    } finally {
      setLoading(false)
    }
  }, [cvProfileId])

  const createMotivationText = async (motivationTextData: CreateMotivationTextData): Promise<MotivationText | null> => {
    try {
      setError(null)

      // If this is set as default, unset other defaults first
      if (motivationTextData.is_default) {
        await supabase
          .from('cv_motivation_texts')
          .update({ is_default: false })
          .eq('cv_profile_id', motivationTextData.cv_profile_id)
      }

      const { data, error: insertError } = await supabase
        .from('cv_motivation_texts')
        .insert([motivationTextData])
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh the list
      await fetchMotivationTexts()
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create motivation text')
      console.error('Error creating motivation text:', err)
      return null
    }
  }

  const updateMotivationText = async (id: string, updates: UpdateMotivationTextData): Promise<boolean> => {
    try {
      setError(null)

      // If this is being set as default, unset other defaults first
      if (updates.is_default && cvProfileId) {
        await supabase
          .from('cv_motivation_texts')
          .update({ is_default: false })
          .eq('cv_profile_id', cvProfileId)
          .neq('id', id)
      }

      const { error: updateError } = await supabase
        .from('cv_motivation_texts')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError

      // Refresh the list
      await fetchMotivationTexts()
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update motivation text')
      console.error('Error updating motivation text:', err)
      return false
    }
  }

  const deleteMotivationText = async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('cv_motivation_texts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Refresh the list
      await fetchMotivationTexts()
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete motivation text')
      console.error('Error deleting motivation text:', err)
      return false
    }
  }

  const duplicateMotivationText = async (id: string, newTitle?: string): Promise<MotivationText | null> => {
    try {
      setError(null)

      // First get the original text
      const { data: original, error: fetchError } = await supabase
        .from('cv_motivation_texts')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const duplicateData: CreateMotivationTextData = {
        cv_profile_id: original.cv_profile_id,
        title: newTitle || `${original.title} (Copy)`,
        content: original.content,
        purpose: original.purpose,
        is_default: false, // Copies are never default
        sort_order: original.sort_order + 1
      }

      return await createMotivationText(duplicateData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate motivation text')
      console.error('Error duplicating motivation text:', err)
      return null
    }
  }

  const setAsDefault = async (id: string): Promise<boolean> => {
    return await updateMotivationText(id, { is_default: true })
  }

  const getDefaultMotivationText = (): MotivationText | null => {
    return motivationTexts.find(text => text.is_default) || motivationTexts[0] || null
  }

  const getMotivationTextsByPurpose = (purpose: string): MotivationText[] => {
    return motivationTexts.filter(text => text.purpose === purpose)
  }

  const getAllPurposes = (): string[] => {
    const purposes = motivationTexts.map(text => text.purpose)
    return Array.from(new Set(purposes)).filter(Boolean)
  }

  // Refresh data when cvProfileId changes
  useEffect(() => {
    fetchMotivationTexts()
  }, [cvProfileId, fetchMotivationTexts])

  return {
    motivationTexts,
    loading,
    error,
    fetchMotivationTexts,
    createMotivationText,
    updateMotivationText,
    deleteMotivationText,
    duplicateMotivationText,
    setAsDefault,
    getDefaultMotivationText,
    getMotivationTextsByPurpose,
    getAllPurposes
  }
}
