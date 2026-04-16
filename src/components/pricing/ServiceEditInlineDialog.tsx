/**
 * ServiceEditInlineDialog
 *
 * Full-featured service edit dialog rendered directly inside the Edit Item modal.
 * Shows the complete form for Labor, Finishing, or Brokered services — the same
 * fields the user sees in the catalog service pages.
 *
 * After saving, the caller receives the updated service record via onSaved() so
 * it can recalculate only that service's price breakdown lines.
 */

import React, { useState, Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  X, Plus, TrendingUp, Tag, Lock, Info,
  Clock, DollarSign,
} from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Input } from '../ui';
import { nanoid } from '../../utils/nanoid';
import { isPrePressName } from '../../pages/Labor';
import type {
  PricingLabor, PricingFinishing, PricingBrokered,
  LaborChargeBasis, ServicePricingMode, SellRateTier,
} from '../../types/pricing';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

const PRICING_MODES: { id: ServicePricingMode; label: string; icon: React.ReactNode }[] = [
  { id: 'cost_markup', label: 'Cost + Markup', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'rate_card',   label: 'Rate Card',     icon: <Tag        className="w-3.5 h-3.5" /> },
  { id: 'fixed',       label: 'Fixed Charge',  icon: <Lock       className="w-3.5 h-3.5" /> },
];

const LABOR_BASIS: { value: LaborChargeBasis; label: string; costLabel: string; unitLabel: string }[] = [
  { value: 'per_hour',   label: 'Per Hour',    costLabel: 'Cost Rate ($/hr)',    unitLabel: '/hr'   },
  { value: 'per_sqft',   label: 'Per Sq Ft',   costLabel: 'Cost ($/sqft)',       unitLabel: '/sqft' },
  { value: 'per_unit',   label: 'Per Unit',    costLabel: 'Cost ($/unit)',       unitLabel: '/unit' },
  { value: 'per_1000',   label: 'Per 1,000',   costLabel: 'Cost ($/1,000)',      unitLabel: '/M'    },
  { value: 'flat',       label: 'Flat Rate',   costLabel: 'Flat Cost ($)',       unitLabel: ' flat' },
];

// ─── Shared field + input styles ─────────────────────────────────────────────
const inp  = 'w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]';
const ninp = `${inp} text-right num`;

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={className}>
    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);

// ─── Sell-rate tier editor ────────────────────────────────────────────────────
const TierTable: React.FC<{
  tiers: SellRateTier[];
  onChange: (t: SellRateTier[]) => void;
  unitLabel: string;
}> = ({ tiers, onChange, unitLabel }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Volume Tiers</span>
      <button type="button"
        onClick={() => onChange([...tiers, { id: nanoid(), fromQty: 0, toQty: null, sellRate: 0 }])}
        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors">
        <Plus className="w-3 h-3" /> Add Tier
      </button>
    </div>
    {tiers.length > 0 && (
      <div className="space-y-1.5">
        <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 px-1">
          {['From', 'To (blank=∞)', `Rate (${unitLabel})`].map(h => (
            <span key={h} className="text-[9px] font-semibold text-gray-400 uppercase">{h}</span>
          ))}
          <span />
        </div>
        {tiers.map((t, i) => (
          <div key={t.id} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 items-center">
            <input type="number" value={t.fromQty || ''} placeholder="0"
              onChange={e => { const a = [...tiers]; a[i] = { ...a[i], fromQty: parseFloat(e.target.value) || 0 }; onChange(a); }}
              className="px-2 py-1 text-xs bg-white border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <input type="number" value={t.toQty ?? ''} placeholder="∞"
              onChange={e => { const a = [...tiers]; a[i] = { ...a[i], toQty: e.target.value ? parseFloat(e.target.value) : null }; onChange(a); }}
              className="px-2 py-1 text-xs bg-white border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <input type="number" value={t.sellRate || ''} placeholder="0.00"
              onChange={e => { const a = [...tiers]; a[i] = { ...a[i], sellRate: parseFloat(e.target.value) || 0 }; onChange(a); }}
              className="px-2 py-1 text-xs bg-white border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <button type="button" onClick={() => onChange(tiers.filter((_, j) => j !== i))}
              className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Category + group multi-select ───────────────────────────────────────────
const CheckList: React.FC<{
  items: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}> = ({ items, selected, onChange }) => (
  <div className="border border-gray-200 rounded-lg p-3 max-h-28 overflow-y-auto">
    {items.length === 0
      ? <p className="text-xs text-gray-400 italic">None defined</p>
      : <div className="grid grid-cols-2 gap-1.5">
          {items.map(it => (
            <label key={it.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selected.includes(it.id)}
                onChange={e => onChange(e.target.checked ? [...selected, it.id] : selected.filter(id => id !== it.id))}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">{it.name}</span>
            </label>
          ))}
        </div>
    }
  </div>
);

// ─── Auto-add pills ───────────────────────────────────────────────────────────
const AutoAddPills: React.FC<{
  categoryIds: string[];
  autoAddCategoryIds: string[];
  categories: { id: string; name: string }[];
  onChange: (ids: string[]) => void;
}> = ({ categoryIds, autoAddCategoryIds, categories, onChange }) => {
  if (categoryIds.length === 0) return null;
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Auto-add to new items</label>
      <p className="text-[10px] text-gray-400 mb-2">Pre-selected on new items in checked categories. Users can remove per item.</p>
      <div className="flex flex-wrap gap-2">
        {categoryIds.map(catId => {
          const cat = categories.find(c => c.id === catId);
          if (!cat) return null;
          const isAuto = autoAddCategoryIds.includes(catId);
          return (
            <label key={catId} className="flex items-center gap-1.5 cursor-pointer select-none group">
              <input type="checkbox" checked={isAuto}
                onChange={e => onChange(e.target.checked ? [...autoAddCategoryIds, catId] : autoAddCategoryIds.filter(id => id !== catId))}
                className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-400" />
              <span className={`text-[11px] font-medium transition-colors ${isAuto ? 'text-emerald-700' : 'text-gray-500 group-hover:text-gray-700'}`}>{cat.name}</span>
              {isAuto && <span className="text-[9px] bg-emerald-100 text-emerald-600 border border-emerald-200 px-1 py-0.5 rounded font-bold uppercase tracking-wide">auto</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LABOR EDIT FORM
// ═══════════════════════════════════════════════════════════════════════════════

const LaborEditForm: React.FC<{
  svc: PricingLabor;
  onSave: (updated: Partial<PricingLabor>) => void;
  onClose: () => void;
}> = ({ svc, onSave, onClose }) => {
  const { categories, laborGroups } = usePricingStore();

  const [form, setForm] = useState<PricingLabor>({ ...svc, autoAddCategoryIds: svc.autoAddCategoryIds ?? [], isPrePress: svc.isPrePress ?? isPrePressName(svc.name) });
  const set = (patch: Partial<PricingLabor>) => setForm(f => ({ ...f, ...patch }));

  const basis = LABOR_BASIS.find(b => b.value === form.chargeBasis) ?? LABOR_BASIS[0];
  const isHourly = form.chargeBasis === 'per_hour';
  const isFixed  = form.pricingMode === 'fixed';
  const isRate   = form.pricingMode === 'rate_card';
  const isCostUp = form.pricingMode === 'cost_markup';

  const computedSell = form.hourlyCost * (1 + form.markupPercent / 100);
  const effectiveSell = form.minimumCharge > 0 && computedSell < form.minimumCharge ? form.minimumCharge : computedSell;
  const margin = effectiveSell > 0 ? ((effectiveSell - form.hourlyCost) / effectiveSell) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Name + Description */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name"><input className={inp} value={form.name} onChange={e => set({ name: e.target.value })} /></Field>
        <Field label="Description (Optional)"><input className={inp} value={form.description || ''} onChange={e => set({ description: e.target.value })} placeholder="Brief description…" /></Field>
      </div>

      {/* Charge Unit */}
      <Field label="Charge Unit">
        <div className="flex gap-2 flex-wrap">
          {LABOR_BASIS.map(b => (
            <button key={b.value} type="button" onClick={() => set({ chargeBasis: b.value })}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${form.chargeBasis === b.value ? 'bg-[#F890E7] text-white border-[#F890E7]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#F890E7]/60'}`}>
              {b.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Pricing Mode */}
      <Field label="Pricing Mode">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {PRICING_MODES.map(m => (
            <button key={m.id} type="button" onClick={() => set({ pricingMode: m.id })}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${form.pricingMode === m.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {m.icon}{m.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Pricing fields by mode */}
      {isFixed && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Your Cost ($)"><input type="number" className={ninp} value={form.fixedChargeCost || ''} onChange={e => set({ fixedChargeCost: parseFloat(e.target.value) || 0 })} prefix="$" /></Field>
            <Field label="Client Charge ($)"><input type="number" className={ninp} value={form.fixedChargeAmount || ''} onChange={e => set({ fixedChargeAmount: parseFloat(e.target.value) || 0 })} /></Field>
          </div>
          {form.fixedChargeCost > 0 && form.fixedChargeAmount > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Client sees: <span className="font-bold text-blue-700 ml-1">{fmt(form.fixedChargeAmount)} flat</span></span>
              <span className="text-gray-400 text-xs">Markup: {pct(form.fixedChargeCost > 0 ? ((form.fixedChargeAmount - form.fixedChargeCost) / form.fixedChargeCost) * 100 : 0)} · Margin: {pct(form.fixedChargeAmount > 0 ? ((form.fixedChargeAmount - form.fixedChargeCost) / form.fixedChargeAmount) * 100 : 0)}</span>
            </div>
          )}
        </div>
      )}

      {isRate && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Field label={`Cost (${basis.unitLabel})`}><input type="number" className={ninp} value={form.hourlyCost || ''} onChange={e => set({ hourlyCost: parseFloat(e.target.value) || 0 })} /></Field>
            <Field label={`Sell Rate (${basis.unitLabel})`}><input type="number" className={ninp} value={form.sellRate || ''} onChange={e => set({ sellRate: parseFloat(e.target.value) || 0 })} /></Field>
          </div>
          {form.hourlyCost > 0 && (form.sellRate ?? 0) > 0 && (() => {
            const sr = form.sellRate ?? 0;
            return (
              <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[11px] text-gray-600 flex gap-4">
                <span>Cost: <b>{fmt(form.hourlyCost)}{basis.unitLabel}</b></span>
                <span>Sell: <b className="text-blue-700">{fmt(sr)}{basis.unitLabel}</b></span>
                <span className={sr > form.hourlyCost ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                  Margin: {pct(sr > 0 ? ((sr - form.hourlyCost) / sr) * 100 : 0)}
                </span>
              </div>
            );
          })()}
          <TierTable tiers={form.sellRateTiers || []} unitLabel={basis.unitLabel} onChange={t => set({ sellRateTiers: t })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''} onChange={e => set({ initialSetupFee: parseFloat(e.target.value) || 0 })} prefix="$" />
            <Input label="Minimum Charge ($)" type="number" value={form.minimumCharge || ''} onChange={e => set({ minimumCharge: parseFloat(e.target.value) || 0 })} prefix="$" />
          </div>
        </div>
      )}

      {isCostUp && (
        <div className="space-y-3">
          {isHourly ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cost Rate ($/hr)" type="number" value={form.hourlyCost || ''} onChange={e => set({ hourlyCost: parseFloat(e.target.value) || 0 })} prefix="$" />
                <Field label="Production Rate (units/hr)">
                  <input type="number" className={`${inp} ${!form.outputPerHour ? 'border-amber-300 bg-amber-50/30' : ''}`} value={form.outputPerHour || ''} placeholder="e.g. 500" onChange={e => set({ outputPerHour: parseFloat(e.target.value) || 0 })} />
                  {!form.outputPerHour && <p className="text-[10px] text-amber-600 mt-0.5">Required to calculate job hours</p>}
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Markup %" type="number" value={form.markupPercent || ''} onChange={e => set({ markupPercent: parseFloat(e.target.value) || 0 })} suffix="%" />
                <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''} onChange={e => set({ initialSetupFee: parseFloat(e.target.value) || 0 })} prefix="$" />
                <Input label="Minimum Charge ($)" type="number" value={form.minimumCharge || ''} onChange={e => set({ minimumCharge: parseFloat(e.target.value) || 0 })} prefix="$" />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <Input label={basis.costLabel} type="number" value={form.hourlyCost || ''} onChange={e => set({ hourlyCost: parseFloat(e.target.value) || 0 })} prefix="$" />
              <Input label="Markup %" type="number" value={form.markupPercent || ''} onChange={e => set({ markupPercent: parseFloat(e.target.value) || 0 })} suffix="%" />
              <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''} onChange={e => set({ initialSetupFee: parseFloat(e.target.value) || 0 })} prefix="$" />
            </div>
          )}
          {form.hourlyCost > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />
                {isHourly ? 'Client rate per hour:' : `Client charge (${basis.unitLabel}):`}
                <span className="font-bold text-blue-700 ml-1">{fmt(effectiveSell)}{basis.unitLabel}</span>
              </span>
              <span className={`text-xs font-semibold ${margin > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{pct(margin)} margin</span>
            </div>
          )}
        </div>
      )}

      {/* Categories + Groups */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Categories">
          <CheckList items={categories} selected={form.categoryIds} onChange={ids => set({ categoryIds: ids, autoAddCategoryIds: (form.autoAddCategoryIds ?? []).filter(id => ids.includes(id)) })} />
        </Field>
        <Field label="Labor Groups">
          <CheckList items={laborGroups} selected={form.laborGroupIds} onChange={ids => set({ laborGroupIds: ids })} />
        </Field>
      </div>

      {/* Auto-add */}
      <AutoAddPills categoryIds={form.categoryIds} autoAddCategoryIds={form.autoAddCategoryIds ?? []} categories={categories} onChange={ids => set({ autoAddCategoryIds: ids })} />

      {/* Pre-press */}
      <div>
        <div className="flex items-center gap-2">
          <input id="pp-chk" type="checkbox" checked={form.isPrePress || false} onChange={e => set({ isPrePress: e.target.checked })} className="rounded border-gray-300 text-violet-500 focus:ring-violet-400 w-3.5 h-3.5" />
          <label htmlFor="pp-chk" className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none">Pre-press service</label>
          {form.isPrePress && <span className="text-[9px] bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">pre-press</span>}
        </div>
        <p className="text-[10px] text-gray-400 mt-1 ml-5">Appears before material &amp; printing in the price breakdown (design, file prep, etc.)</p>
      </div>

      {/* Notes */}
      <Field label="Notes (Optional)">
        <textarea rows={2} className={`${inp} resize-none`} value={form.notes || ''} placeholder="Any additional notes" onChange={e => set({ notes: e.target.value })} />
      </Field>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave(form)} disabled={!form.name}>Save Changes</Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINISHING EDIT FORM (simplified — key pricing fields)
// ═══════════════════════════════════════════════════════════════════════════════

const FinishingEditForm: React.FC<{
  svc: PricingFinishing;
  onSave: (updated: Partial<PricingFinishing>) => void;
  onClose: () => void;
}> = ({ svc, onSave, onClose }) => {
  const { categories, finishingGroups } = usePricingStore();
  const [form, setForm] = useState<PricingFinishing>({ ...svc, autoAddCategoryIds: svc.autoAddCategoryIds ?? [] });
  const set = (patch: Partial<PricingFinishing>) => setForm(f => ({ ...f, ...patch }));
  const isFixed = form.pricingMode === 'fixed' || form.isFixedCharge;
  const isRate  = form.pricingMode === 'rate_card';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name"><input className={inp} value={form.name} onChange={e => set({ name: e.target.value })} /></Field>
        <Field label="Description (Optional)"><input className={inp} value={form.description || ''} onChange={e => set({ description: e.target.value })} placeholder="Brief description…" /></Field>
      </div>

      <Field label="Pricing Mode">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {PRICING_MODES.map(m => (
            <button key={m.id} type="button" onClick={() => set({ pricingMode: m.id, isFixedCharge: m.id === 'fixed' })}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${form.pricingMode === m.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {m.icon}{m.label}
            </button>
          ))}
        </div>
      </Field>

      {isFixed ? (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Fixed Cost ($)" type="number" value={form.fixedChargeCost || ''} onChange={e => set({ fixedChargeCost: parseFloat(e.target.value) || 0 })} prefix="$" />
          <Input label="Client Charge ($)" type="number" value={form.fixedChargeAmount || ''} onChange={e => set({ fixedChargeAmount: parseFloat(e.target.value) || 0 })} prefix="$" />
        </div>
      ) : isRate ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit Cost ($)" type="number" value={form.unitCost || ''} onChange={e => set({ unitCost: parseFloat(e.target.value) || 0 })} prefix="$" />
            <Input label="Sell Rate ($)" type="number" value={form.sellRate || ''} onChange={e => set({ sellRate: parseFloat(e.target.value) || 0 })} prefix="$" />
          </div>
          <TierTable tiers={form.sellRateTiers || []} unitLabel="/unit" onChange={t => set({ sellRateTiers: t })} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Input label="Unit Cost ($)" type="number" value={form.unitCost || ''} onChange={e => set({ unitCost: parseFloat(e.target.value) || 0 })} prefix="$" />
          <Input label="Hourly Cost ($)" type="number" value={form.hourlyCost || ''} onChange={e => set({ hourlyCost: parseFloat(e.target.value) || 0 })} prefix="$" />
          <Input label="Markup %" type="number" value={form.markupPercent || ''} onChange={e => set({ markupPercent: parseFloat(e.target.value) || 0 })} suffix="%" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''} onChange={e => set({ initialSetupFee: parseFloat(e.target.value) || 0 })} prefix="$" />
        <Input label="Minimum Charge ($)" type="number" value={form.minimumCharge || ''} onChange={e => set({ minimumCharge: parseFloat(e.target.value) || 0 })} prefix="$" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Categories"><CheckList items={categories} selected={form.categoryIds} onChange={ids => set({ categoryIds: ids, autoAddCategoryIds: (form.autoAddCategoryIds ?? []).filter(id => ids.includes(id)) })} /></Field>
        <Field label="Finishing Groups"><CheckList items={finishingGroups} selected={form.finishingGroupIds} onChange={ids => set({ finishingGroupIds: ids })} /></Field>
      </div>

      <AutoAddPills categoryIds={form.categoryIds} autoAddCategoryIds={form.autoAddCategoryIds ?? []} categories={categories} onChange={ids => set({ autoAddCategoryIds: ids })} />

      <Field label="Notes (Optional)">
        <textarea rows={2} className={`${inp} resize-none`} value={form.notes || ''} placeholder="Any additional notes" onChange={e => set({ notes: e.target.value })} />
      </Field>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave(form)} disabled={!form.name}>Save Changes</Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BROKERED EDIT FORM
// ═══════════════════════════════════════════════════════════════════════════════

const BrokeredEditForm: React.FC<{
  svc: PricingBrokered;
  onSave: (updated: Partial<PricingBrokered>) => void;
  onClose: () => void;
}> = ({ svc, onSave, onClose }) => {
  const { categories, brokeredGroups } = usePricingStore();
  const [form, setForm] = useState<PricingBrokered>({ ...svc, autoAddCategoryIds: svc.autoAddCategoryIds ?? [] });
  const set = (patch: Partial<PricingBrokered>) => setForm(f => ({ ...f, ...patch }));
  const isRate = form.pricingMode === 'rate_card';

  const BASIS = [
    { value: 'per_unit' as const, label: 'Per Unit' },
    { value: 'per_sqft' as const, label: 'Per Sq Ft' },
    { value: 'per_linear_ft' as const, label: 'Per Lin Ft' },
    { value: 'flat' as const, label: 'Flat' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name"><input className={inp} value={form.name} onChange={e => set({ name: e.target.value })} /></Field>
        <Field label="Description (Optional)"><input className={inp} value={form.description || ''} onChange={e => set({ description: e.target.value })} placeholder="Brief description…" /></Field>
      </div>

      <Field label="Cost Basis">
        <div className="flex gap-2">
          {BASIS.map(b => (
            <button key={b.value} type="button" onClick={() => set({ costBasis: b.value })}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${form.costBasis === b.value ? 'bg-[#F890E7] text-white border-[#F890E7]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#F890E7]/60'}`}>
              {b.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Pricing Mode">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {PRICING_MODES.map(m => (
            <button key={m.id} type="button" onClick={() => set({ pricingMode: m.id })}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${form.pricingMode === m.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {m.icon}{m.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Input label="Unit Cost ($)" type="number" value={form.unitCost || ''} onChange={e => set({ unitCost: parseFloat(e.target.value) || 0 })} prefix="$" />
        {isRate
          ? <Input label="Sell Rate ($)" type="number" value={form.sellRate || ''} onChange={e => set({ sellRate: parseFloat(e.target.value) || 0 })} prefix="$" />
          : <Input label="Markup %" type="number" value={form.markupPercent || ''} onChange={e => set({ markupPercent: parseFloat(e.target.value) || 0 })} suffix="%" />
        }
        <Input label="Setup Fee ($)" type="number" value={form.initialSetupFee || ''} onChange={e => set({ initialSetupFee: parseFloat(e.target.value) || 0 })} prefix="$" />
      </div>

      {isRate && <TierTable tiers={form.sellRateTiers || []} unitLabel="/unit" onChange={t => set({ sellRateTiers: t })} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Categories"><CheckList items={categories} selected={form.categoryIds} onChange={ids => set({ categoryIds: ids, autoAddCategoryIds: (form.autoAddCategoryIds ?? []).filter(id => ids.includes(id)) })} /></Field>
        <Field label="Brokered Groups"><CheckList items={brokeredGroups} selected={form.brokeredGroupIds} onChange={ids => set({ brokeredGroupIds: ids })} /></Field>
      </div>

      <AutoAddPills categoryIds={form.categoryIds} autoAddCategoryIds={form.autoAddCategoryIds ?? []} categories={categories} onChange={ids => set({ autoAddCategoryIds: ids })} />

      <Field label="Notes (Optional)">
        <textarea rows={2} className={`${inp} resize-none`} value={form.notes || ''} placeholder="Any additional notes" onChange={e => set({ notes: e.target.value })} />
      </Field>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave(form)} disabled={!form.name}>Save Changes</Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export interface ServiceEditInlineDialogProps {
  type: 'finishing' | 'labor' | 'brokered';
  id: string;
  onClose: () => void;
  onSaved: () => void;
}

// Lazy-load the full catalog pages to avoid circular imports
const MaterialsPage  = React.lazy(() => import('../../pages/Materials').then(m => ({ default: m.Materials })));
const EquipmentPage  = React.lazy(() => import('../../pages/Equipment').then(m => ({ default: m.Equipment })));

// ─── Shared full-page overlay shell ──────────────────────────────────────────
const FullPageDialog: React.FC<{
  title: string;
  onClose: () => void;
  search: string;
  children: React.ReactNode;
}> = ({ title, onClose, search, children }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60" onClick={onClose}>
    <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-[96vw] h-[92vh] flex flex-col overflow-hidden"
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Searching: <span className="font-semibold text-gray-600">{search}</span> · Changes save immediately to the catalog</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-4">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MATERIAL EDIT DIALOG — full Materials catalog page embedded in overlay
// ═══════════════════════════════════════════════════════════════════════════════

export const MaterialEditInlineDialog: React.FC<{
  id: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ id, onClose, onSaved }) => {
  const { materials } = usePricingStore();
  const mat = materials.find(m => m.id === id);
  const matName = mat?.name ?? '';

  return (
    <FullPageDialog title="Edit Material" onClose={onClose} search={matName}>
      <MemoryRouter initialEntries={[`/?search=${encodeURIComponent(matName)}`]}>
        <MaterialsPage />
      </MemoryRouter>
    </FullPageDialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EQUIPMENT EDIT DIALOG — full Equipment catalog page embedded in overlay
// ═══════════════════════════════════════════════════════════════════════════════

export const EquipmentEditInlineDialog: React.FC<{
  id: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ id, onClose, onSaved }) => {
  const { equipment } = usePricingStore();
  const eq = equipment.find(e => e.id === id);
  const eqName = eq?.name ?? '';

  return (
    <FullPageDialog title="Edit Equipment" onClose={onClose} search={eqName}>
      <MemoryRouter initialEntries={[`/?search=${encodeURIComponent(eqName)}`]}>
        <EquipmentPage />
      </MemoryRouter>
    </FullPageDialog>
  );
};

// ─── Re-export the Finishing form for use when opened by name (cutting etc.) ─

export const FinishingByNameDialog: React.FC<{
  serviceName: string;     // 'Cut', 'Tri-Fold', etc.
  onClose: () => void;
  onSaved: () => void;
}> = ({ serviceName, onClose, onSaved }) => {
  const { finishing, updateFinishing } = usePricingStore();
  const svc = finishing.find(f => f.name.toLowerCase() === serviceName.toLowerCase() ||
    f.name.toLowerCase().includes(serviceName.toLowerCase()));
  if (!svc) return null;

  const handleSave = (updated: Partial<PricingFinishing>) => {
    updateFinishing(svc.id, updated as Partial<PricingFinishing>);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-900">Edit Finishing — {svc.name}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <FinishingEditForm svc={svc} onSave={handleSave} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LABOR/FINISHING/BROKERED DIALOG (original)
// ═══════════════════════════════════════════════════════════════════════════════

export const ServiceEditInlineDialog: React.FC<ServiceEditInlineDialogProps> = ({
  type, id, onClose, onSaved,
}) => {
  const { finishing, labor, brokered, updateFinishing, updateLabor, updateBrokered } = usePricingStore();

  const svc = type === 'finishing' ? finishing.find(s => s.id === id)
            : type === 'labor'     ? labor.find(s => s.id === id)
            : brokered.find(s => s.id === id);

  if (!svc) return null;

  const typeLabel = type === 'finishing' ? 'Finishing' : type === 'labor' ? 'Labor' : 'Brokered';
  const title = `Edit ${typeLabel} Service`;

  const handleSave = (updated: Partial<PricingLabor | PricingFinishing | PricingBrokered>) => {
    if (type === 'finishing') updateFinishing(id, updated as Partial<PricingFinishing>);
    else if (type === 'labor') updateLabor(id, updated as Partial<PricingLabor>);
    else updateBrokered(id, updated as Partial<PricingBrokered>);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {type === 'labor' && (
            <LaborEditForm svc={svc as PricingLabor} onSave={handleSave} onClose={onClose} />
          )}
          {type === 'finishing' && (
            <FinishingEditForm svc={svc as PricingFinishing} onSave={handleSave} onClose={onClose} />
          )}
          {type === 'brokered' && (
            <BrokeredEditForm svc={svc as PricingBrokered} onSave={handleSave} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};
