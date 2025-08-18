import { Clock, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function TimeLoggedCard() {
  const { entries } = useTimeEntries();
  const { user } = useAuth();
  const [userSettings, setUserSettings] = useState({ billing_percentage: 94, absence_percentage: 15 });

  // Load user settings - try monthly first, fall back to profile defaults
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;

      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // First try to get monthly-specific settings
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('monthly_settings')
          .select('billing_percentage, absence_percentage')
          .eq('user_id', user.id)
          .eq('year', currentYear)
          .eq('month', currentMonth)
          .single();

        if (monthlyData && !monthlyError) {
          setUserSettings({
            billing_percentage: monthlyData.billing_percentage,
            absence_percentage: monthlyData.absence_percentage
          });
        } else {
          // Fall back to user profile defaults
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('debit_rate_monthly, absence_percentage')
            .eq('id', user.id)
            .single();

          if (profileData && !profileError) {
            setUserSettings({
              billing_percentage: profileData.debit_rate_monthly || 94,
              absence_percentage: profileData.absence_percentage || 15
            });
          }
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    loadUserSettings();
  }, [user]);
  
  // Calculate this month's hours
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date + 'T00:00:00');
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });
  
  const hoursThisMonth = thisMonthEntries.reduce((sum, entry) => sum + entry.hours, 0);
  
  // Get working days in current month (excluding weekends)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const workingDaysInMonth = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    return date.getDay() !== 0 && date.getDay() !== 6; // Not Sunday or Saturday
  }).filter(Boolean).length;
  
  // Calculate target hours based on user settings
  const totalWorkHours = workingDaysInMonth * 8; // Standard work hours
  const effectiveHours = totalWorkHours * (1 - userSettings.absence_percentage / 100);
  const targetBillableHours = effectiveHours * (userSettings.billing_percentage / 100);
  
  const percentageOfTarget = targetBillableHours > 0 ? (hoursThisMonth / targetBillableHours) * 100 : 0;
  const remainingHours = Math.max(0, targetBillableHours - hoursThisMonth);

  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Loggad tid - {monthNames[currentMonth]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">
            {hoursThisMonth.toFixed(1)}h
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Framsteg mot mål</span>
              <span className="text-muted-foreground">{percentageOfTarget.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(percentageOfTarget, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {remainingHours > 0 ? `${remainingHours.toFixed(0)}h kvar till mål` : 'Målet nått!'}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Mål: {targetBillableHours.toFixed(0)}h debiterbara timmar</span>
            </div>
            <div>
              Debiteringsgrad: {userSettings.billing_percentage}% | Frånvaro: {userSettings.absence_percentage}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
