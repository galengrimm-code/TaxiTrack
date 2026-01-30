'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, StatusBadge } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText } from 'lucide-react';
import Link from 'next/link';

function InvoicesContent() {
  const searchParams = useSearchParams();
  const { invoices, getCustomer, loading } = useData();
  const [filter, setFilter] = useState<string>('all');

  // Read filter from URL on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilter(statusParam);
    }
  }, [searchParams]);

  const filtered = invoices.filter(inv => {
    if (filter === 'all') return true;
    if (filter === 'unpaid') return inv.balance_due > 0;
    if (filter === 'paid') return inv.status === 'Paid';
    return inv.status === filter;
  });

  const sorted = [...filtered].sort((a, b) =>
    new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
  );

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-500">{filtered.length} invoices</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'unpaid', 'Deposit Paid', 'paid'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status === 'unpaid' ? 'Unpaid' : status === 'paid' ? 'Paid' : status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {sorted.map(invoice => {
          const customer = getCustomer(invoice.customer_id);
          return (
            <Link key={invoice.invoice_id} href={`/invoices/${invoice.invoice_id}`}>
              <Card hover className="mb-4">
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {customer?.first_name} {customer?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {invoice.invoice_id} • {formatDate(invoice.date_created)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(invoice.total)}</p>
                    <div className="flex items-center gap-2 justify-end">
                      <StatusBadge status={invoice.status} type="invoice" />
                      {invoice.balance_due > 0 && (
                        <span className="text-sm text-gray-500">
                          Due: {formatCurrency(invoice.balance_due)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {invoices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No invoices yet. Convert an estimate to create one!
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
        <InvoicesContent />
      </Suspense>
    </AppShell>
  );
}
