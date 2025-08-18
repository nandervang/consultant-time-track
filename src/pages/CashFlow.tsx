import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  Plus,
  Filter,
  Download
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

interface CashFlowPageProps {
  isDarkMode: boolean;
}

interface CashFlowEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  recurring?: boolean;
  nextDue?: string;
}

interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
  netFlow: number;
  cumulativeBalance: number;
}

export default function CashFlowPage({ isDarkMode }: CashFlowPageProps) {
  const { user } = useAuth();
  const { entries, loading, addEntry, getCashFlowSummary, getEntriesByCategory } = useCashFlow(user?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('income');

  // Process entries for charts
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [expenseCategories, setExpenseCategories] = useState<Array<{name: string, value: number, color: string}>>([]);

  useEffect(() => {
    if (entries.length > 0) {
      // Group entries by month
      const monthlyData = entries.reduce((acc, entry) => {
        const month = new Date(entry.date).toLocaleDateString('en-US', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { month, income: 0, expenses: 0, netFlow: 0, cumulativeBalance: 0 };
        }
        
        if (entry.type === 'income') {
          acc[month].income += entry.amount;
        } else {
          acc[month].expenses += entry.amount;
        }
        
        acc[month].netFlow = acc[month].income - acc[month].expenses;
        return acc;
      }, {} as Record<string, CashFlowData>);

      // Calculate cumulative balance
      let runningBalance = 50000; // Starting balance
      const sortedData = Object.values(monthlyData).sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

      sortedData.forEach(month => {
        runningBalance += month.netFlow;
        month.cumulativeBalance = runningBalance;
      });

      setCashFlowData(sortedData);

      // Get category data
      getEntriesByCategory('income').then(data => {
        const colors = ['#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#dc2626'];
        setIncomeCategories(data.map((item, index) => ({
          name: item.category,
          value: item.amount,
          color: colors[index % colors.length]
        })));
      });

      getEntriesByCategory('expense').then(data => {
        const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];
        setExpenseCategories(data.map((item, index) => ({
          name: item.category,
          value: item.amount,
          color: colors[index % colors.length]
        })));
      });
    }
  }, [entries, getEntriesByCategory]);

  const handleAddTransaction = async (formData: FormData) => {
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;

    if (amount && description && category) {
      await addEntry({
        type: formType,
        amount,
        description,
        category,
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading cash flow data...</div>
      </div>
    );
  }

  const currentMonth = cashFlowData[cashFlowData.length - 1] || { 
    month: 'Current', 
    income: 0, 
    expenses: 0, 
    netFlow: 0, 
    cumulativeBalance: 50000 
  };
  const previousMonth = cashFlowData[cashFlowData.length - 2] || currentMonth;
  const netFlowChange = currentMonth.netFlow - previousMonth.netFlow;
  const netFlowChangePercent = previousMonth.netFlow !== 0 ? (netFlowChange / previousMonth.netFlow) * 100 : 0;

  // Calculate projections for next 3 months
  const averageIncome = cashFlowData.reduce((sum, month) => sum + month.income, 0) / cashFlowData.length;
  const averageExpenses = cashFlowData.reduce((sum, month) => sum + month.expenses, 0) / cashFlowData.length;
  const averageNetFlow = averageIncome - averageExpenses;

  const projections = [
    {
      month: 'Jul',
      income: averageIncome * 1.05,
      expenses: averageExpenses * 1.02,
      netFlow: (averageIncome * 1.05) - (averageExpenses * 1.02),
      cumulativeBalance: currentMonth.cumulativeBalance + ((averageIncome * 1.05) - (averageExpenses * 1.02)),
      isProjection: true
    },
    {
      month: 'Aug',
      income: averageIncome * 1.03,
      expenses: averageExpenses * 1.03,
      netFlow: (averageIncome * 1.03) - (averageExpenses * 1.03),
      cumulativeBalance: currentMonth.cumulativeBalance + ((averageIncome * 1.05) - (averageExpenses * 1.02)) + ((averageIncome * 1.03) - (averageExpenses * 1.03)),
      isProjection: true
    },
    {
      month: 'Sep',
      income: averageIncome * 1.08,
      expenses: averageExpenses * 1.04,
      netFlow: (averageIncome * 1.08) - (averageExpenses * 1.04),
      cumulativeBalance: currentMonth.cumulativeBalance + ((averageIncome * 1.05) - (averageExpenses * 1.02)) + ((averageIncome * 1.03) - (averageExpenses * 1.03)) + ((averageIncome * 1.08) - (averageExpenses * 1.04)),
      isProjection: true
    }
  ];

  const allData = [...cashFlowData, ...projections];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow Analysis</h1>
          <p className="text-muted-foreground">
            Monitor your income and expenses flow
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
          <Button>
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
            <form action={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select 
                    value={formType} 
                    onChange={(e) => setFormType(e.target.value as 'income' | 'expense')}
                    className="w-full p-2 border rounded"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <input 
                    type="number" 
                    name="amount" 
                    placeholder="0.00" 
                    step="0.01"
                    className="w-full p-2 border rounded" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select name="category" className="w-full p-2 border rounded" required>
                    {formType === 'income' ? (
                      <>
                        <option value="Client Payment">Client Payment</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Retainer">Retainer</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Software">Software</option>
                        <option value="Office">Office</option>
                        <option value="Travel">Travel</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <input 
                  type="text" 
                  name="description" 
                  placeholder="Description of transaction"
                  className="w-full p-2 border rounded" 
                  required 
                />
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

      {!showAddForm && (
        <div className="flex gap-2 mb-6">
          <Button onClick={() => { setFormType('income'); setShowAddForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
          <Button variant="outline" onClick={() => { setFormType('expense'); setShowAddForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSEK(currentMonth.cumulativeBalance)}</div>
            <p className="text-xs text-muted-foreground">As of {currentMonth.month}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSEK(currentMonth.income)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSEK(currentMonth.expenses)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {netFlowChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              Net Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonth.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatSEK(currentMonth.netFlow)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {netFlowChange >= 0 ? '+' : ''}{netFlowChangePercent.toFixed(1)}% vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Trend & Projections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={allData}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
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
                    strokeDasharray={(entry: any) => entry?.isProjection ? "5 5" : "0"}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                    name="Net Flow"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeBalance" 
                    stroke="#16a34a" 
                    strokeWidth={2}
                    strokeDasharray={(entry: any) => entry?.isProjection ? "5 5" : "0"}
                    dot={{ fill: '#16a34a', strokeWidth: 2, r: 3 }}
                    name="Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dashed lines indicate projections based on historical data
            </p>
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
                <AreaChart data={cashFlowData}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
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
                    name="Income"
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

      {/* Income and Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      dataKey="value"
                    >
                      {incomeCategories.map((entry, index) => (
                        <Cell key={`income-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {incomeCategories.map((category, index) => (
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`expense-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {expenseCategories.map((category, index) => (
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      {transaction.is_recurring && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Recurring</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatSEK(transaction.amount)}
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet. Add your first transaction above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Cash Flow Insights & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Positive Trend</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                Your cash flow has improved by {Math.abs(netFlowChangePercent).toFixed(1)}% compared to last month.
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Upcoming Payments</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                You have 3 recurring payments totaling 12,470 kr due in the next 7 days.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Budget Optimization</span>
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                Consider reviewing your software subscriptions - they account for 24% of monthly expenses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
