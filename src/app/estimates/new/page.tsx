'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, Input, Select, Modal } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatCurrency, SERVICE_CATEGORIES } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { LineItemFormData, Service, ServiceFormData } from '@/lib/types';

function NewEstimateContent() {
  const router = useRouter();
  const { customers, services, categories, species: speciesLookup, mountTypes, addEstimate, addService, addSpecies, loading } = useData();
  const [saving, setSaving] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemFormData[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Service selector state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');

  // Quick-add modals
  const [showAddSpeciesModal, setShowAddSpeciesModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [newSpeciesName, setNewSpeciesName] = useState('');
  const [newServiceForm, setNewServiceForm] = useState<ServiceFormData>({
    category: '',
    species: '',
    mount_type: '',
    description: '',
    base_price: 0,
  });

  // Feedback for added items
  const [justAddedService, setJustAddedService] = useState<string | null>(null);
  const [addingSpecies, setAddingSpecies] = useState(false);

  // Get categories sorted by sort_order
  const categoryList = useMemo(() => {
    if (categories.length > 0) {
      return [...categories].sort((a, b) => a.sort_order - b.sort_order);
    }
    // Fallback: derive from services if no lookup tables
    const cats = [...new Set(services.filter(s => s.is_active).map(s => s.category))];
    return cats.map(c => ({ category_id: c, name: c, icon: '', sort_order: 0 }));
  }, [categories, services]);

  // Get species for selected category
  const speciesForCategory = useMemo(() => {
    if (!selectedCategory) return [];

    if (speciesLookup.length > 0) {
      return speciesLookup
        .filter(s => s.category === selectedCategory)
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    // Fallback: derive from services
    const specs = [...new Set(services.filter(s => s.is_active && s.category === selectedCategory).map(s => s.species))];
    return specs.map(s => ({ species_id: s, category: selectedCategory, name: s || 'General', sort_order: 0 }));
  }, [selectedCategory, speciesLookup, services]);

  // Get services for selected category and species
  const servicesForSelection = useMemo(() => {
    if (!selectedCategory || !selectedSpecies) return [];
    return services.filter(s =>
      s.is_active &&
      s.category === selectedCategory &&
      s.species === selectedSpecies
    );
  }, [selectedCategory, selectedSpecies, services]);

  // Reset species when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSpecies('');
  };

  // Handle species dropdown change
  const handleSpeciesChange = (value: string) => {
    if (value === '__add_new__') {
      setNewSpeciesName('');
      setShowAddSpeciesModal(true);
    } else {
      setSelectedSpecies(value);
    }
  };

  // Handle service dropdown change
  const handleServiceChange = (value: string) => {
    if (value === '__add_new__') {
      setNewServiceForm({
        category: selectedCategory,
        species: selectedSpecies,
        mount_type: '',
        description: '',
        base_price: 0,
      });
      setShowAddServiceModal(true);
    } else if (value) {
      addServiceItem(value);
    }
  };

  // Handle adding a new species
  const handleAddSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingSpecies) return;

    const name = newSpeciesName.trim();
    if (name && selectedCategory) {
      setAddingSpecies(true);
      try {
        const newSpec = await addSpecies(selectedCategory, name);
        // Select the new species
        setSelectedSpecies(newSpec.name);
        setShowAddSpeciesModal(false);
      } finally {
        setAddingSpecies(false);
      }
    }
  };

  // Handle adding a new service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingService) return;

    setAddingService(true);
    try {
      const newService = await addService(newServiceForm);
      // Auto-add the new service to line items
      if (newService) {
        setLineItems(prev => [...prev, {
          service_id: newService.service_id,
          description: newService.description,
          species: newService.species,
          mount_type: newService.mount_type,
          quantity: 1,
          unit_price: newService.base_price,
        }]);
        // Update selected category/species to match new service
        setSelectedCategory(newService.category);
        setSelectedSpecies(newService.species);
        // Show feedback
        setJustAddedService(newService.service_id);
        setTimeout(() => setJustAddedService(null), 3000);
      }
      setShowAddServiceModal(false);
    } finally {
      setAddingService(false);
    }
  };

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
    if (saving) return; // Prevent double submission

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
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <Link href="/customers?new=true">
                  <Button variant="outline" className="h-full px-4">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">New</span>
                  </Button>
                </Link>
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

            {/* Three-step service selector: Category → Species → Service */}
            <div className="p-3 bg-gray-50 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Category */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">1. Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
                  >
                    <option value="">Choose category...</option>
                    {categoryList.map(cat => (
                      <option key={cat.category_id || cat.name} value={cat.name}>
                        {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Species */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">2. Species</label>
                  <select
                    value={selectedSpecies}
                    onChange={(e) => handleSpeciesChange(e.target.value)}
                    disabled={!selectedCategory}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">{selectedCategory ? 'Choose species...' : 'Select category first'}</option>
                    {speciesForCategory.map(spec => (
                      <option key={spec.species_id || spec.name} value={spec.name}>
                        {spec.name}
                      </option>
                    ))}
                    {selectedCategory && (
                      <option value="__add_new__" className="text-amber-600 font-medium">+ Add New Species</option>
                    )}
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">3. Service</label>
                  <select
                    disabled={!selectedSpecies}
                    onChange={(e) => {
                      handleServiceChange(e.target.value);
                      e.target.value = '';
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">{selectedSpecies ? 'Choose service...' : 'Select species first'}</option>
                    {servicesForSelection.map(service => (
                      <option key={service.service_id} value={service.service_id}>
                        {service.mount_type || service.description} - {formatCurrency(service.base_price)}
                      </option>
                    ))}
                    {selectedSpecies && (
                      <option value="__add_new__" className="text-amber-600 font-medium">+ Add New Service</option>
                    )}
                  </select>
                </div>
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
                <div
                  key={index}
                  className={`p-4 rounded-xl space-y-3 transition-colors ${
                    justAddedService && item.service_id === justAddedService
                      ? 'bg-green-50 border-2 border-green-300'
                      : 'bg-gray-50'
                  }`}
                >
                  {justAddedService && item.service_id === justAddedService && (
                    <div className="text-xs text-green-600 font-medium">✓ Just added to estimate</div>
                  )}
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

      {/* Add Species Modal */}
      <Modal
        open={showAddSpeciesModal}
        onClose={() => setShowAddSpeciesModal(false)}
        title="Add New Species"
      >
        <form onSubmit={handleAddSpecies} className="space-y-4">
          <p className="text-sm text-gray-500">
            Add a new species for <strong>{selectedCategory}</strong>
          </p>
          <Input
            label="Species Name"
            required
            value={newSpeciesName}
            onChange={(e) => setNewSpeciesName(e.target.value)}
            placeholder="e.g., Mule Deer, Pheasant, Walleye"
            autoFocus
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddSpeciesModal(false)} disabled={addingSpecies}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={addingSpecies}>
              {addingSpecies ? 'Adding...' : 'Add Species'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Service Modal */}
      <Modal
        open={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        title="Add New Service"
      >
        <form onSubmit={handleAddService} className="space-y-4">
          <Select
            label="Category"
            value={newServiceForm.category}
            onChange={(e) => setNewServiceForm({ ...newServiceForm, category: e.target.value })}
            options={SERVICE_CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Species"
              value={newServiceForm.species}
              onChange={(e) => setNewServiceForm({ ...newServiceForm, species: e.target.value })}
              placeholder="e.g., Whitetail"
            />
            <Input
              label="Mount Type"
              value={newServiceForm.mount_type}
              onChange={(e) => setNewServiceForm({ ...newServiceForm, mount_type: e.target.value })}
              placeholder="e.g., Shoulder"
            />
          </div>
          <Input
            label="Description"
            required
            value={newServiceForm.description}
            onChange={(e) => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
            placeholder="Full service description"
          />
          <Input
            label="Base Price"
            type="number"
            required
            value={newServiceForm.base_price}
            onChange={(e) => setNewServiceForm({ ...newServiceForm, base_price: Number(e.target.value) })}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddServiceModal(false)} disabled={addingService}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={addingService}>
              {addingService ? 'Adding...' : 'Add & Use Service'}
            </Button>
          </div>
        </form>
      </Modal>
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
