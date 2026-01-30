'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, Input, Modal, Select } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatCurrency, SERVICE_CATEGORIES } from '@/lib/utils';
import { Plus, Search, Tag } from 'lucide-react';
import type { ServiceFormData } from '@/lib/types';

function PriceBookContent() {
  const searchParams = useSearchParams();
  const { services, addService, updateService, loading } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-open modal if ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);
  const [editingService, setEditingService] = useState<typeof services[0] | null>(null);
  const [form, setForm] = useState<ServiceFormData>({
    category: SERVICE_CATEGORIES[0],
    species: '',
    mount_type: '',
    description: '',
    base_price: 0,
  });

  const categories = [...new Set(services.map(s => s.category))];

  const filtered = services.filter(s => {
    const matchesSearch = `${s.description} ${s.species} ${s.mount_type}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by category, then by species
  const groupedByCategory = filtered.reduce((acc, service) => {
    const category = service.category || 'Other';
    const species = service.species || 'General';
    if (!acc[category]) acc[category] = {};
    if (!acc[category][species]) acc[category][species] = [];
    acc[category][species].push(service);
    return acc;
  }, {} as Record<string, Record<string, typeof services>>);

  const openNew = () => {
    setEditingService(null);
    setForm({ category: SERVICE_CATEGORIES[0], species: '', mount_type: '', description: '', base_price: 0 });
    setShowModal(true);
  };

  const openEdit = (service: typeof services[0]) => {
    setEditingService(service);
    setForm({
      category: service.category,
      species: service.species,
      mount_type: service.mount_type,
      description: service.description,
      base_price: service.base_price,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // Prevent double submission

    setSaving(true);
    try {
      if (editingService) {
        await updateService({ ...editingService, ...form });
      } else {
        await addService(form);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Book</h1>
          <p className="text-gray-500">{services.length} services</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="pl-10"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Categories' },
            ...categories.map(c => ({ value: c, label: c })),
          ]}
          className="w-48"
        />
      </div>

      {Object.entries(groupedByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, speciesGroups]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">{category}</h2>
          {Object.entries(speciesGroups).sort(([a], [b]) => a.localeCompare(b)).map(([species, speciesServices]) => (
            <div key={species} className="ml-2">
              <h3 className="font-semibold text-gray-600 mb-2 text-sm uppercase tracking-wide">{species}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {speciesServices.map(service => (
                  <Card key={service.service_id} hover onClick={() => openEdit(service)}>
                    <CardContent className="flex items-center gap-3 py-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Tag className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{service.mount_type || service.description}</p>
                        <p className="text-xs text-gray-500 truncate">{service.description}</p>
                      </div>
                      <p className="font-semibold text-gray-900 flex-shrink-0">{formatCurrency(service.base_price)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingService ? 'Edit Service' : 'New Service'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={SERVICE_CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Species"
              value={form.species}
              onChange={(e) => setForm({ ...form, species: e.target.value })}
              placeholder="e.g., Whitetail"
            />
            <Input
              label="Mount Type"
              value={form.mount_type}
              onChange={(e) => setForm({ ...form, mount_type: e.target.value })}
              placeholder="e.g., Shoulder"
            />
          </div>
          <Input
            label="Description"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Full service description"
          />
          <Input
            label="Base Price"
            type="number"
            required
            value={form.base_price}
            onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Saving...' : editingService ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function PriceBookPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
        <PriceBookContent />
      </Suspense>
    </AppShell>
  );
}
