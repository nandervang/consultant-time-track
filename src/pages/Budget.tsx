import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, PieChart, Plus, Edit, Trash2, Receipt, Eye, Calendar, Target, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart as RePieChart, Cell, Pie } from 'recharts';
import { formatSEK } from '../lib/currency';
import { useAuth } from '../hooks/useAuth';
import { useCashFlow } from '../hooks/useCashFlow';
import { useBudgets } from '../hooks/useBudgets';
import { useToast } from '../hooks/use-toast';
import { Database } from '@/lib/supabase';

type CashFlowEntry = Database['public']['Tables']['cash_flow_entries']['Row'];

interface BudgetPageProps {
  isDarkMode: boolean;
}

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
}

interface AnnualBudgetItem {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  targetDate: string;
  status: 'pending' | 'completed' | 'overdue';
  color: string;
}

export default function BudgetPage({ isDarkMode }: BudgetPageProps) {
  const { user } = useAuth();
  const { addEntry, getEntriesByCategory, entries, refetch, deleteEntry } = useCashFlow(user?.id || null);
  const { budgets, addBudget, updateBudget, deleteBudget, loading: budgetsLoading } = useBudgets(user?.id || null);
  const { toast } = useToast();

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [annualItems, setAnnualItems] = useState<AnnualBudgetItem[]>([]);
  const [isDetailedView, setIsDetailedView] = useState(false);
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear();

  console.log('🔍 Budget component render - isDetailedView:', isDetailedView);

  // Add expense dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Annual budget dialog state
  const [annualDialogOpen, setAnnualDialogOpen] = useState(false);
  const [annualExpenseDialogOpen, setAnnualExpenseDialogOpen] = useState(false);
  const [selectedAnnualItem, setSelectedAnnualItem] = useState<AnnualBudgetItem | null>(null);
  const [annualForm, setAnnualForm] = useState({
    name: '',
    budget: '',
    targetDate: '',
  });
  const [annualExpenseForm, setAnnualExpenseForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Category detail dialog state
  const [categoryDetailOpen, setCategoryDetailOpen] = useState(false);
  const [categoryExpenses, setCategoryExpenses] = useState<CashFlowEntry[]>([]);

  // Get current month name for display
  const getCurrentMonthName = () => {
    const date = new Date();
    return date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
  };

  // Get current year for display
  const getCurrentYear = () => {
    return new Date().getFullYear().toString();
  };

  // Helper function to get category entries
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

  // Filter expenses for current month only
  const getCurrentMonthExpenses = () => {
    if (!entries) return [];
    
    const monthlyEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryMonth = entryDate.toISOString().slice(0, 7);
      return entry.type === 'expense' && entryMonth === currentMonth;
    });

    // Group by category
    const monthlyByCategory: { [key: string]: number } = {};
    monthlyEntries.forEach(entry => {
      const category = entry.category;
      monthlyByCategory[category] = (monthlyByCategory[category] || 0) + entry.amount;
    });

    return Object.entries(monthlyByCategory).map(([category, amount]) => ({
      category,
      amount
    }));
  };

  // Get annual budget expenses
  const getAnnualBudgetExpenses = () => {
    if (!entries) return [];
    
    // Filter for current year and annual budget entries
    const annualEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryYear = entryDate.getFullYear();
      return entry.type === 'expense' && 
             entryYear === currentYear &&
             entry.is_budget_entry === true &&
             entry.recurring_interval === 'yearly';
    });

    // Group by category
    const annualByCategory: { [key: string]: number } = {};
    annualEntries.forEach(entry => {
      const category = entry.category;
      annualByCategory[category] = (annualByCategory[category] || 0) + entry.amount;
    });

    return Object.entries(annualByCategory).map(([category, amount]) => ({
      category,
      amount
    }));
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user || budgetsLoading) return;

      try {
        // Refresh entries
        await refetch();
        
        // Load monthly data
        const monthlyExpenses = getCurrentMonthExpenses();
        
        // Convert monthly budgets to UI categories format
        const monthlyBudgets = budgets.filter(budget => budget.period === 'monthly');
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

        // Load annual budget items
        const annualBudgets = budgets.filter(budget => budget.period === 'yearly');
        const annualExpenses = getAnnualBudgetExpenses();
        
        const annualBudgetItems: AnnualBudgetItem[] = annualBudgets.map((budget, index) => {
          const categoryExpenses = annualExpenses.filter(exp => 
            exp.category.toLowerCase() === budget.category.toLowerCase()
          );
          const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          
          // Determine status based on target date and spending
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
      }
    };

    loadData();
  }, [user?.id, budgets, budgetsLoading]);

  // Handle adding monthly expense
  const handleAddExpense = async () => {
    if (!selectedCategory || !expenseForm.amount || !expenseForm.description) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i alla fält.",
        variant: "destructive"
      });
      return;
    }

    const expenseDate = new Date(expenseForm.date);
    const expenseMonth = expenseDate.toISOString().slice(0, 7);
    
    if (expenseMonth !== currentMonth) {
      toast({
        title: "Fel",
        description: `Utgiften måste vara från ${getCurrentMonthName()}.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const nextMonth = new Date(expenseDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextDueDate = nextMonth.toISOString().split('T')[0];

      await addEntry({
        type: 'expense',
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        category: selectedCategory.name,
        date: expenseForm.date,
        is_recurring: true,
        recurring_interval: 'monthly',
        next_due_date: nextDueDate,
        is_budget_entry: false,
        is_recurring_instance: false
      });

      await refetch();

      toast({
        title: "Månadsutgift tillagd",
        description: `${formatSEK(parseFloat(expenseForm.amount))} lades till i ${selectedCategory.name}`,
      });

      setExpenseForm({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setExpenseDialogOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till utgift.",
        variant: "destructive"
      });
    }
  };

  // Handle adding annual budget item
  const handleAddAnnualItem = async () => {
    if (!annualForm.name || !annualForm.budget || !annualForm.targetDate) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i alla fält.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    const existingAnnualItem = budgets.find(budget => 
      budget.name.toLowerCase().trim() === annualForm.name.toLowerCase().trim() ||
      budget.category.toLowerCase().trim() === annualForm.name.toLowerCase().trim()
    );
    
    if (existingAnnualItem) {
      toast({
        title: "Budgetpost finns redan",
        description: `En budgetpost med namnet "${annualForm.name.trim()}" finns redan.`,
        variant: "destructive"
      });
      return;
    }

    const budgetValue = parseFloat(annualForm.budget);
    if (budgetValue <= 0) {
      toast({
        title: "Fel",
        description: "Budget måste vara större än 0.",
        variant: "destructive"
      });
      return;
    }

    try {
      const success = await addBudget({
        name: annualForm.name.trim(),
        category: annualForm.name.trim(),
        budget_limit: budgetValue,
        period: 'yearly',
        start_date: annualForm.targetDate,
        is_active: true
      });

      if (success) {
        // Create the annual budget entry
        const nextYear = new Date(annualForm.targetDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        await addEntry({
          type: 'expense',
          amount: budgetValue,
          description: `Årlig budget för ${annualForm.name.trim()}`,
          category: annualForm.name.trim(),
          date: annualForm.targetDate,
          is_recurring: true,
          recurring_interval: 'yearly',
          next_due_date: nextYear.toISOString().split('T')[0],
          is_budget_entry: true,
          is_recurring_instance: false
        });

        toast({
          title: "Årlig budgetpost tillagd",
          description: `${annualForm.name.trim()} med budget ${formatSEK(budgetValue)} har lagts till`,
        });

        setAnnualForm({ name: '', budget: '', targetDate: '' });
        setAnnualDialogOpen(false);
        await refetch();
      }
    } catch (error) {
      console.error('Error adding annual budget item:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till årlig budgetpost.",
        variant: "destructive"
      });
    }
  };

  // Handle adding annual expense
  const handleAddAnnualExpense = async () => {
    if (!selectedAnnualItem || !annualExpenseForm.amount || !annualExpenseForm.description) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i alla fält.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addEntry({
        type: 'expense',
        amount: parseFloat(annualExpenseForm.amount),
        description: annualExpenseForm.description,
        category: selectedAnnualItem.name,
        date: annualExpenseForm.date,
        is_recurring: false,
        is_budget_entry: false,
        is_recurring_instance: false
      });

      await refetch();

      toast({
        title: "Årlig utgift tillagd",
        description: `${formatSEK(parseFloat(annualExpenseForm.amount))} lades till i ${selectedAnnualItem.name}`,
      });

      setAnnualExpenseForm({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setAnnualExpenseDialogOpen(false);
      setSelectedAnnualItem(null);
    } catch (error) {
      console.error('Error adding annual expense:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till årlig utgift.",
        variant: "destructive"
      });
    }
  };

  // Other handlers (keeping existing ones)
  const openExpenseDialog = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setExpenseDialogOpen(true);
  };

  const openAnnualExpenseDialog = (item: AnnualBudgetItem) => {
    setSelectedAnnualItem(item);
    setAnnualExpenseDialogOpen(true);
  };

  const openCategoryDetail = async (category: BudgetCategory) => {
    try {
      setSelectedCategory(category);
      
      const categorySpecificExpenses = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryMonth = entryDate.toISOString().slice(0, 7);
        return entry.type === 'expense' && 
               entryMonth === currentMonth &&
               (entry.category.toLowerCase() === category.name.toLowerCase() ||
                entry.category.toLowerCase().includes(category.name.toLowerCase().split(' ')[0]));
      });
      
      setCategoryExpenses(categorySpecificExpenses);
      setCategoryDetailOpen(true);
    } catch (error) {
      console.error('Error loading category expenses:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda kategorins utgifter.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteExpense = async (expense: CashFlowEntry) => {
    if (!window.confirm(`Är du säker på att du vill ta bort "${expense.description}" (${formatSEK(expense.amount)})?`)) {
      return;
    }

    try {
      const success = await deleteEntry(expense.id);
      
      if (success) {
        await refetch();
        const updatedExpenses = categoryExpenses.filter(exp => exp.id !== expense.id);
        setCategoryExpenses(updatedExpenses);
        
        toast({
          title: "Utgift borttagen",
          description: `${expense.description} (${formatSEK(expense.amount)}) har tagits bort`,
        });
      } else {
        throw new Error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort utgiften",
        variant: "destructive"
      });
    }
  };

  const canDeleteExpense = (expense: CashFlowEntry) => {
    return !expense.is_budget_entry && !expense.is_recurring_instance;
  };

  const handleEditCategory = async (category: BudgetCategory) => {
    const newBudget = prompt(`Redigera månadsbudget för ${category.name} (ange 0 för ingen budget):`, category.budgeted.toString());
    if (newBudget !== null && !isNaN(parseFloat(newBudget))) {
      const budgetValue = parseFloat(newBudget);
      
      if (budgetValue < 0) {
        toast({
          title: "Fel",
          description: "Budget kan inte vara negativ. Ange 0 för ingen budget.",
          variant: "destructive"
        });
        return;
      }
      
      const success = await updateBudget(category.id, { 
        budget_limit: budgetValue,
        updated_at: new Date().toISOString()
      });
      
      if (success) {
        toast({
          title: "Månadsbudget uppdaterad",
          description: `Budget för ${category.name} uppdaterad till ${formatSEK(budgetValue)}/månad`,
        });
        await refetch();
      }
    }
  };

  const handleDeleteCategory = async (category: BudgetCategory) => {
    if (confirm(`Är du säker på att du vill ta bort kategorin "${category.name}"?`)) {
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
      }
    }
  };

  const handleAddCategory = async () => {
    const name = prompt("Namn på ny månadskategori:");
    if (!name) return;
    
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
      return;
    }
    
    const budget = prompt("Månadsbudget för denna kategori (SEK, ange 0 för ingen budget):");
    if (budget === null || isNaN(parseFloat(budget))) return;

    const budgetValue = parseFloat(budget);
    
    if (budgetValue < 0) {
      toast({
        title: "Fel",
        description: "Budget kan inte vara negativ. Ange 0 för ingen budget.",
        variant: "destructive"
      });
      return;
    }

    const success = await addBudget({
      name: name.trim(),
      category: name.trim(),
      budget_limit: budgetValue,
      period: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      is_active: true
    });

    if (success) {
      if (budgetValue > 0) {
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

        toast({
          title: "Månadskategori tillagd",
          description: `${name.trim()} med budget ${formatSEK(budgetValue)}/månad har lagts till`,
        });
      } else {
        toast({
          title: "Månadskategori tillagd",
          description: `${name.trim()} har lagts till utan automatisk budget`,
        });
      }
    }
  };

  // Calculate totals
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const remaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const totalAnnualBudget = annualItems.reduce((sum, item) => sum + item.budgeted, 0);
  const totalAnnualSpent = annualItems.reduce((sum, item) => sum + item.spent, 0);
  const annualRemaining = totalAnnualBudget - totalAnnualSpent;
  const annualSpentPercentage = totalAnnualBudget > 0 ? (totalAnnualSpent / totalAnnualBudget) * 100 : 0;

  const completedItems = annualItems.filter(item => item.status === 'completed').length;
  const overdueItems = annualItems.filter(item => item.status === 'overdue').length;

  // Show loading state
  if (budgetsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Budget</h1>
            <p className="text-muted-foreground">Laddar budgetdata...</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = categories.map(cat => ({
    name: cat.name,
    budgeted: cat.budgeted,
    spent: cat.spent,
    remaining: cat.budgeted - cat.spent
  }));

  const pieData = categories.filter(cat => cat.spent > 0).map(cat => ({
    name: cat.name,
    value: cat.spent,
    color: cat.color
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget</h1>
          <p className="text-muted-foreground">
            Hantera din månads- och årsbudget - synkroniseras med Cash Flow
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isDetailedView ? "default" : "outline"} 
            onClick={() => {
              console.log('🔘 Button clicked! Current state:', isDetailedView, '-> New state:', !isDetailedView);
              setIsDetailedView(!isDetailedView);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isDetailedView ? "Översikt" : "Detaljvy"}
          </Button>
          <Button variant="outline" onClick={() => setAnnualDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Årlig post
          </Button>
          <Button onClick={handleAddCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Månadskategori
          </Button>
        </div>
      </div>

      {!isDetailedView ? (
        <>
          {console.log('📊 Rendering OVERVIEW view')}
          
          {/* Current month indicator */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Spåra utgifter mot dina budgetmål,                   alla budgetutgifter syns automatiskt i Cash Flow

                  </span>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {categories.length} månadskategorier • {annualItems.length} årliga poster
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Monthly Budget Cards */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Månadsbudget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatSEK(totalBudget)}</div>
                <p className="text-xs text-muted-foreground">{getCurrentMonthName()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Spenderat (månad)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatSEK(totalSpent)}</div>
                <p className="text-xs text-muted-foreground">{spentPercentage.toFixed(1)}% av budget</p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Annual Budget Cards */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Årsbudget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatSEK(totalAnnualBudget)}</div>
                <p className="text-xs text-muted-foreground">{getCurrentYear()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Årliga poster
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedItems}/{annualItems.length}</div>
                <p className="text-xs text-muted-foreground">
                  {overdueItems > 0 && <span className="text-red-500">{overdueItems} försenade</span>}
                  {overdueItems === 0 && "Inga försenade"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Show empty state if no categories and no annual items */}
          {categories.length === 0 && annualItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Ingen budget än</h3>
                <p className="text-muted-foreground mb-4">
                  Skapa din första budgetkategori eller årliga post för att börja spåra utgifter
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4 text-sm">
                  <p className="font-medium mb-2">💡 Så fungerar det:</p>
                  <ul className="text-left space-y-1 text-muted-foreground">
                    <li>• <strong>Månadskategorier:</strong> Återkommande utgifter (mat, transport, hyra)</li>
                    <li>• <strong>Årliga poster:</strong> Engångsutgifter (konferenser, utrustning, resor)</li>
                    <li>• Allt syns automatiskt i Cash Flow för helhetsbild</li>
                  </ul>
                </div>
                <div className="flex gap-2 justify-center mt-4">
                  <Button variant="outline" onClick={() => setAnnualDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Årlig post
                  </Button>
                  <Button onClick={handleAddCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Månadskategori
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Charts */}
              {categories.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Månadsbudget vs Faktisk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false}
                              tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                            />
                            <YAxis hide />
                            <Bar dataKey="budgeted" fill="#e2e8f0" name="Budget" />
                            <Bar dataKey="spent" fill="#2563eb" name="Spenderat" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Utgiftsfördelning</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        {pieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </RePieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            Inga utgifter att visa än
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Monthly Budget Categories */}
              {categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Månadskategorier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categories.map((category) => {
                        const percentage = (category.spent / category.budgeted) * 100;
                        const isOverBudget = category.spent > category.budgeted;
                        
                        return (
                          <div key={category.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openCategoryDetail(category)}
                                  className="h-8"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Detaljer
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openExpenseDialog(category)}
                                  className="h-8"
                                >
                                  <Receipt className="h-4 w-4 mr-1" />
                                  Lägg till
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleDeleteCategory(category)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {formatSEK(category.spent)} / {formatSEK(category.budgeted)}
                              </span>
                              <span className={isOverBudget ? 'text-red-500' : 'text-muted-foreground'}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  isOverBudget ? 'bg-red-500' : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Annual Budget Items */}
              {annualItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Årliga budgetposter {getCurrentYear()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {annualItems.map((item) => {
                        const percentage = (item.spent / item.budgeted) * 100;
                        const isCompleted = item.status === 'completed';
                        const isOverdue = item.status === 'overdue';
                        
                        return (
                          <div key={item.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <div>
                                  <span className="font-medium">{item.name}</span>
                                  <div className="text-xs text-muted-foreground">
                                    Målmåndag: {new Date(item.targetDate).toLocaleDateString('sv-SE')}
                                    {isCompleted && <span className="text-green-600 ml-2">✓ Genomförd</span>}
                                    {isOverdue && <span className="text-red-600 ml-2">⚠ Försenad</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openAnnualExpenseDialog(item)}
                                  className="h-8"
                                  disabled={isCompleted}
                                >
                                  <Receipt className="h-4 w-4 mr-1" />
                                  Lägg till utgift
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleDeleteCategory({ ...item } as any)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {formatSEK(item.spent)} / {formatSEK(item.budgeted)}
                              </span>
                              <span className={isCompleted ? 'text-green-600' : isOverdue ? 'text-red-500' : 'text-muted-foreground'}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  isCompleted ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
// ...existing code...

      ) : (
        <>
          {console.log('📋 Rendering DETAILED view')}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Categories Detail - Modern Spreadsheet Design */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  📅 Månadskategorier
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {categories.length > 0 ? categories.map((category, categoryIndex) => {
                    const categoryEntries = getCategoryEntries(category.name, 'monthly');
                    const totalSpent = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
                    
                    return (
                      <div 
                        key={category.id} 
                        className="border-b last:border-b-0"
                        style={{ 
                          borderLeft: `6px solid ${category.color}`,
                          backgroundColor: `${category.color}08`
                        }}
                      >
                        {/* Category Header */}
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-5 h-5 rounded-lg shadow-sm" 
                              style={{ backgroundColor: category.color }}
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">{category.name}</h3>
                              <p className="text-base text-muted-foreground">
                                <span className="font-medium">{formatSEK(totalSpent)}</span> / {formatSEK(category.budgeted)} 
                                <span className="ml-2 text-sm">({categoryEntries.length} utgifter)</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expense List - Spreadsheet Style */}
                        <div className="bg-white dark:bg-gray-900">
                          {categoryEntries.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                              {categoryEntries.map((entry, entryIndex) => (
                                <div 
                                  key={entry.id} 
                                  className={`flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                    entryIndex % 2 === 0 ? 'bg-gray-25 dark:bg-gray-900' : 'bg-white dark:bg-gray-850'
                                  }`}
                                >
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{entry.description}</div>
                                  </div>
                                  <div className="text-sm font-semibold tabular-nums" style={{ color: category.color }}>
                                    {formatSEK(entry.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-center text-muted-foreground">
                              <p className="text-sm">Inga utgifter registrerade</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="p-12 text-center text-muted-foreground">
                      <p className="text-lg">Inga månadskategorier ännu</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Annual Items Detail - Modern Spreadsheet Design */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  🎯 Årliga poster
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {annualItems.length > 0 ? annualItems.map((item, itemIndex) => {
                    const itemEntries = getCategoryEntries(item.name, 'yearly');
                    const totalSpent = itemEntries.reduce((sum, entry) => sum + entry.amount, 0);
                    
                    return (
                      <div 
                        key={item.id} 
                        className="border-b last:border-b-0"
                        style={{ 
                          borderLeft: `6px solid ${item.color}`,
                          backgroundColor: `${item.color}08`
                        }}
                      >
                        {/* Annual Item Header */}
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-6 h-6 rounded-lg shadow-sm" 
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">{item.name}</h3>
                              <p className="text-base text-muted-foreground">
                                <span className="font-medium">{formatSEK(totalSpent)}</span> / {formatSEK(item.budgeted)}
                                <span className="ml-2 text-sm">({itemEntries.length} utgifter)</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Annual Expense List - Spreadsheet Style */}
                        <div className="bg-white dark:bg-gray-900">
                          {itemEntries.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                              {itemEntries.map((entry, entryIndex) => (
                                <div 
                                  key={entry.id} 
                                  className={`flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                    entryIndex % 2 === 0 ? 'bg-gray-25 dark:bg-gray-900' : 'bg-white dark:bg-gray-850'
                                  }`}
                                >
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{entry.description}</div>
                                  </div>
                                  <div className="text-sm font-semibold tabular-nums" style={{ color: item.color }}>
                                    {formatSEK(entry.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-center text-muted-foreground">
                              <p className="text-sm">Inga utgifter registrerade</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="p-12 text-center text-muted-foreground">
                      <p className="text-lg">Inga årliga poster ännu</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}


      {/* Dialogs */}
      {/* Add Annual Budget Dialog */}
      <Dialog open={annualDialogOpen} onOpenChange={setAnnualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till årlig budgetpost</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="annual-name">Namn</Label>
              <Input
                id="annual-name"
                placeholder="t.ex. Årskonferens, Ny laptop, Kursavgift"
                value={annualForm.name}
                onChange={(e) => setAnnualForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annual-budget">Budget (SEK)</Label>
              <Input
                id="annual-budget"
                type="number"
                placeholder="0.00"
                value={annualForm.budget}
                onChange={(e) => setAnnualForm(prev => ({ ...prev, budget: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annual-target">Måldatum</Label>
              <Input
                id="annual-target"
                type="date"
                value={annualForm.targetDate}
                onChange={(e) => setAnnualForm(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Årliga budgetposter</strong> är för engångsutgifter som konferenser, utrustning eller kurser. De läggs automatiskt till i Cash Flow när du registrerar utgifter.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnualDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAddAnnualItem}>
              Lägg till
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Monthly Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till månadsutgift - {selectedCategory?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Belopp (SEK)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Input
                id="description"
                placeholder="Vad var denna utgift för?"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ <strong>Cash Flow Integration:</strong> Alla utgifter från Budget-sidan läggs automatiskt till i Cash Flow för fullständig spårning.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAddExpense}>
              Lägg till utgift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Annual Expense Dialog */}
      <Dialog open={annualExpenseDialogOpen} onOpenChange={setAnnualExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrera utgift - {selectedAnnualItem?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="annual-amount">Belopp (SEK)</Label>
              <Input
                id="annual-amount"
                type="number"
                placeholder="0.00"
                value={annualExpenseForm.amount}
                onChange={(e) => setAnnualExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annual-description">Beskrivning</Label>
              <Input
                id="annual-description"
                placeholder="Detaljer om utgiften"
                value={annualExpenseForm.description}
                onChange={(e) => setAnnualExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annual-date">Datum</Label>
              <Input
                id="annual-date"
                type="date"
                value={annualExpenseForm.date}
                onChange={(e) => setAnnualExpenseForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            {selectedAnnualItem && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Budget:</strong> {formatSEK(selectedAnnualItem.budgeted)}<br />
                  <strong>Spenderat:</strong> {formatSEK(selectedAnnualItem.spent)}<br />
                  <strong>Kvar:</strong> {formatSEK(selectedAnnualItem.budgeted - selectedAnnualItem.spent)}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnualExpenseDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAddAnnualExpense}>
              Registrera utgift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Detail Dialog */}
      <Dialog open={categoryDetailOpen} onOpenChange={setCategoryDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Utgifter för {selectedCategory?.name} - {getCurrentMonthName()}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {categoryExpenses.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Totala utgifter denna månad: {formatSEK(categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                  <br />
                  <span className="text-xs">Alla utgifter syns också i Cash Flow-sidan</span>
                </div>
                
                <div className="border rounded-lg divide-y">
                  {categoryExpenses.map((expense) => (
                    <div key={expense.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{expense.description}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{new Date(expense.date).toLocaleDateString('sv-SE')}</span>
                            {expense.is_recurring && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Återkommande månadsvis
                                </span>
                              </>
                            )}
                            {expense.is_budget_entry && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                  Budget Entry
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-semibold">
                            {formatSEK(expense.amount)}
                          </div>
                          {canDeleteExpense(expense) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              title="Ta bort utgift"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="font-medium mb-1">💡 Om borttagning:</p>
                  <ul className="space-y-1">
                    <li>• Du kan ta bort manuellt tillagda utgifter</li>
                    <li>• Auto-genererade budgetposter kan inte tas bort (redigera budgeten istället)</li>
                    <li>• Borttagning påverkar både Budget och Cash Flow</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Inga utgifter registrerade för denna kategori denna månad.</p>
                <p className="text-sm mt-2">
                  Klicka "Lägg till utgift" för att börja spåra utgifter för {selectedCategory?.name}.
                </p>
                <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                  Alla utgifter kommer automatiskt synas i Cash Flow också.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDetailOpen(false)}>
              Stäng
            </Button>
            {selectedCategory && (
              <Button onClick={() => {
                setCategoryDetailOpen(false);
                openExpenseDialog(selectedCategory);
              }}>
                Lägg till utgift
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}