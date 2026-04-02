// ─── CORE ENTITY TYPES ─────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'csr' | 'sales' | 'production' | 'accounting' | 'estimator';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  phone?: string;
  createdAt: string;
}

// ─── CUSTOMER / CONTACT ─────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  taxExempt: boolean;
  taxId?: string;
  notes?: string;
  tags?: string[];
  source?: 'manual' | 'planprophet' | 'import';
  planProphetId?: string;
  website?: string;
  salesHistorically?: number;
  sales12m?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  isPrimary: boolean;
  notes?: string;
  planProphetId?: string;
  createdAt: string;
}

// ─── PRODUCT / MATERIAL / EQUIPMENT ──────────────────────────────────────────

export type ProductFamily = 
  | 'digital_print'
  | 'offset_print'
  | 'wide_format'
  | 'rigid_sign'
  | 'roll_sign'
  | 'label'
  | 'apparel'
  | 'finishing'
  | 'installation'
  | 'outsourced'
  | 'buyout';

export type UnitType = 'sqft' | 'sqin' | 'each' | 'linear_ft' | 'sheet' | 'hour' | 'piece' | 'roll' | 'lb' | 'set';

export interface Material {
  id: string;
  name: string;
  sku?: string;
  category: string;
  productFamily: ProductFamily[];
  description?: string;
  unit: UnitType;
  width?: number;  // inches
  length?: number; // inches (for roll goods)
  thickness?: string;
  weight?: string;
  costPerUnit: number;
  markup?: number; // percentage
  vendorId?: string;
  vendorSku?: string;
  isFavorite: boolean;
  stock?: number;
  notes?: string;
  createdAt: string;
}

export type EquipmentType =
  | 'digital_press'
  | 'offset_press'
  | 'wide_format_printer'
  | 'cutter'
  | 'laminator'
  | 'folder'
  | 'bindery'
  | 'finishing'
  | 'sign_production'
  | 'other';

export interface Equipment {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
  type: EquipmentType;
  width?: number; // max print width in inches
  speed?: number; // sqft/hr or sheets/hr
  speedUnit?: 'sqft_hr' | 'sheets_hr' | 'linear_ft_hr';
  costPerHour: number;
  setupCost?: number;
  active: boolean;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
}

// ─── VENDORS / PURCHASE ORDERS ──────────────────────────────────────────────

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  accountNumber?: string;
  paymentTerms?: string;
  notes?: string;
  tags?: string[];
  isOutsourcedProduction: boolean; // vs. materials supplier
  createdAt: string;
}

export type POStatus = 'draft' | 'sent' | 'acknowledged' | 'received' | 'partial' | 'canceled';

export interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  unit: UnitType;
  unitCost: number;
  total: number;
  orderItemId?: string;
  receivedQuantity?: number;
}

export interface PurchaseOrder {
  id: string;
  number: string; // PO000001
  vendorId: string;
  orderId?: string;
  status: POStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
  expectedDate?: string;
  receivedDate?: string;
  sentAt?: string;
  acknowledgedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── QUOTING / ESTIMATING ───────────────────────────────────────────────────

export type QuoteStatus = 'pending' | 'hot' | 'cold' | 'won' | 'lost';

export interface QuoteLineItem {
  id: string;
  productFamily: ProductFamily;
  description: string;
  quantity: number;
  unit: UnitType;
  // sizing
  width?: number;
  height?: number;
  // materials
  materialId?: string;
  materialName?: string;
  materialCost?: number;
  // equipment / production
  equipmentId?: string;
  equipmentName?: string;
  runTime?: number; // hours
  equipmentCost?: number;
  // labor
  laborHours?: number;
  laborRate?: number;
  laborCost?: number;
  // outsourced
  vendorId?: string;
  vendorCost?: number;
  // setup / additional
  setupCost?: number;
  additionalCost?: number;
  // pricing
  totalCost: number;
  markup: number; // percentage
  sellPrice: number;
  notes?: string;
  // imposition
  upsPerSheet?: number;
  sheetSize?: string;
  // template
  templateId?: string;
  // multi-part item
  isMultiPart?: boolean;
  multiPartName?: string;        // global item/product name (e.g. "Booklet")
  multiPartDescription?: string; // global item description
  parts?: Array<{
    id: string;
    partName: string;
    partDescription: string;
    totalCost: number;
    totalSell: number;
  }>;
}

export interface Quote {
  id: string;
  number: string; // Q000001
  status: QuoteStatus;
  customerId?: string;
  customerName?: string;
  contactId?: string;
  contactName?: string;
  title: string;
  description?: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  validUntil?: string;
  csrId?: string;
  salesId?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  convertedToOrderId?: string;
  source?: 'scratch' | 'template' | 'ai' | 'clone';
  aiPrompt?: string;
  statusChangedAt?: string;   // ISO timestamp of last status change
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  tagline: string;
  primaryBrandColor: string;
  defaultTaxRate: number;
  defaultMarkup: number;
  defaultLaborRate: number;
  quoteValidDays: number;
  currency: string;
  timezone: string;
  defaultBleed: number;
  defaultGutter: number;
  defaultBleedWide: number;
  defaultGutterWide: number;
}

export interface DocumentTemplates {
  quote: string;
  order: string;
  workOrder: string;
  invoice: string;
  purchaseOrder: string;
}

// ─── ORDERS ─────────────────────────────────────────────────────────────────

export type OrderStatus = 'in_progress' | 'on_hold' | 'completed' | 'canceled';

export interface OrderItem extends QuoteLineItem {
  // production tracking
  workflowStageId?: string;
  assignedUserId?: string;
  completedAt?: string;
  timeSpent?: number; // minutes
  productionNotes?: string;
}

export interface Order {
  id: string;
  number: string; // O000001
  quoteId?: string;
  quoteNumber?: string;
  status: OrderStatus;
  customerId?: string;
  customerName?: string;
  contactId?: string;
  contactName?: string;
  title: string;
  description?: string;
  lineItems: OrderItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  dueDate?: string;
  shipDate?: string;
  csrId?: string;
  salesId?: string;
  workflowId?: string;
  currentStageId?: string;
  notes?: string;
  internalNotes?: string;
  poNumber?: string; // customer's PO#
  invoiceId?: string;
  purchaseOrderIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── INVOICES ───────────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'posted' | 'paid' | 'overdue' | 'void';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  total: number;
  orderItemId?: string;
  orderId?: string;
}

export interface Invoice {
  id: string;
  number: string; // I000001
  status: InvoiceStatus;
  customerId: string;
  customerName: string;
  orderIds: string[];
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  dueDate?: string;
  paidDate?: string;
  paidAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── WORKFLOW / PRODUCTION ───────────────────────────────────────────────────

export interface WorkflowStage {
  id: string;
  workflowId: string;
  name: string;
  order: number;
  color: string;
  isComplete: boolean;
  defaultAssigneeId?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  productFamilies: ProductFamily[];
  stages: WorkflowStage[];
  isDefault: boolean;
  createdAt: string;
}

export interface TrackingDevice {
  id: string;
  name: string;
  code: string;
  description?: string;
  workflowId: string;
  stageId: string;
  isActive: boolean;
  createdAt: string;
}

// ─── PRODUCT TEMPLATE ────────────────────────────────────────────────────────

export interface ProductTemplate {
  id: string;
  name: string;
  productFamily: ProductFamily;
  icon?: string;
  description?: string;
  defaultLineItem: Partial<QuoteLineItem>;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
}

// ─── ACTIVITY / AUDIT ────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  entityType: 'quote' | 'order' | 'invoice' | 'customer' | 'contact' | 'po';
  entityId: string;
  entityNumber?: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── INTEGRATION ─────────────────────────────────────────────────────────────

export interface Integration {
  id: string;
  name: string;
  type: 'planprophet' | 'quickbooks' | 'onprintshop' | 'presero' | 'asi' | 'sage' | 'photover' | 'custom';
  status: 'connected' | 'disconnected' | 'error';
  apiKey?: string;
  webhookUrl?: string;
  lastSync?: string;
  settings?: Record<string, unknown>;
}

// ─── APP STATE HELPERS ────────────────────────────────────────────────────────

export interface FilterState {
  search: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  assignedTo?: string;
}

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
}
