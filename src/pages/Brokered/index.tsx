import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit3, Search, Handshake, Info, Copy, X, Building2, Settings,
  TrendingUp, Tag, Lock,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { usePricingStore } from '../../store/pricingStore';
import { useStore } from '../../store';
import { Button, Card, PageHeader, Table, Modal, Input, Tabs } from '../../components/ui';
import type { PricingBrokered, BrokeredCostBasis, BrokeredGroup, ServicePricingMode, SellRateTier } from '../../types/pricing';
import { nanoid } from '../../utils/nanoid';

const fmt = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

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
  brokeredGroupIds: [] as string[],
  autoAddCategoryIds: [] as string[],
  notes: '',
  pricingMode: 'cost_markup' as ServicePricingMode,
  sellRate: 0,
  sellRateTiers: [] as SellRateTier[],
};

const PRICING_MODES_BROKERED = [
  { id: 'cost_markup' as ServicePricingMode, label: 'Cost + Markup', icon: TrendingUp },
  { id: 'rate_card'   as ServicePricingMode, label: 'Rate Card',     icon: Tag        },
  { id: 'fixed'       as ServicePricingMode, label: 'Fixed Charge',  icon: Lock       },
];

const emptyGroupForm = { name: '', description: '' };

// ─── Main Component ─────────────────────────────────────────────────────────
export const Brokered: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    brokered, addBrokered, updateBrokered, deleteBrokered,
    brokeredGroups, addBrokeredGroup, updateBrokeredGroup, deleteBrokeredGroup,
    categories,
  } = usePricingStore();

  const { vendors } = useStore();

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBrokeredForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState('details');

  // Group manager state
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<string | null>(null);

  // ── Category lookup map ──
  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.id, c.name));
    return m;
  }, [categories]);

  // ── Group lookup map ──
  const groupMap = useMemo(() => {
    const m = new Map<string, string>();
    brokeredGroups.forEach(g => m.set(g.id, g.name));
    return m;
  }, [brokeredGroups]);

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
    if (filterGroup) {
      list = list.filter(b => b.brokeredGroupIds?.includes(filterGroup));
    }
    return list;
  }, [brokered, search, filterCategory, filterGroup]);

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
      brokeredGroupIds: b.brokeredGroupIds || [],
      autoAddCategoryIds: [...(b.autoAddCategoryIds ?? [])],
      notes: b.notes || '',
      pricingMode: b.pricingMode ?? 'cost_markup',
      sellRate: b.sellRate ?? 0,
      sellRateTiers: b.sellRateTiers ? [...b.sellRateTiers] : [],
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
      brokeredGroupIds: form.brokeredGroupIds,
      autoAddCategoryIds: form.autoAddCategoryIds.length > 0 ? form.autoAddCategoryIds : undefined,
      notes: form.notes || undefined,
      pricingMode: form.pricingMode,
      sellRate: form.pricingMode === 'rate_card' ? form.sellRate : undefined,
      sellRateTiers: form.pricingMode === 'rate_card' && form.sellRateTiers.length > 0 ? form.sellRateTiers : undefined,
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
      brokeredGroupIds: b.brokeredGroupIds || [],
      autoAddCategoryIds: b.autoAddCategoryIds ? [...b.autoAddCategoryIds] : undefined,
      notes: b.notes,
      pricingMode: b.pricingMode,
      sellRate: b.sellRate,
      sellRateTiers: b.sellRateTiers ? [...b.sellRateTiers] : undefined,
    });
  };

  const toggleCategory = (catId: string) => {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter(id => id !== catId)
        : [...f.categoryIds, catId],
      autoAddCategoryIds: f.categoryIds.includes(catId)
        ? (f.autoAddCategoryIds ?? []).filter(id => id !== catId)
        : (f.autoAddCategoryIds ?? []),
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

  const toggleBrokeredGroup = (gId: string) => {
    setForm(f => ({
      ...f,
      brokeredGroupIds: f.brokeredGroupIds.includes(gId)
        ? f.brokeredGroupIds.filter(id => id !== gId)
        : [...f.brokeredGroupIds, gId],
    }));
  };

  // ── Group Manager Handlers ──
  const handleOpenGroupForm = (group?: BrokeredGroup) => {
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
      updateBrokeredGroup(editingGroupId, {
        name: groupForm.name,
        description: groupForm.description || undefined,
      });
    } else {
      addBrokeredGroup({
        name: groupForm.name,
        description: groupForm.description || undefined,
      });
    }
    setShowGroupForm(false);
    setEditingGroupId(null);
  };

  const handleDeleteGroup = (id: string) => {
    deleteBrokeredGroup(id);
    setDeleteGroupConfirm(null);
  };

  // ── Render ──
  return (
    <div>
      <PageHeader
        title="Brokered"
        subtitle={`${brokered.length} brokered service${brokered.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Settings className="w-4 h-4" />} onClick={() => setShowGroupManager(true)}>
              Manage Groups
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
              Add Brokered
            </Button>
          </div>
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
          <div>
            <select
              value={filterGroup}
              onChange={e => setFilterGroup(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Groups</option>
              {brokeredGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cost Basis</label>
                <select value={form.costBasis} onChange={e => setForm(f => ({ ...f, costBasis: e.target.value as BrokeredCostBasis }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {COST_BASIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* ── Pricing Mode selector ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pricing Mode</label>
                <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                  {PRICING_MODES_BROKERED.map(m => {
                    const Icon = m.icon;
                    const active = form.pricingMode === m.id;
                    return (
                      <button key={m.id} type="button"
                        onClick={() => setForm(f => ({ ...f, pricingMode: m.id }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── COST + MARKUP ── */}
              {form.pricingMode === 'cost_markup' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <Input label={`Unit Cost (${unitCostLabel(form.costBasis)})`} type="number" value={form.unitCost || ''}
                      onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                    <Input label="Markup %" type="number" value={form.markupPercent || ''}
                      onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))} suffix="%" />
                    <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''}
                      onChange={e => setForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
                  </div>
                  {form.unitCost > 0 && (
                    <div className="text-[11px] text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                      {/* Sell = unit cost × (1 + markup) + setup fee (setup fee added flat, not marked up) */}
                      Sell: <span className="font-semibold text-blue-700">
                        {fmt(form.unitCost * (1 + form.markupPercent / 100) + (form.initialSetupFee || 0))}
                      </span>
                      {form.initialSetupFee > 0 && (
                        <span className="ml-1 text-gray-400">
                          ({fmt(form.unitCost * (1 + form.markupPercent / 100))} + {fmt(form.initialSetupFee)} setup)
                        </span>
                      )}
                      {' · '}Margin: <span className="font-semibold">{pct((form.markupPercent / (100 + form.markupPercent)) * 100)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── RATE CARD ── */}
              {form.pricingMode === 'rate_card' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label={`Cost Rate (${unitCostLabel(form.costBasis)})`} type="number" value={form.unitCost || ''}
                      onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                    <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''}
                      onChange={e => setForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
                  </div>
                  {/* Sell rate section */}
                  <div className="rounded-xl border-2 border-blue-100 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Client Sell Rate</span>
                      <span className="text-[10px] text-blue-500">— what you charge the client independently of your cost</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label={`Sell Rate (${unitCostLabel(form.costBasis)})`} type="number" value={form.sellRate || ''}
                        onChange={e => setForm(f => ({ ...f, sellRate: parseFloat(e.target.value) || 0 }))} prefix="$" />
                      {form.unitCost > 0 && form.sellRate > 0 && (
                        <div className="flex items-end pb-1">
                          <div className="text-[11px] text-gray-600 bg-white rounded-md px-3 py-2 border border-blue-100">
                            Cost: <span className="font-semibold">{fmt(form.unitCost)}</span>
                            {' · '}Sell: <span className="font-semibold text-blue-700">{fmt(form.sellRate)}</span>
                            {' · '}Margin: <span className={`font-semibold ${form.sellRate > form.unitCost ? 'text-emerald-600' : 'text-red-500'}`}>
                              {pct(((form.sellRate - form.unitCost) / form.sellRate) * 100)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Volume Tiers */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Volume Tiers <span className="font-normal text-blue-400 normal-case">(optional)</span></span>
                        <button type="button"
                          onClick={() => setForm(f => ({ ...f, sellRateTiers: [...f.sellRateTiers, { id: nanoid(), fromQty: 0, toQty: null, sellRate: 0 }] }))}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors">
                          <Plus className="w-3 h-3" /> Add Tier
                        </button>
                      </div>
                      {form.sellRateTiers.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 px-1">
                            <span className="text-[9px] font-semibold text-gray-400 uppercase">From Qty</span>
                            <span className="text-[9px] font-semibold text-gray-400 uppercase">To Qty (blank = ∞)</span>
                            <span className="text-[9px] font-semibold text-gray-400 uppercase">Sell Rate</span>
                            <span />
                          </div>
                          {form.sellRateTiers.map((tier, idx) => (
                            <div key={tier.id} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 items-center">
                              <input type="number" value={tier.fromQty || ''} placeholder="0"
                                onChange={e => setForm(f => { const t = [...f.sellRateTiers]; t[idx] = { ...t[idx], fromQty: parseFloat(e.target.value) || 0 }; return { ...f, sellRateTiers: t }; })}
                                className="px-2 py-1 text-xs bg-white border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
                              <input type="number" value={tier.toQty ?? ''} placeholder="∞"
                                onChange={e => setForm(f => { const t = [...f.sellRateTiers]; t[idx] = { ...t[idx], toQty: e.target.value ? parseFloat(e.target.value) : null }; return { ...f, sellRateTiers: t }; })}
                                className="px-2 py-1 text-xs bg-white border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
                              <input type="number" value={tier.sellRate || ''} placeholder="0.00"
                                onChange={e => setForm(f => { const t = [...f.sellRateTiers]; t[idx] = { ...t[idx], sellRate: parseFloat(e.target.value) || 0 }; return { ...f, sellRateTiers: t }; })}
                                className="px-2 py-1 text-xs bg-white border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
                              <button type="button" onClick={() => setForm(f => ({ ...f, sellRateTiers: f.sellRateTiers.filter((_, i) => i !== idx) }))}
                                className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── FIXED CHARGE ── */}
              {form.pricingMode === 'fixed' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Your Cost ($)" type="number" value={form.unitCost || ''}
                      onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                    <Input label="Client Charge ($)" type="number" value={form.initialSetupFee || ''}
                      onChange={e => setForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
                  </div>
                  {form.unitCost > 0 && form.initialSetupFee > 0 && (
                    <div className="text-[11px] text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                      Markup: <span className="font-semibold">{pct(((form.initialSetupFee - form.unitCost) / form.unitCost) * 100)}</span>
                      <span className="text-gray-400 ml-1">({fmt(form.unitCost)} cost → {fmt(form.initialSetupFee)} charge)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Categories + Brokered Groups side by side */}
              <div className="grid grid-cols-2 gap-4">
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

                {/* Brokered Groups multi-select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Brokered Groups
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {brokeredGroups.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No groups defined</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {brokeredGroups.map(g => (
                        <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.brokeredGroupIds.includes(g.id)}
                            onChange={() => toggleBrokeredGroup(g.id)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{g.name}</span>
                        </label>
                      ))}
                    </div>
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

      {/* ═══════════════ MANAGE GROUPS MODAL ═══════════════ */}
      <Modal
        isOpen={showGroupManager}
        onClose={() => { setShowGroupManager(false); setShowGroupForm(false); }}
        title="Manage Brokered Groups"
        size="lg"
      >
        <div className="space-y-4">
          {/* Group list */}
          {!showGroupForm && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{brokeredGroups.length} brokered groups</p>
                <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => handleOpenGroupForm()}>
                  Add Group
                </Button>
              </div>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {brokeredGroups.map(g => (
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
                {brokeredGroups.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No brokered groups yet</div>
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
                placeholder="e.g. Outsourced Print" />
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
