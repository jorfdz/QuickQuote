import type { PricingMaterial } from '../types/pricing';
import { MATERIAL_TYPE_LABELS } from '../types/pricing';

/**
 * Returns the "unit cost" for display, depending on pricing model.
 * - cost_per_m:        pricePerM / 1000  (cost per sheet)
 * - cost_per_unit:     costPerUnit
 * - cost_per_sqft:     costPerSqft
 * - roll_cost_length:  derived costPerSqft = rollCost / (rollLength * (sizeWidth / 12))
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
    case 'roll_cost_length': {
      const rollSqft = (m.rollLength ?? 0) * ((m.sizeWidth ?? 0) / 12);
      return rollSqft > 0 ? (m.rollCost ?? 0) / rollSqft : 0;
    }
    default:
      return 0;
  }
};

/** Human-readable unit label for the pricing model */
export const getUnitLabel = (m: PricingMaterial): string => {
  const model = m.pricingModel || 'cost_per_m';
  switch (model) {
    case 'cost_per_m':        return '/sheet';
    case 'cost_per_unit':     return '/unit';
    case 'cost_per_sqft':     return '/sqft';
    case 'roll_cost_length':  return '/sqft';
    default:                  return '';
  }
};

/** Sell price per unit, applying markup */
export const getUnitSell = (m: PricingMaterial): number => {
  const cost = getUnitCost(m);
  return cost * (1 + (m.markup || 0) / 100);
};

/** Format a material's type + size for display (used in dropdowns, etc.) */
export const getMaterialSizeLabel = (m: PricingMaterial): string => {
  const type = m.materialType || 'paper';
  if (type === 'blanks') return MATERIAL_TYPE_LABELS.blanks;
  if (type === 'roll_media') return `${m.sizeWidth}" wide`;
  return m.size || `${m.sizeWidth}x${m.sizeHeight}`;
};
