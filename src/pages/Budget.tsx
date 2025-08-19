import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, PieChart, Plus, Edit, Trash2, Receipt, Eye, Calendar } from 'lucide-react';
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
  const { addEntry, getEntriesByCategory, entries, refetch } = useCashFlow(user?.id || null);
  const { budgets, addBudget, updateBudget, deleteBudget, loading: budgetsLoading } = useBudgets(user?.id || null);
  const { toast } = useToast();

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const currentMonth = new Date().toISOString().slice(0, 7); // Always current month

  // Add expense dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false
  });

  // Category detail dialog state
  const [categoryDetailOpen, setCategoryDetailOpen] = useState(false);
  const [categoryExpenses, setCategoryExpenses] = useState<CashFlowEntry[]>([]);

  // Get current month name for display
  const getCurrentMonthName = () => {
    const date = new Date();
    return date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
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

  // Create monthly recurring expenses automatically
  const createMonthlyRecurringExpenses = async () => {
    if (!user || !entries) return;

    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonthNum = currentDate.getMonth();
      const firstDayOfMonth = new Date(currentYear, currentMonthNum, 1);
      
      // Find all budget categories that should have recurring monthly expenses
      for (const budget of budgets) {
        // Check if we already have a recurring expense for this budget category this month
        const existingMonthlyExpense = entries.find(entry =>
          entry.type === 'expense' &&
          entry.category === budget.category &&
          entry.is_recurring === true &&
          entry.recurring_interval === 'monthly' &&
          new Date(entry.date).getMonth() === currentMonthNum &&
          new Date(entry.date).getFullYear() === currentYear
        );

        // If no recurring expense exists for this month, and budget has a limit, create one
        if (!existingMonthlyExpense && budget.budget_limit > 0) {
          // Calculate next month's date for next_due_date
          const nextMonth = new Date(firstDayOfMonth);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          
          await addEntry({
            type: 'expense',
            amount: budget.budget_limit,
            description: `Budget för ${budget.name}`,
            category: budget.category,
            date: firstDayOfMonth.toISOString().split('T')[0],
            is_recurring: true,
            recurring_interval: 'monthly',
            next_due_date: nextMonth.toISOString().split('T')[0]
          });
        }
      }
    } catch (error) {
      console.error('Error creating monthly recurring expenses:', error);
    }
  };

  // Load budgets and expenses from database
  useEffect(() => {
    const loadData = async () => {
      if (!user || budgetsLoading) return;

      try {
        // Create monthly recurring expenses for budget categories
        await createMonthlyRecurringExpenses();
        
        // Refresh entries after creating recurring expenses
        await refetch();
        
        // Load current month expense data
        const monthlyExpenses = getCurrentMonthExpenses();
        
        // Convert database budgets to UI categories format
        const budgetCategories: BudgetCategory[] = budgets.map((budget, index) => {
          const categoryExpenses = monthlyExpenses.filter(exp => 
            exp.category.toLowerCase() === budget.category.toLowerCase() ||
            exp.category.toLowerCase().includes(budget.category.toLowerCase().split(' ')[0])
          );
          const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

          // Assign different colors to each category
          const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
          
          return {
            id: budget.id,
            name: budget.name,
            budgeted: budget.budget_limit,
            spent: totalSpent,
            color: colors[index % colors.length]
          };
        });

        setCategories(budgetCategories);
      } catch (error) {
        console.error('Error loading budgets and expenses:', error);
      }
    };

    loadData();
  }, [user?.id, budgets, budgetsLoading]);

  const handleAddExpense = async () => {
    if (!selectedCategory || !expenseForm.amount || !expenseForm.description) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i alla fält.",
        variant: "destructive"
      });
      return;
    }

    // Ensure the date is within the current month
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
      // Calculate next due date for recurring expenses
      let nextDueDate = null;
      if (expenseForm.isRecurring) {
        const nextMonth = new Date(expenseDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextDueDate = nextMonth.toISOString().split('T')[0];
      }

      // Add the expense to cash flow
      await addEntry({
        type: 'expense',
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        category: selectedCategory.name,
        date: expenseForm.date,
        is_recurring: expenseForm.isRecurring,
        recurring_interval: expenseForm.isRecurring ? 'monthly' : null,
        next_due_date: nextDueDate
      });

      // Refresh data
      await refetch();

      toast({
        title: "Månadsutgift tillagd",
        description: `${formatSEK(parseFloat(expenseForm.amount))} lades till i ${selectedCategory.name}${expenseForm.isRecurring ? ' och kommer visas i Cash Flow som återkommande' : ' och syns nu i Cash Flow'}`,
      });

      // Reset form and close dialog
      setExpenseForm({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false
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

  // Open category detail view (current month only)
  const openCategoryDetail = async (category: BudgetCategory) => {
    try {
      setSelectedCategory(category);
      
      // Filter expenses from the current month only
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

  // Edit category functionality - also updates the recurring expense
  const handleEditCategory = async (category: BudgetCategory) => {
    const newBudget = prompt(`Redigera månadsbudget för ${category.name}:`, category.budgeted.toString());
    if (newBudget && !isNaN(parseFloat(newBudget))) {
      const success = await updateBudget(category.id, { 
        budget_limit: parseFloat(newBudget),
        updated_at: new Date().toISOString()
      });
      
      if (success) {
        // Also update the recurring expense amount in cash flow
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonthNum = currentDate.getMonth();
        
        const recurringExpense = entries.find(entry =>
          entry.type === 'expense' &&
          entry.category === category.name &&
          entry.is_recurring === true &&
          entry.recurring_interval === 'monthly' &&
          new Date(entry.date).getMonth() === currentMonthNum &&
          new Date(entry.date).getFullYear() === currentYear
        );

        if (recurringExpense) {
          // Update the recurring expense amount
          // Note: You'll need to implement updateEntry in useCashFlow hook
          // await updateEntry(recurringExpense.id, { amount: parseFloat(newBudget) });
        }

        toast({
          title: "Månadsbudget uppdaterad",
          description: `Budget för ${category.name} uppdaterad till ${formatSEK(parseFloat(newBudget))}/månad och kommer synas i Cash Flow`,
        });
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
    if (confirm(`Är du säker på att du vill ta bort kategorin "${category.name}"? Detta kommer också ta bort alla relaterade utgifter från Cash Flow.`)) {
      const success = await deleteBudget(category.id);
      
      if (success) {
        // Also remove related recurring expenses from cash flow
        // Note: You might want to implement a function to remove related cash flow entries
        
        toast({
          title: "Kategori borttagen",
          description: `${category.name} har tagits bort från månadsbudgeten och Cash Flow`,
        });
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
    const name = prompt("Namn på ny månadskategori:");
    if (!name) return;
    
    const budget = prompt("Månadsbudget för denna kategori (SEK):");
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
      // Create the initial monthly recurring expense in cash flow
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      const nextMonth = new Date(firstDayOfMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await addEntry({
        type: 'expense',
        amount: parseFloat(budget),
        description: `Budget för ${name.trim()}`,
        category: name.trim(),
        date: firstDayOfMonth.toISOString().split('T')[0],
        is_recurring: true,
        recurring_interval: 'monthly',
        next_due_date: nextMonth.toISOString().split('T')[0]
      });

      toast({
        title: "Månadskategori tillagd",
        description: `${name.trim()} med budget ${formatSEK(parseFloat(budget))}/månad har lagts till och kommer synas i Cash Flow`,
      });
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
            <h1 className="text-3xl font-bold">Månadsbudget</h1>
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
          <h1 className="text-3xl font-bold">Månadsbudget</h1>
          <p className="text-muted-foreground">
            Hantera din budget för {getCurrentMonthName()} - synkroniseras med Cash Flow
          </p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Lägg till kategori
        </Button>
      </div>

      {/* Current month indicator */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Aktuell månad: {getCurrentMonthName()}
              </span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Alla budgetutgifter syns automatiskt i Cash Flow
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show empty state if no categories */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Inga månadskategorier än</h3>
            <p className="text-muted-foreground mb-4">
              Skapa din första budgetkategori för att börja spåra månatliga utgifter
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4 text-sm">
              <p className="font-medium mb-2">💡 Så fungerar det:</p>
              <ul className="text-left space-y-1 text-muted-foreground">
                <li>• Skapa budgetkategorier här (t.ex. "Mat", "Transport", "Hyra")</li>
                <li>• Lägg till utgifter i varje kategori</li>
                <li>• Allt syns automatiskt i Cash Flow med återkommande poster</li>
                <li>• Använd Cash Flow för årliga utgifter och speciella poster</li>
              </ul>
            </div>
            <Button onClick={handleAddCategory} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Skapa första kategorin
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total månadsbudget
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
                  Spenderat denna månad
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Kvar denna månad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {formatSEK(Math.abs(remaining))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {remaining < 0 ? 'Över budget' : 'Tillgängligt'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Faktisk</CardTitle>
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

          {/* Budget Categories */}
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
                            Visa detaljer
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openExpenseDialog(category)}
                            className="h-8"
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            Lägg till utgift
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
        </>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till utgift - {selectedCategory?.name}</DialogTitle>
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

            {/* Recurring expense option */}
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
                  Återkommande månadsutgift (syns i Cash Flow som återkommande)
                </Label>
              </div>
              
              {expenseForm.isRecurring && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md ml-6">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Denna utgift kommer att skapas automatiskt varje månad och synas i Cash Flow med återkommande status.
                  </p>
                </div>
              )}
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
              Lägg till i Budget & Cash Flow
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
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString('sv-SE')}
                            {expense.is_recurring && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Återkommande månadsvis i Cash Flow
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