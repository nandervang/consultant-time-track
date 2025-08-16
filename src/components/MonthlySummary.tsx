import React, { useState } from 'react';
import { FileText, Calendar, Filter } from 'lucide-react';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useProjects } from '../hooks/useProjects';

interface MonthlySummaryProps {
  isDarkMode: boolean;
}

export default function MonthlySummary({ isDarkMode }: MonthlySummaryProps) {
  const { entries } = useTimeEntries();
  const { projects } = useProjects();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const dateInRange = (!start || entryDate >= start) && (!end || entryDate <= end);
    const projectMatches = !selectedProjectId || entry.project_id === selectedProjectId;
    
    return dateInRange && projectMatches;
  });

  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);

  // Group entries by project
  const projectSummary = filteredEntries.reduce((acc, entry) => {
    const projectName = entry.project?.name || 'Unknown';
    if (!acc[projectName]) {
      acc[projectName] = { hours: 0, color: entry.project?.color || '#64748B' };
    }
    acc[projectName].hours += entry.hours;
    return acc;
  }, {} as Record<string, { hours: number; color: string }>);

  // Group entries by month
  const monthlySummary = filteredEntries.reduce((acc, entry) => {
    const monthKey = entry.date.substring(0, 7); // YYYY-MM format
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    acc[monthKey] += entry.hours;
    return acc;
  }, {} as Record<string, number>);

  const formatMonthYear = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'All time';
    if (startDate && !endDate) return `From ${new Date(startDate).toLocaleDateString()}`;
    if (!startDate && endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  };

  return (
    <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${
          isDarkMode ? 'bg-orange-900' : 'bg-orange-100'
        }`}>
          <FileText className={`w-5 h-5 ${
            isDarkMode ? 'text-orange-400' : 'text-orange-600'
          }`} />
        </div>
        <div>
          <h2 className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>Summary</h2>
          <p className={`text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>{formatDateRange()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 rounded-lg transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
      }`}>
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-slate-600 border-slate-500 text-white' 
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-slate-600 border-slate-500 text-white' 
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Project Filter
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-slate-600 border-slate-500 text-white' 
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`rounded-lg p-4 transition-colors duration-200 ${
          isDarkMode ? 'bg-blue-900' : 'bg-blue-50'
        }`}>
          <div className={`text-2xl font-bold ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>{totalHours.toFixed(1)}h</div>
          <div className={`text-sm ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>Total Hours</div>
        </div>
        
        <div className={`rounded-lg p-4 transition-colors duration-200 ${
          isDarkMode ? 'bg-green-900' : 'bg-green-50'
        }`}>
          <div className={`text-2xl font-bold ${
            isDarkMode ? 'text-green-400' : 'text-green-600'
          }`}>{filteredEntries.length}</div>
          <div className={`text-sm ${
            isDarkMode ? 'text-green-400' : 'text-green-600'
          }`}>Total Entries</div>
        </div>
        
        <div className={`rounded-lg p-4 transition-colors duration-200 ${
          isDarkMode ? 'bg-purple-900' : 'bg-purple-50'
        }`}>
          <div className={`text-2xl font-bold ${
            isDarkMode ? 'text-purple-400' : 'text-purple-600'
          }`}>{Object.keys(monthlySummary).length}</div>
          <div className={`text-sm ${
            isDarkMode ? 'text-purple-400' : 'text-purple-600'
          }`}>Months Covered</div>
        </div>
      </div>

      {/* Project Breakdown */}
      {Object.keys(projectSummary).length > 0 && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-3 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>Hours by Project</h3>
          <div className="space-y-3">
            {Object.entries(projectSummary)
              .sort(([,a], [,b]) => b.hours - a.hours)
              .map(([project, data]) => (
                <div key={project} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: data.color }}
                    />
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>{project}</span>
                  </div>
                  <div className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>{data.hours.toFixed(1)}h</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      {Object.keys(monthlySummary).length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold mb-3 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>Hours by Month</h3>
          <div className="space-y-3">
            {Object.entries(monthlySummary)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, hours]) => (
                <div key={month} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <Calendar className={`w-4 h-4 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>{formatMonthYear(month)}</span>
                  </div>
                  <div className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>{hours.toFixed(1)}h</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {filteredEntries.length === 0 && (
        <div className={`text-center py-8 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <Filter className={`w-12 h-12 mx-auto mb-3 ${
            isDarkMode ? 'text-slate-600' : 'text-slate-300'
          }`} />
          <p>No entries found for the selected filters</p>
        </div>
      )}
    </div>
  );
}