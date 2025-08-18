import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Minus, 
  Calendar, 
  FileText,
  Users,
  PieChart,
  Settings
} from 'lucide-react';

export default function QuickActionsCard() {
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const quickActions = [
    {
      icon: Plus,
      label: 'Add Income',
      description: 'Log new income',
      color: 'green',
      action: () => setShowIncomeForm(true)
    },
    {
      icon: Minus,
      label: 'Add Expense',
      description: 'Record expense',
      color: 'red',
      action: () => setShowExpenseForm(true)
    },
    {
      icon: FileText,
      label: 'Create Invoice',
      description: 'Generate invoice',
      color: 'blue',
      action: () => console.log('Create invoice')
    },
    {
      icon: Users,
      label: 'New Client',
      description: 'Add client',
      color: 'purple',
      action: () => console.log('Add client')
    },
    {
      icon: Calendar,
      label: 'Schedule Meeting',
      description: 'Book appointment',
      color: 'orange',
      action: () => console.log('Schedule meeting')
    },
    {
      icon: PieChart,
      label: 'View Reports',
      description: 'Analytics',
      color: 'indigo',
      action: () => console.log('View reports')
    }
  ];

  const handleSubmitIncome = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle income submission
    setShowIncomeForm(false);
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle expense submission
    setShowExpenseForm(false);
  };

  if (showIncomeForm) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Add Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitIncome} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                className="text-lg font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input
                placeholder="Client payment, consulting, etc."
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select className="w-full p-2 border rounded text-sm" title="Income Category">
                <option>Client Payment</option>
                <option>Consulting</option>
                <option>Retainer</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm" className="flex-1">
                Add Income
              </Button>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={() => setShowIncomeForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (showExpenseForm) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Minus className="h-5 w-5 text-red-600" />
            Add Expense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitExpense} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                className="text-lg font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input
                placeholder="Software, office supplies, etc."
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select className="w-full p-2 border rounded text-sm" title="Expense Category">
                <option>Software</option>
                <option>Office</option>
                <option>Travel</option>
                <option>Marketing</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm" className="flex-1">
                Add Expense
              </Button>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={() => setShowExpenseForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            const colorClasses = {
              green: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400',
              red: 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400',
              blue: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400',
              purple: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400',
              orange: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-400',
              indigo: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
            };

            return (
              <button
                key={index}
                onClick={action.action}
                className={`p-3 rounded-lg text-left transition-colors ${colorClasses[action.color as keyof typeof colorClasses]}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <IconComponent className="h-5 w-5" />
                  <div className="text-xs font-medium text-center">{action.label}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground mb-2">Today's Summary</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Income:</span>
              <span className="font-medium text-green-600">+25,000 kr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expenses:</span>
              <span className="font-medium text-red-600">-4,500 kr</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
