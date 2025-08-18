import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/AuthForm';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import TimeTracking from '@/pages/TimeTracking';
import Budget from '@/pages/Budget';
import CashFlow from '@/pages/CashFlow';
import Projects from '@/pages/Projects';
import Analytics from '@/pages/Analytics';

function App() {
  const { user, loading, signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
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

  return (
    <Router>
      <MainLayout
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onSignOut={handleSignOut}
        user={user}
      >
        <Routes>
          <Route path="/" element={<Dashboard isDarkMode={isDarkMode} />} />
          <Route path="/time-tracking" element={<TimeTracking isDarkMode={isDarkMode} />} />
          <Route path="/budget" element={<Budget isDarkMode={isDarkMode} />} />
          <Route path="/cash-flow" element={<CashFlow isDarkMode={isDarkMode} />} />
          <Route path="/projects" element={<Projects isDarkMode={isDarkMode} />} />
          <Route path="/analytics" element={<Analytics isDarkMode={isDarkMode} />} />
          <Route path="/clients" element={<div className="p-6">Client management coming soon...</div>} />
          <Route path="/invoicing" element={<div className="p-6">Invoicing coming soon...</div>} />
          <Route path="/settings" element={<div className="p-6">Settings coming soon...</div>} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;