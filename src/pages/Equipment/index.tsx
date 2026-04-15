import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit3, X, Search, Copy, Info,
  ChevronDown, ChevronUp, Camera, Wrench, Calendar,
  Mail, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, FlaskConical
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { usePricingStore } from '../../store/pricingStore';
import { useStore } from '../../store';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import { ImageUploadCropper } from '../../components/ui/ImageUploadCropper';
import type {
  PricingEquipment, EquipmentPricingTier, EquipmentCostUnit,
  MaintenanceRecord, MaintenanceStatus
} from '../../types/pricing';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`;
const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const STATUS_CONFIG: Record<MaintenanceStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  Requested: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  Scheduled: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <Calendar className="w-3.5 h-3.5" /> },
  Completed: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Canceled: { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: <XCircle className="w-3.5 h-3.5" /> },
};

// ─── Equipment Form Defaults ────────────────────────────────────────────────
const emptyEquipmentForm = {
  name: '',
  categoryApplies: 'Digital Press',
  colorCapability: 'Color and Black' as PricingEquipment['colorCapability'],
  costUnit: 'per_click' as EquipmentCostUnit,
  costType: 'cost_only' as PricingEquipment['costType'],
  markupMultiplier: undefined as number | undefined,
  markupType: 'multiplier' as PricingEquipment['markupType'],
  unitCost: 0,
  colorUnitCost: 0,
  blackUnitCost: 0,
  usePricingTiers: false,
  colorTiers: [] as EquipmentPricingTier[],
  blackTiers: [] as EquipmentPricingTier[],
  initialSetupFee: 0,
  unitsPerHour: undefined as number | undefined,
  timeCostPerHour: undefined as number | undefined,
  timeCostMarkup: undefined as number | undefined,
  imageUrl: '' as string | undefined,
  maintenanceVendorId: '' as string | undefined,
};

const emptyServiceForm = {
  description: '',
  scheduledOn: new Date().toISOString().split('T')[0],
  serviceDate: '',
  servicedByVendorId: '',
  status: 'Requested' as MaintenanceStatus,
  notes: '',
  nextMaintenanceDate: '',
};

// ─── Tab types ───────────────────────────────────────────────────────────────
type ModalTab = 'details' | 'maintenance';

// ─── Tier Editor Sub-Component ───────────────────────────────────────────────
const TierEditor: React.FC<{
  label: string;
  tiers: EquipmentPricingTier[];
  onChange: (tiers: EquipmentPricingTier[]) => void;
  qtyLabel?: string;
  priceLabel?: string;
}> = ({ label, tiers, onChange, qtyLabel = 'Min Qty', priceLabel = '$/unit' }) => {
  const addTier = () => onChange([...tiers, { minQty: 0, pricePerUnit: 0 }]);
  const removeTier = (i: number) => onChange(tiers.filter((_, idx) => idx !== i));
  const updateTier = (i: number, field: keyof EquipmentPricingTier, val: number) =>
    onChange(tiers.map((t, idx) => idx === i ? { ...t, [field]: val } : t));

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase">{label}</span>
        <button onClick={addTier} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add Tier</button>
      </div>
      {tiers.length === 0 && <p className="text-xs text-gray-400 italic">No tiers defined</p>}
      {tiers.length > 0 && (
        <div className="flex gap-2 items-center mb-1 px-0.5">
          <span className="w-24 text-[10px] font-medium text-gray-400 uppercase">{qtyLabel}</span>
          <span className="w-4" />
          <span className="w-24 text-[10px] font-medium text-gray-400 uppercase">{priceLabel}</span>
        </div>
      )}
      <div className="space-y-1">
        {tiers.map((t, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input type="number" value={t.minQty} onChange={e => updateTier(i, 'minQty', parseInt(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-xs border rounded" placeholder={qtyLabel} />
            <span className="text-xs text-gray-400">@</span>
            <input type="number" value={t.pricePerUnit} onChange={e => updateTier(i, 'pricePerUnit', parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-xs border rounded" placeholder={priceLabel} step="0.001" />
            <button onClick={() => removeTier(i)} className="p-0.5 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const Equipment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    equipment, addEquipment, updateEquipment, deleteEquipment,
    addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord,
    categories,
  } = usePricingStore();
  const { vendors } = useStore();

  const [search, setSearch] = useState(() => searchParams.get('search') || '');

  // ── Equipment state ──
  const [showNewEquip, setShowNewEquip] = useState(false);
  const [editingEquipId, setEditingEquipId] = useState<string | null>(null);
  const [expandedEquipId, setExpandedEquipId] = useState<string | null>(null);
  const [equipForm, setEquipForm] = useState(emptyEquipmentForm);
  // String buffers for unit cost inputs — prevents "0.00x" being wiped while typing
  const [unitCostStr,       setUnitCostStr]       = useState('');
  const [colorUnitCostStr,  setColorUnitCostStr]  = useState('');
  const [blackUnitCostStr,  setBlackUnitCostStr]  = useState('');
  // Sync string buffers when form is loaded (edit/new)
  const syncCostBuffers = (form: typeof emptyEquipmentForm) => {
    setUnitCostStr(form.unitCost       ? String(form.unitCost)       : '');
    setColorUnitCostStr(form.colorUnitCost ? String(form.colorUnitCost) : '');
    setBlackUnitCostStr(form.blackUnitCost ? String(form.blackUnitCost) : '');
  };
  const [deleteEquipConfirm, setDeleteEquipConfirm] = useState<string | null>(null);

  // ── Modal tabs ──
  const [modalTab, setModalTab] = useState<ModalTab>('details');

  // ── Test Price panel ──
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testClicks, setTestClicks] = useState(1000);
  const [testColorMode, setTestColorMode] = useState<'Color' | 'Black'>('Color');

  // ── Maintenance state ──
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [showCompletionForm, setShowCompletionForm] = useState<string | null>(null);
  const [nextMaintDate, setNextMaintDate] = useState('');

  // ── Current equipment being edited ──
  const editingEquipment = editingEquipId ? equipment.find(e => e.id === editingEquipId) : null;
  const maintenanceHistory = useMemo(() => {
    if (!editingEquipment) return [];
    return [...(editingEquipment.maintenanceHistory || [])].sort(
      (a, b) => new Date(b.scheduledOn).getTime() - new Date(a.scheduledOn).getTime()
    );
  }, [editingEquipment]);

  // ── Filtered list ──
  const filteredEquipment = equipment.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.categoryApplies.toLowerCase().includes(search.toLowerCase())
  );

  // Helper: vendor name lookup
  const getVendorName = (id?: string) => {
    if (!id) return '—';
    return vendors.find(v => v.id === id)?.name || '—';
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  EQUIPMENT HANDLERS
  // ══════════════════════════════════════════════════════════════════════════════

  const handleAddEquip = () => {
    addEquipment({
      name: equipForm.name,
      categoryApplies: equipForm.categoryApplies,
      colorCapability: equipForm.colorCapability,
      costUnit: equipForm.costUnit,
      costType: equipForm.costType,
      markupMultiplier: equipForm.markupMultiplier,
      markupType: equipForm.markupType,
      unitCost: equipForm.unitCost,
      colorUnitCost: equipForm.colorUnitCost,
      blackUnitCost: equipForm.blackUnitCost,
      usePricingTiers: equipForm.usePricingTiers,
      colorTiers: equipForm.colorTiers,
      blackTiers: equipForm.blackTiers,

      initialSetupFee: equipForm.initialSetupFee,
      unitsPerHour: equipForm.unitsPerHour,
      timeCostPerHour: equipForm.timeCostPerHour,
      timeCostMarkup: equipForm.timeCostMarkup,
      imageUrl: equipForm.imageUrl || undefined,
      maintenanceVendorId: equipForm.maintenanceVendorId || undefined,
    });
    setShowNewEquip(false);
    setEquipForm(emptyEquipmentForm);
  };

  const handleStartEditEquip = (e: PricingEquipment) => {
    setEditingEquipId(e.id);
    setEquipForm({
      name: e.name,
      categoryApplies: e.categoryApplies,
      colorCapability: e.colorCapability,
      costUnit: e.costUnit,
      costType: e.costType,
      markupMultiplier: e.markupMultiplier,
      markupType: e.markupType || 'multiplier',
      unitCost: e.unitCost,
      colorUnitCost: (e as any).colorUnitCost ?? e.unitCost ?? 0,
      blackUnitCost: (e as any).blackUnitCost ?? e.unitCost ?? 0,
      usePricingTiers: (e as any).usePricingTiers ?? false,
      colorTiers: e.colorTiers || [],
      blackTiers: e.blackTiers || [],
      initialSetupFee: e.initialSetupFee,
      unitsPerHour: e.unitsPerHour,
      timeCostPerHour: e.timeCostPerHour,
      timeCostMarkup: e.timeCostMarkup,
      imageUrl: e.imageUrl || '',
      maintenanceVendorId: e.maintenanceVendorId || '',
    });
    syncCostBuffers({
      ...emptyEquipmentForm,
      unitCost: e.unitCost,
      colorUnitCost: (e as any).colorUnitCost ?? e.unitCost ?? 0,
      blackUnitCost: (e as any).blackUnitCost ?? e.unitCost ?? 0,
    });
    setModalTab('details');
    setShowTestPanel(false);
    setTestClicks(1000);
    setShowServiceForm(false);
    setEditingServiceId(null);
  };

  const handleSaveEditEquip = () => {
    if (!editingEquipId) return;
    updateEquipment(editingEquipId, {
      name: equipForm.name,
      categoryApplies: equipForm.categoryApplies,
      colorCapability: equipForm.colorCapability,
      costUnit: equipForm.costUnit,
      costType: equipForm.costType,
      markupMultiplier: equipForm.markupMultiplier,
      markupType: equipForm.markupType,
      unitCost: equipForm.unitCost,
      colorUnitCost: equipForm.colorUnitCost,
      blackUnitCost: equipForm.blackUnitCost,
      usePricingTiers: equipForm.usePricingTiers,
      colorTiers: equipForm.colorTiers,
      blackTiers: equipForm.blackTiers,

      initialSetupFee: equipForm.initialSetupFee,
      unitsPerHour: equipForm.unitsPerHour,
      timeCostPerHour: equipForm.timeCostPerHour,
      timeCostMarkup: equipForm.timeCostMarkup,
      imageUrl: equipForm.imageUrl || undefined,
      maintenanceVendorId: equipForm.maintenanceVendorId || undefined,
    });
    setEditingEquipId(null);
  };

  const handleCloneEquip = (eq: PricingEquipment) => {
    addEquipment({
      name: `Clone of ${eq.name}`,
      categoryApplies: eq.categoryApplies,
      colorCapability: eq.colorCapability,
      costUnit: eq.costUnit,
      costType: eq.costType,
      markupMultiplier: eq.markupMultiplier,
      markupType: eq.markupType || 'multiplier',
      unitCost: eq.unitCost,
      colorUnitCost: (eq as any).colorUnitCost,
      blackUnitCost: (eq as any).blackUnitCost,
      usePricingTiers: (eq as any).usePricingTiers ?? false,
      colorTiers: eq.colorTiers ? [...eq.colorTiers.map(t => ({ ...t }))] : [],
      blackTiers: eq.blackTiers ? [...eq.blackTiers.map(t => ({ ...t }))] : [],
      initialSetupFee: eq.initialSetupFee,
      unitsPerHour: eq.unitsPerHour,
      timeCostPerHour: eq.timeCostPerHour,
      timeCostMarkup: eq.timeCostMarkup,
      imageUrl: eq.imageUrl,
      maintenanceVendorId: eq.maintenanceVendorId,
    });
  };

  const handleCloseModal = () => {
    setShowNewEquip(false);
    setEditingEquipId(null);
    setShowServiceForm(false);
    setEditingServiceId(null);
    setShowCompletionForm(null);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  MAINTENANCE HANDLERS
  // ══════════════════════════════════════════════════════════════════════════════

  const handleOpenServiceForm = (record?: MaintenanceRecord) => {
    if (record) {
      setEditingServiceId(record.id);
      setServiceForm({
        description: record.description,
        scheduledOn: record.scheduledOn.split('T')[0],
        serviceDate: record.serviceDate ? record.serviceDate.split('T')[0] : '',
        servicedByVendorId: record.servicedByVendorId || '',
        status: record.status,
        notes: record.notes || '',
        nextMaintenanceDate: record.nextMaintenanceDate ? record.nextMaintenanceDate.split('T')[0] : '',
      });
    } else {
      setEditingServiceId(null);
      setServiceForm({
        ...emptyServiceForm,
        scheduledOn: new Date().toISOString().split('T')[0],
        servicedByVendorId: equipForm.maintenanceVendorId || '',
      });
    }
    setShowServiceForm(true);
  };

  const handleSaveService = () => {
    if (!editingEquipId || !serviceForm.description) return;
    const vendorName = serviceForm.servicedByVendorId
      ? vendors.find(v => v.id === serviceForm.servicedByVendorId)?.name
      : undefined;

    if (editingServiceId) {
      updateMaintenanceRecord(editingEquipId, editingServiceId, {
        description: serviceForm.description,
        scheduledOn: serviceForm.scheduledOn,
        serviceDate: serviceForm.serviceDate || undefined,
        servicedByVendorId: serviceForm.servicedByVendorId || undefined,
        servicedByVendorName: vendorName,
        status: serviceForm.status,
        notes: serviceForm.notes || undefined,
        nextMaintenanceDate: serviceForm.nextMaintenanceDate || undefined,
      });
    } else {
      addMaintenanceRecord(editingEquipId, {
        description: serviceForm.description,
        scheduledOn: serviceForm.scheduledOn,
        serviceDate: serviceForm.serviceDate || undefined,
        servicedByVendorId: serviceForm.servicedByVendorId || undefined,
        servicedByVendorName: vendorName,
        status: serviceForm.status,
        notes: serviceForm.notes || undefined,
        nextMaintenanceDate: serviceForm.nextMaintenanceDate || undefined,
      });
    }
    setShowServiceForm(false);
    setEditingServiceId(null);
  };

  const handleRequestService = () => {
    if (!editingEquipId) return;
    const vendor = equipForm.maintenanceVendorId
      ? vendors.find(v => v.id === equipForm.maintenanceVendorId)
      : null;

    // Open service form pre-filled as "Requested"
    setEditingServiceId(null);
    setServiceForm({
      description: '',
      scheduledOn: new Date().toISOString().split('T')[0],
      serviceDate: '',
      servicedByVendorId: equipForm.maintenanceVendorId || '',
      status: 'Requested',
      notes: vendor ? `Service request sent to ${vendor.name}${vendor.email ? ` (${vendor.email})` : ''}` : '',
      nextMaintenanceDate: '',
    });
    setShowServiceForm(true);
  };

  const handleCompleteService = (recordId: string) => {
    if (!editingEquipId) return;
    setShowCompletionForm(recordId);
    setNextMaintDate('');
  };

  const handleConfirmComplete = () => {
    if (!editingEquipId || !showCompletionForm) return;
    const currentRecord = editingEquipment?.maintenanceHistory?.find(
      (record) => record.id === showCompletionForm
    );
    const nextVendorId = currentRecord?.servicedByVendorId || editingEquipment?.maintenanceVendorId;
    const nextVendorName = nextVendorId
      ? vendors.find((vendor) => vendor.id === nextVendorId)?.name
      : undefined;

    updateMaintenanceRecord(editingEquipId, showCompletionForm, {
      status: 'Completed',
      serviceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: undefined,
    });

    if (currentRecord && nextMaintDate) {
      addMaintenanceRecord(editingEquipId, {
        description: currentRecord.description,
        scheduledOn: nextMaintDate,
        serviceDate: undefined,
        servicedByVendorId: nextVendorId,
        servicedByVendorName: nextVendorName,
        status: 'Scheduled',
        notes: undefined,
        nextMaintenanceDate: undefined,
      });
    }

    setShowCompletionForm(null);
    setNextMaintDate('');
  };

  // Helpers for form display
  const showTimeFields = equipForm.costType === 'time_only' || equipForm.costType === 'cost_plus_time';
  const showUnitCost = equipForm.costType === 'cost_only' || equipForm.costType === 'cost_plus_time';

  const showColorTiers = (eq: PricingEquipment) =>
    eq.colorCapability === 'Color' || eq.colorCapability === 'Color and Black';
  const showBlackTiers = (eq: PricingEquipment) =>
    eq.colorCapability === 'Black' || eq.colorCapability === 'Color and Black';

  // ── Test Price computation ────────────────────────────────────────────────
  const computeEquipTest = (qty: number, colorMode: 'Color' | 'Black') => {
    const f = equipForm;
    const isColorAndBlack = f.colorCapability === 'Color and Black';

    // Unit cost — use split costs if available, else single unitCost
    const unitCostForMode = isColorAndBlack
      ? (colorMode === 'Color' ? (f.colorUnitCost || 0) : (f.blackUnitCost || 0))
      : f.unitCost;

    // Sell price per unit — from tier table or markup
    let sellPerUnit = 0;
    if (f.usePricingTiers) {
      const tiers = colorMode === 'Color' ? f.colorTiers : f.blackTiers;
      if (tiers && tiers.length > 0) {
        let price = tiers[0].pricePerUnit;
        for (const t of tiers) { if (qty >= t.minQty) price = t.pricePerUnit; }
        sellPerUnit = price;
      }
    } else if (f.markupMultiplier) {
      sellPerUnit = f.markupType === 'percent'
        ? unitCostForMode * (1 + f.markupMultiplier / 100)
        : unitCostForMode * f.markupMultiplier;
    }

    const clickCost = unitCostForMode * qty;
    const clickSell = sellPerUnit * qty;

    // Time cost (for cost_plus_time)
    const timeCost = f.costType === 'cost_plus_time' && f.unitsPerHour && f.timeCostPerHour
      ? (qty / f.unitsPerHour) * f.timeCostPerHour
      : 0;
    const timeSell = timeCost * (1 + (f.timeCostMarkup ?? 0) / 100);

    const setupFee = f.initialSetupFee || 0;
    const totalCost = clickCost + timeCost + setupFee;
    const totalSell = clickSell + timeSell + setupFee;
    const margin = totalSell > 0 ? ((totalSell - totalCost) / totalSell) * 100 : 0;

    return { unitCostForMode, sellPerUnit, clickCost, clickSell, timeCost, timeSell, setupFee, totalCost, totalSell, margin };
  };

  // Next scheduled maintenance for list view
  const getNextMaintenance = (eq: PricingEquipment) => {
    const history = eq.maintenanceHistory || [];
    const upcoming = history.filter(r => r.status === 'Scheduled' || r.status === 'Requested');
    if (upcoming.length === 0) {
      // Check if any completed record has nextMaintenanceDate
      const lastCompleted = history.filter(r => r.status === 'Completed' && r.nextMaintenanceDate);
      if (lastCompleted.length > 0) {
        const sorted = lastCompleted.sort((a, b) =>
          new Date(b.serviceDate || b.scheduledOn).getTime() - new Date(a.serviceDate || a.scheduledOn).getTime()
        );
        return { date: sorted[0].nextMaintenanceDate!, status: 'due' as const };
      }
      return null;
    }
    const sorted = upcoming.sort((a, b) => new Date(a.scheduledOn).getTime() - new Date(b.scheduledOn).getTime());
    return { date: sorted[0].scheduledOn, status: sorted[0].status.toLowerCase() as 'requested' | 'scheduled' };
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle={`${equipment.length} equipment item${equipment.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setEquipForm(emptyEquipmentForm); syncCostBuffers(emptyEquipmentForm); setModalTab('details'); setShowNewEquip(true); }}>
            Add Equipment
          </Button>
        }
      />

      {/* Search */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search equipment..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Equipment Table */}
      <Card>
        <Table headers={['Equipment', 'Category', 'Cost Model', 'Unit Cost', 'Setup Fee', 'Markup', 'Maintenance', 'Tiers', 'Actions']}>
          {filteredEquipment.map(eq => {
            const isExpanded = expandedEquipId === eq.id;
            const colorTierCount = showColorTiers(eq) ? (eq.colorTiers || []).length : 0;
            const blackTierCount = showBlackTiers(eq) ? (eq.blackTiers || []).length : 0;
            const totalTiers = colorTierCount + blackTierCount;
            const nextMaint = getNextMaintenance(eq);

            return (
              <React.Fragment key={eq.id}>
                <tr
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleStartEditEquip(eq)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {eq.imageUrl ? (
                        <img src={eq.imageUrl} alt={eq.name}
                          className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Camera className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{eq.name}</p>
                        <p className="text-xs text-gray-400">{eq.colorCapability}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{eq.categoryApplies}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eq.costUnit === 'per_click' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {eq.costUnit === 'per_click' ? 'Per Click' : 'Per Sq Ft'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-700">{formatCurrency(eq.unitCost)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatCurrency(eq.initialSetupFee)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {eq.markupMultiplier
                      ? (eq.markupType === 'percent' ? `${eq.markupMultiplier}%` : `${eq.markupMultiplier}x`)
                      : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {nextMaint ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          nextMaint.status === 'requested' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          nextMaint.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {formatDate(nextMaint.date)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    {totalTiers > 0 ? (
                      <button onClick={() => setExpandedEquipId(isExpanded ? null : eq.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        {totalTiers} tiers
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => handleStartEditEquip(eq)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleCloneEquip(eq)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Clone">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {deleteEquipConfirm === eq.id ? (
                        <div className="flex gap-1 items-center">
                          <button onClick={() => { deleteEquipment(eq.id); setDeleteEquipConfirm(null); }} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded">Delete</button>
                          <button onClick={() => setDeleteEquipConfirm(null)} className="px-2 py-0.5 text-xs text-gray-500">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteEquipConfirm(eq.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Expanded tiers row */}
                {isExpanded && (
                  <tr>
                    <td colSpan={9} className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 max-w-2xl">
                        {showColorTiers(eq) && colorTierCount > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                              Sell Tiers (Color) — {eq.costUnit === 'per_sqft' ? 'per Sq Ft' : 'per Click'}
                            </p>
                            <table className="w-full text-xs">
                              <thead><tr className="text-gray-400">
                                <th className="text-left py-1">{eq.costUnit === 'per_sqft' ? 'Min Sq Ft' : 'Min Qty'}</th>
                                <th className="text-right py-1">{eq.costUnit === 'per_sqft' ? 'Price/Sq Ft' : 'Price/Click'}</th>
                              </tr></thead>
                              <tbody>
                                {(eq.colorTiers || []).map((t, i) => (
                                  <tr key={i} className="border-t border-gray-100">
                                    <td className="py-1">{t.minQty.toLocaleString()}</td>
                                    <td className="text-right font-medium">{formatCurrency(t.pricePerUnit)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {showBlackTiers(eq) && blackTierCount > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                              Sell Tiers (Black) — {eq.costUnit === 'per_sqft' ? 'per Sq Ft' : 'per Click'}
                            </p>
                            <table className="w-full text-xs">
                              <thead><tr className="text-gray-400">
                                <th className="text-left py-1">{eq.costUnit === 'per_sqft' ? 'Min Sq Ft' : 'Min Qty'}</th>
                                <th className="text-right py-1">{eq.costUnit === 'per_sqft' ? 'Price/Sq Ft' : 'Price/Click'}</th>
                              </tr></thead>
                              <tbody>
                                {(eq.blackTiers || []).map((t, i) => (
                                  <tr key={i} className="border-t border-gray-100">
                                    <td className="py-1">{t.minQty.toLocaleString()}</td>
                                    <td className="text-right font-medium">{formatCurrency(t.pricePerUnit)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </Table>
        {filteredEquipment.length === 0 && (
          <div className="text-center py-12 text-gray-400"><p className="text-sm">No equipment found</p></div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════════
          EQUIPMENT MODAL — Full width with tabs
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showNewEquip || editingEquipId !== null}
        onClose={handleCloseModal}
        title={editingEquipId ? equipForm.name || 'Edit Equipment' : 'Add Equipment'}
        size="2xl"
      >
        {/* Tab Navigation */}
        {editingEquipId && (
          <div className="flex border-b border-gray-200 -mx-5 px-5 mb-5 -mt-1">
            <button
              onClick={() => setModalTab('details')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                modalTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Equipment Details
            </button>
            <button
              onClick={() => { setModalTab('maintenance'); setShowServiceForm(false); }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                modalTab === 'maintenance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Maintenance
              {maintenanceHistory.length > 0 && (
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                  {maintenanceHistory.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Tab content wrapper — fixed min-height so modal doesn't resize between tabs */}
        <div className="min-h-[60vh]">

        {/* ═══════════ DETAILS TAB ═══════════ */}
        {(modalTab === 'details' || !editingEquipId) && (
          <div className="space-y-4">

            {/* ── Row 1: Photo + Name + Category + Color ── */}
            <div className="flex items-end gap-3">
              <div className="flex-shrink-0">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Photo</label>
                <ImageUploadCropper value={equipForm.imageUrl || ''} onChange={(url) => setEquipForm(f => ({ ...f, imageUrl: url }))} size={64} />
              </div>
              <div className="flex-[2] min-w-0">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Name <span className="text-red-500">*</span></label>
                <input value={equipForm.name} onChange={e => setEquipForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ricoh 9200"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                <select value={equipForm.categoryApplies} onChange={e => setEquipForm(f => ({ ...f, categoryApplies: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Color</label>
                <select value={equipForm.colorCapability} onChange={e => setEquipForm(f => ({ ...f, colorCapability: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                  <option value="Color and Black">Color + B&W</option>
                  <option value="Color">Color Only</option>
                  <option value="Black">B&W Only</option>
                </select>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-gray-100" />

            {/* ── Row 2: Cost Unit · Cost Type · Setup Fee · [Unit Cost(s)] ── */}
            {/* All cost fields on ONE row — unit costs inline with model selectors */}
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Cost Model</p>
              <div className="flex items-end gap-3 flex-wrap">
                {/* Cost Unit */}
                <div className="w-28">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Unit</label>
                  <select value={equipForm.costUnit} onChange={e => {
                      const newUnit = e.target.value as EquipmentCostUnit;
                      setEquipForm(f => {
                        const updates: Partial<typeof f> = { costUnit: newUnit };
                        const defSqft: EquipmentPricingTier[] = [{ minQty: 1, pricePerUnit: 0 }, { minQty: 10, pricePerUnit: 0 }, { minQty: 50, pricePerUnit: 0 }];
                        const defClick: EquipmentPricingTier[] = [
                          { minQty: 1, pricePerUnit: 0 }, { minQty: 25, pricePerUnit: 0 }, { minQty: 50, pricePerUnit: 0 },
                          { minQty: 250, pricePerUnit: 0 }, { minQty: 500, pricePerUnit: 0 }, { minQty: 1750, pricePerUnit: 0 },
                          { minQty: 3000, pricePerUnit: 0 }, { minQty: 7500, pricePerUnit: 0 }, { minQty: 10000, pricePerUnit: 0 },
                        ];
                        const saved = editingEquipment?.costUnit;
                        if (newUnit === 'per_sqft') {
                          updates.colorTiers = (saved === 'per_sqft' && editingEquipment) ? editingEquipment.colorTiers?.map(t => ({ ...t })) || defSqft.map(t => ({ ...t })) : defSqft.map(t => ({ ...t }));
                          updates.blackTiers = (saved === 'per_sqft' && editingEquipment) ? editingEquipment.blackTiers?.map(t => ({ ...t })) || defSqft.map(t => ({ ...t })) : defSqft.map(t => ({ ...t }));
                        } else {
                          updates.colorTiers = (saved === 'per_click' && editingEquipment) ? editingEquipment.colorTiers?.map(t => ({ ...t })) || defClick.map(t => ({ ...t })) : defClick.map(t => ({ ...t }));
                          updates.blackTiers = (saved === 'per_click' && editingEquipment) ? editingEquipment.blackTiers?.map(t => ({ ...t })) || defClick.map(t => ({ ...t })) : defClick.map(t => ({ ...t }));
                        }
                        return { ...f, ...updates };
                      });
                    }}
                    className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="per_click">Per Click</option>
                    <option value="per_sqft">Per Sq Ft</option>
                  </select>
                </div>

                {/* Cost Type */}
                <div className="w-36">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Cost Type</label>
                  <select value={equipForm.costType} onChange={e => setEquipForm(f => ({ ...f, costType: e.target.value as PricingEquipment['costType'] }))}
                    className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="cost_only">Cost Only</option>
                    <option value="cost_plus_time">Cost + Time</option>
                    <option value="time_only">Time Only</option>
                  </select>
                </div>

                {/* Setup Fee */}
                <div className="w-28">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Setup Fee</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                    <input type="number" step="0.01" min="0" value={equipForm.initialSetupFee || ''}
                      onChange={e => setEquipForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] text-right num" />
                  </div>
                </div>

                {/* Unit costs — inline on same row */}
                {showUnitCost && (
                  <>
                    <div className="w-px h-8 bg-gray-200 self-center flex-shrink-0" />
                    {equipForm.colorCapability === 'Color and Black' ? (
                      <>
                        <div className="w-28">
                          <label className="block text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-1">Color Cost</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                            <input
                              type="text" inputMode="decimal"
                              value={colorUnitCostStr}
                              onChange={e => {
                                const v = e.target.value;
                                setColorUnitCostStr(v);
                                const n = parseFloat(v);
                                if (!isNaN(n)) setEquipForm(f => ({ ...f, colorUnitCost: n }));
                              }}
                              onBlur={e => {
                                const n = parseFloat(e.target.value);
                                if (isNaN(n)) { setColorUnitCostStr(''); setEquipForm(f => ({ ...f, colorUnitCost: 0 })); }
                                else setColorUnitCostStr(n.toFixed(4));
                              }}
                              placeholder="0.0000"
                              className="w-full pl-6 pr-2 py-2 text-sm border border-blue-200 bg-blue-50/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-right num" />
                          </div>
                        </div>
                        <div className="w-28">
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">B&W Cost</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                            <input
                              type="text" inputMode="decimal"
                              value={blackUnitCostStr}
                              onChange={e => {
                                const v = e.target.value;
                                setBlackUnitCostStr(v);
                                const n = parseFloat(v);
                                if (!isNaN(n)) setEquipForm(f => ({ ...f, blackUnitCost: n }));
                              }}
                              onBlur={e => {
                                const n = parseFloat(e.target.value);
                                if (isNaN(n)) { setBlackUnitCostStr(''); setEquipForm(f => ({ ...f, blackUnitCost: 0 })); }
                                else setBlackUnitCostStr(n.toFixed(4));
                              }}
                              placeholder="0.0000"
                              className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] text-right num" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-28">
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Unit Cost</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                          <input
                            type="text" inputMode="decimal"
                            value={unitCostStr}
                            onChange={e => {
                              const v = e.target.value;
                              setUnitCostStr(v);
                              const n = parseFloat(v);
                              if (!isNaN(n)) setEquipForm(f => ({ ...f, unitCost: n }));
                            }}
                            onBlur={e => {
                              const n = parseFloat(e.target.value);
                              if (isNaN(n)) { setUnitCostStr(''); setEquipForm(f => ({ ...f, unitCost: 0 })); }
                              else setUnitCostStr(n.toFixed(4));
                            }}
                            placeholder="0.0000"
                            className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] text-right num" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Row 3: Time fields (Cost + Time / Time Only) ── */}
            {showTimeFields && (
              <div className="flex items-end gap-3 flex-wrap pt-1 border-t border-gray-100">
                <p className="w-full text-[10px] font-bold text-gray-500 uppercase tracking-wider -mb-1">Staff / Time Cost</p>
                <div className="w-28">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    Units/hr <span className="cursor-help text-gray-300" title="Sheets or pieces per hour">ⓘ</span>
                  </label>
                  <input type="number" value={equipForm.unitsPerHour || ''}
                    onChange={e => setEquipForm(f => ({ ...f, unitsPerHour: parseInt(e.target.value) || undefined }))}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]" />
                </div>
                <div className="w-36">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Staff $/hr</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                    <input type="number" step="0.01" value={equipForm.timeCostPerHour || ''}
                      onChange={e => setEquipForm(f => ({ ...f, timeCostPerHour: parseFloat(e.target.value) || undefined }))}
                      className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]" />
                  </div>
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Time Markup</label>
                  <div className="relative">
                    <input type="number" step="1" value={equipForm.timeCostMarkup || ''}
                      onChange={e => setEquipForm(f => ({ ...f, timeCostMarkup: parseFloat(e.target.value) || undefined }))}
                      className="w-full pl-2 pr-7 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">%</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Row 4: Markup (only when not using pricing tiers) ── */}
            {showUnitCost && (
              <div className="pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Markup</p>
                  {equipForm.usePricingTiers && (
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Overridden by Table Pricing</span>
                  )}
                </div>
                {equipForm.usePricingTiers ? (
                  <p className="text-xs text-gray-400 italic">Table Pricing is active — tier tables define sell prices.</p>
                ) : (
                  <div className="flex items-end gap-3 flex-wrap">
                    <div className="w-44">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Markup Type</label>
                      <select value={equipForm.markupType}
                        onChange={e => setEquipForm(f => ({ ...f, markupType: e.target.value as PricingEquipment['markupType'] }))}
                        className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                        <option value="multiplier">Multiplier (7×)</option>
                        <option value="percent">Markup % (70%)</option>
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        {equipForm.markupType === 'percent' ? 'Markup %' : 'Multiplier'}
                      </label>
                      <div className="relative">
                        <input type="number" step={equipForm.markupType === 'percent' ? '1' : '0.1'}
                          value={equipForm.markupMultiplier || ''}
                          onChange={e => setEquipForm(f => ({ ...f, markupMultiplier: parseFloat(e.target.value) || undefined }))}
                          placeholder={equipForm.markupType === 'percent' ? '70' : '7'}
                          className="w-full pl-2 pr-7 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                          {equipForm.markupType === 'percent' ? '%' : '×'}
                        </span>
                      </div>
                    </div>
                    {/* Live sell preview */}
                    {equipForm.markupMultiplier && (equipForm.colorUnitCost || equipForm.unitCost) > 0 && (
                      <div className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 self-end mb-0.5">
                        {equipForm.colorCapability === 'Color and Black' ? (
                          <>
                            <span className="text-blue-600 font-medium">Color</span>{' '}
                            <span className="font-bold text-emerald-700">
                              ${equipForm.markupType === 'percent'
                                ? ((equipForm.colorUnitCost||0) * (1 + equipForm.markupMultiplier/100)).toFixed(3)
                                : ((equipForm.colorUnitCost||0) * equipForm.markupMultiplier).toFixed(3)}
                            </span>{' · '}
                            <span className="text-gray-500">B&W</span>{' '}
                            <span className="font-bold text-emerald-700">
                              ${equipForm.markupType === 'percent'
                                ? ((equipForm.blackUnitCost||0) * (1 + equipForm.markupMultiplier/100)).toFixed(3)
                                : ((equipForm.blackUnitCost||0) * equipForm.markupMultiplier).toFixed(3)}
                            </span>
                            <span className="text-gray-400 ml-1">/{equipForm.costUnit === 'per_click' ? 'click' : 'sqft'}</span>
                          </>
                        ) : (
                          <>Sell: <span className="font-bold text-emerald-700">
                            ${equipForm.markupType === 'percent'
                              ? (equipForm.unitCost * (1 + equipForm.markupMultiplier/100)).toFixed(3)
                              : (equipForm.unitCost * equipForm.markupMultiplier).toFixed(3)}
                          </span><span className="text-gray-400 ml-1">/{equipForm.costUnit === 'per_click' ? 'click' : 'sqft'}</span></>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Section: Table Pricing ──────────────────────────────────────── */}
            {showUnitCost && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Table Pricing</h4>
                    <span className="text-[10px] text-gray-400">— volume-based sell price tiers</span>
                  </div>
                  {/* Enable/Disable toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      {equipForm.usePricingTiers ? 'Enabled' : 'Disabled'}
                    </span>
                    <div
                      onClick={() => setEquipForm(f => ({ ...f, usePricingTiers: !f.usePricingTiers }))}
                      className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${equipForm.usePricingTiers ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${equipForm.usePricingTiers ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>

                {equipForm.usePricingTiers ? (
                  <div className="p-4 space-y-4">
                    <p className="text-xs text-gray-500">
                      Enter the <strong>sell price per {equipForm.costUnit === 'per_click' ? 'click' : 'sq ft'}</strong> at each volume threshold.
                      The highest matching tier will be used. Markup fields above are disabled.
                    </p>
                    <div className={`grid gap-4 ${equipForm.colorCapability === 'Color and Black' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {(equipForm.colorCapability === 'Color' || equipForm.colorCapability === 'Color and Black') && (
                        <TierEditor
                          label={equipForm.costUnit === 'per_sqft' ? 'Sell Tiers (Color) — per Sq Ft' : 'Sell Tiers (Color) — per Click'}
                          tiers={equipForm.colorTiers}
                          onChange={tiers => setEquipForm(f => ({ ...f, colorTiers: tiers }))}
                          qtyLabel={equipForm.costUnit === 'per_sqft' ? 'Min Sq Ft' : 'Min Clicks'}
                          priceLabel={equipForm.costUnit === 'per_sqft' ? 'Sell $/sq ft' : 'Sell $/click'}
                        />
                      )}
                      {(equipForm.colorCapability === 'Black' || equipForm.colorCapability === 'Color and Black') && (
                        <TierEditor
                          label={equipForm.costUnit === 'per_sqft' ? 'Sell Tiers (Black) — per Sq Ft' : 'Sell Tiers (Black) — per Click'}
                          tiers={equipForm.blackTiers}
                          onChange={tiers => setEquipForm(f => ({ ...f, blackTiers: tiers }))}
                          qtyLabel={equipForm.costUnit === 'per_sqft' ? 'Min Sq Ft' : 'Min Clicks'}
                          priceLabel={equipForm.costUnit === 'per_sqft' ? 'Sell $/sq ft' : 'Sell $/click'}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="text-xs text-gray-400">Enable table pricing to define volume-based sell prices. When active, the markup fields above will be disabled.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Test Price Panel ─────────────────────────────────────────── */}
            {showTestPanel && showUnitCost && (() => {
              const isColorAndBlack = equipForm.colorCapability === 'Color and Black';
              const res = computeEquipTest(testClicks, testColorMode);
              const unitLabel = equipForm.costUnit === 'per_click' ? 'clicks' : 'sq ft';
              return (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[11px] font-semibold text-amber-800">Test Price</span>
                    </div>
                    <button onClick={() => setShowTestPanel(false)} className="p-0.5 hover:bg-amber-100 rounded">
                      <X className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  </div>

                  {/* Inputs row */}
                  <div className="flex items-end gap-3 flex-wrap">
                    <div>
                      <label className="block text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">
                        {equipForm.costUnit === 'per_click' ? 'Test Clicks' : 'Test Sq Ft'}
                      </label>
                      <input type="number" min="1" value={testClicks}
                        onChange={e => setTestClicks(parseInt(e.target.value) || 1)}
                        className="w-28 px-2 py-1.5 text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-right num" />
                    </div>
                    {isColorAndBlack && (
                      <div>
                        <label className="block text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Color Mode</label>
                        <div className="flex gap-1">
                          {(['Color', 'Black'] as const).map(m => (
                            <button key={m} type="button" onClick={() => setTestColorMode(m)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${testColorMode === m ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'}`}>
                              {m === 'Color' ? '🔵 Color' : '⚫ B&W'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Results */}
                  <div className="bg-white/70 rounded-lg px-3 py-2.5 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Unit cost ({isColorAndBlack ? testColorMode : ''}):</span>
                      <span className="font-medium text-gray-700 num">${res.unitCostForMode.toFixed(4)}/{equipForm.costUnit === 'per_click' ? 'click' : 'sqft'}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Cost ({testClicks.toLocaleString()} {unitLabel}):</span>
                      <span className="font-medium text-gray-700 num">{formatCurrency(res.clickCost)}</span>
                    </div>
                    {res.timeCost > 0 && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Staff time cost:</span>
                        <span className="font-medium text-gray-700 num">{formatCurrency(res.timeCost)}</span>
                      </div>
                    )}
                    {res.setupFee > 0 && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Setup fee:</span>
                        <span className="font-medium text-gray-700 num">{formatCurrency(res.setupFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px] pt-1 border-t border-amber-200">
                      <span className="text-gray-600 font-medium">Total Cost:</span>
                      <span className="font-semibold text-gray-800 num">{formatCurrency(res.totalCost)}</span>
                    </div>
                    {res.sellPerUnit > 0 && (
                      <>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500">Sell price ({testClicks.toLocaleString()} {unitLabel}):</span>
                          <span className="font-medium text-emerald-700 num">{formatCurrency(res.clickSell)}</span>
                        </div>
                        {res.timeSell > 0 && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Staff sell:</span>
                            <span className="font-medium text-emerald-700 num">{formatCurrency(res.timeSell)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[11px] pt-1 border-t border-amber-200">
                          <span className="font-bold text-amber-800">= Total Sell:</span>
                          <span className="font-bold text-emerald-700 num text-sm">{formatCurrency(res.totalSell)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400">Margin:</span>
                          <span className={`font-semibold num ${res.margin >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{res.margin.toFixed(1)}%</span>
                        </div>
                      </>
                    )}
                    {res.sellPerUnit === 0 && (
                      <p className="text-[10px] text-amber-600 italic">Set a markup or enable Table Pricing to see sell price.</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── Save / Cancel — with inline validation ──────────────────── */}
            {(() => {
              const errors: string[] = [];
              if (!equipForm.name.trim()) errors.push('Equipment name is required.');
              if (showUnitCost) {
                const hasMarkup   = (equipForm.markupMultiplier ?? 0) > 0;
                const hasTiers    = equipForm.usePricingTiers;
                if (!hasMarkup && !hasTiers)
                  errors.push('Choose a pricing method: set a Markup value, or enable Table Pricing.');
              }
              const canSave = errors.length === 0;
              return (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {errors.length > 0 && (
                    <div className="space-y-1">
                      {errors.map((err, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                          <span className="flex-shrink-0">⚠</span>
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    {/* Test Price button */}
                    {showUnitCost && (
                      <button type="button" onClick={() => setShowTestPanel(p => !p)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 hover:text-amber-800 transition-colors">
                        <FlaskConical className="w-3.5 h-3.5" />
                        {showTestPanel ? 'Hide Test' : 'Test Price'}
                      </button>
                    )}
                    {!showUnitCost && <span />}
                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                      <Button variant="primary" onClick={editingEquipId ? handleSaveEditEquip : handleAddEquip} disabled={!canSave}>
                        {editingEquipId ? 'Save Changes' : 'Add Equipment'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════ MAINTENANCE TAB ═══════════ */}
        {modalTab === 'maintenance' && editingEquipId && (
          <div className="space-y-5">
            {/* Maintenance Vendor Assignment */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Maintenance Vendor</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Assign a vendor from your catalog responsible for servicing this equipment.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={equipForm.maintenanceVendorId || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setEquipForm(f => ({ ...f, maintenanceVendorId: val || undefined }));
                    // Auto-save the vendor assignment
                    updateEquipment(editingEquipId, { maintenanceVendorId: val || undefined });
                  }}
                  className="flex-1 max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No vendor assigned</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}{v.email ? ` (${v.email})` : ''}</option>
                  ))}
                </select>
                {equipForm.maintenanceVendorId && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Assigned
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Service History</h4>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Mail className="w-3.5 h-3.5" />}
                  onClick={handleRequestService}
                  disabled={!equipForm.maintenanceVendorId}
                >
                  Request Service
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenServiceForm()}
                >
                  Schedule Service
                </Button>
              </div>
            </div>

            {!equipForm.maintenanceVendorId && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Assign a maintenance vendor above to enable the "Request Service" feature.
              </div>
            )}

            {/* Service Form (inline) */}
            {showServiceForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-blue-900">
                    {editingServiceId ? 'Edit Service Record' : serviceForm.status === 'Requested' ? 'Request Service' : 'Schedule Service'}
                  </h5>
                  <button onClick={() => { setShowServiceForm(false); setEditingServiceId(null); }}
                    className="p-1 hover:bg-blue-100 rounded">
                    <X className="w-4 h-4 text-blue-600" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                    <input value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="e.g. Annual preventive maintenance, Belt replacement..."
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {serviceForm.status === 'Requested' ? 'Requested On' : 'Scheduled For'}
                    </label>
                    <input type="date" value={serviceForm.scheduledOn}
                      onChange={e => setServiceForm(f => ({ ...f, scheduledOn: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                    <select value={serviceForm.status} onChange={e => setServiceForm(f => ({ ...f, status: e.target.value as MaintenanceStatus }))}
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="Requested">Requested</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Service Vendor</label>
                    <select value={serviceForm.servicedByVendorId}
                      onChange={e => setServiceForm(f => ({ ...f, servicedByVendorId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">Select vendor...</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  {serviceForm.status === 'Completed' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Service Date</label>
                      <input type="date" value={serviceForm.serviceDate}
                        onChange={e => setServiceForm(f => ({ ...f, serviceDate: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                    <input value={serviceForm.notes} onChange={e => setServiceForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>

                {serviceForm.status === 'Requested' && equipForm.maintenanceVendorId && (
                  <div className="bg-white rounded-lg border border-blue-100 p-3 flex items-center gap-2 text-xs text-blue-700">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    An email notification will be sent to <strong>{getVendorName(equipForm.maintenanceVendorId)}</strong> with this service request.
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="secondary" size="sm" onClick={() => { setShowServiceForm(false); setEditingServiceId(null); }}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleSaveService} disabled={!serviceForm.description}>
                    {editingServiceId ? 'Update' : serviceForm.status === 'Requested' ? 'Send Request' : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            {/* Completion Form (inline) */}
            {showCompletionForm && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <h5 className="text-sm font-semibold text-emerald-900">Mark as Completed</h5>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Next Scheduled Maintenance (optional)</label>
                  <input type="date" value={nextMaintDate}
                    onChange={e => setNextMaintDate(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
                  <p className="text-[10px] text-gray-500 mt-1">If set, this creates a new scheduled maintenance record for the same vendor on that date.</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" size="sm" onClick={() => setShowCompletionForm(null)}>Cancel</Button>
                  <Button variant="success" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={handleConfirmComplete}>
                    Complete
                  </Button>
                </div>
              </div>
            )}

            {/* Service History List */}
            {maintenanceHistory.length === 0 && !showServiceForm ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">No maintenance records</p>
                <p className="text-xs text-gray-400 mt-1">Schedule or request a service to start tracking maintenance.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {maintenanceHistory.map(record => {
                  const cfg = STATUS_CONFIG[record.status];
                  return (
                    <div key={record.id} className={`border rounded-xl p-4 transition-colors ${cfg.bg}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
                              {cfg.icon}
                              {record.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {record.status === 'Completed' && record.serviceDate
                                ? `Serviced ${formatDate(record.serviceDate)}`
                                : `${record.status === 'Requested' ? 'Requested' : 'Scheduled'} ${formatDate(record.scheduledOn)}`
                              }
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{record.description}</p>
                          {record.servicedByVendorName && (
                            <p className="text-xs text-gray-500 mt-1">
                              Vendor: <span className="font-medium">{record.servicedByVendorName}</span>
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-xs text-gray-400 mt-1 italic">{record.notes}</p>
                          )}
                          {record.nextMaintenanceDate && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" />
                              Next maintenance: {formatDate(record.nextMaintenanceDate)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {(record.status === 'Requested' || record.status === 'Scheduled') && (
                            <button
                              onClick={() => handleCompleteService(record.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded"
                              title="Mark as Completed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleOpenServiceForm(record)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteMaintenanceRecord(editingEquipId, record.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50/50 rounded" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        </div>{/* end tab content wrapper */}
      </Modal>
    </div>
  );
};
