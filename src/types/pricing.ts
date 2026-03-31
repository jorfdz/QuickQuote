// ─── PRICING TOOL TYPES ─────────────────────────────────────────────────────

// ─── MATERIAL GROUPS ───────────────────────────────────────────────────────

export interface MaterialGroup {
  id: string;
  name: string;
  description?: string;
  categoryIds: string[];  // which categories this group is assigned to
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

// ─── FINISHING ──────────────────────────────────────────────────────────────

export interface PricingFinishing {
  id: string;
  service: string;                 // e.g. "Cut", "Fold", "Drill"
  subservice?: string;             // e.g. "Tri-fold", "1 Hole"
  costType: 'cost_only' | 'cost_plus_time' | 'time_only';
  outputPerHour: number;           // units per hour
  hourlyCost: number;              // $ per hour of operation
  timeCostMarkup: number;          // markup on time cost (as %)
  categoryIds: string[];           // which categories this finish applies to
  unitBasis: 'per_unit' | 'per_sqft' | 'per_hour' | 'per_cut';  // what the finish is based on
  sheetsPerCutStack?: number;      // for cut services (default 500)
  cutsPerHour?: number;            // for cut services (default 150)
  notes?: string;
  createdAt: string;
}

// ─── LABOR SERVICES ────────────────────────────────────────────────────────

export interface PricingLabor {
  id: string;
  name: string;                    // e.g. "Graphic Design", "Installation", "Manual Assembly"
  description?: string;
  hourlyCost: number;              // $ per hour
  initialSetupFee: number;         // one-time setup fee
  markupPercent: number;           // markup as percentage
  categoryIds: string[];           // which categories this labor applies to
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
  notes?: string;
  createdAt: string;
}

// ─── MATERIALS ──────────────────────────────────────────────────────────────

export interface PricingMaterial {
  id: string;
  name: string;
  size: string;                    // display string e.g. "13x19"
  sizeWidth: number;               // inches (parsed)
  sizeHeight: number;              // inches (parsed)
  pricePerM: number;               // price per 1,000 sheets
  markup: number;                  // percentage markup (70 = 70%)
  materialGroupId?: string;        // which material group it belongs to
  isFavorite: boolean;             // for starring/favoriting
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
  sheetsPerCutStack: number;       // default 500
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
