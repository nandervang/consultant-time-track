import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut: () => void;
  user: { email?: string } | null;
  children?: React.ReactNode;
}

export default function MainLayout({ isDarkMode, onToggleDarkMode, onSignOut, user, children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={cn("h-screen flex", isDarkMode ? "dark" : "")}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isDarkMode={isDarkMode}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          onSignOut={onSignOut}
          user={user}
        />
        
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
