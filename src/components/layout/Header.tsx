import { Bell, User, LogOut, Moon, Sun, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import SmartSearch from './SmartSearch';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut: () => void;
  user: { email?: string } | null;
}

export default function Header({ isDarkMode, onToggleDarkMode, onSignOut, user }: HeaderProps) {
  return (
    <header className={cn(
      "flex items-center justify-between px-6 py-4 border-b",
      "bg-background border-border"
    )}>
      {/* Smart Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <SmartSearch className="flex-1" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>

        {/* Dark mode toggle */}
        <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" asChild>
          <Link to="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        {/* User menu */}
        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
          </div>
          
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
