#!/usr/bin/env -S npx tsx
/**
 * QuikQuote — LocalStorage → Supabase Seed SQL Generator
 *
 * Reads every data source used by the Zustand stores and emits a single,
 * FK-safe SQL script that populates all 53 tables in the QuickQuote schema.
 *
 * Usage:  npx tsx docs/generate-seed-sql.ts > docs/seed-data.sql
 *         (or it writes directly to docs/seed-data.sql)
 */

import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Data imports ────────────────────────────────────────────────────────────
import { realCustomers, realContacts, realOrders } from '../src/data/realData';
import {
  mockUsers, mockMaterials, mockEquipment, mockVendors,
  mockWorkflows, mockTemplates, mockQuotes, mockOrders,
  mockInvoices, mockPurchaseOrders,
} from '../src/data/mockData';
import {
  defaultCategories, defaultProducts, defaultPricingEquipment,
  defaultFinishing, defaultLabor, defaultBrokered,
  defaultPricingMaterials, defaultPricingTemplates,
  defaultMaterialGroups, defaultFinishingGroups,
  defaultLaborGroups, defaultBrokeredGroups,
} from '../src/data/pricingData';
import {
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_QUOTE_TEMPLATE, DEFAULT_ORDER_TEMPLATE,
  DEFAULT_WORK_ORDER_TEMPLATE, DEFAULT_INVOICE_TEMPLATE,
  DEFAULT_PURCHASE_ORDER_TEMPLATE,
} from '../src/data/documentSettings';
import trackingDevicesJson from '../src/data/trackingDevices.json';

// ── Constants ───────────────────────────────────────────────────────────────
const ORG_ID   = '00000000-0000-4000-a000-000000000001';
const ORG_SLUG = 'printco-solutions';
const OWNER_PROFILE_ID_SHORT = 'u1'; // John Mitchell = admin = owner

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Deterministic UUID from a short app ID (e.g. 'rc1' → stable UUID). */
function uuid(shortId: string): string {
  const hash = createHash('md5').update(`quikquote:${shortId}`).digest('hex');
  // Format as valid UUID v4
  const nibble = parseInt(hash[16], 16) % 4;
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ['8', '9', 'a', 'b'][nibble] + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

/** Escape a string for SQL single-quote literals. Returns 'NULL' for null/undefined. */
function esc(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined || val === '') return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  // Escape single quotes and backslashes
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

/** Wrap a value that might be NULL in a cast. */
function escOrNull(val: string | number | boolean | null | undefined): string {
  return esc(val);
}

/** UUID reference — returns 'NULL' if the short ID is falsy. */
function uuidRef(shortId: string | undefined | null): string {
  if (!shortId) return 'NULL';
  return `'${uuid(shortId)}'`;
}

/** PostgreSQL text[] literal. */
function textArr(vals: string[] | undefined | null): string {
  if (!vals || vals.length === 0) return "'{}'::text[]";
  const escaped = vals.map(v => `"${v.replace(/"/g, '\\"')}"`).join(',');
  return `'{${escaped}}'::text[]`;
}

/** PostgreSQL uuid[] literal. */
function uuidArr(shortIds: string[] | undefined | null): string {
  if (!shortIds || shortIds.length === 0) return "'{}'::uuid[]";
  const uuids = shortIds.map(id => uuid(id)).join(',');
  return `'{${uuids}}'::uuid[]`;
}

/** JSONB literal from an object. */
function jsonb(val: unknown): string {
  if (val === null || val === undefined) return "'{}'" + '::jsonb';
  const json = JSON.stringify(val).replace(/'/g, "''");
  return `'${json}'::jsonb`;
}

/** Convert various date formats to ISO timestamp string. */
function toTimestamp(dateStr: string | undefined | null): string {
  if (!dateStr) return 'NULL';
  // Handle US date format: "1/28/2026" or "5/7/2025"
  const usDate = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usDate) {
    const [, m, d, y] = usDate;
    return `'${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00Z'::timestamptz`;
  }
  // Handle ISO dates
  if (dateStr.includes('T')) {
    return `'${dateStr}'::timestamptz`;
  }
  // Simple date: "2024-01-01"
  return `'${dateStr}T00:00:00Z'::timestamptz`;
}

/** Convert to date (not timestamptz). */
function toDate(dateStr: string | undefined | null): string {
  if (!dateStr) return 'NULL';
  const usDate = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usDate) {
    const [, m, d, y] = usDate;
    return `'${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}'::date`;
  }
  if (dateStr.includes('T')) {
    return `'${dateStr.split('T')[0]}'::date`;
  }
  return `'${dateStr}'::date`;
}

/** Numeric value or NULL. */
function num(val: number | undefined | null): string {
  if (val === null || val === undefined) return 'NULL';
  return String(val);
}

// ── SQL Generation ──────────────────────────────────────────────────────────

const lines: string[] = [];
function emit(sql: string) { lines.push(sql); }
function emitBlank() { lines.push(''); }

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ============================================================================');
emit('-- QuikQuote — Seed Data Migration Script');
emit('-- Generated from localStorage / Zustand data sources');
emit(`-- Generated at: ${new Date().toISOString()}`);
emit('-- ============================================================================');
emit('--');
emit('-- IMPORTANT: Run this as the Supabase service_role or postgres user.');
emit('-- The script disables audit triggers during seeding and re-enables them after.');
emit('-- Ensure the schema migrations (001, 002, 003) have been applied first.');
emit('-- ============================================================================');
emitBlank();
emit('BEGIN;');
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 0. Disable audit triggers during seeding
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 0. Disable audit triggers ──────────────────────────────────────────────');
const auditTables = [
  'company_settings', 'document_templates',
  'customers', 'customer_shipping_addresses', 'contacts',
  'vendors', 'purchase_orders', 'purchase_order_items',
  'quotes', 'quote_line_items',
  'orders', 'order_line_items',
  'invoices', 'invoice_line_items', 'invoice_orders',
  'workflows', 'workflow_stages', 'tracking_devices',
  'pricing_categories', 'pricing_products', 'pricing_product_categories',
  'pricing_equipment', 'maintenance_records',
  'pricing_materials', 'material_groups', 'material_group_assignments',
  'material_category_assignments', 'material_product_assignments',
  'material_group_categories', 'material_change_history',
  'pricing_finishing', 'finishing_groups', 'finishing_group_assignments',
  'finishing_category_assignments', 'finishing_product_assignments',
  'pricing_labor', 'labor_groups', 'labor_group_assignments',
  'labor_category_assignments',
  'pricing_brokered', 'brokered_groups', 'brokered_group_assignments',
  'brokered_category_assignments',
  'product_templates', 'pricing_templates',
];
for (const t of auditTables) {
  emit(`ALTER TABLE ${t} DISABLE TRIGGER ALL;`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROFILES (from mockUsers — assumes auth.users pre-created)
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 1. Profiles ───────────────────────────────────────────────────────────');
emit('-- NOTE: In production, profiles are auto-created by the handle_new_user()');
emit('-- trigger when a user signs up via Supabase Auth. For seeding, we insert');
emit('-- directly. Ensure matching auth.users rows exist or disable the trigger.');
emitBlank();
for (const u of mockUsers) {
  const names = u.name.split(' ');
  const firstName = names[0];
  const lastName = names.slice(1).join(' ');
  emit(`INSERT INTO profiles (id, email, full_name, first_name, last_name, default_organization_id, created_at, updated_at)
VALUES ('${uuid(u.id)}', ${esc(u.email)}, ${esc(u.name)}, ${esc(firstName)}, ${esc(lastName)}, '${ORG_ID}', ${toTimestamp(u.createdAt)}, now())
ON CONFLICT (id) DO NOTHING;`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 2. ORGANIZATION
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 2. Organization ───────────────────────────────────────────────────────');
emit(`INSERT INTO organizations (id, name, slug, status, owner_profile_id, created_at, updated_at)
VALUES ('${ORG_ID}', ${esc(DEFAULT_COMPANY_SETTINGS.name)}, '${ORG_SLUG}', 'active', '${uuid(OWNER_PROFILE_ID_SHORT)}', now(), now())
ON CONFLICT (id) DO NOTHING;`);
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 3. ORGANIZATION MEMBERSHIPS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 3. Organization Memberships ────────────────────────────────────────────');
const roleMap: Record<string, string> = {
  admin: 'owner',
  csr: 'csr',
  estimator: 'estimator',
  production: 'production',
  sales: 'sales',
  manager: 'manager',
  accounting: 'accounting',
};
for (const u of mockUsers) {
  const dbRole = roleMap[u.role] || 'viewer';
  emit(`INSERT INTO organization_memberships (id, organization_id, profile_id, role, status, joined_at)
VALUES ('${uuid(`om_${u.id}`)}', '${ORG_ID}', '${uuid(u.id)}', '${dbRole}', 'active', ${toTimestamp(u.createdAt)})
ON CONFLICT (organization_id, profile_id) DO NOTHING;`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 4. DOCUMENT COUNTERS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 4. Document Counters ──────────────────────────────────────────────────');
// Determine highest numbers from the data
const allOrders = [...mockOrders, ...realOrders];
const maxQuote = mockQuotes.length;
const maxOrder = allOrders.length;
const maxInvoice = mockInvoices.length;
const maxPO = mockPurchaseOrders.length;
const maxCustomer = realCustomers.length;

const counters = [
  { type: 'quote',          prefix: 'Q',  value: maxQuote,    padding: 6 },
  { type: 'order',          prefix: 'O',  value: maxOrder,    padding: 6 },
  { type: 'invoice',        prefix: 'I',  value: maxInvoice,  padding: 6 },
  { type: 'purchase_order', prefix: 'PO', value: maxPO,       padding: 6 },
  { type: 'customer',       prefix: 'C',  value: maxCustomer, padding: 5 },
];
for (const c of counters) {
  emit(`INSERT INTO document_counters (id, organization_id, document_type, prefix, current_value, padding)
VALUES ('${uuid(`dc_${c.type}`)}', '${ORG_ID}', '${c.type}', '${c.prefix}', ${c.value}, ${c.padding})
ON CONFLICT (organization_id, document_type) DO NOTHING;`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 5. COMPANY SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 5. Company Settings ───────────────────────────────────────────────────');
const cs = DEFAULT_COMPANY_SETTINGS;
emit(`INSERT INTO company_settings (
  id, organization_id, name, email, phone, address, city, state, zip, website,
  tagline, primary_brand_color, default_tax_rate, default_markup, default_labor_rate,
  quote_valid_days, currency, timezone, default_bleed, default_gutter,
  default_bleed_wide, default_gutter_wide, open_links_in_new_tab,
  custom_terms, custom_delivery_methods, created_at, updated_at
) VALUES (
  '${uuid('company_settings')}', '${ORG_ID}',
  ${esc(cs.name)}, ${esc(cs.email)}, ${esc(cs.phone)}, ${esc(cs.address)},
  ${esc(cs.city)}, ${esc(cs.state)}, ${esc(cs.zip)}, ${esc(cs.website)},
  ${esc(cs.tagline)}, ${esc(cs.primaryBrandColor)},
  ${num(cs.defaultTaxRate / 100)}, ${num(cs.defaultMarkup / 100)}, ${num(cs.defaultLaborRate)},
  ${num(cs.quoteValidDays)}, ${esc(cs.currency)}, ${esc(cs.timezone)},
  ${num(cs.defaultBleed)}, ${num(cs.defaultGutter)},
  ${num(cs.defaultBleedWide)}, ${num(cs.defaultGutterWide)},
  ${cs.openLinksInNewTab}, ${textArr(cs.customTerms)}, ${textArr(cs.customDeliveryMethods)},
  now(), now()
) ON CONFLICT (organization_id) DO NOTHING;`);
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 6. DOCUMENT TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 6. Document Templates ─────────────────────────────────────────────────');
const docTemplates: [string, string][] = [
  ['quote', DEFAULT_QUOTE_TEMPLATE],
  ['order', DEFAULT_ORDER_TEMPLATE],
  ['work_order', DEFAULT_WORK_ORDER_TEMPLATE],
  ['invoice', DEFAULT_INVOICE_TEMPLATE],
  ['purchase_order', DEFAULT_PURCHASE_ORDER_TEMPLATE],
];
for (const [ttype, tbody] of docTemplates) {
  emit(`INSERT INTO document_templates (id, organization_id, template_type, body, created_at, updated_at)
VALUES ('${uuid(`dt_${ttype}`)}', '${ORG_ID}', '${ttype}', ${esc(tbody)}, now(), now())
ON CONFLICT (organization_id, template_type) DO NOTHING;`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 7. CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 7. Customers ──────────────────────────────────────────────────────────');
for (let i = 0; i < realCustomers.length; i++) {
  const c = realCustomers[i];
  const custNum = `C${String(i + 1).padStart(5, '0')}`;
  emit(`INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '${uuid(c.id)}', '${ORG_ID}', ${esc(c.customerNumber || custNum)},
  ${esc(c.name)}, ${esc((c as any).company)}, ${esc(c.email)}, ${esc(c.phone)},
  ${esc(c.address)}, ${esc(c.city)}, ${esc(c.state)}, ${esc(c.zip)}, ${esc((c as any).country || 'US')},
  ${c.taxExempt || false}, ${esc((c as any).taxId)}, ${esc(c.notes)},
  ${textArr(c.tags)}, ${esc(c.source)}, ${esc((c as any).planProphetId)}, ${esc(c.website)},
  ${num(c.salesHistorically || 0)}, ${num(c.sales12m || 0)},
  ${esc((c as any).accountNumber)}, ${esc((c as any).terms)}, ${esc((c as any).deliveryMethod)},
  ${(c as any).thirdPartyShipping || false}, ${esc((c as any).thirdPartyCarrierAccountNumber)},
  ${toTimestamp(c.createdAt)}, ${toTimestamp(c.updatedAt)}
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 8. CUSTOMER SHIPPING ADDRESSES
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 8. Customer Shipping Addresses ────────────────────────────────────────');
emit('-- (Populated from customer.shippingAddresses[] if any exist)');
for (const c of realCustomers) {
  const addrs = (c as any).shippingAddresses;
  if (addrs && Array.isArray(addrs)) {
    for (const a of addrs) {
      emit(`INSERT INTO customer_shipping_addresses (
  id, organization_id, customer_id, label, address, city, state, zip, country,
  is_default, notes, created_at, updated_at
) VALUES (
  '${uuid(a.id)}', '${ORG_ID}', '${uuid(c.id)}',
  ${esc(a.label)}, ${esc(a.address)}, ${esc(a.city)}, ${esc(a.state)}, ${esc(a.zip)},
  ${esc(a.country || 'US')}, ${a.isDefault || false}, ${esc(a.notes)},
  now(), now()
);`);
    }
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 9. CONTACTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 9. Contacts ───────────────────────────────────────────────────────────');
for (const ct of realContacts) {
  emit(`INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '${uuid(ct.id)}', '${ORG_ID}', '${uuid(ct.customerId)}',
  ${esc(ct.firstName)}, ${esc(ct.lastName)},
  ${esc(ct.email)}, ${esc(ct.phone)}, ${esc(ct.mobile)}, ${esc(ct.title)},
  ${ct.isPrimary || false}, ${esc(ct.notes)}, ${esc((ct as any).planProphetId)},
  ${toTimestamp(ct.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 10. VENDORS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 10. Vendors ───────────────────────────────────────────────────────────');
for (const v of mockVendors) {
  emit(`INSERT INTO vendors (
  id, organization_id, name, email, phone, website,
  address, city, state, zip, account_number, payment_terms,
  notes, tags, is_outsourced_production, created_at, updated_at
) VALUES (
  '${uuid(v.id)}', '${ORG_ID}',
  ${esc(v.name)}, ${esc(v.email)}, ${esc(v.phone)}, ${esc(v.website)},
  ${esc(v.address)}, ${esc((v as any).city)}, ${esc((v as any).state)}, ${esc((v as any).zip)},
  ${esc((v as any).accountNumber)}, ${esc(v.paymentTerms)},
  ${esc(v.notes)}, ${textArr(v.tags)}, ${v.isOutsourcedProduction},
  ${toTimestamp(v.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 11. WORKFLOWS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 11. Workflows ─────────────────────────────────────────────────────────');
for (const wf of mockWorkflows) {
  emit(`INSERT INTO workflows (
  id, organization_id, name, description, is_active, is_default,
  product_families, created_at, updated_at
) VALUES (
  '${uuid(wf.id)}', '${ORG_ID}',
  ${esc(wf.name)}, ${esc(wf.description)}, ${wf.isActive}, ${wf.isDefault},
  ${textArr(wf.productFamilies)},
  ${toTimestamp(wf.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 12. WORKFLOW STAGES
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 12. Workflow Stages ────────────────────────────────────────────────────');
for (const wf of mockWorkflows) {
  for (const st of wf.stages) {
    emit(`INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '${uuid(st.id)}', '${ORG_ID}', '${uuid(wf.id)}',
  ${esc(st.name)}, ${st.order}, ${esc(st.color)}, ${st.isComplete},
  ${uuidRef((st as any).defaultAssigneeId)},
  now(), now()
);`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 13. TRACKING DEVICES
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 13. Tracking Devices ──────────────────────────────────────────────────');
for (const td of trackingDevicesJson as any[]) {
  emit(`INSERT INTO tracking_devices (
  id, organization_id, name, code, description, workflow_id, stage_id,
  is_active, created_at, updated_at
) VALUES (
  '${uuid(td.id)}', '${ORG_ID}',
  ${esc(td.name)}, ${esc(td.code)}, ${esc(td.description)},
  ${uuidRef(td.workflowId)}, ${uuidRef(td.stageId)},
  ${td.isActive}, ${toTimestamp(td.createdAt)}, now()
) ON CONFLICT (organization_id, code) DO NOTHING;`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 14. PRICING CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 14. Pricing Categories ────────────────────────────────────────────────');
for (const cat of defaultCategories) {
  emit(`INSERT INTO pricing_categories (
  id, organization_id, name, description, sort_order, created_at, updated_at
) VALUES (
  '${uuid(cat.id)}', '${ORG_ID}',
  ${esc(cat.name)}, ${esc(cat.description)}, ${num(cat.sortOrder)},
  ${toTimestamp(cat.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 15. PRICING PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 15. Pricing Products ──────────────────────────────────────────────────');
for (const p of defaultProducts) {
  emit(`INSERT INTO pricing_products (
  id, organization_id, name, description, aliases, default_quantity,
  default_material_id, default_material_name,
  default_final_size, default_final_width, default_final_height,
  default_equipment_id, default_equipment_name,
  default_color, default_sides, default_folding,
  is_template, default_finishing_ids, default_pricing_context,
  created_at, updated_at
) VALUES (
  '${uuid(p.id)}', '${ORG_ID}',
  ${esc(p.name)}, ${esc(p.description)}, ${textArr(p.aliases)}, ${num(p.defaultQuantity)},
  ${uuidRef(p.defaultMaterialId)}, ${esc(p.defaultMaterialName)},
  ${esc(p.defaultFinalSize)}, ${num(p.defaultFinalWidth)}, ${num(p.defaultFinalHeight)},
  ${uuidRef(p.defaultEquipmentId)}, ${esc(p.defaultEquipmentName)},
  ${esc(p.defaultColor)}, ${esc(p.defaultSides)}, ${esc(p.defaultFolding)},
  ${p.isTemplate || false},
  ${uuidArr(p.defaultFinishingIds)},
  ${jsonb(p.defaultPricingContext || {})},
  ${toTimestamp(p.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 16. PRICING PRODUCT ↔ CATEGORY JUNCTION
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 16. Pricing Product ↔ Category Junction ───────────────────────────────');
for (const p of defaultProducts) {
  for (const catId of p.categoryIds) {
    emit(`INSERT INTO pricing_product_categories (product_id, category_id, created_at, updated_at)
VALUES ('${uuid(p.id)}', '${uuid(catId)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 17. PRICING EQUIPMENT
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 17. Pricing Equipment ─────────────────────────────────────────────────');
for (let idx = 0; idx < defaultPricingEquipment.length; idx++) {
  const e = defaultPricingEquipment[idx];
  emit(`INSERT INTO pricing_equipment (
  id, organization_id, name, category_applies, color_capability,
  cost_unit, cost_type, markup_multiplier, unit_cost,
  color_unit_cost, black_unit_cost,
  color_tiers, black_tiers, sqft_tiers,
  initial_setup_fee, units_per_hour, time_cost_per_hour, time_cost_markup,
  markup_type, use_pricing_tiers,
  auto_add_category_ids, maintenance_vendor_id,
  sort_order, created_at, updated_at
) VALUES (
  '${uuid(e.id)}', '${ORG_ID}',
  ${esc(e.name)}, ${esc(e.categoryApplies)}, ${esc(e.colorCapability)},
  ${esc(e.costUnit)}, ${esc(e.costType)}, ${num(e.markupMultiplier)}, ${num(e.unitCost)},
  ${num((e as any).colorUnitCost)}, ${num((e as any).blackUnitCost)},
  ${jsonb(e.colorTiers || [])}, ${jsonb(e.blackTiers || [])}, ${jsonb((e as any).sqftTiers || [])},
  ${num(e.initialSetupFee)}, ${num(e.unitsPerHour)}, ${num(e.timeCostPerHour)}, ${num(e.timeCostMarkup)},
  ${esc(e.markupType)}, ${(e as any).usePricingTiers || false},
  ${uuidArr((e as any).autoAddCategoryIds)}, ${uuidRef((e as any).maintenanceVendorId)},
  ${idx}, ${toTimestamp(e.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 18. MATERIAL GROUPS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 18. Material Groups ───────────────────────────────────────────────────');
for (const mg of defaultMaterialGroups) {
  emit(`INSERT INTO material_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '${uuid(mg.id)}', '${ORG_ID}',
  ${esc(mg.name)}, ${esc(mg.description)},
  ${toTimestamp(mg.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 19. MATERIAL GROUP ↔ CATEGORY JUNCTION
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 19. Material Group ↔ Category Junction ────────────────────────────────');
for (const mg of defaultMaterialGroups) {
  for (const catId of mg.categoryIds) {
    emit(`INSERT INTO material_group_categories (group_id, category_id, created_at, updated_at)
VALUES ('${uuid(mg.id)}', '${uuid(catId)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 20. PRICING MATERIALS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 20. Pricing Materials ─────────────────────────────────────────────────');
for (const m of defaultPricingMaterials) {
  emit(`INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '${uuid(m.id)}', '${ORG_ID}',
  ${esc(m.materialType)}, ${esc(m.name)}, ${esc(m.size)}, ${num(m.sizeWidth)}, ${num(m.sizeHeight)},
  ${esc(m.pricingModel)}, ${num(m.pricePerM)}, ${num(m.costPerUnit)}, ${num(m.costPerSqft)},
  ${num(m.rollCost)}, ${num(m.rollLength)},
  ${jsonb(m.pricingTiers || [])}, ${num(m.minimumCharge)}, ${esc(m.markupType)}, ${num(m.markup)},
  ${m.isFavorite || false}, ${num(m.useCount || 0)},
  ${esc(m.description)}, ${esc(m.vendorName)}, ${uuidRef(m.vendorId)}, ${esc(m.vendorMaterialId)},
  ${esc(m.vendorContactName)}, ${esc(m.vendorContactTitle)}, ${esc(m.vendorSalesRep)},
  ${toTimestamp(m.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 21. MATERIAL ↔ GROUP ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 21. Material ↔ Group Assignments ──────────────────────────────────────');
for (const m of defaultPricingMaterials) {
  for (const gid of m.materialGroupIds) {
    emit(`INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('${uuid(m.id)}', '${uuid(gid)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 22. MATERIAL ↔ CATEGORY ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 22. Material ↔ Category Assignments ───────────────────────────────────');
for (const m of defaultPricingMaterials) {
  for (const catId of m.categoryIds) {
    emit(`INSERT INTO material_category_assignments (material_id, category_id, created_at, updated_at)
VALUES ('${uuid(m.id)}', '${uuid(catId)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 23. MATERIAL ↔ PRODUCT ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 23. Material ↔ Product Assignments ────────────────────────────────────');
for (const m of defaultPricingMaterials) {
  for (const pid of m.productIds) {
    const isFav = m.favoriteProductIds?.includes(pid) || false;
    emit(`INSERT INTO material_product_assignments (material_id, product_id, is_favorite, created_at, updated_at)
VALUES ('${uuid(m.id)}', '${uuid(pid)}', ${isFav}, now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 24. FINISHING GROUPS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 24. Finishing Groups ──────────────────────────────────────────────────');
for (const fg of defaultFinishingGroups) {
  emit(`INSERT INTO finishing_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '${uuid(fg.id)}', '${ORG_ID}',
  ${esc(fg.name)}, ${esc(fg.description)},
  ${toTimestamp(fg.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 25. PRICING FINISHING
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 25. Pricing Finishing ─────────────────────────────────────────────────');
for (let idx = 0; idx < defaultFinishing.length; idx++) {
  const f = defaultFinishing[idx];
  emit(`INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  '${uuid(f.id)}', '${ORG_ID}',
  ${esc(f.name)}, ${esc(f.description)},
  ${esc(f.costType)}, ${esc(f.chargeBasis)}, ${esc((f as any).perimeterMode)}, ${num((f as any).perimeterIntervalInches)},
  ${num(f.unitCost)}, ${num(f.hourlyCost)}, ${num(f.outputPerHour)}, ${num(f.initialSetupFee)},
  ${num(f.markupPercent)}, ${num(f.minimumCharge)}, ${f.isFixedCharge}, ${num(f.fixedChargeAmount)}, ${num(f.fixedChargeCost)},
  ${num(f.sheetsPerStack)}, ${num(f.stacksPerHour)},
  ${esc((f as any).pricingMode)}, ${num((f as any).sellRate)}, ${jsonb((f as any).sellRateTiers || [])},
  ${uuidArr((f as any).autoAddCategoryIds)}, ${esc(f.notes)},
  ${idx}, ${toTimestamp(f.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 26. FINISHING ↔ GROUP ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 26. Finishing ↔ Group Assignments ─────────────────────────────────────');
for (const f of defaultFinishing) {
  for (const gid of f.finishingGroupIds) {
    emit(`INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('${uuid(f.id)}', '${uuid(gid)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 27. FINISHING ↔ CATEGORY ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 27. Finishing ↔ Category Assignments ──────────────────────────────────');
for (const f of defaultFinishing) {
  for (const catId of f.categoryIds) {
    emit(`INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('${uuid(f.id)}', '${uuid(catId)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 28. FINISHING ↔ PRODUCT ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 28. Finishing ↔ Product Assignments ───────────────────────────────────');
for (const f of defaultFinishing) {
  for (const pid of f.productIds) {
    emit(`INSERT INTO finishing_product_assignments (finishing_id, product_id, created_at, updated_at)
VALUES ('${uuid(f.id)}', '${uuid(pid)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 29. LABOR GROUPS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 29. Labor Groups ──────────────────────────────────────────────────────');
for (const lg of defaultLaborGroups) {
  emit(`INSERT INTO labor_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '${uuid(lg.id)}', '${ORG_ID}',
  ${esc(lg.name)}, ${esc(lg.description)},
  ${toTimestamp(lg.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 30. PRICING LABOR
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 30. Pricing Labor ─────────────────────────────────────────────────────');
for (const l of defaultLabor) {
  emit(`INSERT INTO pricing_labor (
  id, organization_id, name, description,
  charge_basis, hourly_cost, initial_setup_fee, markup_percent,
  is_pre_press, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  minimum_charge, output_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  created_at, updated_at
) VALUES (
  '${uuid(l.id)}', '${ORG_ID}',
  ${esc(l.name)}, ${esc(l.description)},
  ${esc(l.chargeBasis)}, ${num(l.hourlyCost)}, ${num(l.initialSetupFee)}, ${num(l.markupPercent)},
  ${(l as any).isPrePress || false}, ${l.isFixedCharge}, ${num(l.fixedChargeAmount)}, ${num(l.fixedChargeCost)},
  ${num(l.minimumCharge)}, ${num(l.outputPerHour)},
  ${esc((l as any).pricingMode)}, ${num((l as any).sellRate)}, ${jsonb((l as any).sellRateTiers || [])},
  ${uuidArr((l as any).autoAddCategoryIds)}, ${esc(l.notes)},
  ${toTimestamp(l.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 31. LABOR ↔ GROUP ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 31. Labor ↔ Group Assignments ─────────────────────────────────────────');
for (const l of defaultLabor) {
  for (const gid of l.laborGroupIds) {
    emit(`INSERT INTO labor_group_assignments (labor_id, group_id, created_at, updated_at)
VALUES ('${uuid(l.id)}', '${uuid(gid)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 32. LABOR ↔ CATEGORY ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 32. Labor ↔ Category Assignments ──────────────────────────────────────');
for (const l of defaultLabor) {
  for (const catId of l.categoryIds) {
    emit(`INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('${uuid(l.id)}', '${uuid(catId)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 33. BROKERED GROUPS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 33. Brokered Groups ───────────────────────────────────────────────────');
for (const bg of defaultBrokeredGroups) {
  emit(`INSERT INTO brokered_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '${uuid(bg.id)}', '${ORG_ID}',
  ${esc(bg.name)}, ${esc(bg.description)},
  ${toTimestamp(bg.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 34. PRICING BROKERED
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 34. Pricing Brokered ──────────────────────────────────────────────────');
for (const b of defaultBrokered) {
  emit(`INSERT INTO pricing_brokered (
  id, organization_id, name, description,
  cost_basis, unit_cost, initial_setup_fee, markup_percent,
  vendor_id, vendor_name,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  created_at, updated_at
) VALUES (
  '${uuid(b.id)}', '${ORG_ID}',
  ${esc(b.name)}, ${esc(b.description)},
  ${esc(b.costBasis)}, ${num(b.unitCost)}, ${num(b.initialSetupFee)}, ${num(b.markupPercent)},
  ${uuidRef(b.vendorId)}, ${esc(b.vendorName)},
  ${esc((b as any).pricingMode)}, ${num((b as any).sellRate)}, ${jsonb((b as any).sellRateTiers || [])},
  ${uuidArr((b as any).autoAddCategoryIds)}, ${esc(b.notes)},
  ${toTimestamp(b.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 35. BROKERED ↔ GROUP ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 35. Brokered ↔ Group Assignments ──────────────────────────────────────');
for (const b of defaultBrokered) {
  for (const gid of b.brokeredGroupIds) {
    emit(`INSERT INTO brokered_group_assignments (brokered_id, group_id, created_at, updated_at)
VALUES ('${uuid(b.id)}', '${uuid(gid)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 36. BROKERED ↔ CATEGORY ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 36. Brokered ↔ Category Assignments ───────────────────────────────────');
for (const b of defaultBrokered) {
  for (const catId of b.categoryIds) {
    emit(`INSERT INTO brokered_category_assignments (brokered_id, category_id, created_at, updated_at)
VALUES ('${uuid(b.id)}', '${uuid(catId)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 37. PRODUCT TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 37. Product Templates ─────────────────────────────────────────────────');
for (const t of mockTemplates) {
  emit(`INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  '${uuid(t.id)}', '${ORG_ID}',
  ${esc(t.name)}, ${esc(t.productFamily)}, ${esc(t.icon)}, ${esc(t.description)},
  ${jsonb(t.defaultLineItem)}, ${t.isFavorite}, ${num(t.usageCount)},
  ${toTimestamp(t.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 38. PRICING TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 38. Pricing Templates ─────────────────────────────────────────────────');
for (const pt of defaultPricingTemplates) {
  emit(`INSERT INTO pricing_templates (
  id, organization_id, name,
  category_id, category_name, product_id, product_name,
  quantity, final_width, final_height,
  material_id, material_name, equipment_id, equipment_name,
  color, sides, folding,
  is_favorite, usage_count, created_at, updated_at
) VALUES (
  '${uuid(pt.id)}', '${ORG_ID}',
  ${esc(pt.name)},
  ${uuidRef(pt.categoryId)}, ${esc(pt.categoryName)},
  ${uuidRef(pt.productId)}, ${esc(pt.productName)},
  ${num(pt.quantity)}, ${num(pt.finalWidth)}, ${num(pt.finalHeight)},
  ${uuidRef(pt.materialId)}, ${esc(pt.materialName)},
  ${uuidRef(pt.equipmentId)}, ${esc(pt.equipmentName)},
  ${esc(pt.color)}, ${esc(pt.sides)}, ${esc(pt.folding)},
  ${pt.isFavorite}, ${num(pt.usageCount)},
  ${toTimestamp(pt.createdAt)}, now()
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 39. QUOTES
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 39. Quotes ────────────────────────────────────────────────────────────');
for (const q of mockQuotes) {
  emit(`INSERT INTO quotes (
  id, organization_id, number, status,
  customer_id, customer_name, contact_id, contact_name,
  title, description,
  subtotal, tax_rate, tax_amount, total,
  quote_date, valid_until,
  csr_id, sales_id,
  notes, internal_notes, tags,
  converted_to_order_id, source, ai_prompt, status_changed_at,
  bill_to_name, bill_to_address, bill_to_city, bill_to_state, bill_to_zip, bill_to_country,
  ship_to_same_as_bill,
  ship_to_name, ship_to_address, ship_to_city, ship_to_state, ship_to_zip, ship_to_country,
  ship_to_notes, delivery_method, terms,
  created_at, updated_at
) VALUES (
  '${uuid(q.id)}', '${ORG_ID}', ${esc(q.number)}, ${esc(q.status)},
  ${uuidRef(q.customerId)}, ${esc(q.customerName)}, ${uuidRef(q.contactId)}, ${esc(q.contactName)},
  ${esc(q.title)}, ${esc(q.description)},
  ${num(q.subtotal)}, ${num((q.taxRate || 0) / 100)}, ${num(q.taxAmount || 0)}, ${num(q.total)},
  ${toDate((q as any).quoteDate)}, ${toDate(q.validUntil)},
  ${uuidRef(q.csrId)}, ${uuidRef(q.salesId)},
  ${esc(q.notes)}, ${esc(q.internalNotes)}, ${textArr(q.tags)},
  ${uuidRef(q.convertedToOrderId)}, ${esc(q.source)}, ${esc(q.aiPrompt)},
  ${toTimestamp((q as any).statusChangedAt)},
  ${esc((q as any).billToName)}, ${esc((q as any).billToAddress)}, ${esc((q as any).billToCity)},
  ${esc((q as any).billToState)}, ${esc((q as any).billToZip)}, ${esc((q as any).billToCountry)},
  ${(q as any).shipToSameAsBillTo ?? true},
  ${esc((q as any).shipToName)}, ${esc((q as any).shipToAddress)}, ${esc((q as any).shipToCity)},
  ${esc((q as any).shipToState)}, ${esc((q as any).shipToZip)}, ${esc((q as any).shipToCountry)},
  ${esc((q as any).shipToNotes)}, ${esc((q as any).deliveryMethod)}, ${esc((q as any).terms)},
  ${toTimestamp(q.createdAt)}, ${toTimestamp(q.updatedAt)}
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 40. QUOTE LINE ITEMS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 40. Quote Line Items ──────────────────────────────────────────────────');
for (const q of mockQuotes) {
  for (let pos = 0; pos < q.lineItems.length; pos++) {
    const li = q.lineItems[pos];
    emit(`INSERT INTO quote_line_items (
  id, organization_id, quote_id, position,
  product_family, description, quantity, unit,
  width, height,
  material_id, material_name, material_cost,
  equipment_id, equipment_name, run_time, equipment_cost,
  labor_hours, labor_rate, labor_cost,
  vendor_id, vendor_cost,
  setup_cost, additional_cost, total_cost, markup, sell_price,
  notes, ups_per_sheet, sheet_size, template_id,
  color_mode, sides, folding_type, drilling_type,
  cutting_enabled, sheets_per_stack,
  product_id, product_name, category_name,
  pricing_context, is_multi_part, multi_part_name, multi_part_description,
  created_at, updated_at
) VALUES (
  '${uuid(li.id)}', '${ORG_ID}', '${uuid(q.id)}', ${pos},
  ${esc(li.productFamily)}, ${esc(li.description)}, ${num(li.quantity)}, ${esc(li.unit)},
  ${num(li.width)}, ${num(li.height)},
  ${uuidRef(li.materialId)}, ${esc(li.materialName)}, ${num(li.materialCost)},
  ${uuidRef(li.equipmentId)}, ${esc(li.equipmentName)}, ${num(li.runTime)}, ${num(li.equipmentCost)},
  ${num(li.laborHours || 0)}, ${num(li.laborRate || 0)}, ${num(li.laborCost || 0)},
  ${uuidRef(li.vendorId)}, ${num(li.vendorCost)},
  ${num(li.setupCost || 0)}, ${num(li.additionalCost || 0)}, ${num(li.totalCost)}, ${num(li.markup)}, ${num(li.sellPrice)},
  ${esc(li.notes)}, ${num(li.upsPerSheet)}, ${esc(li.sheetSize)}, ${uuidRef(li.templateId)},
  ${esc(li.colorMode)}, ${esc(li.sides)}, ${esc(li.foldingType)}, ${esc(li.drillingType)},
  ${li.cuttingEnabled || false}, ${num(li.sheetsPerStack)},
  ${uuidRef(li.productId)}, ${esc(li.productName)}, ${esc(li.categoryName)},
  ${jsonb(li.pricingContext || {})}, ${li.isMultiPart || false}, ${esc(li.multiPartName)}, ${esc(li.multiPartDescription)},
  now(), now()
);`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 41. ORDERS (mock + real historical)
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 41. Orders ────────────────────────────────────────────────────────────');
for (const o of allOrders) {
  emit(`INSERT INTO orders (
  id, organization_id, number, status,
  quote_id, quote_number,
  customer_id, customer_name, contact_id, contact_name,
  title, description,
  subtotal, tax_rate, tax_amount, total,
  due_date, ship_date,
  csr_id, sales_id,
  workflow_id, current_stage_id, tracking_mode,
  notes, internal_notes, po_number, invoice_id,
  bill_to_name, bill_to_address, bill_to_city, bill_to_state, bill_to_zip, bill_to_country,
  ship_to_same_as_bill,
  ship_to_name, ship_to_address, ship_to_city, ship_to_state, ship_to_zip, ship_to_country,
  ship_to_notes, delivery_method, terms,
  created_at, updated_at
) VALUES (
  '${uuid(o.id)}', '${ORG_ID}', ${esc(o.number)}, ${esc(o.status)},
  ${uuidRef(o.quoteId)}, ${esc(o.quoteNumber)},
  ${uuidRef(o.customerId)}, ${esc(o.customerName)}, ${uuidRef(o.contactId)}, ${esc(o.contactName)},
  ${esc(o.title)}, ${esc(o.description)},
  ${num(o.subtotal)}, ${num((o.taxRate || 0) / 100)}, ${num(o.taxAmount || 0)}, ${num(o.total)},
  ${toDate(o.dueDate)}, ${toDate(o.shipDate)},
  ${uuidRef(o.csrId)}, ${uuidRef(o.salesId)},
  ${uuidRef(o.workflowId)}, ${esc(o.currentStageId ? uuid(o.currentStageId) : null)}, ${esc(o.trackingMode || 'order')},
  ${esc(o.notes)}, ${esc(o.internalNotes)}, ${esc(o.poNumber)},
  ${uuidRef(o.invoiceId)},
  ${esc((o as any).billToName)}, ${esc((o as any).billToAddress)}, ${esc((o as any).billToCity)},
  ${esc((o as any).billToState)}, ${esc((o as any).billToZip)}, ${esc((o as any).billToCountry)},
  ${(o as any).shipToSameAsBillTo ?? true},
  ${esc((o as any).shipToName)}, ${esc((o as any).shipToAddress)}, ${esc((o as any).shipToCity)},
  ${esc((o as any).shipToState)}, ${esc((o as any).shipToZip)}, ${esc((o as any).shipToCountry)},
  ${esc((o as any).shipToNotes)}, ${esc((o as any).deliveryMethod)}, ${esc((o as any).terms)},
  ${toTimestamp(o.createdAt)}, ${toTimestamp(o.updatedAt)}
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 42. ORDER LINE ITEMS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 42. Order Line Items ──────────────────────────────────────────────────');
for (const o of allOrders) {
  for (let pos = 0; pos < o.lineItems.length; pos++) {
    const li = o.lineItems[pos];
    emit(`INSERT INTO order_line_items (
  id, organization_id, order_id, position,
  product_family, description, quantity, unit,
  width, height,
  material_id, material_name, material_cost,
  equipment_id, equipment_name, run_time, equipment_cost,
  labor_hours, labor_rate, labor_cost,
  vendor_id, vendor_cost,
  setup_cost, additional_cost, total_cost, markup, sell_price,
  notes, ups_per_sheet, sheet_size, template_id,
  color_mode, sides, folding_type, drilling_type,
  cutting_enabled, sheets_per_stack,
  product_id, product_name, category_name,
  pricing_context, is_multi_part, multi_part_name, multi_part_description,
  workflow_stage_id, assigned_user_id, completed_at, time_spent, production_notes,
  created_at, updated_at
) VALUES (
  '${uuid(li.id)}', '${ORG_ID}', '${uuid(o.id)}', ${pos},
  ${esc(li.productFamily)}, ${esc(li.description)}, ${num(li.quantity)}, ${esc(li.unit)},
  ${num(li.width)}, ${num(li.height)},
  ${uuidRef(li.materialId)}, ${esc(li.materialName)}, ${num(li.materialCost)},
  ${uuidRef(li.equipmentId)}, ${esc(li.equipmentName)}, ${num(li.runTime)}, ${num(li.equipmentCost)},
  ${num(li.laborHours || 0)}, ${num(li.laborRate || 0)}, ${num(li.laborCost || 0)},
  ${uuidRef(li.vendorId)}, ${num(li.vendorCost)},
  ${num(li.setupCost || 0)}, ${num(li.additionalCost || 0)}, ${num(li.totalCost)}, ${num(li.markup)}, ${num(li.sellPrice)},
  ${esc(li.notes)}, ${num(li.upsPerSheet)}, ${esc(li.sheetSize)}, ${uuidRef(li.templateId)},
  ${esc(li.colorMode)}, ${esc(li.sides)}, ${esc(li.foldingType)}, ${esc(li.drillingType)},
  ${li.cuttingEnabled || false}, ${num(li.sheetsPerStack)},
  ${uuidRef(li.productId)}, ${esc(li.productName)}, ${esc(li.categoryName)},
  ${jsonb(li.pricingContext || {})}, ${li.isMultiPart || false}, ${esc(li.multiPartName)}, ${esc(li.multiPartDescription)},
  ${esc((li as any).workflowStageId)}, ${uuidRef((li as any).assignedUserId)},
  ${toTimestamp((li as any).completedAt)}, ${num((li as any).timeSpent)}, ${esc((li as any).productionNotes)},
  now(), now()
);`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 43. INVOICES
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 43. Invoices ──────────────────────────────────────────────────────────');
for (const inv of mockInvoices) {
  emit(`INSERT INTO invoices (
  id, organization_id, number, status,
  customer_id, customer_name,
  subtotal, tax_rate, tax_amount, total,
  due_date, paid_date, paid_amount,
  notes,
  created_at, updated_at
) VALUES (
  '${uuid(inv.id)}', '${ORG_ID}', ${esc(inv.number)}, ${esc(inv.status)},
  ${uuidRef(inv.customerId)}, ${esc(inv.customerName)},
  ${num(inv.subtotal)}, ${num((inv.taxRate || 0) / 100)}, ${num(inv.taxAmount || 0)}, ${num(inv.total)},
  ${toDate(inv.dueDate)}, ${toDate(inv.paidDate)}, ${num(inv.paidAmount)},
  ${esc(inv.notes)},
  ${toTimestamp(inv.createdAt)}, ${toTimestamp(inv.updatedAt)}
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 44. INVOICE LINE ITEMS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 44. Invoice Line Items ────────────────────────────────────────────────');
for (const inv of mockInvoices) {
  for (let pos = 0; pos < inv.lineItems.length; pos++) {
    const li = inv.lineItems[pos];
    emit(`INSERT INTO invoice_line_items (
  id, organization_id, invoice_id, order_id, order_item_id,
  description, quantity, unit, unit_price, total,
  position, created_at
) VALUES (
  '${uuid(li.id)}', '${ORG_ID}', '${uuid(inv.id)}',
  ${uuidRef(li.orderId)}, ${uuidRef(li.orderItemId)},
  ${esc(li.description)}, ${num(li.quantity)}, ${esc(li.unit)},
  ${num(li.unitPrice)}, ${num(li.total)},
  ${pos}, now()
);`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 45. INVOICE ↔ ORDER JUNCTION
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 45. Invoice ↔ Order Junction ──────────────────────────────────────────');
for (const inv of mockInvoices) {
  for (const ordId of inv.orderIds) {
    emit(`INSERT INTO invoice_orders (invoice_id, order_id, created_at, updated_at)
VALUES ('${uuid(inv.id)}', '${uuid(ordId)}', now(), now())
ON CONFLICT DO NOTHING;`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 46. PURCHASE ORDERS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 46. Purchase Orders ───────────────────────────────────────────────────');
for (const po of mockPurchaseOrders) {
  emit(`INSERT INTO purchase_orders (
  id, organization_id, number,
  vendor_id, order_id, status,
  subtotal, tax, total,
  notes, expected_date, received_date,
  sent_at, acknowledged_at,
  created_by, created_at, updated_at
) VALUES (
  '${uuid(po.id)}', '${ORG_ID}', ${esc(po.number)},
  ${uuidRef(po.vendorId)}, ${uuidRef(po.orderId)}, ${esc(po.status)},
  ${num(po.subtotal)}, ${num(po.tax || 0)}, ${num(po.total)},
  ${esc(po.notes)}, ${toDate(po.expectedDate)}, ${toDate(po.receivedDate)},
  ${toTimestamp(po.sentAt)}, ${toTimestamp(po.acknowledgedAt)},
  ${uuidRef(po.createdBy)},
  ${toTimestamp(po.createdAt)}, ${toTimestamp(po.updatedAt)}
);`);
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// 47. PURCHASE ORDER ITEMS
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── 47. Purchase Order Items ──────────────────────────────────────────────');
for (const po of mockPurchaseOrders) {
  for (let pos = 0; pos < po.items.length; pos++) {
    const item = po.items[pos];
    emit(`INSERT INTO purchase_order_items (
  id, organization_id, purchase_order_id,
  description, quantity, unit, unit_cost, total,
  order_item_id, received_quantity, position,
  created_at
) VALUES (
  '${uuid(item.id)}', '${ORG_ID}', '${uuid(po.id)}',
  ${esc(item.description)}, ${num(item.quantity)}, ${esc(item.unit)},
  ${num(item.unitCost)}, ${num(item.total)},
  ${uuidRef(item.orderItemId)}, ${num(item.receivedQuantity || 0)}, ${pos},
  now()
);`);
  }
}
emitBlank();

// ─────────────────────────────────────────────────────────────────────────────
// Re-enable audit triggers
// ─────────────────────────────────────────────────────────────────────────────
emit('-- ── Re-enable audit triggers ──────────────────────────────────────────────');
for (const t of auditTables) {
  emit(`ALTER TABLE ${t} ENABLE TRIGGER ALL;`);
}
emitBlank();

emit('COMMIT;');
emitBlank();
emit('-- ============================================================================');
emit('-- Seed data migration complete!');
emit('-- ============================================================================');
emit(`-- Summary:`);
emit(`--   Profiles:              ${mockUsers.length}`);
emit(`--   Organization:          1`);
emit(`--   Customers:             ${realCustomers.length}`);
emit(`--   Contacts:              ${realContacts.length}`);
emit(`--   Vendors:               ${mockVendors.length}`);
emit(`--   Workflows:             ${mockWorkflows.length}`);
emit(`--   Workflow Stages:       ${mockWorkflows.reduce((s, w) => s + w.stages.length, 0)}`);
emit(`--   Tracking Devices:      ${trackingDevicesJson.length}`);
emit(`--   Pricing Categories:    ${defaultCategories.length}`);
emit(`--   Pricing Products:      ${defaultProducts.length}`);
emit(`--   Pricing Equipment:     ${defaultPricingEquipment.length}`);
emit(`--   Pricing Materials:     ${defaultPricingMaterials.length}`);
emit(`--   Pricing Finishing:     ${defaultFinishing.length}`);
emit(`--   Pricing Labor:         ${defaultLabor.length}`);
emit(`--   Pricing Brokered:      ${defaultBrokered.length}`);
emit(`--   Material Groups:       ${defaultMaterialGroups.length}`);
emit(`--   Finishing Groups:      ${defaultFinishingGroups.length}`);
emit(`--   Labor Groups:          ${defaultLaborGroups.length}`);
emit(`--   Brokered Groups:       ${defaultBrokeredGroups.length}`);
emit(`--   Product Templates:     ${mockTemplates.length}`);
emit(`--   Pricing Templates:     ${defaultPricingTemplates.length}`);
emit(`--   Quotes:                ${mockQuotes.length}`);
emit(`--   Orders:                ${allOrders.length} (${mockOrders.length} active + ${realOrders.length} historical)`);
emit(`--   Invoices:              ${mockInvoices.length}`);
emit(`--   Purchase Orders:       ${mockPurchaseOrders.length}`);
emit(`--   Document Templates:    5`);
emit('-- ============================================================================');

// ── Write output ────────────────────────────────────────────────────────────
const outPath = resolve(__dirname, 'seed-data.sql');
const sql = lines.join('\n');
writeFileSync(outPath, sql, 'utf-8');
console.log(`✅ Wrote ${lines.length} lines (${(sql.length / 1024).toFixed(1)} KB) → ${outPath}`);
