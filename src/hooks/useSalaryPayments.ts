import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useVatCalculations } from './useVatCalculations';

type SalaryPayment = Database['public']['Tables']['salary_payments']['Row'] & {
  employer_tax_entry_id?: string;
};
type SalaryPaymentInsert = Database['public']['Tables']['salary_payments']['Insert'];

export interface CreateSalaryPaymentData {
  employee_id: string;
  year: number;
  month: number;
  salary_amount: number;
  bonus_amount?: number;
  deductions?: number;
  payment_date?: string;
  status?: 'scheduled' | 'paid' | 'cancelled';
  notes?: string;
}

export interface UpdateSalaryPaymentData extends Partial<CreateSalaryPaymentData> {
  id: string;
}

// Enhanced payment with employee info for display
export interface SalaryPaymentWithEmployee extends SalaryPayment {
  employee?: {
    id: string;
    name: string;
    position: string | null;
    base_salary: number;
    currency: string;
  };
}

export function useSalaryPayments(userId?: string | null) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  const [payments, setPayments] = useState<SalaryPaymentWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize VAT calculations hook
  const { processYearlyVat, vatSettings } = useVatCalculations(effectiveUserId || null);

  const processAutomaticVat = async () => {
    if (!effectiveUserId || !vatSettings?.auto_generate_yearly_vat) {
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      // Process VAT for previous years (completed tax years)
      const previousYear = currentYear - 1;
      
      console.log(`🧮 Processing automatic VAT for ${previousYear}...`);
      const vatEntryId = await processYearlyVat(previousYear);
      
      if (vatEntryId) {
        console.log(`✅ VAT entry created for ${previousYear}: ${vatEntryId}`);
      } else {
        console.log(`ℹ️ No VAT entry needed for ${previousYear}`);
      }
    } catch (err) {
      console.error('Error processing automatic VAT:', err);
    }
  };

  // Process VAT when settings change
  useEffect(() => {
    if (vatSettings && vatSettings.auto_generate_yearly_vat) {
      processAutomaticVat();
    }
  }, [vatSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPayments = async () => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('salary_payments')
        .select(`
          *,
          employee:salary_employees(id, name, position, base_salary, currency)
        `)
        .eq('user_id', effectiveUserId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (fetchError) throw fetchError;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching salary payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch salary payments');
    } finally {
      setLoading(false);
    }
  };

  const addSalaryPayment = async (paymentData: CreateSalaryPaymentData): Promise<SalaryPayment | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const newPayment: SalaryPaymentInsert = {
        ...paymentData,
        user_id: effectiveUserId,
        status: paymentData.status || 'scheduled'
      };

      const { data, error } = await supabase
        .from('salary_payments')
        .insert([newPayment])
        .select()
        .single();

      if (error) throw error;

      // Create corresponding cash flow entry
      await createCashFlowEntry(data);

      // Refetch to get employee info
      await fetchPayments();
      console.log('✅ Salary payment added:', `${data.year}-${data.month.toString().padStart(2, '0')}`);
      return data;
    } catch (err) {
      console.error('Error adding salary payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add salary payment');
      throw err;
    }
  };

  const updateSalaryPayment = async (updateData: UpdateSalaryPaymentData): Promise<SalaryPayment | null> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { id, ...updates } = updateData;
      const { data, error } = await supabase
        .from('salary_payments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', effectiveUserId)
        .select()
        .single();

      if (error) throw error;

      // Update corresponding cash flow entry
      await updateCashFlowEntry(data);

      // Refetch to get employee info
      await fetchPayments();
      console.log('✅ Salary payment updated:', `${data.year}-${data.month.toString().padStart(2, '0')}`);
      return data;
    } catch (err) {
      console.error('Error updating salary payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update salary payment');
      throw err;
    }
  };

  const deleteSalaryPayment = async (paymentId: string): Promise<boolean> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      // Get payment data first to clean up cash flow entry
      const payment = payments.find(p => p.id === paymentId);
      
      const { error } = await supabase
        .from('salary_payments')
        .delete()
        .eq('id', paymentId)
        .eq('user_id', effectiveUserId);

      if (error) throw error;

      // Delete corresponding cash flow entry if exists
      if (payment?.cash_flow_entry_id) {
        await supabase
          .from('cash_flow_entries')
          .delete()
          .eq('id', payment.cash_flow_entry_id);
      }

      // Delete corresponding employer tax entry if exists
      if (payment?.employer_tax_entry_id) {
        await supabase
          .from('cash_flow_entries')
          .delete()
          .eq('id', payment.employer_tax_entry_id);
      }

      setPayments(prev => prev.filter(payment => payment.id !== paymentId));
      console.log('✅ Salary payment deleted');
      return true;
    } catch (err) {
      console.error('Error deleting salary payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete salary payment');
      return false;
    }
  };

  // Create cash flow entry for salary payment
  const createCashFlowEntry = async (payment: SalaryPayment) => {
    try {
      // Only create cash flow entries for scheduled payments with amount > 0
      if (payment.status !== 'scheduled' || payment.total_amount <= 0) {
        console.log('⏭️ Skipping cash flow entry creation: status is not scheduled or amount is 0');
        return;
      }

      // Get user settings to check if employer tax should be auto-generated
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('auto_generate_employer_tax, employer_tax_payment_date')
        .eq('id', payment.user_id)
        .single();

      // Get employee info for description
      const { data: employee } = await supabase
        .from('salary_employees')
        .select('name, position')
        .eq('id', payment.employee_id)
        .single();

      const description = employee 
        ? `Salary - ${employee.name}${employee.position ? ` (${employee.position})` : ''}`
        : `Salary Payment`;

      // Create salary cash flow entry
      const cashFlowEntry = {
        user_id: payment.user_id,
        type: 'expense' as const,
        amount: payment.total_amount,
        description,
        category: 'Salary',
        date: payment.payment_date || `${payment.year}-${payment.month.toString().padStart(2, '0')}-01`,
        is_recurring: false,
        is_budget_entry: false,
        is_recurring_instance: false
      };

      const { data: cashFlow, error: cashFlowError } = await supabase
        .from('cash_flow_entries')
        .insert([cashFlowEntry])
        .select()
        .single();

      if (cashFlowError) throw cashFlowError;

      // Update salary payment with cash flow entry reference
      await supabase
        .from('salary_payments')
        .update({ cash_flow_entry_id: cashFlow.id })
        .eq('id', payment.id);

      console.log('✅ Cash flow entry created for salary payment');

      // Create employer tax entry if enabled
      if (userProfile?.auto_generate_employer_tax) {
        const employerTaxAmount = Math.round(payment.total_amount * 0.3142); // ~31.42% employer tax
        const paymentDay = userProfile.employer_tax_payment_date || 25;
        
        // Create date for employer tax payment - THE MONTH AFTER the salary
        let taxYear = payment.year;
        let taxMonth = payment.month + 1;
        
        // Handle year rollover
        if (taxMonth > 12) {
          taxMonth = 1;
          taxYear++;
        }
        
        // Create date for the month after salary payment
        const taxPaymentDate = new Date(taxYear, taxMonth - 1, Math.min(paymentDay, new Date(taxYear, taxMonth, 0).getDate()));
        const taxDateString = taxPaymentDate.toISOString().split('T')[0];

        const employerTaxDescription = employee 
          ? `Employer Tax - ${employee.name}${employee.position ? ` (${employee.position})` : ''}`
          : `Employer Tax Payment`;

        const employerTaxEntry = {
          user_id: payment.user_id,
          type: 'expense' as const,
          amount: employerTaxAmount,
          description: employerTaxDescription,
          category: 'Employer Tax',
          date: taxDateString,
          is_recurring: false,
          is_budget_entry: false,
          is_recurring_instance: false
        };

        const { data: taxCashFlow, error: taxCashFlowError } = await supabase
          .from('cash_flow_entries')
          .insert([employerTaxEntry])
          .select()
          .single();

        if (taxCashFlowError) throw taxCashFlowError;

        // Update salary payment with employer tax reference
        await supabase
          .from('salary_payments')
          .update({ employer_tax_entry_id: taxCashFlow.id })
          .eq('id', payment.id);

        console.log('✅ Employer tax cash flow entry created');
      }
    } catch (err) {
      console.error('Error creating cash flow entry:', err);
      // Don't throw here - salary payment was successful, cash flow is bonus
    }
  };

  // Update cash flow entry for salary payment
  const updateCashFlowEntry = async (payment: SalaryPayment) => {
    const shouldHaveCashFlowEntry = payment.status === 'scheduled' && payment.total_amount > 0;

    // Get user settings for employer tax configuration
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('auto_generate_employer_tax, employer_tax_payment_date')
      .eq('id', payment.user_id)
      .single();

    const shouldHaveEmployerTaxEntry = shouldHaveCashFlowEntry && userProfile?.auto_generate_employer_tax;

    if (!payment.cash_flow_entry_id && shouldHaveCashFlowEntry) {
      // No cash flow entry exists but should have one - create it
      await createCashFlowEntry(payment);
      return;
    }

    if (payment.cash_flow_entry_id && !shouldHaveCashFlowEntry) {
      // Cash flow entry exists but shouldn't - delete it
      try {
        await supabase
          .from('cash_flow_entries')
          .delete()
          .eq('id', payment.cash_flow_entry_id);

        // Remove reference from salary payment
        await supabase
          .from('salary_payments')
          .update({ cash_flow_entry_id: null })
          .eq('id', payment.id);

        console.log('✅ Cash flow entry deleted (status not scheduled or amount is 0)');
      } catch (err) {
        console.error('Error deleting cash flow entry:', err);
      }
    }

    // Handle employer tax entry
    if (payment.employer_tax_entry_id && !shouldHaveEmployerTaxEntry) {
      // Employer tax entry exists but shouldn't - delete it
      try {
        await supabase
          .from('cash_flow_entries')
          .delete()
          .eq('id', payment.employer_tax_entry_id);

        // Remove reference from salary payment
        await supabase
          .from('salary_payments')
          .update({ employer_tax_entry_id: null })
          .eq('id', payment.id);

        console.log('✅ Employer tax cash flow entry deleted');
      } catch (err) {
        console.error('Error deleting employer tax cash flow entry:', err);
      }
    }

    if (!payment.cash_flow_entry_id || !shouldHaveCashFlowEntry) {
      // No cash flow entry and shouldn't have one, or conditions not met
      return;
    }

    // Update existing cash flow entry
    try {
      // Get employee info for description
      const { data: employee } = await supabase
        .from('salary_employees')
        .select('name, position')
        .eq('id', payment.employee_id)
        .single();

      const description = employee 
        ? `Salary - ${employee.name}${employee.position ? ` (${employee.position})` : ''}`
        : `Salary Payment`;

      await supabase
        .from('cash_flow_entries')
        .update({
          amount: payment.total_amount,
          description,
          date: payment.payment_date || `${payment.year}-${payment.month.toString().padStart(2, '0')}-01`
        })
        .eq('id', payment.cash_flow_entry_id);

      console.log('✅ Cash flow entry updated for salary payment');

      // Update employer tax entry if it exists and should exist
      if (payment.employer_tax_entry_id && shouldHaveEmployerTaxEntry) {
        const employerTaxAmount = Math.round(payment.total_amount * 0.3142); // ~31.42% employer tax
        const paymentDay = userProfile?.employer_tax_payment_date || 25;
        
        // Create date for employer tax payment - THE MONTH AFTER the salary
        let taxYear = payment.year;
        let taxMonth = payment.month + 1;
        
        // Handle year rollover
        if (taxMonth > 12) {
          taxMonth = 1;
          taxYear++;
        }
        
        // Create date for the month after salary payment
        const taxPaymentDate = new Date(taxYear, taxMonth - 1, Math.min(paymentDay, new Date(taxYear, taxMonth, 0).getDate()));
        const taxDateString = taxPaymentDate.toISOString().split('T')[0];

        const employerTaxDescription = employee 
          ? `Employer Tax - ${employee.name}${employee.position ? ` (${employee.position})` : ''}`
          : `Employer Tax Payment`;

        await supabase
          .from('cash_flow_entries')
          .update({
            amount: employerTaxAmount,
            description: employerTaxDescription,
            date: taxDateString
          })
          .eq('id', payment.employer_tax_entry_id);

        console.log('✅ Employer tax cash flow entry updated');
      } else if (!payment.employer_tax_entry_id && shouldHaveEmployerTaxEntry) {
        // Should have employer tax entry but doesn't - create it
        const employerTaxAmount = Math.round(payment.total_amount * 0.3142);
        const paymentDay = userProfile?.employer_tax_payment_date || 25;
        
        // Create date for employer tax payment - THE MONTH AFTER the salary
        let taxYear = payment.year;
        let taxMonth = payment.month + 1;
        
        // Handle year rollover
        if (taxMonth > 12) {
          taxMonth = 1;
          taxYear++;
        }
        
        const taxPaymentDate = new Date(taxYear, taxMonth - 1, Math.min(paymentDay, new Date(taxYear, taxMonth, 0).getDate()));
        const taxDateString = taxPaymentDate.toISOString().split('T')[0];

        const employerTaxDescription = employee 
          ? `Employer Tax - ${employee.name}${employee.position ? ` (${employee.position})` : ''}`
          : `Employer Tax Payment`;

        const employerTaxEntry = {
          user_id: payment.user_id,
          type: 'expense' as const,
          amount: employerTaxAmount,
          description: employerTaxDescription,
          category: 'Employer Tax',
          date: taxDateString,
          is_recurring: false,
          is_budget_entry: false,
          is_recurring_instance: false
        };

        const { data: taxCashFlow, error: taxCashFlowError } = await supabase
          .from('cash_flow_entries')
          .insert([employerTaxEntry])
          .select()
          .single();

        if (taxCashFlowError) throw taxCashFlowError;

        await supabase
          .from('salary_payments')
          .update({ employer_tax_entry_id: taxCashFlow.id })
          .eq('id', payment.id);

        console.log('✅ New employer tax cash flow entry created');
      }
    } catch (err) {
      console.error('Error updating cash flow entry:', err);
      // Don't throw here - salary payment update was successful
    }
  };

  // Get payments for specific year
  const getPaymentsByYear = (year: number): SalaryPaymentWithEmployee[] => {
    return payments.filter(payment => payment.year === year);
  };

  // Get payment for specific employee and month
  const getPaymentByEmployeeMonth = (employeeId: string, year: number, month: number): SalaryPaymentWithEmployee | undefined => {
    return payments.find(payment => 
      payment.employee_id === employeeId && 
      payment.year === year && 
      payment.month === month
    );
  };

  // Generate payments for all employees for remaining months of year
  const generateYearlyPayments = async (year: number): Promise<void> => {
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }

    try {
      // Get all active employees
      const { data: employees, error: employeeError } = await supabase
        .from('salary_employees')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('is_active', true);

      if (employeeError) throw employeeError;

      const currentMonth = new Date().getMonth() + 1; // 1-12
      const currentYear = new Date().getFullYear();
      
      // Determine which months to generate
      const startMonth = year === currentYear ? currentMonth : 1;
      const endMonth = 12;

      const paymentsToInsert: SalaryPaymentInsert[] = [];

      for (const employee of employees || []) {
        for (let month = startMonth; month <= endMonth; month++) {
          // Check if payment already exists
          const existingPayment = payments.find(p => 
            p.employee_id === employee.id && 
            p.year === year && 
            p.month === month
          );

          if (!existingPayment) {
            paymentsToInsert.push({
              user_id: effectiveUserId,
              employee_id: employee.id,
              year,
              month,
              salary_amount: employee.base_salary,
              status: 'scheduled'
            });
          }
        }
      }

      if (paymentsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('salary_payments')
          .insert(paymentsToInsert);

        if (insertError) throw insertError;

        console.log(`✅ Generated ${paymentsToInsert.length} salary payments for ${year}`);
        await fetchPayments();
      }
    } catch (err) {
      console.error('Error generating yearly payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate yearly payments');
      throw err;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [effectiveUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    payments,
    loading,
    error,
    addSalaryPayment,
    updateSalaryPayment,
    deleteSalaryPayment,
    getPaymentsByYear,
    getPaymentByEmployeeMonth,
    generateYearlyPayments,
    refetch: fetchPayments,
  };
}