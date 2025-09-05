import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BudgetSummaryCards } from './BudgetSummaryCards';
import { BudgetCharts } from './BudgetCharts';
import { MonthlyCategories } from './MonthlyCategories';
import { AnnualItems } from './AnnualItems';
import { EmptyState } from './EmptyState';
import type { BudgetCategory, AnnualBudgetItem, BudgetTotals } from '@/types/budget';
import type { Database } from '@/lib/supabase';

type CashFlowEntry = Database['public']['Tables']['cash_flow_entries']['Row'];

interface BudgetOverviewProps {
  categories: BudgetCategory[];
  annualItems: AnnualBudgetItem[];
  totals: BudgetTotals;
  chartData: Array<{
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
  }>;
  pieData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  isDarkMode: boolean;
  getCurrentMonthName: () => string;
  getCurrentYear: () => string;
  getCategoryEntries?: (categoryName: string, period: 'monthly' | 'yearly') => CashFlowEntry[];
  onViewDetails: (category: BudgetCategory) => void;
  onAddExpense: (category: BudgetCategory | AnnualBudgetItem) => void;
  onEditCategory: (category: BudgetCategory) => void;
  onDeleteCategory: (category: BudgetCategory) => void;
  onDeleteItem: (item: AnnualBudgetItem) => void;
  onAddCategory: () => void;
  onAddAnnualItem: () => void;
  onViewAnnualDetails?: (item: AnnualBudgetItem) => void;
  onEditAnnualItem?: (item: AnnualBudgetItem) => void;
}

export function BudgetOverview({
  categories,
  annualItems,
  totals,
  chartData,
  pieData,
  isDarkMode,
  getCurrentMonthName,
  getCurrentYear,
  getCategoryEntries,
  onViewDetails,
  onAddExpense,
  onEditCategory,
  onDeleteCategory,
  onDeleteItem,
  onAddCategory,
  onAddAnnualItem,
  onViewAnnualDetails,
  onEditAnnualItem
}: BudgetOverviewProps) {
  console.log('📊 Rendering OVERVIEW');

  const hasData = categories.length > 0 || annualItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Current month indicator */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Spåra utgifter mot dina budgetmål
              </span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {categories.length} månadskategorier • {annualItems.length} årliga poster
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasData ? (
        <EmptyState onAddCategory={onAddCategory} onAddAnnualItem={onAddAnnualItem} />
      ) : (
        <>
          {/* Summary Cards */}
          <BudgetSummaryCards 
            totals={totals}
            getCurrentMonthName={getCurrentMonthName}
            getCurrentYear={getCurrentYear}
          />

          {/* Charts */}
          <BudgetCharts 
            chartData={chartData}
            pieData={pieData}
            annualItems={annualItems}
            isDarkMode={isDarkMode}
          />

          {/* Monthly Categories and Annual Items - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Categories */}
            {categories.length > 0 && (
              <div className="min-w-0">
                <MonthlyCategories
                  categories={categories}
                  onViewDetails={onViewDetails}
                  onAddExpense={onAddExpense}
                  onEditCategory={onEditCategory}
                  onDeleteCategory={onDeleteCategory}
                />
              </div>
            )}

            {/* Annual Items */}
            {annualItems.length > 0 && (
              <div className="min-w-0">
                <AnnualItems
                  annualItems={annualItems}
                  getCurrentYear={getCurrentYear}
                  onAddExpense={onAddExpense}
                  onDeleteItem={onDeleteItem}
                  onViewDetails={onViewAnnualDetails}
                  onEditItem={onEditAnnualItem}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}