// ─── PRICING TOOL TYPES ─────────────────────────────────────────────────────

// ─── MATERIAL GROUPS ───────────────────────────────────────────────────────

export interface MaterialGroup {
  id: string;
  name: string;
  description?: string;
  categoryIds: string[];  // which categories this group is assigned to
  createdAt: string;
}

// ─── FINISHING GROUPS ───────────────────────────────────────────────────────

export interface FinishingGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// ─── LABOR GROUPS ─────────────────────────────────────────────────────────

export interface LaborGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// ─── BROKERED GROUPS ──────────────────────────────────────────────────────

export interface BrokeredGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// ─── CATEGORIES & PRODUCTS ──────────────────────────────────────────────────

export interface PricingCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
}

export interface PricingProduct {
  id: string;
  categoryIds: string[];
  name: string;
  aliases: string[];
  defaultQuantity: number;
  defaultMaterialId?: string;
  defaultMaterialName?: string;
  defaultFinalSize: string;        // e.g. "3.5x2"
  defaultFinalWidth: number;       // parsed inches
  defaultFinalHeight: number;      // parsed inches
  defaultEquipmentId?: string;
  defaultEquipmentName?: string;
  defaultColor: 'Color' | 'Black' | 'Color & Black';
  defaultSides: 'Single' | 'Double';
  defaultFolding?: string;         // e.g. "Tri-Fold", "Bi-Fold"
  isTemplate: boolean;             // whether this product is starred as a template
  defaultFinishingIds?: string[];   // default finishing services for this product
  // Full pricing state snapshot — persists ALL modal state including labor, brokered,
  // service lines, markups, overrides. Used to restore the modal exactly on re-open.
  defaultPricingContext?: Record<string, unknown>;
  createdAt: string;
}

// ─── EQUIPMENT ──────────────────────────────────────────────────────────────

export type EquipmentCostUnit = 'per_click' | 'per_sqft';
export type EquipmentCostType = 'cost_only' | 'cost_plus_time' | 'time_only';

export interface EquipmentPricingTier {
  minQty: number;
  pricePerUnit: number;
}

export interface PricingEquipment {
  id: string;
  name: string;
  categoryApplies: string;        // which PricingCategory name
  colorCapability: 'Color' | 'Black' | 'Color and Black';
  costUnit: EquipmentCostUnit;
  costType: EquipmentCostType;
  markupMultiplier?: number;       // e.g. 7 means sell = cost × 7
  unitCost: number;                // base cost per unit (click or sqft)
  colorTiers?: EquipmentPricingTier[];
  blackTiers?: EquipmentPricingTier[];
  sqftTiers?: EquipmentPricingTier[];   // tiered pricing for per_sqft cost unit
  initialSetupFee: number;
  unitsPerHour?: number;
  timeCostPerHour?: number;
  timeCostMarkup?: number;
  imageUrl?: string;               // equipment photo URL
  markupType: 'multiplier' | 'percent';  // how markup is applied
  // Maintenance
  maintenanceVendorId?: string;    // FK to Vendor catalog
  maintenanceHistory: MaintenanceRecord[];
  createdAt: string;
}

// ─── MAINTENANCE ─────────────────────────────────────────────────────────────

export type MaintenanceStatus = 'Requested' | 'Scheduled' | 'Completed' | 'Canceled';

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  scheduledOn: string;             // ISO date when it was scheduled/requested
  serviceDate?: string;            // ISO date of actual service
  servicedByVendorId?: string;     // vendor who performed the service
  servicedByVendorName?: string;
  description: string;             // what was done / what is needed
  status: MaintenanceStatus;
  notes?: string;
  nextMaintenanceDate?: string;    // suggested next maintenance date (set on completion)
  createdAt: string;
}

// ─── SERVICE PRICING MODE ───────────────────────────────────────────────────
// cost_markup : existing behaviour — cost computed from rates, sell = cost × (1 + markup%)
// rate_card   : cost and sell entered independently; optionally tiered by quantity
// fixed       : flat fixed cost + flat fixed sell price regardless of quantity

export type ServicePricingMode = 'cost_markup' | 'rate_card' | 'fixed';

export interface SellRateTier {
  id: string;
  fromQty: number;
  toQty: number | null;   // null = unlimited (∞)
  sellRate: number;       // sell price per unit at this tier
}

// ─── FINISHING ──────────────────────────────────────────────────────────────

export interface PricingFinishing {
  id: string;
  name: string;                    // e.g. "Cut", "Tri-Fold", "Laminate Sheet", "Drill 1-Hole"
  description?: string;            // detailed description

  // Assignment (at least one category required)
  categoryIds: string[];           // which categories this applies to
  finishingGroupIds: string[];     // which finishing groups this belongs to
  productIds: string[];            // specific products this applies to (optional)

  // Pricing model
  costType: 'cost_only' | 'cost_plus_time' | 'time_only';
  chargeBasis: 'per_unit' | 'per_sqft' | 'per_hour' | 'per_stack' | 'flat';

  // Cost fields
  unitCost: number;                // cost per unit/sqft/pass/flat (used for cost_only or cost_plus_time)
  hourlyCost: number;              // $ per hour of operation
  outputPerHour: number;           // units processed per hour (for time-based)
  initialSetupFee: number;         // one-time setup fee
  markupPercent: number;           // markup as percentage
  minimumCharge: number;            // minimum amount to charge regardless of calculated price (0 = no minimum)
  isFixedCharge: boolean;           // if true, charge a fixed amount instead of calculated
  fixedChargeAmount: number;        // the fixed amount to charge (only used if isFixedCharge)
  fixedChargeCost: number;          // cost basis for the fixed charge (for margin tracking)

  // Stack/batch processing (for per_stack — cutting, drilling, etc.)
  sheetsPerStack?: number;         // how many sheets can be processed at once (default 500)
  stacksPerHour?: number;          // how many stacks can be processed per hour (default 150)

  // ── Sell-side pricing (Options A + B) ──
  pricingMode?: ServicePricingMode;   // defaults to 'cost_markup' when absent
  sellRate?: number;                  // direct sell rate per unit (rate_card mode)
  sellRateTiers?: SellRateTier[];     // volume-tiered sell rates (rate_card mode, optional)

  notes?: string;
  createdAt: string;
}

// ─── LABOR SERVICES ────────────────────────────────────────────────────────

export type LaborChargeBasis = 'per_hour' | 'per_sqft' | 'per_unit' | 'per_1000' | 'flat';

export interface PricingLabor {
  id: string;
  name: string;                    // e.g. "Graphic Design", "Installation", "Manual Assembly"
  description?: string;
  chargeBasis?: LaborChargeBasis;  // how cost & sell are measured (default: per_hour)
  hourlyCost: number;              // $ per hour (or per-unit cost when basis ≠ per_hour)
  initialSetupFee: number;         // one-time setup fee
  markupPercent: number;           // markup as percentage
  categoryIds: string[];           // which categories this labor applies to
  laborGroupIds: string[];          // which labor groups this belongs to
  isFixedCharge: boolean;           // if true, charge a fixed amount
  fixedChargeAmount: number;        // fixed amount to charge
  fixedChargeCost: number;          // cost basis for fixed charge
  minimumCharge: number;            // minimum charge amount
  outputPerHour: number;            // units per hour for time calculation

  // ── Sell-side pricing (Options A + B) ──
  pricingMode?: ServicePricingMode;
  sellRate?: number;                // direct sell rate per hour (rate_card mode)
  sellRateTiers?: SellRateTier[];   // volume tiers (rate_card mode, optional)

  notes?: string;
  createdAt: string;
}

// ─── BROKERED SERVICES ─────────────────────────────────────────────────────

export type BrokeredCostBasis = 'per_unit' | 'per_sqft' | 'per_linear_ft' | 'flat';

export interface PricingBrokered {
  id: string;
  name: string;                    // e.g. "Banners", "Embroidery", "Vehicle Wrap Install"
  description?: string;
  costBasis: BrokeredCostBasis;    // how cost is calculated
  unitCost: number;                // cost per unit/sqft/linearft/flat
  initialSetupFee: number;         // setup fee
  markupPercent: number;           // markup as percentage
  vendorId?: string;               // linked vendor
  vendorName?: string;             // cached vendor name
  categoryIds: string[];           // which categories this applies to
  brokeredGroupIds: string[];       // which brokered groups this belongs to

  // ── Sell-side pricing (Options A + B) ──
  pricingMode?: ServicePricingMode;
  sellRate?: number;                // direct sell rate per unit (rate_card mode)
  sellRateTiers?: SellRateTier[];   // volume tiers (rate_card mode, optional)

  notes?: string;
  createdAt: string;
}

// ─── MATERIAL CHANGE HISTORY ────────────────────────────────────────────────

export interface MaterialFieldChange {
  field: string;
  fieldLabel: string;
  oldValue: string | number | boolean | string[] | null;
  newValue: string | number | boolean | string[] | null;
}

export interface MaterialChangeRecord {
  id: string;
  materialId: string;
  materialName: string;
  action: 'created' | 'updated' | 'deleted';
  changes: MaterialFieldChange[];
  userId: string;
  userName: string;
  timestamp: string;
}

// ─── MATERIAL TYPES & PRICING MODELS ────────────────────────────────────────

export type MaterialType = 'paper' | 'roll_media' | 'rigid_substrate' | 'blanks';

export type MaterialPricingModel =
  | 'cost_per_m'          // Cost per 1,000 (paper, rigid, blanks)
  | 'cost_per_unit'       // Cost per single unit (paper, rigid, blanks)
  | 'cost_per_sqft';      // Cost per square foot (roll media, rigid)
                           // For roll media: user may optionally enter roll cost + length
                           // to auto-derive cost/sqft, or enter cost/sqft directly.

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  paper: 'Paper',
  roll_media: 'Roll Media',
  rigid_substrate: 'Rigid Substrate',
  blanks: 'Blanks',
};

export const PRICING_MODEL_LABELS: Record<MaterialPricingModel, string> = {
  cost_per_m: '/m',
  cost_per_unit: '/unit',
  cost_per_sqft: '/sq. ft.',
};

/** Which pricing models are available for each material type */
export const MATERIAL_TYPE_PRICING_MODELS: Record<MaterialType, MaterialPricingModel[]> = {
  paper:            ['cost_per_m', 'cost_per_unit'],
  roll_media:       ['cost_per_sqft'],
  rigid_substrate:  ['cost_per_m', 'cost_per_unit', 'cost_per_sqft'],
  blanks:           ['cost_per_unit', 'cost_per_m'],
};

// ─── MATERIALS ──────────────────────────────────────────────────────────────

export interface MaterialPricingTier {
  minQty: number;                   // minimum quantity threshold (units, sheets, sqft)
  costPerUnit: number;              // cost at this tier
}

export type MaterialMarkupType = 'percent' | 'multiplier' | 'profit_percent';

export interface PricingMaterial {
  id: string;
  materialType: MaterialType;       // paper | roll_media | rigid_substrate | blanks
  name: string;
  size: string;                    // display string e.g. "13x19"
  sizeWidth: number;               // inches — used by paper, roll_media, rigid_substrate
  sizeHeight: number;              // inches — used by paper, rigid_substrate
  // Pricing model
  pricingModel: MaterialPricingModel;  // which pricing method to use
  pricePerM: number;               // price per 1,000 (when pricingModel = 'cost_per_m')
  costPerUnit?: number;            // cost per unit (when pricingModel = 'cost_per_unit')
  costPerSqft?: number;            // cost per sqft (when pricingModel = 'cost_per_sqft')
  rollCost?: number;               // full roll cost — reference field for roll media, auto-derives costPerSqft
  rollLength?: number;             // roll length in feet — reference field for roll media, auto-derives costPerSqft
  pricingTiers: MaterialPricingTier[];  // optional quantity-based tier pricing (overrides base cost when set)
  minimumCharge: number;           // minimum charge floor — 0 means no minimum
  markupType: MaterialMarkupType;  // 'percent' = percentage per unit, 'fixed' = flat dollar per unit, 'global_flat' = flat dollar on total, 'global_percent' = percentage on total
  markup: number;                  // percentage markup (70 = 70%) or fixed dollar amount
  materialGroupIds: string[];       // which material groups it belongs to
  categoryIds: string[];           // direct product-category assignments
  productIds: string[];            // direct product assignments
  favoriteProductIds: string[];    // products marked as favorites for this material
  favoriteCategoryIds: string[];   // categories marked as favorites for this material
  isFavorite: boolean;             // for starring/favoriting
  useCount?: number;               // company-wide usage count — auto-incremented each time this material is selected on an item
  // Photo & description
  imageUrl?: string;               // material photo URL or base64 data URL
  description?: string;            // material description / notes
  // Vendor information
  vendorName?: string;             // vendor company name
  vendorId?: string;               // vendor ID / account number
  vendorMaterialId?: string;       // vendor's material ID / SKU
  vendorContactName?: string;      // primary contact person name
  vendorContactTitle?: string;     // primary contact person title
  vendorSalesRep?: string;         // sales rep / account manager
  createdAt: string;
}

// ─── PRICING JOB (the active calculation) ───────────────────────────────────

export interface PricingServiceLine {
  id: string;
  service: string;                 // "Material", "Printing", "Cutting", "Folding", "Drilling", "Setup"
  description: string;
  quantity?: number;
  unit?: string;                   // "sheets", "clicks", "cuts", "pcs", "sqft"
  unitCost: number;
  totalCost: number;
  markupPercent: number;           // display as %
  sellPrice: number;
  editable: boolean;
  // Time-based fields (populated for Cutting, Folding, Drilling, etc.)
  hourlyCost?: number;             // $ per hour for this service
  hoursActual?: number;            // system-calculated hours
  hoursCharge?: number;            // hours to actually charge (user-overridable)
  // Quantity override — user can bill a different qty than the system-calculated actual qty
  chargeQty?: number;              // qty to actually charge (defaults to quantity when not set)
}

export interface PricingJob {
  id: string;
  // Product info
  productId?: string;
  productName: string;
  categoryId?: string;
  categoryName?: string;
  // Specs
  quantity: number;
  finalWidth: number;              // inches
  finalHeight: number;             // inches
  color: string;
  sides: 'Single' | 'Double';
  // Material
  materialId?: string;
  materialName?: string;
  parentSheetWidth: number;
  parentSheetHeight: number;
  // Imposition results
  upsAcross: number;
  upsDown: number;
  totalUps: number;
  sheetsNeeded: number;
  // Equipment
  equipmentId?: string;
  equipmentName?: string;
  // Finishing options
  folding?: string;
  drilling?: string;
  cuttingEnabled: boolean;
  sheetsPerStack: number;          // default 500
  // Computed lines
  serviceLines: PricingServiceLine[];
  totalCost: number;
  totalSellPrice: number;
  // Meta
  createdAt: string;
}

// ─── PRODUCT PRICING TEMPLATE ───────────────────────────────────────────────

export interface ProductPricingTemplate {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  productId?: string;
  productName: string;
  quantity: number;
  finalWidth: number;
  finalHeight: number;
  materialId?: string;
  materialName?: string;
  equipmentId?: string;
  equipmentName?: string;
  color: string;
  sides: 'Single' | 'Double';
  folding?: string;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
}
