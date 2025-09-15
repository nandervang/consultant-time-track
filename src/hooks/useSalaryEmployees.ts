import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { useAuth } from './useAuth';

type SalaryEmployee = Database['public']['Tables']['salary_employees']['Row'];
type SalaryEmployeeInsert = Database['public']['Tables']['salary_employees']['Insert'];
type SalaryEmployeeUpdate = Database['public']['Tables']['salary_employees']['Update'];

export interface CreateEmployeeData {
  name: string;
  email?: string;
  phone?: string;
  employee_number?: string;
  position?: string;
  base_salary: number;
  currency?: string;
  employment_start_date?: string;
  employment_end_date?: string;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  id: string;
  is_active?: boolean;
}

export function useSalaryEmployees(userId?: string | null) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  const [employees, setEmployees] = useState<SalaryEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('salary_employees')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEmployees(data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: CreateEmployeeData): Promise<SalaryEmployee | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const newEmployee: SalaryEmployeeInsert = {
        ...employeeData,
        user_id: effectiveUserId,
        currency: employeeData.currency || 'SEK',
        employment_start_date: employeeData.employment_start_date || new Date().toISOString().split('T')[0],
        is_active: true
      };

      const { data, error } = await supabase
        .from('salary_employees')
        .insert([newEmployee])
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev => [data, ...prev]);
      console.log('✅ Employee added:', data.name);
      return data;
    } catch (err) {
      console.error('Error adding employee:', err);
      setError(err instanceof Error ? err.message : 'Failed to add employee');
      throw err;
    }
  };

  const updateEmployee = async (updateData: UpdateEmployeeData): Promise<SalaryEmployee | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { id, ...updates } = updateData;
      const { data, error } = await supabase
        .from('salary_employees')
        .update(updates)
        .eq('id', id)
        .eq('user_id', effectiveUserId)
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev => prev.map(emp => emp.id === id ? data : emp));
      console.log('✅ Employee updated:', data.name);
      return data;
    } catch (err) {
      console.error('Error updating employee:', err);
      setError(err instanceof Error ? err.message : 'Failed to update employee');
      throw err;
    }
  };

  const deleteEmployee = async (employeeId: string): Promise<boolean> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      // First check if employee has salary payments
      const { data: payments, error: checkError } = await supabase
        .from('salary_payments')
        .select('id')
        .eq('employee_id', employeeId)
        .limit(1);

      if (checkError) throw checkError;

      if (payments && payments.length > 0) {
        // If employee has payments, deactivate instead of delete
        await updateEmployee({ id: employeeId, is_active: false });
        console.log('✅ Employee deactivated (has salary payments)');
        return true;
      }

      // If no payments, safe to delete
      const { error } = await supabase
        .from('salary_employees')
        .delete()
        .eq('id', employeeId)
        .eq('user_id', effectiveUserId);

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      console.log('✅ Employee deleted');
      return true;
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
      return false;
    }
  };

  const getActiveEmployees = (): SalaryEmployee[] => {
    return employees.filter(emp => emp.is_active);
  };

  const getEmployeeById = (employeeId: string): SalaryEmployee | undefined => {
    return employees.find(emp => emp.id === employeeId);
  };

  useEffect(() => {
    fetchEmployees();
  }, [effectiveUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getActiveEmployees,
    getEmployeeById,
    refetch: fetchEmployees,
  };
}