'use client';

import { useState } from 'react';
import { Search, Plus, Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui';

interface TopBarProps {
  onQuickAdd?: () => void;
  onMenuToggle?: () => void;
}

export function TopBar({ onQuickAdd, onMenuToggle }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-14 lg:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md mx-4 lg:mx-0">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 lg:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm lg:text-base"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {onQuickAdd && (
          <Button onClick={onQuickAdd} size="md" className="hidden sm:flex">
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Quick Add</span>
          </Button>
        )}
        {onQuickAdd && (
          <button
            onClick={onQuickAdd}
            className="sm:hidden p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
