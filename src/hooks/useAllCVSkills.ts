import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CVSkill } from '@/types/cv';
import { useAuth } from './useAuth';

export function useAllCVSkills() {
  const [skills, setSkills] = useState<CVSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAllSkills = useCallback(async () => {
    if (!user) {
      setSkills([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cv_skills')
        .select(`
          *,
          cv_profiles!inner(
            id,
            title,
            user_id
          )
        `)
        .eq('cv_profiles.user_id', user.id)
        .order('skill_level', { ascending: false })
        .order('skill_name', { ascending: true });

      if (error) throw error;
      setSkills(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getSkillsByProfile = () => {
    return skills.reduce((acc, skill) => {
      const profileId = skill.cv_profile_id;
      if (!acc[profileId]) {
        acc[profileId] = [];
      }
      acc[profileId].push(skill);
      return acc;
    }, {} as Record<string, CVSkill[]>);
  };

  const getSkillsByCategory = () => {
    return skills.reduce((acc, skill) => {
      const category = skill.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {} as Record<string, CVSkill[]>);
  };

  const getTopSkills = (limit: number = 10) => {
    return [...skills]
      .sort((a, b) => {
        // First sort by level (highest first)
        if (a.skill_level !== b.skill_level) {
          return b.skill_level - a.skill_level;
        }
        // Then by highlighted status
        if (a.is_highlighted !== b.is_highlighted) {
          return a.is_highlighted ? -1 : 1;
        }
        // Finally alphabetically
        return a.skill_name.localeCompare(b.skill_name);
      })
      .slice(0, limit);
  };

  const getSkillStats = () => {
    const total = skills.length;
    const highlighted = skills.filter(s => s.is_highlighted).length;
    const byLevel = skills.reduce((acc, skill) => {
      acc[skill.skill_level] = (acc[skill.skill_level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const averageLevel = total > 0 
      ? skills.reduce((sum, skill) => sum + skill.skill_level, 0) / total 
      : 0;

    return {
      total,
      highlighted,
      byLevel,
      averageLevel: Math.round(averageLevel * 10) / 10,
      categories: Object.keys(getSkillsByCategory()).length
    };
  };

  const deleteSkill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cv_skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete skill');
    }
  };

  const updateSkill = async (id: string, updates: Partial<CVSkill>) => {
    try {
      const { data, error } = await supabase
        .from('cv_skills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setSkills(prev => prev.map(s => s.id === id ? data : s));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update skill');
    }
  };

  useEffect(() => {
    fetchAllSkills();
  }, [fetchAllSkills]);

  return {
    skills,
    loading,
    error,
    getSkillsByProfile,
    getSkillsByCategory,
    getTopSkills,
    getSkillStats,
    deleteSkill,
    updateSkill,
    refetch: fetchAllSkills
  };
}
