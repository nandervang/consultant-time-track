import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useCashFlow } from './useCashFlow';
import { useBudgets } from './useBudgets';
import { useToast } from './use-toast';
import { formatSEK } from '../lib/currency';
import type { Database } from '@/lib/supabase';

type CashFlowEntry = Database['public']['Tables']['cash_flow_entries']['Row'];

export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
}

export interface AnnualBudgetItem {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  targetDate: string;
  status: 'pending' | 'completed' | 'overdue';
  color: string;
}

export interface BudgetTotals {
  monthly: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
  };
  annual: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    completed: number;
    overdue: number;
  };
}

export const useBudgetLogic = () => {
  const { user } = useAuth();
  const { entries, refetch, addEntry, deleteEntry } = useCashFlow(user?.id || null);
  const { budgets, addBudget, updateBudget, deleteBudget, loading: budgetsLoading } = useBudgets(user?.id || null);
  const { toast } = useToast();

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [annualItems, setAnnualItems] = useState<AnnualBudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear();

  // Helper functions
  const getCurrentMonthName = () => {
    const date = new Date();
    return date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
  };

  const getCurrentYear = () => {
    return new Date().getFullYear().toString();
  };

  const getCategoryEntries = (categoryName: string, period: 'monthly' | 'yearly') => {
    if (!entries) return [];
    
    if (period === 'monthly') {
      return entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryMonth = entryDate.toISOString().slice(0, 7);
        return entry.type === 'expense' && 
               entryMonth === currentMonth &&
               (entry.category.toLowerCase() === categoryName.toLowerCase() ||
                entry.category.toLowerCase().includes(categoryName.toLowerCase().split(' ')[0]));
      });
    } else {
      return entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryYear = entryDate.getFullYear();
        return entry.type === 'expense' && 
               entryYear === currentYear &&
               entry.category.toLowerCase() === categoryName.toLowerCase();
      });
    }
  };

  // Calculated totals with memoization
  const totals: BudgetTotals = useMemo(() => {
    const totalBudget = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
    const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
    const totalAnnualBudget = annualItems.reduce((sum, item) => sum + item.budgeted, 0);
    const totalAnnualSpent = annualItems.reduce((sum, item) => sum + item.spent, 0);

    return {
      monthly: {
        budget: totalBudget,
        spent: totalSpent,
        remaining: totalBudget - totalSpent,
        percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      },
      annual: {
        budget: totalAnnualBudget,
        spent: totalAnnualSpent,
        remaining: totalAnnualBudget - totalAnnualSpent,
        percentage: totalAnnualBudget > 0 ? (totalAnnualSpent / totalAnnualBudget) * 100 : 0,
        completed: annualItems.filter(item => item.status === 'completed').length,
        overdue: annualItems.filter(item => item.status === 'overdue').length
      }
    };
  }, [categories, annualItems]);

  // Chart data
  const chartData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name,
      budgeted: cat.budgeted,
      spent: cat.spent,
      remaining: cat.budgeted - cat.spent
    }));
  }, [categories]);

  const pieData = useMemo(() => {
    return categories.filter(cat => cat.spent > 0).map(cat => ({
      name: cat.name,
      value: cat.spent,
      color: cat.color
    }));
  }, [categories]);

  // Load and process data
  useEffect(() => {
    const loadData = async () => {
      if (!user || budgetsLoading || !entries) return;

      setIsLoading(true);
      try {
        // Process monthly categories
        const monthlyBudgets = budgets.filter(budget => budget.period === 'monthly');
        const monthlyExpenses = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          const entryMonth = entryDate.toISOString().slice(0, 7);
          return entry.type === 'expense' && entryMonth === currentMonth;
        });

        const budgetCategories: BudgetCategory[] = monthlyBudgets.map((budget, index) => {
          const categoryExpenses = monthlyExpenses.filter(exp => 
            exp.category.toLowerCase() === budget.category.toLowerCase() ||
            exp.category.toLowerCase().includes(budget.category.toLowerCase().split(' ')[0])
          );
          const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

          const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
          
          return {
            id: budget.id,
            name: budget.name,
            budgeted: budget.budget_limit,
            spent: totalSpent,
            color: colors[index % colors.length]
          };
        });

        // Process annual items
        const annualBudgets = budgets.filter(budget => budget.period === 'yearly');
        const annualExpenses = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          const entryYear = entryDate.getFullYear();
          return entry.type === 'expense' && 
                 entryYear === currentYear &&
                 entry.is_budget_entry === true &&
                 entry.recurring_interval === 'yearly';
        });

        const annualBudgetItems: AnnualBudgetItem[] = annualBudgets.map((budget, index) => {
          const categoryExpenses = annualExpenses.filter(exp => 
            exp.category.toLowerCase() === budget.category.toLowerCase()
          );
          const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          
          const targetDate = new Date(budget.start_date || new Date());
          const today = new Date();
          let status: 'pending' | 'completed' | 'overdue' = 'pending';
          
          if (totalSpent >= budget.budget_limit) {
            status = 'completed';
          } else if (targetDate < today) {
            status = 'overdue';
          }

          const colors = ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#7c3aed', '#c2410c'];
          
          return {
            id: budget.id,
            name: budget.name,
            budgeted: budget.budget_limit,
            spent: totalSpent,
            targetDate: budget.start_date || new Date().toISOString().split('T')[0],
            status,
            color: colors[index % colors.length]
          };
        });

        setCategories(budgetCategories);
        setAnnualItems(annualBudgetItems);
      } catch (error) {
        console.error('Error loading budgets and expenses:', error);
        toast({
          title: "Fel",
          description: "Kunde inte ladda budgetdata.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, budgets, budgetsLoading, entries, toast]);

  // Action handlers with optimistic updates and error handling
  const handleAddCategory = async (name: string, budgetValue: number) => {
    // Check for duplicates
    const existingCategory = budgets.find(budget => 
      budget.name.toLowerCase().trim() === name.toLowerCase().trim() ||
      budget.category.toLowerCase().trim() === name.toLowerCase().trim()
    );
    
    if (existingCategory) {
      toast({
        title: "Kategori finns redan",
        description: `En kategori med namnet "${name.trim()}" finns redan.`,
        variant: "destructive"
      });
      return false;
    }

    if (budgetValue < 0) {
      toast({
        title: "Fel",
        description: "Budget kan inte vara negativ. Ange 0 för ingen budget.",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      const success = await addBudget({
        name: name.trim(),
        category: name.trim(),
        budget_limit: budgetValue,
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      });

      if (success && budgetValue > 0) {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        const nextMonth = new Date(firstDayOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await addEntry({
          type: 'expense',
          amount: budgetValue,
          description: `Budget för ${name.trim()}`,
          category: name.trim(),
          date: firstDayOfMonth.toISOString().split('T')[0],
          is_recurring: true,
          recurring_interval: 'monthly',
          next_due_date: nextMonth.toISOString().split('T')[0],
          is_budget_entry: true,
          is_recurring_instance: false
        });
      }

      toast({
        title: "Månadskategori tillagd",
        description: budgetValue > 0 
          ? `${name.trim()} med budget ${formatSEK(budgetValue)}/månad har lagts till`
          : `${name.trim()} har lagts till utan automatisk budget`,
      });

      await refetch();
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till kategori.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryId: string, newBudget: number) => {
    if (newBudget < 0) {
      toast({
        title: "Fel",
        description: "Budget kan inte vara negativ. Ange 0 för ingen budget.",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      const success = await updateBudget(categoryId, { 
        budget_limit: newBudget,
        updated_at: new Date().toISOString()
      });
      
      if (success) {
        const category = categories.find(cat => cat.id === categoryId);
        toast({
          title: "Månadsbudget uppdaterad",
          description: `Budget för ${category?.name} uppdaterad till ${formatSEK(newBudget)}/månad`,
        });
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera budget.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: BudgetCategory) => {
    setIsLoading(true);
    try {
      const success = await deleteBudget(category.id);
      
      if (success) {
        const relatedBudgetEntries = entries.filter(entry =>
          entry.category === category.name && entry.is_budget_entry === true
        );
        
        for (const entry of relatedBudgetEntries) {
          await deleteEntry(entry.id);
        }
        
        toast({
          title: "Kategori borttagen",
          description: `${category.name} har tagits bort`,
        });
        
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort kategori.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Data
    categories,
    annualItems,
    totals,
    chartData,
    pieData,
    
    // Loading states
    budgetsLoading,
    isLoading,
    
    // Utilities
    getCurrentMonthName,
    getCurrentYear,
    getCategoryEntries,
    
    // Actions
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    addEntry,
    deleteEntry,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch,
    
    // Raw data access
    entries,
    budgets,
    toast
  };
};