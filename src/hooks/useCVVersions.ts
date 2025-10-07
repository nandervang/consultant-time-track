import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CVVersion, CVGenerationData } from '@/types/cvGeneration';

export function useCVVersions(cvProfileId: string | null) {
  const [versions, setVersions] = useState<CVVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<CVVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!cvProfileId) {
      setVersions([]);
      setCurrentVersion(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cv_versions')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      // Map snapshot_data to data for the interface
      const versionsList = (data || []).map(version => ({
        ...version,
        data: version.snapshot_data
      }));
      setVersions(versionsList);
      setCurrentVersion(versionsList.find(v => v.is_current) || versionsList[0] || null);
    } catch (err) {
      console.error('Error fetching CV versions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [cvProfileId]);

  const createVersion = async (
    versionName: string,
    data: CVGenerationData,
    roleFocus?: string,
    language: 'en' | 'sv' = 'en'
  ): Promise<CVVersion | null> => {
    if (!cvProfileId) {
      console.error('No cvProfileId provided to createVersion');
      return null;
    }

    console.log('Creating version with data:', { 
      cvProfileId, 
      versionName, 
      roleFocus, 
      language, 
      dataKeys: Object.keys(data) 
    });

    try {
      // Get current version number
      const maxVersion = Math.max(0, ...versions.map(v => v.version_number));
      const newVersionNumber = maxVersion + 1;

      console.log('New version number will be:', newVersionNumber);

      // If we have 3 versions, remove the oldest non-current version
      if (versions.length >= 3) {
        const oldestVersion = versions
          .filter(v => !v.is_current)
          .sort((a, b) => a.version_number - b.version_number)[0];
        
        if (oldestVersion) {
          console.log('Removing oldest version:', oldestVersion.id);
          await supabase
            .from('cv_versions')
            .delete()
            .eq('id', oldestVersion.id);
        }
      }

      // Set all versions to non-current
      console.log('Setting all versions to non-current for profile:', cvProfileId);
      const { error: updateError } = await supabase
        .from('cv_versions')
        .update({ is_current: false })
        .eq('cv_profile_id', cvProfileId);

      if (updateError) {
        console.error('Error setting versions to non-current:', updateError);
      }

      // Create new version
      const insertData = {
        cv_profile_id: cvProfileId,
        version_name: versionName,
        version_number: newVersionNumber,
        snapshot_data: data, // Use snapshot_data instead of data
        role_focus: roleFocus,
        language: language,
        is_current: true
      };

      console.log('Inserting new version with data:', insertData);

      const { data: newVersion, error } = await supabase
        .from('cv_versions')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Database error creating version:', error);
        throw error;
      }

      console.log('New version created successfully:', newVersion);

      await fetchVersions();
      return newVersion;
    } catch (err) {
      console.error('Error creating CV version:', err);
      setError(err instanceof Error ? err.message : 'Failed to create version');
      return null;
    }
  };

  const updateVersion = async (
    versionId: string,
    updates: Partial<Pick<CVVersion, 'version_name' | 'data' | 'role_focus' | 'language'>>
  ): Promise<boolean> => {
    console.log('Updating version:', { versionId, updates });
    
    try {
      // Convert data field to snapshot_data for database
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.data) {
        updateData.snapshot_data = updates.data;
      }
      if (updates.version_name) {
        updateData.version_name = updates.version_name;
      }
      if (updates.role_focus !== undefined) {
        updateData.role_focus = updates.role_focus;
      }
      if (updates.language) {
        updateData.language = updates.language;
      }

      console.log('Update data to be sent:', updateData);

      const { error } = await supabase
        .from('cv_versions')
        .update(updateData)
        .eq('id', versionId);

      if (error) {
        console.error('Database error updating version:', error);
        throw error;
      }

      console.log('Version updated successfully');
      await fetchVersions();
      return true;
    } catch (err) {
      console.error('Error updating CV version:', err);
      setError(err instanceof Error ? err.message : 'Failed to update version');
      return false;
    }
  };

  const setCurrentVersionById = async (versionId: string): Promise<boolean> => {
    try {
      // Set all versions to non-current
      await supabase
        .from('cv_versions')
        .update({ is_current: false })
        .eq('cv_profile_id', cvProfileId);

      // Set selected version to current
      const { error } = await supabase
        .from('cv_versions')
        .update({ is_current: true })
        .eq('id', versionId);

      if (error) throw error;

      await fetchVersions();
      return true;
    } catch (err) {
      console.error('Error setting current version:', err);
      setError(err instanceof Error ? err.message : 'Failed to set current version');
      return false;
    }
  };

  const deleteVersion = async (versionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cv_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;

      await fetchVersions();
      return true;
    } catch (err) {
      console.error('Error deleting CV version:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete version');
      return false;
    }
  };

  const duplicateVersion = async (
    versionId: string,
    newName: string
  ): Promise<CVVersion | null> => {
    try {
      const versionToDuplicate = versions.find(v => v.id === versionId);
      if (!versionToDuplicate) {
        throw new Error('Version not found');
      }

      return await createVersion(
        newName,
        versionToDuplicate.data,
        versionToDuplicate.role_focus,
        versionToDuplicate.language
      );
    } catch (err) {
      console.error('Error duplicating CV version:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate version');
      return null;
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return {
    versions,
    currentVersion,
    loading,
    error,
    createVersion,
    updateVersion,
    setCurrentVersionById,
    deleteVersion,
    duplicateVersion,
    refetch: fetchVersions
  };
}