import React, { useState } from 'react';
import { Table, Search, Calendar } from 'lucide-react';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useProjects } from '../hooks/useProjects';

interface TableViewProps {
  isDarkMode: boolean;
}

export default function TableView({ isDarkMode }: TableViewProps) {
  const { entries } = useTimeEntries();
  const { projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.comment && entry.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProject = !selectedProjectId || entry.project_id === selectedProjectId;
    
    return matchesSearch && matchesProject;
  });

  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const sortedEntries = [...filteredEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${
          isDarkMode ? 'bg-purple-900' : 'bg-purple-100'
        }`}>
          <Table className={`w-5 h-5 ${
            isDarkMode ? 'text-purple-400' : 'text-purple-600'
          }`} />
        </div>
        <div>
          <h2 className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>Time Entries</h2>
          <p className={`text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {filteredEntries.length} entries • {totalHours.toFixed(1)} hours total
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`} />
          <input
            type="text"
            placeholder="Search projects or comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
            }`}
          />
        </div>
        
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-slate-700 border-slate-600 text-white' 
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

      {sortedEntries.length === 0 ? (
        <div className={`text-center py-12 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <Calendar className={`w-12 h-12 mx-auto mb-3 ${
            isDarkMode ? 'text-slate-600' : 'text-slate-300'
          }`} />
          <p>No time entries found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${
                isDarkMode ? 'border-slate-600' : 'border-slate-200'
              }`}>
                <th className={`text-left py-3 px-4 font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>Date</th>
                <th className={`text-left py-3 px-4 font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>Project</th>
                <th className={`text-left py-3 px-4 font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>Hours</th>
                <th className={`text-left py-3 px-4 font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => (
                <tr key={entry.id} className={`border-b transition-colors duration-150 ${
                  isDarkMode 
                    ? 'border-slate-700 hover:bg-slate-700' 
                    : 'border-slate-100 hover:bg-slate-50'
                }`}>
                  <td className={`py-3 px-4 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {formatDate(entry.date)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.project?.color || '#64748B' }}
                      />
                      <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                        {entry.project?.name}
                      </span>
                    </div>
                  </td>
                  <td className={`py-3 px-4 font-medium ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {entry.hours}h
                  </td>
                  <td className={`py-3 px-4 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {entry.comment || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}