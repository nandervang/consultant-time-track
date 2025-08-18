import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];

interface MonthlySettings {
  billing_percentage: number;
  absence_percentage: number;
}

export default function SimpleMonthlySettingsCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [settings, setSettings] = useState<MonthlySettings>({
    billing_percentage: 94,
    absence_percentage: 15
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load monthly-specific settings whenever the month changes
  useEffect(() => {
    const loadMonthlySettings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Always try to load month-specific settings first
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('monthly_settings')
          .select('billing_percentage, absence_percentage')
          .eq('user_id', user.id)
          .eq('year', currentDate.year)
          .eq('month', currentDate.month)
          .single();

        if (monthlyData && !monthlyError) {
          // Found monthly-specific settings for this exact month
          console.log(`Loading settings for ${currentDate.month}/${currentDate.year}:`, monthlyData);
          setSettings({
            billing_percentage: monthlyData.billing_percentage,
            absence_percentage: monthlyData.absence_percentage
          });
        } else {
          // No monthly settings for this month - load defaults but don't overwrite other months
          console.log(`No specific settings for ${currentDate.month}/${currentDate.year}, using defaults`);
          
          // Try to get defaults from user profile
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('debit_rate_monthly, absence_percentage')
            .eq('id', user.id)
            .single();

          if (profileData && !profileError) {
            setSettings({
              billing_percentage: profileData.debit_rate_monthly || 94,
              absence_percentage: profileData.absence_percentage || 15
            });
          } else {
            // Use system defaults
            setSettings({
              billing_percentage: 94,
              absence_percentage: 15
            });
          }
        }
      } catch (error) {
        console.error('Error loading monthly settings:', error);
        // Use system defaults on error
        setSettings({
          billing_percentage: 94,
          absence_percentage: 15
        });
      } finally {
        setLoading(false);
      }
    };

    loadMonthlySettings();
  }, [user, currentDate.year, currentDate.month]); // Load when month OR year changes

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
    if (!user) return;

    try {
      setSaving(true);
      console.log(`🔄 Saving settings for ${MONTH_NAMES[currentDate.month - 1]} ${currentDate.year}:`, {
        month: currentDate.month,
        year: currentDate.year,
        settings: settings
      });
      
      // Save to monthly_settings table for month-specific data
      const { error } = await supabase
        .from('monthly_settings')
        .upsert({
          user_id: user.id,
          year: currentDate.year,
          month: currentDate.month,
          billing_percentage: settings.billing_percentage,
          absence_percentage: settings.absence_percentage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,year,month'
        });

      if (error) throw error;

      console.log(`✅ Successfully saved settings for ${MONTH_NAMES[currentDate.month - 1]} ${currentDate.year}`);
      toast({
        title: "Sparade månadsspecifika inställningar",
        description: `Inställningar för ${MONTH_NAMES[currentDate.month - 1]} ${currentDate.year} har sparats`,
      });
    } catch (error) {
      console.error('Error saving monthly settings:', error);
      toast({
        title: "Fel vid sparande",
        description: error instanceof Error ? 
          `Databasfel: ${error.message}. Kontrollera att monthly_settings tabellen existerar.` : 
          "Kunde inte spara månadsspecifika inställningar.",
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
          Konfigurera debiteringsgrad och frånvaro per månad för noggrannare prognoser. Varje månad kan ha unika inställningar.
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
            <p className="text-sm text-muted-foreground">
              Månadsspecifika inställningar
            </p>
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
                  billing_percentage: parseFloat(e.target.value) >= 0 ? parseFloat(e.target.value) : 0 
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
                  absence_percentage: parseFloat(e.target.value) >= 0 ? parseFloat(e.target.value) : 0 
                }))}
              />
              <p className="text-sm text-muted-foreground">
                Förväntad frånvaro för denna månad (semester, sjukdom, etc.)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Beräkning för {MONTH_NAMES[currentDate.month - 1]}</h4>
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
            {saving ? 'Sparar...' : `Spara för ${MONTH_NAMES[currentDate.month - 1]}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
