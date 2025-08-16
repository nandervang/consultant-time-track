import React, { useState } from 'react';
import { Clock, Plus, Calendar } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useTimeEntries } from '../hooks/useTimeEntries';

interface TimeLoggerProps {
  isDarkMode: boolean;
}

export default function TimeLogger({ isDarkMode }: TimeLoggerProps) {
  const { projects } = useProjects();
  const { createTimeEntry } = useTimeEntries();
  const [hours, setHours] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [comment, setComment] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hours || !selectedProjectId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const { error } = await createTimeEntry({
      date: selectedDate,
      hours: parseFloat(hours),
      project_id: selectedProjectId,
      comment: comment.trim() || undefined,
    });
    
    if (!error) {
      setHours('');
      setComment('');
    }
    
    setIsSubmitting(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date().toISOString().split('T')[0];
    
    if (dateStr === today) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  return (
    <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${
          isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
        }`}>
          <Clock className={`w-5 h-5 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
        </div>
        <h2 className={`text-xl font-semibold ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>Log Today's Time</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Date
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`} />
                {formatDisplayDate(selectedDate)}
              </span>
            </button>
            
            {isDatePickerOpen && (
              <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-10 transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600' 
                  : 'bg-white border-slate-300'
              }`}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setIsDatePickerOpen(false);
                  }}
                  className={`w-full px-3 py-2 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-white text-slate-900'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Hours
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0.0"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
              }`}
              required
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
              required
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add any notes about this time entry..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
            }`}
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Log Time
            </>
          )}
        </button>
      </form>
    </div>
  );
}