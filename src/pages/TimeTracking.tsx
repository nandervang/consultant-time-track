import { useState, useCallback } from 'react';
import TimeLogger from '@/components/TimeLogger';
import DailySummary from '@/components/DailySummary';
import TableView from '@/components/TableView';
import MonthlySummary from '@/components/MonthlySummary';
import QuarterView from '@/components/QuarterView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BarChart3, Calendar, Table, RefreshCw } from 'lucide-react';
import { useTimeEntries } from '@/hooks/useTimeEntries';

interface TimeTrackingPageProps {
  isDarkMode: boolean;
}

type ViewType = 'overview' | 'daily' | 'summary' | 'quarterly' | 'table';

export default function TimeTrackingPage({ isDarkMode }: TimeTrackingPageProps) {
  const [activeView, setActiveView] = useState<ViewType>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { refetch, loading } = useTimeEntries();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // This will be called from TimeLogger when a new entry is created
  const handleTimeLogged = useCallback(() => {
    // The useTimeEntries hook already handles auto-updating the state
    // when createTimeEntry is called, so no additional action needed here
  }, []);

  const viewConfig = [
    {
      id: 'daily' as ViewType,
      label: 'Daily View',
      icon: Clock,
      description: 'Log time and view today\'s summary'
    },
    {
      id: 'summary' as ViewType,
      label: 'Summary & Filters',
      icon: BarChart3,
      description: 'Overview with date filters and project breakdown'
    },
    {
      id: 'quarterly' as ViewType,
      label: 'Quarterly View',
      icon: Calendar,
      description: 'Calendar view by quarters'
    },
    {
      id: 'table' as ViewType,
      label: 'All Entries',
      icon: Table,
      description: 'Detailed table of all time entries'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground">
            Log your hours and track your productivity
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* View Navigation */}
      <div className="flex flex-wrap gap-2">
        {viewConfig.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
                isActive
                  ? isDarkMode
                    ? 'bg-blue-900 border-blue-700 text-blue-300'
                    : 'bg-blue-50 border-blue-300 text-blue-700'
                  : isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title={view.description}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {activeView === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time Logger */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Log Time</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeLogger isDarkMode={isDarkMode} onTimeLogged={handleTimeLogged} />
              </CardContent>
            </Card>
          </div>

          {/* Daily Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <DailySummary isDarkMode={isDarkMode} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeView === 'summary' && (
        <MonthlySummary isDarkMode={isDarkMode} />
      )}

      {activeView === 'quarterly' && (
        <QuarterView 
          currentDate={currentDate} 
          onDateChange={setCurrentDate} 
          isDarkMode={isDarkMode} 
        />
      )}

      {activeView === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>All Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <TableView isDarkMode={isDarkMode} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
