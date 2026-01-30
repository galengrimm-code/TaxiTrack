'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, Input, Modal } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatPhone, formatDate } from '@/lib/utils';
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { CustomerFormData } from '@/lib/types';

function CustomersContent() {
  const { customers, addCustomer, updateCustomer, loading } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<typeof customers[0] | null>(null);
  const [form, setForm] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    city: '',
    state: 'MO',
    notes: '',
  });

  const filtered = customers.filter(c => 
    `${c.first_name} ${c.last_name} ${c.phone} ${c.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditingCustomer(null);
    setForm({ first_name: '', last_name: '', phone: '', email: '', city: '', state: 'MO', notes: '' });
    setShowModal(true);
  };

  const openEdit = (customer: typeof customers[0]) => {
    setEditingCustomer(customer);
    setForm({
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email || '',
      city: customer.city || '',
      state: customer.state || 'MO',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      await updateCustomer({ ...editingCustomer, ...form });
    } else {
      await addCustomer(form);
    }
    setShowModal(false);
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">{customers.length} total customers</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="pl-10"
        />
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(customer => (
          <Card key={customer.customer_id} hover onClick={() => openEdit(customer)}>
            <CardContent>
              <h3 className="font-semibold text-gray-900">
                {customer.first_name} {customer.last_name}
              </h3>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{formatPhone(customer.phone)}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {(customer.city || customer.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{customer.city}{customer.city && customer.state && ', '}{customer.state}</span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Added {formatDate(customer.created_at)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {search ? 'No customers found matching your search' : 'No customers yet. Add your first customer!'}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingCustomer ? 'Edit Customer' : 'New Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
          <Input
            label="Phone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingCustomer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <AppShell>
      <CustomersContent />
    </AppShell>
  );
}
