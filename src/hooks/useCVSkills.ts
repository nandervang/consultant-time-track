import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CVSkill } from '@/types/cv';

export function useCVSkills(cvProfileId: string) {
  const [skills, setSkills] = useState<CVSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    if (!cvProfileId) {
      setSkills([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cv_skills')
        .select('*')
        .eq('cv_profile_id', cvProfileId)
        .order('is_highlighted', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('skill_name', { ascending: true });

      if (error) throw error;
      setSkills(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [cvProfileId]);

  const createSkill = async (skillData: Omit<CVSkill, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cv_skills')
        .insert([skillData])
        .select()
        .single();

      if (error) throw error;
      setSkills(prev => [...prev, data].sort((a, b) => a.skill_name.localeCompare(b.skill_name)));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create skill');
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

  const updateSkillOrder = async (skillIds: string[]) => {
    try {
      const updates = skillIds.map((id, index) => ({
        id,
        sort_order: index
      }));

      const { error } = await supabase
        .from('cv_skills')
        .upsert(updates);

      if (error) throw error;
      
      // Update local state
      setSkills(prev => {
        const newSkills = [...prev];
        skillIds.forEach((id, index) => {
          const skillIndex = newSkills.findIndex(s => s.id === id);
          if (skillIndex !== -1) {
            newSkills[skillIndex].sort_order = index;
          }
        });
        return newSkills.sort((a, b) => a.sort_order - b.sort_order);
      });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update skill order');
    }
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

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    skills,
    loading,
    error,
    createSkill,
    updateSkill,
    deleteSkill,
    updateSkillOrder,
    getSkillsByCategory,
    getSkillStats,
    refetch: fetchSkills
  };
}
