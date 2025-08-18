import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTimeEntries } from '../hooks/useTimeEntries';

interface QuarterViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isDarkMode: boolean;
}

export default function QuarterView({ currentDate, onDateChange, isDarkMode }: QuarterViewProps) {
  const { entries } = useTimeEntries();

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getMonthData = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEntries = entries.filter(entry => entry.date === dateStr);
      const totalHours = dayEntries.reduce((sum, entry) => sum + entry.hours, 0);
      
      days.push({
        day,
        dateStr,
        entries: dayEntries,
        totalHours
      });
    }

    return days;
  };

  const navigateQuarter = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    onDateChange(newDate);
  };

  const months = [];
  for (let i = 0; i < 3; i++) {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    months.push(monthDate);
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
  };

  const getQuarterName = (date: Date) => {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  };

  return (
    <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>
          Quarter Overview - {getQuarterName(currentDate)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateQuarter('prev')}
            title="Previous quarter"
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-slate-400' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateQuarter('next')}
            title="Next quarter"
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-slate-400' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {months.map((month, monthIndex) => {
          const monthData = getMonthData(month.getFullYear(), month.getMonth());
          
          return (
            <div key={monthIndex} className="space-y-3">
              <h3 className={`font-semibold text-center ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {formatMonthYear(month)}
              </h3>
              
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className={`text-xs font-medium text-center py-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {day}
                  </div>
                ))}
                
                {monthData.map((dayData, dayIndex) => (
                  <div key={dayIndex} className="aspect-square">
                    {dayData ? (
                      <div
                        className={`w-full h-full rounded-lg border p-1 flex flex-col justify-between text-xs ${
                          dayData.totalHours > 0
                            ? isDarkMode 
                              ? 'bg-blue-900 border-blue-700' 
                              : 'bg-blue-50 border-blue-200'
                            : isDarkMode 
                              ? 'bg-slate-700 border-slate-600' 
                              : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {dayData.day}
                        </div>
                        {dayData.totalHours > 0 && (
                          <div className={`font-medium ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {dayData.totalHours}h
                          </div>
                        )}
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}