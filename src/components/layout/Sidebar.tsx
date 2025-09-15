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
  ChevronRight,
  Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
  { name: 'Budget', href: '/budget', icon: DollarSign },
  { name: 'Cash Flow', href: '/cash-flow', icon: TrendingUp },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoicing', href: '/invoicing', icon: FileText },
  { name: 'Salary', href: '/salary', icon: Banknote },
];

export default function Sidebar({ collapsed, onToggle, isDarkMode }: SidebarProps) {
  return (
    <div className={cn(
      "flex flex-col h-full border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      isDarkMode ? "bg-card border-border" : "bg-card border-border"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">ConsultantHub</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
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
      <div className="p-4 border-t border-border">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            <p>© 2025 ConsultantHub</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
}
