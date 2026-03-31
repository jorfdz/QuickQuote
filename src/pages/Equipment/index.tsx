import React, { useState } from 'react';
import {
  Plus, Trash2, Edit3, X, Search, Copy, Info,
  ChevronDown, ChevronUp, Camera
} from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import { ImageUploadCropper } from '../../components/ui/ImageUploadCropper';
import type {
  PricingEquipment, EquipmentPricingTier, EquipmentCostUnit
} from '../../types/pricing';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`;

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
};

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
    categories,
  } = usePricingStore();

  const [search, setSearch] = useState('');

  // ── Equipment state ──
  const [showNewEquip, setShowNewEquip] = useState(false);
  const [editingEquipId, setEditingEquipId] = useState<string | null>(null);
  const [expandedEquipId, setExpandedEquipId] = useState<string | null>(null);
  const [equipForm, setEquipForm] = useState(emptyEquipmentForm);
  const [deleteEquipConfirm, setDeleteEquipConfirm] = useState<string | null>(null);

  // ── Filtered list ──
  const filteredEquipment = equipment.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.categoryApplies.toLowerCase().includes(search.toLowerCase())
  );

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
    });
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
    });
  };

  // Helper: should we show time fields in the modal?
  const showTimeFields = equipForm.costType === 'time_only' || equipForm.costType === 'cost_plus_time';
  const showUnitCost = equipForm.costType === 'cost_only' || equipForm.costType === 'cost_plus_time';

  // Helper: which tier columns to show for a given equipment
  const showColorTiers = (eq: PricingEquipment) =>
    eq.colorCapability === 'Color' || eq.colorCapability === 'Color and Black';
  const showBlackTiers = (eq: PricingEquipment) =>
    eq.colorCapability === 'Black' || eq.colorCapability === 'Color and Black';

  // ══════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle={`${equipment.length} equipment item${equipment.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setEquipForm(emptyEquipmentForm); setShowNewEquip(true); }}>
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
        <Table headers={['Equipment', 'Category', 'Cost Model', 'Unit Cost', 'Setup Fee', 'Markup', 'Tiers', 'Actions']}>
          {filteredEquipment.map(eq => {
            const isExpanded = expandedEquipId === eq.id;
            const colorTierCount = showColorTiers(eq) ? (eq.colorTiers || []).length : 0;
            const blackTierCount = showBlackTiers(eq) ? (eq.blackTiers || []).length : 0;
            const totalTiers = colorTierCount + blackTierCount;

            return (
              <React.Fragment key={eq.id}>
                <tr
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleStartEditEquip(eq)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {eq.imageUrl ? (
                        <img
                          src={eq.imageUrl}
                          alt={eq.name}
                          className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                        />
                      ) : null}
                      {!eq.imageUrl && (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Camera className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      )}
                      {eq.imageUrl && (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 items-center justify-center flex-shrink-0 hidden">
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
                {/* Expanded tiers row - only show relevant color capability tiers */}
                {isExpanded && (
                  <tr>
                    <td colSpan={8} className="px-4 py-3 bg-gray-50 border-t border-gray-100">
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

      {/* ═══════════════ ADD / EDIT EQUIPMENT MODAL ═══════════════ */}
      <Modal isOpen={showNewEquip || editingEquipId !== null} onClose={() => { setShowNewEquip(false); setEditingEquipId(null); setImageError(false); }}
        title={editingEquipId ? 'Edit Equipment' : 'Add Equipment'} size="lg">
        <div className="space-y-4">

          {/* Equipment Photo */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Photo</label>
              <ImageUploadCropper
                value={equipForm.imageUrl || ''}
                onChange={(url) => setEquipForm(f => ({ ...f, imageUrl: url }))}
                size={80}
              />
            </div>
            <div className="flex-1 pt-6">
              <p className="text-xs text-gray-400">Click the photo to upload an image from your computer or paste a public URL. You can crop it before saving.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Cost Type
              </label>
              <select value={equipForm.costType} onChange={e => setEquipForm(f => ({ ...f, costType: e.target.value as PricingEquipment['costType'] }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cost_only">Cost Only</option>
                <option value="cost_plus_time">Cost + Time</option>
                <option value="time_only">Time Only</option>
              </select>
            </div>
          </div>

          {/* Unit cost - hidden when time_only */}
          {showUnitCost && (
            <div className="grid grid-cols-3 gap-4">
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
            </div>
          )}

          {showUnitCost && (
            <div className="grid grid-cols-3 gap-4">
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

          {/* Time fields - shown when cost_plus_time or time_only */}
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

          {/* Setup fee for time_only */}
          {!showUnitCost && (
            <div className="grid grid-cols-3 gap-4">
              <Input label="Setup Fee ($)" type="number" value={equipForm.initialSetupFee || ''}
                onChange={e => setEquipForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
            </div>
          )}

          {/* Tier editors - only show relevant ones based on colorCapability */}
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

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => { setShowNewEquip(false); setEditingEquipId(null); setImageError(false); }}>Cancel</Button>
            <Button variant="primary" onClick={editingEquipId ? handleSaveEditEquip : handleAddEquip} disabled={!equipForm.name}>
              {editingEquipId ? 'Save Changes' : 'Add Equipment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
