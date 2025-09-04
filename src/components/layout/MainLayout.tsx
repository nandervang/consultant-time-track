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
    <div className={cn("min-h-screen flex flex-col", isDarkMode ? "dark" : "")}>
      {/* Header spanning full width */}
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        onSignOut={onSignOut}
        user={user}
      />

      {/* Content area with sidebar and main */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6 bg-muted/30 min-w-0">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
