import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Trash2, Edit3, Search, Scissors, Copy, Settings, X, Info,
} from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import type { PricingFinishing, FinishingGroup } from '../../types/pricing';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`;

const CHARGE_BASIS_OPTIONS: { value: PricingFinishing['chargeBasis']; label: string }[] = [
  { value: 'per_unit', label: 'Per Unit' },
  { value: 'per_sqft', label: 'Per Sq Ft' },
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'per_stack_pass', label: 'Per Stack Pass' },
  { value: 'flat', label: 'Flat Rate' },
];

const COST_TYPE_OPTIONS: { value: PricingFinishing['costType']; label: string }[] = [
  { value: 'cost_only', label: 'Cost Only' },
  { value: 'cost_plus_time', label: 'Cost + Time' },
  { value: 'time_only', label: 'Time Only' },
];

const chargeBasisLabel = (v: string) =>
  CHARGE_BASIS_OPTIONS.find(o => o.value === v)?.label ?? v;

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const Tooltip: React.FC<{ label: string; tip: string }> = ({ label, tip }) => (
  <div className="relative group inline-flex items-center gap-1">
    <span>{label}</span>
    <Info className="w-3 h-3 text-gray-400" />
    <div className="invisible group-hover:visible absolute bottom-full left-0 mb-1 w-56 p-2 text-[10px] bg-gray-900 text-white rounded-lg shadow-lg z-10">
      {tip}
    </div>
  </div>
);

// ─── Product Search Dropdown ─────────────────────────────────────────────────
const ProductMultiSelect: React.FC<{
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}> = ({ selectedIds, onChange }) => {
  const { products } = usePricingStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return products.filter(p => !selectedIds.includes(p.id));
    const q = query.toLowerCase();
    return products.filter(p => !selectedIds.includes(p.id) && p.name.toLowerCase().includes(q));
  }, [products, query, selectedIds]);

  const selectedProducts = useMemo(
    () => products.filter(p => selectedIds.includes(p.id)),
    [products, selectedIds]
  );

  return (
    <div ref={ref}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        Products (optional)
      </label>
      <div className="relative">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search products to assign..."
          className="w-full px-3 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
            {filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange([...selectedIds, p.id]); setQuery(''); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedProducts.map(p => (
            <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-medium">
              {p.name}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter(id => id !== p.id))}
                className="hover:text-purple-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Form Defaults ──────────────────────────────────────────────────────────
const emptyForm = {
  name: '',
  description: '',
  categoryIds: [] as string[],
  finishingGroupIds: [] as string[],
  productIds: [] as string[],
  chargeBasis: 'per_unit' as PricingFinishing['chargeBasis'],
  costType: 'time_only' as PricingFinishing['costType'],
  unitCost: 0,
  hourlyCost: 0,
  outputPerHour: 0,
  initialSetupFee: 0,
  markupPercent: 0,
  sheetsPerStack: 500,
  passesPerHour: 150,
  notes: '',
};

const emptyGroupForm = {
  name: '',
  description: '',
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const Finishing: React.FC = () => {
  const {
    finishing, addFinishing, updateFinishing, deleteFinishing,
    finishingGroups, addFinishingGroup, updateFinishingGroup, deleteFinishingGroup,
    categories, products,
  } = usePricingStore();

  // ── State ──
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Group manager state
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<string | null>(null);

  // ── Lookup maps ──
  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const groupMap = useMemo(() => {
    const m = new Map<string, string>();
    finishingGroups.forEach(g => m.set(g.id, g.name));
    return m;
  }, [finishingGroups]);

  // ── Filtered list ──
  const filteredFinishing = useMemo(() => {
    let list = finishing;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q) ||
        (f.notes || '').toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      list = list.filter(f => f.categoryIds.includes(filterCategory));
    }
    if (filterGroup) {
      list = list.filter(f => f.finishingGroupIds.includes(filterGroup));
    }
    return list;
  }, [finishing, search, filterCategory, filterGroup]);

  // ── Cost computation helpers ──
  const computeCostPerUnit = (f: typeof form) => {
    if (f.chargeBasis === 'per_stack_pass') {
      const passes = f.passesPerHour || 150;
      const sheets = f.sheetsPerStack || 500;
      if (passes > 0 && sheets > 0 && f.hourlyCost > 0) {
        return f.hourlyCost / passes / sheets;
      }
      return 0;
    }
    if (f.chargeBasis === 'per_unit') {
      if (f.costType === 'cost_only') return f.unitCost;
      if (f.costType === 'time_only' && f.outputPerHour > 0) return f.hourlyCost / f.outputPerHour;
      if (f.costType === 'cost_plus_time') {
        const timePart = f.outputPerHour > 0 ? f.hourlyCost / f.outputPerHour : 0;
        return f.unitCost + timePart;
      }
      return 0;
    }
    if (f.chargeBasis === 'per_sqft') {
      if (f.costType === 'cost_only') return f.unitCost;
      if (f.costType === 'time_only' && f.outputPerHour > 0) return f.hourlyCost / f.outputPerHour;
      if (f.costType === 'cost_plus_time') {
        const timePart = f.outputPerHour > 0 ? f.hourlyCost / f.outputPerHour : 0;
        return f.unitCost + timePart;
      }
      return 0;
    }
    if (f.chargeBasis === 'per_hour') return f.hourlyCost;
    if (f.chargeBasis === 'flat') return f.unitCost;
    return 0;
  };

  const costPerUnit = computeCostPerUnit(form);
  const sellPerUnit = costPerUnit > 0 && form.markupPercent > 0
    ? costPerUnit * (1 + form.markupPercent / 100)
    : costPerUnit;

  // ── Cost/Rate display for table ──
  const getCostRateDisplay = (f: PricingFinishing) => {
    switch (f.chargeBasis) {
      case 'per_stack_pass':
        return `${f.passesPerHour ?? 150}/hr \u00b7 ${f.sheetsPerStack ?? 500}/stack`;
      case 'per_unit':
        if (f.costType === 'cost_only') return `${formatCurrency(f.unitCost)}/ea`;
        return `${f.outputPerHour.toLocaleString()}/hr`;
      case 'per_sqft':
        return `${formatCurrency(f.unitCost)}/sqft`;
      case 'per_hour':
        return `${formatCurrency(f.hourlyCost)}/hr`;
      case 'flat':
        return `${formatCurrency(f.unitCost)} flat`;
      default:
        return '\u2014';
    }
  };

  // ── Handlers ──
  const openNewModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (f: PricingFinishing) => {
    setEditingId(f.id);
    setForm({
      name: f.name,
      description: f.description || '',
      categoryIds: [...f.categoryIds],
      finishingGroupIds: [...f.finishingGroupIds],
      productIds: [...f.productIds],
      chargeBasis: f.chargeBasis,
      costType: f.costType,
      unitCost: f.unitCost,
      hourlyCost: f.hourlyCost,
      outputPerHour: f.outputPerHour,
      initialSetupFee: f.initialSetupFee,
      markupPercent: f.markupPercent,
      sheetsPerStack: f.sheetsPerStack ?? 500,
      passesPerHour: f.passesPerHour ?? 150,
      notes: f.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.name || form.categoryIds.length === 0) return;
    const payload: Omit<PricingFinishing, 'id' | 'createdAt'> = {
      name: form.name,
      description: form.description || undefined,
      categoryIds: form.categoryIds,
      finishingGroupIds: form.finishingGroupIds,
      productIds: form.productIds,
      chargeBasis: form.chargeBasis,
      costType: form.costType,
      unitCost: form.unitCost,
      hourlyCost: form.hourlyCost,
      outputPerHour: form.outputPerHour,
      initialSetupFee: form.initialSetupFee,
      markupPercent: form.markupPercent,
      sheetsPerStack: form.chargeBasis === 'per_stack_pass' ? form.sheetsPerStack : undefined,
      passesPerHour: form.chargeBasis === 'per_stack_pass' ? form.passesPerHour : undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateFinishing(editingId, payload);
    } else {
      addFinishing(payload);
    }
    closeModal();
  };

  const handleClone = (f: PricingFinishing) => {
    setEditingId(null);
    setForm({
      name: `Clone of ${f.name}`,
      description: f.description || '',
      categoryIds: [...f.categoryIds],
      finishingGroupIds: [...f.finishingGroupIds],
      productIds: [...f.productIds],
      chargeBasis: f.chargeBasis,
      costType: f.costType,
      unitCost: f.unitCost,
      hourlyCost: f.hourlyCost,
      outputPerHour: f.outputPerHour,
      initialSetupFee: f.initialSetupFee,
      markupPercent: f.markupPercent,
      sheetsPerStack: f.sheetsPerStack ?? 500,
      passesPerHour: f.passesPerHour ?? 150,
      notes: f.notes || '',
    });
    setShowModal(true);
  };

  const toggleCategory = (catId: string) => {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter(id => id !== catId)
        : [...f.categoryIds, catId],
    }));
  };

  const toggleFinishingGroup = (gId: string) => {
    setForm(f => ({
      ...f,
      finishingGroupIds: f.finishingGroupIds.includes(gId)
        ? f.finishingGroupIds.filter(id => id !== gId)
        : [...f.finishingGroupIds, gId],
    }));
  };

  // ── Group Manager Handlers ──
  const handleOpenGroupForm = (group?: FinishingGroup) => {
    if (group) {
      setEditingGroupId(group.id);
      setGroupForm({ name: group.name, description: group.description || '' });
    } else {
      setEditingGroupId(null);
      setGroupForm(emptyGroupForm);
    }
    setShowGroupForm(true);
  };

  const handleSaveGroup = () => {
    if (!groupForm.name) return;
    if (editingGroupId) {
      updateFinishingGroup(editingGroupId, {
        name: groupForm.name,
        description: groupForm.description || undefined,
      });
    } else {
      addFinishingGroup({
        name: groupForm.name,
        description: groupForm.description || undefined,
      });
    }
    setShowGroupForm(false);
    setEditingGroupId(null);
  };

  const handleDeleteGroup = (id: string) => {
    deleteFinishingGroup(id);
    setDeleteGroupConfirm(null);
  };

  // ── Render ──
  return (
    <div>
      <PageHeader
        title="Finishing Services"
        subtitle={`${finishing.length} finishing service${finishing.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Settings className="w-4 h-4" />} onClick={() => setShowGroupManager(true)}>
              Manage Groups
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
              Add Service
            </Button>
          </div>
        }
      />

      {/* Filters Bar */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search finishing services..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Groups</option>
            {finishingGroups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">{filteredFinishing.length} results</span>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table headers={['Name', 'Description', 'Group(s)', 'Categories', 'Charge Basis', 'Cost/Rate', 'Setup Fee', 'Markup %', 'Actions']}>
          {filteredFinishing.map(f => (
            <tr
              key={f.id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => openEditModal(f)}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-900">{f.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 max-w-[180px]">
                <span className="text-xs text-gray-400 truncate block">{f.description || '\u2014'}</span>
              </td>
              <td className="py-3 px-4">
                {f.finishingGroupIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {f.finishingGroupIds.map(gid => {
                      const name = groupMap.get(gid);
                      return name ? (
                        <span key={gid} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{name}</span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{'\u2014'}</span>
                )}
              </td>
              <td className="py-3 px-4">
                {f.categoryIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {f.categoryIds.map(id => {
                      const name = categoryMap.get(id);
                      return name ? (
                        <span key={id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{name}</span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{'\u2014'}</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {chargeBasisLabel(f.chargeBasis)}
                  </span>
                  {f.chargeBasis === 'per_stack_pass' && (
                    <div className="relative group">
                      <Info className="w-3 h-3 text-gray-400" />
                      <div className="invisible group-hover:visible absolute bottom-full left-0 mb-1 w-56 p-2 text-[10px] bg-gray-900 text-white rounded-lg shadow-lg z-10">
                        Batch processing — multiple sheets processed per pass (e.g., cutting 500 sheets at once)
                      </div>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-700 font-medium whitespace-nowrap">
                {getCostRateDisplay(f)}
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {f.initialSetupFee > 0 ? formatCurrency(f.initialSetupFee) : '\u2014'}
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">{f.markupPercent}%</td>
              <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(f)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleClone(f)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                    title="Clone"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {deleteConfirm === f.id ? (
                    <div className="flex gap-1 items-center">
                      <button
                        onClick={() => { deleteFinishing(f.id); setDeleteConfirm(null); }}
                        className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700"
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
          ))}
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
        <div className="space-y-5">
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Info</h3>
            <div className="space-y-3">
              <Input
                label="Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Cut, Tri-Fold, Laminate Sheet"
              />
              <Input
                label="Description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detailed description of the service"
              />
            </div>
          </div>

          {/* Section 2: Assignment */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assignment</h3>
            <div className="space-y-4">
              {/* Categories (required) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Categories <span className="text-red-400">*</span>
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
                {form.categoryIds.length === 0 && (
                  <p className="text-[10px] text-red-400 mt-1">At least one category is required</p>
                )}
              </div>

              {/* Finishing Groups */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Finishing Groups
                </label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {finishingGroups.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No finishing groups defined</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {finishingGroups.map(g => (
                      <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.finishingGroupIds.includes(g.id)}
                          onChange={() => toggleFinishingGroup(g.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{g.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Products multi-select */}
              <ProductMultiSelect
                selectedIds={form.productIds}
                onChange={ids => setForm(f => ({ ...f, productIds: ids }))}
              />
            </div>
          </div>

          {/* Section 3: Pricing Model */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pricing Model</h3>
            <div className="space-y-4">
              {/* Row 1: Charge Basis + Cost Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Charge Basis
                  </label>
                  <select
                    value={form.chargeBasis}
                    onChange={e => setForm(f => ({ ...f, chargeBasis: e.target.value as PricingFinishing['chargeBasis'] }))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {CHARGE_BASIS_OPTIONS.map(o => (
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {COST_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Dynamic fields based on chargeBasis + costType */}
              {form.chargeBasis === 'per_stack_pass' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Hourly Cost ($)"
                      type="number"
                      value={form.hourlyCost || ''}
                      onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))}
                      prefix="$"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        <Tooltip
                          label="Sheets Per Stack"
                          tip="How many sheets of paper can be processed at once. Example: A guillotine cutter can cut 500 sheets in a single pass."
                        />
                      </label>
                      <input
                        type="number"
                        value={form.sheetsPerStack || ''}
                        onChange={e => setForm(f => ({ ...f, sheetsPerStack: parseInt(e.target.value) || 0 }))}
                        placeholder="e.g. 500"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        <Tooltip
                          label="Passes Per Hour"
                          tip="How many batch passes can be completed per hour. Example: 150 cuts per hour on a guillotine cutter."
                        />
                      </label>
                      <input
                        type="number"
                        value={form.passesPerHour || ''}
                        onChange={e => setForm(f => ({ ...f, passesPerHour: parseInt(e.target.value) || 0 }))}
                        placeholder="e.g. 150"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      />
                    </div>
                  </div>
                  {form.hourlyCost > 0 && (form.passesPerHour || 0) > 0 && (form.sheetsPerStack || 0) > 0 && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                      Cost per sheet: <span className="font-semibold text-gray-900">{formatCurrency(form.hourlyCost / (form.passesPerHour || 150) / (form.sheetsPerStack || 500))}</span>
                    </div>
                  )}
                </div>
              )}

              {form.chargeBasis === 'per_unit' && (
                <div className="grid grid-cols-3 gap-4">
                  {(form.costType === 'time_only' || form.costType === 'cost_plus_time') && (
                    <>
                      <Input
                        label="Output/Hour"
                        type="number"
                        value={form.outputPerHour || ''}
                        onChange={e => setForm(f => ({ ...f, outputPerHour: parseInt(e.target.value) || 0 }))}
                        placeholder="e.g. 5000"
                      />
                      <Input
                        label="Hourly Cost ($)"
                        type="number"
                        value={form.hourlyCost || ''}
                        onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))}
                        prefix="$"
                      />
                    </>
                  )}
                  {(form.costType === 'cost_only' || form.costType === 'cost_plus_time') && (
                    <Input
                      label="Unit Cost ($)"
                      type="number"
                      value={form.unitCost || ''}
                      onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))}
                      prefix="$"
                    />
                  )}
                </div>
              )}

              {form.chargeBasis === 'per_sqft' && (
                <div className="grid grid-cols-3 gap-4">
                  {(form.costType === 'cost_only' || form.costType === 'cost_plus_time') && (
                    <Input
                      label="Unit Cost ($/sqft)"
                      type="number"
                      value={form.unitCost || ''}
                      onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))}
                      prefix="$"
                    />
                  )}
                  {(form.costType === 'time_only' || form.costType === 'cost_plus_time') && (
                    <>
                      <Input
                        label="Hourly Cost ($)"
                        type="number"
                        value={form.hourlyCost || ''}
                        onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))}
                        prefix="$"
                      />
                      <Input
                        label="Output/Hour (sqft/hr)"
                        type="number"
                        value={form.outputPerHour || ''}
                        onChange={e => setForm(f => ({ ...f, outputPerHour: parseInt(e.target.value) || 0 }))}
                        placeholder="e.g. 200"
                      />
                    </>
                  )}
                </div>
              )}

              {form.chargeBasis === 'per_hour' && (
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Hourly Cost ($)"
                    type="number"
                    value={form.hourlyCost || ''}
                    onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))}
                    prefix="$"
                  />
                </div>
              )}

              {form.chargeBasis === 'flat' && (
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Flat Rate ($)"
                    type="number"
                    value={form.unitCost || ''}
                    onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))}
                    prefix="$"
                  />
                </div>
              )}

              {/* Row 3: Setup Fee + Markup */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Setup Fee ($)"
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

              {/* Computed summary box */}
              {costPerUnit > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Cost per {form.chargeBasis === 'per_stack_pass' ? 'sheet' : form.chargeBasis === 'per_sqft' ? 'sqft' : form.chargeBasis === 'per_hour' ? 'hour' : form.chargeBasis === 'flat' ? 'job' : 'unit'}:
                    </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(costPerUnit)}</span>
                  </div>
                  {form.markupPercent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">+ {form.markupPercent}% markup:</span>
                      <span className="font-medium text-blue-700">{formatCurrency(sellPerUnit)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notes</h3>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!form.name || form.categoryIds.length === 0}
            >
              {editingId ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════ MANAGE GROUPS MODAL ═══════════════ */}
      <Modal
        isOpen={showGroupManager}
        onClose={() => { setShowGroupManager(false); setShowGroupForm(false); }}
        title="Manage Finishing Groups"
        size="lg"
      >
        <div className="space-y-4">
          {/* Group list */}
          {!showGroupForm && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{finishingGroups.length} finishing groups</p>
                <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => handleOpenGroupForm()}>
                  Add Group
                </Button>
              </div>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {finishingGroups.map(g => (
                  <div key={g.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{g.name}</p>
                      {g.description && <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      {deleteGroupConfirm === g.id ? (
                        <div className="flex gap-1 items-center">
                          <button onClick={() => handleDeleteGroup(g.id)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                          <button onClick={() => setDeleteGroupConfirm(null)} className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => handleOpenGroupForm(g)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteGroupConfirm(g.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {finishingGroups.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No finishing groups yet</div>
                )}
              </div>
            </>
          )}

          {/* Group add/edit form */}
          {showGroupForm && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{editingGroupId ? 'Edit Group' : 'New Group'}</h3>
                <button onClick={() => { setShowGroupForm(false); setEditingGroupId(null); }} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <Input label="Group Name" value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Cutting & Trimming" />
              <Input label="Description" value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description" />
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" size="sm" onClick={() => { setShowGroupForm(false); setEditingGroupId(null); }}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleSaveGroup} disabled={!groupForm.name}>
                  {editingGroupId ? 'Save Changes' : 'Add Group'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
