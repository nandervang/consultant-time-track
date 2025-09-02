import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddCategory: () => void;
  onAddAnnualItem: () => void;
}

export function EmptyState({ onAddCategory, onAddAnnualItem }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Ingen budget än</h3>
        <p className="text-muted-foreground mb-4">
          Skapa din första budgetkategori eller årliga post för att börja spåra utgifter
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4 text-sm">
          <p className="font-medium mb-2">💡 Så fungerar det:</p>
          <ul className="text-left space-y-1 text-muted-foreground">
            <li>• <strong>Månadskategorier:</strong> Återkommande utgifter (mat, transport, hyra)</li>
            <li>• <strong>Årliga poster:</strong> Engångsutgifter (konferenser, utrustning, resor)</li>
            <li>• Allt syns automatiskt i Cash Flow för helhetsbild</li>
          </ul>
        </div>
        <div className="flex gap-2 justify-center mt-4">
          <Button variant="outline" onClick={onAddAnnualItem}>
            <Plus className="h-4 w-4 mr-2" />
            Årlig post
          </Button>
          <Button onClick={onAddCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Månadskategori
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}