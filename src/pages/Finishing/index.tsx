import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit3, Search, Scissors, Copy, Settings, X, Info,
  FlaskConical, TrendingUp, Tag, Lock,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import type { PricingFinishing, FinishingGroup, ServicePricingMode, SellRateTier } from '../../types/pricing';
import { nanoid } from '../../utils/nanoid';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => `$${n.toFixed(n < 1 && n > 0 ? 3 : 2)}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

const CHARGE_BASIS_OPTIONS: { value: PricingFinishing['chargeBasis']; label: string; tip?: string }[] = [
  { value: 'per_unit',      label: 'Per Unit' },
  { value: 'per_sqft',      label: 'Per Sq Ft' },
  { value: 'per_hour',      label: 'Per Hour' },
  { value: 'per_stack',     label: 'Per Stack' },
  { value: 'flat',          label: 'Flat Rate' },
  { value: 'per_perimeter', label: 'Per Perimeter', tip: 'Charge based on the perimeter of the finished piece. Use "Full" for hemming (entire perimeter × rate) or "Interval" for grommets/eyelets (items placed every N inches around the perimeter).' },
];

const COST_TYPE_OPTIONS: { value: PricingFinishing['costType']; label: string }[] = [
  { value: 'cost_only', label: 'Cost Only' },
  { value: 'cost_plus_time', label: 'Cost + Time' },
  { value: 'time_only', label: 'Time Only' },
];

const chargeBasisLabel = (v: string) =>
  CHARGE_BASIS_OPTIONS.find(o => o.value === v)?.label ?? v;

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const Tip: React.FC<{ label: string; tip: string }> = ({ label, tip }) => (
  <span className="inline-flex items-center gap-1 group relative">
    <span>{label}</span>
    <Info className="w-3 h-3 text-gray-400" />
    <span className="invisible group-hover:visible absolute bottom-full left-0 mb-1 w-56 p-2 text-[10px] bg-gray-900 text-white rounded-lg shadow-lg z-10">
      {tip}
    </span>
  </span>
);

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
  minimumCharge: 0,
  isFixedCharge: false,
  fixedChargeAmount: 0,
  fixedChargeCost: 0,
  sheetsPerStack: 500,
  stacksPerHour: 150,
  notes: '',
  // ── Perimeter-specific ──
  perimeterMode: 'full' as 'full' | 'interval',
  perimeterIntervalInches: 12,
  // ── Sell-side pricing ──
  pricingMode: 'cost_markup' as ServicePricingMode,
  sellRate: 0,
  sellRateTiers: [] as SellRateTier[],
};

// Pricing mode options
const PRICING_MODES = [
  { id: 'cost_markup' as ServicePricingMode, label: 'Cost + Markup', icon: TrendingUp, tip: 'Compute cost from rates, apply markup % to get sell price' },
  { id: 'rate_card'  as ServicePricingMode, label: 'Rate Card',     icon: Tag,         tip: 'Set cost and sell rates independently. Optionally add volume tiers.' },
  { id: 'fixed'      as ServicePricingMode, label: 'Fixed Charge',  icon: Lock,        tip: 'Charge a flat fixed amount regardless of quantity' },
];

const emptyGroupForm = { name: '', description: '' };

// ─── Main Component ─────────────────────────────────────────────────────────
export const Finishing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    finishing, addFinishing, updateFinishing, deleteFinishing,
    finishingGroups, addFinishingGroup, updateFinishingGroup, deleteFinishingGroup,
    categories,
  } = usePricingStore();

  // ── State ──
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Test pricing state
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testQty, setTestQty] = useState(1000);

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
    if (filterCategory) list = list.filter(f => f.categoryIds.includes(filterCategory));
    if (filterGroup) list = list.filter(f => f.finishingGroupIds.includes(filterGroup));
    return list;
  }, [finishing, search, filterCategory, filterGroup]);

  // ── Cost computation ──
  const computeCostPerUnit = (f: typeof form) => {
    if (f.isFixedCharge) return f.fixedChargeCost;
    if (f.chargeBasis === 'per_stack') {
      const stacks = f.stacksPerHour || 150;
      const sheets = f.sheetsPerStack || 500;
      if (stacks > 0 && sheets > 0 && f.hourlyCost > 0) return f.hourlyCost / stacks / sheets;
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

  const computeTestPrice = (f: typeof form, qty: number) => {
    if (f.isFixedCharge) {
      const total = f.fixedChargeAmount + f.initialSetupFee;
      const minApplied = f.minimumCharge > 0 && total < f.minimumCharge;
      return {
        cost: f.fixedChargeCost,
        markup: f.fixedChargeAmount - f.fixedChargeCost,
        markupPct: f.fixedChargeCost > 0 ? ((f.fixedChargeAmount - f.fixedChargeCost) / f.fixedChargeCost) * 100 : 0,
        setupFee: f.initialSetupFee,
        subtotal: f.fixedChargeAmount + f.initialSetupFee,
        total: minApplied ? f.minimumCharge : total,
        minApplied,
      };
    }
    const costPer = computeCostPerUnit(f);
    let units = qty;
    if (f.chargeBasis === 'flat') units = 1;
    if (f.chargeBasis === 'per_hour') units = qty;

    const baseCost = costPer * units;
    const markupAmt = baseCost * (f.markupPercent / 100);
    const subtotal = baseCost + markupAmt + f.initialSetupFee;
    const minApplied = f.minimumCharge > 0 && subtotal < f.minimumCharge;
    return {
      cost: baseCost,
      markup: markupAmt,
      markupPct: f.markupPercent,
      setupFee: f.initialSetupFee,
      subtotal,
      total: minApplied ? f.minimumCharge : subtotal,
      minApplied,
    };
  };

  // ── Cost/Rate display for table ──
  const getCostRateDisplay = (f: PricingFinishing) => {
    if (f.isFixedCharge) return `${fmt(f.fixedChargeAmount)} fixed`;
    switch (f.chargeBasis) {
      case 'per_stack':
        return `${f.stacksPerHour ?? 150}/hr \u00b7 ${f.sheetsPerStack ?? 500}/stack`;
      case 'per_unit':
        if (f.costType === 'cost_only') return `${fmt(f.unitCost)}/ea`;
        return `${f.outputPerHour.toLocaleString()}/hr`;
      case 'per_sqft':
        return `${fmt(f.unitCost)}/sqft`;
      case 'per_hour':
        return `${fmt(f.hourlyCost)}/hr`;
      case 'flat':
        return `${fmt(f.unitCost)} flat`;
      default:
        return '\u2014';
    }
  };

  // ── Handlers ──
  const openNewModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowTestPanel(false);
    setShowModal(true);
  };

  const openEditModal = (f: PricingFinishing) => {
    setEditingId(f.id);
    // Derive pricingMode from legacy isFixedCharge if pricingMode not stored yet
    const mode: ServicePricingMode = f.pricingMode ?? (f.isFixedCharge ? 'fixed' : 'cost_markup');
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
      minimumCharge: f.minimumCharge ?? 0,
      isFixedCharge: mode === 'fixed',
      fixedChargeAmount: f.fixedChargeAmount ?? 0,
      fixedChargeCost: f.fixedChargeCost ?? 0,
      sheetsPerStack: f.sheetsPerStack ?? 500,
      stacksPerHour: f.stacksPerHour ?? 150,
      notes: f.notes || '',
      pricingMode: mode,
      sellRate: f.sellRate ?? 0,
      sellRateTiers: f.sellRateTiers ? [...f.sellRateTiers] : [],
      perimeterMode: f.perimeterMode ?? 'full',
      perimeterIntervalInches: f.perimeterIntervalInches ?? 12,
    });
    setShowTestPanel(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setShowTestPanel(false);
  };

  const handleSave = () => {
    if (!form.name || form.categoryIds.length === 0) return;
    const isFixed = form.pricingMode === 'fixed';
    const payload: Omit<PricingFinishing, 'id' | 'createdAt'> = {
      name: form.name,
      description: form.description || undefined,
      categoryIds: form.categoryIds,
      finishingGroupIds: form.finishingGroupIds,
      productIds: [],
      chargeBasis: form.chargeBasis,
      costType: form.costType,
      unitCost: form.unitCost,
      hourlyCost: form.hourlyCost,
      outputPerHour: form.outputPerHour,
      initialSetupFee: form.initialSetupFee,
      markupPercent: form.markupPercent,
      minimumCharge: form.minimumCharge,
      isFixedCharge: isFixed,
      fixedChargeAmount: isFixed ? form.fixedChargeAmount : 0,
      fixedChargeCost: isFixed ? form.fixedChargeCost : 0,
      sheetsPerStack: form.chargeBasis === 'per_stack' ? form.sheetsPerStack : undefined,
      stacksPerHour: form.chargeBasis === 'per_stack' ? form.stacksPerHour : undefined,
      notes: form.notes || undefined,
      // Perimeter-specific
      perimeterMode: form.chargeBasis === 'per_perimeter' ? form.perimeterMode : undefined,
      perimeterIntervalInches: form.chargeBasis === 'per_perimeter' && form.perimeterMode === 'interval' ? form.perimeterIntervalInches : undefined,
      // Sell-side pricing
      pricingMode: form.pricingMode,
      sellRate: form.pricingMode === 'rate_card' ? form.sellRate : undefined,
      sellRateTiers: form.pricingMode === 'rate_card' && form.sellRateTiers.length > 0 ? form.sellRateTiers : undefined,
    };
    if (editingId) {
      updateFinishing(editingId, payload);
    } else {
      addFinishing(payload);
    }
    closeModal();
  };

  const handleClone = () => {
    setEditingId(null);
    setForm(prev => ({ ...prev, name: `Clone of ${prev.name}` }));
    setShowTestPanel(false);
  };

  const handleCloneFromTable = (f: PricingFinishing) => {
    setEditingId(null);
    const mode: ServicePricingMode = f.pricingMode ?? (f.isFixedCharge ? 'fixed' : 'cost_markup');
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
      minimumCharge: f.minimumCharge ?? 0,
      isFixedCharge: mode === 'fixed',
      fixedChargeAmount: f.fixedChargeAmount ?? 0,
      fixedChargeCost: f.fixedChargeCost ?? 0,
      sheetsPerStack: f.sheetsPerStack ?? 500,
      stacksPerHour: f.stacksPerHour ?? 150,
      notes: f.notes || '',
      pricingMode: mode,
      sellRate: f.sellRate ?? 0,
      sellRateTiers: f.sellRateTiers ? [...f.sellRateTiers] : [],
      perimeterMode: f.perimeterMode ?? 'full',
      perimeterIntervalInches: f.perimeterIntervalInches ?? 12,
    });
    setShowTestPanel(false);
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

  // ── Test pricing computed ──
  const testResult = useMemo(() => computeTestPrice(form, testQty), [form, testQty]);

  // ── Fixed charge computed markup ──
  const fixedMarkupPct = form.fixedChargeCost > 0
    ? ((form.fixedChargeAmount - form.fixedChargeCost) / form.fixedChargeCost) * 100
    : 0;

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
        <div className="flex items-center gap-3 px-4 py-2 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search finishing services..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Groups</option>
            {finishingGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <span className="text-[10px] text-gray-400">{filteredFinishing.length} results</span>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table headers={['Name', 'Group(s)', 'Categories', 'Charge Basis', 'Cost/Rate', 'Setup', 'Markup', 'Actions']}>
          {filteredFinishing.map(f => (
            <tr
              key={f.id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => openEditModal(f)}
            >
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="text-[11px] font-semibold text-gray-900 block">{f.name}</span>
                    {f.description && (
                      <span className="text-[10px] text-gray-400 truncate block max-w-[160px]">{f.description}</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-2 px-3">
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
                  <span className="text-[10px] text-gray-400">{'\u2014'}</span>
                )}
              </td>
              <td className="py-2 px-3">
                {f.categoryIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {f.categoryIds.map(id => {
                      const name = categoryMap.get(id);
                      return name ? (
                        <span key={id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{name}</span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400">{'\u2014'}</span>
                )}
              </td>
              <td className="py-2 px-3">
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {f.isFixedCharge ? 'Fixed' : chargeBasisLabel(f.chargeBasis)}
                </span>
              </td>
              <td className="py-2 px-3 text-[11px] text-gray-700 font-medium whitespace-nowrap">
                {getCostRateDisplay(f)}
              </td>
              <td className="py-2 px-3 text-[11px] text-gray-500">
                {f.initialSetupFee > 0 ? fmt(f.initialSetupFee) : '\u2014'}
              </td>
              <td className="py-2 px-3 text-[11px] text-gray-500">
                {f.isFixedCharge
                  ? (f.fixedChargeCost > 0
                    ? pct(((f.fixedChargeAmount - f.fixedChargeCost) / f.fixedChargeCost) * 100)
                    : '\u2014')
                  : `${f.markupPercent}%`}
              </td>
              <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => openEditModal(f)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCloneFromTable(f)}
                    className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                    title="Clone"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {deleteConfirm === f.id ? (
                    <div className="flex gap-1 items-center">
                      <button
                        onClick={() => { deleteFinishing(f.id); setDeleteConfirm(null); }}
                        className="px-2 py-0.5 text-[10px] bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-0.5 text-[10px] text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(f.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
              <Scissors className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No finishing services found</p>
            <p className="text-[11px] text-gray-300 mt-0.5">Add a service or adjust your filters</p>
          </div>
        )}
      </Card>

      {/* ═══════════════ ADD / EDIT MODAL ═══════════════ */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Finishing Service' : 'Add Finishing Service'}
        size="xl"
      >
        <div className="space-y-5">
          {/* ── Line 1: Name + Description side by side ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Finish Service Name
              </label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Cut, Tri-Fold, Laminate..."
                className="w-full px-3 py-1.5 text-sm font-semibold bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Description
              </label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this service"
                className="w-full px-3 py-1.5 text-sm font-normal bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
          </div>

          {/* ── Line 2: Categories + Finish Groups side by side ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Categories */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Categories <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-1">
                {categories.length === 0 && (
                  <span className="text-[10px] text-gray-400 italic">No categories</span>
                )}
                {categories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                      form.categoryIds.includes(c.id)
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              {form.categoryIds.length === 0 && (
                <p className="text-[10px] text-red-400 mt-0.5">Required</p>
              )}
            </div>

            {/* Finish Groups */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Finish Groups
              </label>
              <div className="flex flex-wrap gap-1">
                {finishingGroups.length === 0 && (
                  <span className="text-[10px] text-gray-400 italic">No groups</span>
                )}
                {finishingGroups.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleFinishingGroup(g.id)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                      form.finishingGroupIds.includes(g.id)
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom Section: Pricing Mode + Fields + Notes ── */}
          <div className="space-y-4 pt-2">

            {/* ── Pricing Mode selector ── */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pricing Mode</label>
              <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                {PRICING_MODES.map(m => {
                  const Icon = m.icon;
                  const active = form.pricingMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      title={m.tip}
                      onClick={() => setForm(f => ({
                        ...f,
                        pricingMode: m.id,
                        isFixedCharge: m.id === 'fixed',
                      }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                        active ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── FIXED CHARGE FIELDS ── */}
            {form.pricingMode === 'fixed' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Your Cost ($)</label>
                    <input type="number" value={form.fixedChargeCost || ''} onChange={e => setForm(f => ({ ...f, fixedChargeCost: parseFloat(e.target.value) || 0 }))} placeholder="Your cost" className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Client Charge ($)</label>
                    <input type="number" value={form.fixedChargeAmount || ''} onChange={e => setForm(f => ({ ...f, fixedChargeAmount: parseFloat(e.target.value) || 0 }))} placeholder="Client charge" className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400" />
                  </div>
                </div>
                {form.fixedChargeCost > 0 && form.fixedChargeAmount > 0 && (
                  <div className="text-[11px] text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                    Markup: <span className="font-semibold text-gray-900">{pct(fixedMarkupPct)}</span>
                    <span className="text-gray-400 ml-1">({fmt(form.fixedChargeCost)} cost → {fmt(form.fixedChargeAmount)} charge)</span>
                  </div>
                )}
              </div>
            )}

            {/* ── RATE CARD FIELDS ── */}
            {form.pricingMode === 'rate_card' && (
              <div className="space-y-3">
                {/* Cost fields (same as cost_markup) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Charge Basis</label>
                    <select value={form.chargeBasis} onChange={e => setForm(f => ({ ...f, chargeBasis: e.target.value as PricingFinishing['chargeBasis'] }))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
                      {CHARGE_BASIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cost Type</label>
                    <select value={form.costType} onChange={e => setForm(f => ({ ...f, costType: e.target.value as PricingFinishing['costType'] }))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
                      {COST_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                {/* Cost rate fields (simplified — same as cost_markup but without markup%) */}
                <div className="grid grid-cols-3 gap-4">
                  {(form.costType === 'time_only' || form.costType === 'cost_plus_time') && (
                    <>
                      <Input label="Units Per Hour" type="number" value={form.outputPerHour || ''}
                        onChange={e => setForm(f => ({ ...f, outputPerHour: parseInt(e.target.value) || 0 }))} />
                      <Input label="Hourly Cost ($)" type="number" value={form.hourlyCost || ''}
                        onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                    </>
                  )}
                  {(form.costType === 'cost_only' || form.costType === 'cost_plus_time') && (
                    <Input label="Unit Cost ($)" type="number" value={form.unitCost || ''}
                      onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                  )}
                </div>

                {/* ── Sell Rate — the key new field ── */}
                <div className="rounded-xl border-2 border-blue-100 bg-blue-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Client Sell Rate</span>
                    <span className="text-[10px] text-blue-500 ml-1">— what you charge the client, independent of your cost</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Sell Rate ({form.chargeBasis === 'per_unit' ? '$/unit' : form.chargeBasis === 'per_sqft' ? '$/sqft' : form.chargeBasis === 'per_hour' ? '$/hr' : form.chargeBasis === 'per_stack' ? '$/stack' : '$ flat'})
                      </label>
                      <input type="number" value={form.sellRate || ''} onChange={e => setForm(f => ({ ...f, sellRate: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 5.00" className="w-full px-3 py-1.5 text-sm bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    {form.sellRate > 0 && (computeCostPerUnit(form) > 0) && (
                      <div className="col-span-2 flex items-end pb-1.5">
                        <div className="text-[11px] text-gray-600 bg-white rounded-md px-3 py-2 border border-blue-100">
                          Cost: <span className="font-semibold">{fmt(computeCostPerUnit(form))}</span>
                          {' · '}Sell: <span className="font-semibold text-blue-700">{fmt(form.sellRate)}</span>
                          {' · '}Margin: <span className={`font-semibold ${form.sellRate > computeCostPerUnit(form) ? 'text-emerald-600' : 'text-red-500'}`}>
                            {form.sellRate > 0 ? pct(((form.sellRate - computeCostPerUnit(form)) / form.sellRate) * 100) : '—'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Volume Tiers (optional) ── */}
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
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">From Qty</span>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">To Qty (∞ = leave blank)</span>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Sell Rate</span>
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
                            <button type="button"
                              onClick={() => setForm(f => ({ ...f, sellRateTiers: f.sellRateTiers.filter((_, i) => i !== idx) }))}
                              className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Setup + Minimum */}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''}
                    onChange={e => setForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
                  <Input label="Minimum Charge ($)" type="number" value={form.minimumCharge || ''}
                    onChange={e => setForm(f => ({ ...f, minimumCharge: parseFloat(e.target.value) || 0 }))} prefix="$" />
                </div>
              </div>
            )}

            {/* ── COST + MARKUP FIELDS (unchanged) ── */}
            {form.pricingMode === 'cost_markup' && (
              /* ── NORMAL PRICING FIELDS ── */
              <div className="space-y-3">
                {/* Row 1: Charge Basis + Cost Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Charge Basis
                    </label>
                    <select
                      value={form.chargeBasis}
                      onChange={e => setForm(f => ({ ...f, chargeBasis: e.target.value as PricingFinishing['chargeBasis'] }))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
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
                      className="w-full px-3 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                    >
                      {COST_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Dynamic fields based on chargeBasis + costType (with Markup on same row) */}
                {form.chargeBasis === 'per_stack' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          Hourly Cost ($)
                        </label>
                        <input
                          type="number"
                          value={form.hourlyCost || ''}
                          onChange={e => setForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          <Tip
                            label="Sheets Per Stack"
                            tip="How many sheets of paper can be processed at once. Example: A guillotine cutter can cut 500 sheets in a single pass."
                          />
                        </label>
                        <input
                          type="number"
                          value={form.sheetsPerStack || ''}
                          onChange={e => setForm(f => ({ ...f, sheetsPerStack: parseInt(e.target.value) || 0 }))}
                          placeholder="e.g. 500"
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          <Tip
                            label="Stacks Per Hour"
                            tip="How many stack operations can be completed per hour. Example: 150 cuts per hour on a guillotine cutter."
                          />
                        </label>
                        <input
                          type="number"
                          value={form.stacksPerHour || ''}
                          onChange={e => setForm(f => ({ ...f, stacksPerHour: parseInt(e.target.value) || 0 }))}
                          placeholder="e.g. 150"
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                        />
                      </div>
                      <Input
                        label="Markup %"
                        type="number"
                        value={form.markupPercent || ''}
                        onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))}
                        suffix="%"
                      />
                    </div>
                    {form.hourlyCost > 0 && (form.stacksPerHour || 0) > 0 && (form.sheetsPerStack || 0) > 0 && (
                      <div className="text-[11px] text-gray-500 bg-gray-50 rounded-md px-3 py-1.5">
                        Cost per sheet: <span className="font-semibold text-gray-900">{fmt(form.hourlyCost / (form.stacksPerHour || 150) / (form.sheetsPerStack || 500))}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Perimeter Basis Fields ─────────────────────────────────── */}
                {form.chargeBasis === 'per_perimeter' && (
                  <div className="space-y-3">
                    {/* Mode selector */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        <Tip label="Perimeter Mode" tip="Full: charge covers the entire perimeter (e.g. hemming). Interval: items are placed every N inches around the perimeter (e.g. grommets every 12&quot;)." />
                      </label>
                      <div className="flex gap-2">
                        {(['full', 'interval'] as const).map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, perimeterMode: mode }))}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg border font-medium transition-all ${
                              form.perimeterMode === mode
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            {mode === 'full' ? '⬤ Full Perimeter' : '◎ Interval'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {form.perimeterMode === 'full'
                          ? 'Cost = perimeter (inches) × unit cost. Used for hemming, edge-binding, vinyl borders, etc.'
                          : 'Items placed every N inches around the perimeter. Count = ⌈perimeter ÷ interval⌉. Used for grommets, eyelets, snaps, etc.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* Unit cost (cost per linear inch for full, cost per item for interval) */}
                      <Input
                        label={form.perimeterMode === 'full' ? 'Cost per Linear Inch ($)' : 'Cost per Item ($)'}
                        type="number"
                        value={form.unitCost || ''}
                        onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))}
                        prefix="$"
                      />

                      {/* Interval spacing — only for interval mode */}
                      {form.perimeterMode === 'interval' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            <Tip label="Spacing (inches)" tip="Distance between each item around the perimeter. e.g. 12 = one grommet every 12 inches." />
                          </label>
                          <input
                            type="number" min="1" step="0.5"
                            value={form.perimeterIntervalInches || ''}
                            onChange={e => setForm(f => ({ ...f, perimeterIntervalInches: parseFloat(e.target.value) || 12 }))}
                            placeholder="e.g. 12"
                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <p className="text-[9px] text-gray-400 mt-0.5">inches between each item</p>
                        </div>
                      )}

                      {/* Markup */}
                      <Input label="Markup %" type="number" value={form.markupPercent || ''}
                        onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))} suffix="%" />
                    </div>

                    {/* Live preview */}
                    {form.unitCost > 0 && (
                      <div className="text-[11px] text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 space-y-0.5">
                        <p className="font-semibold text-blue-800">Example — 24" × 36" piece (2 ft × 3 ft)</p>
                        {(() => {
                          const w = 24, h = 36;
                          const perimeter = 2 * (w + h); // 120"
                          if (form.perimeterMode === 'full') {
                            const cost = perimeter * form.unitCost;
                            const sell = cost * (1 + form.markupPercent / 100);
                            return <>
                              <p>Perimeter: <span className="font-medium">{perimeter}" ({(perimeter / 12).toFixed(1)} ft)</span></p>
                              <p>Cost: <span className="font-medium">{perimeter}" × {fmt(form.unitCost)}/in = <span className="text-blue-900">{fmt(cost)}</span></span></p>
                              <p>Sell: <span className="font-bold text-emerald-700">{fmt(sell)}</span></p>
                            </>;
                          } else {
                            const interval = form.perimeterIntervalInches || 12;
                            const count = Math.ceil(perimeter / interval);
                            const cost = count * form.unitCost;
                            const sell = cost * (1 + form.markupPercent / 100);
                            return <>
                              <p>Perimeter: <span className="font-medium">{perimeter}" ÷ {interval}" = <span className="text-blue-900 font-bold">{count} items</span></span></p>
                              <p>Cost: <span className="font-medium">{count} × {fmt(form.unitCost)} = <span className="text-blue-900">{fmt(cost)}</span></span></p>
                              <p>Sell: <span className="font-bold text-emerald-700">{fmt(sell)}</span></p>
                            </>;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {form.chargeBasis === 'per_unit' && (
                  <div className="grid grid-cols-3 gap-4">
                    {(form.costType === 'time_only' || form.costType === 'cost_plus_time') && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            <Tip
                              label="Units Per Hour"
                              tip="How many units of this service can be completed per hour. Units are determined by the item's quantity or square footage."
                            />
                          </label>
                          <input
                            type="number"
                            value={form.outputPerHour || ''}
                            onChange={e => setForm(f => ({ ...f, outputPerHour: parseInt(e.target.value) || 0 }))}
                            placeholder="e.g. 5000"
                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                          />
                        </div>
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
                    <Input
                      label="Markup %"
                      type="number"
                      value={form.markupPercent || ''}
                      onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))}
                      suffix="%"
                    />
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
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            <Tip
                              label="Units Per Hour (sqft/hr)"
                              tip="How many units of this service can be completed per hour. Units are determined by the item's quantity or square footage."
                            />
                          </label>
                          <input
                            type="number"
                            value={form.outputPerHour || ''}
                            onChange={e => setForm(f => ({ ...f, outputPerHour: parseInt(e.target.value) || 0 }))}
                            placeholder="e.g. 200"
                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                          />
                        </div>
                      </>
                    )}
                    <Input
                      label="Markup %"
                      type="number"
                      value={form.markupPercent || ''}
                      onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))}
                      suffix="%"
                    />
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
                    <Input
                      label="Markup %"
                      type="number"
                      value={form.markupPercent || ''}
                      onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))}
                      suffix="%"
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
                    <Input
                      label="Markup %"
                      type="number"
                      value={form.markupPercent || ''}
                      onChange={e => setForm(f => ({ ...f, markupPercent: parseFloat(e.target.value) || 0 }))}
                      suffix="%"
                    />
                  </div>
                )}

                {/* Setup Fee + Minimum Charge */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Setup Fee ($)"
                    type="number"
                    value={form.initialSetupFee || ''}
                    onChange={e => setForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))}
                    prefix="$"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <Tip label="Minimum Charge ($)" tip="If the calculated price is below this amount, this minimum will be charged instead." />
                    </label>
                    <input
                      type="number"
                      value={form.minimumCharge || ''}
                      onChange={e => setForm(f => ({ ...f, minimumCharge: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 resize-none"
            />

            {/* ── Test Pricing Panel ── */}
            {showTestPanel && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[11px] font-semibold text-amber-800">Test Pricing</span>
                  </div>
                  <button onClick={() => setShowTestPanel(false)} className="p-0.5 hover:bg-amber-100 rounded">
                    <X className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                </div>

                {/* Test input */}
                {form.chargeBasis !== 'flat' && !form.isFixedCharge && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide whitespace-nowrap">
                      {form.chargeBasis === 'per_unit' ? 'Test Quantity' :
                       form.chargeBasis === 'per_sqft' ? 'Test Sq Ft' :
                       form.chargeBasis === 'per_hour' ? 'Test Hours' :
                       form.chargeBasis === 'per_stack' ? 'Test Sheets' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      value={testQty}
                      onChange={e => setTestQty(parseInt(e.target.value) || 0)}
                      className="w-28 px-2 py-1 text-sm bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {form.chargeBasis === 'per_stack' && (form.sheetsPerStack || 500) > 0 && (
                      <span className="text-[10px] text-amber-600">
                        = {Math.ceil(testQty / (form.sheetsPerStack || 500))} stacks
                      </span>
                    )}
                  </div>
                )}

                {/* Test results */}
                <div className="bg-white/60 rounded-md px-3 py-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium text-gray-900">{fmt(testResult.cost)}</span>
                  </div>
                  {testResult.markup > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">+ Markup ({pct(testResult.markupPct)}):</span>
                      <span className="font-medium text-gray-700">{fmt(testResult.markup)}</span>
                    </div>
                  )}
                  {testResult.setupFee > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">+ Setup Fee:</span>
                      <span className="font-medium text-gray-700">{fmt(testResult.setupFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] pt-1 border-t border-amber-200">
                    <span className="font-semibold text-amber-800">= Total:</span>
                    <span className="font-bold text-amber-900">{fmt(testResult.total)}</span>
                  </div>
                  {testResult.minApplied && (
                    <div className="text-[10px] text-amber-700 bg-amber-100 rounded px-2 py-1 mt-1">
                      Subtotal {fmt(testResult.subtotal)} is below minimum {'\u2014'} minimum charge of {fmt(form.minimumCharge)} applied
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <button
                type="button"
                onClick={() => setShowTestPanel(!showTestPanel)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 transition-colors"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                {showTestPanel ? 'Hide Test' : 'Test Price'}
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleClone}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Clone
                </button>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!form.name || form.categoryIds.length === 0}
              >
                {editingId ? 'Save Changes' : 'Add Service'}
              </Button>
            </div>
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
