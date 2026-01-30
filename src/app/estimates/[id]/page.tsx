'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, StatusBadge, DocumentActions, PrintableDocument } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Phone, Mail, MapPin, CheckCircle, FileText } from 'lucide-react';
import Link from 'next/link';

function EstimateDetailContent({ estimateId }: { estimateId: string }) {
  const router = useRouter();
  const {
    estimates,
    getCustomer,
    getEstimateLineItems,
    updateEstimateStatus,
    convertEstimateToInvoice,
    settings,
    loading
  } = useData();

  const [converting, setConverting] = useState(false);

  const estimate = estimates.find(e => e.estimate_id === estimateId);
  const customer = estimate ? getCustomer(estimate.customer_id) : undefined;
  const lineItems = estimate ? getEstimateLineItems(estimate.estimate_id) : [];

  const handleConvertToInvoice = async () => {
    if (!estimate) return;
    setConverting(true);
    try {
      const invoiceId = await convertEstimateToInvoice(estimate.estimate_id);
      router.push(`/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Failed to convert:', error);
      alert('Failed to convert to invoice');
    } finally {
      setConverting(false);
    }
  };

  const handleApprove = async () => {
    if (!estimate) return;
    await updateEstimateStatus(estimate.estimate_id, 'Approved');
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (!estimate) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Estimate not found</p>
        <Link href="/estimates" className="text-amber-600 hover:underline">
          Back to Estimates
        </Link>
      </div>
    );
  }

  const canConvert = estimate.status === 'Approved';
  const canApprove = estimate.status === 'Draft' || estimate.status === 'Sent';

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-4xl mx-auto">
      {/* Header - Hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/estimates" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Estimate {estimate.estimate_id}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={estimate.status} type="estimate" />
              <span className="text-sm text-gray-500">{formatDate(estimate.date_created)}</span>
            </div>
          </div>
        </div>

        <DocumentActions
          title={`Estimate ${estimate.estimate_id}`}
          documentId={estimate.estimate_id}
          getShareData={() => ({
            title: `Estimate ${estimate.estimate_id}`,
            text: `Estimate for ${customer?.first_name} ${customer?.last_name} - ${formatCurrency(estimate.total)}`,
            url: window.location.href,
          })}
        />
      </div>

      {/* Action Buttons - Hidden on print */}
      {(canApprove || canConvert) && (
        <div className="flex flex-wrap gap-3 print:hidden">
          {canApprove && (
            <Button onClick={handleApprove} variant="outline">
              <CheckCircle className="w-4 h-4" />
              Mark Approved
            </Button>
          )}
          {canConvert && (
            <Button onClick={handleConvertToInvoice} disabled={converting}>
              <FileText className="w-4 h-4" />
              {converting ? 'Converting...' : 'Convert to Invoice'}
            </Button>
          )}
        </div>
      )}

      {/* Printable Estimate */}
      <PrintableDocument>
        <Card>
          <CardContent className="p-6 lg:p-8">
            {/* Estimate Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8 pb-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {settings?.business_name || 'TaxiTrack'}
                </h2>
                {settings?.address && <p className="text-gray-600">{settings.address}</p>}
                {settings?.city_state_zip && <p className="text-gray-600">{settings.city_state_zip}</p>}
                {settings?.phone && <p className="text-gray-600">{settings.phone}</p>}
                {settings?.email && <p className="text-gray-600">{settings.email}</p>}
              </div>
              <div className="text-left sm:text-right">
                <h1 className="text-3xl font-bold text-blue-600 mb-2">ESTIMATE</h1>
                <p className="text-gray-600"><span className="font-medium">Estimate #:</span> {estimate.estimate_id}</p>
                <p className="text-gray-600"><span className="font-medium">Date:</span> {formatDate(estimate.date_created)}</p>
                <div className="mt-2">
                  <StatusBadge status={estimate.status} type="estimate" />
                </div>
              </div>
            </div>

            {/* Prepared For */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Prepared For</h3>
              <p className="text-lg font-semibold text-gray-900">
                {customer?.first_name} {customer?.last_name}
              </p>
              {customer?.phone && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {customer.phone}
                </p>
              )}
              {customer?.email && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {customer.email}
                </p>
              )}
              {(customer?.city || customer?.state) && (
                <p className="text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {customer.city}, {customer.state}
                </p>
              )}
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Description</th>
                    <th className="text-center py-3 text-sm font-semibold text-gray-600 hidden sm:table-cell">Qty</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-600 hidden sm:table-cell">Price</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.line_item_id || index} className="border-b border-gray-100">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{item.description}</p>
                        {(item.species || item.mount_type) && (
                          <p className="text-sm text-gray-500">
                            {item.species} {item.mount_type && `- ${item.mount_type}`}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 sm:hidden">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </td>
                      <td className="text-center py-4 text-gray-600 hidden sm:table-cell">{item.quantity}</td>
                      <td className="text-right py-4 text-gray-600 hidden sm:table-cell">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right py-4 font-medium text-gray-900">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(estimate.subtotal)}</span>
                </div>
                {estimate.tax_rate > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Tax ({estimate.tax_rate}%)</span>
                    <span className="font-medium">{formatCurrency(estimate.subtotal * estimate.tax_rate / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-gray-900 bg-gray-50 px-4 -mx-4 rounded-lg">
                  <span className="text-lg font-bold">Estimate Total</span>
                  <span className="text-lg font-bold">{formatCurrency(estimate.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {estimate.notes && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{estimate.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
              <p>This estimate is valid for 30 days.</p>
              <p className="mt-1">Thank you for considering our services!</p>
            </div>
          </CardContent>
        </Card>
      </PrintableDocument>
    </div>
  );
}

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <AppShell>
      <EstimateDetailContent estimateId={resolvedParams.id} />
    </AppShell>
  );
}
