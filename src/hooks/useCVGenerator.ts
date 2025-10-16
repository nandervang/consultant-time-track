import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CVGenerationData, CVGenerationJob, CVGenerationResult } from '@/types/cvGeneration';
import { cvGenerationAPI, type ConsultantCVPayload } from '@/services/cv-generation-api';
import { transformToAPIPayload, convertToConsultantPayload } from '@/utils/cv-data-transformer';

export function useCVGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationJob, setGenerationJob] = useState<CVGenerationJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createGenerationJob = async (
    cvProfileId: string,
    versionId: string,
    templateId: string,
    formats: string[] = ['pdf']
  ): Promise<CVGenerationJob | null> => {
    try {
      const { data, error } = await supabase
        .from('cv_generation_jobs')
        .insert([{
          cv_profile_id: cvProfileId,
          version_id: versionId,
          template_id: templateId,
          formats: formats,
          status: 'pending',
          progress: 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating generation job:', err);
      return null;
    }
  };

  const updateGenerationJob = async (
    jobId: string,
    updates: Partial<CVGenerationJob>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_generation_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating generation job:', err);
      return false;
    }
  };

  const generateCV = useCallback(async (
    cvData: CVGenerationData,
    templateId: string,
    format: string = 'pdf',
    cvProfileId?: string,
    versionId?: string
  ) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);

    let job: CVGenerationJob | null = null;

    try {
      // Create generation job for tracking if we have profile info
      if (cvProfileId && versionId) {
        job = await createGenerationJob(cvProfileId, versionId, templateId, [format]);
        setGenerationJob(job);
      }

      // Prepare CV data for API
      const apiData = transformToAPIPayload(cvData, {
        template: 'andervang-consulting',
        company: 'Frank Digital AB'
      });

      // Update progress
      setGenerationProgress(25);
      if (job) {
        await updateGenerationJob(job.id, { status: 'processing', progress: 25 });
      }

      // Call CV generation API
      const singlePayload = { ...apiData, format: format as 'pdf' | 'docx' | 'html' };
      const consultantPayload = convertToConsultantPayload(singlePayload);
      const result = await cvGenerationAPI.generateCV(consultantPayload);

      // Update progress
      setGenerationProgress(75);
      if (job) {
        await updateGenerationJob(job.id, { progress: 75 });
      }

      // Complete the job
      setGenerationProgress(100);
      if (job) {
        await updateGenerationJob(job.id, { 
          status: 'completed', 
          progress: 100,
          results: { [format]: result },
          completed_at: new Date().toISOString()
        });
      }

      setIsGenerating(false);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      setIsGenerating(false);

      // Update job with error
      if (job) {
        await updateGenerationJob(job.id, { 
          status: 'failed', 
          error_message: errorMessage 
        });
      }

      throw err;
    }
  }, []);

  const generateAllFormats = useCallback(async (
    cvData: CVGenerationData,
    templateId: string,
    cvProfileId?: string,
    versionId?: string
  ) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);

    const formats = ['pdf', 'html', 'docx'];
    let job: CVGenerationJob | null = null;

    try {
      // Create generation job for tracking
      if (cvProfileId && versionId) {
        job = await createGenerationJob(cvProfileId, versionId, templateId, formats);
        setGenerationJob(job);
      }

      // Prepare CV data for API
      const apiData = transformToAPIPayload(cvData, {
        template: 'andervang-consulting',
        company: 'Frank Digital AB'
      });

      // Update progress
      setGenerationProgress(25);
      if (job) {
        await updateGenerationJob(job.id, { status: 'processing', progress: 25 });
      }

      // Call CV generation API for all formats
      const consultantPayload = convertToConsultantPayload(apiData);
      const result = await cvGenerationAPI.generateAllFormats(consultantPayload);

      // Update progress
      setGenerationProgress(75);
      if (job) {
        await updateGenerationJob(job.id, { progress: 75 });
      }

      // Complete the job
      setGenerationProgress(100);
      if (job) {
        // Transform batch result to expected format
        const cvResult: CVGenerationResult = {
          data: {
            results: {},
            summary: {
              successful: result.success ? (result.data?.formats?.length || 0) : 0,
              total: result.data?.formats?.length || 0
            }
          }
        };
        
        if (result.data?.formats) {
          result.data.formats.forEach(formatResult => {
            cvResult.data!.results![formatResult.format] = {
              success: true,
              fileUrl: formatResult.url
            };
          });
        }
        
        await updateGenerationJob(job.id, { 
          status: 'completed', 
          progress: 100,
          results: { [formats.join('-')]: cvResult },
          completed_at: new Date().toISOString()
        });
      }

      setIsGenerating(false);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      setIsGenerating(false);

      // Update job with error
      if (job) {
        await updateGenerationJob(job.id, { 
          status: 'failed', 
          error_message: errorMessage 
        });
      }

      throw err;
    }
  }, []);

  const checkAPIHealth = useCallback(async () => {
    try {
      await cvGenerationAPI.checkHealth();
      return true;
    } catch (err) {
      console.error('CV API health check failed:', err);
      return false;
    }
  }, []);

  return {
    isGenerating,
    generationProgress,
    generationJob,
    error,
    generateCV,
    generateAllFormats,
    checkAPIHealth,
    setError
  };
}