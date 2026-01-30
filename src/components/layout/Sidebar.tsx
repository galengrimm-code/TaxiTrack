'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Briefcase,
  BarChart3,
  Book,
  Settings,
  X
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
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ syncing = false, connected = false, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col h-screen transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white">
                <Image
                  src="/logo.png"
                  alt="TaxiTrack Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-lg">TaxiTrack</h1>
                <p className="text-xs text-slate-400">Management System</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
              onClick={onClose}
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
    </>
  );
}

// Mobile bottom navigation bar
export function MobileBottomNav() {
  const pathname = usePathname();

  const mobileNavItems = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/projects', label: 'Projects', icon: Briefcase },
    { href: '/invoices', label: 'Invoices', icon: DollarSign },
    { href: '/settings', label: 'More', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-30 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {mobileNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors',
              isActive(item.href)
                ? 'text-amber-600'
                : 'text-gray-500'
            )}
          >
            <item.icon className={cn(
              'w-6 h-6 mb-1',
              isActive(item.href) && 'stroke-[2.5]'
            )} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
