'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, Input, Select } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { LineItemFormData, Service } from '@/lib/types';

function NewEstimateContent() {
  const router = useRouter();
  const { customers, services, addEstimate, loading } = useData();
  const [saving, setSaving] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemFormData[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Service selector state
  const [selectedSpecies, setSelectedSpecies] = useState('');

  // Group services by species
  const servicesBySpecies = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    services.filter(s => s.is_active).forEach(service => {
      const key = service.species || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(service);
    });
    // Sort species alphabetically
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [services]);

  // Get unique species list
  const speciesList = Object.keys(servicesBySpecies);

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const search = customerSearch.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(search) ||
      c.last_name.toLowerCase().includes(search) ||
      c.phone.includes(search)
    );
  });

  // Calculate totals
  const subtotal = lineItems.reduce((sum, li) => sum + (li.quantity * li.unit_price), 0);

  // Add line item from service
  const addServiceItem = (serviceId: string) => {
    const service = services.find(s => s.service_id === serviceId);
    if (!service) return;

    setLineItems(prev => [...prev, {
      service_id: service.service_id,
      description: service.description,
      species: service.species,
      mount_type: service.mount_type,
      quantity: 1,
      unit_price: service.base_price,
    }]);
  };

  // Add custom line item
  const addCustomItem = () => {
    setLineItems(prev => [...prev, {
      description: '',
      quantity: 1,
      unit_price: 0,
    }]);
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof LineItemFormData, value: string | number) => {
    setLineItems(prev => prev.map((li, i) =>
      i === index ? { ...li, [field]: value } : li
    ));
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save estimate
  const handleSave = async () => {
    if (!customerId) {
      alert('Please select a customer');
      return;
    }
    if (lineItems.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    setSaving(true);
    try {
      const estimateId = await addEstimate({
        customer_id: customerId,
        notes,
        line_items: lineItems,
      });
      router.push(`/estimates/${estimateId}`);
    } catch (error) {
      console.error('Failed to create estimate:', error);
      alert('Failed to create estimate');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  const selectedCustomer = customers.find(c => c.customer_id === customerId);

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/estimates" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">New Estimate</h1>
          <p className="text-sm text-gray-500">Create a new estimate for a customer</p>
        </div>
      </div>

      {/* Customer Selection */}
      <Card>
        <CardContent>
          <h2 className="font-semibold text-gray-900 mb-4">Customer</h2>

          {selectedCustomer ? (
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </p>
                <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCustomerId('')}>
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredCustomers.slice(0, 10).map(customer => (
                  <button
                    key={customer.customer_id}
                    onClick={() => {
                      setCustomerId(customer.customer_id);
                      setCustomerSearch('');
                    }}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <p className="font-medium text-gray-900">
                      {customer.first_name} {customer.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <p className="text-center py-4 text-gray-500">No customers found</p>
                )}
              </div>

              <Link href="/customers?new=true" className="block">
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4" />
                  Add New Customer
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
              <Button variant="outline" size="sm" onClick={addCustomItem}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Custom Item</span>
              </Button>
            </div>

            {/* Two-step service selector */}
            <div className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">1. Select Species</label>
                <select
                  value={selectedSpecies}
                  onChange={(e) => setSelectedSpecies(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
                >
                  <option value="">Choose species...</option>
                  {speciesList.map(species => (
                    <option key={species} value={species}>
                      {species} ({servicesBySpecies[species].length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:flex items-end pb-2">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">2. Select Service</label>
                <select
                  disabled={!selectedSpecies}
                  onChange={(e) => {
                    if (e.target.value) {
                      addServiceItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">{selectedSpecies ? 'Choose service...' : 'Select species first'}</option>
                  {selectedSpecies && servicesBySpecies[selectedSpecies]?.map(service => (
                    <option key={service.service_id} value={service.service_id}>
                      {service.mount_type || service.description} - {formatCurrency(service.base_price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items added yet. Add from the price book or create a custom item.
            </div>
          ) : (
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <button
                      onClick={() => removeLineItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Species"
                      value={item.species || ''}
                      onChange={(e) => updateLineItem(index, 'species', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <input
                      type="text"
                      placeholder="Mount Type"
                      value={item.mount_type || ''}
                      onChange={(e) => updateLineItem(index, 'mount_type', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  <div className="text-right font-semibold text-gray-900">
                    Line Total: {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent>
          <h2 className="font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for this estimate..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
          />
        </CardContent>
      </Card>

      {/* Summary & Actions */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-500">Estimate Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(subtotal)}</p>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <Link href="/estimates" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full">Cancel</Button>
              </Link>
              <Button
                onClick={handleSave}
                disabled={saving || !customerId || lineItems.length === 0}
                className="flex-1 sm:flex-none"
              >
                {saving ? 'Saving...' : 'Create Estimate'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewEstimatePage() {
  return (
    <AppShell>
      <NewEstimateContent />
    </AppShell>
  );
}
