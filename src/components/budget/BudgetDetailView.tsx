import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSEK } from '@/lib/currency';
import type { BudgetCategory, AnnualBudgetItem, BudgetTotals } from '@/types/budget';
import type { Database } from '@/lib/supabase';

type CashFlowEntry = Database['public']['Tables']['cash_flow_entries']['Row'];

interface BudgetDetailViewProps {
  categories: BudgetCategory[];
  annualItems: AnnualBudgetItem[];
  totals: BudgetTotals;
  getCurrentMonthName: () => string;
  getCurrentYear: () => string;
  getCategoryEntries: (categoryName: string, period: 'monthly' | 'yearly') => CashFlowEntry[];
}

export function BudgetDetailView({ 
  categories, 
  annualItems, 
  totals,
  getCurrentMonthName, 
  getCurrentYear, 
  getCategoryEntries 
}: BudgetDetailViewProps) {
  console.log('📋 Rendering DETAILED view');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Monthly Categories Detail */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            📅 Månadskategorier
          </CardTitle>
          <div className="text-sm text-blue-700 dark:text-blue-300 mt-2">
            Totalsumma: <span className="bg-blue-200/60 dark:bg-blue-800/60 px-2 py-1 rounded-md font-semibold text-blue-900 dark:text-blue-100 shadow-sm border border-blue-300/30 dark:border-blue-600/30">{formatSEK(totals.monthly.spent)}</span> / Budgeterat: {formatSEK(totals.monthly.budget)}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {categories.length > 0 ? categories.map((category, categoryIndex) => {
              const categoryEntries = getCategoryEntries(category.name, 'monthly');
              const totalSpent = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
              
              return (
                <div 
                  key={category.id} 
                  className="border-b last:border-b-0"
                  style={{ 
                    borderLeft: `6px solid ${category.color}`,
                    backgroundColor: `${category.color}08`
                  }}
                >
                  {/* Category Header */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded-lg shadow-sm" 
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{formatSEK(totalSpent)}</span> / {formatSEK(category.budgeted)} 
                          <span className="ml-2 text-xs">({categoryEntries.length} utgifter)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expense List - Compact Spreadsheet Style */}
                  <div className="bg-white dark:bg-gray-900">
                    {categoryEntries.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {categoryEntries.map((entry, entryIndex) => (
                          <div 
                            key={entry.id} 
                            className={`flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                              entryIndex % 2 === 0 ? 'bg-gray-25 dark:bg-gray-900' : 'bg-white dark:bg-gray-850'
                            }`}
                          >
                            <div className="flex-1 truncate pr-2">
                              <div className="text-sm font-medium truncate">{entry.description}</div>
                            </div>
                            <div className="text-sm font-semibold tabular-nums" style={{ color: category.color }}>
                              {formatSEK(entry.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        <p className="text-sm">Inga utgifter registrerade</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-base">Inga månadskategorier ännu</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Annual Items Detail */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            🎯 Årliga poster
          </CardTitle>
          <div className="text-sm text-purple-700 dark:text-purple-300 mt-2">
            Totalsumma: <span className="bg-purple-200/60 dark:bg-purple-800/60 px-2 py-1 rounded-md font-semibold text-purple-900 dark:text-purple-100 shadow-sm border border-purple-300/30 dark:border-purple-600/30">{formatSEK(totals.annual.spent)}</span> / Budgeterat: {formatSEK(totals.annual.budget)}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {annualItems.length > 0 ? annualItems.map((item, itemIndex) => {
              const itemEntries = getCategoryEntries(item.name, 'yearly');
              const totalSpent = itemEntries.reduce((sum, entry) => sum + entry.amount, 0);
              
              return (
                <div 
                  key={item.id} 
                  className="border-b last:border-b-0"
                  style={{ 
                    borderLeft: `6px solid ${item.color}`,
                    backgroundColor: `${item.color}08`
                  }}
                >
                  {/* Annual Item Header */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded-lg shadow-sm" 
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{formatSEK(totalSpent)}</span> / {formatSEK(item.budgeted)}
                          <span className="ml-2 text-xs">({itemEntries.length} utgifter)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Annual Expense List - Compact Spreadsheet Style */}
                  <div className="bg-white dark:bg-gray-900">
                    {itemEntries.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {itemEntries.map((entry, entryIndex) => (
                          <div 
                            key={entry.id} 
                            className={`flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                              entryIndex % 2 === 0 ? 'bg-gray-25 dark:bg-gray-900' : 'bg-white dark:bg-gray-850'
                            }`}
                          >
                            <div className="flex-1 truncate pr-2">
                              <div className="text-sm font-medium truncate">{entry.description}</div>
                            </div>
                            <div className="text-sm font-semibold tabular-nums" style={{ color: item.color }}>
                              {formatSEK(entry.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        <p className="text-sm">Inga utgifter registrerade</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-base">Inga årliga poster ännu</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}