import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import SimpleMonthlySettingsCard from '@/components/SimpleMonthlySettingsCard';
import { 
  Clock, 
  User, 
  Building, 
  Save,
  Loader2,
  Settings2,
  Calculator,
  Receipt
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useVatCalculations } from '@/hooks/useVatCalculations';
import { FortnoxConfigDialog } from '@/components/invoicing/FortnoxConfigDialog';

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
  // Tax and VAT settings
  auto_generate_employer_tax?: boolean;
  employer_tax_payment_date?: number;
  auto_generate_yearly_vat?: boolean;
  vat_rate_income?: number;
  vat_rate_expenses?: number;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { processYearlyVat, refetch: refetchVatSettings } = useVatCalculations(user?.id || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fortnoxDialogOpen, setFortnoxDialogOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    company_name: '',
    company_motto: '',
    hourly_rate: 99, // Temporarily reduced to test precision constraint  
    currency: 'SEK',
    timezone: 'Europe/Stockholm',
    debit_rate_monthly: 99, // Temporarily reduced to test precision constraint
    absence_percentage: 5,
    work_hours_per_day: 8,
    work_days_per_week: 5,
    auto_generate_employer_tax: false,
    employer_tax_payment_date: 12,
    auto_generate_yearly_vat: false,
    vat_rate_income: 25,
    vat_rate_expenses: 25,
  });

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔍 Fetching settings for user:', user.id);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching settings:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Settings loaded:', {
          auto_generate_employer_tax: data.auto_generate_employer_tax,
          auto_generate_yearly_vat: data.auto_generate_yearly_vat,
          vat_rate_income: data.vat_rate_income
        });
        setSettings({
          id: data.id,
          company_name: data.company_name || '',
          company_motto: data.company_motto || '',
          hourly_rate: data.hourly_rate || 500,
          currency: data.currency || 'SEK',
          timezone: data.timezone || 'Europe/Stockholm',
          debit_rate_monthly: data.debit_rate_monthly || 10000,
          absence_percentage: data.absence_percentage || 5,
          work_hours_per_day: data.work_hours_per_day || 8,
          work_days_per_week: data.work_days_per_week || 5,
          auto_generate_employer_tax: data.auto_generate_employer_tax || false,
          employer_tax_payment_date: data.employer_tax_payment_date || 12,
          auto_generate_yearly_vat: data.auto_generate_yearly_vat || false,
          vat_rate_income: data.vat_rate_income || 25,
          vat_rate_expenses: data.vat_rate_expenses || 25,
        });
      } else {
        // Create new profile if doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            company_name: '',
            company_motto: '',
            hourly_rate: 500,
            currency: 'SEK',
            timezone: 'Europe/Stockholm',
            debit_rate_monthly: 10000,
            absence_percentage: 5,
            work_hours_per_day: 8,
            work_days_per_week: 5,
            auto_generate_employer_tax: false,
            employer_tax_payment_date: 12,
            auto_generate_yearly_vat: false,
            vat_rate_income: 25,
            vat_rate_expenses: 25,
          })
          .select()
          .single();

        if (createError) throw createError;

        if (newProfile) {
          setSettings({
            id: newProfile.id,
            company_name: newProfile.company_name || '',
            company_motto: newProfile.company_motto || '',
            hourly_rate: newProfile.hourly_rate || 500,
            currency: newProfile.currency || 'SEK',
            timezone: newProfile.timezone || 'Europe/Stockholm',
            debit_rate_monthly: newProfile.debit_rate_monthly || 10000,
            absence_percentage: newProfile.absence_percentage || 5,
            work_hours_per_day: newProfile.work_hours_per_day || 8,
            work_days_per_week: newProfile.work_days_per_week || 5,
            auto_generate_employer_tax: newProfile.auto_generate_employer_tax || false,
            employer_tax_payment_date: newProfile.employer_tax_payment_date || 12,
            auto_generate_yearly_vat: newProfile.auto_generate_yearly_vat || false,
            vat_rate_income: newProfile.vat_rate_income || 25,
            vat_rate_expenses: newProfile.vat_rate_expenses || 25,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const processEmployerTaxForExistingSalaries = async () => {
    if (!user?.id) {
      console.error('❌ No user ID available for employer tax processing');
      return;
    }

    try {
      console.log('🏢 Processing employer tax for existing salary cash flow entries...');
      
      // Get all salary entries from cash flow that don't have employer tax yet
      const { data: salaryEntries, error } = await supabase
        .from('cash_flow_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .eq('category', 'Salary')
        .gt('amount', 0) // Only process salaries with amount > 0
        .order('date', { ascending: true });

      if (error) throw error;

      console.log(`📋 Found ${salaryEntries?.length || 0} salary entries to process`);

      let createdCount = 0;
      const paymentDay = settings.employer_tax_payment_date || 25;

      for (const salaryEntry of salaryEntries || []) {
        // Calculate employer tax (31.42% of salary)
        const employerTaxAmount = Math.round(salaryEntry.amount * 0.3142);
        
        // Parse the salary date and add one month for employer tax payment
        const salaryDate = new Date(salaryEntry.date);
        const taxYear = salaryDate.getFullYear();
        let taxMonth = salaryDate.getMonth() + 1; // Add 1 month (0-indexed)
        
        // Handle year rollover
        if (taxMonth > 11) {
          taxMonth = 0;
          salaryDate.setFullYear(taxYear + 1);
        }
        
        // Create employer tax payment date (25th of following month, or user's preferred day)
        const taxPaymentDate = new Date(taxYear + (taxMonth > 11 ? 1 : 0), taxMonth, Math.min(paymentDay, 28));
        const taxDateString = taxPaymentDate.toISOString().split('T')[0];

        // Check if employer tax entry already exists for this salary+date combination
        const { data: existingTax } = await supabase
          .from('cash_flow_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('category', 'Employer Tax')
          .eq('date', taxDateString)
          .like('description', `%${salaryEntry.description}%`)
          .single();

        if (existingTax) {
          console.log(`⏭️ Employer tax already exists for ${salaryEntry.description} on ${taxDateString}`);
          continue;
        }

        // Create employer tax entry
        const { error: insertError } = await supabase
          .from('cash_flow_entries')
          .insert([{
            user_id: user.id,
            type: 'expense',
            amount: employerTaxAmount,
            description: `Employer Tax - ${salaryEntry.description.replace('Salary - ', '')}`,
            category: 'Employer Tax',
            date: taxDateString,
            is_recurring: false,
            is_budget_entry: false,
            is_recurring_instance: false,
            vat_amount: 0,
            amount_excluding_vat: employerTaxAmount,
            vat_rate: 0
          }]);

        if (insertError) {
          console.error('❌ Error creating employer tax entry:', insertError);
        } else {
          console.log(`✅ Created employer tax entry: ${employerTaxAmount} SEK for ${salaryEntry.description} (due ${taxDateString})`);
          createdCount++;
        }
      }

      toast({
        title: "Employer Tax Processing Complete",
        description: `Created ${createdCount} employer tax entries for existing salary payments`,
      });

      console.log(`✅ Successfully processed employer tax: ${createdCount} entries created`);
    } catch (error) {
      console.error('❌ Error processing employer tax for existing salaries:', error);
      toast({
        title: "Employer Tax Processing Error",
        description: "Failed to process employer tax for existing salaries. Please try again.",
        variant: "destructive"
      });
    }
  };

  const processVatAutomatically = async () => {
    if (!user?.id) {
      console.error('❌ No user ID available for VAT processing');
      return;
    }

    try {
      console.log('🚀 Auto-processing VAT for multiple years...');
      console.log('🔧 processYearlyVat function available:', typeof processYearlyVat);
      
      // Force a refresh of VAT settings first
      console.log('🔄 Refreshing VAT settings before processing...');
      if (refetchVatSettings) {
        await refetchVatSettings();
        console.log('✅ VAT settings refreshed');
      }
      
      // Small delay to ensure settings are updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Process VAT for both 2024 and 2025
      console.log('📊 Processing VAT for 2024...');
      const result2024 = await processYearlyVat(2024);
      console.log('2024 result:', result2024);
      
      console.log('📊 Processing VAT for 2025...');
      const result2025 = await processYearlyVat(2025);
      console.log('2025 result:', result2025);
      
      if (result2024 || result2025) {
        toast({
          title: "VAT Processing Complete",
          description: `Yearly VAT calculations have been created for ${result2024 ? '2024' : ''}${result2024 && result2025 ? ' and ' : ''}${result2025 ? '2025' : ''}`,
        });
      } else {
        toast({
          title: "VAT Processing Info",
          description: "No VAT entries were created. Check if you have income or expenses for the selected years.",
        });
      }

      console.log('✅ Successfully processed VAT for multiple years');
    } catch (error) {
      console.error('❌ Error auto-processing VAT:', error);
      toast({
        title: "VAT Processing Error",
        description: "Failed to process VAT calculations. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cleanupVatEntries = async () => {
    if (!user?.id) return;

    try {
      console.log('🧹 Cleaning up existing VAT entries...');
      
      // Delete all MOMS tax entries for all years
      const { error } = await supabase
        .from('cash_flow_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('category', 'MOMS Tax');

      if (error) throw error;

      toast({
        title: "VAT Disabled",
        description: "All VAT payment entries have been removed from cash flow",
      });

      console.log('✅ Successfully removed all VAT entries');
    } catch (error) {
      console.error('Error cleaning up VAT entries:', error);
      toast({
        title: "Error",
        description: "Failed to remove VAT entries. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cleanupEmployerTaxEntries = async () => {
    if (!user?.id) return;

    try {
      console.log('🧹 Cleaning up existing employer tax entries...');
      
      // Delete all employer tax entries
      const { error } = await supabase
        .from('cash_flow_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('category', 'Employer Tax');

      if (error) throw error;

      toast({
        title: "Employer Tax Disabled",
        description: "All employer tax entries have been removed from cash flow",
      });

      console.log('✅ Successfully removed all employer tax entries');
    } catch (error) {
      console.error('Error cleaning up employer tax entries:', error);
      toast({
        title: "Error",
        description: "Failed to remove employer tax entries. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = async (field: keyof UserSettings, value: string | number | boolean) => {
    console.log('🔧 Settings change:', { field, value, userId: user?.id });
    
    // Update local state first
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));

    // Save to database immediately
    if (user?.id) {
      try {
        const updateData = {
          id: user.id,
          [field]: value
        };

        console.log('💾 Saving setting to database:', updateData);

        const { error } = await supabase
          .from('user_profiles')
          .upsert(updateData, { onConflict: 'id' });

        if (error) {
          console.error('❌ Database save error:', error);
          throw error;
        }
        console.log('✅ Setting saved successfully:', field, value);
      } catch (error) {
        console.error('❌ Error saving setting:', error);
        toast({
          title: "Error",
          description: "Failed to save setting. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }

    // Handle special cases after successful save
    if (field === 'auto_generate_yearly_vat' && value === true) {
      console.log('🚀 Triggering VAT calculation...');
      processVatAutomatically();
    }
    
    if (field === 'auto_generate_yearly_vat' && value === false) {
      console.log('🧹 Triggering VAT cleanup...');
      cleanupVatEntries();
    }

    if (field === 'auto_generate_employer_tax' && value === true) {
      console.log('🚀 Triggering employer tax generation for existing salaries...');
      processEmployerTaxForExistingSalaries();
    }

    if (field === 'auto_generate_employer_tax' && value === false) {
      console.log('🧹 Triggering employer tax cleanup...');
      cleanupEmployerTaxEntries();
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const updateData = {
        id: user.id,
        company_name: settings.company_name,
        company_motto: settings.company_motto,
        hourly_rate: settings.hourly_rate,
        currency: settings.currency,
        timezone: settings.timezone,
        debit_rate_monthly: settings.debit_rate_monthly,
        absence_percentage: settings.absence_percentage,
        work_hours_per_day: settings.work_hours_per_day,
        work_days_per_week: settings.work_days_per_week,
        auto_generate_employer_tax: settings.auto_generate_employer_tax,
        employer_tax_payment_date: settings.employer_tax_payment_date,
        auto_generate_yearly_vat: settings.auto_generate_yearly_vat,
        vat_rate_income: settings.vat_rate_income,
        vat_rate_expenses: settings.vat_rate_expenses,
      };

      console.log('🔧 Full updateData being sent to database:', updateData);
      console.log('🔍 Numeric values specifically:', {
        hourly_rate: updateData.hourly_rate,
        debit_rate_monthly: updateData.debit_rate_monthly,
        absence_percentage: updateData.absence_percentage,
        work_hours_per_day: updateData.work_hours_per_day,
        work_days_per_week: updateData.work_days_per_week,
        employer_tax_payment_date: updateData.employer_tax_payment_date,
        vat_rate_income: updateData.vat_rate_income,
        vat_rate_expenses: updateData.vat_rate_expenses,
      });

      const { error } = await supabase
        .from('user_profiles')
        .upsert(updateData, { onConflict: 'id' });

      if (error) throw error;

      toast({
        title: "Sparade inställningar",
        description: "Dina inställningar har sparats framgångsrikt",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inställningar</h1>
        <p className="text-muted-foreground">
          Hantera dina företagsinställningar, timpris och systempreferenser
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tidrapportering
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Fakturering
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Skatt
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Preferenser
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Företagsprofil
              </CardTitle>
              <CardDescription>
                Grundläggande information om ditt företag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="company_name">Företagsnamn</Label>
                <Input
                  type="text"
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="company_motto">Företagsmotto</Label>
                <Input
                  type="text"
                  id="company_motto"
                  value={settings.company_motto}
                  onChange={(e) => handleInputChange('company_motto', e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="hourly_rate">Timpris (SEK)</Label>
                <Input
                  type="number"
                  id="hourly_rate"
                  value={settings.hourly_rate}
                  onChange={(e) => handleInputChange('hourly_rate', Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tidrapportering
              </CardTitle>
              <CardDescription>
                Inställningar för tidrapportering och frånvaro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="work_hours_per_day">Arbetstimmar per dag</Label>
                <Input
                  type="number"
                  id="work_hours_per_day"
                  value={settings.work_hours_per_day}
                  onChange={(e) => handleInputChange('work_hours_per_day', Number(e.target.value))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="work_days_per_week">Arbetsdagar per vecka</Label>
                <Input
                  type="number"
                  id="work_days_per_week"
                  value={settings.work_days_per_week}
                  onChange={(e) => handleInputChange('work_days_per_week', Number(e.target.value))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="absence_percentage">Frånvaroprocent (%)</Label>
                <Input
                  type="number"
                  id="absence_percentage"
                  value={settings.absence_percentage}
                  onChange={(e) => handleInputChange('absence_percentage', Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <SimpleMonthlySettingsCard />
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Fakturering
              </CardTitle>
              <CardDescription>
                Inställningar för fakturering och integrationer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="debit_rate_monthly">Månatlig debiteringsgrad (SEK)</Label>
                <Input
                  type="number"
                  id="debit_rate_monthly"
                  value={settings.debit_rate_monthly}
                  onChange={(e) => handleInputChange('debit_rate_monthly', Number(e.target.value))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Fortnox Integration</Label>
                <Button 
                  variant="outline" 
                  onClick={() => setFortnoxDialogOpen(true)}
                  className="w-full justify-start"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Konfigurera Fortnox
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Skattehantering
              </CardTitle>
              <CardDescription>
                Automatisk hantering av arbetsgivaravgifter och MOMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Arbetsgivaravgifter</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_generate_employer_tax"
                    checked={settings.auto_generate_employer_tax || false}
                    onCheckedChange={(checked) => handleInputChange('auto_generate_employer_tax', checked)}
                  />
                  <Label htmlFor="auto_generate_employer_tax">
                    Generera arbetsgivaravgifter automatiskt (31.42%)
                  </Label>
                </div>
                {settings.auto_generate_employer_tax && (
                  <div className="ml-6 grid w-full items-center gap-1.5">
                    <Label htmlFor="employer_tax_payment_date">Betalningsdag för arbetsgivaravgifter</Label>
                    <Input
                      type="number"
                      id="employer_tax_payment_date"
                      value={settings.employer_tax_payment_date || 12}
                      onChange={(e) => handleInputChange('employer_tax_payment_date', Number(e.target.value))}
                      min="1"
                      max="28"
                    />
                    <p className="text-sm text-muted-foreground">
                      Dag i månaden efter löneutbetalning (1-28)
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">MOMS (VAT)</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_generate_yearly_vat"
                    checked={settings.auto_generate_yearly_vat || false}
                    onCheckedChange={(checked) => handleInputChange('auto_generate_yearly_vat', checked)}
                  />
                  <Label htmlFor="auto_generate_yearly_vat">
                    Generera årlig MOMS-betalning automatiskt
                  </Label>
                </div>
                
                {settings.auto_generate_yearly_vat && (
                  <div className="ml-6 space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="vat_rate_income">MOMS-sats för intäkter (%)</Label>
                      <Input
                        type="number"
                        id="vat_rate_income"
                        value={settings.vat_rate_income || 25}
                        onChange={(e) => handleInputChange('vat_rate_income', Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="vat_rate_expenses">MOMS-sats för utgifter (%)</Label>
                      <Input
                        type="number"
                        id="vat_rate_expenses"
                        value={settings.vat_rate_expenses || 25}
                        onChange={(e) => handleInputChange('vat_rate_expenses', Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      MOMS beräknas automatiskt för alla fakturor och utgifter, och en årlig betalning skapas i januari
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Systempreferenser
              </CardTitle>
              <CardDescription>
                Allmänna systeminställningar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="currency">Valuta</Label>
                <Input
                  type="text"
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="timezone">Tidszon</Label>
                <Input
                  type="text"
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Spara inställningar
            </>
          )}
        </Button>
      </div>

      <FortnoxConfigDialog
        open={fortnoxDialogOpen}
        onOpenChange={setFortnoxDialogOpen}
      />
    </div>
  );
}