import { Calendar, Clock, User } from 'lucide-react';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useClients } from '../hooks/useClients';

interface DailySummaryProps {
  isDarkMode: boolean;
}

export default function DailySummary({ isDarkMode }: DailySummaryProps) {
  const { entries } = useTimeEntries();
  const { clients } = useClients();
  const today = new Date().toISOString().split('T')[0];
  const todaysEntries = entries.filter(entry => entry.date === today);
  const totalHours = todaysEntries.reduce((sum, entry) => sum + entry.hours, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to get client info for a project
  const getClientInfo = (projectClientId?: string | null) => {
    return clients.find(c => c.id === projectClientId);
  };

  return (
    <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isDarkMode ? 'bg-green-900' : 'bg-green-100'
          }`}>
            <Calendar className={`w-5 h-5 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>Today's Summary</h2>
            <p className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>{formatDate(today)}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`flex items-center gap-2 text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <Clock className={`w-6 h-6 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            {totalHours.toFixed(1)}h
          </div>
          <p className={`text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>{todaysEntries.length} entries</p>
        </div>
      </div>
      
      {todaysEntries.length === 0 ? (
        <div className={`text-center py-8 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <Clock className={`w-12 h-12 mx-auto mb-3 ${
            isDarkMode ? 'text-slate-600' : 'text-slate-300'
          }`} />
          <p>No time logged today yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todaysEntries.map((entry) => {
            const client = getClientInfo(entry.project?.client_id);
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.project?.color || '#64748B' }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>{entry.project?.name}</p>
                  {client && (
                    <div className={`flex items-center gap-1 text-xs ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <User className="w-3 h-3" />
                      <span>{client.name}{client.company ? ` (${client.company})` : ''}</span>
                    </div>
                  )}
                  {entry.comment && (
                    <p className={`text-sm truncate ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>{entry.comment}</p>
                  )}
                </div>
                <div className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>{entry.hours}h</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}