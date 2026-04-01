import type { PricingMaterial } from '../types/pricing';
import { MATERIAL_TYPE_LABELS } from '../types/pricing';

/**
 * Returns the "unit cost" for display, depending on pricing model.
 * - cost_per_m:        pricePerM / 1000  (cost per sheet)
 * - cost_per_unit:     costPerUnit
 * - cost_per_sqft:     costPerSqft  (for roll media, this may have been auto-derived from roll cost + length)
 */
export const getUnitCost = (m: PricingMaterial): number => {
  const model = m.pricingModel || 'cost_per_m';
  switch (model) {
    case 'cost_per_m':
      return (m.pricePerM || 0) / 1000;
    case 'cost_per_unit':
      return m.costPerUnit ?? 0;
    case 'cost_per_sqft':
      return m.costPerSqft ?? 0;
    default:
      return 0;
  }
};

/** Derive cost per sqft from roll cost, roll length, and roll width */
export const deriveRollCostPerSqft = (rollCost: number, rollLength: number, rollWidthInches: number): number => {
  const rollSqft = rollLength * (rollWidthInches / 12);
  return rollSqft > 0 ? rollCost / rollSqft : 0;
};

/** Human-readable unit label for the pricing model */
export const getUnitLabel = (m: PricingMaterial): string => {
  const model = m.pricingModel || 'cost_per_m';
  switch (model) {
    case 'cost_per_m':        return '/sheet';
    case 'cost_per_unit':     return '/unit';
    case 'cost_per_sqft':     return '/sqft';
    default:                  return '';
  }
};

/** Look up the tier cost for a given quantity. Returns null if no tiers or qty doesn't hit any. */
export const getTierCost = (m: PricingMaterial, qty: number): number | null => {
  const tiers = m.pricingTiers;
  if (!tiers || tiers.length === 0) return null;
  // Sort descending by minQty, pick the first where qty >= minQty
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  const tier = sorted.find(t => qty >= t.minQty);
  return tier ? tier.costPerUnit : null;
};

/** Sell price per unit, applying markup (percent, per-unit fixed, or global flat).
 *  Note: 'global_flat' is a flat dollar amount on the total — it cannot be expressed
 *  per-unit without knowing quantity, so we return base cost here. Use getOrderSell()
 *  for total calculations that include global flat markup. */
export const getUnitSell = (m: PricingMaterial): number => {
  const cost = getUnitCost(m);
  const type = m.markupType || 'percent';
  if (type === 'fixed') {
    return cost + (m.markup || 0);
  }
  if (type === 'global_flat') {
    // Can't express a flat total markup per-unit without qty; return cost as-is
    return cost;
  }
  return cost * (1 + (m.markup || 0) / 100);
};

/** Calculate total sell for a given quantity, properly handling all markup types including global_flat */
export const getOrderSell = (m: PricingMaterial, qty: number, effectiveCostPerUnit?: number): { sellPerUnit: number; markupPerUnit: number; totalSell: number; globalFlatApplied: boolean } => {
  const costPerUnit = effectiveCostPerUnit ?? getUnitCost(m);
  const type = m.markupType || 'percent';
  const markupVal = m.markup || 0;

  if (type === 'fixed') {
    const markupPerUnit = markupVal;
    const sellPerUnit = costPerUnit + markupPerUnit;
    return { sellPerUnit, markupPerUnit, totalSell: sellPerUnit * qty, globalFlatApplied: false };
  }
  if (type === 'global_flat') {
    const totalCost = costPerUnit * qty;
    const totalSell = totalCost + markupVal;
    const sellPerUnit = qty > 0 ? totalSell / qty : costPerUnit;
    const markupPerUnit = qty > 0 ? markupVal / qty : 0;
    return { sellPerUnit, markupPerUnit, totalSell, globalFlatApplied: true };
  }
  // percent
  const markupPerUnit = costPerUnit * (markupVal / 100);
  const sellPerUnit = costPerUnit + markupPerUnit;
  return { sellPerUnit, markupPerUnit, totalSell: sellPerUnit * qty, globalFlatApplied: false };
};

/** Format a material's type + size for display (used in dropdowns, etc.) */
export const getMaterialSizeLabel = (m: PricingMaterial): string => {
  const type = m.materialType || 'paper';
  if (type === 'blanks') return MATERIAL_TYPE_LABELS.blanks;
  if (type === 'roll_media') return `${m.sizeWidth}" wide`;
  return m.size || `${m.sizeWidth}x${m.sizeHeight}`;
};
