import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit3, Search, Handshake, Info, Copy, X, Building2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { usePricingStore } from '../../store/pricingStore';
import { useStore } from '../../store';
import { Button, Card, PageHeader, Table, Modal, Input, Tabs } from '../../components/ui';
import type { PricingBrokered, BrokeredCostBasis } from '../../types/pricing';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) => `$${n.toFixed(2)}`;

const COST_BASIS_OPTIONS: { value: BrokeredCostBasis; label: string }[] = [
  { value: 'per_unit', label: 'Per Unit' },
  { value: 'per_sqft', label: 'Per Sq Ft' },
  { value: 'per_linear_ft', label: 'Per Linear Ft' },
  { value: 'flat', label: 'Flat Rate' },
];

const costBasisLabel = (v: string) =>
  COST_BASIS_OPTIONS.find(o => o.value === v)?.label ?? v;

const unitCostLabel = (basis: BrokeredCostBasis): string => {
  switch (basis) {
    case 'per_unit': return '$/unit';
    case 'per_sqft': return '$/sqft';
    case 'per_linear_ft': return '$/linear ft';
    case 'flat': return '$ flat';
  }
};

// ─── Form Defaults ──────────────────────────────────────────────────────────
const emptyBrokeredForm = {
  name: '',
  description: '',
  costBasis: 'per_unit' as BrokeredCostBasis,
  unitCost: 0,
  initialSetupFee: 0,
  markupPercent: 0,
  vendorId: '' as string | undefined,
  vendorName: '' as string | undefined,
  categoryIds: [] as string[],
  notes: '',
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const Brokered: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    brokered, addBrokered, updateBrokered, deleteBrokered,
    categories,
  } = usePricingStore();

  const { vendors } = useStore();

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBrokeredForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState('details');

  // ── Category lookup map ──
  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.id, c.name));
    return m;
  }, [categories]);

  // ── Selected vendor details ──
  const selectedVendor = useMemo(() => {
    if (!form.vendorId) return null;
    return vendors.find(v => v.id === form.vendorId) ?? null;
  }, [vendors, form.vendorId]);

  // ── Filtered list ──
  const filteredBrokered = useMemo(() => {
    let list = brokered;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        (b.vendorName || '').toLowerCase().includes(q) ||
        (b.notes || '').toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      list = list.filter(b => b.categoryIds?.includes(filterCategory));
    }
    return list;
  }, [brokered, search, filterCategory]);

  // ── Handlers ──
  const openNewModal = () => {
    setForm(emptyBrokeredForm);
    setEditingId(null);
    setModalTab('details');
    setShowModal(true);
  };

  const openEditModal = (b: PricingBrokered) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      description: b.description || '',
      costBasis: b.costBasis,
      unitCost: b.unitCost,
      initialSetupFee: b.initialSetupFee,
      markupPercent: b.markupPercent,
      vendorId: b.vendorId || '',
      vendorName: b.vendorName || '',
      categoryIds: b.categoryIds || [],
      notes: b.notes || '',
    });
    setModalTab('details');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = () => {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      costBasis: form.costBasis,
      unitCost: form.unitCost,
      initialSetupFee: form.initialSetupFee,
      markupPercent: form.markupPercent,
      vendorId: form.vendorId || undefined,
      vendorName: form.vendorName || undefined,
      categoryIds: form.categoryIds,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateBrokered(editingId, payload);
    } else {
      addBrokered(payload);
    }
    closeModal();
  };

  const handleClone = (b: PricingBrokered) => {
    addBrokered({
      name: `${b.name} (Copy)`,
      description: b.description,
      costBasis: b.costBasis,
      unitCost: b.unitCost,
      initialSetupFee: b.initialSetupFee,
      markupPercent: b.markupPercent,
      vendorId: b.vendorId,
      vendorName: b.vendorName,
      categoryIds: b.categoryIds || [],
      notes: b.notes,
    });
  };

  const toggleCategory = (catId: string) => {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter(id => id !== catId)
        : [...f.categoryIds, catId],
    }));
  };

  const handleVendorSelect = (vendorId: string) => {
    if (!vendorId) {
      setForm(f => ({ ...f, vendorId: '', vendorName: '' }));
      return;
    }
    const v = vendors.find(x => x.id === vendorId);
    if (v) {
      setForm(f => ({ ...f, vendorId: v.id, vendorName: v.name }));
    }
  };

  // ── Render ──
  return (
    <div>
      <PageHeader
        title="Brokered"
        subtitle={`${brokered.length} brokered service${brokered.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
            Add Brokered
          </Button>
        }
      />

      {/* Search + Filter */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search brokered services..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table headers={['Name', 'Description', 'Categories', 'Cost Basis', 'Unit Cost', 'Setup Fee', 'Markup %', 'Vendor', 'Actions']}>
          {filteredBrokered.map(b => {
            const catNames = (b.categoryIds || [])
              .map(id => categoryMap.get(id))
              .filter(Boolean)
              .join(', ');

            return (
              <tr
                key={b.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openEditModal(b)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Handshake className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{b.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 max-w-[160px] truncate">
                  {b.description || '—'}
                </td>
                <td className="py-3 px-4">
                  {catNames ? (
                    <div className="flex flex-wrap gap-1">
                      {(b.categoryIds || []).map(id => {
                        const name = categoryMap.get(id);
                        return name ? (
                          <span key={id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{name}</span>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {costBasisLabel(b.costBasis)}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{formatCurrency(b.unitCost)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{formatCurrency(b.initialSetupFee)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{b.markupPercent}%</td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {b.vendorName ? (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-gray-400" />
                      {b.vendorName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleClone(b)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                      title="Clone"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirm === b.id ? (
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => { deleteBrokered(b.id); setDeleteConfirm(null); }}
                          className="px-2 py-0.5 text-xs bg-red-600 text-white rounded"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-0.5 text-xs text-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(b.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
        {filteredBrokered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Handshake className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No brokered services found</p>
          </div>
        )}
      </Card>

      {/* ═══════════════ ADD / EDIT MODAL ═══════════════ */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Brokered Service' : 'Add Brokered Service'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <Tabs
            tabs={[
              { id: 'details', label: 'Details' },
              { id: 'vendor', label: 'Vendor' },
            ]}
            active={modalTab}
            onChange={setModalTab}
          />

          {/* ── Details Tab ── */}
          {modalTab === 'details' && (
            <div className="space-y-4">
              {/* Name + Description */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Banners, Embroidery"
                />
                <Input
                  label="Description (optional)"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description"
                />
              </div>

              {/* Cost Basis */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Cost Basis
                </label>
                <select
                  value={form.costBasis}
                  onChange={e => setForm(f => ({ ...f, costBasis: e.target.value as BrokeredCostBasis }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COST_BASIS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Unit Cost, Setup Fee, Markup */}
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label={`Unit Cost (${unitCostLabel(form.costBasis)})`}
                  type="number"
                  value={form.unitCost || ''}
                  onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))}
                  prefix="$"
                />
                <Input
                  label="Initial Setup Fee ($)"
                  type="number"
                  value={form.initialSetupFee || ''}
                  onChange={e => setForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))}
                  prefix="$"
                />
                <Input
                  label="Markup %"
                  type="number"
                  value={form.markupPercent || ''}
                  onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))}
                  suffix="%"
                />
              </div>

              {/* Computed sell price info */}
              {form.unitCost > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Sell Price ({unitCostLabel(form.costBasis)}):
                    </span>
                    <span className="font-semibold text-blue-700">
                      {formatCurrency(form.unitCost * (1 + form.markupPercent / 100))}
                    </span>
                  </div>
                </div>
              )}

              {/* Categories multi-select */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Categories
                </label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {categories.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No categories defined</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(c => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.categoryIds.includes(c.id)}
                          onChange={() => toggleCategory(c.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <Input
                label="Notes (optional)"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes"
              />
            </div>
          )}

          {/* ── Vendor Tab ── */}
          {modalTab === 'vendor' && (
            <div className="space-y-4">
              {/* Vendor Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Assign Vendor
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.vendorId || ''}
                    onChange={e => handleVendorSelect(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  {form.vendorId && (
                    <button
                      onClick={() => handleVendorSelect('')}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Clear vendor"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Vendor Details */}
              {selectedVendor ? (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">{selectedVendor.name}</span>
                    {selectedVendor.isOutsourcedProduction && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Production</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">Address</span>
                      <p className="text-gray-700 mt-0.5">
                        {[selectedVendor.address, selectedVendor.city, selectedVendor.state, selectedVendor.zip]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">Phone</span>
                      <p className="text-gray-700 mt-0.5">{selectedVendor.phone || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">Email</span>
                      <p className="text-gray-700 mt-0.5">{selectedVendor.email || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">Account #</span>
                      <p className="text-gray-700 mt-0.5">{selectedVendor.accountNumber || '—'}</p>
                    </div>
                  </div>
                  {selectedVendor.notes && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">Notes</span>
                      <p className="text-sm text-gray-600 mt-0.5">{selectedVendor.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No vendor assigned</p>
                  <p className="text-xs mt-1">Select a vendor from the dropdown above</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!form.name}
            >
              {editingId ? 'Save Changes' : 'Add Brokered'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
