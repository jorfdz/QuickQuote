import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit3, Search, Scissors, X, Info,
} from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import type { PricingFinishing } from '../../types/pricing';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`;

const UNIT_BASIS_OPTIONS: { value: PricingFinishing['unitBasis']; label: string }[] = [
  { value: 'per_unit', label: 'Per Unit' },
  { value: 'per_sqft', label: 'Per Sq Ft' },
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'per_cut', label: 'Per Cut' },
];

const COST_TYPE_OPTIONS: { value: PricingFinishing['costType']; label: string }[] = [
  { value: 'cost_only', label: 'Cost Only' },
  { value: 'cost_plus_time', label: 'Cost + Time' },
  { value: 'time_only', label: 'Time Only' },
];

const unitBasisLabel = (v: string) =>
  UNIT_BASIS_OPTIONS.find(o => o.value === v)?.label ?? v;

// ─── Form Defaults ──────────────────────────────────────────────────────────
const emptyFinishForm = {
  service: '',
  subservice: '',
  categoryIds: [] as string[],
  unitBasis: 'per_unit' as PricingFinishing['unitBasis'],
  costType: 'time_only' as PricingFinishing['costType'],
  outputPerHour: 0,
  hourlyCost: 0,
  timeCostMarkup: 0,
  sheetsPerCutStack: 500,
  cutsPerHour: 150,
  notes: '',
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const Finishing: React.FC = () => {
  const {
    finishing, addFinishing, updateFinishing, deleteFinishing,
    categories,
  } = usePricingStore();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFinishForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Category lookup map ──
  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.id, c.name));
    return m;
  }, [categories]);

  // ── Filtered list ──
  const filteredFinishing = useMemo(() => {
    let list = finishing;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.service.toLowerCase().includes(q) ||
        (f.subservice || '').toLowerCase().includes(q) ||
        (f.notes || '').toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      list = list.filter(f => f.categoryIds?.includes(filterCategory));
    }
    return list;
  }, [finishing, search, filterCategory]);

  // ── Compute cost per unit ──
  const computeCostPerUnit = (f: typeof form) => {
    if (f.unitBasis === 'per_cut') {
      const stack = f.sheetsPerCutStack || 500;
      const cutsHr = f.cutsPerHour || 150;
      if (cutsHr > 0 && stack > 0) {
        const costPerCut = f.hourlyCost / cutsHr;
        return costPerCut / stack;
      }
      return 0;
    }
    if (f.outputPerHour > 0) {
      return f.hourlyCost / f.outputPerHour;
    }
    return 0;
  };

  // ── Handlers ──
  const openNewModal = () => {
    setForm(emptyFinishForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (f: PricingFinishing) => {
    setEditingId(f.id);
    setForm({
      service: f.service,
      subservice: f.subservice || '',
      categoryIds: f.categoryIds || [],
      unitBasis: f.unitBasis || 'per_unit',
      costType: f.costType,
      outputPerHour: f.outputPerHour,
      hourlyCost: f.hourlyCost,
      timeCostMarkup: f.timeCostMarkup,
      sheetsPerCutStack: f.sheetsPerCutStack ?? 500,
      cutsPerHour: f.cutsPerHour ?? 150,
      notes: f.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = () => {
    const payload = {
      service: form.service,
      subservice: form.subservice || undefined,
      categoryIds: form.categoryIds,
      unitBasis: form.unitBasis,
      costType: form.costType,
      outputPerHour: form.outputPerHour,
      hourlyCost: form.hourlyCost,
      timeCostMarkup: form.timeCostMarkup,
      sheetsPerCutStack: form.unitBasis === 'per_cut' ? form.sheetsPerCutStack : undefined,
      cutsPerHour: form.unitBasis === 'per_cut' ? form.cutsPerHour : undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateFinishing(editingId, payload);
    } else {
      addFinishing(payload);
    }
    closeModal();
  };

  const toggleCategory = (catId: string) => {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter(id => id !== catId)
        : [...f.categoryIds, catId],
    }));
  };

  const costPerUnit = computeCostPerUnit(form);

  // ── Render ──
  return (
    <div>
      <PageHeader
        title="Finishing"
        subtitle={`${finishing.length} finishing service${finishing.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
            Add Finishing
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
              placeholder="Search finishing services..."
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
        <Table headers={['Service', 'Sub-Service', 'Categories', 'Unit Basis', 'Output/Hour', 'Hourly Cost', 'Cost/Unit', 'Markup %', 'Notes', 'Actions']}>
          {filteredFinishing.map(f => {
            const cpu = f.unitBasis === 'per_cut'
              ? ((f.cutsPerHour || 150) > 0 && (f.sheetsPerCutStack || 500) > 0
                ? (f.hourlyCost / (f.cutsPerHour || 150)) / (f.sheetsPerCutStack || 500)
                : 0)
              : (f.outputPerHour > 0 ? f.hourlyCost / f.outputPerHour : 0);
            const catNames = (f.categoryIds || [])
              .map(id => categoryMap.get(id))
              .filter(Boolean)
              .join(', ');

            return (
              <tr
                key={f.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openEditModal(f)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{f.service}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">{f.subservice || '—'}</td>
                <td className="py-3 px-4">
                  {catNames ? (
                    <div className="flex flex-wrap gap-1">
                      {(f.categoryIds || []).map(id => {
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
                    {unitBasisLabel(f.unitBasis || 'per_unit')}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                  {f.unitBasis === 'per_cut'
                    ? `${f.cutsPerHour ?? 150}/hr`
                    : `${f.outputPerHour.toLocaleString()}/hr`}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{formatCurrency(f.hourlyCost)}/hr</td>
                <td className="py-3 px-4 text-sm text-gray-500">{cpu > 0 ? formatCurrency(cpu) : '—'}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{f.timeCostMarkup}%</td>
                <td className="py-3 px-4 text-xs text-gray-400 max-w-[150px] truncate">{f.notes || '—'}</td>
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(f)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirm === f.id ? (
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => { deleteFinishing(f.id); setDeleteConfirm(null); }}
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
                        onClick={() => setDeleteConfirm(f.id)}
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
        {filteredFinishing.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Scissors className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No finishing services found</p>
          </div>
        )}
      </Card>

      {/* ═══════════════ ADD / EDIT MODAL ═══════════════ */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Finishing Service' : 'Add Finishing Service'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Service + Sub-service */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Service"
              value={form.service}
              onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
              placeholder="e.g. Cut, Fold, Drill"
            />
            <Input
              label="Sub-Service (optional)"
              value={form.subservice}
              onChange={e => setForm(f => ({ ...f, subservice: e.target.value }))}
              placeholder="e.g. Tri-Fold, 1 Hole"
            />
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

          {/* Unit Basis + Cost Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Unit Basis
              </label>
              <select
                value={form.unitBasis}
                onChange={e => setForm(f => ({ ...f, unitBasis: e.target.value as PricingFinishing['unitBasis'] }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {UNIT_BASIS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Cost Type
              </label>
              <select
                value={form.costType}
                onChange={e => setForm(f => ({ ...f, costType: e.target.value as PricingFinishing['costType'] }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COST_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Output/Hour, Hourly Cost, Markup */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Output/Hour"
              type="number"
              value={form.outputPerHour || ''}
              onChange={e => setForm(f => ({ ...f, outputPerHour: parseInt(e.target.value) || 0 }))}
              placeholder="e.g. 150"
            />
            <Input
              label="Hourly Cost ($)"
              type="number"
              value={form.hourlyCost || ''}
              onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))}
              prefix="$"
            />
            <Input
              label="Markup %"
              type="number"
              value={form.timeCostMarkup || ''}
              onChange={e => setForm(f => ({ ...f, timeCostMarkup: parseFloat(e.target.value) || 0 }))}
              suffix="%"
            />
          </div>

          {/* Per Cut fields */}
          {form.unitBasis === 'per_cut' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Sheets Per Cut Stack"
                type="number"
                value={form.sheetsPerCutStack || ''}
                onChange={e => setForm(f => ({ ...f, sheetsPerCutStack: parseInt(e.target.value) || 0 }))}
                placeholder="e.g. 500"
              />
              <Input
                label="Cuts Per Hour"
                type="number"
                value={form.cutsPerHour || ''}
                onChange={e => setForm(f => ({ ...f, cutsPerHour: parseInt(e.target.value) || 0 }))}
                placeholder="e.g. 150"
              />
            </div>
          )}

          {/* Computed cost display */}
          {costPerUnit > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Computed Cost per Unit:
                </span>
                <span className="font-semibold text-gray-900">{formatCurrency(costPerUnit)}</span>
              </div>
              {form.timeCostMarkup > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400">Sell per Unit (with {form.timeCostMarkup}% markup):</span>
                  <span className="font-medium text-blue-700">
                    {formatCurrency(costPerUnit * (1 + form.timeCostMarkup / 100))}
                  </span>
                </div>
              )}
            </div>
          )}

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
              disabled={!form.service}
            >
              {editingId ? 'Save Changes' : 'Add Finishing'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
