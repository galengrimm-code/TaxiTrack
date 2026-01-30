'use client';

import { ReactNode, useState } from 'react';
import { Sidebar, TopBar, MobileBottomNav } from '@/components/layout';
import { useData } from '@/lib/DataContext';
import { Modal } from '@/components/ui';

export function AppShell({ children }: { children: ReactNode }) {
  const { syncing, connected } = useData();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        syncing={syncing}
        connected={connected}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <TopBar
          onQuickAdd={() => setQuickAddOpen(true)}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* Quick Add Modal */}
      <Modal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Quick Add"
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <a
            href="/customers?new=true"
            className="p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="font-medium text-gray-900 text-sm sm:text-base">New Customer</div>
          </a>
          <a
            href="/estimates/new"
            className="p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-gray-900 text-sm sm:text-base">New Estimate</div>
          </a>
          <a
            href="/pricebook?new=true"
            className="p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🏷️</div>
            <div className="font-medium text-gray-900 text-sm sm:text-base">New Service</div>
          </a>
          <a
            href="/invoices"
            className="p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">💵</div>
            <div className="font-medium text-gray-900 text-sm sm:text-base">Record Payment</div>
          </a>
        </div>
      </Modal>
    </div>
  );
}
