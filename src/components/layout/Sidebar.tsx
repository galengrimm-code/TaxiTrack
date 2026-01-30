'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  Briefcase, 
  BarChart3, 
  Book, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/estimates', label: 'Estimates', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: DollarSign },
  { href: '/projects', label: 'Projects', icon: Briefcase },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

const bottomNavItems = [
  { href: '/pricebook', label: 'Price Book', icon: Book },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  syncing?: boolean;
  connected?: boolean;
}

export function Sidebar({ syncing = false, connected = false }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg">TaxiTrack</h1>
            <p className="text-xs text-slate-400">Management System</p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              isActive(item.href)
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400'
                : 'text-slate-300 hover:bg-slate-800'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="p-3 border-t border-slate-700 space-y-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              isActive(item.href)
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400'
                : 'text-slate-400 hover:bg-slate-800'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Sync Status */}
      <div className="p-3 border-t border-slate-700">
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          connected ? 'bg-emerald-500/10' : 'bg-slate-800'
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full',
            syncing 
              ? 'bg-amber-400 animate-pulse' 
              : connected 
                ? 'bg-emerald-400' 
                : 'bg-slate-500'
          )} />
          <span className={cn(
            'text-xs',
            connected ? 'text-emerald-400' : 'text-slate-500'
          )}>
            {syncing ? 'Syncing...' : connected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
