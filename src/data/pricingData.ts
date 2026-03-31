import type {
  PricingCategory, PricingProduct, PricingEquipment,
  PricingFinishing, PricingMaterial, ProductPricingTemplate,
  MaterialGroup, PricingLabor, PricingBrokered,
} from '../types/pricing';

// ─── MATERIAL GROUPS ──────────────────────────────────────────────────────────

export const defaultMaterialGroups: MaterialGroup[] = [
  { id: 'mg1', name: 'Digital Press', description: 'Papers for digital presses', categoryIds: ['pc1'], createdAt: '2024-01-01' },
  { id: 'mg2', name: 'Wide-Format Rolls', description: 'Roll media for wide-format printers', categoryIds: ['pc2'], createdAt: '2024-01-01' },
  { id: 'mg3', name: 'Wide-Format Rigids', description: 'Rigid substrates for sign production', categoryIds: ['pc2'], createdAt: '2024-01-01' },
  { id: 'mg4', name: 'Envelopes', description: 'Envelope stocks', categoryIds: ['pc1'], createdAt: '2024-01-01' },
];

// ─── CATEGORIES (from Excel tabs) ───────────────────────────────────────────

export const defaultCategories: PricingCategory[] = [
  { id: 'pc1', name: 'Digital Press', description: 'Digital printing products — business cards, postcards, brochures, etc.', sortOrder: 1, createdAt: '2024-01-01' },
  { id: 'pc2', name: 'Signs', description: 'Signage — banners, yard signs, rigid signs, vehicle wraps, etc.', sortOrder: 2, createdAt: '2024-01-01' },
  { id: 'pc3', name: 'Promo Products', description: 'Promotional products — apparel, pens, mugs, branded items', sortOrder: 3, createdAt: '2024-01-01' },
];

// ─── PRODUCTS (from Excel rows + aliases) ───────────────────────────────────

export const defaultProducts: PricingProduct[] = [
  // ── Digital Press ──
  {
    id: 'pp1', categoryIds: ['pc1'], name: 'Business Cards',
    aliases: ['BCARD', 'BC', 'Presentation Cards'],
    defaultQuantity: 1000,
    defaultMaterialName: '12X18 120lb Cougar',
    defaultFinalSize: '3.5x2', defaultFinalWidth: 3.5, defaultFinalHeight: 2,
    defaultEquipmentId: 'pe1', defaultEquipmentName: 'Ricoh 9200',
    defaultColor: 'Color', defaultSides: 'Double',
    isTemplate: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'pp2', categoryIds: ['pc1'], name: 'Postcards',
    aliases: ['Flyers'],
    defaultQuantity: 1000,
    defaultMaterialName: '12 x 18 100lb Cover',
    defaultFinalSize: '5x7', defaultFinalWidth: 5, defaultFinalHeight: 7,
    defaultEquipmentId: 'pe1', defaultEquipmentName: 'Ricoh 9200',
    defaultColor: 'Color', defaultSides: 'Double',
    isTemplate: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'pp3', categoryIds: ['pc1'], name: 'Sell Sheet',
    aliases: ['Sales Sheet', 'Sell Sheets', 'Sales Sheets', 'Product Sheet'],
    defaultQuantity: 1000,
    defaultMaterialName: '80lb Gloss Text',
    defaultFinalSize: '8.5x11', defaultFinalWidth: 8.5, defaultFinalHeight: 11,
    defaultEquipmentId: 'pe1', defaultEquipmentName: 'Ricoh 9200',
    defaultColor: 'Color', defaultSides: 'Single',
    isTemplate: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'pp4', categoryIds: ['pc1'], name: 'Brochures',
    aliases: ['Trifold', 'Bifold', 'Tri-fold', 'Bi-fold', 'Brochure'],
    defaultQuantity: 1000,
    defaultMaterialName: '80lb Gloss Text',
    defaultFinalSize: '8.5x11', defaultFinalWidth: 8.5, defaultFinalHeight: 11,
    defaultEquipmentId: 'pe1', defaultEquipmentName: 'Ricoh 9200',
    defaultColor: 'Color', defaultSides: 'Double',
    defaultFolding: 'Tri-Fold',
    isTemplate: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'pp5', categoryIds: ['pc1'], name: 'Envelopes',
    aliases: ['A7', '#10', '#9', 'A6', '9X12', 'Envelope', '#10 Envelope'],
    defaultQuantity: 1000,
    defaultMaterialName: '#10 Window',
    defaultFinalSize: '4x9', defaultFinalWidth: 4, defaultFinalHeight: 9,
    defaultEquipmentId: 'pe2', defaultEquipmentName: 'IJET',
    defaultColor: 'Color', defaultSides: 'Single',
    isTemplate: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'pp6', categoryIds: ['pc1'], name: 'Door Hanger',
    aliases: ['Door Knob', 'Door Hangers', 'Door Knob Hanger'],
    defaultQuantity: 1000,
    defaultMaterialName: '120lb Uncoated',
    defaultFinalSize: '4x9', defaultFinalWidth: 4, defaultFinalHeight: 9,
    defaultEquipmentId: 'pe1', defaultEquipmentName: 'Ricoh 9200',
    defaultColor: 'Color', defaultSides: 'Double',
    isTemplate: false,
    createdAt: '2024-01-01',
  },
];

// ─── EQUIPMENT (from Excel) ─────────────────────────────────────────────────

export const defaultPricingEquipment: PricingEquipment[] = [
  {
    id: 'pe1',
    name: 'Ricoh 9200',
    categoryApplies: 'Digital Press',
    colorCapability: 'Color and Black',
    costUnit: 'per_click',
    costType: 'cost_only',
    unitCost: 0.035,
    colorTiers: [
      { minQty: 1, pricePerUnit: 0.55 },
      { minQty: 25, pricePerUnit: 0.43 },
      { minQty: 50, pricePerUnit: 0.42 },
      { minQty: 250, pricePerUnit: 0.40 },
      { minQty: 500, pricePerUnit: 0.34 },
      { minQty: 1750, pricePerUnit: 0.27 },
      { minQty: 3000, pricePerUnit: 0.245 },
      { minQty: 7500, pricePerUnit: 0.215 },
      { minQty: 10000, pricePerUnit: 0.20 },
    ],
    blackTiers: [
      { minQty: 1, pricePerUnit: 0.08 },
      { minQty: 100, pricePerUnit: 0.06 },
      { minQty: 1000, pricePerUnit: 0.04 },
      { minQty: 5000, pricePerUnit: 0.03 },
    ],
    initialSetupFee: 0,
    markupType: 'multiplier',
    createdAt: '2024-01-01',
  },
  {
    id: 'pe2',
    name: 'IJET',
    categoryApplies: 'Digital Press',
    colorCapability: 'Color and Black',
    costUnit: 'per_click',
    costType: 'cost_only',
    unitCost: 0.035,
    colorTiers: [
      { minQty: 1, pricePerUnit: 0.55 },
      { minQty: 25, pricePerUnit: 0.43 },
      { minQty: 50, pricePerUnit: 0.42 },
      { minQty: 250, pricePerUnit: 0.40 },
      { minQty: 500, pricePerUnit: 0.34 },
      { minQty: 1750, pricePerUnit: 0.27 },
      { minQty: 3000, pricePerUnit: 0.245 },
      { minQty: 7500, pricePerUnit: 0.215 },
      { minQty: 10000, pricePerUnit: 0.20 },
    ],
    blackTiers: [
      { minQty: 1, pricePerUnit: 0.08 },
      { minQty: 100, pricePerUnit: 0.06 },
      { minQty: 1000, pricePerUnit: 0.04 },
      { minQty: 5000, pricePerUnit: 0.03 },
    ],
    initialSetupFee: 0,
    markupType: 'multiplier',
    createdAt: '2024-01-01',
  },
  {
    id: 'pe3',
    name: 'HP Latex 800',
    categoryApplies: 'Signs',
    colorCapability: 'Color',
    costUnit: 'per_sqft',
    costType: 'cost_only',
    markupMultiplier: 7,
    unitCost: 0.50,
    initialSetupFee: 0,
    markupType: 'multiplier',
    createdAt: '2024-01-01',
  },
];

// ─── FINISHING (from Excel) ─────────────────────────────────────────────────

export const defaultFinishing: PricingFinishing[] = [
  {
    id: 'pf1', service: 'Cut', costType: 'time_only',
    outputPerHour: 150, hourlyCost: 40, timeCostMarkup: 0,
    categoryIds: ['pc1'], unitBasis: 'per_cut',
    sheetsPerCutStack: 500, cutsPerHour: 150,
    notes: 'Ask how many sheets per cut stack. Default 500. Determine cuts from layout.',
    createdAt: '2024-01-01',
  },
  {
    id: 'pf2', service: 'Fold', subservice: 'Tri-Fold', costType: 'time_only',
    outputPerHour: 5000, hourlyCost: 40, timeCostMarkup: 0,
    categoryIds: ['pc1'], unitBasis: 'per_unit',
    createdAt: '2024-01-01',
  },
  {
    id: 'pf3', service: 'Fold', subservice: 'Bi-Fold', costType: 'time_only',
    outputPerHour: 5000, hourlyCost: 40, timeCostMarkup: 0,
    categoryIds: ['pc1'], unitBasis: 'per_unit',
    createdAt: '2024-01-01',
  },
  {
    id: 'pf4', service: 'Drill', subservice: '1 Hole', costType: 'time_only',
    outputPerHour: 5000, hourlyCost: 40, timeCostMarkup: 0,
    categoryIds: ['pc1'], unitBasis: 'per_unit',
    createdAt: '2024-01-01',
  },
  {
    id: 'pf5', service: 'Drill', subservice: '2 Holes', costType: 'time_only',
    outputPerHour: 5000, hourlyCost: 40, timeCostMarkup: 0,
    categoryIds: ['pc1'], unitBasis: 'per_unit',
    createdAt: '2024-01-01',
  },
];

// ─── LABOR ─────────────────────────────────────────────────────────────────

export const defaultLabor: PricingLabor[] = [
  { id: 'pl1', name: 'Graphic Design', description: 'Design and layout services', hourlyCost: 30, initialSetupFee: 10, markupPercent: 100, categoryIds: ['pc1', 'pc2', 'pc3'], notes: '', createdAt: '2024-01-01' },
  { id: 'pl2', name: 'Installation', description: 'On-site installation of signage and graphics', hourlyCost: 45, initialSetupFee: 25, markupPercent: 80, categoryIds: ['pc2'], notes: '', createdAt: '2024-01-01' },
  { id: 'pl3', name: 'Manual Assembly', description: 'Hand assembly, collating, packaging', hourlyCost: 25, initialSetupFee: 0, markupPercent: 100, categoryIds: ['pc1', 'pc3'], notes: '', createdAt: '2024-01-01' },
  { id: 'pl4', name: 'Fulfillment', description: 'Kitting, packaging, and shipping prep', hourlyCost: 25, initialSetupFee: 5, markupPercent: 100, categoryIds: ['pc1', 'pc2', 'pc3'], notes: '', createdAt: '2024-01-01' },
];

// ─── BROKERED ──────────────────────────────────────────────────────────────

export const defaultBrokered: PricingBrokered[] = [
  { id: 'pb1', name: 'Banners (Vendor)', description: 'Outsourced banner printing', costBasis: 'per_sqft', unitCost: 3.50, initialSetupFee: 10, markupPercent: 50, categoryIds: ['pc2'], notes: '', createdAt: '2024-01-01' },
  { id: 'pb2', name: 'Embroidery', description: 'Outsourced embroidery services', costBasis: 'per_unit', unitCost: 8, initialSetupFee: 25, markupPercent: 40, categoryIds: ['pc3'], notes: '', createdAt: '2024-01-01' },
];

// ─── MATERIALS (from Excel — all 50 rows) ───────────────────────────────────

function parseSize(s: string): { w: number; h: number } {
  const cleaned = s.toLowerCase().replace(/\s/g, '');
  const parts = cleaned.split('x');
  return { w: parseFloat(parts[0]) || 0, h: parseFloat(parts[1]) || 0 };
}

const rawMaterials: { name: string; size: string; pricePerM: number; markup: number; materialGroupId: string; isFavorite: boolean }[] = [
  { name: '18PT White C2S Digital Cover - Tango', size: '13x19', pricePerM: 198.30, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '20# Exact Color Multipurpose', size: '8.5x11', pricePerM: 18.73, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '65# Colored Cover Astrobrights', size: '8.5x11', pricePerM: 56.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '80# Classic Linen Text', size: '23x35', pricePerM: 357.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Chipboard Point #90 Item 073630', size: '12x18', pricePerM: 120.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss Cover 100# 13x19', size: '26x40', pricePerM: 360.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss Cover 100# 26x40', size: '13x19', pricePerM: 118.75, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss Cover 130# 13x19', size: '26x40', pricePerM: 67.26, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss Cover 130# WHITE 26x40 - McGregor', size: '13x19', pricePerM: 102.60, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss Cover 80# 13x19', size: '13x19', pricePerM: 65.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss Text 100# 13x19', size: '13x19', pricePerM: 56.18, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss Text 80# 13x19', size: '13x19', pricePerM: 128.25, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Matte 100# Cover 13x19', size: '13x19', pricePerM: 70.20, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Matte 100# Text 13x19', size: '12x19', pricePerM: 720.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Mohawk Superfine White Smooth Finish 150# Cover', size: '19x13', pricePerM: 95.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Satin 80# Cover 19x13 - Coronet Paper', size: '13x19', pricePerM: 75.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Satin Text 100# 13x19', size: '13x19', pricePerM: 196.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Uncoated Accent Cover 120# Opaque Smooth', size: '13x19', pricePerM: 342.90, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Uncoated Cougar Cover 130# Super Smooth', size: '13x19', pricePerM: 167.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Uncoated Opaque Cover 130# 13x19', size: '13x19', pricePerM: 102.40, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Uncoated Opaque Cover 80# 13x19', size: '8.5x11', pricePerM: 103.90, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'ZAPCO SECURITY GUARD+ BLUE(VD)', size: '8.5x11', pricePerM: 10.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '20# Bond White Multiuse 067333', size: '11x17', pricePerM: 18.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '20# Bond White QuickCopy 066000', size: '8.5x11', pricePerM: 13.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '20# Colored Bond Earthchoice Colors (500ct)', size: '11x17', pricePerM: 26.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '20# Colored Bond Earthchoice Colors (250ct)', size: '11x17', pricePerM: 57.27, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'NCR 2 Part 11x17', size: '11x17', pricePerM: 66.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'NCR 4 Part 8.5x11', size: '8.5x11', pricePerM: 18.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Laser House Sheet 60# Accent 068543', size: '12x18', pricePerM: 38.75, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Laser House Sheet 60# 11x17', size: '11x17', pricePerM: 23.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '60# Offset White Husky 065990', size: '13x19', pricePerM: 59.60, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '60# Offset White Text Smooth Husky Digital 068794', size: '12x18', pricePerM: 52.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Linen 100# Cover Sundance 063135', size: '12x18', pricePerM: 332.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Uncoated 80# Cover 12x18', size: '12x18', pricePerM: 89.10, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Uncoated 100# Cover Lynx N45715', size: '12x18', pricePerM: 110.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Uncoated 120# Cover Lynx 068823', size: '12x18', pricePerM: 140.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss 80# Gloss Text 12x18', size: '12x18', pricePerM: 59.80, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss 100# Gloss Text 12x18', size: '12x18', pricePerM: 59.80, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss 80# Cover 12x18', size: '12x18', pricePerM: 89.10, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss 100# Cover Blazer N64750', size: '12x18', pricePerM: 85.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Gloss 130# Cover Blazer 065024', size: '12x18', pricePerM: 109.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Satin 110# Cover Blazer 064932', size: '12x18', pricePerM: 94.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '60# Self-Adhesive Gloss Starboard 092512 12x18', size: '12x18', pricePerM: 350.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: '60# Self-Adhesive Gloss Starboard 092512 8.5x11', size: '8.5x11', pricePerM: 210.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'NCR 2 Part 8.5x11', size: '8.5x11', pricePerM: 17.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'NCR 3 Part 11x17', size: '11x17', pricePerM: 69.93, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'NCR 3 Part 8.5x11', size: '8.5x11', pricePerM: 19.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Acetate Front Cover', size: '8.5x11', pricePerM: 200.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Back Vinyl Covers (Blue or Black)', size: '8.5x11', pricePerM: 300.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
  { name: 'Tabs Our Stock', size: '8.5x11', pricePerM: 80.00, markup: 70, materialGroupId: 'mg1', isFavorite: false },
];

export const defaultPricingMaterials: PricingMaterial[] = rawMaterials.map((m, i) => {
  const { w, h } = parseSize(m.size);
  return {
    id: `pm${i + 1}`,
    name: m.name,
    size: m.size,
    sizeWidth: w,
    sizeHeight: h,
    pricePerM: m.pricePerM,
    markup: m.markup,
    materialGroupId: m.materialGroupId,
    categoryIds: [],
    productIds: [],
    isFavorite: m.isFavorite,
    createdAt: '2024-01-01',
  };
});

// ─── DEFAULT PRODUCT PRICING TEMPLATES ──────────────────────────────────────

export const defaultPricingTemplates: ProductPricingTemplate[] = [
  {
    id: 'pt1', name: 'Business Cards — 1000 Color 2-Sided',
    categoryId: 'pc1', categoryName: 'Digital Press',
    productId: 'pp1', productName: 'Business Cards',
    quantity: 1000, finalWidth: 3.5, finalHeight: 2,
    materialName: 'Uncoated Cougar Cover 130# Super Smooth',
    equipmentId: 'pe1', equipmentName: 'Ricoh 9200',
    color: 'Color', sides: 'Double',
    isFavorite: true, usageCount: 84, createdAt: '2024-01-01',
  },
  {
    id: 'pt2', name: 'Postcards 5x7 — Color 2-Sided',
    categoryId: 'pc1', categoryName: 'Digital Press',
    productId: 'pp2', productName: 'Postcards',
    quantity: 1000, finalWidth: 5, finalHeight: 7,
    materialName: 'Gloss 100# Cover Blazer N64750',
    equipmentId: 'pe1', equipmentName: 'Ricoh 9200',
    color: 'Color', sides: 'Double',
    isFavorite: true, usageCount: 56, createdAt: '2024-01-01',
  },
  {
    id: 'pt3', name: 'Tri-Fold Brochure — 1000 Color',
    categoryId: 'pc1', categoryName: 'Digital Press',
    productId: 'pp4', productName: 'Brochures',
    quantity: 1000, finalWidth: 8.5, finalHeight: 11,
    materialName: 'Gloss 80# Gloss Text 12x18',
    equipmentId: 'pe1', equipmentName: 'Ricoh 9200',
    color: 'Color', sides: 'Double', folding: 'Tri-Fold',
    isFavorite: true, usageCount: 43, createdAt: '2024-01-01',
  },
  {
    id: 'pt4', name: 'Sell Sheets 8.5x11 — 500 Color',
    categoryId: 'pc1', categoryName: 'Digital Press',
    productId: 'pp3', productName: 'Sell Sheet',
    quantity: 500, finalWidth: 8.5, finalHeight: 11,
    materialName: 'Gloss Text 100# 13x19',
    equipmentId: 'pe1', equipmentName: 'Ricoh 9200',
    color: 'Color', sides: 'Single',
    isFavorite: false, usageCount: 31, createdAt: '2024-01-01',
  },
];
