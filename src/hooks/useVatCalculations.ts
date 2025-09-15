import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface VatCalculation {
  year: number;
  totalIncomeVat: number;
  totalExpenseVat: number;
  netVatObligation: number;
  paymentDate: Date;
}

interface VatSettings {
  auto_generate_yearly_vat: boolean;
  vat_rate_income: number;
  vat_rate_expenses: number;
  vat_payment_month: number;
  vat_payment_day: number;
}

export function useVatCalculations(userId: string | null) {
  const [vatSettings, setVatSettings] = useState<VatSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVatSettings = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: settingsError } = await supabase
        .from('user_profiles')
        .select('auto_generate_yearly_vat, vat_rate_income, vat_rate_expenses, vat_payment_month, vat_payment_day')
        .eq('id', userId)
        .single();

      if (settingsError) throw settingsError;

      setVatSettings(data as VatSettings);
    } catch (err) {
      console.error('Error fetching VAT settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load VAT settings');
    } finally {
      setLoading(false);
    }
  };

  const calculateYearlyVat = async (year: number): Promise<VatCalculation | null> => {
    if (!userId) {
      console.log(`❌ Cannot calculate VAT for ${year}: no userId`);
      return null;
    }

    // Fetch fresh VAT settings from database instead of relying on hook state
    console.log(`🔄 Fetching fresh VAT settings for ${year} calculation...`);
    const { data: freshVatSettings, error: settingsError } = await supabase
      .from('user_profiles')
      .select('auto_generate_yearly_vat, vat_rate_income, vat_rate_expenses, vat_payment_month, vat_payment_day')
      .eq('id', userId)
      .single();

    if (settingsError) {
      console.error(`❌ Error fetching VAT settings for ${year}:`, settingsError);
      return null;
    }

    if (!freshVatSettings?.auto_generate_yearly_vat) {
      console.log(`❌ Cannot calculate VAT for ${year}: auto_generate_yearly_vat=${freshVatSettings?.auto_generate_yearly_vat}`);
      return null;
    }

    try {
      console.log(`🧮 Calculating MOMS for year ${year}...`);
      console.log(`🔧 Fresh VAT Settings:`, freshVatSettings);
            // Get all invoice items for the year (these are WITHOUT VAT)
      console.log(`🔍 Querying invoices for ${year}...`);
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoice_items')
        .select('total_amount, invoice_date, client_id, project_id, description')
        .eq('user_id', userId)
        .gte('invoice_date', `${year}-01-01`)
        .lt('invoice_date', `${year + 1}-01-01`);

      if (invoicesError) throw invoicesError;
      console.log(`💰 Found ${invoices?.length || 0} invoice items for ${year}:`, invoices);

      // Get all business expense entries for the year (these should INCLUDE VAT)
      // Include budget entries that represent recurring business expenses (like software subscriptions)
      console.log(`🔍 Querying business expenses for ${year}...`);
      const { data: expenses, error: expensesError } = await supabase
        .from('cash_flow_entries')
        .select('amount, description, category, date, is_budget_entry, is_recurring_instance, is_recurring, recurring_interval')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`)
        .not('category', 'in', '(Salary,Employer Tax,MOMS Tax,Förmåner)'); // Exclude non-VAT categories

      if (expensesError) throw expensesError;
      console.log(`💸 Found ${expenses?.length || 0} business expense entries for ${year}:`, expenses);

      // Calculate total expense amount including full year impact of recurring expenses
      const totalExpenseAmount = (expenses || []).reduce((sum, expense) => {
        let expenseAmount = expense.amount;
        
        // For recurring budget entries, calculate the annual impact
        if (expense.is_recurring && expense.recurring_interval === 'monthly' && expense.is_budget_entry) {
          // Calculate how many months this expense runs in the year
          const expenseDate = new Date(expense.date);
          const expenseMonth = expenseDate.getMonth(); // 0-indexed
          const expenseYear = expenseDate.getFullYear();
          
          if (expenseYear === year) {
            // Calculate remaining months in the year from when this expense started
            const monthsInYear = 12 - expenseMonth;
            expenseAmount = expense.amount * monthsInYear;
            console.log(`📅 Recurring expense "${expense.description}": ${expense.amount} × ${monthsInYear} months = ${expenseAmount}`);
          }
        }
        
        return sum + expenseAmount;
      }, 0);
      
      console.log(`💸 Total expense amount for ${year} (including recurring): ${totalExpenseAmount}`);

      console.log(`📊 Found ${invoices?.length || 0} invoices and ${expenses?.length || 0} expenses for ${year}`, {
        expenseBreakdown: expenses?.reduce((acc, exp) => {
          const type = exp.is_budget_entry ? 'budget' : exp.is_recurring_instance ? 'recurring' : 'manual';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

      // Calculate income VAT (25% to be added to invoice amounts)
      const incomeTaxableAmount = (invoices || []).reduce((sum, invoice) => sum + invoice.total_amount, 0);
      const totalIncomeVat = incomeTaxableAmount * (freshVatSettings.vat_rate_income / 100);

      console.log(`💰 Income VAT calculation for ${year}:`, {
        invoiceCount: invoices?.length || 0,
        incomeTaxableAmount: Math.round(incomeTaxableAmount * 100) / 100,
        incomeVatRate: freshVatSettings.vat_rate_income + '%',
        totalIncomeVat: Math.round(totalIncomeVat * 100) / 100
      });

      // Calculate expense VAT deductible (25% that's already included in expense amounts)
      // Since expenses include VAT, we extract the VAT portion using: VAT = amount - (amount / 1.25)
      const totalExpenseVat = totalExpenseAmount - (totalExpenseAmount / (1 + freshVatSettings.vat_rate_expenses / 100));

      console.log(`💸 Expense VAT calculation for ${year}:`, {
        expenseCount: expenses?.length || 0,
        totalExpenseAmount: Math.round(totalExpenseAmount * 100) / 100,
        expenseVatRate: freshVatSettings.vat_rate_expenses + '%',
        totalExpenseVat: Math.round(totalExpenseVat * 100) / 100
      });

      // Net VAT obligation = Income VAT - Expense VAT (what we owe to Skatteverket)
      const netVatObligation = totalIncomeVat - totalExpenseVat;

      // Calculate payment date for the following year (January by default)
      const paymentYear = year + 1;
      const paymentDate = new Date(
        paymentYear,
        (freshVatSettings.vat_payment_month || 1) - 1, // Month is 0-indexed, default January (1-1=0)
        Math.min(freshVatSettings.vat_payment_day || 12, 28) // Default 12th, ensure valid date
      );

      console.log(`🧮 Net MOMS calculation for ${year}:`, {
        totalIncomeVat: Math.round(totalIncomeVat * 100) / 100,
        totalExpenseVat: Math.round(totalExpenseVat * 100) / 100,
        netVatObligation: Math.round(netVatObligation * 100) / 100,
        paymentDate: paymentDate.toISOString().split('T')[0]
      });

      return {
        year,
        totalIncomeVat: Math.round(totalIncomeVat * 100) / 100,
        totalExpenseVat: Math.round(totalExpenseVat * 100) / 100,
        netVatObligation: Math.round(netVatObligation * 100) / 100,
        paymentDate
      };
    } catch (err) {
      console.error(`❌ Error calculating VAT for ${year}:`, err);
      throw err;
    }
  };

  const createYearlyVatEntry = async (calculation: VatCalculation): Promise<string | null> => {
    console.log(`🔍 Checking if VAT entry should be created for ${calculation.year}: netVatObligation=${calculation.netVatObligation}, userId=${!!userId}`);
    if (!userId || calculation.netVatObligation <= 0) {
      console.log(`ℹ️ No VAT owed for ${calculation.year} (${calculation.netVatObligation}), skipping entry creation`);
      return null;
    }

    try {
      // Check if VAT entry already exists for this year
      const { data: existingEntry } = await supabase
        .from('cash_flow_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('category', 'MOMS Tax')
        .ilike('description', `%${calculation.year}%`)
        .single();

      if (existingEntry) {
        console.log(`✅ MOMS tax entry already exists for ${calculation.year}`);
        return existingEntry.id;
      }

      // Create new MOMS tax payment entry
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .insert([{
          user_id: userId,
          type: 'expense',
          amount: calculation.netVatObligation,
          description: `MOMS Tax ${calculation.year} (Income VAT: ${calculation.totalIncomeVat} - Expense VAT: ${calculation.totalExpenseVat})`,
          category: 'MOMS Tax',
          date: calculation.paymentDate.toISOString().split('T')[0],
          is_recurring: false,
          is_budget_entry: false,
          is_recurring_instance: false,
          // VAT tracking fields
          vat_amount: 0, // This is the payment, not a VAT-inclusive transaction
          amount_excluding_vat: calculation.netVatObligation,
          vat_rate: 0
        }])
        .select('id')
        .single();

      if (error) throw error;

      console.log(`✅ Created MOMS tax entry for ${calculation.year}:`, {
        amount: calculation.netVatObligation,
        date: calculation.paymentDate.toISOString().split('T')[0],
        description: `MOMS Tax ${calculation.year}`,
        id: data.id
      });

      return data.id;
    } catch (err) {
      console.error(`❌ Error creating MOMS tax entry for ${calculation.year}:`, err);
      throw err;
    }
  };

  const processYearlyVat = async (year: number): Promise<string | null> => {
    const calculation = await calculateYearlyVat(year);
    if (!calculation) return null;

    return await createYearlyVatEntry(calculation);
  };

  // New function to trigger VAT recalculation for current data changes
  const updateCurrentVatCalculations = async (): Promise<void> => {
    if (!vatSettings?.auto_generate_yearly_vat || !userId) return;

    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    try {
      console.log('🔄 Updating VAT calculations due to data changes...');

      // Remove existing MOMS entries for current and previous year
      await supabase
        .from('cash_flow_entries')
        .delete()
        .eq('user_id', userId)
        .eq('category', 'MOMS Tax')
        .or(`date.gte.${previousYear}-01-01,date.gte.${currentYear}-01-01`);

      // Recalculate and recreate VAT entries
      await processYearlyVat(previousYear);
      await processYearlyVat(currentYear);

      console.log('✅ VAT calculations updated successfully');
    } catch (error) {
      console.error('❌ Error updating VAT calculations:', error);
    }
  };

  useEffect(() => {
    fetchVatSettings();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    vatSettings,
    loading,
    error,
    calculateYearlyVat,
    createYearlyVatEntry,
    processYearlyVat,
    updateCurrentVatCalculations,
    refetch: fetchVatSettings
  };
}