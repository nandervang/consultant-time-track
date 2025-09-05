import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Receipt, Edit, Trash2 } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import { ProgressBar } from '@/components/ProgressBar';
import type { BudgetCategory } from '@/types/budget';

interface MonthlyCategoriesProps {
  categories: BudgetCategory[];
  onViewDetails: (category: BudgetCategory) => void;
  onAddExpense: (category: BudgetCategory) => void;
  onEditCategory: (category: BudgetCategory) => void;
  onDeleteCategory: (category: BudgetCategory) => void;
}

export function MonthlyCategories({ 
  categories, 
  onViewDetails, 
  onAddExpense, 
  onEditCategory, 
  onDeleteCategory 
}: MonthlyCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget (månadsvis)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => {
            const percentage = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0;
            const isOverBudget = category.spent > category.budgeted;
            
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      data-color={category.color}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails(category)}
                      className="h-8"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detaljer
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAddExpense(category)}
                      className="h-8"
                      data-testid="add-expense-btn"
                    >
                      <Receipt className="h-4 w-4 mr-1" />
                      Lägg till
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => onEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => onDeleteCategory(category)}
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
                
                <ProgressBar percentage={percentage} isOverBudget={isOverBudget} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}