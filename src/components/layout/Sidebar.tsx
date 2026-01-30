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

// Deer head logo component
function DeerLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="antlerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#f97316"/>
        </linearGradient>
      </defs>
      {/* Left Antler */}
      <path d="M25 45 Q20 35 15 20 Q12 15 8 12 M15 20 Q18 18 22 15 M15 20 Q13 22 10 25 M25 45 Q22 38 18 30 Q16 28 12 28"
            fill="none" stroke="url(#antlerGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Right Antler */}
      <path d="M75 45 Q80 35 85 20 Q88 15 92 12 M85 20 Q82 18 78 15 M85 20 Q87 22 90 25 M75 45 Q78 38 82 30 Q84 28 88 28"
            fill="none" stroke="url(#antlerGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Head */}
      <ellipse cx="50" cy="58" rx="22" ry="28" fill="#f8fafc"/>
      {/* Ears */}
      <ellipse cx="30" cy="48" rx="6" ry="10" fill="#f8fafc" transform="rotate(-20 30 48)"/>
      <ellipse cx="70" cy="48" rx="6" ry="10" fill="#f8fafc" transform="rotate(20 70 48)"/>
      {/* Inner ears */}
      <ellipse cx="30" cy="48" rx="3" ry="6" fill="#fcd34d" transform="rotate(-20 30 48)"/>
      <ellipse cx="70" cy="48" rx="3" ry="6" fill="#fcd34d" transform="rotate(20 70 48)"/>
      {/* Eyes */}
      <ellipse cx="40" cy="58" rx="4" ry="5" fill="#1e293b"/>
      <ellipse cx="60" cy="58" rx="4" ry="5" fill="#1e293b"/>
      <circle cx="41" cy="57" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="61" cy="57" r="1.5" fill="white" opacity="0.8"/>
      {/* Nose */}
      <ellipse cx="50" cy="75" rx="8" ry="6" fill="#1e293b"/>
      <ellipse cx="50" cy="74" rx="5" ry="3" fill="#374151"/>
    </svg>
  );
}

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
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <DeerLogo className="w-9 h-9" />
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
