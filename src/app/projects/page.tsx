'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout';
import { Card, CardContent, Button, StatusBadge, Modal, Input, Select } from '@/components/ui';
import { useData } from '@/lib/DataContext';
import { formatDate, PROJECT_STATUSES } from '@/lib/utils';
import { Briefcase, Send } from 'lucide-react';

function ProjectsContent() {
  const { projects, customers, getCustomer, updateProjectStatus, batchUpdateProjects, loading } = useData();
  const [filter, setFilter] = useState<string>('active');
  const [selected, setSelected] = useState<string[]>([]);
  const [showTanneryModal, setShowTanneryModal] = useState(false);
  const [tanneryForm, setTanneryForm] = useState({ tannery: '', date: new Date().toISOString().split('T')[0], notes: '' });

  const filtered = projects.filter(p => {
    if (filter === 'active') return !['Completed', 'Picked Up'].includes(p.status);
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleStatusChange = async (projectId: string, status: string) => {
    await updateProjectStatus(projectId, status);
  };

  const handleSendToTannery = async () => {
    const note = `Sent to ${tanneryForm.tannery} on ${formatDate(tanneryForm.date)}${tanneryForm.notes ? ` - ${tanneryForm.notes}` : ''}`;
    await batchUpdateProjects(selected, 'At Tannery', note);
    setSelected([]);
    setShowTanneryModal(false);
    setTanneryForm({ tannery: '', date: new Date().toISOString().split('T')[0], notes: '' });
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500">{filtered.length} projects</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['active', 'Received', 'In Progress', 'At Tannery', 'Finishing', 'Ready', 'all'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'active' ? 'Active' : status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Batch Actions */}
      {selected.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium text-amber-800">{selected.length} projects selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected([])}>Clear</Button>
            <Button size="sm" onClick={() => setShowTanneryModal(true)}>
              <Send className="w-4 h-4" />
              Send to Tannery
            </Button>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        {filtered.map(project => {
          const customer = getCustomer(project.customer_id);
          const canSelect = !['At Tannery', 'Ready', 'Completed', 'Picked Up'].includes(project.status);
          
          return (
            <Card key={project.project_id}>
              <CardContent className="flex items-center gap-4">
                {canSelect && (
                  <input
                    type="checkbox"
                    checked={selected.includes(project.project_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected([...selected, project.project_id]);
                      } else {
                        setSelected(selected.filter(id => id !== project.project_id));
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                )}
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{project.description}</p>
                  <p className="text-sm text-gray-500">
                    {customer?.first_name} {customer?.last_name} • {project.project_id}
                  </p>
                </div>
                <Select
                  value={project.status}
                  onChange={(e) => handleStatusChange(project.project_id, e.target.value)}
                  options={PROJECT_STATUSES.map(s => ({ value: s.value, label: s.label }))}
                  className="w-40"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tannery Modal */}
      <Modal
        open={showTanneryModal}
        onClose={() => setShowTanneryModal(false)}
        title="Send to Tannery"
      >
        <div className="space-y-4">
          <Input
            label="Tannery Name"
            value={tanneryForm.tannery}
            onChange={(e) => setTanneryForm({ ...tanneryForm, tannery: e.target.value })}
            placeholder="Enter tannery name"
          />
          <Input
            label="Date Sent"
            type="date"
            value={tanneryForm.date}
            onChange={(e) => setTanneryForm({ ...tanneryForm, date: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={tanneryForm.notes}
              onChange={(e) => setTanneryForm({ ...tanneryForm, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowTanneryModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSendToTannery} disabled={!tanneryForm.tannery}>
              Send to Tannery
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AppShell>
      <ProjectsContent />
    </AppShell>
  );
}
