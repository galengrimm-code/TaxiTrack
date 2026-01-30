'use client';

import { useState } from 'react';
import { Search, Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui';

interface TopBarProps {
  onQuickAdd?: () => void;
}

export function TopBar({ onQuickAdd }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Search */}
      <div className="relative max-w-md flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers, estimates, invoices..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {/* Notification dot */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /> */}
        </button>
        
        {onQuickAdd && (
          <Button onClick={onQuickAdd} size="md">
            <Plus className="w-4 h-4" />
            <span>Quick Add</span>
          </Button>
        )}
      </div>
    </header>
  );
}
