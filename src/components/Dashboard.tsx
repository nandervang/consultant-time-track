import React from 'react';
import TimeLogger from './TimeLogger';
import DailySummary from './DailySummary';
import QuarterView from './QuarterView';
import TableView from './TableView';
import MonthlySummary from './MonthlySummary';

type ViewMode = 'dashboard' | 'quarter' | 'table' | 'summary';

interface DashboardProps {
  currentView: ViewMode;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isDarkMode: boolean;
}

export default function Dashboard({ currentView, currentDate, onDateChange, isDarkMode }: DashboardProps) {
  return (
    <>
      {currentView === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <TimeLogger isDarkMode={isDarkMode} />
          </div>
          <div className="space-y-8">
            <DailySummary isDarkMode={isDarkMode} />
          </div>
        </div>
      )}
      
      {currentView === 'quarter' && (
        <QuarterView
          currentDate={currentDate}
          onDateChange={onDateChange}
          isDarkMode={isDarkMode}
        />
      )}
      
      {currentView === 'table' && (
        <TableView isDarkMode={isDarkMode} />
      )}
      
      {currentView === 'summary' && (
        <MonthlySummary isDarkMode={isDarkMode} />
      )}
    </>
  );
}