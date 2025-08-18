import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthlySettings, MonthlySettings } from '@/hooks/useMonthlySettings';
import { useToast } from '@/hooks/use-toast';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];

export default function MonthlySettingsCard() {
  const { toast } = useToast();
  const { getMonthSettings, upsertMonthSettings, loading } = useMonthlySettings();
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [settings, setSettings] = useState<Omit<MonthlySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    year: currentDate.year,
    month: currentDate.month,
    billing_percentage: 94,
    absence_percentage: 15
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const monthSettings = getMonthSettings(currentDate.year, currentDate.month);
    if (monthSettings) {
      setSettings({
        year: monthSettings.year,
        month: monthSettings.month,
        billing_percentage: monthSettings.billing_percentage,
        absence_percentage: monthSettings.absence_percentage
      });
    } else {
      setSettings({
        year: currentDate.year,
        month: currentDate.month,
        billing_percentage: 94,
        absence_percentage: 15
      });
    }
  }, [currentDate, getMonthSettings]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      let newMonth = prev.month + (direction === 'next' ? 1 : -1);
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }

      return { year: newYear, month: newMonth };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('Attempting to save monthly settings:', settings);
      await upsertMonthSettings(settings);
      toast({
        title: "Sparade inställningar",
        description: `Inställningar för ${MONTH_NAMES[settings.month - 1]} ${settings.year} har uppdaterats`,
      });
    } catch (error) {
      console.error('Error saving monthly settings:', error);
      toast({
        title: "Fel vid sparande",
        description: error instanceof Error ? error.message : "Kunde inte spara månadsspecifika inställningar. Kontrollera att databasen är korrekt konfigurerad.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const workHoursPerMonth = 8 * 5 * 4.33; // Approximate hours per month
  const effectiveHours = Math.round(workHoursPerMonth * (1 - settings.absence_percentage / 100));
  const billableHours = Math.round(effectiveHours * (settings.billing_percentage / 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Månadsspecifika inställningar
        </CardTitle>
        <CardDescription>
          Konfigurera debiteringsgrad och frånvaro per månad för noggrannare prognoser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="font-semibold text-lg">
              {MONTH_NAMES[currentDate.month - 1]} {currentDate.year}
            </h3>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billing_percentage">Debiteringsgrad (%)</Label>
              <Input
                id="billing_percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                value={settings.billing_percentage}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  billing_percentage: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-sm text-muted-foreground">
                Procent av arbetstimmar som faktiskt debiteras denna månad
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="absence_percentage">Frånvaroprocent (%)</Label>
              <Input
                id="absence_percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                value={settings.absence_percentage}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  absence_percentage: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-sm text-muted-foreground">
                Förväntad frånvaro för denna månad (semester, sjukdom, etc.)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Beräkning för denna månad</h4>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <p>• Arbetstimmar: {Math.round(workHoursPerMonth)} timmar</p>
              <p>• Efter frånvaro ({settings.absence_percentage}%): {effectiveHours} timmar</p>
              <p>• Debiterbara timmar ({settings.billing_percentage}%): {billableHours} timmar</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sparar...' : 'Spara inställningar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
