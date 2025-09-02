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

  // Dialog states
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddAnnualItemDialog, setShowAddAnnualItemDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Selected items for dialogs
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<any>(null);

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
    setShowAddCategoryDialog(true);
  };

  const handleAddAnnualItem = () => {
    setShowAddAnnualItemDialog(true);
  };

  const handleViewDetails = (category: any) => {
    setSelectedCategory(category);
    setShowDetailDialog(true);
  };

  const handleAddExpense = (category: any) => {
    setSelectedExpenseCategory(category);
    setShowAddExpenseDialog(true);
  };

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    setShowEditCategoryDialog(true);
  };

  const handleDeleteCategory = (category: any) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const handleViewAnnualDetails = (item: any) => {
    (window as any).budgetDialogs?.openAnnualDetailDialog(item);
  };

  const handleEditAnnualItem = (item: any) => {
    (window as any).budgetDialogs?.openEditAnnualItemDialog(item);
  };

  const handleDeleteAnnualItem = (item: any) => {
    (window as any).budgetDialogs?.openDeleteAnnualDialog(item);
  };

  const handleDeleteItem = (item: any) => {
    // This will be passed to BudgetOverview for onDeleteItem prop
    handleDeleteAnnualItem(item);
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
          onViewAnnualDetails={handleViewAnnualDetails}
          onEditAnnualItem={handleEditAnnualItem}
        />
      ) : (
        <BudgetDetailView {...budgetLogic} />
      )}

      <BudgetDialogs 
        {...budgetLogic}
        deleteEntry={budgetLogic.deleteEntry}
        getCategoryEntries={budgetLogic.getCategoryEntries}
        showDetailDialog={showDetailDialog}
        setShowDetailDialog={setShowDetailDialog}
        showAddExpenseDialog={showAddExpenseDialog}
        setShowAddExpenseDialog={setShowAddExpenseDialog}
        showEditCategoryDialog={showEditCategoryDialog}
        setShowEditCategoryDialog={setShowEditCategoryDialog}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        showAddCategoryDialog={showAddCategoryDialog}
        setShowAddCategoryDialog={setShowAddCategoryDialog}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedExpenseCategory={selectedExpenseCategory}
        setSelectedExpenseCategory={setSelectedExpenseCategory}
      />
    </div>
  );
}