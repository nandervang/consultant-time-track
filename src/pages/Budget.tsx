import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, PieChart, Plus, Edit, Trash2, Receipt, Eye } from 'lucide-react';
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

export default function BudgetPage({ isDarkMode }: BudgetPageProps) {
  const { user } = useAuth();
  const { addEntry, getEntriesByCategory, entries } = useCashFlow(user?.id || null);
  const { budgets, addBudget, updateBudget, deleteBudget, loading: budgetsLoading } = useBudgets(user?.id || null);
  const { toast } = useToast();

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenseData, setExpenseData] = useState<Array<{category: string, amount: number}>>([]);

  // Add expense dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringInterval: 'monthly' as 'weekly' | 'monthly' | 'yearly'
  });

  // Category detail dialog state
  const [categoryDetailOpen, setCategoryDetailOpen] = useState(false);
  const [categoryExpenses, setCategoryExpenses] = useState<CashFlowEntry[]>([]);

  // Load budgets and expenses from database
  useEffect(() => {
    const loadData = async () => {
      if (!user || budgetsLoading) return;

      try {
        // Load expense data - but only call once per user
        const expenses = await getEntriesByCategory('expense');
        setExpenseData(expenses);
        
        // Convert database budgets to UI categories format
        const budgetCategories: BudgetCategory[] = budgets.map(budget => {
          const categoryExpenses = expenses.filter(exp => 
            exp.category.toLowerCase() === budget.category.toLowerCase() ||
            exp.category.toLowerCase().includes(budget.category.toLowerCase().split(' ')[0])
          );
          const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

          return {
            id: budget.id,
            name: budget.name,
            budgeted: budget.budget_limit,
            spent: totalSpent,
            color: '#2563eb' // Default color since it's not in the current schema
          };
        });

        setCategories(budgetCategories);
      } catch (error) {
        console.error('Error loading budgets and expenses:', error);
      }
    };

    loadData();
  }, [user?.id, budgets, budgetsLoading]); // Only depend on user ID and budgets data

  // Initialize default budget categories if none exist
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    const initializeDefaults = async () => {
      if (!user || budgetsLoading || budgets.length > 0 || hasInitialized) return;

      // Check if any budgets exist first
      const existingBudgets = budgets;
      if (existingBudgets.length > 0) {
        setHasInitialized(true);
        return;
      }

      const defaultBudgets = [
        { name: 'Software & Tools', category: 'Software & Tools', budget_limit: 2000 },
        { name: 'Marketing', category: 'Marketing', budget_limit: 3000 },
        { name: 'Office Expenses', category: 'Office Expenses', budget_limit: 1500 },
        { name: 'Travel', category: 'Travel', budget_limit: 2500 },
        { name: 'Professional Development', category: 'Professional Development', budget_limit: 1000 },
      ];

      // Only create if no budgets exist and we haven't already initialized
      for (const budget of defaultBudgets) {
        await addBudget({
          ...budget,
          period: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          is_active: true
        });
      }
      
      setHasInitialized(true);
    };

    initializeDefaults();
  }, [user, budgetsLoading, budgets.length, hasInitialized, addBudget]);

  const handleAddExpense = async () => {
    if (!selectedCategory || !expenseForm.amount || !expenseForm.description) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i alla fält.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Calculate next due date for recurring expenses
      let nextDueDate = null;
      if (expenseForm.isRecurring) {
        const currentDate = new Date(expenseForm.date);
        if (expenseForm.recurringInterval === 'weekly') {
          nextDueDate = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        } else if (expenseForm.recurringInterval === 'monthly') {
          const nextMonth = new Date(currentDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextDueDate = nextMonth.toISOString().split('T')[0];
        } else if (expenseForm.recurringInterval === 'yearly') {
          const nextYear = new Date(currentDate);
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          nextDueDate = nextYear.toISOString().split('T')[0];
        }
      }

      await addEntry({
        type: 'expense',
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        category: selectedCategory.name,
        date: expenseForm.date,
        is_recurring: expenseForm.isRecurring,
        recurring_interval: expenseForm.isRecurring ? expenseForm.recurringInterval : null,
        next_due_date: nextDueDate
      });

      // Refresh expense data after adding
      const updatedExpenses = await getEntriesByCategory('expense');
      setExpenseData(updatedExpenses);
      
      // Update categories with new expense data
      setCategories(prev => prev.map(cat => {
        if (cat.id === selectedCategory.id) {
          const categoryExpenses = updatedExpenses.filter(exp => 
            exp.category.toLowerCase() === cat.name.toLowerCase() ||
            exp.category.toLowerCase().includes(cat.name.toLowerCase().split(' ')[0])
          );
          const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          return { ...cat, spent: totalSpent };
        }
        return cat;
      }));

      toast({
        title: "Utgift tillagd",
        description: `${formatSEK(parseFloat(expenseForm.amount))} lades till i ${selectedCategory.name}${expenseForm.isRecurring ? ' (återkommande)' : ''}`,
      });

      // Reset form and close dialog
      setExpenseForm({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        recurringInterval: 'monthly'
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

  const openExpenseDialog = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setExpenseDialogOpen(true);
  };

  // Open category detail view
  const openCategoryDetail = async (category: BudgetCategory) => {
    try {
      setSelectedCategory(category);
      
      // Filter expenses from the existing entries for this category
      const categorySpecificExpenses = entries.filter(entry => 
        entry.type === 'expense' && 
        (entry.category.toLowerCase() === category.name.toLowerCase() ||
         entry.category.toLowerCase().includes(category.name.toLowerCase().split(' ')[0]))
      );
      
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

  // Edit category functionality
  const handleEditCategory = async (category: BudgetCategory) => {
    const newBudget = prompt(`Edit budget for ${category.name}:`, category.budgeted.toString());
    if (newBudget && !isNaN(parseFloat(newBudget))) {
      const success = await updateBudget(category.id, { 
        budget_limit: parseFloat(newBudget),
        updated_at: new Date().toISOString()
      });
      
      if (success) {
        toast({
          title: "Budget uppdaterad",
          description: `Budget för ${category.name} uppdaterad till ${formatSEK(parseFloat(newBudget))}`,
        });
        // Data will refresh automatically through useEffect
      } else {
        toast({
          title: "Fel",
          description: "Kunde inte uppdatera budget",
          variant: "destructive"
        });
      }
    }
  };

  // Delete category functionality  
  const handleDeleteCategory = async (category: BudgetCategory) => {
    if (confirm(`Är du säker på att du vill ta bort kategorin "${category.name}"?`)) {
      const success = await deleteBudget(category.id);
      
      if (success) {
        toast({
          title: "Kategori borttagen",
          description: `${category.name} har tagits bort från budgeten`,
        });
        // Data will refresh automatically through useEffect
      } else {
        toast({
          title: "Fel", 
          description: "Kunde inte ta bort kategori",
          variant: "destructive"
        });
      }
    }
  };

  // Add new category functionality
  const handleAddCategory = async () => {
    const name = prompt("Namn på ny kategori:");
    if (!name) return;
    
    const budget = prompt("Budget för denna kategori (SEK):");
    if (!budget || isNaN(parseFloat(budget))) return;

    const success = await addBudget({
      name: name.trim(),
      category: name.trim(),
      budget_limit: parseFloat(budget),
      period: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      is_active: true
    });

    if (success) {
      toast({
        title: "Kategori tillagd",
        description: `${name.trim()} med budget ${formatSEK(parseFloat(budget))} har lagts till`,
      });
      // Data will refresh automatically through useEffect
    } else {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till kategori",
        variant: "destructive"
      });
    }
  };

  const totalBudget = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const remaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Show loading state
  if (budgetsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Budget Management</h1>
            <p className="text-muted-foreground">Loading budget data...</p>
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

  const pieData = categories.map(cat => ({
    name: cat.name,
    value: cat.spent,
    color: cat.color
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">
            Plan and track your finances
          </p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSEK(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSEK(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">{spentPercentage.toFixed(1)}% of budget</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {formatSEK(Math.abs(remaining))}
            </div>
            <p className="text-xs text-muted-foreground">
              {remaining < 0 ? 'Over budget' : 'Available'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
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
                  <Bar dataKey="budgeted" fill="#e2e8f0" name="Budgeted" />
                  <Bar dataKey="spent" fill="#2563eb" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
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
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openExpenseDialog(category)}
                        className="h-8"
                      >
                        <Receipt className="h-4 w-4 mr-1" />
                        Add Expense
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

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense to {selectedCategory?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (SEK)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What was this expense for?"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            {/* Recurring expense options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={expenseForm.isRecurring}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="recurring" className="text-sm font-medium">
                  This is a recurring expense
                </Label>
              </div>
              
              {expenseForm.isRecurring && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="interval">Repeat every</Label>
                  <select
                    id="interval"
                    value={expenseForm.recurringInterval}
                    onChange={(e) => setExpenseForm(prev => ({ 
                      ...prev, 
                      recurringInterval: e.target.value as 'weekly' | 'monthly' | 'yearly' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="weekly">Week</option>
                    <option value="monthly">Month</option>
                    <option value="yearly">Year</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Next payment will be scheduled automatically
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense}>
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Detail Dialog */}
      <Dialog open={categoryDetailOpen} onOpenChange={setCategoryDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Expenses for {selectedCategory?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {categoryExpenses.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Total expenses: {formatSEK(categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                </div>
                
                <div className="border rounded-lg divide-y">
                  {categoryExpenses.map((expense) => (
                    <div key={expense.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString('sv-SE')}
                            {expense.is_recurring && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Recurring {expense.recurring_interval}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-lg font-semibold">
                          {formatSEK(expense.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>No expenses recorded for this category yet.</p>
                <p className="text-sm mt-2">
                  Click "Add Expense" to start tracking expenses for {selectedCategory?.name}.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDetailOpen(false)}>
              Close
            </Button>
            {selectedCategory && (
              <Button onClick={() => {
                setCategoryDetailOpen(false);
                openExpenseDialog(selectedCategory);
              }}>
                Add Expense
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
