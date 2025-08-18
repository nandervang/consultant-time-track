import { Clock, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function TodayTimeCard() {
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
  
  // Get today's entries
  const today = new Date().toISOString().split('T')[0];
  const todaysEntries = entries.filter(entry => entry.date === today);
  const totalHoursToday = todaysEntries.reduce((sum, entry) => sum + entry.hours, 0);
  
  // Calculate daily target based on monthly settings
  const workingDaysInMonth = 21; // Approximate
  const dailyTarget = (workingDaysInMonth * 8 * (1 - userSettings.absence_percentage / 100) * (userSettings.billing_percentage / 100)) / workingDaysInMonth;
  
  const percentageOfTarget = dailyTarget > 0 ? (totalHoursToday / dailyTarget) * 100 : 0;
  const remainingHours = Math.max(0, dailyTarget - totalHoursToday);
  
  // Get status color based on progress
  const getStatusColor = () => {
    if (percentageOfTarget >= 100) return 'text-green-600';
    if (percentageOfTarget >= 75) return 'text-blue-600';
    if (percentageOfTarget >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Dagens timmar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className={`text-3xl font-bold ${getStatusColor()}`}>
            {totalHoursToday.toFixed(1)}h
          </div>
          
          {/* Progress toward daily goal */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dagsmål</span>
              <span className="text-muted-foreground">{percentageOfTarget.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  percentageOfTarget >= 100 ? 'bg-green-500' :
                  percentageOfTarget >= 75 ? 'bg-blue-500' :
                  percentageOfTarget >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
                }`}
                style={{ width: `${Math.min(percentageOfTarget, 100)}%` }}
              />
            </div>
          </div>

          {/* Status message */}
          <div className="flex items-center gap-1 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {remainingHours > 0 
                ? `${remainingHours.toFixed(1)}h kvar till mål` 
                : percentageOfTarget >= 100 
                  ? 'Dagsmål uppnått!' 
                  : 'På rätt spår'}
            </span>
          </div>
          
          {/* Target info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Mål: {dailyTarget.toFixed(1)}h debiterbara/dag</span>
            </div>
            <div>
              {todaysEntries.length} {todaysEntries.length === 1 ? 'registrering' : 'registreringar'} idag
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
