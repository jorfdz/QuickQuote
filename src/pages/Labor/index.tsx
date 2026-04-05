import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit3, Search, Clock, X, Info, Copy, Settings,
  TrendingUp, Tag, Lock,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import type { PricingLabor, LaborGroup, LaborChargeBasis, ServicePricingMode, SellRateTier } from '../../types/pricing';
import { nanoid } from '../../utils/nanoid';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) => `$${n.toFixed(2)}`;

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

// ─── Form Defaults ──────────────────────────────────────────────────────────
// ─── Charge basis options ────────────────────────────────────────────────────
const LABOR_BASIS_OPTIONS: { value: LaborChargeBasis; label: string; costLabel: string; sellLabel: string; unitLabel: string }[] = [
  { value: 'per_hour',  label: 'Per Hour',    costLabel: 'Cost Rate ($/hr)',     sellLabel: 'Sell Rate ($/hr)',     unitLabel: '/hr'    },
  { value: 'per_sqft',  label: 'Per Sq Ft',   costLabel: 'Cost Rate ($/sqft)',   sellLabel: 'Sell Rate ($/sqft)',   unitLabel: '/sqft'  },
  { value: 'per_unit',  label: 'Per Unit',     costLabel: 'Cost Rate ($/unit)',   sellLabel: 'Sell Rate ($/unit)',   unitLabel: '/unit'  },
  { value: 'per_1000',  label: 'Per 1,000',   costLabel: 'Cost Rate ($/M)',      sellLabel: 'Sell Rate ($/M)',      unitLabel: '/M'     },
  { value: 'flat',      label: 'Flat Rate',    costLabel: 'Flat Cost ($)',        sellLabel: 'Flat Sell Price ($)',  unitLabel: ' flat'  },
];

const emptyLaborForm = {
  name: '',
  description: '',
  chargeBasis: 'per_hour' as LaborChargeBasis,
  hourlyCost: 0,
  initialSetupFee: 0,
  markupPercent: 0,
  categoryIds: [] as string[],
  laborGroupIds: [] as string[],
  isFixedCharge: false,
  fixedChargeAmount: 0,
  fixedChargeCost: 0,
  minimumCharge: 0,
  outputPerHour: 1,
  notes: '',
  pricingMode: 'cost_markup' as ServicePricingMode,
  sellRate: 0,
  sellRateTiers: [] as SellRateTier[],
};

const PRICING_MODES_LABOR = [
  { id: 'cost_markup' as ServicePricingMode, label: 'Cost + Markup', icon: TrendingUp },
  { id: 'rate_card'   as ServicePricingMode, label: 'Rate Card',     icon: Tag        },
  { id: 'fixed'       as ServicePricingMode, label: 'Fixed Charge',  icon: Lock       },
];

const fmt = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

const emptyGroupForm = { name: '', description: '' };

// ─── Main Component ─────────────────────────────────────────────────────────
export const Labor: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    labor, addLabor, updateLabor, deleteLabor,
    laborGroups, addLaborGroup, updateLaborGroup, deleteLaborGroup,
    categories,
  } = usePricingStore();

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLaborForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    laborGroups.forEach(g => m.set(g.id, g.name));
    return m;
  }, [laborGroups]);

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
    if (filterGroup) {
      list = list.filter(l => l.laborGroupIds?.includes(filterGroup));
    }
    return list;
  }, [labor, search, filterCategory, filterGroup]);

  // ── Compute sell rate ──
  const computeSellRate = (hourlyCost: number, markupPercent: number, minimumCharge?: number) => {
    const rate = hourlyCost * (1 + markupPercent / 100);
    if (minimumCharge && minimumCharge > 0 && rate < minimumCharge) return minimumCharge;
    return rate;
  };

  // ── Handlers ──
  const openNewModal = () => {
    setForm(emptyLaborForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (l: PricingLabor) => {
    setEditingId(l.id);
    const mode: ServicePricingMode = l.pricingMode ?? (l.isFixedCharge ? 'fixed' : 'cost_markup');
    setForm({
      name: l.name,
      description: l.description || '',
      chargeBasis: l.chargeBasis ?? 'per_hour',
      hourlyCost: l.hourlyCost,
      initialSetupFee: l.initialSetupFee,
      markupPercent: l.markupPercent,
      categoryIds: l.categoryIds || [],
      laborGroupIds: l.laborGroupIds || [],
      isFixedCharge: mode === 'fixed',
      fixedChargeAmount: l.fixedChargeAmount ?? 0,
      fixedChargeCost: l.fixedChargeCost ?? 0,
      minimumCharge: l.minimumCharge ?? 0,
      outputPerHour: l.outputPerHour ?? 1,
      notes: l.notes || '',
      pricingMode: mode,
      sellRate: l.sellRate ?? 0,
      sellRateTiers: l.sellRateTiers ? [...l.sellRateTiers] : [],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = () => {
    const isFixed = form.pricingMode === 'fixed';
    const payload = {
      name: form.name,
      description: form.description || undefined,
      chargeBasis: form.chargeBasis,
      hourlyCost: form.hourlyCost,
      initialSetupFee: form.initialSetupFee,
      markupPercent: form.markupPercent,
      categoryIds: form.categoryIds,
      laborGroupIds: form.laborGroupIds,
      isFixedCharge: isFixed,
      fixedChargeAmount: isFixed ? form.fixedChargeAmount : 0,
      fixedChargeCost: isFixed ? form.fixedChargeCost : 0,
      minimumCharge: form.minimumCharge,
      outputPerHour: form.outputPerHour,
      notes: form.notes || undefined,
      pricingMode: form.pricingMode,
      sellRate: form.pricingMode === 'rate_card' ? form.sellRate : undefined,
      sellRateTiers: form.pricingMode === 'rate_card' && form.sellRateTiers.length > 0 ? form.sellRateTiers : undefined,
    };
    if (editingId) {
      updateLabor(editingId, payload);
    } else {
      addLabor(payload);
    }
    closeModal();
  };

  const handleClone = (l: PricingLabor) => {
    const mode: ServicePricingMode = l.pricingMode ?? (l.isFixedCharge ? 'fixed' : 'cost_markup');
    addLabor({
      name: `${l.name} (Copy)`,
      description: l.description,
      chargeBasis: l.chargeBasis ?? 'per_hour',
      hourlyCost: l.hourlyCost,
      initialSetupFee: l.initialSetupFee,
      markupPercent: l.markupPercent,
      categoryIds: l.categoryIds || [],
      laborGroupIds: l.laborGroupIds || [],
      isFixedCharge: mode === 'fixed',
      fixedChargeAmount: l.fixedChargeAmount ?? 0,
      fixedChargeCost: l.fixedChargeCost ?? 0,
      minimumCharge: l.minimumCharge ?? 0,
      outputPerHour: l.outputPerHour ?? 1,
      notes: l.notes,
      pricingMode: mode,
      sellRate: l.sellRate,
      sellRateTiers: l.sellRateTiers ? [...l.sellRateTiers] : undefined,
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

  const toggleLaborGroup = (gId: string) => {
    setForm(f => ({
      ...f,
      laborGroupIds: f.laborGroupIds.includes(gId)
        ? f.laborGroupIds.filter(id => id !== gId)
        : [...f.laborGroupIds, gId],
    }));
  };

  // ── Group Manager Handlers ──
  const handleOpenGroupForm = (group?: LaborGroup) => {
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
      updateLaborGroup(editingGroupId, {
        name: groupForm.name,
        description: groupForm.description || undefined,
      });
    } else {
      addLaborGroup({
        name: groupForm.name,
        description: groupForm.description || undefined,
      });
    }
    setShowGroupForm(false);
    setEditingGroupId(null);
  };

  const handleDeleteGroup = (id: string) => {
    deleteLaborGroup(id);
    setDeleteGroupConfirm(null);
  };

  const sellRate = form.isFixedCharge
    ? form.fixedChargeAmount
    : computeSellRate(form.hourlyCost, form.markupPercent, form.minimumCharge);

  // ── Render ──
  return (
    <div>
      <PageHeader
        title="Labor"
        subtitle={`${labor.length} labor service${labor.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Settings className="w-4 h-4" />} onClick={() => setShowGroupManager(true)}>
              Manage Groups
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
              Add Labor
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
          <div>
            <select
              value={filterGroup}
              onChange={e => setFilterGroup(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Groups</option>
              {laborGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
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

          {/* ── Row 1: Charge Basis + Pricing Mode ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Charge Basis */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Charge Unit</label>
              <div className="flex flex-wrap gap-1">
                {LABOR_BASIS_OPTIONS.map(b => (
                  <button key={b.value} type="button"
                    onClick={() => setForm(f => ({ ...f, chargeBasis: b.value }))}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                      form.chargeBasis === b.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Pricing Mode */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pricing Mode</label>
              <div className="flex gap-1 p-0.5 bg-gray-100 rounded-xl">
                {PRICING_MODES_LABOR.map(m => {
                  const Icon = m.icon;
                  const active = form.pricingMode === m.id;
                  return (
                    <button key={m.id} type="button"
                      onClick={() => setForm(f => ({ ...f, pricingMode: m.id, isFixedCharge: m.id === 'fixed' }))}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${active ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                      <Icon className={`w-3 h-3 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── FIXED CHARGE ── */}
          {form.pricingMode === 'fixed' && (() => {
            const basisOpt = LABOR_BASIS_OPTIONS.find(b => b.value === form.chargeBasis) ?? LABOR_BASIS_OPTIONS[0];
            const markupPct = form.fixedChargeCost > 0 ? ((form.fixedChargeAmount - form.fixedChargeCost) / form.fixedChargeCost) * 100 : 0;
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <Input label={`Your Cost (${basisOpt.unitLabel})`} type="number" value={form.fixedChargeCost || ''}
                    onChange={e => setForm(f => ({ ...f, fixedChargeCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                  <Input label={`Client Charge (${basisOpt.unitLabel})`} type="number" value={form.fixedChargeAmount || ''}
                    onChange={e => setForm(f => ({ ...f, fixedChargeAmount: parseFloat(e.target.value) || 0 }))} prefix="$" />
                </div>
                {form.fixedChargeCost > 0 && form.fixedChargeAmount > 0 && (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Client sees:
                    </span>
                    <span className="font-semibold text-blue-700">{fmt(form.fixedChargeAmount)}{basisOpt.unitLabel}</span>
                    <span className="text-gray-400 text-xs">Markup: <span className="font-semibold text-gray-700">{pct(markupPct)}</span></span>
                    <span className="text-xs text-gray-400">Margin: <span className={`font-semibold ${form.fixedChargeAmount > form.fixedChargeCost ? 'text-emerald-600' : 'text-red-500'}`}>
                      {form.fixedChargeAmount > 0 ? pct(((form.fixedChargeAmount - form.fixedChargeCost) / form.fixedChargeAmount) * 100) : '—'}
                    </span></span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── RATE CARD ── */}
          {form.pricingMode === 'rate_card' && (() => {
            const basisOpt = LABOR_BASIS_OPTIONS.find(b => b.value === form.chargeBasis) ?? LABOR_BASIS_OPTIONS[0];
            const isHourly = form.chargeBasis === 'per_hour';
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <Input label={basisOpt.costLabel} type="number" value={form.hourlyCost || ''}
                    onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                  {isHourly && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        <Tooltip
                          label="Production Rate (units/hr)"
                          tip="How many units this service can handle per hour. Converts job quantity into billable hours."
                        />
                      </label>
                      <input
                        type="number"
                        value={form.outputPerHour || ''}
                        onChange={e => setForm(f => ({ ...f, outputPerHour: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 500"
                        className={`w-full px-3 py-1.5 text-sm bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          !form.outputPerHour ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
                        }`}
                      />
                      {!form.outputPerHour && (
                        <p className="text-[10px] text-amber-600 mt-0.5">Required to calculate job hours</p>
                      )}
                    </div>
                  )}
                </div>
                {/* Sell Rate section */}
                <div className="rounded-xl border-2 border-blue-100 bg-blue-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Client Sell Rate</span>
                    <span className="text-[10px] text-blue-500">— what you charge, independent of your cost</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label={basisOpt.sellLabel} type="number" value={form.sellRate || ''}
                      onChange={e => setForm(f => ({ ...f, sellRate: parseFloat(e.target.value) || 0 }))} prefix="$" />
                    {form.hourlyCost > 0 && form.sellRate > 0 && (
                      <div className="flex items-end pb-1">
                        <div className="text-[11px] text-gray-600 bg-white rounded-md px-3 py-2 border border-blue-100 w-full">
                          Cost: <span className="font-semibold">{fmt(form.hourlyCost)}{basisOpt.unitLabel}</span>
                          {' · '}Sell: <span className="font-semibold text-blue-700">{fmt(form.sellRate)}{basisOpt.unitLabel}</span>
                          {' · '}Margin: <span className={`font-semibold ${form.sellRate > form.hourlyCost ? 'text-emerald-600' : 'text-red-500'}`}>
                            {pct(((form.sellRate - form.hourlyCost) / form.sellRate) * 100)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Volume Tiers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Volume Tiers <span className="font-normal text-blue-400 normal-case">(optional — override sell rate by quantity range)</span></span>
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, sellRateTiers: [...f.sellRateTiers, { id: nanoid(), fromQty: 0, toQty: null, sellRate: 0 }] }))}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors">
                        <Plus className="w-3 h-3" /> Add Tier
                      </button>
                    </div>
                    {form.sellRateTiers.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 px-1">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase">From</span>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase">To (blank = ∞)</span>
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
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''}
                    onChange={e => setForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
                  <Input label="Minimum Charge ($)" type="number" value={form.minimumCharge || ''}
                    onChange={e => setForm(f => ({ ...f, minimumCharge: parseFloat(e.target.value) || 0 }))} prefix="$" />
                </div>
              </div>
            );
          })()}

          {/* ── COST + MARKUP ── */}
          {form.pricingMode === 'cost_markup' && (() => {
            const basisOpt = LABOR_BASIS_OPTIONS.find(b => b.value === form.chargeBasis) ?? LABOR_BASIS_OPTIONS[0];
            const isHourly = form.chargeBasis === 'per_hour';
            const computedSell = form.hourlyCost * (1 + form.markupPercent / 100);
            const effectiveSell = form.minimumCharge > 0 && computedSell < form.minimumCharge
              ? form.minimumCharge : computedSell;
            const minApplied = form.minimumCharge > 0 && computedSell < form.minimumCharge;
            // Example job calc: sample qty of 1000 to show a realistic hour estimate
            const sampleQty = 1000;
            const sampleHours = isHourly && form.outputPerHour > 0 ? sampleQty / form.outputPerHour : null;
            return (
              <div className="space-y-3">

                {/* Row 1: for per_hour show Cost + Units/Hr side by side — they are directly related */}
                {isHourly ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Cost Rate ($/hr)" type="number" value={form.hourlyCost || ''}
                        onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                      {/* Units Per Hour — required for per_hour to convert quantity → hours */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          <Tooltip
                            label="Production Rate (units/hr)"
                            tip="How many units this service can handle per hour. Used to convert job quantity into billable hours. Example: 500 pcs/hr means 2,000 pcs = 4 hours."
                          />
                        </label>
                        <input
                          type="number"
                          value={form.outputPerHour || ''}
                          onChange={e => setForm(f => ({ ...f, outputPerHour: parseFloat(e.target.value) || 0 }))}
                          placeholder="e.g. 500"
                          className={`w-full px-3 py-1.5 text-sm bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            !form.outputPerHour ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
                          }`}
                        />
                        {!form.outputPerHour && (
                          <p className="text-[10px] text-amber-600 mt-0.5">Required to calculate job hours</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Input label="Markup %" type="number" value={form.markupPercent || ''}
                        onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))} suffix="%" />
                      <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''}
                        onChange={e => setForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          <Tooltip label="Minimum Charge ($)" tip="Minimum amount to charge regardless of calculated hours" />
                        </label>
                        <input type="number" value={form.minimumCharge || ''}
                          onChange={e => setForm(f => ({ ...f, minimumCharge: parseFloat(e.target.value) || 0 }))}
                          placeholder="0 = no minimum"
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Non-hourly: flat 3-col + minimum */
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <Input label={basisOpt.costLabel} type="number" value={form.hourlyCost || ''}
                        onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                      <Input label="Initial Setup Fee ($)" type="number" value={form.initialSetupFee || ''}
                        onChange={e => setForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
                      <Input label="Markup %" type="number" value={form.markupPercent || ''}
                        onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))} suffix="%" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        <Tooltip label="Minimum Charge ($)" tip="Minimum amount to charge regardless of calculated price" />
                      </label>
                      <input type="number" value={form.minimumCharge || ''}
                        onChange={e => setForm(f => ({ ...f, minimumCharge: parseFloat(e.target.value) || 0 }))}
                        placeholder="0 = no minimum"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                )}

                {/* ── Computed sell rate guide ── */}
                {form.hourlyCost > 0 && (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        {isHourly ? 'Client rate per hour:' : `Client charge (${basisOpt.unitLabel}):`}
                      </span>
                      <span className="font-bold text-blue-700 text-base">{fmt(effectiveSell)}{basisOpt.unitLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {fmt(form.hourlyCost)} cost × {form.markupPercent}% markup = {fmt(computedSell)}{basisOpt.unitLabel}
                        {form.initialSetupFee > 0 && <span> + {fmt(form.initialSetupFee)} setup</span>}
                      </span>
                      <span className={`font-semibold ${effectiveSell > form.hourlyCost ? 'text-emerald-600' : 'text-red-500'}`}>
                        {pct(((effectiveSell - form.hourlyCost) / effectiveSell) * 100)} margin
                      </span>
                    </div>
                    {/* Hours example — only shown for per_hour with a valid production rate */}
                    {isHourly && form.outputPerHour > 0 && (
                      <div className="border-t border-gray-200 pt-1.5 text-xs text-gray-500">
                        <span className="font-medium text-gray-600">Example:</span>
                        {' '}{sampleQty.toLocaleString()} pcs ÷ {form.outputPerHour.toLocaleString()} pcs/hr
                        {' = '}<span className="font-semibold text-gray-700">{sampleHours!.toFixed(2)} hrs</span>
                        {' → '}cost {fmt(sampleHours! * form.hourlyCost)}
                        {' → '}client pays <span className="font-semibold text-blue-600">{fmt(Math.max(sampleHours! * effectiveSell + form.initialSetupFee, form.minimumCharge || 0))}</span>
                      </div>
                    )}
                    {isHourly && !form.outputPerHour && (
                      <p className="text-[10px] text-amber-600 border-t border-gray-200 pt-1.5">
                        Set a production rate above to see a job hour estimate
                      </p>
                    )}
                    {minApplied && (
                      <p className="text-[10px] text-amber-600">
                        Minimum charge of {fmt(form.minimumCharge)} applied (computed was {fmt(computedSell)}/hr)
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Categories + Labor Groups side by side */}
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

            {/* Labor Groups multi-select */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Labor Groups
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                {laborGroups.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No groups defined</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {laborGroups.map(g => (
                    <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.laborGroupIds.includes(g.id)}
                        onChange={() => toggleLaborGroup(g.id)}
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

      {/* ═══════════════ MANAGE GROUPS MODAL ═══════════════ */}
      <Modal
        isOpen={showGroupManager}
        onClose={() => { setShowGroupManager(false); setShowGroupForm(false); }}
        title="Manage Labor Groups"
        size="lg"
      >
        <div className="space-y-4">
          {/* Group list */}
          {!showGroupForm && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{laborGroups.length} labor groups</p>
                <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => handleOpenGroupForm()}>
                  Add Group
                </Button>
              </div>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {laborGroups.map(g => (
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
                {laborGroups.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No labor groups yet</div>
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
                placeholder="e.g. Design & Prepress" />
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
