import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Receipt, Trash2 } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import { ProgressBar } from '@/components/ProgressBar';
import type { AnnualBudgetItem } from '@/types/budget';

interface AnnualItemsProps {
  annualItems: AnnualBudgetItem[];
  getCurrentYear: () => string;
  onAddExpense: (item: AnnualBudgetItem) => void;
  onDeleteItem: (item: AnnualBudgetItem) => void;
  onViewDetails?: (item: AnnualBudgetItem) => void;
  onEditItem?: (item: AnnualBudgetItem) => void;
}

export function AnnualItems({ 
  annualItems, 
  getCurrentYear, 
  onAddExpense, 
  onDeleteItem,
  onViewDetails,
  onEditItem
}: AnnualItemsProps) {
  if (annualItems.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Budget (årsbas)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {annualItems.map((item) => {
            const percentage = item.budgeted > 0 ? (item.spent / item.budgeted) * 100 : 0;
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
                    {onViewDetails && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewDetails(item)}
                        className="h-8"
                      >
                        Detaljer
                      </Button>
                    )}
                    {onEditItem && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditItem(item)}
                        className="h-8"
                      >
                        Redigera
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAddExpense(item)}
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
                      onClick={() => onDeleteItem(item)}
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
                
                <ProgressBar 
                  percentage={percentage} 
                  isOverBudget={false}
                  className={isCompleted ? 'bg-green-100' : isOverdue ? 'bg-red-100' : ''}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}