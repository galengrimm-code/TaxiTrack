'use client';

import { AppShell } from '@/components/layout';
import { Card, CardContent } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp, Users, Briefcase } from 'lucide-react';

function ReportsContent() {
  const { customers, projects, invoices, payments, loading } = useData();

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.balance_due, 0);
  const completedProjects = projects.filter(p => p.status === 'Completed' || p.status === 'Picked Up').length;
  const activeProjects = projects.filter(p => !['Completed', 'Picked Up'].includes(p.status)).length;

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Business overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="text-center py-8">
            <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</p>
            <p className="text-sm text-gray-500 mt-1">Outstanding Balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-8">
            <Briefcase className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">{completedProjects}</p>
            <p className="text-sm text-gray-500 mt-1">Completed Projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total Customers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{activeProjects}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoices.filter(i => i.status === 'Paid').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-8 text-gray-500">
        <p>More detailed reports coming soon!</p>
        <p className="text-sm mt-2">PDF generation, date range filtering, charts, and more.</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AppShell>
      <ReportsContent />
    </AppShell>
  );
}
