import React, { useMemo, useState } from 'react';
import { Plus, Edit3, FileText, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Button, SearchInput, Card, PageHeader, Table, Modal, Input, Textarea, Checkbox, Badge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';
import { summarizePOReceiving } from '../../utils/purchaseOrders';
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
  const navigate = useNavigate();
  const { vendors, purchaseOrders, addVendor, updateVendor } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [modalTab, setModalTab] = useState<'details' | 'purchaseOrders'>('details');

  const filtered = vendors.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()));
  const vendorPurchaseOrders = useMemo(() => {
    if (!editingId) return [];

    return purchaseOrders
      .filter((po) => po.vendorId === editingId)
      .sort((a, b) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime());
  }, [editingId, purchaseOrders]);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalTab('details');
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
    setModalTab('details');
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingId(null);
    setModalTab('details');
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
            <tr key={v.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleOpenEdit(v)}>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(v);
                  }}
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
        {editingId && (
          <div className="flex border-b border-gray-200 -mx-5 px-5 mb-5 -mt-1">
            <button
              onClick={() => setModalTab('details')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                modalTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Vendor Details
            </button>
            <button
              onClick={() => setModalTab('purchaseOrders')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                modalTab === 'purchaseOrders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Purchase Orders
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                {vendorPurchaseOrders.length}
              </span>
            </button>
          </div>
        )}

        <div className="min-h-[60vh]">
          {(modalTab === 'details' || !editingId) && (
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
          )}

          {editingId && modalTab === 'purchaseOrders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Linked Purchase Orders</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Sorted from most recent to least recent.</p>
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {vendorPurchaseOrders.length} PO{vendorPurchaseOrders.length === 1 ? '' : 's'}
                </span>
              </div>

              {vendorPurchaseOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                  No purchase orders linked to this vendor yet.
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">PO #</th>
                        <th className="px-3 py-2 text-left font-semibold">Status</th>
                        <th className="px-3 py-2 text-left font-semibold">Created</th>
                        <th className="px-3 py-2 text-left font-semibold">Expected</th>
                        <th className="px-3 py-2 text-left font-semibold">Total</th>
                        <th className="px-3 py-2 text-left font-semibold">Receiving</th>
                        <th className="px-3 py-2 text-left font-semibold">Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorPurchaseOrders.map((po) => {
                        const receiving = summarizePOReceiving(po);

                        return (
                          <tr
                            key={po.id}
                            className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/purchase-orders/${po.id}`)}
                          >
                            <td className="px-3 py-2 font-mono text-xs font-semibold text-gray-600">{po.number}</td>
                            <td className="px-3 py-2"><Badge label={po.status} /></td>
                            <td className="px-3 py-2 text-gray-600">{formatDate(po.createdAt)}</td>
                            <td className="px-3 py-2 text-gray-600">{po.expectedDate ? formatDate(po.expectedDate) : '—'}</td>
                            <td className="px-3 py-2 font-semibold text-gray-900">{formatCurrency(po.total)}</td>
                            <td className="px-3 py-2 text-gray-600">{receiving.received}/{receiving.ordered}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-500">{po.orderId || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
