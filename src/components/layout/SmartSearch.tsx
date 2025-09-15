import React, { useState } from 'react';
import { Search, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useModalContext } from '@/contexts/ModalContext';
import { cn } from '@/lib/utils';

interface SmartSearchProps {
  className?: string;
}

export default function SmartSearch({ className }: SmartSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchModalOpen, setSearchModalOpen } = useModalContext();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Here you can implement actual search logic
      console.log('Searching for:', searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setSearchModalOpen(true);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Search... (⌘K)"
        className="pl-10 pr-12"
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
        onClick={() => setSearchModalOpen(true)}
      >
        <Command className="h-3 w-3" />
      </Button>
    </div>
  );
}
