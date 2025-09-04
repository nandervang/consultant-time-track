import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Wallet, FileText, MoreHorizontal, Receipt } from 'lucide-react';
import { formatSEK } from '@/lib/currency';
import { useBudgetLogic } from '@/hooks/useBudgetLogic';

interface ExpenseEntry {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  payment_source?: string;
}

interface PaymentSourceData {
  source: string;
  count: number;
  totalAmount: number;
  expenses: ExpenseEntry[];
}

const paymentSourceIcons = {
  'Privat utlägg': Wallet,
  'Mynt kortet': CreditCard,
  'Faktura': FileText,
  'Annat': MoreHorizontal,
};

export function PaymentSourcesCard() {
  const { entries } = useBudgetLogic();
  const [selectedSource, setSelectedSource] = useState<PaymentSourceData | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Calculate payment source data
  const paymentSourceData = (): PaymentSourceData[] => {
    const sourceMap = new Map<string, { count: number; totalAmount: number; expenses: ExpenseEntry[] }>();
    
    entries
      .filter(entry => entry.type === 'expense' && !entry.is_budget_entry)
      .forEach(expense => {
        const source = (expense as any).payment_source || 'Okänd';
        if (!sourceMap.has(source)) {
          sourceMap.set(source, { count: 0, totalAmount: 0, expenses: [] });
        }
        const data = sourceMap.get(source)!;
        data.count += 1;
        data.totalAmount += expense.amount;
        data.expenses.push({
          id: expense.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expense.date,
          payment_source: (expense as any).payment_source,
        });
      });

    return Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      totalAmount: data.totalAmount,
      expenses: data.expenses,
    })).sort((a, b) => b.count - a.count);
  };

  const sources = paymentSourceData();

  const handleSourceClick = (sourceData: PaymentSourceData) => {
    setSelectedSource(sourceData);
    setShowModal(true);
  };

  const getIcon = (source: string) => {
    const IconComponent = paymentSourceIcons[source as keyof typeof paymentSourceIcons] || MoreHorizontal;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Betalningskällor</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sources.length > 0 ? (
              sources.map((sourceData) => (
                <div
                  key={sourceData.source}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => handleSourceClick(sourceData)}
                >
                  <div className="flex items-center space-x-3">
                    {getIcon(sourceData.source)}
                    <div>
                      <div className="font-medium">{sourceData.source}</div>
                      <div className="text-sm text-muted-foreground">
                        {sourceData.count} utgift{sourceData.count !== 1 ? 'er' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatSEK(sourceData.totalAmount)}</div>
                    <div className="text-sm text-muted-foreground">totalt</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Inga utgifter ännu</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Source Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {selectedSource && getIcon(selectedSource.source)}
              Utgifter från {selectedSource?.source}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {selectedSource && (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Antal utgifter</div>
                    <div className="text-lg font-semibold">{selectedSource.count}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Totalt belopp</div>
                    <div className="text-lg font-semibold">{formatSEK(selectedSource.totalAmount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Genomsnitt per utgift</div>
                    <div className="text-lg font-semibold">
                      {formatSEK(selectedSource.totalAmount / selectedSource.count)}
                    </div>
                  </div>
                </div>

                {/* Expense List */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left p-3 font-medium">Datum</th>
                        <th className="text-left p-3 font-medium">Beskrivning</th>
                        <th className="text-left p-3 font-medium">Kategori</th>
                        <th className="text-right p-3 font-medium">Belopp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedSource.expenses
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((expense) => (
                          <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-3">
                              {new Date(expense.date).toLocaleDateString('sv-SE')}
                            </td>
                            <td className="p-3">{expense.description}</td>
                            <td className="p-3">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                                {expense.category}
                              </span>
                            </td>
                            <td className="p-3 text-right font-medium">
                              {formatSEK(expense.amount)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Stäng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
