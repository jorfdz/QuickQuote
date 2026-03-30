import React, { useState } from 'react';
import {
  Plus, Trash2, Edit3, X, Search, Wrench, Scissors,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import type {
  PricingEquipment, PricingFinishing, EquipmentPricingTier, EquipmentCostUnit
} from '../../types/pricing';

// ─── Tab type ────────────────────────────────────────────────────────────────
type TabKey = 'equipment' | 'finishing';

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
  unitCost: 0,
  colorTiers: [] as EquipmentPricingTier[],
  blackTiers: [] as EquipmentPricingTier[],
  initialSetupFee: 0,
  unitsPerHour: undefined as number | undefined,
  timeCostPerHour: undefined as number | undefined,
  timeCostMarkup: undefined as number | undefined,
};

const emptyFinishingForm = {
  service: '',
  subservice: '',
  costType: 'time_only' as PricingFinishing['costType'],
  outputPerHour: 0,
  hourlyCost: 0,
  timeCostMarkup: 0,
  notes: '',
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
    finishing, addFinishing, updateFinishing, deleteFinishing,
    categories,
  } = usePricingStore();

  const [tab, setTab] = useState<TabKey>('equipment');
  const [search, setSearch] = useState('');

  // ── Equipment state ──
  const [showNewEquip, setShowNewEquip] = useState(false);
  const [editingEquipId, setEditingEquipId] = useState<string | null>(null);
  const [expandedEquipId, setExpandedEquipId] = useState<string | null>(null);
  const [equipForm, setEquipForm] = useState(emptyEquipmentForm);
  const [deleteEquipConfirm, setDeleteEquipConfirm] = useState<string | null>(null);

  // ── Finishing state ──
  const [showNewFinish, setShowNewFinish] = useState(false);
  const [editingFinishId, setEditingFinishId] = useState<string | null>(null);
  const [finishForm, setFinishForm] = useState(emptyFinishingForm);
  const [deleteFinishConfirm, setDeleteFinishConfirm] = useState<string | null>(null);

  // ── Filtered lists ──
  const filteredEquipment = equipment.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.categoryApplies.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFinishing = finishing.filter(f =>
    !search || f.service.toLowerCase().includes(search.toLowerCase()) || (f.subservice || '').toLowerCase().includes(search.toLowerCase())
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
      unitCost: equipForm.unitCost,
      colorTiers: equipForm.colorTiers,
      blackTiers: equipForm.blackTiers,
      initialSetupFee: equipForm.initialSetupFee,
      unitsPerHour: equipForm.unitsPerHour,
      timeCostPerHour: equipForm.timeCostPerHour,
      timeCostMarkup: equipForm.timeCostMarkup,
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
      unitCost: e.unitCost,
      colorTiers: e.colorTiers || [],
      blackTiers: e.blackTiers || [],
      initialSetupFee: e.initialSetupFee,
      unitsPerHour: e.unitsPerHour,
      timeCostPerHour: e.timeCostPerHour,
      timeCostMarkup: e.timeCostMarkup,
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
      unitCost: equipForm.unitCost,
      colorTiers: equipForm.colorTiers,
      blackTiers: equipForm.blackTiers,
      initialSetupFee: equipForm.initialSetupFee,
      unitsPerHour: equipForm.unitsPerHour,
      timeCostPerHour: equipForm.timeCostPerHour,
      timeCostMarkup: equipForm.timeCostMarkup,
    });
    setEditingEquipId(null);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  FINISHING HANDLERS
  // ══════════════════════════════════════════════════════════════════════════════

  const handleAddFinish = () => {
    addFinishing({
      service: finishForm.service,
      subservice: finishForm.subservice || undefined,
      costType: finishForm.costType,
      outputPerHour: finishForm.outputPerHour,
      hourlyCost: finishForm.hourlyCost,
      timeCostMarkup: finishForm.timeCostMarkup,
      notes: finishForm.notes || undefined,
    });
    setShowNewFinish(false);
    setFinishForm(emptyFinishingForm);
  };

  const handleStartEditFinish = (f: PricingFinishing) => {
    setEditingFinishId(f.id);
    setFinishForm({
      service: f.service,
      subservice: f.subservice || '',
      costType: f.costType,
      outputPerHour: f.outputPerHour,
      hourlyCost: f.hourlyCost,
      timeCostMarkup: f.timeCostMarkup,
      notes: f.notes || '',
    });
  };

  const handleSaveEditFinish = () => {
    if (!editingFinishId) return;
    updateFinishing(editingFinishId, {
      service: finishForm.service,
      subservice: finishForm.subservice || undefined,
      costType: finishForm.costType,
      outputPerHour: finishForm.outputPerHour,
      hourlyCost: finishForm.hourlyCost,
      timeCostMarkup: finishForm.timeCostMarkup,
      notes: finishForm.notes || undefined,
    });
    setEditingFinishId(null);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Equipment & Finishing"
        subtitle={`${equipment.length} equipment items, ${finishing.length} finishing services`}
        actions={
          tab === 'equipment' ? (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setEquipForm(emptyEquipmentForm); setShowNewEquip(true); }}>
              Add Equipment
            </Button>
          ) : (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setFinishForm(emptyFinishingForm); setShowNewFinish(true); }}>
              Add Finishing
            </Button>
          )
        }
      />

      {/* Tabs + Search */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
          <div className="flex border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => { setTab('equipment'); setSearch(''); }}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${tab === 'equipment' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Wrench className="w-3.5 h-3.5" /> Equipment ({equipment.length})
            </button>
            <button
              onClick={() => { setTab('finishing'); setSearch(''); }}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${tab === 'finishing' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Scissors className="w-3.5 h-3.5" /> Finishing ({finishing.length})
            </button>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${tab}...`}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* ═══════════════ EQUIPMENT TAB ═══════════════ */}
      {tab === 'equipment' && (
        <Card>
          <Table headers={['Equipment', 'Category', 'Cost Model', 'Unit Cost', 'Setup Fee', 'Markup', 'Tiers', 'Actions']}>
            {filteredEquipment.map(eq => {
              const isExpanded = expandedEquipId === eq.id;
              const colorTierCount = (eq.colorTiers || []).length;
              const blackTierCount = (eq.blackTiers || []).length;
              const totalTiers = colorTierCount + blackTierCount;

              return (
                <React.Fragment key={eq.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-gray-900">{eq.name}</p>
                      <p className="text-xs text-gray-400">{eq.colorCapability}</p>
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
                      {eq.markupMultiplier ? `${eq.markupMultiplier}x` : '—'}
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => handleStartEditEquip(eq)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
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
                      <td colSpan={8} className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 max-w-2xl">
                          {colorTierCount > 0 && (
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
                          {blackTierCount > 0 && (
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
      )}

      {/* ═══════════════ FINISHING TAB ═══════════════ */}
      {tab === 'finishing' && (
        <Card>
          <Table headers={['Service', 'Sub-Service', 'Output/Hour', 'Hourly Cost', 'Cost/Unit', 'Markup %', 'Notes', 'Actions']}>
            {filteredFinishing.map(f => {
              const costPerUnit = f.outputPerHour > 0 ? f.hourlyCost / f.outputPerHour : 0;

              return (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{f.service}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{f.subservice || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">{f.outputPerHour.toLocaleString()}/hr</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formatCurrency(f.hourlyCost)}/hr</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{costPerUnit > 0 ? formatCurrency(costPerUnit) : '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{f.timeCostMarkup}%</td>
                  <td className="py-3 px-4 text-xs text-gray-400 max-w-[150px] truncate">{f.notes || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => handleStartEditFinish(f)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {deleteFinishConfirm === f.id ? (
                        <div className="flex gap-1 items-center">
                          <button onClick={() => { deleteFinishing(f.id); setDeleteFinishConfirm(null); }} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded">Delete</button>
                          <button onClick={() => setDeleteFinishConfirm(null)} className="px-2 py-0.5 text-xs text-gray-500">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteFinishConfirm(f.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
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
            <div className="text-center py-12 text-gray-400"><p className="text-sm">No finishing services found</p></div>
          )}
        </Card>
      )}

      {/* ═══════════════ ADD EQUIPMENT MODAL ═══════════════ */}
      <Modal isOpen={showNewEquip || editingEquipId !== null} onClose={() => { setShowNewEquip(false); setEditingEquipId(null); }}
        title={editingEquipId ? 'Edit Equipment' : 'Add Equipment'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Equipment Name" value={equipForm.name} onChange={e => setEquipForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Ricoh 9200" />
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
            <Input label="Unit Cost ($)" type="number" value={equipForm.unitCost || ''}
              onChange={e => setEquipForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Setup Fee ($)" type="number" value={equipForm.initialSetupFee || ''}
              onChange={e => setEquipForm(f => ({ ...f, initialSetupFee: parseFloat(e.target.value) || 0 }))} prefix="$" />
            <Input label="Markup Multiplier" type="number" value={equipForm.markupMultiplier || ''}
              onChange={e => setEquipForm(f => ({ ...f, markupMultiplier: parseFloat(e.target.value) || undefined }))} placeholder="e.g. 7" />
            <Input label="Units/Hour" type="number" value={equipForm.unitsPerHour || ''}
              onChange={e => setEquipForm(f => ({ ...f, unitsPerHour: parseInt(e.target.value) || undefined }))} />
          </div>

          {/* Tier editors */}
          {equipForm.costUnit === 'per_click' && (
            <div className="grid grid-cols-2 gap-4">
              <TierEditor label="Color Tiers" tiers={equipForm.colorTiers} onChange={tiers => setEquipForm(f => ({ ...f, colorTiers: tiers }))} />
              <TierEditor label="Black Tiers" tiers={equipForm.blackTiers} onChange={tiers => setEquipForm(f => ({ ...f, blackTiers: tiers }))} />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => { setShowNewEquip(false); setEditingEquipId(null); }}>Cancel</Button>
            <Button variant="primary" onClick={editingEquipId ? handleSaveEditEquip : handleAddEquip} disabled={!equipForm.name}>
              {editingEquipId ? 'Save Changes' : 'Add Equipment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════ ADD / EDIT FINISHING MODAL ═══════════════ */}
      <Modal isOpen={showNewFinish || editingFinishId !== null} onClose={() => { setShowNewFinish(false); setEditingFinishId(null); }}
        title={editingFinishId ? 'Edit Finishing Service' : 'Add Finishing Service'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Service" value={finishForm.service} onChange={e => setFinishForm(f => ({ ...f, service: e.target.value }))}
              placeholder="e.g. Cut, Fold, Drill" />
            <Input label="Sub-Service (optional)" value={finishForm.subservice} onChange={e => setFinishForm(f => ({ ...f, subservice: e.target.value }))}
              placeholder="e.g. Tri-Fold, 1 Hole" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Output/Hour" type="number" value={finishForm.outputPerHour || ''} onChange={e => setFinishForm(f => ({ ...f, outputPerHour: parseInt(e.target.value) || 0 }))}
              placeholder="e.g. 150" />
            <Input label="Hourly Cost ($)" type="number" value={finishForm.hourlyCost || ''} onChange={e => setFinishForm(f => ({ ...f, hourlyCost: parseFloat(e.target.value) || 0 }))}
              prefix="$" />
            <Input label="Markup %" type="number" value={finishForm.timeCostMarkup || ''} onChange={e => setFinishForm(f => ({ ...f, timeCostMarkup: parseFloat(e.target.value) || 0 }))}
              suffix="%" />
          </div>
          {finishForm.outputPerHour > 0 && finishForm.hourlyCost > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Cost per unit:</span><span className="font-medium">{formatCurrency(finishForm.hourlyCost / finishForm.outputPerHour)}</span></div>
            </div>
          )}
          <Input label="Notes (optional)" value={finishForm.notes} onChange={e => setFinishForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any additional notes" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => { setShowNewFinish(false); setEditingFinishId(null); }}>Cancel</Button>
            <Button variant="primary" onClick={editingFinishId ? handleSaveEditFinish : handleAddFinish} disabled={!finishForm.service || finishForm.outputPerHour <= 0}>
              {editingFinishId ? 'Save Changes' : 'Add Finishing'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
