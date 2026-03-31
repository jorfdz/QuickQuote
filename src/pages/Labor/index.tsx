import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit3, Search, Clock, X, Info, Copy,
} from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import type { PricingLabor } from '../../types/pricing';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) => `$${n.toFixed(2)}`;

// ─── Form Defaults ──────────────────────────────────────────────────────────
const emptyLaborForm = {
  name: '',
  description: '',
  hourlyCost: 0,
  initialSetupFee: 0,
  markupPercent: 0,
  categoryIds: [] as string[],
  isFixedCharge: false,
  fixedChargeAmount: 0,
  fixedChargeCost: 0,
  minimumCharge: 0,
  outputPerHour: 1,
  notes: '',
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const Labor: React.FC = () => {
  const {
    labor, addLabor, updateLabor, deleteLabor,
    categories,
  } = usePricingStore();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLaborForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Category lookup map ──
  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.id, c.name));
    return m;
  }, [categories]);

  // ── Filtered list ──
  const filteredLabor = useMemo(() => {
    let list = labor;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      list = list.filter(l => l.categoryIds?.includes(filterCategory));
    }
    return list;
  }, [labor, search, filterCategory]);

  // ── Compute sell rate ──
  const computeSellRate = (hourlyCost: number, markupPercent: number) =>
    hourlyCost * (1 + markupPercent / 100);

  // ── Handlers ──
  const openNewModal = () => {
    setForm(emptyLaborForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (l: PricingLabor) => {
    setEditingId(l.id);
    setForm({
      name: l.name,
      description: l.description || '',
      hourlyCost: l.hourlyCost,
      initialSetupFee: l.initialSetupFee,
      markupPercent: l.markupPercent,
      categoryIds: l.categoryIds || [],
      isFixedCharge: l.isFixedCharge ?? false,
      fixedChargeAmount: l.fixedChargeAmount ?? 0,
      fixedChargeCost: l.fixedChargeCost ?? 0,
      minimumCharge: l.minimumCharge ?? 0,
      outputPerHour: l.outputPerHour ?? 1,
      notes: l.notes || '',
    });
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
      hourlyCost: form.hourlyCost,
      initialSetupFee: form.initialSetupFee,
      markupPercent: form.markupPercent,
      categoryIds: form.categoryIds,
      isFixedCharge: form.isFixedCharge,
      fixedChargeAmount: form.fixedChargeAmount,
      fixedChargeCost: form.fixedChargeCost,
      minimumCharge: form.minimumCharge,
      outputPerHour: form.outputPerHour,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateLabor(editingId, payload);
    } else {
      addLabor(payload);
    }
    closeModal();
  };

  const handleClone = (l: PricingLabor) => {
    addLabor({
      name: `${l.name} (Copy)`,
      description: l.description,
      hourlyCost: l.hourlyCost,
      initialSetupFee: l.initialSetupFee,
      markupPercent: l.markupPercent,
      categoryIds: l.categoryIds || [],
      isFixedCharge: l.isFixedCharge ?? false,
      fixedChargeAmount: l.fixedChargeAmount ?? 0,
      fixedChargeCost: l.fixedChargeCost ?? 0,
      minimumCharge: l.minimumCharge ?? 0,
      outputPerHour: l.outputPerHour ?? 1,
      notes: l.notes,
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

  const sellRate = computeSellRate(form.hourlyCost, form.markupPercent);

  // ── Render ──
  return (
    <div>
      <PageHeader
        title="Labor"
        subtitle={`${labor.length} labor service${labor.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
            Add Labor
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
              placeholder="Search labor services..."
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
        <Table headers={['Name', 'Description', 'Categories', 'Hourly Cost', 'Setup Fee', 'Markup %', 'Sell Rate', 'Actions']}>
          {filteredLabor.map(l => {
            const sr = computeSellRate(l.hourlyCost, l.markupPercent);
            const catNames = (l.categoryIds || [])
              .map(id => categoryMap.get(id))
              .filter(Boolean)
              .join(', ');

            return (
              <tr
                key={l.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openEditModal(l)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{l.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 max-w-[180px] truncate">
                  {l.description || '—'}
                </td>
                <td className="py-3 px-4">
                  {catNames ? (
                    <div className="flex flex-wrap gap-1">
                      {(l.categoryIds || []).map(id => {
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
                <td className="py-3 px-4 text-sm text-gray-700">{formatCurrency(l.hourlyCost)}/hr</td>
                <td className="py-3 px-4 text-sm text-gray-500">{formatCurrency(l.initialSetupFee)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{l.markupPercent}%</td>
                <td className="py-3 px-4 text-sm font-medium text-blue-700">{formatCurrency(sr)}/hr</td>
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(l)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleClone(l)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                      title="Clone"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirm === l.id ? (
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => { deleteLabor(l.id); setDeleteConfirm(null); }}
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
                        onClick={() => setDeleteConfirm(l.id)}
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
        {filteredLabor.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No labor services found</p>
          </div>
        )}
      </Card>

      {/* ═══════════════ ADD / EDIT MODAL ═══════════════ */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Labor Service' : 'Add Labor Service'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Name + Description */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Graphic Design, Installation"
            />
            <Input
              label="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description"
            />
          </div>

          {/* Hourly Cost, Setup Fee, Markup */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Hourly Cost ($)"
              type="number"
              value={form.hourlyCost || ''}
              onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))}
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

          {/* Computed sell rate */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Sell Rate (Hourly Cost + Markup):
              </span>
              <span className="font-semibold text-blue-700">{formatCurrency(sellRate)}/hr</span>
            </div>
          </div>

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

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!form.name}
            >
              {editingId ? 'Save Changes' : 'Add Labor'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
