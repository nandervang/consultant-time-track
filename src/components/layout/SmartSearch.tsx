import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, Users, Clock, DollarSign, BarChart3, Settings, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useModalContext } from '@/contexts/ModalContext';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  title: string;
  description: string;
  action: () => void;
  icon: React.ReactNode;
  type: 'action' | 'navigation' | 'create';
  keywords: string[];
}

interface SmartSearchProps {
  className?: string;
}

export default function SmartSearch({ className }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const modalContext = useModalContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // All available suggestions
  const allSuggestions = useMemo<SearchSuggestion[]>(() => [
    // Create actions
    {
      id: 'new-invoice',
      title: 'Create New Invoice',
      description: 'Start a new invoice for a client',
      action: () => {
        navigate('/invoicing');
        setTimeout(() => {
          modalContext.triggerNewInvoice();
        }, 100);
      },
      icon: <Plus className="h-4 w-4" />,
      type: 'create',
      keywords: ['new', 'create', 'invoice', 'bill', 'charge', 'client', 'add i', 'new i', 'i', '+i', 'ni']
    },
    {
      id: 'new-client',
      title: 'Add New Client',
      description: 'Create a new client profile',
      action: () => {
        navigate('/clients');
        setTimeout(() => {
          modalContext.triggerNewClient();
        }, 100);
      },
      icon: <Plus className="h-4 w-4" />,
      type: 'create',
      keywords: ['new', 'add', 'create', 'client', 'customer', 'company', 'add c', 'new c', 'c', '+c', 'nc']
    },
    {
      id: 'new-project',
      title: 'Create New Project',
      description: 'Start a new project',
      action: () => {
        navigate('/projects');
        setTimeout(() => {
          modalContext.triggerNewProject();
        }, 100);
      },
      icon: <Briefcase className="h-4 w-4" />,
      type: 'create',
      keywords: ['new', 'create', 'project', 'work', 'task', 'add p', 'new p', 'p', '+p', 'np']
    },
    {
      id: 'log-time',
      title: 'Log Time Entry',
      description: 'Track time for a project',
      action: () => {
        navigate('/time-tracking');
        setTimeout(() => {
          modalContext.triggerLogTime();
        }, 100);
      },
      icon: <Clock className="h-4 w-4" />,
      type: 'create',
      keywords: ['log', 'track', 'time', 'hours', 'work', 'timer', 'add t', 'log t', 't', '+t', 'lt']
    },
    {
      id: 'add-expense',
      title: 'Add Expense',
      description: 'Record a new expense',
      action: () => {
        navigate('/budget');
        setTimeout(() => {
          modalContext.triggerAddExpense();
        }, 100);
      },
      icon: <DollarSign className="h-4 w-4" />,
      type: 'create',
      keywords: ['add', 'new', 'expense', 'cost', 'spend', 'payment', 'receipt', 'add e', 'new e', 'e', '+e', 'ne']
    },

    // Quick shortcuts - single letter commands
    {
      id: 'quick-dashboard',
      title: 'Dashboard',
      description: 'Quick access to dashboard',
      action: () => navigate('/'),
      icon: <BarChart3 className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['d', 'dashboard', 'home', 'overview', 'main']
    },
    {
      id: 'quick-invoicing',
      title: 'Invoicing',
      description: 'Quick access to invoicing',
      action: () => navigate('/invoicing'),
      icon: <FileText className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['inv', 'invoicing', 'invoices', 'bills', 'billing', 'payments']
    },
    {
      id: 'quick-clients',
      title: 'Clients',
      description: 'Quick access to clients',
      action: () => navigate('/clients'),
      icon: <Users className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['cli', 'clients', 'customers', 'companies', 'contacts']
    },
    {
      id: 'quick-time',
      title: 'Time Tracking',
      description: 'Quick access to time tracking',
      action: () => navigate('/time-tracking'),
      icon: <Clock className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['tt', 'time', 'tracking', 'hours', 'timesheet', 'work']
    },
    {
      id: 'quick-budget',
      title: 'Budget & Expenses',
      description: 'Quick access to budget',
      action: () => navigate('/budget'),
      icon: <DollarSign className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['bud', 'budget', 'expenses', 'finance', 'money', 'costs']
    },

    // Navigation with full names
    {
      id: 'go-dashboard',
      title: 'Dashboard',
      description: 'Go to main dashboard',
      action: () => navigate('/'),
      icon: <BarChart3 className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['dashboard', 'home', 'overview', 'main']
    },
    {
      id: 'go-invoicing',
      title: 'Invoicing',
      description: 'Manage invoices and billing',
      action: () => navigate('/invoicing'),
      icon: <FileText className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['invoicing', 'invoices', 'bills', 'billing', 'payments']
    },
    {
      id: 'go-clients',
      title: 'Clients',
      description: 'Manage client relationships',
      action: () => navigate('/clients'),
      icon: <Users className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['clients', 'customers', 'companies', 'contacts']
    },
    {
      id: 'go-time-tracking',
      title: 'Time Tracking',
      description: 'Track and manage work hours',
      action: () => navigate('/time-tracking'),
      icon: <Clock className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['time', 'tracking', 'hours', 'timesheet', 'work']
    },
    {
      id: 'go-budget',
      title: 'Budget & Expenses',
      description: 'Manage finances and expenses',
      action: () => navigate('/budget'),
      icon: <DollarSign className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['budget', 'expenses', 'finance', 'money', 'costs']
    },
    {
      id: 'go-settings',
      title: 'Settings',
      description: 'Configure application settings',
      action: () => navigate('/settings'),
      icon: <Settings className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['settings', 'config', 'preferences', 'options', 'set']
    },

    // Advanced shortcuts and commands
    {
      id: 'today-summary',
      title: 'Today\'s Summary',
      description: 'View today\'s time and revenue',
      action: () => {
        navigate('/');
        // Could trigger a specific dashboard widget focus
      },
      icon: <BarChart3 className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['today', 'summary', 'daily', 'td', 'now']
    },
    {
      id: 'quick-timer',
      title: 'Start Timer',
      description: 'Quick time tracking',
      action: () => {
        navigate('/time-tracking');
        setTimeout(() => {
          modalContext.triggerLogTime();
        }, 100);
      },
      icon: <Clock className="h-4 w-4" />,
      type: 'create',
      keywords: ['timer', 'start', 'track now', 'begin', 'st']
    },
    {
      id: 'help',
      title: 'Help & Shortcuts',
      description: 'Show all available commands',
      action: () => {
        // Focus on search input to show help
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
      },
      icon: <Settings className="h-4 w-4" />,
      type: 'navigation',
      keywords: ['help', 'shortcuts', 'commands', '?', 'h']
    }
  ], [navigate, modalContext]);

  // Enhanced filter suggestions based on query with command prefixes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    
    // Handle special command prefixes
    let processedQuery = lowerQuery;
    let forceCreateType = false;
    let forceNavType = false;
    
    if (lowerQuery.startsWith('/')) {
      // /command format for navigation
      processedQuery = lowerQuery.substring(1);
      forceNavType = true;
    } else if (lowerQuery.startsWith('+')) {
      // +command format for create actions
      processedQuery = lowerQuery.substring(1);
      forceCreateType = true;
    }
    
    const filtered = allSuggestions.filter(suggestion => {
      // Apply type filters if prefixes are used
      if (forceCreateType && suggestion.type !== 'create') return false;
      if (forceNavType && suggestion.type !== 'navigation') return false;
      
      const searchTerms = processedQuery.split(' ');
      return searchTerms.every(term =>
        suggestion.keywords.some(keyword => keyword.includes(term)) ||
        suggestion.title.toLowerCase().includes(term) ||
        suggestion.description.toLowerCase().includes(term)
      );
    });

    // Enhanced sorting by relevance
    filtered.sort((a, b) => {
      // Exact keyword matches get highest priority
      const aExactMatch = a.keywords.some(keyword => keyword === processedQuery);
      const bExactMatch = b.keywords.some(keyword => keyword === processedQuery);
      if (aExactMatch && !bExactMatch) return -1;
      if (bExactMatch && !aExactMatch) return 1;

      // Create actions get priority over navigation (unless forced)
      if (!forceNavType && a.type === 'create' && b.type !== 'create') return -1;
      if (!forceNavType && b.type === 'create' && a.type !== 'create') return 1;
      
      // Title starts with query
      const aTitleMatch = a.title.toLowerCase().startsWith(processedQuery);
      const bTitleMatch = b.title.toLowerCase().startsWith(processedQuery);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (bTitleMatch && !aTitleMatch) return 1;

      // Keyword starts with query
      const aKeywordMatch = a.keywords.some(keyword => keyword.startsWith(processedQuery));
      const bKeywordMatch = b.keywords.some(keyword => keyword.startsWith(processedQuery));
      if (aKeywordMatch && !bKeywordMatch) return -1;
      if (bKeywordMatch && !aKeywordMatch) return 1;
      
      return a.title.localeCompare(b.title);
    });

    setSuggestions(filtered.slice(0, 8)); // Increased to 8 suggestions
    setSelectedIndex(-1);
  }, [query, allSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    suggestion.action();
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut (Ctrl+W or Cmd+W)
  useEffect(() => {
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search or command... (Ctrl+W to focus, try '+i', '/clients')"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                index === selectedIndex && "bg-accent text-accent-foreground",
                suggestion.type === 'create' && "border-l-2 border-l-green-500",
                suggestion.type === 'navigation' && "border-l-2 border-l-blue-500"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex-shrink-0">
                {suggestion.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{suggestion.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {suggestion.description}
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  suggestion.type === 'create' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                  suggestion.type === 'navigation' && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                )}>
                  {suggestion.type === 'create' ? 'Create' : 'Go to'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick help text */}
      {isOpen && query.trim() === '' && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 p-4"
        >
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-3">Smart Search Commands:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="font-medium text-foreground mb-2">⚡ Quick Create:</p>
                <div className="space-y-1 text-xs">
                  <p>• <span className="font-mono bg-muted px-1 rounded">add i</span> or <span className="font-mono bg-muted px-1 rounded">+i</span> - New invoice</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">add c</span> or <span className="font-mono bg-muted px-1 rounded">+c</span> - New client</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">add t</span> or <span className="font-mono bg-muted px-1 rounded">+t</span> - Log time</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">add e</span> or <span className="font-mono bg-muted px-1 rounded">+e</span> - Add expense</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">timer</span> - Start timer</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">🚀 Quick Navigation:</p>
                <div className="space-y-1 text-xs">
                  <p>• <span className="font-mono bg-muted px-1 rounded">d</span> - Dashboard</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">inv</span> - Invoicing</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">cli</span> - Clients</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">tt</span> - Time tracking</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">bud</span> - Budget</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">🔧 Command Prefixes:</p>
                <div className="space-y-1 text-xs">
                  <p>• <span className="font-mono bg-muted px-1 rounded">+command</span> - Create only</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">/command</span> - Navigate only</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">?</span> or <span className="font-mono bg-muted px-1 rounded">h</span> - Help</p>
                  <p>• <span className="font-mono bg-muted px-1 rounded">today</span> - Today's summary</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs">💡 <span className="font-medium">Examples:</span> "new invoice", "+i", "/clients", "add t", "timer"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
