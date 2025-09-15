import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import SimpleMonthlySettingsCard from '@/components/SimpleMonthlySettingsCard';
import { 
  Clock, 
  DollarSign, 
  User, 
  Building, 
  Palette,
  Save,
  Loader2,
  Settings2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { FortnoxConfigDialog } from '@/components/invoicing/FortnoxConfigDialog';
import { getStoredFortnoxConfig } from '@/lib/fortnox';

interface UserSettings {
  id: string;
  company_name: string;
  company_motto: string;
  hourly_rate: number;
  currency: string;
  timezone: string;
  // Time tracking specific settings
  debit_rate_monthly: number;
  absence_percentage: number;
  work_hours_per_day: number;
  work_days_per_week: number;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fortnoxDialogOpen, setFortnoxDialogOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    company_name: '',
    company_motto: '',
    hourly_rate: 500,
    currency: 'SEK',
    timezone: 'Europe/Stockholm',
    debit_rate_monthly: 0,
    absence_percentage: 15,
    work_hours_per_day: 8,
    work_days_per_week: 5
  });

  // Load user settings
  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          company_name: data.company_name || '',
          company_motto: data.company_motto || '',
          hourly_rate: data.hourly_rate || 500,
          currency: data.currency || 'SEK',
          timezone: data.timezone || 'Europe/Stockholm',
          // Default values for new fields - these might not exist in DB yet
          debit_rate_monthly: 0,
          absence_percentage: 15,
          work_hours_per_day: 8,
          work_days_per_week: 5
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda inställningar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          company_name: settings.company_name,
          company_motto: settings.company_motto,
          hourly_rate: settings.hourly_rate,
          currency: settings.currency,
          timezone: settings.timezone,
          debit_rate_monthly: settings.debit_rate_monthly,
          absence_percentage: settings.absence_percentage,
          work_hours_per_day: settings.work_hours_per_day,
          work_days_per_week: settings.work_days_per_week,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sparade inställningar",
        description: "Dina inställningar har uppdaterats",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara inställningar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserSettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar inställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inställningar</h1>
          <p className="text-muted-foreground">
            Hantera dina konto- och applikationsinställningar
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Spara ändringar
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="timetracking" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Tidrapportering
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Fakturering
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Preferenser
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Företagsinformation
              </CardTitle>
              <CardDescription>
                Grundläggande information om ditt företag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Företagsnamn</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Mitt Konsultföretag AB"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Valuta</Label>
                  <Input
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    placeholder="SEK"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_motto">Företagsmotto</Label>
                <Input
                  id="company_motto"
                  value={settings.company_motto}
                  onChange={(e) => handleInputChange('company_motto', e.target.value)}
                  placeholder="Bygger framtiden, ett projekt i taget."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tracking Settings */}
        <TabsContent value="timetracking" className="space-y-6">
          {/* Monthly Specific Settings */}
          <SimpleMonthlySettingsCard />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Grundinställningar för tidrapportering
              </CardTitle>
              <CardDescription>
                Standardinställningar som används som bas för månadsspecifika inställningar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Arbetstider</h4>
                  <div className="space-y-2">
                    <Label htmlFor="work_hours_per_day">Arbetstimmar per dag</Label>
                    <Input
                      id="work_hours_per_day"
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={settings.work_hours_per_day}
                      onChange={(e) => handleInputChange('work_hours_per_day', parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Standard arbetstimmar per arbetsdag
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work_days_per_week">Arbetsdagar per vecka</Label>
                    <Input
                      id="work_days_per_week"
                      type="number"
                      min="1"
                      max="7"
                      value={settings.work_days_per_week}
                      onChange={(e) => handleInputChange('work_days_per_week', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Antal arbetsdagar per vecka
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Ekonomiska inställningar</h4>
                  <div className="space-y-2">
                    <Label htmlFor="debit_rate_monthly">Debiteringsgrad (%)</Label>
                    <Input
                      id="debit_rate_monthly"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={settings.debit_rate_monthly}
                      onChange={(e) => handleInputChange('debit_rate_monthly', parseFloat(e.target.value))}
                      placeholder="94"
                    />
                    <p className="text-sm text-muted-foreground">
                      Procent av arbetstimmar som faktiskt debiteras (t.ex. 94% av 170h = 160h)
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
                      onChange={(e) => handleInputChange('absence_percentage', parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Uppskattad procent av frånvaro (semester, sjukdom, etc.)
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Beräkningsexempel</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Arbetstimmar per månad: {Math.round(settings.work_hours_per_day * settings.work_days_per_week * 4.33)} timmar</p>
                  <p>• Effektiva timmar (efter frånvaro): {Math.round((settings.work_hours_per_day * settings.work_days_per_week * 4.33) * (1 - settings.absence_percentage / 100))} timmar</p>
                  <p>• Debiterbara timmar ({settings.debit_rate_monthly}%): {Math.round((settings.work_hours_per_day * settings.work_days_per_week * 4.33) * (1 - settings.absence_percentage / 100) * (settings.debit_rate_monthly / 100))} timmar</p>
                  {settings.hourly_rate > 0 && (
                    <p>• Uppskattad månadsomsättning: {Math.round((settings.work_hours_per_day * settings.work_days_per_week * 4.33) * (1 - settings.absence_percentage / 100) * (settings.debit_rate_monthly / 100) * settings.hourly_rate).toLocaleString('sv-SE')} SEK</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Faktureringsinställningar
              </CardTitle>
              <CardDescription>
                Inställningar för priser och fakturering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Timpris (SEK)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  min="0"
                  step="50"
                  value={settings.hourly_rate}
                  onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Ditt standardtimpris för konsultarbete
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fortnox Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Fortnox Integration
              </CardTitle>
              <CardDescription>
                Konfigurera Fortnox API för att exportera fakturor direkt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Fortnox API</h4>
                    {getStoredFortnoxConfig() ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        Konfigurerad
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        Inte konfigurerad
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getStoredFortnoxConfig() 
                      ? 'Du kan nu exportera fakturor direkt till Fortnox.'
                      : 'Ställ in dina API-uppgifter för att aktivera Fortnox-export.'
                    }
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setFortnoxDialogOpen(true)}
                >
                  {getStoredFortnoxConfig() ? 'Hantera' : 'Konfigurera'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Applikationspreferenser
              </CardTitle>
              <CardDescription>
                Anpassa applikationens utseende och beteende
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Tidszon</Label>
                <Input
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  placeholder="Europe/Stockholm"
                />
                <p className="text-sm text-muted-foreground">
                  Din lokala tidszon för tiddisplay
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fortnox Configuration Dialog */}
      <FortnoxConfigDialog
        open={fortnoxDialogOpen}
        onOpenChange={setFortnoxDialogOpen}
      />
    </div>
  );
}
