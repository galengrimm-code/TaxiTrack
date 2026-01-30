'use client';

import { ReactNode, useState } from 'react';
import { Sidebar, TopBar } from '@/components/layout';
import { DataProvider, useData } from '@/lib/DataContext';
import { Modal } from '@/components/ui';

function AppShellContent({ children }: { children: ReactNode }) {
  const { syncing, connected } = useData();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar syncing={syncing} connected={connected} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onQuickAdd={() => setQuickAddOpen(true)} />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Quick Add Modal */}
      <Modal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Quick Add"
      >
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/customers?new=true"
            className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="font-medium text-gray-900">New Customer</div>
          </a>
          <a
            href="/estimates?new=true"
            className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-gray-900">New Estimate</div>
          </a>
          <a
            href="/pricebook?new=true"
            className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🏷️</div>
            <div className="font-medium text-gray-900">New Service</div>
          </a>
          <a
            href="/invoices"
            className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">💵</div>
            <div className="font-medium text-gray-900">Record Payment</div>
          </a>
        </div>
      </Modal>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <AppShellContent>{children}</AppShellContent>
    </DataProvider>
  );
}
