import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit3, X, Search, Copy, Info,
  ChevronDown, ChevronUp, Camera, Wrench, Calendar,
  Mail, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight
} from 'lucide-react';
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
}> = ({ label, tiers, onChange }) => {
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
      <div className="space-y-1">
        {tiers.map((t, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input type="number" value={t.minQty} onChange={e => updateTier(i, 'minQty', parseInt(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-xs border rounded" placeholder="Min Qty" />
            <span className="text-xs text-gray-400">@</span>
            <input type="number" value={t.pricePerUnit} onChange={e => updateTier(i, 'pricePerUnit', parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-xs border rounded" placeholder="$/unit" step="0.001" />
            <button onClick={() => removeTier(i)} className="p-0.5 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const Equipment: React.FC = () => {
  const {
    equipment, addEquipment, updateEquipment, deleteEquipment,
    addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord,
    categories,
  } = usePricingStore();
  const { vendors } = useStore();

  const [search, setSearch] = useState('');

  // ── Equipment state ──
  const [showNewEquip, setShowNewEquip] = useState(false);
  const [editingEquipId, setEditingEquipId] = useState<string | null>(null);
  const [expandedEquipId, setExpandedEquipId] = useState<string | null>(null);
  const [equipForm, setEquipForm] = useState(emptyEquipmentForm);
  const [deleteEquipConfirm, setDeleteEquipConfirm] = useState<string | null>(null);

  // ── Modal tabs ──
  const [modalTab, setModalTab] = useState<ModalTab>('details');

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
      colorTiers: e.colorTiers || [],
      blackTiers: e.blackTiers || [],
      initialSetupFee: e.initialSetupFee,
      unitsPerHour: e.unitsPerHour,
      timeCostPerHour: e.timeCostPerHour,
      timeCostMarkup: e.timeCostMarkup,
      imageUrl: e.imageUrl || '',
      maintenanceVendorId: e.maintenanceVendorId || '',
    });
    setModalTab('details');
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
    updateMaintenanceRecord(editingEquipId, showCompletionForm, {
      status: 'Completed',
      serviceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: nextMaintDate || undefined,
    });
    setShowCompletionForm(null);
  };

  // Helpers for form display
  const showTimeFields = equipForm.costType === 'time_only' || equipForm.costType === 'cost_plus_time';
  const showUnitCost = equipForm.costType === 'cost_only' || equipForm.costType === 'cost_plus_time';

  const showColorTiers = (eq: PricingEquipment) =>
    eq.colorCapability === 'Color' || eq.colorCapability === 'Color and Black';
  const showBlackTiers = (eq: PricingEquipment) =>
    eq.colorCapability === 'Black' || eq.colorCapability === 'Color and Black';

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
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setEquipForm(emptyEquipmentForm); setModalTab('details'); setShowNewEquip(true); }}>
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
                            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Color Tiers</p>
                            <table className="w-full text-xs">
                              <thead><tr className="text-gray-400"><th className="text-left py-1">Min Qty</th><th className="text-right py-1">Price/Unit</th></tr></thead>
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
                            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Black Tiers</p>
                            <table className="w-full text-xs">
                              <thead><tr className="text-gray-400"><th className="text-left py-1">Min Qty</th><th className="text-right py-1">Price/Unit</th></tr></thead>
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
        size="full"
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

        {/* ═══════════ DETAILS TAB ═══════════ */}
        {(modalTab === 'details' || !editingEquipId) && (
          <div className="space-y-4">
            {/* Photo + Name row */}
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Photo</label>
                <ImageUploadCropper
                  value={equipForm.imageUrl || ''}
                  onChange={(url) => setEquipForm(f => ({ ...f, imageUrl: url }))}
                  size={80}
                />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Equipment Name</label>
                  <input
                    value={equipForm.name}
                    onChange={e => setEquipForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Ricoh 9200"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                  <select value={equipForm.categoryApplies} onChange={e => setEquipForm(f => ({ ...f, categoryApplies: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing configuration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color Capability</label>
                <select value={equipForm.colorCapability} onChange={e => setEquipForm(f => ({ ...f, colorCapability: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Color and Black">Color and Black</option>
                  <option value="Color">Color Only</option>
                  <option value="Black">Black Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cost Unit</label>
                <select value={equipForm.costUnit} onChange={e => setEquipForm(f => ({ ...f, costUnit: e.target.value as EquipmentCostUnit }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="per_click">Per Click</option>
                  <option value="per_sqft">Per Sq Ft</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cost Type</label>
                <select value={equipForm.costType} onChange={e => setEquipForm(f => ({ ...f, costType: e.target.value as PricingEquipment['costType'] }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="cost_only">Cost Only</option>
                  <option value="cost_plus_time">Cost + Time</option>
                  <option value="time_only">Time Only</option>
                </select>
              </div>
            </div>

            {showUnitCost && (
              <div className="grid grid-cols-4 gap-4">
                <Input label="Unit Cost ($)" type="number" value={equipForm.unitCost || ''}
                  onChange={e => setEquipForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
                <Input label="Setup Fee ($)" type="number" value={equipForm.initialSetupFee || ''}
                  onChange={e => setEquipForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Markup Type</label>
                  <select value={equipForm.markupType} onChange={e => setEquipForm(f => ({ ...f, markupType: e.target.value as PricingEquipment['markupType'] }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="multiplier">Multiplier (e.g. 7x)</option>
                    <option value="percent">Percent (e.g. 70%)</option>
                  </select>
                </div>
                <Input
                  label={equipForm.markupType === 'percent' ? 'Markup %' : 'Markup Multiplier'}
                  type="number"
                  value={equipForm.markupMultiplier || ''}
                  onChange={e => setEquipForm(f => ({ ...f, markupMultiplier: parseFloat(e.target.value) || undefined }))}
                  placeholder={equipForm.markupType === 'percent' ? 'e.g. 70' : 'e.g. 7'}
                  suffix={equipForm.markupType === 'percent' ? '%' : 'x'}
                />
              </div>
            )}

            {showTimeFields && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Units/Hour</label>
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Units = sheets or pieces ran through equipment
                      </div>
                    </div>
                  </div>
                  <input type="number" value={equipForm.unitsPerHour || ''} onChange={e => setEquipForm(f => ({ ...f, unitsPerHour: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <Input label="Time Cost/Hour ($)" type="number" value={equipForm.timeCostPerHour || ''}
                  onChange={e => setEquipForm(f => ({ ...f, timeCostPerHour: parseFloat(e.target.value) || undefined }))} prefix="$" />
                <Input label="Time Cost Markup %" type="number" value={equipForm.timeCostMarkup || ''}
                  onChange={e => setEquipForm(f => ({ ...f, timeCostMarkup: parseFloat(e.target.value) || undefined }))} suffix="%" />
              </div>
            )}

            {!showUnitCost && (
              <div className="grid grid-cols-3 gap-4">
                <Input label="Setup Fee ($)" type="number" value={equipForm.initialSetupFee || ''}
                  onChange={e => setEquipForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
              </div>
            )}

            {/* Tier editors */}
            {equipForm.costUnit === 'per_click' && showUnitCost && (
              <div className={`grid gap-4 ${
                equipForm.colorCapability === 'Color and Black' ? 'grid-cols-2' : 'grid-cols-1'
              }`}>
                {(equipForm.colorCapability === 'Color' || equipForm.colorCapability === 'Color and Black') && (
                  <TierEditor label="Color Tiers" tiers={equipForm.colorTiers} onChange={tiers => setEquipForm(f => ({ ...f, colorTiers: tiers }))} />
                )}
                {(equipForm.colorCapability === 'Black' || equipForm.colorCapability === 'Color and Black') && (
                  <TierEditor label="Black Tiers" tiers={equipForm.blackTiers} onChange={tiers => setEquipForm(f => ({ ...f, blackTiers: tiers }))} />
                )}
              </div>
            )}

            {/* Save / Cancel */}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button variant="primary" onClick={editingEquipId ? handleSaveEditEquip : handleAddEquip} disabled={!equipForm.name}>
                {editingEquipId ? 'Save Changes' : 'Add Equipment'}
              </Button>
            </div>
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
                  <p className="text-[10px] text-gray-500 mt-1">Set a date for the next maintenance reminder.</p>
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
      </Modal>
    </div>
  );
};
