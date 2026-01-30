'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, StatusBadge } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';

function EstimatesContent() {
  const { estimates, customers, getCustomer, loading } = useData();
  const [filter, setFilter] = useState<string>('all');

  const filtered = estimates.filter(e => 
    filter === 'all' || e.status === filter
  ).sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estimates</h1>
          <p className="text-gray-500">{estimates.length} total estimates</p>
        </div>
        <Link href="/estimates/new">
          <Button>
            <Plus className="w-4 h-4" />
            New Estimate
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'Draft', 'Sent', 'Approved', 'Converted'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Estimates List */}
      <div className="space-y-4">
        {filtered.map(estimate => {
          const customer = getCustomer(estimate.customer_id);
          return (
            <Link key={estimate.estimate_id} href={`/estimates/${estimate.estimate_id}`}>
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
                        {estimate.estimate_id} • {formatDate(estimate.date_created)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(estimate.total)}</p>
                    <StatusBadge status={estimate.status} type="estimate" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No estimates found
        </div>
      )}
    </div>
  );
}

export default function EstimatesPage() {
  return (
    <AppShell>
      <EstimatesContent />
    </AppShell>
  );
}
