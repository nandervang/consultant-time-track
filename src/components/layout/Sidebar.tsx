import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  FolderOpen, 
  BarChart3, 
  Users, 
  FileText, 
  Settings,
  ChevronLeft,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
  { name: 'Budget', href: '/budget', icon: DollarSign },
  { name: 'Cash Flow', href: '/cash-flow', icon: TrendingUp },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoicing', href: '/invoicing', icon: FileText },
  { name: 'CV Manager', href: '/cv-manager', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }: Omit<SidebarProps, 'isDarkMode'>) {
  return (
    <aside className={cn(
      "bg-card border-r border-border transition-all duration-300 flex flex-col",
      "h-full", // Changed from h-screen since header is now separate
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold text-foreground">ConsultantHub</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                      collapsed ? "justify-center" : ""
                    )
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border flex-shrink-0">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            <p>© 2025 ConsultantHub</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}
