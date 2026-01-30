'use client';

import { AppShell } from '@/components/layout';
import { Card, CardContent, StatusBadge, Button } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatCurrency, daysSince } from '@/lib/utils';
import { 
  Briefcase, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  Phone,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const { 
    customers, 
    projects, 
    invoices, 
    payments,
    getCustomer,
    loading 
  } = useData();

  // Calculate stats
  const activeProjects = projects.filter(p => 
    !['Completed', 'Picked Up'].includes(p.status)
  );
  const readyForPickup = projects.filter(p => p.status === 'Ready');
  const outstandingBalance = invoices.reduce((sum, i) => sum + i.balance_due, 0);
  const ytdRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Get oldest active jobs (> 30 days)
  const oldJobs = activeProjects
    .filter(p => daysSince(p.status_updated_at) > 30)
    .sort((a, b) => daysSince(b.status_updated_at) - daysSince(a.status_updated_at))
    .slice(0, 5);

  // Projects by status for visualization
  const statusCounts = {
    'Received': projects.filter(p => p.status === 'Received').length,
    'In Progress': projects.filter(p => p.status === 'In Progress').length,
    'At Tannery': projects.filter(p => p.status === 'At Tannery').length,
    'Finishing': projects.filter(p => p.status === 'Finishing').length,
    'Ready': projects.filter(p => p.status === 'Ready').length,
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{activeProjects.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ready for Pickup</p>
              <p className="text-2xl font-bold text-gray-900">{readyForPickup.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(outstandingBalance)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">YTD Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(ytdRevenue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Status */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">Projects by Status</h3>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{status}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        status === 'Ready' ? 'bg-emerald-500' :
                        status === 'At Tannery' ? 'bg-purple-500' :
                        status === 'In Progress' ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${activeProjects.length > 0 ? (count / activeProjects.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="w-8 text-sm font-medium text-gray-900 text-right">{count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ready for Pickup */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Ready for Pickup</h3>
              <Link href="/projects?status=Ready">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {readyForPickup.length === 0 ? (
              <p className="text-gray-500 text-sm">No projects ready for pickup</p>
            ) : (
              <div className="space-y-3">
                {readyForPickup.slice(0, 5).map(proj => {
                  const customer = getCustomer(proj.customer_id);
                  return (
                    <div key={proj.project_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{proj.description}</p>
                        <p className="text-sm text-gray-500">
                          {customer?.first_name} {customer?.last_name}
                        </p>
                      </div>
                      {customer?.phone && (
                        <a 
                          href={`tel:${customer.phone}`}
                          className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Old Jobs Alert */}
      {oldJobs.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Attention Needed</h3>
                <p className="text-sm text-red-600">These projects have been in progress for over 30 days</p>
              </div>
            </div>
            <div className="space-y-2">
              {oldJobs.map(proj => {
                const customer = getCustomer(proj.customer_id);
                const days = daysSince(proj.status_updated_at);
                return (
                  <div key={proj.project_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{proj.description}</p>
                      <p className="text-sm text-gray-500">
                        {customer?.first_name} {customer?.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={proj.status} type="project" />
                      <p className="text-xs text-red-600 mt-1">{days} days</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
