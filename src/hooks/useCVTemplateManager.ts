import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CVTemplate } from '@/types/cvGeneration';
import { cvGenerationAPI } from '@/services/cvGenerationAPI';

export function useCVTemplateManager() {
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplatesFromAPI = useCallback(async () => {
    try {
      const response = await cvGenerationAPI.getTemplates();
      return response.data || [];
    } catch (err) {
      console.error('Error fetching templates from API:', err);
      return [];
    }
  }, []);

  const fetchTemplatesFromDB = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cv_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching templates from DB:', err);
      return [];
    }
  }, []);

  const syncTemplates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API first
      const apiTemplates = await fetchTemplatesFromAPI();
      
      if (apiTemplates.length > 0) {
        // Update local database with API templates
        for (const template of apiTemplates) {
          await supabase
            .from('cv_templates')
            .upsert({
              id: template.id,
              name: template.name,
              description: template.description,
              template_type: template.template_type,
              industry_focus: template.industry_focus,
              layout_structure: template.layout_structure,
              styling_config: template.styling_config,
              sections_config: template.sections_config,
              is_premium: template.is_premium,
              is_active: template.is_active,
              preview_image_url: template.preview_image_url,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
        }
        setTemplates(apiTemplates);
      } else {
        // Fallback to cached templates from DB
        const dbTemplates = await fetchTemplatesFromDB();
        setTemplates(dbTemplates);
      }
    } catch (err) {
      console.error('Error syncing templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      
      // Try to load from cache as fallback
      const dbTemplates = await fetchTemplatesFromDB();
      setTemplates(dbTemplates);
    } finally {
      setLoading(false);
    }
  }, [fetchTemplatesFromAPI, fetchTemplatesFromDB]);

  const getDefaultTemplates = () => [
    {
      id: 'frank-digital',
      name: 'Frank Digital Professional',
      description: 'Clean, modern template perfect for tech professionals',
      template_type: 'professional',
      industry_focus: 'technology',
      layout_structure: {},
      styling_config: {},
      sections_config: {},
      is_premium: false,
      is_active: true,
      preview_image_url: undefined,
      created_at: new Date().toISOString()
    },
    {
      id: 'minimal-modern',
      name: 'Minimal Modern',
      description: 'Minimalist design with clean typography',
      template_type: 'modern',
      industry_focus: 'general',
      layout_structure: {},
      styling_config: {},
      sections_config: {},
      is_premium: false,
      is_active: true,
      preview_image_url: undefined,
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // If no templates are available, use defaults
    if (templates.length === 0 && !loading) {
      setTemplates(getDefaultTemplates());
    }
  }, [templates.length, loading]);

  useEffect(() => {
    syncTemplates();
  }, [syncTemplates]);

  return {
    templates,
    loading,
    error,
    refetch: syncTemplates,
    getDefaultTemplates
  };
}