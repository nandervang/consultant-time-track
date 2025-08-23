import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatSEK } from '@/lib/currency';
import type { BudgetCategory, AnnualBudgetItem } from '@/types/budget';

interface BudgetDialogsProps {
  handleAddCategory: (name: string, budget: number) => Promise<boolean>;
  handleUpdateCategory: (categoryId: string, newBudget: number) => Promise<boolean>;
  handleDeleteCategory: (category: BudgetCategory) => Promise<boolean>;
  addEntry: (entry: any) => Promise<any>;
  toast: any;
}

export function BudgetDialogs({
  handleAddCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  addEntry,
  toast
}: BudgetDialogsProps) {
  // Dialog states
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<BudgetCategory | null>(null);
  const [expenseCategory, setExpenseCategory] = useState<BudgetCategory | AnnualBudgetItem | null>(null);
  const [detailCategory, setDetailCategory] = useState<BudgetCategory | null>(null);

  // Expense form
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Dialog handlers
  const openAddCategoryDialog = () => setShowAddCategoryDialog(true);
  const openEditCategoryDialog = (category: BudgetCategory) => {
    setEditingCategory(category);
    setNewCategoryBudget(category.budgeted.toString());
    setShowEditCategoryDialog(true);
  };
  const openDeleteDialog = (category: BudgetCategory) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };
  const openAddExpenseDialog = (category: BudgetCategory | AnnualBudgetItem) => {
    setExpenseCategory(category);
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setShowAddExpenseDialog(true);
  };
  const openDetailDialog = (category: BudgetCategory) => {
    setDetailCategory(category);
    setShowDetailDialog(true);
  };

  // Form handlers
  const handleAddCategorySubmit = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Fel",
        description: "Ange ett namn för kategorin.",
        variant: "destructive"
      });
      return;
    }

    const budget = parseFloat(newCategoryBudget) || 0;
    const success = await handleAddCategory(newCategoryName.trim(), budget);
    
    if (success) {
      setNewCategoryName('');
      setNewCategoryBudget('');
      setShowAddCategoryDialog(false);
    }
  };

  const handleEditCategorySubmit = async () => {
    if (!editingCategory) return;

    const newBudget = parseFloat(newCategoryBudget) || 0;
    const success = await handleUpdateCategory(editingCategory.id, newBudget);
    
    if (success) {
      setEditingCategory(null);
      setNewCategoryBudget('');
      setShowEditCategoryDialog(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    const success = await handleDeleteCategory(categoryToDelete);
    
    if (success) {
      setCategoryToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleAddExpenseSubmit = async () => {
    if (!expenseCategory || !expenseAmount || !expenseDescription) {
      toast({
        title: "Fel",
        description: "Fyll i alla fält.",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (amount <= 0) {
      toast({
        title: "Fel",
        description: "Beloppet måste vara större än 0.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addEntry({
        type: 'expense',
        amount,
        description: expenseDescription,
        category: expenseCategory.name,
        date: expenseDate,
        is_recurring: false,
        is_budget_entry: false
      });

      toast({
        title: "Utgift tillagd",
        description: `${formatSEK(amount)} för ${expenseDescription}`,
      });

      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setShowAddExpenseDialog(false);
      setExpenseCategory(null);
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till utgift.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till månadskategori</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Kategorinamn</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="t.ex. Mat & Dryck"
              />
            </div>
            <div>
              <Label htmlFor="categoryBudget">Månadsbudget (kr)</Label>
              <Input
                id="categoryBudget"
                type="number"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                placeholder="0 = ingen automatisk budget"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleAddCategorySubmit}>
                Lägg till
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera kategori: {editingCategory?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCategoryBudget">Månadsbudget (kr)</Label>
              <Input
                id="editCategoryBudget"
                type="number"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditCategoryDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleEditCategorySubmit}>
                Spara
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort kategori</DialogTitle>
          </DialogHeader>
          <p>Är du säker på att du vill ta bort kategorin "{categoryToDelete?.name}"?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Ta bort
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={showAddExpenseDialog} onOpenChange={setShowAddExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till utgift - {expenseCategory?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expenseAmount">Belopp (kr)</Label>
              <Input
                id="expenseAmount"
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="expenseDescription">Beskrivning</Label>
              <Textarea
                id="expenseDescription"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Vad köpte du?"
              />
            </div>
            <div>
              <Label htmlFor="expenseDate">Datum</Label>
              <Input
                id="expenseDate"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddExpenseDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleAddExpenseSubmit}>
                Lägg till
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export dialog handlers for parent component */}
      {(() => {
        // Expose functions to parent
        (window as any).budgetDialogs = {
          openAddCategoryDialog,
          openEditCategoryDialog,
          openDeleteDialog,
          openAddExpenseDialog,
          openDetailDialog
        };
        return null;
      })()}
    </>
  );
}