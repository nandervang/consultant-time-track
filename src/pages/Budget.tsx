import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Plus } from 'lucide-react';
import { useBudgetLogic } from '../hooks/useBudgetLogic';
import { BudgetOverview } from '../components/budget/BudgetOverview';
import { BudgetDetailView } from '../components/budget/BudgetDetailView';
import { BudgetDialogs } from '../components/budget/BudgetDialogs';

interface BudgetPageProps {
  isDarkMode: boolean;
}

export default function BudgetPage({ isDarkMode }: BudgetPageProps) {
  const [isDetailedView, setIsDetailedView] = useState(false);
  const budgetLogic = useBudgetLogic();

  console.log('🔍 Budget component render - isDetailedView:', isDetailedView);

  if (budgetLogic.budgetsLoading) {
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

  // Dialog handlers
  const handleAddCategory = () => {
    (window as any).budgetDialogs?.openAddCategoryDialog();
  };

  const handleAddAnnualItem = () => {
    (window as any).budgetDialogs?.openAddAnnualItemDialog();
  };

  const handleViewDetails = (category: any) => {
    (window as any).budgetDialogs?.openDetailDialog(category);
  };

  const handleAddExpense = (category: any) => {
    (window as any).budgetDialogs?.openAddExpenseDialog(category);
  };

  const handleEditCategory = (category: any) => {
    (window as any).budgetDialogs?.openEditCategoryDialog(category);
  };

  const handleDeleteCategory = (category: any) => {
    (window as any).budgetDialogs?.openDeleteDialog(category);
  };

  const handleDeleteItem = (item: any) => {
    // Handle annual item deletion
    console.log('Delete annual item:', item);
  };

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
          <Button variant="outline" onClick={handleAddAnnualItem}>
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
        <BudgetOverview 
          {...budgetLogic}
          isDarkMode={isDarkMode}
          onViewDetails={handleViewDetails}
          onAddExpense={handleAddExpense}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onDeleteItem={handleDeleteItem}
          onAddCategory={handleAddCategory}
          onAddAnnualItem={handleAddAnnualItem}
        />
      ) : (
        <BudgetDetailView {...budgetLogic} />
      )}

      <BudgetDialogs {...budgetLogic} />
    </div>
  );
}