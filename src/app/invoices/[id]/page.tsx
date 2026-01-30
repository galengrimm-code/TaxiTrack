'use client';

import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, StatusBadge, DocumentActions, PrintableDocument } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';

function InvoiceDetailContent({ invoiceId }: { invoiceId: string }) {
  const {
    invoices,
    customers,
    getCustomer,
    getInvoiceLineItems,
    getInvoicePayments,
    settings,
    loading
  } = useData();

  const invoice = invoices.find(i => i.invoice_id === invoiceId);
  const customer = invoice ? getCustomer(invoice.customer_id) : undefined;
  const lineItems = invoice ? getInvoiceLineItems(invoice.invoice_id) : [];
  const payments = invoice ? getInvoicePayments(invoice.invoice_id) : [];

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Invoice not found</p>
        <Link href="/invoices" className="text-amber-600 hover:underline">
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-4xl mx-auto">
      {/* Header - Hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Invoice {invoice.invoice_id}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={invoice.status} type="invoice" />
              <span className="text-sm text-gray-500">{formatDate(invoice.date_created)}</span>
            </div>
          </div>
        </div>

        <DocumentActions
          title={`Invoice ${invoice.invoice_id}`}
          documentId={invoice.invoice_id}
          getShareData={() => ({
            title: `Invoice ${invoice.invoice_id}`,
            text: `Invoice for ${customer?.first_name} ${customer?.last_name} - ${formatCurrency(invoice.total)}`,
            url: window.location.href,
          })}
        />
      </div>

      {/* Printable Invoice */}
      <PrintableDocument>
        <Card>
          <CardContent className="p-6 lg:p-8">
            {/* Invoice Header */}
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
                <h1 className="text-3xl font-bold text-amber-600 mb-2">INVOICE</h1>
                <p className="text-gray-600"><span className="font-medium">Invoice #:</span> {invoice.invoice_id}</p>
                <p className="text-gray-600"><span className="font-medium">Date:</span> {formatDate(invoice.date_created)}</p>
                <div className="mt-2">
                  <StatusBadge status={invoice.status} type="invoice" />
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Bill To</h3>
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
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Tax ({invoice.tax_rate}%)</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal * invoice.tax_rate / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-gray-900">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between py-2 text-green-600">
                  <span>Amount Paid</span>
                  <span className="font-medium">{formatCurrency(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between py-3 bg-amber-50 px-4 -mx-4 rounded-lg">
                  <span className="text-lg font-bold text-amber-700">Balance Due</span>
                  <span className="text-lg font-bold text-amber-700">{formatCurrency(invoice.balance_due)}</span>
                </div>
              </div>
            </div>

            {/* Payments History */}
            {payments.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Payment History</h3>
                <div className="space-y-2">
                  {payments.map(payment => (
                    <div key={payment.payment_id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {formatDate(payment.date)} - {payment.method}
                      </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
              <p>Thank you for your business!</p>
            </div>
          </CardContent>
        </Card>
      </PrintableDocument>
    </div>
  );
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <InvoiceDetailContent invoiceId={params.id} />
    </AppShell>
  );
}
