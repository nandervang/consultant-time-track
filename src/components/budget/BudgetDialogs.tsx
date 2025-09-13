import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Receipt } from 'lucide-react';
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
  const [expensePaymentSource, setExpensePaymentSource] = useState('Privat utlägg');

  // Edit expense states
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [showEditExpenseDialog, setShowEditExpenseDialog] = useState(false);
  const [showDeleteExpenseDialog, setShowDeleteExpenseDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);

  // Sync selectedCategory with editingCategory when edit dialog opens
  useEffect(() => {
    if (showEditCategoryDialog && selectedCategory && !editingCategory) {
      setEditingCategory(selectedCategory);
      setNewCategoryBudget(selectedCategory.budgeted.toString());
    }
  }, [showEditCategoryDialog, selectedCategory, editingCategory]);

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
    setExpensePaymentSource('Privat utlägg');
    setShowAddExpenseDialog(true);
  };

  // Edit expense handler
  const openEditExpenseDialog = (expense: any) => {
    setEditingExpense(expense);
    setExpenseAmount(expense.amount.toString());
    setExpenseDescription(expense.description);
    setExpenseDate(expense.date);
    setExpensePaymentSource(expense.payment_source || 'Privat utlägg');
    setShowEditExpenseDialog(true);
  };

  // Delete expense handler
  const openDeleteExpenseDialog = (expense: any) => {
    setExpenseToDelete(expense);
    setShowDeleteExpenseDialog(true);
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

  // Get expenses for the selected category
  const getCategoryExpenses = () => {
    if (!selectedCategory) return [];
    return getCategoryEntries(selectedCategory.name, 'monthly');
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
      // Determine if this is a monthly or yearly budget category
      // Annual items have targetDate property, monthly categories don't
      const isYearlyCategory = 'targetDate' in selectedExpenseCategory;
      
      await addEntry({
        type: 'expense',
        amount,
        description: expenseDescription,
        category: selectedExpenseCategory.name,
        date: expenseDate,
        payment_source: expensePaymentSource,
        is_recurring: true,
        recurring_interval: isYearlyCategory ? 'yearly' : 'monthly',
        next_due_date: isYearlyCategory 
          ? new Date(new Date(expenseDate).getFullYear() + 1, new Date(expenseDate).getMonth(), new Date(expenseDate).getDate()).toISOString().split('T')[0]
          : new Date(new Date(expenseDate).getFullYear(), new Date(expenseDate).getMonth() + 1, new Date(expenseDate).getDate()).toISOString().split('T')[0],
        is_budget_entry: true,
        is_recurring_instance: false
      });

      toast({
        title: "Utgift tillagd",
        description: `${formatSEK(amount)} för ${expenseDescription}`,
      });

      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpensePaymentSource('Privat utlägg');
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

  const handleDeleteExpenseConfirm = async () => {
    if (!expenseToDelete) return;

    try {
      const success = await deleteEntry(expenseToDelete.id);
      if (success) {
        toast({
          title: "Utgift borttagen",
          description: `${expenseToDelete.description} har tagits bort`,
        });
        setExpenseToDelete(null);
        setShowDeleteExpenseDialog(false);
      }
    } catch {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort utgift.",
        variant: "destructive"
      });
    }
  };

  const handleEditExpenseSubmit = async () => {
    if (!editingExpense || !expenseAmount || !expenseDescription) {
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
      // For now, we'll delete the old expense and create a new one
      // In a real app, you'd want an updateEntry function
      await deleteEntry(editingExpense.id);
      await addEntry({
        type: 'expense',
        amount,
        description: expenseDescription,
        category: editingExpense.category,
        date: expenseDate,
        payment_source: expensePaymentSource,
        is_recurring: false,
        is_budget_entry: true
      });

      toast({
        title: "Utgift uppdaterad",
        description: `${expenseDescription} har uppdaterats`,
      });

      setEditingExpense(null);
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpensePaymentSource('Privat utlägg');
      setShowEditExpenseDialog(false);
    } catch {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera utgift.",
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
            <div>
              <Label htmlFor="expensePaymentSource">Betalningskälla</Label>
              <Select value={expensePaymentSource} onValueChange={setExpensePaymentSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj betalningskälla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Privat utlägg">Privat utlägg</SelectItem>
                  <SelectItem value="Mynt kortet">Mynt kortet</SelectItem>
                  <SelectItem value="Faktura">Faktura</SelectItem>
                  <SelectItem value="Annat">Annat</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Edit Expense Dialog */}
      <Dialog open={showEditExpenseDialog} onOpenChange={setShowEditExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera utgift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editExpenseAmount">Belopp (kr)</Label>
              <Input
                id="editExpenseAmount"
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="editExpenseDescription">Beskrivning</Label>
              <Textarea
                id="editExpenseDescription"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Vad köpte du?"
              />
            </div>
            <div>
              <Label htmlFor="editExpenseDate">Datum</Label>
              <Input
                id="editExpenseDate"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editExpensePaymentSource">Betalningskälla</Label>
              <Select value={expensePaymentSource} onValueChange={setExpensePaymentSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj betalningskälla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Privat utlägg">Privat utlägg</SelectItem>
                  <SelectItem value="Mynt kortet">Mynt kortet</SelectItem>
                  <SelectItem value="Faktura">Faktura</SelectItem>
                  <SelectItem value="Annat">Annat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditExpenseDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleEditExpenseSubmit}>
                Spara ändringar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Dialog */}
      <Dialog open={showDeleteExpenseDialog} onOpenChange={setShowDeleteExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort utgift</DialogTitle>
          </DialogHeader>
          <p>Är du säker på att du vill ta bort utgiften "{expenseToDelete?.description}"?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteExpenseDialog(false)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={handleDeleteExpenseConfirm}>
              Ta bort
            </Button>
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

      {/* Category Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              Detaljer för {selectedCategory?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {selectedCategory && (
              <>
                {/* Budget Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Budget denna månad</div>
                    <div className="text-lg font-semibold">{formatSEK(selectedCategory.budgeted)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Spenderat</div>
                    <div className="text-lg font-semibold">{formatSEK(selectedCategory.spent)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Kvar</div>
                    <div className={`text-lg font-semibold ${(selectedCategory.budgeted - selectedCategory.spent) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatSEK(selectedCategory.budgeted - selectedCategory.spent)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Procent använt</div>
                    <div className={`text-lg font-semibold ${(selectedCategory.spent / selectedCategory.budgeted * 100) > 100 ? 'text-red-600' : 'text-blue-600'}`}>
                      {((selectedCategory.spent / selectedCategory.budgeted) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {/* Expense List with Edit/Delete */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Utgifter i denna kategori</h3>
                    <Button onClick={() => {
                      setShowDetailDialog(false);
                      openAddExpenseDialog(selectedCategory);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ny utgift
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="text-left p-3 font-medium">Datum</th>
                          <th className="text-left p-3 font-medium">Beskrivning</th>
                          <th className="text-left p-3 font-medium">Betalningskälla</th>
                          <th className="text-right p-3 font-medium">Belopp</th>
                          <th className="text-center p-3 font-medium">Åtgärder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getCategoryExpenses().length > 0 ? (
                          getCategoryExpenses().map((expense) => (
                            <tr key={expense.id}>
                              <td className="p-3">{expense.date}</td>
                              <td className="p-3">{expense.description}</td>
                              <td className="p-3">{expense.payment_source || 'Okänd'}</td>
                              <td className="p-3 text-right font-medium">{formatSEK(expense.amount)}</td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditExpenseDialog(expense)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDeleteExpenseDialog(expense)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">
                              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>Inga utgifter ännu</p>
                              <p className="text-sm mt-1">
                                Klicka på "Ny utgift" för att lägga till en utgift
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Stäng
            </Button>
            {selectedCategory && (
              <Button onClick={() => {
                setShowDetailDialog(false);
                openAddExpenseDialog(selectedCategory);
              }}>
                Lägg till utgift
              </Button>
            )}
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