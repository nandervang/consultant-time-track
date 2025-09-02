import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import type { BudgetCategory, AnnualBudgetItem } from '@/types/budget';

interface BudgetDialogsProps {
  handleAddCategory: (name: string, budget: number) => Promise<boolean>;
  handleUpdateCategory: (categoryId: string, newBudget: number) => Promise<boolean>;
  handleDeleteCategory: (category: BudgetCategory) => Promise<boolean>;
  handleAddAnnualItem: (name: string, budget: number, targetDate: string) => Promise<boolean>;
  handleUpdateAnnualItem: (itemId: string, newBudget: number, newTargetDate?: string) => Promise<boolean>;
  handleDeleteAnnualItem: (item: AnnualBudgetItem) => Promise<boolean>;
  addEntry: (entry: any) => Promise<any>;
  deleteEntry: (id: string) => Promise<boolean>;
  getCategoryEntries: (categoryName: string, period: 'monthly' | 'yearly') => any[];
  toast: any;
  // New props for external state management
  showDetailDialog?: boolean;
  setShowDetailDialog?: (show: boolean) => void;
  showAddExpenseDialog?: boolean;
  setShowAddExpenseDialog?: (show: boolean) => void;
  showEditCategoryDialog?: boolean;
  setShowEditCategoryDialog?: (show: boolean) => void;
  showDeleteDialog?: boolean;
  setShowDeleteDialog?: (show: boolean) => void;
  showAddCategoryDialog?: boolean;
  setShowAddCategoryDialog?: (show: boolean) => void;
  selectedCategory?: BudgetCategory | null;
  setSelectedCategory?: (category: BudgetCategory | null) => void;
  selectedExpenseCategory?: BudgetCategory | AnnualBudgetItem | null;
  setSelectedExpenseCategory?: (category: BudgetCategory | AnnualBudgetItem | null) => void;
}

export function BudgetDialogs({
  handleAddCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleAddAnnualItem,
  handleUpdateAnnualItem,
  handleDeleteAnnualItem,
  addEntry,
  deleteEntry,
  getCategoryEntries,
  toast,
  // External state props
  showDetailDialog = false,
  setShowDetailDialog = () => {},
  showAddExpenseDialog = false,
  setShowAddExpenseDialog = () => {},
  showEditCategoryDialog = false,
  setShowEditCategoryDialog = () => {},
  showDeleteDialog = false,
  setShowDeleteDialog = () => {},
  showAddCategoryDialog = false,
  setShowAddCategoryDialog = () => {},
  selectedCategory = null,
  setSelectedCategory = () => {},
  selectedExpenseCategory = null,
  setSelectedExpenseCategory = () => {}
}: BudgetDialogsProps) {
  // Annual item dialog states (not managed externally yet)
  const [showAddAnnualItemDialog, setShowAddAnnualItemDialog] = useState(false);
  const [showEditAnnualItemDialog, setShowEditAnnualItemDialog] = useState(false);
  const [showDeleteAnnualDialog, setShowDeleteAnnualDialog] = useState(false);
  const [showAnnualDetailDialog, setShowAnnualDetailDialog] = useState(false);

  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<BudgetCategory | null>(null);

  // Form states - Annual Items
  const [newAnnualItemName, setNewAnnualItemName] = useState('');
  const [newAnnualItemBudget, setNewAnnualItemBudget] = useState('');
  const [newAnnualItemTargetDate, setNewAnnualItemTargetDate] = useState('');
  const [editingAnnualItem, setEditingAnnualItem] = useState<any>(null);
  const [annualItemToDelete, setAnnualItemToDelete] = useState<any>(null);
  const [detailAnnualItem, setDetailAnnualItem] = useState<any>(null);

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
    setSelectedExpenseCategory(category);
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setShowAddExpenseDialog(true);
  };

  // Annual item dialog handlers
  const openAddAnnualItemDialog = () => setShowAddAnnualItemDialog(true);
  const openEditAnnualItemDialog = (item: any) => {
    setEditingAnnualItem(item);
    setNewAnnualItemBudget(item.budgeted.toString());
    setShowEditAnnualItemDialog(true);
  };
  const openDeleteAnnualDialog = (item: any) => {
    setAnnualItemToDelete(item);
    setShowDeleteAnnualDialog(true);
  };
  const openAnnualDetailDialog = (item: any) => {
    setDetailAnnualItem(item);
    setShowAnnualDetailDialog(true);
  };

  const openDetailDialog = (category: BudgetCategory) => {
    setSelectedCategory(category);
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
    if (!selectedExpenseCategory || !expenseAmount || !expenseDescription) {
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
        category: selectedExpenseCategory.name,
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
      setSelectedExpenseCategory(null);
    } catch {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till utgift.",
        variant: "destructive"
      });
    }
  };

  // Form handlers - Annual Items
  const handleAddAnnualItemSubmit = async () => {
    if (!newAnnualItemName.trim()) {
      toast({
        title: "Fel",
        description: "Ange ett namn för årsposten.",
        variant: "destructive"
      });
      return;
    }

    if (!newAnnualItemTargetDate) {
      toast({
        title: "Fel",
        description: "Ange målmånad för årsposten.",
        variant: "destructive"
      });
      return;
    }

    const budget = parseFloat(newAnnualItemBudget) || 0;
    const success = await handleAddAnnualItem(newAnnualItemName.trim(), budget, newAnnualItemTargetDate);
    
    if (success) {
      setNewAnnualItemName('');
      setNewAnnualItemBudget('');
      setNewAnnualItemTargetDate('');
      setShowAddAnnualItemDialog(false);
    }
  };

  const handleEditAnnualItemSubmit = async () => {
    if (!editingAnnualItem) return;

    const newBudget = parseFloat(newAnnualItemBudget) || 0;
    const success = await handleUpdateAnnualItem(editingAnnualItem.id, newBudget);
    
    if (success) {
      setEditingAnnualItem(null);
      setNewAnnualItemBudget('');
      setShowEditAnnualItemDialog(false);
    }
  };

  const handleDeleteAnnualItemConfirm = async () => {
    if (!annualItemToDelete) return;

    const success = await handleDeleteAnnualItem(annualItemToDelete);
    
    if (success) {
      setAnnualItemToDelete(null);
      setShowDeleteAnnualDialog(false);
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
            <DialogTitle>Lägg till utgift - {selectedExpenseCategory?.name}</DialogTitle>
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

      {/* Add Annual Item Dialog */}
      <Dialog open={showAddAnnualItemDialog} onOpenChange={setShowAddAnnualItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till årspost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="annualItemName">Namn på årspost</Label>
              <Input
                id="annualItemName"
                value={newAnnualItemName}
                onChange={(e) => setNewAnnualItemName(e.target.value)}
                placeholder="t.ex. Semester, Julklappar"
              />
            </div>
            <div>
              <Label htmlFor="annualItemBudget">Budget (kr)</Label>
              <Input
                id="annualItemBudget"
                type="number"
                value={newAnnualItemBudget}
                onChange={(e) => setNewAnnualItemBudget(e.target.value)}
                placeholder="Totalt belopp för året"
              />
            </div>
            <div>
              <Label htmlFor="annualItemTargetDate">Målmånad</Label>
              <Input
                id="annualItemTargetDate"
                type="month"
                value={newAnnualItemTargetDate}
                onChange={(e) => setNewAnnualItemTargetDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddAnnualItemDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleAddAnnualItemSubmit}>
                Lägg till
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Annual Item Dialog */}
      <Dialog open={showEditAnnualItemDialog} onOpenChange={setShowEditAnnualItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera årspost: {editingAnnualItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editAnnualItemBudget">Budget (kr)</Label>
              <Input
                id="editAnnualItemBudget"
                type="number"
                value={newAnnualItemBudget}
                onChange={(e) => setNewAnnualItemBudget(e.target.value)}
                placeholder="Totalt belopp för året"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditAnnualItemDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleEditAnnualItemSubmit}>
                Spara
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Annual Item Dialog */}
      <Dialog open={showDeleteAnnualDialog} onOpenChange={setShowDeleteAnnualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort årspost</DialogTitle>
          </DialogHeader>
          <p>Är du säker på att du vill ta bort årsposten "{annualItemToDelete?.name}"?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteAnnualDialog(false)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={handleDeleteAnnualItemConfirm}>
              Ta bort
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Annual Item Detail Dialog */}
      <Dialog open={showAnnualDetailDialog} onOpenChange={setShowAnnualDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detaljer: {detailAnnualItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget</Label>
                <p className="text-lg font-semibold">{formatSEK(detailAnnualItem?.budgeted || 0)}</p>
              </div>
              <div>
                <Label>Spenderat</Label>
                <p className="text-lg font-semibold">{formatSEK(detailAnnualItem?.spent || 0)}</p>
              </div>
            </div>
            
            {/* Expenses list for annual item */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Utgifter för denna årspost</Label>
                <Button
                  size="sm"
                  onClick={() => openAddExpenseDialog(detailAnnualItem)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Lägg till
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detailAnnualItem && getCategoryEntries && getCategoryEntries(detailAnnualItem.name, 'yearly').map((entry: any) => (
                  <div key={entry.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatSEK(entry.amount)}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteEntry && deleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!detailAnnualItem || !getCategoryEntries || getCategoryEntries(detailAnnualItem.name, 'yearly').length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    Inga utgifter ännu
                  </p>
                )}
              </div>
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
          openDetailDialog,
          openAddAnnualItemDialog,
          openEditAnnualItemDialog,
          openDeleteAnnualDialog,
          openAnnualDetailDialog
        };
        return null;
      })()}
    </>
  );
}