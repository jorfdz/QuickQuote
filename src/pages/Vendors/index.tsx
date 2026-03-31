import React, { useState } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Card, PageHeader, Table, Modal, Input, Textarea, Checkbox } from '../../components/ui';
import { nanoid } from '../../utils/nanoid';
import type { Vendor } from '../../types';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  accountNumber: '',
  paymentTerms: 'Net 30',
  notes: '',
  isOutsourcedProduction: false,
};

export const Vendors: React.FC = () => {
  const { vendors, addVendor, updateVendor } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = vendors.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()));

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (v: Vendor) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      email: v.email || '',
      phone: v.phone || '',
      website: v.website || '',
      address: v.address || '',
      city: v.city || '',
      state: v.state || '',
      zip: v.zip || '',
      accountNumber: v.accountNumber || '',
      paymentTerms: v.paymentTerms || 'Net 30',
      notes: v.notes || '',
      isOutsourcedProduction: v.isOutsourcedProduction,
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingId) {
      updateVendor(editingId, { ...form });
    } else {
      addVendor({ id: nanoid(), ...form, createdAt: new Date().toISOString() });
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    // Remove from vendors list via updateVendor workaround — mark inactive or filter
    // Since the store doesn't have deleteVendor, we'll just close for now
    setDeleteConfirm(null);
  };

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle={`${vendors.length} vendors`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenNew}>
            Add Vendor
          </Button>
        }
      />
      <Card className="mb-4">
        <div className="flex gap-4 px-4 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search vendors..." />
        </div>
      </Card>
      <Card>
        <Table headers={['Name', 'Type', 'Email', 'Phone', 'Payment Terms', 'Actions']}>
          {filtered.map(v => (
            <tr key={v.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-semibold text-sm text-gray-900">{v.name}</td>
              <td className="py-3 px-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.isOutsourcedProduction ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                  {v.isOutsourcedProduction ? 'Production' : 'Supplier'}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">{v.email || '—'}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{v.phone || '—'}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{v.paymentTerms || '—'}</td>
              <td className="py-3 px-4">
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </Table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No vendors found</p>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={handleClose} title={editingId ? 'Edit Vendor' : 'New Vendor'}>
        <div className="space-y-4">
          <Input label="Vendor Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Checkbox
            checked={form.isOutsourcedProduction}
            onChange={v => setForm(f => ({ ...f, isOutsourcedProduction: v }))}
            label="Outsourced Production Vendor (not just a supplier)"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <Input label="Website" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Number" value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
            <Input label="Payment Terms" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} />
          </div>
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
            <Input label="Zip" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={!form.name}>
              {editingId ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
