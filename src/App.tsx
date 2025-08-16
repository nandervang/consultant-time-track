import React, { useState } from 'react';
import { BarChart3, Calendar, Table, Settings, FileText, Moon, Sun } from 'lucide-react';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';

type ViewMode = 'dashboard' | 'quarter' | 'table' | 'summary';

function App() {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from localStorage on mount
  React.useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save dark mode preference to localStorage
  React.useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-900' : 'bg-slate-50'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={isDarkMode ? 'text-white' : 'text-slate-900'}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm isDarkMode={isDarkMode} />;
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'quarter', label: 'Quarter View', icon: Calendar },
    { id: 'table', label: 'All Entries', icon: Table },
    { id: 'summary', label: 'Summary', icon: FileText },
  ] as const;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
              }`}>
                <BarChart3 className={`w-6 h-6 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>Consultant Dashboard</h1>
                <p className={`text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>Time tracking made simple</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-slate-700 text-slate-400' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleSignOut}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-slate-700 text-slate-400' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button className={`p-2 rounded-lg transition-colors duration-200 ${
                isDarkMode 
                  ? 'hover:bg-slate-700 text-slate-400' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}>
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`border-b transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    isActive
                      ? `border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                      : `border-transparent ${
                          isDarkMode 
                            ? 'text-slate-400 hover:text-slate-200 hover:border-slate-600' 
                            : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard
          currentView={currentView}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          isDarkMode={isDarkMode}
        />
      </main>
    </div>
  );
}

export default App;