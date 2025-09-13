import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  Plus,
  Filter,
  Download,
  Trash2,
  Edit
} from 'lucide-react';
import { formatSEK } from '../lib/currency';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useCashFlow } from '@/hooks/useCashFlow';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Import the enhanced type from the hook
type EnhancedCashFlowEntry = ReturnType<typeof useCashFlow>['entries'][0];

interface CashFlowPageProps {
  isDarkMode: boolean;
}

interface MonthlyData {
  month: string;
  monthName: string;
  income: number;
  expenses: number;
  netFlow: number;
  cumulativeBalance: number;
  entries: EnhancedCashFlowEntry[];
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}

export default function CashFlowPage({ isDarkMode }: CashFlowPageProps) {
  const { user } = useAuth();
  const { entries, loading, addEntry, updateEntry, deleteEntry, error } = useCashFlow(user?.id || null);
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<EnhancedCashFlowEntry | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Dialog states for consistent modal experience
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<EnhancedCashFlowEntry | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false
  });

  // Process entries into monthly data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<{
    income: Array<{name: string, value: number, color: string}>,
    expense: Array<{name: string, value: number, color: string}>
  }>({
    income: [],
    expense: []
  });

  useEffect(() => {
    if (entries.length > 0) {
      processMonthlyData();
      processCategoryData();
    } else {
      initializeEmptyMonthlyData();
    }
  }, [entries]);

  const initializeEmptyMonthlyData = () => {
    const months = [];
    const now = new Date();
    
    // Create 7 months: 2 past + current + 4 future
    for (let i = -2; i <= 4; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
      
      months.push({
        month: monthKey,
        monthName,
        income: 0,
        expenses: 0,
        netFlow: 0,
        cumulativeBalance: 50000, // Starting balance
        entries: [],
        isPast: i < 0,
        isCurrent: i === 0,
        isFuture: i > 0
      });
    }

    setMonthlyData(months);
  };

  const processMonthlyData = () => {
    // Create 7 months: 2 past + current + 4 future
    const months = [];
    const now = new Date();
    
    for (let i = -2; i <= 4; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
      
      months.push({
        month: monthKey,
        monthName,
        income: 0,
        expenses: 0,
        netFlow: 0,
        cumulativeBalance: 0,
        entries: [],
        isPast: i < 0,
        isCurrent: i === 0,
        isFuture: i > 0
      });
    }

    // Group entries by month
    const monthlyMap = new Map<string, MonthlyData>();
    months.forEach(month => {
      monthlyMap.set(month.month, month);
    });

    // Process all entries (including generating recurring ones)
    const allEntries = generateRecurringEntries(entries, months);

    console.log('=== MONTHLY DATA PROCESSING ===');
    console.log('Total entries after generation:', allEntries.length);
    console.log('Original entries:', entries.length);
    console.log('Generated entries:', allEntries.length - entries.length);
    
    // Enhanced logging to track data sources
    const sourceBreakdown = {
      manual: allEntries.filter(e => e.source === 'manual').length,
      budget: allEntries.filter(e => e.source === 'budget').length,
      invoice: allEntries.filter(e => e.source === 'invoice').length,
      editable: allEntries.filter(e => e.is_editable).length,
      readonly: allEntries.filter(e => !e.is_editable).length
    };
    
    console.log('Entry source breakdown:', sourceBreakdown);
    
    if (sourceBreakdown.invoice > 0) {
      console.log(`INFO: ${sourceBreakdown.invoice} invoice entries included (read-only)`);
    }
    if (sourceBreakdown.editable > 0) {
      console.log(`INFO: ${sourceBreakdown.editable} manual entries (editable)`);
    }

    allEntries.forEach((entry) => {
      const entryMonth = entry.date.toString().slice(0, 7);
      const monthData = monthlyMap.get(entryMonth);
      
      const sourceLabel = entry.source === 'invoice' ? '[INV]' : 
                         entry.source === 'manual' ? '[MAN]' : '[GEN]';
      const isBudget = entry.is_budget_entry === true || 
                       entry.description?.toLowerCase().includes('budget');
      
      console.log(`${sourceLabel} ${entryMonth}: ${entry.type} ${entry.amount} SEK - "${entry.description}" ${isBudget ? '[BUDGET - SHOULD BE FILTERED]' : ''}`);
      
      if (monthData) {
        monthData.entries.push(entry);
        
        if (entry.type === 'income') {
          monthData.income += entry.amount;
        } else if (entry.type === 'expense') {
          monthData.expenses += entry.amount;
        }
      }
    });

    // Calculate net flow and cumulative balance
    let runningBalance = 50000; // Starting balance
    const processedMonths = months.map((month) => {
      month.netFlow = month.income - month.expenses;
      runningBalance += month.netFlow;
      month.cumulativeBalance = runningBalance;
      return month;
    });
    
    console.log('Final monthly breakdown:', processedMonths.map(month => ({
      month: month.month,
      monthName: month.monthName,
      entriesCount: month.entries.length,
      income: month.income,
      expenses: month.expenses,
      netFlow: month.netFlow,
      cumulativeBalance: month.cumulativeBalance
    })));
    console.log('=== END MONTHLY PROCESSING ===');
    
    setMonthlyData(processedMonths);
  };

  // Generate recurring entries - Works with actual database structure
  const generateRecurringEntries = (baseEntries: EnhancedCashFlowEntry[], monthsData: MonthlyData[]): EnhancedCashFlowEntry[] => {
    const allEntries = [...baseEntries];
    const monthKeys = monthsData.map(m => m.month);

    // ONLY process recurring entries (no budget entries in cash flow anymore)
    const recurringEntries = baseEntries.filter(entry => 
      entry.is_recurring === true
    );

    console.log('=== RECURRING ENTRY GENERATION ===');
    console.log('Total base entries:', baseEntries.length);
    console.log('Found actual recurring entries to process:', recurringEntries.length);

    // CRITICAL FIX: Deduplicate recurring entries by description + amount + category
    const uniqueRecurringEntries = new Map();
    recurringEntries.forEach(entry => {
      const key = `${entry.description}_${entry.amount}_${entry.category}`;
      if (!uniqueRecurringEntries.has(key)) {
        uniqueRecurringEntries.set(key, entry);
      } else {
        console.log(`Skipping duplicate recurring entry: ${entry.description}`);
      }
    });

    const deduplicatedRecurringEntries = Array.from(uniqueRecurringEntries.values());
    console.log('Deduplicated actual recurring entries:', deduplicatedRecurringEntries.length);

    deduplicatedRecurringEntries.forEach((recurringEntry) => {
      const originalDate = new Date(recurringEntry.date);
      const originalMonth = recurringEntry.date.slice(0, 7);
      
      console.log(`Processing recurring entry: ${recurringEntry.description} from ${originalMonth}`);
      
      // Generate recurring entry for each month in our 7-month period
      monthKeys.forEach((monthKey) => {
        // Skip the original month (already exists)
        if (monthKey === originalMonth) {
          console.log(`Skipping original month ${monthKey} for ${recurringEntry.description}`);
          return;
        }
        
        // Calculate the date for this month
        const [year, month] = monthKey.split('-').map(Number);
        let recurringDate = new Date(year, month - 1, originalDate.getDate());
        
        // Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
        if (recurringDate.getMonth() !== month - 1) {
          // Set to last day of the target month
          recurringDate = new Date(year, month, 0);
        }

        // Use timezone-safe date formatting instead of toISOString()
        const generatedDateString = `${year}-${String(month).padStart(2, '0')}-${String(recurringDate.getDate()).padStart(2, '0')}`;
        const generatedMonth = generatedDateString.slice(0, 7);
        
        // Verify the generated date is in the correct month
        if (generatedMonth !== monthKey) {
          console.error(`Date generation error: expected ${monthKey}, got ${generatedMonth}`);
          return;
        }
        
        // Create a recurring entry for this month
        const recurringEntryForMonth = {
          ...recurringEntry,
          id: `${recurringEntry.id}_recurring_${monthKey}`, // Unique ID for recurring instance
          date: generatedDateString,
          original_entry_id: recurringEntry.id // Reference to original entry
        };
        
        console.log(`Generated entry for ${monthKey}:`, {
          id: recurringEntryForMonth.id,
          description: recurringEntryForMonth.description,
          amount: recurringEntryForMonth.amount,
          date: recurringEntryForMonth.date,
          targetMonth: monthKey
        });
        
        allEntries.push(recurringEntryForMonth);
      });
    });

    return allEntries;
  };

  const processCategoryData = () => {
    const incomeCategories = new Map<string, number>();
    const expenseCategories = new Map<string, number>();

    // ENHANCED: More comprehensive filtering for actual transactions
    // Include recurring budget items as they represent actual monthly expenses
    const actualEntries = entries.filter(entry => {
      const isBudgetEntry = entry.is_budget_entry === true || 
                           entry.description?.toLowerCase().includes('budget för') || 
                           entry.description?.toLowerCase().includes('budget for') ||
                           entry.description?.toLowerCase().startsWith('budget') ||
                           entry.description?.toLowerCase().includes('årlig budget');
      
      // Include recurring budget entries as they represent actual monthly expenses
      if (isBudgetEntry && entry.is_recurring) {
        console.log(`Including recurring budget entry as actual expense: "${entry.description}"`);
        return true;
      }
      
      // Exclude non-recurring budget entries (these are just planning)
      if (isBudgetEntry && !entry.is_recurring) {
        console.log(`Excluding non-recurring budget entry: "${entry.description}"`);
        return false;
      }
      
      return true; // Include all other actual transactions
    });

    // ENHANCED: Add detailed logging with source information
    console.log('=== PROCESSING CATEGORY DATA ===');
    console.log('Total entries loaded:', entries.length);
    console.log('Budget entries filtered out:', entries.filter(e => 
      e.is_budget_entry === true || 
      e.description?.toLowerCase().includes('budget')).length);
    console.log('Actual transaction entries:', actualEntries.length);
    
    // Break down by source
    const manualEntries = actualEntries.filter(e => e.source === 'manual' || !e.source);
    const invoiceEntries = actualEntries.filter(e => e.source === 'invoice');
    
    console.log('Manual cash flow entries:', manualEntries.length);
    console.log('Invoice-derived entries:', invoiceEntries.length);

    actualEntries.forEach((entry) => {
      const sourceLabel = entry.source === 'invoice' ? '[INVOICE]' : 
                         entry.source === 'budget' ? '[BUDGET]' : '[MANUAL]';
      console.log(`${sourceLabel} ${entry.type.toUpperCase()}: ${entry.description} - ${entry.category} - ${entry.amount} SEK`);
      
      if (entry.type === 'income') {
        const currentAmount = incomeCategories.get(entry.category) || 0;
        incomeCategories.set(entry.category, currentAmount + entry.amount);
      } else {
        const currentAmount = expenseCategories.get(entry.category) || 0;
        expenseCategories.set(entry.category, currentAmount + entry.amount);
      }
    });

    console.log('Final income categories:', Array.from(incomeCategories.entries()));
    console.log('Final expense categories:', Array.from(expenseCategories.entries()));
    console.log('=== END CATEGORY PROCESSING ===');

    const colors = ['#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#dc2626', '#06b6d4', '#84cc16', '#f59e0b'];

    setCategoryData({
      income: Array.from(incomeCategories.entries()).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      })),
      expense: Array.from(expenseCategories.entries()).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
    });
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const newEntry = {
        type: formType,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
        is_recurring: formData.isRecurring,
        recurring_interval: formData.isRecurring ? ('monthly' as const) : null,
        next_due_date: formData.isRecurring ? formData.date : null,
        is_budget_entry: false,
        is_recurring_instance: false,
        project_id: null,
        client_id: null
      };

      const result = await addEntry(newEntry);
      
      if (result) {
        toast({
          title: "Success",
          description: `${formType === 'income' ? 'Income' : 'Expense'} added successfully`,
        });

        // Reset form
        setFormData({
          amount: '',
          description: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          isRecurring: false
        });
        setShowAddForm(false);
      } else {
        throw new Error('Failed to add entry');
      }
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
    }
  };

  const handleEditTransaction = (entry: EnhancedCashFlowEntry) => {
    setEditingEntry(entry);
    setFormData({
      amount: entry.amount.toString(),
      description: entry.description,
      category: entry.category,
      date: entry.date,
      isRecurring: entry.is_recurring
    });
    setShowEditDialog(true);
  };

  const handleDeleteTransaction = (entry: EnhancedCashFlowEntry) => {
    setEntryToDelete(entry);
    setShowDeleteDialog(true);
  };

  // Dialog handlers for edit and delete operations
  const handleEditSubmit = async () => {
    if (!editingEntry) return;

    try {
      await updateEntry(editingEntry.id, {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
        is_recurring: formData.isRecurring
      });

      setShowEditDialog(false);
      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive"
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    try {
      await deleteEntry(entryToDelete.id);
      setShowDeleteDialog(false);
      setEntryToDelete(null);
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTransaction = async () => {
    if (!editingEntry) return;

    try {
      const updatedEntry = {
        type: formType,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
        is_recurring: formData.isRecurring,
        recurring_interval: formData.isRecurring ? ('monthly' as const) : null,
        next_due_date: formData.isRecurring ? formData.date : null,
        is_budget_entry: false,
        is_recurring_instance: false,
        project_id: null,
        client_id: null
      };

      // Use updateEntry from the hook
      const result = await updateEntry(editingEntry.id, updatedEntry);
      
      if (result) {
        setShowEditForm(false);
        setEditingEntry(null);
        setFormData({
          amount: '',
          description: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          isRecurring: false
        });
        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive"
      });
    }
  };

  const getNextMonthDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const getCurrentMonth = () => {
    const current = monthlyData.find(m => m.isCurrent);
    return current || {
      month: new Date().toISOString().slice(0, 7),
      monthName: new Date().toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }),
      income: 0,
      expenses: 0,
      netFlow: 0,
      cumulativeBalance: 50000,
      entries: [],
      isPast: false,
      isCurrent: true,
      isFuture: false
    };
  };

  const getSelectedMonthData = () => {
    if (!selectedMonth) return getCurrentMonth();
    const found = monthlyData.find(m => m.month === selectedMonth);
    return found || getCurrentMonth();
  };

  // Check if an entry can be deleted/edited - ONLY manual cash flow entries
  const canDeleteEntry = (entry: EnhancedCashFlowEntry) => {
    // Use the enhanced is_editable property from the hook
    // This properly distinguishes between manual entries (editable) and budget entries (read-only)
    const canEdit = entry.is_editable === true;
    
    console.log(`Entry "${entry.description}": canEdit=${canEdit}, source=${entry.source}, is_budget_entry=${entry.is_budget_entry}, id=${entry.id}`);
    
    return canEdit;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading cash flow data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  const currentMonth = getCurrentMonth();
  const selectedMonthData = getSelectedMonthData();

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow Analysis</h1>
          <p className="text-muted-foreground">
            Monitor your income and expenses flow ({entries.length} entries) - 7 month view
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add {formType === 'income' ? 'Income' : 'Expense'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select 
                    value={formType} 
                    onChange={(e) => setFormType(e.target.value as 'income' | 'expense')}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Amount (SEK)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    required
                  >
                    <option value="">Select category</option>
                    {formType === 'income' ? (
                      <>
                        <option value="Client Payment">Client Payment</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Retainer">Retainer</option>
                        <option value="Investment">Investment</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Software & Tools">Software & Tools</option>
                        <option value="Office Expenses">Office Expenses</option>
                        <option value="Travel">Travel</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Professional Development">Professional Development</option>
                        <option value="Tax">Tax</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Description of transaction"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="recurring">Recurring monthly transaction</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Add Transaction</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Transaction Form */}
      {showEditForm && (
        <Card>
          <CardHeader>
            <CardTitle>Edit {formType === 'income' ? 'Income' : 'Expense'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateTransaction(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select 
                    value={formType} 
                    onChange={(e) => setFormType(e.target.value as 'income' | 'expense')}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Amount (SEK)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    required
                  >
                    <option value="">Select category</option>
                    {formType === 'income' ? (
                      <>
                        <option value="Client Payment">Client Payment</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Investment">Investment</option>
                        <option value="Other Income">Other Income</option>
                      </>
                    ) : (
                      <>
                        <option value="Software">Software</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Travel">Travel</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Enter description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring-edit"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="recurring-edit">Recurring monthly transaction</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Update Transaction</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowEditForm(false);
                  setEditingEntry(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Month Selector */}
      <Card>
        <CardHeader>
          <CardTitle>7-Month Cash Flow Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            2 past months • Current month • 4 future months
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {monthlyData.map((month) => (
              <div
                key={month.month}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedMonth === month.month
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : month.isCurrent
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : month.isPast
                    ? 'border-gray-300 bg-gray-50 dark:bg-gray-800'
                    : 'border-purple-300 bg-purple-50 dark:bg-purple-950'
                }`}
                onClick={() => setSelectedMonth(selectedMonth === month.month ? '' : month.month)}
              >
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-between">
                  <span>{month.monthName}</span>
                  {month.isCurrent && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full dark:bg-green-900 dark:text-green-200">
                      NOW
                    </span>
                  )}
                  {month.isPast && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full dark:bg-gray-700 dark:text-gray-300">
                      PAST
                    </span>
                  )}
                  {month.isFuture && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900 dark:text-purple-200">
                      FUTURE
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-green-600">
                    In: {formatSEK(month.income)}
                  </div>
                  <div className="text-xs text-red-600">
                    Out: {formatSEK(month.expenses)}
                  </div>
                  <div className={`text-sm font-bold ${
                    month.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Net: {formatSEK(month.netFlow)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Balance: {formatSEK(month.cumulativeBalance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Month Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedMonth ? selectedMonthData.monthName : currentMonth.monthName} Details
            {!selectedMonth && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full dark:bg-green-900 dark:text-green-200">
                CURRENT MONTH
              </span>
            )}
            {selectedMonth && selectedMonthData.isPast && (
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full dark:bg-gray-700 dark:text-gray-300">
                PAST MONTH
              </span>
            )}
            {selectedMonth && selectedMonthData.isFuture && (
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900 dark:text-purple-200">
                FUTURE MONTH
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatSEK(selectedMonthData.income)}
              </div>
              <div className="text-sm text-muted-foreground">Income</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatSEK(selectedMonthData.expenses)}
              </div>
              <div className="text-sm text-muted-foreground">Expenses</div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              selectedMonthData.netFlow >= 0 
                ? 'bg-blue-50 dark:bg-blue-950' 
                : 'bg-orange-50 dark:bg-orange-950'
            }`}>
              <div className={`text-2xl font-bold ${
                selectedMonthData.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatSEK(selectedMonthData.netFlow)}
              </div>
              <div className="text-sm text-muted-foreground">Net Flow</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatSEK(selectedMonthData.cumulativeBalance)}
              </div>
              <div className="text-sm text-muted-foreground">Balance</div>
            </div>
          </div>

          {/* Transactions for selected month */}
          <div className="space-y-2">
            <h4 className="font-medium">Transactions ({selectedMonthData.entries.length})</h4>
            <div className="max-h-84 overflow-y-auto space-y-2">
              {selectedMonthData.entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      entry.type === 'income' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {entry.type === 'income' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{entry.description}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{entry.category}</span>
                        {/* Entry Type Indicators */}
                        {entry.source === 'invoice' && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-600 text-xs font-medium">Invoice Due</span>
                            </div>
                          </>
                        )}
                        
                        {entry.is_recurring && entry.source === 'manual' && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Recurring</span>
                            </div>
                          </>
                        )}
                        
                        {entry.source === 'budget' && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600 text-xs font-medium">Recuring budget Entry</span>
                          </>
                        )}
                        
                        {entry.source === 'manual' && !entry.is_recurring && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 text-xs font-medium">Manual Entry</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-lg font-semibold ${
                      entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.type === 'income' ? '+' : '-'}{formatSEK(entry.amount)}
                    </div>
                    {canDeleteEntry(entry) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTransaction(entry)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                          title="Edit transaction"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTransaction(entry)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          title={entry.is_recurring ? "Delete recurring transaction" : "Delete transaction"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {selectedMonthData.entries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedMonthData.isFuture ? 
                    'No planned transactions for this future month' :
                    'No transactions for this month'
                  }
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts - Only show if we have data */}
      {monthlyData.some(m => m.income > 0 || m.expenses > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Trend */}
          <Card>
            <CardHeader>
              <CardTitle>7-Month Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <XAxis 
                      dataKey="monthName" 
                      tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatSEK(value), 
                        name === 'netFlow' ? 'Net Flow' : name === 'cumulativeBalance' ? 'Balance' : name
                      ]}
                      labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                        border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="netFlow" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                      name="Net Flow"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeBalance" 
                      stroke="#16a34a" 
                      strokeWidth={2}
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 3 }}
                      name="Balance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
        </Card>

          {/* Income vs Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <XAxis 
                      dataKey="monthName" 
                      tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatSEK(value), 
                        name === 'income' ? 'Income' : 'Expenses'
                      ]}
                      labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                        border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stackId="1" 
                      stroke="#16a34a" 
                      fill="#16a34a" 
                      fillOpacity={0.6}
                      name="IncomesaSA"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stackId="2" 
                      stroke="#dc2626" 
                      fill="#dc2626" 
                      fillOpacity={0.6}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income Categories (Actual Transactions Only)</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.income.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="h-32 w-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.income}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {categoryData.income.map((entry, index) => (
                          <Cell key={`income-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {categoryData.income.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatSEK(category.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No actual income transactions yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories (Actual Transactions Only)</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.expense.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="h-32 w-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.expense}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {categoryData.expense.map((entry, index) => (
                          <Cell key={`expense-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {categoryData.expense.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatSEK(category.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No actual expense transactions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editAmount">Amount (kr)</Label>
              <Input
                id="editAmount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Input
                id="editCategory"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editDate">Date</Label>
              <Input
                id="editDate"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>Are you sure you want to delete "{entryToDelete?.description}"?</p>
            {entryToDelete?.is_recurring && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> This is a recurring transaction. Deleting it will remove the original entry and stop all future recurring instances.
                </p>
              </div>
            )}
            {entryToDelete?.id?.includes('_recurring_') && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will delete the original recurring entry and stop all future instances.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}