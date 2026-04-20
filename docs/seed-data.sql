-- ============================================================================
-- QuikQuote — Seed Data Migration Script
-- Generated from localStorage / Zustand data sources
-- Generated at: 2026-04-20T19:46:10.983Z
-- ============================================================================
--
-- IMPORTANT: Run this as the Supabase service_role or postgres user.
-- The script disables audit triggers during seeding and re-enables them after.
-- Ensure the schema migrations (001, 002, 003) have been applied first.
-- ============================================================================

BEGIN;

-- ── 0. Disable audit triggers ──────────────────────────────────────────────
ALTER TABLE company_settings DISABLE TRIGGER ALL;
ALTER TABLE document_templates DISABLE TRIGGER ALL;
ALTER TABLE customers DISABLE TRIGGER ALL;
ALTER TABLE customer_shipping_addresses DISABLE TRIGGER ALL;
ALTER TABLE contacts DISABLE TRIGGER ALL;
ALTER TABLE vendors DISABLE TRIGGER ALL;
ALTER TABLE purchase_orders DISABLE TRIGGER ALL;
ALTER TABLE purchase_order_items DISABLE TRIGGER ALL;
ALTER TABLE quotes DISABLE TRIGGER ALL;
ALTER TABLE quote_line_items DISABLE TRIGGER ALL;
ALTER TABLE orders DISABLE TRIGGER ALL;
ALTER TABLE order_line_items DISABLE TRIGGER ALL;
ALTER TABLE invoices DISABLE TRIGGER ALL;
ALTER TABLE invoice_line_items DISABLE TRIGGER ALL;
ALTER TABLE invoice_orders DISABLE TRIGGER ALL;
ALTER TABLE workflows DISABLE TRIGGER ALL;
ALTER TABLE workflow_stages DISABLE TRIGGER ALL;
ALTER TABLE tracking_devices DISABLE TRIGGER ALL;
ALTER TABLE pricing_categories DISABLE TRIGGER ALL;
ALTER TABLE pricing_products DISABLE TRIGGER ALL;
ALTER TABLE pricing_product_categories DISABLE TRIGGER ALL;
ALTER TABLE pricing_equipment DISABLE TRIGGER ALL;
ALTER TABLE maintenance_records DISABLE TRIGGER ALL;
ALTER TABLE pricing_materials DISABLE TRIGGER ALL;
ALTER TABLE material_groups DISABLE TRIGGER ALL;
ALTER TABLE material_group_assignments DISABLE TRIGGER ALL;
ALTER TABLE material_category_assignments DISABLE TRIGGER ALL;
ALTER TABLE material_product_assignments DISABLE TRIGGER ALL;
ALTER TABLE material_group_categories DISABLE TRIGGER ALL;
ALTER TABLE material_change_history DISABLE TRIGGER ALL;
ALTER TABLE pricing_finishing DISABLE TRIGGER ALL;
ALTER TABLE finishing_groups DISABLE TRIGGER ALL;
ALTER TABLE finishing_group_assignments DISABLE TRIGGER ALL;
ALTER TABLE finishing_category_assignments DISABLE TRIGGER ALL;
ALTER TABLE finishing_product_assignments DISABLE TRIGGER ALL;
ALTER TABLE pricing_labor DISABLE TRIGGER ALL;
ALTER TABLE labor_groups DISABLE TRIGGER ALL;
ALTER TABLE labor_group_assignments DISABLE TRIGGER ALL;
ALTER TABLE labor_category_assignments DISABLE TRIGGER ALL;
ALTER TABLE pricing_brokered DISABLE TRIGGER ALL;
ALTER TABLE brokered_groups DISABLE TRIGGER ALL;
ALTER TABLE brokered_group_assignments DISABLE TRIGGER ALL;
ALTER TABLE brokered_category_assignments DISABLE TRIGGER ALL;
ALTER TABLE product_templates DISABLE TRIGGER ALL;
ALTER TABLE pricing_templates DISABLE TRIGGER ALL;

-- ── 1. Profiles ───────────────────────────────────────────────────────────
-- NOTE: In production, profiles are auto-created by the handle_new_user()
-- trigger when a user signs up via Supabase Auth. For seeding, we insert
-- directly. Ensure matching auth.users rows exist or disable the trigger.

INSERT INTO profiles (id, email, full_name, first_name, last_name, default_organization_id, created_at, updated_at)
VALUES ('07a8b443-f67e-44ca-a18e-d08bf48ea845', 'john@printco.com', 'John Mitchell', 'John', 'Mitchell', '00000000-0000-4000-a000-000000000001', '2024-01-01T00:00:00Z'::timestamptz, now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, email, full_name, first_name, last_name, default_organization_id, created_at, updated_at)
VALUES ('f2253de0-53bf-478b-ae27-1409352d0e9e', 'denise@printco.com', 'Denise Rivera', 'Denise', 'Rivera', '00000000-0000-4000-a000-000000000001', '2024-01-05T00:00:00Z'::timestamptz, now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, email, full_name, first_name, last_name, default_organization_id, created_at, updated_at)
VALUES ('84bdbc7d-2082-4247-b1bf-73a2bf5d42ba', 'amanda@printco.com', 'Amanda Chen', 'Amanda', 'Chen', '00000000-0000-4000-a000-000000000001', '2024-01-10T00:00:00Z'::timestamptz, now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, email, full_name, first_name, last_name, default_organization_id, created_at, updated_at)
VALUES ('f5240f84-5f3f-4e0d-bd53-ef39b7edcd69', 'mike@printco.com', 'Mike Torres', 'Mike', 'Torres', '00000000-0000-4000-a000-000000000001', '2024-02-01T00:00:00Z'::timestamptz, now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, email, full_name, first_name, last_name, default_organization_id, created_at, updated_at)
VALUES ('a85975c7-0c2c-417c-8dcd-2fd0e15d6089', 'salo@printco.com', 'Salo Levy', 'Salo', 'Levy', '00000000-0000-4000-a000-000000000001', '2024-02-15T00:00:00Z'::timestamptz, now())
ON CONFLICT (id) DO NOTHING;

-- ── 2. Organization ───────────────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, status, owner_profile_id, created_at, updated_at)
VALUES ('00000000-0000-4000-a000-000000000001', 'PrintCo Solutions', 'printco-solutions', 'active', '07a8b443-f67e-44ca-a18e-d08bf48ea845', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ── 3. Organization Memberships ────────────────────────────────────────────
INSERT INTO organization_memberships (id, organization_id, profile_id, role, status, joined_at)
VALUES ('3b06d9dd-cb43-4339-9ccb-59e6cbe10bb6', '00000000-0000-4000-a000-000000000001', '07a8b443-f67e-44ca-a18e-d08bf48ea845', 'owner', 'active', '2024-01-01T00:00:00Z'::timestamptz)
ON CONFLICT (organization_id, profile_id) DO NOTHING;
INSERT INTO organization_memberships (id, organization_id, profile_id, role, status, joined_at)
VALUES ('ffecd56e-a356-45f5-a2c1-99a51e84335a', '00000000-0000-4000-a000-000000000001', 'f2253de0-53bf-478b-ae27-1409352d0e9e', 'csr', 'active', '2024-01-05T00:00:00Z'::timestamptz)
ON CONFLICT (organization_id, profile_id) DO NOTHING;
INSERT INTO organization_memberships (id, organization_id, profile_id, role, status, joined_at)
VALUES ('91be9ed2-54cd-44a7-b855-30a7e51319dd', '00000000-0000-4000-a000-000000000001', '84bdbc7d-2082-4247-b1bf-73a2bf5d42ba', 'estimator', 'active', '2024-01-10T00:00:00Z'::timestamptz)
ON CONFLICT (organization_id, profile_id) DO NOTHING;
INSERT INTO organization_memberships (id, organization_id, profile_id, role, status, joined_at)
VALUES ('ca62c321-e437-4eb1-9a7f-e0bce872d823', '00000000-0000-4000-a000-000000000001', 'f5240f84-5f3f-4e0d-bd53-ef39b7edcd69', 'production', 'active', '2024-02-01T00:00:00Z'::timestamptz)
ON CONFLICT (organization_id, profile_id) DO NOTHING;
INSERT INTO organization_memberships (id, organization_id, profile_id, role, status, joined_at)
VALUES ('8e1cba52-6210-4dc8-a267-db27e3dd8b5c', '00000000-0000-4000-a000-000000000001', 'a85975c7-0c2c-417c-8dcd-2fd0e15d6089', 'sales', 'active', '2024-02-15T00:00:00Z'::timestamptz)
ON CONFLICT (organization_id, profile_id) DO NOTHING;

-- ── 4. Document Counters ──────────────────────────────────────────────────
INSERT INTO document_counters (id, organization_id, document_type, prefix, current_value, padding)
VALUES ('51ced11e-8047-4404-a6a9-c48d2878db27', '00000000-0000-4000-a000-000000000001', 'quote', 'Q', 5, 6)
ON CONFLICT (organization_id, document_type) DO NOTHING;
INSERT INTO document_counters (id, organization_id, document_type, prefix, current_value, padding)
VALUES ('8c9545ab-d2f8-4383-8fc3-237529687cb5', '00000000-0000-4000-a000-000000000001', 'order', 'O', 83, 6)
ON CONFLICT (organization_id, document_type) DO NOTHING;
INSERT INTO document_counters (id, organization_id, document_type, prefix, current_value, padding)
VALUES ('633bc37d-5a92-4d32-800a-8850f205cd2f', '00000000-0000-4000-a000-000000000001', 'invoice', 'I', 1, 6)
ON CONFLICT (organization_id, document_type) DO NOTHING;
INSERT INTO document_counters (id, organization_id, document_type, prefix, current_value, padding)
VALUES ('7cd04f16-2607-4e66-a494-caddd8939138', '00000000-0000-4000-a000-000000000001', 'purchase_order', 'PO', 1, 6)
ON CONFLICT (organization_id, document_type) DO NOTHING;
INSERT INTO document_counters (id, organization_id, document_type, prefix, current_value, padding)
VALUES ('aa8767ab-a9b3-4fec-9199-ab06ed9f81c8', '00000000-0000-4000-a000-000000000001', 'customer', 'C', 80, 5)
ON CONFLICT (organization_id, document_type) DO NOTHING;

-- ── 5. Company Settings ───────────────────────────────────────────────────
INSERT INTO company_settings (
  id, organization_id, name, email, phone, address, city, state, zip, website,
  tagline, primary_brand_color, default_tax_rate, default_markup, default_labor_rate,
  quote_valid_days, currency, timezone, default_bleed, default_gutter,
  default_bleed_wide, default_gutter_wide, open_links_in_new_tab,
  custom_terms, custom_delivery_methods, created_at, updated_at
) VALUES (
  'cdd26d4b-f4b1-4a83-ba95-efdd39340167', '00000000-0000-4000-a000-000000000001',
  'PrintCo Solutions', 'admin@printco.com', '555-100-0000', '100 Print Ave',
  'Miami', 'FL', '33101', 'www.printco.com',
  'Quality Print. Fast Delivery.', '#2563eb',
  0.07, 0.45, 45,
  45, 'USD', 'America/New_York',
  0.125, 0,
  0.25, 0,
  true, '{}'::text[], '{}'::text[],
  now(), now()
) ON CONFLICT (organization_id) DO NOTHING;

-- ── 6. Document Templates ─────────────────────────────────────────────────
INSERT INTO document_templates (id, organization_id, template_type, body, created_at, updated_at)
VALUES ('4354749d-f5c4-4481-961e-3cbbdba59125', '00000000-0000-4000-a000-000000000001', 'quote', '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Helvetica Neue'', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 22px; font-weight: bold; color: #1f2937; }
    .company-info { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-title { font-size: 28px; font-weight: bold; color: #1f2937; text-align: right; }
    .doc-number { font-size: 16px; font-weight: 600; color: #2563eb; text-align: right; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .section-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .customer-name { font-size: 16px; font-weight: 600; color: #1f2937; }
    .customer-detail { font-size: 13px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: #1f2937; color: white; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
    thead th:last-child, thead th:nth-child(3) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    tbody td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .totals { display: flex; justify-content: flex-end; margin: 20px 0 30px; }
    .totals-box { width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals-row.total { border-top: 2px solid #1f2937; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; }
    .terms { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; }
    .terms p { font-size: 11px; color: #9ca3af; line-height: 1.6; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">{{companyName}}</div>
      <div class="company-info">{{companyAddress}}<br>{{companyPhone}} &middot; {{companyEmail}}</div>
    </div>
    <div>
      <div class="doc-title">QUOTE</div>
      <div class="doc-number">{{quoteNumber}}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="section-label">Bill To</div>
      <div class="customer-name">{{customerName}}</div>
    </div>
    <div>
      <div class="section-label">Quote Details</div>
      <div class="customer-detail">Date: {{quoteDate}}</div>
      <div class="customer-detail">Valid Until: {{validUntil}}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{lineItems}}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>{{subtotal}}</span></div>
      <div class="totals-row"><span>Tax</span><span>{{tax}}</span></div>
      <div class="totals-row total"><span>TOTAL</span><span>{{total}}</span></div>
    </div>
  </div>

  <div class="terms">
    <div class="section-label">Terms & Conditions</div>
    <p>This quote is valid until {{validUntil}}. Prices are subject to change after expiration. A 50% deposit is required to begin production.</p>
  </div>

  <div class="footer">{{companyName}} &middot; {{companyAddress}} &middot; {{companyPhone}}</div>
</body>
</html>', now(), now())
ON CONFLICT (organization_id, template_type) DO NOTHING;
INSERT INTO document_templates (id, organization_id, template_type, body, created_at, updated_at)
VALUES ('c46ff0c7-eabf-4033-8ba0-ed01d1f1d4ed', '00000000-0000-4000-a000-000000000001', 'order', '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Helvetica Neue'', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 22px; font-weight: bold; color: #1f2937; }
    .company-info { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-title { font-size: 28px; font-weight: bold; color: #1f2937; text-align: right; }
    .doc-number { font-size: 16px; font-weight: 600; color: #059669; text-align: right; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .section-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .customer-name { font-size: 16px; font-weight: 600; color: #1f2937; }
    .customer-detail { font-size: 13px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: #1f2937; color: white; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
    thead th:last-child, thead th:nth-child(3) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    tbody td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .totals { display: flex; justify-content: flex-end; margin: 20px 0 30px; }
    .totals-box { width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals-row.total { border-top: 2px solid #1f2937; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">{{companyName}}</div>
      <div class="company-info">{{companyAddress}}<br>{{companyPhone}} &middot; {{companyEmail}}</div>
    </div>
    <div>
      <div class="doc-title">ORDER CONFIRMATION</div>
      <div class="doc-number">{{orderNumber}}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="section-label">Customer</div>
      <div class="customer-name">{{customerName}}</div>
    </div>
    <div>
      <div class="section-label">Order Details</div>
      <div class="customer-detail">Order Date: {{orderDate}}</div>
      <div class="customer-detail">Due Date: {{dueDate}}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{lineItems}}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>{{subtotal}}</span></div>
      <div class="totals-row"><span>Tax</span><span>{{tax}}</span></div>
      <div class="totals-row total"><span>TOTAL</span><span>{{total}}</span></div>
    </div>
  </div>

  <div class="footer">{{companyName}} &middot; {{companyAddress}} &middot; {{companyPhone}}</div>
</body>
</html>', now(), now())
ON CONFLICT (organization_id, template_type) DO NOTHING;
INSERT INTO document_templates (id, organization_id, template_type, body, created_at, updated_at)
VALUES ('a5798be4-bafc-4f89-9b43-700cc679f828', '00000000-0000-4000-a000-000000000001', 'work_order', '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Helvetica Neue'', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f2937; padding-bottom: 34px; margin-bottom: 28px; }
    .company-name { font-size: 22px; font-weight: bold; color: #1f2937; }
    .company-info { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-title { font-size: 28px; font-weight: bold; color: #1f2937; text-align: right; }
    .doc-number { font-size: 16px; font-weight: 600; color: #0f766e; text-align: right; margin-top: 4px; }
    .header-right { display: flex; align-items: flex-start; justify-content: flex-end; gap: 18px; width: 320px; }
    .header-copy { text-align: right; padding-top: 2px; width: 218px; flex: 0 0 218px; }
    .qr-box { width: 84px; text-align: center; flex-shrink: 0; }
    .qr-box img { width: 84px; height: 84px; display: block; border: 1px solid #e5e7eb; border-radius: 8px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 28px; }
    .section { margin-bottom: 24px; }
    .section-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .customer-name { font-size: 16px; font-weight: 600; color: #1f2937; }
    .customer-detail { font-size: 13px; color: #6b7280; }
    .details-box { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; }
    .details-box p { margin: 0 0 6px; font-size: 13px; color: #475569; }
    .details-box p:last-child { margin-bottom: 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: #1f2937; color: white; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
    tbody td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .item-title { font-weight: 600; color: #111827; }
    .item-meta { display: block; font-size: 11px; color: #9ca3af; margin-top: 4px; }
    .notes { border-top: 1px solid #e5e7eb; padding-top: 18px; margin-top: 28px; }
    .notes p { font-size: 12px; color: #6b7280; line-height: 1.6; white-space: pre-line; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">{{companyName}}</div>
      <div class="company-info">{{companyAddress}}<br>{{companyPhone}} &middot; {{companyEmail}}</div>
    </div>
    <div class="header-right">
      <div class="header-copy">
        <div class="doc-title">WORK ORDER</div>
        <div class="doc-number">{{orderNumber}}</div>
      </div>
      <div class="qr-box">
        <img src="{{qrCodeUrl}}" alt="Work order QR code" />
      </div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="section-label">Customer</div>
      <div class="customer-name">{{customerName}}</div>
      <div class="customer-detail">{{contactName}}</div>
    </div>
    <div>
      <div class="section-label">Production Details</div>
      <div class="details-box">
        <p><strong>Order Date:</strong> {{orderDate}}</p>
        <p><strong>Due Date:</strong> {{dueDate}}</p>
        <p><strong>Assigned CSR:</strong> {{csrName}}</p>
        <p><strong>Sales Rep:</strong> {{salesName}}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">Job Summary</div>
    <div class="details-box">
      <p><strong>Title:</strong> {{orderTitle}}</p>
      <p><strong>Description:</strong> {{orderDescription}}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Production Details</th>
        <th>Materials / Services / Finishing</th>
      </tr>
    </thead>
    <tbody>
      {{workOrderItems}}
    </tbody>
  </table>

  <div class="notes">
    <div class="section-label">Internal Notes</div>
    <p>{{internalNotes}}</p>
  </div>

  <div class="footer">{{companyName}} &middot; {{companyAddress}} &middot; {{companyPhone}}</div>
</body>
</html>', now(), now())
ON CONFLICT (organization_id, template_type) DO NOTHING;
INSERT INTO document_templates (id, organization_id, template_type, body, created_at, updated_at)
VALUES ('c0c5bfa6-57d0-4495-892c-35ec363124c2', '00000000-0000-4000-a000-000000000001', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Helvetica Neue'', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 22px; font-weight: bold; color: #1f2937; }
    .company-info { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-title { font-size: 28px; font-weight: bold; color: #1f2937; text-align: right; }
    .doc-number { font-size: 16px; font-weight: 600; color: #7c3aed; text-align: right; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .section-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .customer-name { font-size: 16px; font-weight: 600; color: #1f2937; }
    .customer-detail { font-size: 13px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: #1f2937; color: white; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
    thead th:last-child, thead th:nth-child(3) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    tbody td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .totals { display: flex; justify-content: flex-end; margin: 20px 0 30px; }
    .totals-box { width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals-row.total { border-top: 2px solid #1f2937; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; }
    .payment-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .payment-info p { font-size: 13px; color: #166534; margin: 0; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">{{companyName}}</div>
      <div class="company-info">{{companyAddress}}<br>{{companyPhone}} &middot; {{companyEmail}}</div>
    </div>
    <div>
      <div class="doc-title">INVOICE</div>
      <div class="doc-number">{{invoiceNumber}}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="section-label">Bill To</div>
      <div class="customer-name">{{customerName}}</div>
    </div>
    <div>
      <div class="section-label">Invoice Details</div>
      <div class="customer-detail">Invoice Date: {{invoiceDate}}</div>
      <div class="customer-detail">Due Date: {{dueDate}}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{lineItems}}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>{{subtotal}}</span></div>
      <div class="totals-row"><span>Tax</span><span>{{tax}}</span></div>
      <div class="totals-row total"><span>TOTAL DUE</span><span>{{total}}</span></div>
    </div>
  </div>

  <div class="payment-info">
    <p>Payment is due by {{dueDate}}. Please reference invoice {{invoiceNumber}} with your payment.</p>
  </div>

  <div class="footer">{{companyName}} &middot; {{companyAddress}} &middot; {{companyPhone}}</div>
</body>
</html>', now(), now())
ON CONFLICT (organization_id, template_type) DO NOTHING;
INSERT INTO document_templates (id, organization_id, template_type, body, created_at, updated_at)
VALUES ('48c0b796-7918-470e-8a3b-b9fe5f22eed6', '00000000-0000-4000-a000-000000000001', 'purchase_order', '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Helvetica Neue'', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 22px; font-weight: bold; color: #1f2937; }
    .company-info { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-title { font-size: 28px; font-weight: bold; color: #1f2937; text-align: right; }
    .doc-number { font-size: 16px; font-weight: 600; color: #d97706; text-align: right; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .section-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .vendor-name { font-size: 16px; font-weight: 600; color: #1f2937; }
    .vendor-detail { font-size: 13px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: #1f2937; color: white; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    tbody td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .totals { display: flex; justify-content: flex-end; margin: 20px 0 30px; }
    .totals-box { width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals-row.total { border-top: 2px solid #1f2937; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; }
    .notes { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; }
    .notes p { font-size: 11px; color: #9ca3af; line-height: 1.6; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">{{companyName}}</div>
      <div class="company-info">{{companyAddress}}<br>{{companyPhone}} &middot; {{companyEmail}}</div>
    </div>
    <div>
      <div class="doc-title">PURCHASE ORDER</div>
      <div class="doc-number">{{purchaseOrderNumber}}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="section-label">Vendor</div>
      <div class="vendor-name">{{vendorName}}</div>
      <div class="vendor-detail">{{vendorAddress}}</div>
      <div class="vendor-detail">{{vendorPhone}}</div>
      <div class="vendor-detail">{{vendorEmail}}</div>
    </div>
    <div>
      <div class="section-label">PO Details</div>
      <div class="vendor-detail">PO Date: {{purchaseOrderDate}}</div>
      <div class="vendor-detail">Expected Date: {{expectedDate}}</div>
      <div class="vendor-detail">Status: {{purchaseOrderStatus}}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Cost</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{lineItems}}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>{{subtotal}}</span></div>
      <div class="totals-row"><span>Tax</span><span>{{tax}}</span></div>
      <div class="totals-row total"><span>TOTAL</span><span>{{total}}</span></div>
    </div>
  </div>

  <div class="notes">
    <div class="section-label">Notes</div>
    <p>{{purchaseOrderNotes}}</p>
  </div>

  <div class="footer">{{companyName}} &middot; {{companyAddress}} &middot; {{companyPhone}}</div>
</body>
</html>', now(), now())
ON CONFLICT (organization_id, template_type) DO NOTHING;

-- ── 7. Customers ──────────────────────────────────────────────────────────
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '7be6efcb-b848-4697-856a-bc6ae6ce42b2', '00000000-0000-4000-a000-000000000001', 'C00001',
  'Pixels on Target LLC', NULL, 'talia@pixelsontarget.com', '305-614-0890 x.1011',
  '14050 NW 14th Street. Suite 170, Sunrise, FL 33323', 'Sunrise', 'FL', '14050', 'US',
  false, NULL, NULL,
  '{"vip","long-term"}'::text[], 'planprophet', NULL, NULL,
  155215.43, 96694.43,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '00000000-0000-4000-a000-000000000001', 'C00002',
  '4eon', NULL, 'sara.magliocca@4eon.net', '212-913-9596',
  '1900 NE Miami Court, Unit 209,  2nd floor, Miami, FL 33132', 'Miami', 'FL', '33132', 'US',
  false, NULL, NULL,
  '{"vip","long-term"}'::text[], 'planprophet', NULL, NULL,
  88180.85, 53701.85,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '58a41a31-befb-4de6-bd18-cd2cec352538', '00000000-0000-4000-a000-000000000001', 'C00003',
  'Leon Marketing', NULL, 'rorfrank.perez@leonmedicalcenters.com', '305-642-5366 xt2890',
  '8600 NW 41 Street, Miami, FL 33166', 'Miami', 'FL', '33166', 'US',
  false, NULL, NULL,
  '{"vip","long-term"}'::text[], 'planprophet', NULL, NULL,
  259973.03, 35081.25,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '3df43acc-22e3-4901-b7b0-fca4a74cf782', '00000000-0000-4000-a000-000000000001', 'C00004',
  'MP Integrative Marketing', NULL, 'mpintegrativemarketing@gmail.com', '305-502-3178',
  '8931 SW 182 Terrace, Miami, FL 33156', 'Miami', 'FL', '33156', 'US',
  false, NULL, NULL,
  '{"vip","long-term"}'::text[], 'planprophet', NULL, NULL,
  83526.8, 25372.54,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '5671fd58-f090-4098-a828-9bc3e213c9a4', '00000000-0000-4000-a000-000000000001', 'C00005',
  'Strategic Solutions Network', NULL, 'sandie@strategicsolutionsnet.com', '914-960-3030',
  '5550 Glades Road Suite 411, Boca Raton, FL 33431', 'Boca Raton', 'FL', '33431', 'US',
  false, NULL, NULL,
  '{"vip","long-term"}'::text[], 'planprophet', NULL, NULL,
  133793.57, 24285.37,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '75b71841-535c-476e-952a-b16b75988b1a', '00000000-0000-4000-a000-000000000001', 'C00006',
  'Worldwide Business Research Limited', NULL, 'amy.hemsley@wbr.co.uk', '44 (0)207 368 9530',
  '129 Wilton Road, London, London SW1V 1JZ UK', NULL, 'FL', NULL, 'US',
  false, NULL, NULL,
  '{"vip","long-term"}'::text[], 'planprophet', NULL, NULL,
  53175, 22225,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '9a8c6049-b485-413f-b772-973f097bdbd5', '00000000-0000-4000-a000-000000000001', 'C00007',
  'Spotdly Studio LLC', NULL, 'valentina@spotdly.com', NULL,
  '2000 S Dixie Hwy #110, Miami, FL 33133 USA', 'Miami', 'FL', '33133', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  15716, 15716,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '80761f54-3852-42d4-b1e0-49b359e0f612', '00000000-0000-4000-a000-000000000001', 'C00008',
  'Smile Performance LLC / EIN 372072426', NULL, 'mateo.pautasso@smilemkt.com', NULL,
  '4300 Biscayne Blvd, Suite 203, Miami, FL 33137', 'Miami', 'FL', '33137', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  11509.94, 11509.94,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '00934abe-2a9f-4e5c-8276-2b80428bcb4d', '00000000-0000-4000-a000-000000000001', 'C00009',
  'Nattkus Creative Studio', NULL, 'info@habitar91.com', NULL,
  '700 NW 57th Ct, Suite 6, Fort Lauderdale, FL 33309', 'Fort Lauderdale', 'FL', '33309', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  17532.2, 9889.8,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '771a8eb5-7a3d-439a-af98-ac56ea107c8d', '00000000-0000-4000-a000-000000000001', 'C00010',
  'GMS, LLC.', NULL, 'svanderbilt@gmscfl.com', '407-841-5524',
  '5385 N Nob Hill Road, Sunrise, FL 33351', 'Sunrise', 'FL', '33351', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  49319.09, 9246.42,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '36ccfc53-8f48-461d-9d33-b418ea6a3208', '00000000-0000-4000-a000-000000000001', 'C00011',
  'Ping Identity Corporation', NULL, 'luisguerrero@convisa.net', NULL,
  '1001 17th St, Ste 100, Denver, CO 80202-2069', 'Denver', 'CO', '80202', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  8315, 8315,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '52f019a9-5610-4c9b-849a-56ba66cc9a58', '00000000-0000-4000-a000-000000000001', 'C00012',
  'EducationDynamics', NULL, 'lmitchell@educationdynamics.com', '951.334.1813',
  NULL, NULL, 'FL', NULL, 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  7745, 7745,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'a66dc122-0b7d-49fc-b617-fa51f1bf5bcb', '00000000-0000-4000-a000-000000000001', 'C00013',
  'Worldwide Business Research', NULL, 'sara.lindemann@wbresearch.com', '646.200.7497',
  '535 Fifth Avenue, 8th Floor, New York, NY 10017', 'New York', 'NY', '10017', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  7650, 7650,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'e8ebaea2-9d12-427e-a8a4-66e6a06f65c1', '00000000-0000-4000-a000-000000000001', 'C00014',
  'University of Miami', NULL, 'nxo141@med.miami.edu', '786-973-0764',
  '1320 Dixie Hwy STE 150, Coral Gables, FL 33146-2911', 'Coral Gables', 'FL', '33146', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  7390, 7390,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '551c5bb6-5185-41ab-b0e8-537dc188df73', '00000000-0000-4000-a000-000000000001', 'C00015',
  'Oliva  Cigar  Co.', NULL, 'ylopez@olivacigar.com', '305-828-2261 xt 1022',
  '16500 NW 52 Ave, Miami Gardens, FL 33014', 'Miami Gardens', 'FL', '16500', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  6400, 6400,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '0a346f3c-a895-4639-851a-dd061a425091', '00000000-0000-4000-a000-000000000001', 'C00016',
  'Network Cargo', NULL, 'mia@networkcargo.com', '305-938-0620',
  'Edificio Televisa. Suite 308, 6355 NW 36th Street, Miam, FL 33166', 'Miam', 'FL', '33166', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  13293.5, 6146,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'a867d521-8cfd-4118-9c5f-898b5021cf81', '00000000-0000-4000-a000-000000000001', 'C00017',
  'Ellie''s Army Foundation', NULL, 'gimol@elliesarmy.org', '305-756-0068',
  '1200 Biscayne Blvd #407, North Miami, FL 33181', 'North Miami', 'FL', '33181', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  22230.34, 5884.24,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'dba46213-fb90-4947-be26-11eea742ad42', '00000000-0000-4000-a000-000000000001', 'C00018',
  'Aramark Uniform Services MC# 840', NULL, 'jason.floyd@vestis.com', '954.590.5160',
  '775 Tipton Industrial Drive Suite C, Lawrenceville, GA 30046', 'Lawrenceville', 'GA', '30046', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  15715, 5571,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '16d1601c-9546-4450-b8f5-abab00395d97', '00000000-0000-4000-a000-000000000001', 'C00019',
  'Poggesi USA', NULL, 'kiki.bermudez@poggesiusa.com', NULL,
  '16200 NW 59th Ave. Suite 101, Miami Lakes, FL 33014', 'Miami Lakes', 'FL', '16200', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  15527.5, 5537.5,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '8775168c-f6c4-4dc0-b74c-ea725c225c9d', '00000000-0000-4000-a000-000000000001', 'C00020',
  'BNP Paribas', NULL, 'carly.silverman@us.bnpparibas.com', '929.316.9864',
  '787 7th Avenue, New York, NY 10019', 'New York', 'NY', '10019', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  15730, 5250,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'c9c1afca-b628-4bf5-a8d4-e61e036400d3', '00000000-0000-4000-a000-000000000001', 'C00021',
  '305 Transportation', NULL, '305transp@gmail.com', '561-526-5477',
  'Miami Lakes, FL 33014', NULL, 'FL', '33014', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  4655, 4655,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '430a68e8-d747-4b0f-9be4-52e7b512aa22', '00000000-0000-4000-a000-000000000001', 'C00022',
  'Tufin', NULL, 'olivia.otoka@tufin.com', NULL,
  NULL, NULL, 'FL', NULL, 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  4535, 4535,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '96ef7602-5e26-4de3-affc-40b7d2cdecd5', '00000000-0000-4000-a000-000000000001', 'C00023',
  'Arpi Group', NULL, 'claudio.resnick@arpigroup.com', NULL,
  '8220 commerce way, Miami, FL 33016', 'Miami', 'FL', '33016', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  4450, 4450,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '32db0e6b-9aa9-4141-b5f4-fa41876a4dd0', '00000000-0000-4000-a000-000000000001', 'C00024',
  'The Adolphus, Autograph Collection', NULL, 'stucker@adolphus.com', '2146513621',
  '1321 Commerce St,, Dallas, TX 75202', 'Dallas', 'TX', '75202', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  4250, 4250,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '338f7281-5599-41ca-9e46-453060ce1111', '00000000-0000-4000-a000-000000000001', 'C00025',
  'Unleashed Consulting', NULL, 'ariel@unleashedconsulting.com', NULL,
  '20935 NE 30th place, Avebtura, FL 33180', 'Avebtura', 'FL', '20935', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  4010, 4010,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'c2b795a4-fb20-4f18-88fb-ad816c297e69', '00000000-0000-4000-a000-000000000001', 'C00026',
  'Gottliebs Quickway', NULL, 'quickway@gottlieb-stt.com', '340-774-1092',
  '3001 Contant Street, St Thomas, VI 00802', 'St Thomas', 'VI', '00802', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  17965.28, 3485,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'b4471466-d68e-49f2-bfbc-355b85721bf2', '00000000-0000-4000-a000-000000000001', 'C00027',
  'Savel, Inc.', NULL, 'andrea@savelinc.com', '212-473-2669',
  '4003 Ensenada Ave, Coconut Grove, FL 33133', 'Coconut Grove', 'FL', '33133', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  28031.89, 3476.22,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '6687d4fc-d0f8-4da3-8b3c-bfeaec8638b2', '00000000-0000-4000-a000-000000000001', 'C00028',
  'McGee Advertising', NULL, 'matt@mcgeeadv.com', '954.472.9999 x105',
  '8030 Peters Rd. Suite D100, Plantation, FL 33324', 'Plantation', 'FL', '33324', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  3310, 3310,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'fd678fec-980b-4def-87bb-60ff3b479323', '00000000-0000-4000-a000-000000000001', 'C00029',
  'Leon Health', NULL, 'roxana.londono@leonmedicalcenters.com', '305-646-3722',
  '8600 NW 41st Suite 210, Doral, FL 33166', 'Doral', 'FL', '33166', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  14950.48, 3259.74,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'c9c9205a-ff56-4690-870d-77bbf45cf793', '00000000-0000-4000-a000-000000000001', 'C00030',
  'Green Pepper Corp.', NULL, 'anakhernandez@green-pepper.net', NULL,
  '170 ocean lane drive, suite 410, Miami, FL 33149', 'Miami', 'FL', '33149', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  6576.87, 3187.5,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '3761d256-4e35-4a8e-8a71-19002e4faba9', '00000000-0000-4000-a000-000000000001', 'C00031',
  'The Playground, LLC', NULL, 'guillermina@the-playground.us', NULL,
  '5055 Collins Avenue. Apt 4J, Miami Beach, FL 33140', 'Miami Beach', 'FL', '33140', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  34880.75, 3074.9,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'e3481828-fe70-49be-ac0c-a3a2fbe86800', '00000000-0000-4000-a000-000000000001', 'C00032',
  'Maxicon', NULL, 'branding@maxiconusa.com', NULL,
  '19595 NE 10th Ave. Bay D, Miami, FL 33179', 'Miami', 'FL', '19595', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  3030, 3030,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '01a6d604-f94b-4c46-9ab8-539884ff99f0', '00000000-0000-4000-a000-000000000001', 'C00033',
  'Betterness', NULL, 'demian@betterness.ai', NULL,
  '698 NE 1st Avenue. 10th Floor, Miami, FL 33132', 'Miami', 'FL', '33132', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  3985, 2985,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '8b9362de-88f0-4a11-8b82-a31a696140c4', '00000000-0000-4000-a000-000000000001', 'C00034',
  'EndFlex', NULL, 'nalicea@endflex.com', '(305) 622-4070',
  '4760  N W  128  Street, Opalocka, FL 33054', 'Opalocka', 'FL', '33054', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  13669.5, 2875,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '023358d8-98ab-4328-816c-a56772f6eb8c', '00000000-0000-4000-a000-000000000001', 'C00035',
  'Cliff Pools', NULL, 'brendanh@cliffspools.com', '954-800-2748',
  '407 NE 44th Street (Prospect Road), Oakland Park, FL 33334', 'Oakland Park', 'FL', '33334', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  17444, 2785,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'b0560c12-ca38-452d-9b42-4d66e766da66', '00000000-0000-4000-a000-000000000001', 'C00036',
  'DASA', NULL, 'admin@dasa.us', '305-579-0092',
  '1498 NE 2nd Ave Suite 200, Miami, FL 33132', 'Miami', 'FL', '33132', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  11351, 2770,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'd9ef6103-cdeb-4cc2-896a-b8553ac0581c', '00000000-0000-4000-a000-000000000001', 'C00037',
  'The Graham Companies', NULL, 'brittanye@grahamresidential.com', '305-398-8002',
  '6843 Main Street, Miami Lakes, FL 33014', 'Miami Lakes', 'FL', '33014', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  2525, 2525,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'ba7f94d6-153a-448c-924c-5aa7cee75452', '00000000-0000-4000-a000-000000000001', 'C00038',
  'Moore Payroll Solutions', NULL, 'adam@moorepayrollsolutions.com', NULL,
  '5803 NW 151st Street Ste. #206, Miami Lakes, FL 33014', 'Miami Lakes', 'FL', '33014', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  2517.5, 2517.5,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'd89e99a9-6f32-4b81-af6d-40dedac8f1f8', '00000000-0000-4000-a000-000000000001', 'C00039',
  'Indigo Events', NULL, 'gmezrahi@indigoevents.net', '305.931.2370',
  '20200 W. Dixie Highway, Suite 604, Aventura, FL 33180', 'Aventura', 'FL', '20200', 'US',
  false, NULL, NULL,
  '{"long-term"}'::text[], 'planprophet', NULL, NULL,
  51061.99, 2500,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'bee10120-e290-43df-869b-8acc073a6a2c', '00000000-0000-4000-a000-000000000001', 'C00040',
  'Jason Hyde LLC', NULL, 'deborah@jasonhyde.com', NULL,
  '2980 NE 207 Street. Suite 708, Aventura, FL 33180', 'Aventura', 'FL', '33180', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  19037.49, 2372,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'ff76e58e-422e-488e-bf6c-3dbf3c95b5be', '00000000-0000-4000-a000-000000000001', 'C00041',
  'La Qua Brothers Burial Society', NULL, 'arrangements@laquabrothers.gd', '954-552-4583',
  'Cemetery Hill St. George''s,  Grenada', NULL, 'FL', NULL, 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  18048.5, 2342,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'fa2e5b64-fa33-470f-9f5f-9becf641162b', '00000000-0000-4000-a000-000000000001', 'C00042',
  'White Water Pool Guys', NULL, 'nathan.lostetter@gmail.com', '954-617-5061',
  '5251 SW 90th Ave, Cooper City, FL 33328', 'Cooper City', 'FL', '33328', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  3120, 2325,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '434ecdeb-6e21-44b5-b84d-e9e8b5845d65', '00000000-0000-4000-a000-000000000001', 'C00043',
  'Fan & Lighting World', NULL, 'fanlightingworld@bellsouth.net', '561-368-9337',
  '3537 W Boynton Beach Blvd., Boynton Beach, FL 33436', 'Boynton Beach', 'FL', '33436', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  12344.66, 2100,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'cb8bb3aa-0d6b-4729-8ef1-ccc650cee4c5', '00000000-0000-4000-a000-000000000001', 'C00044',
  'Bee Watch USA', NULL, 'ilechter@hotmail.com', '305-930-0909',
  '609 SW 4th ave apt#2, Ft Lauderdale, FL 33315', 'Ft Lauderdale', 'FL', '33315', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  2085.46, 2085.46,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '590ea43e-5b50-4471-8654-19c6e5cdbfee', '00000000-0000-4000-a000-000000000001', 'C00045',
  'Garland Food', NULL, 'rbenaim@garlandfood.net', '305-636-1607',
  '3330 NW 60th Street, Miami, FL 33142-2127', 'Miami', 'FL', '33142', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1964, 1964,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'd562e6ea-6e8b-495f-be6c-f7dc02dccd81', '00000000-0000-4000-a000-000000000001', 'C00046',
  'Emuna Construction', NULL, 'hgorin@emunaconstruction.com', NULL,
  '20808 W. Dixie Highway, North Miami Beach, FL 33180', 'North Miami Beach', 'FL', '20808', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  5597.5, 1960,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'ba12dcd7-808e-4d8f-bceb-19264dcad421', '00000000-0000-4000-a000-000000000001', 'C00047',
  'Cantey Tech Consulting', NULL, 'isredni@pciicp.com', NULL,
  '2450 Hollywood Blvd # 600, Hollywood, FL 33020', 'Hollywood', 'FL', '33020', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  7112.5, 1875,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '9ea37c39-f825-4c02-af89-8d8ec6884e96', '00000000-0000-4000-a000-000000000001', 'C00048',
  'El Otro Miami', NULL, 'alinmurray@gmail.com', NULL,
  '1569 Sandpiper Cir, Weston, FL 33327', 'Weston', 'FL', '33327', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1875, 1875,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '7fc3f127-b148-4a41-a9d9-f405eaee339d', '00000000-0000-4000-a000-000000000001', 'C00049',
  'OG''s Pizza Joint', NULL, 'ogspizzajoint@gmail.com', '305-726-1343',
  '10860 SW 104th St, Miami, FL 33176', 'Miami', 'FL', '10860', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1805, 1805,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '94d752e4-8792-4c75-88d4-b762ae56060a', '00000000-0000-4000-a000-000000000001', 'C00050',
  'Continental Air Conditioning, Inc.', NULL, 'continentalairco@aol.com', '305-887-4242',
  '6995 NW 82 AVE Bay 42, Miami, FL 33166', 'Miami', 'FL', '33166', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  11306.43, 1760,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '88311ed5-0f54-408b-a21e-83ee19f0ca2a', '00000000-0000-4000-a000-000000000001', 'C00051',
  'Sigma Event Production', NULL, 'lsosa@sigmaeventproduction.com', NULL,
  '340 West Flagler Street. unit 3210, Miami, FL 33130', 'Miami', 'FL', '33130', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  8952, 1757,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '8d46deb7-1657-45fd-aa9b-ac088bb76a6e', '00000000-0000-4000-a000-000000000001', 'C00052',
  'Pulse and Remedy', NULL, 'roxana@pulseandremedy.com', '305.699-6963',
  '925 W 41st Street, Suite 300, Miami Beach, FL 33140', 'Miami Beach', 'FL', '33140', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1650, 1650,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'b4a92859-2f70-4156-9a85-cc18b43c42ad', '00000000-0000-4000-a000-000000000001', 'C00053',
  'Donovan Williams', NULL, 'dwillsfl@aol.com', '305-360-0778',
  'Post Office Box 127, Providenciales Turks and Caicos Islands', NULL, 'FL', NULL, 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  17251.4, 1647.5,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '04004fc8-e88c-493c-8109-37c6575d1fe1', '00000000-0000-4000-a000-000000000001', 'C00054',
  'Adapt', NULL, 'monique@trainadapt.com', NULL,
  '14901 NE 20th Avenue, North Miami, FL 33181', 'North Miami', 'FL', '14901', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  5215.03, 1640,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'ccdc0e9b-dd7a-475b-9880-c630d83d60ab', '00000000-0000-4000-a000-000000000001', 'C00055',
  'Leon Advertising', NULL, 'rorfrank.perez@leonmedicalcenters.com', '305-642-5366 x2890',
  '8600 NW 41 Street, Miami, FL 33166', 'Miami', 'FL', '33166', 'US',
  false, NULL, NULL,
  '{"long-term"}'::text[], 'planprophet', NULL, NULL,
  896051.1, 1539,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '1b62e062-836a-4667-84d5-79bc59891093', '00000000-0000-4000-a000-000000000001', 'C00056',
  'McKinsey & Company', NULL, 'jessica_entrekin@external.mckinsey.com', NULL,
  '633 W Fifth St, US Bank Tower Fl. 69 & 70, Ste. 7000, Los Angeles, CA 90071', 'Los Angeles', 'US', '90071', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1530, 1530,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'df7054b8-a1da-4143-8eed-4b30f1c9db19', '00000000-0000-4000-a000-000000000001', 'C00057',
  'WeCanIt', NULL, 'shaila@wecanit.us', NULL,
  '57 NE 179th St, Miami, FL 33162', 'Miami', 'FL', '33162', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1500, 1500,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'd81fe12c-603f-4195-ada1-492e2b5e7561', '00000000-0000-4000-a000-000000000001', 'C00058',
  'Gunther Motor Company of Plantation', NULL, 'mikey@gunthermotors.com', '954-797-1660',
  '1660 S State Road 7, Ft. Lauderdale, FL 33317', 'Ft. Lauderdale', 'FL', '33317', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  11447.8, 1460,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '0c3e0de0-b311-4556-a8dc-95dd7605d3e2', '00000000-0000-4000-a000-000000000001', 'C00059',
  'Warner Bros. Discovery', NULL, 'sol.colom@wbd.com', '786-273-4418',
  '6505 Blue Lagoon Drive. Suite 300, Miami, FL 33126', 'Miami', 'FL', '33126', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  2926, 1415,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '5a2b9528-5b83-4e26-94e2-e162c501f600', '00000000-0000-4000-a000-000000000001', 'C00060',
  'Aima', NULL, 'kaldana@aima.org', '1 646 866 7140',
  'The Alternative Investment , Management Association 12 E 49th Street, Floor 11, New York, NY 10017', 'New York', 'NY', '10017', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  2505, 1375,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'da3d948f-1fc2-43a1-b6e8-da4f92c34369', '00000000-0000-4000-a000-000000000001', 'C00061',
  'DealFlow Events', NULL, 'morgan@dealflowevents.com', '516--876-8006 xt 31',
  '10 Roosevelt Ave, Roslyn, NY 11576', 'Roslyn', 'NY', '11576', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  3153, 1315,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '664cb9ec-84d7-4f2b-8d3a-ebe349b136ea', '00000000-0000-4000-a000-000000000001', 'C00062',
  'Empower IT Group', NULL, 'joe@empoweritgroup.com', NULL,
  '12570 NE 14th Avenue, North Miami Beach, FL 33161', 'North Miami Beach', 'FL', '12570', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1991, 1261,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '8a1e23e9-69ce-41f8-b64f-5f7f2431d562', '00000000-0000-4000-a000-000000000001', 'C00063',
  'H&C Retail Management LLC', NULL, 'marianella.mace@hiveandcolony.com', NULL,
  '17501 Biscayne Blvd. Suite 410, Aventura, FL 33160', 'Aventura', 'FL', '17501', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  2607, 1211,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '122bd2ee-00b5-4f93-9ff2-c42476e2ab23', '00000000-0000-4000-a000-000000000001', 'C00064',
  'Argus Media Incorporated', NULL, 'jaali.mayo@argusmedia.com', '1 281 716 2471',
  '2929 Allen Pkwy Ste 700, Houston, TX 77019', 'Houston', 'TX', '77019', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1185, 1185,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '3d1216bb-e4f2-4a27-a0dc-5f6f71258bd9', '00000000-0000-4000-a000-000000000001', 'C00065',
  'Leon Surgery Center at Dadeland LLC', NULL, 'rorfrank.perez@leonmedicalcenters.com', '305-642-5366 xt 2890',
  '9065 Dadeland Blvd, Miami, FL 33156', 'Miami', 'FL', '33156', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1175, 1175,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '2dc7ad50-8d7b-47de-8dac-7dcfdaafe340', '00000000-0000-4000-a000-000000000001', 'C00066',
  'MoSteel', NULL, 'mosteel5@aol.com', NULL,
  '353 NE 185th Street, Miami, FL 33179', 'Miami', 'FL', '33179', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  3670, 1160,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '46adbf2b-bc2a-441c-ae9c-b2b079f9df51', '00000000-0000-4000-a000-000000000001', 'C00067',
  'Sierra Commercial Construction Inc', NULL, 'jennymontero@sierracc.com', '305-557-2444',
  '2635 W 81st, Hialeah, FL 33016', 'Hialeah', 'FL', '33016', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  5425, 1130,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '27a69d73-bab1-400a-a0ee-b837f1ab6daa', '00000000-0000-4000-a000-000000000001', 'C00068',
  'Urbano Society', NULL, 'paola@urbanosociety.com', '305-360-6281',
  '511 NE 199th street, Miami, FL 33179', 'Miami', 'FL', '33179', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1110, 1110,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '54cfe85e-a700-4c94-a820-ee56504cf632', '00000000-0000-4000-a000-000000000001', 'C00069',
  'Innventa Group LLC', NULL, 'jonatan.benitez@grupoinnventa.com', NULL,
  '2035 North Miami aven. Unit 704, Wynwood Works, Miami, FL 33127', 'Miami', 'FL', '33127', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1095, 1095,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '57d56243-6b87-4d67-bc52-7f8a0d7da652', '00000000-0000-4000-a000-000000000001', 'C00070',
  'Insider Career Strategies', NULL, 'thepaqueen@gmail.com', NULL,
  'FL', NULL, 'FL', NULL, 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1040, 1040,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '124eb160-994e-4e75-8e14-23231681e7b6', '00000000-0000-4000-a000-000000000001', 'C00071',
  'Trane Supply - Pompano Beach', NULL, 'stefan.ellis@tranetechnologies.com', '954-405-7580',
  '2103 SW 3rd St, Pompano Beach, FL 33069', 'Pompano Beach', 'FL', '33069', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1022.5, 1022.5,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'b4ac86de-6e21-4061-ade0-46bad3b8f950', '00000000-0000-4000-a000-000000000001', 'C00072',
  'William Narajo Corp', NULL, 'hyperbaseshop@gmail.com', '754-779-9215',
  '7955 NW 12 Street Ste 200, Doral, FL 33126', 'Doral', 'FL', '33126', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  960, 960,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'b0349369-7c89-42b9-8e37-2d9f2b650402', '00000000-0000-4000-a000-000000000001', 'C00073',
  'Chen Moore', NULL, 'msahlberg@chenmoore.com', '561-537-4572 |',
  '500 West Cypress Creek Rd Suite 600, Fort Lauderdale, FL 33309', 'Fort Lauderdale', 'FL', '33309', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  2453, 935,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'a783a4f0-2adb-4f52-84c4-a00c4dee05ee', '00000000-0000-4000-a000-000000000001', 'C00074',
  'Mathai Mathew', NULL, 'mmathew@nhcmhc.org', '786-662-9545',
  '1469 NW36 st., Miami, FL 33142', 'Miami', 'FL', '33142', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  935, 935,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '5b27d42f-c348-4fb7-ac9f-da3827fb7ef3', '00000000-0000-4000-a000-000000000001', 'C00075',
  'MTD USA LLC', NULL, 'tom.pierce@mtd.net', NULL,
  '5101 Chatooga Drive, Lithonia, GA 30038', 'Lithonia', 'GA', '30038', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  928, 928,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '03faba39-88ec-43df-b6eb-6fbf303fc713', '00000000-0000-4000-a000-000000000001', 'C00076',
  'No Limit Rentals', NULL, 'nolimitrentals@gmail.com', '954-683-8354',
  '4967 Windward Way, Fort Lauderdale, FL 33312', 'Fort Lauderdale', 'FL', '33312', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  1745, 905,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'abc48702-bee6-467c-b0ae-f8440ad562d2', '00000000-0000-4000-a000-000000000001', 'C00077',
  'Newell Co.', NULL, 'jessica.longo@newellco.com', NULL,
  '8400 NW 36th Street, Suite 200, Miami, FL 33166', 'Miami', 'FL', '33166', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  900, 900,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  '1abb64df-c20d-4c37-a6f4-c3476121e405', '00000000-0000-4000-a000-000000000001', 'C00078',
  'Protocool', NULL, 'cpompilio@protocoolac.com', '954-776-2665',
  '1669 NW 144th Terrace #203, Sunrise, FL 33323', 'Sunrise', 'FL', '33323', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  6055, 890,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'c2a67a1f-f101-4ca8-93cc-75d804823848', '00000000-0000-4000-a000-000000000001', 'C00079',
  'A2B Destination Marketing', NULL, 'amanda@a2bmarketing.net', '954-626-8150',
  '6810 N STATE ROAD 7, COCONUT CREEK, FL 33013', 'COCONUT CREEK', 'FL', '33013', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  4380, 880,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);
INSERT INTO customers (
  id, organization_id, customer_number, name, company, email, phone,
  address, city, state, zip, country, tax_exempt, tax_id, notes,
  tags, source, external_id, website,
  sales_historically, sales_12m, account_number, terms, delivery_method,
  third_party_shipping, third_party_carrier_account,
  created_at, updated_at
) VALUES (
  'cfcdd242-0c8d-4aa5-9911-639a9fd33f1d', '00000000-0000-4000-a000-000000000001', 'C00080',
  'Miami Dancity Studio', NULL, 'alina@miamidancity.com', '305-821-2027',
  'Miami Lakes, FL 33014', NULL, 'FL', '33014', 'US',
  false, NULL, NULL,
  '{}'::text[], 'planprophet', NULL, NULL,
  10404.86, 860,
  NULL, NULL, NULL,
  false, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz
);

-- ── 8. Customer Shipping Addresses ────────────────────────────────────────
-- (Populated from customer.shippingAddresses[] if any exist)

-- ── 9. Contacts ───────────────────────────────────────────────────────────
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'cb05cfa3-d22a-4f56-a068-f243b158ee4a', '00000000-0000-4000-a000-000000000001', 'c9c1afca-b628-4bf5-a8d4-e61e036400d3',
  'Claudia', 'Gomez',
  '305transp@gmail.com', '561-526-5477', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '7a8e1e94-e14a-46d7-b00b-c187e5dfa84d', '00000000-0000-4000-a000-000000000001', 'c9c1afca-b628-4bf5-a8d4-e61e036400d3',
  'Alex', 'Malek',
  'alex@305transportation.com', '305-570-2222', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '699adea0-b0b6-48b8-9a8f-19331cdd44e2', '00000000-0000-4000-a000-000000000001', 'a9ff5e44-d0f6-422e-bee0-a320faea5ded',
  'Sara', 'Magliocca',
  'sara.magliocca@4eon.net', '212-913-9596', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '35626a32-93b7-4aeb-a2b5-ff3ec0fd9849', '00000000-0000-4000-a000-000000000001', 'a9ff5e44-d0f6-422e-bee0-a320faea5ded',
  'Allison', 'Janvier',
  'allison.janvier@4eon.net', NULL, NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '1bd6cebe-2f33-458b-8540-4f8a4a170173', '00000000-0000-4000-a000-000000000001', 'c2a67a1f-f101-4ca8-93cc-75d804823848',
  'Amanda', 'Brighton',
  'amanda@a2bmarketing.net', '954-626-8150', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '67643400-4a71-4fb8-b664-3d16acfbe134', '00000000-0000-4000-a000-000000000001', '04004fc8-e88c-493c-8109-37c6575d1fe1',
  'Monique', 'Tessier',
  'monique@trainadapt.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '10d8e739-3252-4138-93f5-a29af116f25d', '00000000-0000-4000-a000-000000000001', '5a2b9528-5b83-4e26-94e2-e162c501f600',
  'Khristel', 'Aldana',
  'kaldana@aima.org', '1 646 866 7140', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '526e206e-45bb-48c3-9e05-2244ccda2996', '00000000-0000-4000-a000-000000000001', 'dba46213-fb90-4947-be26-11eea742ad42',
  'Jason', 'Floyd',
  'jason.floyd@vestis.com', '954.590.5160', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '48696d9d-632a-404d-b5e8-1f862a5ac8d6', '00000000-0000-4000-a000-000000000001', '122bd2ee-00b5-4f93-9ff2-c42476e2ab23',
  'Jaali', 'Mayo',
  'jaali.mayo@argusmedia.com', '1 281 716 2471', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'f820b58d-899c-45cd-9227-97f9de556df3', '00000000-0000-4000-a000-000000000001', '96ef7602-5e26-4de3-affc-40b7d2cdecd5',
  'Claudio', 'Resnick',
  'claudio.resnick@arpigroup.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'd87ec62f-7884-4a1c-8546-4c2550bfa298', '00000000-0000-4000-a000-000000000001', 'cb8bb3aa-0d6b-4729-8ef1-ccc650cee4c5',
  'Ilan', 'Lechter',
  'ilechter@hotmail.com', '305-930-0909', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'c592ca84-cb56-4275-a80c-1a7ae7d7bb74', '00000000-0000-4000-a000-000000000001', '01a6d604-f94b-4c46-9ab8-539884ff99f0',
  'Demian', 'Bellumio',
  'demian@betterness.ai', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '5eb058fc-f98e-4d91-a187-877a41de70d3', '00000000-0000-4000-a000-000000000001', '8775168c-f6c4-4dc0-b74c-ea725c225c9d',
  'Carly', 'Silverman',
  'carly.silverman@us.bnpparibas.com', '929.316.9864', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '47aad75c-6379-4cd1-9e43-f60f1fafdcff', '00000000-0000-4000-a000-000000000001', 'ba12dcd7-808e-4d8f-bceb-19264dcad421',
  'Ilan', 'Sredni',
  'isredni@pciicp.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'f8ebae25-e8ee-4396-b8d3-d6eaad2a65d6', '00000000-0000-4000-a000-000000000001', 'b0349369-7c89-42b9-8e37-2d9f2b650402',
  'Michelle', 'Sahlberg',
  'msahlberg@chenmoore.com', '561-537-4572 |', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '8b516e80-e34c-43b4-a352-6deab1c562c1', '00000000-0000-4000-a000-000000000001', 'b0349369-7c89-42b9-8e37-2d9f2b650402',
  'Karen', 'Rachles',
  'krachles@chenmoore.com', '954-730-0707 x 1092', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '305798d0-ee5f-4a43-bd8d-ad9b899bbb0f', '00000000-0000-4000-a000-000000000001', '023358d8-98ab-4328-816c-a56772f6eb8c',
  'Brendan', 'Halpin',
  'brendanh@cliffspools.com', '954-800-2748', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'd075c315-1790-4415-9ce9-04cacad9bc91', '00000000-0000-4000-a000-000000000001', '94d752e4-8792-4c75-88d4-b762ae56060a',
  'Vicky', '-',
  'continentalairco@aol.com', '305-887-4242', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '4ddb5d69-a0dd-4b93-9db2-323b272f1b5d', '00000000-0000-4000-a000-000000000001', 'b0560c12-ca38-452d-9b42-4d66e766da66',
  'Cristina', 'Alicot',
  'admin@dasa.us', '305-579-0092', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'a8e8a6bc-6828-48b9-8e97-11bbeb480d32', '00000000-0000-4000-a000-000000000001', 'da3d948f-1fc2-43a1-b6e8-da4f92c34369',
  'Morgan', 'Cropsey',
  'morgan@dealflowevents.com', '516--876-8006 xt 31', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '83ec037e-16a6-4b31-9f6e-4a92e55cb9f9', '00000000-0000-4000-a000-000000000001', 'b4a92859-2f70-4156-9a85-cc18b43c42ad',
  'Donovan', 'Williams',
  'dwillsfl@aol.com', '305-360-0778', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'ca7a50e4-d026-452c-8538-cc6be20e9636', '00000000-0000-4000-a000-000000000001', '52f019a9-5610-4c9b-849a-56ba66cc9a58',
  'Lindsay', 'Mitchell',
  'lmitchell@educationdynamics.com', '951.334.1813', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '51312926-0c56-4a2e-9d0c-956e61e4141f', '00000000-0000-4000-a000-000000000001', 'a867d521-8cfd-4118-9c5f-898b5021cf81',
  'Gimol', 'Bentes',
  'gimol@elliesarmy.org', '305-756-0068', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'ec9be145-2839-49a6-8551-dba4040feabf', '00000000-0000-4000-a000-000000000001', '9ea37c39-f825-4c02-af89-8d8ec6884e96',
  'Alin', 'Murray',
  'alinmurray@gmail.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'b1a28b73-3f49-4d2e-8c10-a89f1793f9d9', '00000000-0000-4000-a000-000000000001', '9ea37c39-f825-4c02-af89-8d8ec6884e96',
  'Silvina', 'Pico',
  'info@elotromiami.com', NULL, NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '6833b2cb-6e8c-4f7a-b8c8-c1422707d653', '00000000-0000-4000-a000-000000000001', '664cb9ec-84d7-4f2b-8d3a-ebe349b136ea',
  'Joseph (Joe)', 'Steen',
  'joe@empoweritgroup.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '485a81f6-19fa-48ab-b9c4-b282bb47c67e', '00000000-0000-4000-a000-000000000001', 'd562e6ea-6e8b-495f-be6c-f7dc02dccd81',
  'Helga', 'Gorin',
  'hgorin@emunaconstruction.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '1f11919b-3db4-4736-a71b-a9d17d57f937', '00000000-0000-4000-a000-000000000001', '8b9362de-88f0-4a11-8b82-a31a696140c4',
  'Nelson', 'Alicea',
  'nalicea@endflex.com', '(305) 622-4070', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '4a9f8ae4-e563-4298-aafe-6ef6a8abb0cc', '00000000-0000-4000-a000-000000000001', '434ecdeb-6e21-44b5-b84d-e9e8b5845d65',
  'Bill', 'Aber',
  'fanlightingworld@bellsouth.net', '561-368-9337', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'c05bab24-1097-437e-9fcb-bd6a1bc15e25', '00000000-0000-4000-a000-000000000001', '590ea43e-5b50-4471-8654-19c6e5cdbfee',
  'Rocio', 'Benaim',
  'rbenaim@garlandfood.net', '305-636-1607', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '0e55c0d7-1fc3-4d78-bee0-c1a29bc674ae', '00000000-0000-4000-a000-000000000001', '590ea43e-5b50-4471-8654-19c6e5cdbfee',
  'Alejandro', 'Trabattoni',
  'atrabattoni@garlandfood.net', '305.636.1607', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '5e0c1122-0446-4abd-8639-bf1a630472a9', '00000000-0000-4000-a000-000000000001', '771a8eb5-7a3d-439a-af98-ac56ea107c8d',
  'Stacie', 'Vanderbilt',
  'svanderbilt@gmscfl.com', '407-841-5524', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '2529f660-7cd3-4741-8627-d251dbf2d745', '00000000-0000-4000-a000-000000000001', 'c2b795a4-fb20-4f18-88fb-ad816c297e69',
  'MeKisha / Mickey', 'Gottlieb',
  'quickway@gottlieb-stt.com', '340-774-1092', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'fd0b0fd0-bb82-4094-8aee-1b32473075a2', '00000000-0000-4000-a000-000000000001', 'c9c9205a-ff56-4690-870d-77bbf45cf793',
  'Anakarina', 'Hernandez',
  'anakhernandez@green-pepper.net', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '68a3429f-4365-45ce-83cd-27d12da25b19', '00000000-0000-4000-a000-000000000001', 'c9c9205a-ff56-4690-870d-77bbf45cf793',
  'Elena', 'Lopez',
  'elenalopez@green-pepper.net', NULL, NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '94a6a9dc-de4a-4ce2-b97f-d6526e4b5ed7', '00000000-0000-4000-a000-000000000001', 'd81fe12c-603f-4195-ada1-492e2b5e7561',
  'Mike', 'Yonak',
  'mikey@gunthermotors.com', '954-797-1660', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '1057428f-d042-4198-9725-8923048f6d3a', '00000000-0000-4000-a000-000000000001', 'd81fe12c-603f-4195-ada1-492e2b5e7561',
  'Alex', 'Barbosa',
  'alexisb@gunthermotors.com', '201-359-4562', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '0cd3faa0-69a4-4fe1-8153-ad5bdf3b7912', '00000000-0000-4000-a000-000000000001', '8a1e23e9-69ce-41f8-b64f-5f7f2431d562',
  'Marianella', 'Mace',
  'marianella.mace@hiveandcolony.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '876d7927-5916-47e2-a80f-5ad46346f3e5', '00000000-0000-4000-a000-000000000001', 'd89e99a9-6f32-4b81-af6d-40dedac8f1f8',
  'Gladys', 'Mezrahi',
  'gmezrahi@indigoevents.net', '305.931.2370', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'ee646016-33d0-482a-a005-27b7d5d7c651', '00000000-0000-4000-a000-000000000001', '54cfe85e-a700-4c94-a820-ee56504cf632',
  'Jonatan', 'Benitez',
  'jonatan.benitez@grupoinnventa.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '5b6993a6-3cd7-45e4-98ca-3eaeecfbcd46', '00000000-0000-4000-a000-000000000001', '57d56243-6b87-4d67-bc52-7f8a0d7da652',
  'Katy', 'Lever',
  'thepaqueen@gmail.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '28273909-f4fb-4510-9c1a-b86ff70303d6', '00000000-0000-4000-a000-000000000001', 'bee10120-e290-43df-869b-8acc073a6a2c',
  'Deborah', 'Bensadon Singer',
  'deborah@jasonhyde.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '10d7c374-fc26-4dc7-96fb-0be9bc100beb', '00000000-0000-4000-a000-000000000001', 'bee10120-e290-43df-869b-8acc073a6a2c',
  'Myriam', 'Bensadon',
  'myriam@jasonhyde.com', NULL, NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '8814cd57-59a5-4e73-8eb1-f3ddbd55b462', '00000000-0000-4000-a000-000000000001', 'ff76e58e-422e-488e-bf6c-3dbf3c95b5be',
  'Thomas', 'LaQua',
  'arrangements@laquabrothers.gd', '954-552-4583', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '959c9da3-7d4d-4bdb-a8ed-51f183f7f486', '00000000-0000-4000-a000-000000000001', 'ccdc0e9b-dd7a-475b-9880-c630d83d60ab',
  'Rorfrank', 'Perez',
  'rorfrank.perez@leonmedicalcenters.com', '305-642-5366 x2890', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'c5c249dc-2db9-4059-8a5a-ce4f781f7d46', '00000000-0000-4000-a000-000000000001', 'fd678fec-980b-4def-87bb-60ff3b479323',
  'Roxana', 'Londono',
  'roxana.londono@leonmedicalcenters.com', '305-646-3722', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '9dc5f60e-d420-48a1-9ebe-875e0488b437', '00000000-0000-4000-a000-000000000001', 'fd678fec-980b-4def-87bb-60ff3b479323',
  'Leon Health', '-',
  'scarlet.martinez@leonhealth.com', '786-405-4076', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'be9ddf07-6d08-4efe-a6f7-f8de83c28809', '00000000-0000-4000-a000-000000000001', '58a41a31-befb-4de6-bd18-cd2cec352538',
  'Rorfrank', 'Perez',
  'rorfrank.perez@leonmedicalcenters.com', '305-642-5366 xt2890', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '9f647955-62c6-43aa-a99d-11c8d3355f1f', '00000000-0000-4000-a000-000000000001', '3d1216bb-e4f2-4a27-a0dc-5f6f71258bd9',
  'Rorfrank', 'Perez',
  'rorfrank.perez@leonmedicalcenters.com', '305-642-5366 xt 2890', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '1ae56cd7-e849-4bd3-bdff-83b07bbbf53d', '00000000-0000-4000-a000-000000000001', 'a783a4f0-2adb-4f52-84c4-a00c4dee05ee',
  'Mathai', 'Mathew',
  'mmathew@nhcmhc.org', '786-662-9545', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '7ffaa41c-ffd6-4cce-8dd4-51007c2af4e8', '00000000-0000-4000-a000-000000000001', 'e3481828-fe70-49be-ac0c-a3a2fbe86800',
  'Jessica', 'Persyko',
  'branding@maxiconusa.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'df024787-15f7-4185-9501-046d1931611d', '00000000-0000-4000-a000-000000000001', 'e3481828-fe70-49be-ac0c-a3a2fbe86800',
  'Jessica', 'Persyko',
  'payables@maxiconusa.com', NULL, NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '962c6c98-6294-4286-9576-0c2e6288007b', '00000000-0000-4000-a000-000000000001', '6687d4fc-d0f8-4da3-8b3c-bfeaec8638b2',
  'Matthew', 'Grodzitsky',
  'matt@mcgeeadv.com', '954.472.9999 x105', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '707583af-5ec0-4cf5-a1b0-3d98418213b6', '00000000-0000-4000-a000-000000000001', '1b62e062-836a-4667-84d5-79bc59891093',
  'Jessica', 'Entrekin',
  'jessica_entrekin@external.mckinsey.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'bcb36ed3-f994-4b7c-ae07-aaa79c93e71c', '00000000-0000-4000-a000-000000000001', 'cfcdd242-0c8d-4aa5-9911-639a9fd33f1d',
  'Alina', '-',
  'alina@miamidancity.com', '305-821-2027', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'f37b4333-c3aa-4993-a348-9d664ec101e4', '00000000-0000-4000-a000-000000000001', 'ba7f94d6-153a-448c-924c-5aa7cee75452',
  'Adam', 'Moore',
  'adam@moorepayrollsolutions.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '2ca6cdb2-5378-4e13-80ed-a14b98069333', '00000000-0000-4000-a000-000000000001', '2dc7ad50-8d7b-47de-8dac-7dcfdaafe340',
  'Maurice', 'Sutton',
  'mosteel5@aol.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '89f67071-4e26-43c3-b107-6f5c472e22cd', '00000000-0000-4000-a000-000000000001', '2dc7ad50-8d7b-47de-8dac-7dcfdaafe340',
  'Myriam', 'Finkelman',
  NULL, NULL, NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'd886a2c9-912d-477e-9c14-02d821d64682', '00000000-0000-4000-a000-000000000001', '3df43acc-22e3-4901-b7b0-fca4a74cf782',
  'Manny', 'Pose',
  'mpintegrativemarketing@gmail.com', '305-502-3178', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '3e460d83-e7ae-4f95-bb99-7d77c9c52ad3', '00000000-0000-4000-a000-000000000001', '5b27d42f-c348-4fb7-ac9f-da3827fb7ef3',
  'Tom', 'Pierce',
  'tom.pierce@mtd.net', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '9d710c73-280e-46b3-b93f-26921f4acbae', '00000000-0000-4000-a000-000000000001', '00934abe-2a9f-4e5c-8276-2b80428bcb4d',
  'Mauricio', 'Bastidas',
  'info@habitar91.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '9e2ed4ac-2900-44cb-90b6-08d63c642945', '00000000-0000-4000-a000-000000000001', '0a346f3c-a895-4639-851a-dd061a425091',
  'Cristabel', 'Hernandez',
  'mia@networkcargo.com', '305-938-0620', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '9f12a7a5-ad6b-4828-a8ee-e25b3672bbaf', '00000000-0000-4000-a000-000000000001', '0a346f3c-a895-4639-851a-dd061a425091',
  'Luke', 'Baker',
  'luke.baker@network-airline.com', NULL, NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'c89c5efb-cebc-4f52-bea4-49784d7eb911', '00000000-0000-4000-a000-000000000001', 'abc48702-bee6-467c-b0ae-f8440ad562d2',
  'Jessica', 'Longo',
  'jessica.longo@newellco.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '8a26c0b8-0851-4918-857b-f0e9587f8d01', '00000000-0000-4000-a000-000000000001', '03faba39-88ec-43df-b6eb-6fbf303fc713',
  'Samantha', 'Malcolm',
  'nolimitrentals@gmail.com', '954-683-8354', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'a409cf11-b6a4-4584-b06c-36e2e25d7b92', '00000000-0000-4000-a000-000000000001', '7fc3f127-b148-4a41-a9d9-f405eaee339d',
  'Lizette', 'Garcia',
  'ogspizzajoint@gmail.com', '305-726-1343', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '2034cb8a-bef9-47d1-b4f6-4c6da2a11116', '00000000-0000-4000-a000-000000000001', '551c5bb6-5185-41ab-b0e8-537dc188df73',
  'Yanexis', 'Lopez',
  'ylopez@olivacigar.com', '305-828-2261 xt 1022', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'be41b03c-0616-4372-9f54-e4c31df43293', '00000000-0000-4000-a000-000000000001', '36ccfc53-8f48-461d-9d33-b418ea6a3208',
  'Valentina', 'Larranaga',
  'luisguerrero@convisa.net', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'c45ca99c-b83b-4724-a7cd-0c95ec2ba082', '00000000-0000-4000-a000-000000000001', '7be6efcb-b848-4697-856a-bc6ae6ce42b2',
  'Talia', 'Mervosh',
  'talia@pixelsontarget.com', '305-614-0890 x.1011', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '5cc82332-cf14-41e3-9c60-3dfd60c55186', '00000000-0000-4000-a000-000000000001', '16d1601c-9546-4450-b8f5-abab00395d97',
  'Karla', 'Bermudez',
  'kiki.bermudez@poggesiusa.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '25760b2d-b10b-480b-839a-6df0ae37149e', '00000000-0000-4000-a000-000000000001', '1abb64df-c20d-4c37-a6f4-c3476121e405',
  'Chris', 'Pompilio',
  'cpompilio@protocoolac.com', '954-776-2665', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '4036de0b-2497-41ab-8222-c1ba64efe3dc', '00000000-0000-4000-a000-000000000001', '8d46deb7-1657-45fd-aa9b-ac088bb76a6e',
  'Roxana', 'Gonzalez',
  'roxana@pulseandremedy.com', '305.699-6963', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '0f3d69e0-fb63-409c-9493-41d3f5ca35e1', '00000000-0000-4000-a000-000000000001', 'b4471466-d68e-49f2-bfbc-355b85721bf2',
  'Andrea', 'Elish',
  'andrea@savelinc.com', '212-473-2669', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'ebadf65a-8b2d-4c1e-80fd-f5949d2aee7a', '00000000-0000-4000-a000-000000000001', '46adbf2b-bc2a-441c-ae9c-b2b079f9df51',
  'Jennifer', 'Montero',
  'jennymontero@sierracc.com', '305-557-2444', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '9e034169-87be-4f5a-a478-c5e4d1aaa856', '00000000-0000-4000-a000-000000000001', '88311ed5-0f54-408b-a21e-83ee19f0ca2a',
  'Luis', 'Sosa',
  'lsosa@sigmaeventproduction.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '2dd7b8e9-b5e2-47dc-b4c5-387c25a14101', '00000000-0000-4000-a000-000000000001', '80761f54-3852-42d4-b1e0-49b359e0f612',
  'Mateo', 'Pautasso',
  'mateo.pautasso@smilemkt.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '9185b757-f01b-4b33-b53f-5f5be10b0d1c', '00000000-0000-4000-a000-000000000001', '80761f54-3852-42d4-b1e0-49b359e0f612',
  'Defina', 'Mateo',
  'delfina.mateo@smilemkt.com', '+54.11.30185.3755', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'b245b94f-ebf7-44a0-bb77-10c60967cf4e', '00000000-0000-4000-a000-000000000001', '9a8c6049-b485-413f-b772-973f097bdbd5',
  'Valentina', 'Jimenez',
  'valentina@spotdly.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '3d7cb049-3efd-489d-a497-b375dfb8b0bb', '00000000-0000-4000-a000-000000000001', '5671fd58-f090-4098-a828-9bc3e213c9a4',
  'Sandie', 'Pagano',
  'sandie@strategicsolutionsnet.com', '914-960-3030', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '4fa2a4ad-12a0-4493-bbce-a77180455c05', '00000000-0000-4000-a000-000000000001', '32db0e6b-9aa9-4141-b5f4-fa41876a4dd0',
  'Sam', 'Tucker',
  'stucker@adolphus.com', '2146513621', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '90358877-865f-4c87-9360-b0afce4704cb', '00000000-0000-4000-a000-000000000001', '32db0e6b-9aa9-4141-b5f4-fa41876a4dd0',
  'Danny', 'Estevez',
  'destevez@adolphus.com', '2147428200', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '139237f2-f01c-4ccb-b3b4-a9ca8da1c348', '00000000-0000-4000-a000-000000000001', 'd9ef6103-cdeb-4cc2-896a-b8553ac0581c',
  'Brittany', 'Ebb',
  'brittanye@grahamresidential.com', '305-398-8002', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'aec04744-9434-451b-9e8b-ccb7b89b99a9', '00000000-0000-4000-a000-000000000001', 'd9ef6103-cdeb-4cc2-896a-b8553ac0581c',
  'Katie', 'Martinez',
  'katiem@grahamcos.com', '305-817-4102', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '8dec7e07-e595-40e1-bae5-e9b29b1a4442', '00000000-0000-4000-a000-000000000001', '3761d256-4e35-4a8e-8a71-19002e4faba9',
  'Guillermina', 'Fanelli',
  'guillermina@the-playground.us', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'd0f7168a-dadf-436f-a0af-6a9344bceba1', '00000000-0000-4000-a000-000000000001', '124eb160-994e-4e75-8e14-23231681e7b6',
  'Stefan', 'Ellis',
  'stefan.ellis@tranetechnologies.com', '954-405-7580', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'bb5512a7-0e00-4963-8171-10acf6c908a3', '00000000-0000-4000-a000-000000000001', '430a68e8-d747-4b0f-9be4-52e7b512aa22',
  'Olivia', 'Otoka',
  'olivia.otoka@tufin.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '5453146e-45ac-4a12-b531-0e32e9ca7ac0', '00000000-0000-4000-a000-000000000001', 'e8ebaea2-9d12-427e-a8a4-66e6a06f65c1',
  'Natalia', 'Cancilla',
  'nxo141@med.miami.edu', '786-973-0764', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '82846852-2bbc-4c0f-8309-4bf0af073c1f', '00000000-0000-4000-a000-000000000001', '338f7281-5599-41ca-9e46-453060ce1111',
  'Ariel', 'Bacal',
  'ariel@unleashedconsulting.com', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '798af3c5-1d38-46e2-958c-2005e3081aa7', '00000000-0000-4000-a000-000000000001', '27a69d73-bab1-400a-a0ee-b837f1ab6daa',
  'Paola', 'Urbano',
  'paola@urbanosociety.com', '305-360-6281', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'd27cce41-9063-4663-a09b-e3e6186b622b', '00000000-0000-4000-a000-000000000001', '0c3e0de0-b311-4556-a8dc-95dd7605d3e2',
  'Sol', 'Colom',
  'sol.colom@wbd.com', '786-273-4418', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'dd73a7f3-a083-4cb1-bc41-4fed3e33e22a', '00000000-0000-4000-a000-000000000001', '0c3e0de0-b311-4556-a8dc-95dd7605d3e2',
  'Juan Carlos', 'Gomez',
  'juan.carlos.gomez@wbd.com', '786-521-3034', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '721af530-d61b-44fe-817d-110b2abac68f', '00000000-0000-4000-a000-000000000001', '0c3e0de0-b311-4556-a8dc-95dd7605d3e2',
  'Amber', 'Stamp',
  'amber.stamp@wbd.com', '818.954.5763', NULL, NULL,
  false, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'bb814ddf-a1bb-4158-a849-3da25f94266f', '00000000-0000-4000-a000-000000000001', 'df7054b8-a1da-4143-8eed-4b30f1c9db19',
  'Shaila', 'Valera',
  'shaila@wecanit.us', NULL, NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'e709b9e1-b0a3-4fcd-a02b-3bfb108fd30c', '00000000-0000-4000-a000-000000000001', 'fa2e5b64-fa33-470f-9f5f-9becf641162b',
  'Nathan', 'Lostetter',
  'nathan.lostetter@gmail.com', '954-617-5061', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  'd3a38ee6-f67d-4958-a54d-9d56caabee4b', '00000000-0000-4000-a000-000000000001', 'b4ac86de-6e21-4061-ade0-46bad3b8f950',
  'Lorena', 'Naranjo',
  'hyperbaseshop@gmail.com', '754-779-9215', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '755beff3-e4f6-4b1e-9839-cf4c55d2a187', '00000000-0000-4000-a000-000000000001', 'a66dc122-0b7d-49fc-b617-fa51f1bf5bcb',
  'Sara', 'Lindemann',
  'sara.lindemann@wbresearch.com', '646.200.7497', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO contacts (
  id, organization_id, customer_id, first_name, last_name,
  email, phone, mobile, title, is_primary, notes, external_id,
  created_at, updated_at
) VALUES (
  '582a0b8b-ad15-4c4d-8289-24a4d55be6ce', '00000000-0000-4000-a000-000000000001', '75b71841-535c-476e-952a-b16b75988b1a',
  'Amy', 'Hemsley',
  'amy.hemsley@wbr.co.uk', '44 (0)207 368 9530', NULL, NULL,
  true, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 10. Vendors ───────────────────────────────────────────────────────────
INSERT INTO vendors (
  id, organization_id, name, email, phone, website,
  address, city, state, zip, account_number, payment_terms,
  notes, tags, is_outsourced_production, created_at, updated_at
) VALUES (
  'e214529d-79e5-4a28-b5e2-e48fe43adad3', '00000000-0000-4000-a000-000000000001',
  'Grimco Inc', 'orders@grimco.com', '800-542-9941', 'grimco.com',
  NULL, NULL, NULL, NULL,
  NULL, 'Net 30',
  NULL, '{}'::text[], false,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO vendors (
  id, organization_id, name, email, phone, website,
  address, city, state, zip, account_number, payment_terms,
  notes, tags, is_outsourced_production, created_at, updated_at
) VALUES (
  '95d66d68-1006-4764-b372-9a3d0db8a236', '00000000-0000-4000-a000-000000000001',
  'S&S Activewear', 'wholesale@ssactivewear.com', '800-523-2155', 'ssactivewear.com',
  NULL, NULL, NULL, NULL,
  NULL, 'Net 30',
  NULL, '{}'::text[], false,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO vendors (
  id, organization_id, name, email, phone, website,
  address, city, state, zip, account_number, payment_terms,
  notes, tags, is_outsourced_production, created_at, updated_at
) VALUES (
  'f920c672-eeec-4035-b1cd-bbf1e6fe39f0', '00000000-0000-4000-a000-000000000001',
  'Trade Signs USA', 'orders@tradesigns.com', '866-763-8588', NULL,
  NULL, NULL, NULL, NULL,
  NULL, 'Net 15',
  NULL, '{}'::text[], true,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO vendors (
  id, organization_id, name, email, phone, website,
  address, city, state, zip, account_number, payment_terms,
  notes, tags, is_outsourced_production, created_at, updated_at
) VALUES (
  '6fee316c-2b60-4f5a-8114-fd74bf517e0e', '00000000-0000-4000-a000-000000000001',
  'Minuteman Press', 'wholesale@minuteman.com', '800-645-3006', NULL,
  NULL, NULL, NULL, NULL,
  NULL, 'Prepaid',
  NULL, '{}'::text[], true,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO vendors (
  id, organization_id, name, email, phone, website,
  address, city, state, zip, account_number, payment_terms,
  notes, tags, is_outsourced_production, created_at, updated_at
) VALUES (
  'c50f2b26-ead9-458b-b7ea-e02077e51352', '00000000-0000-4000-a000-000000000001',
  'Mac Papers', 'orders@macpapers.com', '800-622-7267', NULL,
  NULL, NULL, NULL, NULL,
  NULL, 'Net 30',
  NULL, '{}'::text[], false,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 11. Workflows ─────────────────────────────────────────────────────────
INSERT INTO workflows (
  id, organization_id, name, description, is_active, is_default,
  product_families, created_at, updated_at
) VALUES (
  '09cda956-188d-47a8-993d-35def9970ee4', '00000000-0000-4000-a000-000000000001',
  'Standard Print Workflow', 'Core production flow for digital and offset print jobs from intake through completion.', true, true,
  '{"digital_print","offset_print"}'::text[],
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO workflows (
  id, organization_id, name, description, is_active, is_default,
  product_families, created_at, updated_at
) VALUES (
  'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee', '00000000-0000-4000-a000-000000000001',
  'Sign & Wide Format', 'Handles wide format, rigid signage, and install-ready graphics with proofing and finishing stages.', true, false,
  '{"wide_format","rigid_sign","roll_sign"}'::text[],
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO workflows (
  id, organization_id, name, description, is_active, is_default,
  product_families, created_at, updated_at
) VALUES (
  'ea14aa41-92e1-4494-931c-fff8896a32e6', '00000000-0000-4000-a000-000000000001',
  'Vendor / Outsourced', 'Tracks externally produced jobs from vendor handoff through receipt and QC.', true, false,
  '{"outsourced","buyout"}'::text[],
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 12. Workflow Stages ────────────────────────────────────────────────────
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '4165b0d7-bac0-4a1b-9255-bac9c8476ea5', '00000000-0000-4000-a000-000000000001', '09cda956-188d-47a8-993d-35def9970ee4',
  'Order Received', 1, '#6366f1', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '14e0a228-54ec-4f17-a6c1-fb42da172dfa', '00000000-0000-4000-a000-000000000001', '09cda956-188d-47a8-993d-35def9970ee4',
  'Prepress / Art', 2, '#f59e0b', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '762e6792-5c82-4695-892c-4ce0772d5d71', '00000000-0000-4000-a000-000000000001', '09cda956-188d-47a8-993d-35def9970ee4',
  'Printing', 3, '#3b82f6', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  'bdc9b4bc-dacf-41f4-a9f2-92f6dc9cdf54', '00000000-0000-4000-a000-000000000001', '09cda956-188d-47a8-993d-35def9970ee4',
  'Finishing', 4, '#8b5cf6', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '53701124-f0cb-43ee-bf95-a0f9a780dd18', '00000000-0000-4000-a000-000000000001', '09cda956-188d-47a8-993d-35def9970ee4',
  'Ready for Pickup', 5, '#10b981', true,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '673164ff-e16a-4951-9001-73a0979fbe7a', '00000000-0000-4000-a000-000000000001', '09cda956-188d-47a8-993d-35def9970ee4',
  'Completed', 6, '#6b7280', true,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  'dec70c80-9cfe-4244-88fb-7f0473367989', '00000000-0000-4000-a000-000000000001', 'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee',
  'Order Received', 1, '#6366f1', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '9831c6d8-7316-40e3-baa7-10d0debbcdec', '00000000-0000-4000-a000-000000000001', 'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee',
  'Art / Proof', 2, '#f59e0b', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '55596d00-661a-412b-b2e2-5a09ae88e5e1', '00000000-0000-4000-a000-000000000001', 'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee',
  'Printing', 3, '#3b82f6', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  'ded74ec7-7ca0-4b5d-956d-7f6f994e495c', '00000000-0000-4000-a000-000000000001', 'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee',
  'Laminating', 4, '#ec4899', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  'd0afcb3f-53b1-42d7-8841-3848c3890989', '00000000-0000-4000-a000-000000000001', 'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee',
  'Cutting / Routing', 5, '#8b5cf6', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '99673479-40c6-4119-9a55-620cf1c98d71', '00000000-0000-4000-a000-000000000001', 'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee',
  'Installation', 6, '#f97316', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  'dc43ff64-5860-4d56-9c61-b5e058473526', '00000000-0000-4000-a000-000000000001', 'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee',
  'Completed', 7, '#6b7280', true,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '89e9a715-708b-4a1b-b351-afe2a90eee5d', '00000000-0000-4000-a000-000000000001', 'ea14aa41-92e1-4494-931c-fff8896a32e6',
  'PO Sent', 1, '#6366f1', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '674798ed-931b-4ad5-9e62-8419513c8e31', '00000000-0000-4000-a000-000000000001', 'ea14aa41-92e1-4494-931c-fff8896a32e6',
  'In Production (Vendor)', 2, '#f59e0b', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  'e6f28e04-768b-4548-99f7-60411e236324', '00000000-0000-4000-a000-000000000001', 'ea14aa41-92e1-4494-931c-fff8896a32e6',
  'Received', 3, '#3b82f6', false,
  NULL,
  now(), now()
);
INSERT INTO workflow_stages (
  id, organization_id, workflow_id, name, sort_order, color, is_complete,
  default_assignee_id, created_at, updated_at
) VALUES (
  '4142e601-12ea-485c-9afa-234a9302a1f2', '00000000-0000-4000-a000-000000000001', 'ea14aa41-92e1-4494-931c-fff8896a32e6',
  'QC / Fulfilled', 4, '#10b981', true,
  NULL,
  now(), now()
);

-- ── 13. Tracking Devices ──────────────────────────────────────────────────
INSERT INTO tracking_devices (
  id, organization_id, name, code, description, workflow_id, stage_id,
  is_active, created_at, updated_at
) VALUES (
  '57421830-686f-40a6-80ec-f7e36c60c149', '00000000-0000-4000-a000-000000000001',
  'R9200S iPhone', 'R9200S-IPHONE', 'Shared scanner profile for the R9200S station iPhone.',
  '09cda956-188d-47a8-993d-35def9970ee4', '762e6792-5c82-4695-892c-4ce0772d5d71',
  true, '2026-04-01T00:00:00.000Z'::timestamptz, now()
) ON CONFLICT (organization_id, code) DO NOTHING;

-- ── 14. Pricing Categories ────────────────────────────────────────────────
INSERT INTO pricing_categories (
  id, organization_id, name, description, sort_order, created_at, updated_at
) VALUES (
  '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', '00000000-0000-4000-a000-000000000001',
  'Digital Press', 'Digital printing products — business cards, postcards, brochures, etc.', 1,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_categories (
  id, organization_id, name, description, sort_order, created_at, updated_at
) VALUES (
  '9fc1c20f-0ebd-4fec-98e8-5797fed53934', '00000000-0000-4000-a000-000000000001',
  'Signs', 'Signage — banners, yard signs, rigid signs, vehicle wraps, etc.', 2,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_categories (
  id, organization_id, name, description, sort_order, created_at, updated_at
) VALUES (
  '9964f762-4764-49b6-9109-fd96136c6da2', '00000000-0000-4000-a000-000000000001',
  'Promo Products', 'Promotional products — apparel, pens, mugs, branded items', 3,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 15. Pricing Products ──────────────────────────────────────────────────
INSERT INTO pricing_products (
  id, organization_id, name, description, aliases, default_quantity,
  default_material_id, default_material_name,
  default_final_size, default_final_width, default_final_height,
  default_equipment_id, default_equipment_name,
  default_color, default_sides, default_folding,
  is_template, default_finishing_ids, default_pricing_context,
  created_at, updated_at
) VALUES (
  '573e8667-0a93-4ee9-9e19-55a210c29e8c', '00000000-0000-4000-a000-000000000001',
  'Business Cards', NULL, '{"BCARD","BC","Presentation Cards"}'::text[], 1000,
  NULL, '12X18 120lb Cougar',
  '3.5x2', 3.5, 2,
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', 'Ricoh 9200',
  'Color', 'Double', NULL,
  false,
  '{}'::uuid[],
  '{}'::jsonb,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_products (
  id, organization_id, name, description, aliases, default_quantity,
  default_material_id, default_material_name,
  default_final_size, default_final_width, default_final_height,
  default_equipment_id, default_equipment_name,
  default_color, default_sides, default_folding,
  is_template, default_finishing_ids, default_pricing_context,
  created_at, updated_at
) VALUES (
  'e5f506b2-867f-4757-8954-4ccff814d3fe', '00000000-0000-4000-a000-000000000001',
  'Postcards', NULL, '{"Flyers"}'::text[], 1000,
  NULL, '12 x 18 100lb Cover',
  '5x7', 5, 7,
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', 'Ricoh 9200',
  'Color', 'Double', NULL,
  false,
  '{}'::uuid[],
  '{}'::jsonb,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_products (
  id, organization_id, name, description, aliases, default_quantity,
  default_material_id, default_material_name,
  default_final_size, default_final_width, default_final_height,
  default_equipment_id, default_equipment_name,
  default_color, default_sides, default_folding,
  is_template, default_finishing_ids, default_pricing_context,
  created_at, updated_at
) VALUES (
  'c88ad6f7-1159-4800-a8d2-44669c14b11a', '00000000-0000-4000-a000-000000000001',
  'Sell Sheet', NULL, '{"Sales Sheet","Sell Sheets","Sales Sheets","Product Sheet"}'::text[], 1000,
  NULL, '80lb Gloss Text',
  '8.5x11', 8.5, 11,
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', 'Ricoh 9200',
  'Color', 'Single', NULL,
  false,
  '{}'::uuid[],
  '{}'::jsonb,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_products (
  id, organization_id, name, description, aliases, default_quantity,
  default_material_id, default_material_name,
  default_final_size, default_final_width, default_final_height,
  default_equipment_id, default_equipment_name,
  default_color, default_sides, default_folding,
  is_template, default_finishing_ids, default_pricing_context,
  created_at, updated_at
) VALUES (
  '6261bcfa-81b8-4c59-a29b-de5bc337466e', '00000000-0000-4000-a000-000000000001',
  'Brochures', NULL, '{"Trifold","Bifold","Tri-fold","Bi-fold","Brochure"}'::text[], 1000,
  NULL, '80lb Gloss Text',
  '8.5x11', 8.5, 11,
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', 'Ricoh 9200',
  'Color', 'Double', 'Tri-Fold',
  false,
  '{}'::uuid[],
  '{}'::jsonb,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_products (
  id, organization_id, name, description, aliases, default_quantity,
  default_material_id, default_material_name,
  default_final_size, default_final_width, default_final_height,
  default_equipment_id, default_equipment_name,
  default_color, default_sides, default_folding,
  is_template, default_finishing_ids, default_pricing_context,
  created_at, updated_at
) VALUES (
  'a9291909-d938-44f8-8e05-a153b4bd765f', '00000000-0000-4000-a000-000000000001',
  'Envelopes', NULL, '{"A7","#10","#9","A6","9X12","Envelope","#10 Envelope"}'::text[], 1000,
  NULL, '#10 Window',
  '4x9', 4, 9,
  'aef3faa9-eeac-49ee-8361-0788b787421a', 'IJET',
  'Color', 'Single', NULL,
  false,
  '{}'::uuid[],
  '{}'::jsonb,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_products (
  id, organization_id, name, description, aliases, default_quantity,
  default_material_id, default_material_name,
  default_final_size, default_final_width, default_final_height,
  default_equipment_id, default_equipment_name,
  default_color, default_sides, default_folding,
  is_template, default_finishing_ids, default_pricing_context,
  created_at, updated_at
) VALUES (
  '8b655c18-6e31-4cd8-a066-c7f8c576893d', '00000000-0000-4000-a000-000000000001',
  'Door Hanger', NULL, '{"Door Knob","Door Hangers","Door Knob Hanger"}'::text[], 1000,
  NULL, '120lb Uncoated',
  '4x9', 4, 9,
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', 'Ricoh 9200',
  'Color', 'Double', NULL,
  false,
  '{}'::uuid[],
  '{}'::jsonb,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 16. Pricing Product ↔ Category Junction ───────────────────────────────
INSERT INTO pricing_product_categories (product_id, category_id, created_at, updated_at)
VALUES ('573e8667-0a93-4ee9-9e19-55a210c29e8c', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO pricing_product_categories (product_id, category_id, created_at, updated_at)
VALUES ('e5f506b2-867f-4757-8954-4ccff814d3fe', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO pricing_product_categories (product_id, category_id, created_at, updated_at)
VALUES ('c88ad6f7-1159-4800-a8d2-44669c14b11a', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO pricing_product_categories (product_id, category_id, created_at, updated_at)
VALUES ('6261bcfa-81b8-4c59-a29b-de5bc337466e', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO pricing_product_categories (product_id, category_id, created_at, updated_at)
VALUES ('a9291909-d938-44f8-8e05-a153b4bd765f', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO pricing_product_categories (product_id, category_id, created_at, updated_at)
VALUES ('8b655c18-6e31-4cd8-a066-c7f8c576893d', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;

-- ── 17. Pricing Equipment ─────────────────────────────────────────────────
INSERT INTO pricing_equipment (
  id, organization_id, name, category_applies, color_capability,
  cost_unit, cost_type, markup_multiplier, unit_cost,
  color_unit_cost, black_unit_cost,
  color_tiers, black_tiers, sqft_tiers,
  initial_setup_fee, units_per_hour, time_cost_per_hour, time_cost_markup,
  markup_type, use_pricing_tiers,
  auto_add_category_ids, maintenance_vendor_id,
  sort_order, created_at, updated_at
) VALUES (
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', '00000000-0000-4000-a000-000000000001',
  'Ricoh 9200', 'Digital Press', 'Color and Black',
  'per_click', 'cost_only', NULL, 0.035,
  NULL, NULL,
  '[{"minQty":1,"pricePerUnit":0.55},{"minQty":25,"pricePerUnit":0.43},{"minQty":50,"pricePerUnit":0.42},{"minQty":250,"pricePerUnit":0.4},{"minQty":500,"pricePerUnit":0.34},{"minQty":1750,"pricePerUnit":0.27},{"minQty":3000,"pricePerUnit":0.245},{"minQty":7500,"pricePerUnit":0.215},{"minQty":10000,"pricePerUnit":0.2}]'::jsonb, '[{"minQty":1,"pricePerUnit":0.08},{"minQty":100,"pricePerUnit":0.06},{"minQty":1000,"pricePerUnit":0.04},{"minQty":5000,"pricePerUnit":0.03}]'::jsonb, '[]'::jsonb,
  0, NULL, NULL, NULL,
  'multiplier', false,
  '{}'::uuid[], NULL,
  0, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_equipment (
  id, organization_id, name, category_applies, color_capability,
  cost_unit, cost_type, markup_multiplier, unit_cost,
  color_unit_cost, black_unit_cost,
  color_tiers, black_tiers, sqft_tiers,
  initial_setup_fee, units_per_hour, time_cost_per_hour, time_cost_markup,
  markup_type, use_pricing_tiers,
  auto_add_category_ids, maintenance_vendor_id,
  sort_order, created_at, updated_at
) VALUES (
  '97e0e73b-1ee1-4851-a34e-70b02ecd1751', '00000000-0000-4000-a000-000000000001',
  'Ricoh 9200 w/ Staff Support', 'Digital Press', 'Color and Black',
  'per_click', 'cost_plus_time', NULL, 0.035,
  NULL, NULL,
  '[{"minQty":1,"pricePerUnit":0.55},{"minQty":25,"pricePerUnit":0.43},{"minQty":50,"pricePerUnit":0.42},{"minQty":250,"pricePerUnit":0.4},{"minQty":500,"pricePerUnit":0.34},{"minQty":1750,"pricePerUnit":0.27},{"minQty":3000,"pricePerUnit":0.245},{"minQty":7500,"pricePerUnit":0.215},{"minQty":10000,"pricePerUnit":0.2}]'::jsonb, '[{"minQty":1,"pricePerUnit":0.08},{"minQty":100,"pricePerUnit":0.06},{"minQty":1000,"pricePerUnit":0.04},{"minQty":5000,"pricePerUnit":0.03}]'::jsonb, '[]'::jsonb,
  0, 1000, 35, 0,
  'multiplier', false,
  '{}'::uuid[], NULL,
  1, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_equipment (
  id, organization_id, name, category_applies, color_capability,
  cost_unit, cost_type, markup_multiplier, unit_cost,
  color_unit_cost, black_unit_cost,
  color_tiers, black_tiers, sqft_tiers,
  initial_setup_fee, units_per_hour, time_cost_per_hour, time_cost_markup,
  markup_type, use_pricing_tiers,
  auto_add_category_ids, maintenance_vendor_id,
  sort_order, created_at, updated_at
) VALUES (
  'aef3faa9-eeac-49ee-8361-0788b787421a', '00000000-0000-4000-a000-000000000001',
  'IJET', 'Digital Press', 'Color and Black',
  'per_click', 'cost_only', NULL, 0.035,
  NULL, NULL,
  '[{"minQty":1,"pricePerUnit":0.55},{"minQty":25,"pricePerUnit":0.43},{"minQty":50,"pricePerUnit":0.42},{"minQty":250,"pricePerUnit":0.4},{"minQty":500,"pricePerUnit":0.34},{"minQty":1750,"pricePerUnit":0.27},{"minQty":3000,"pricePerUnit":0.245},{"minQty":7500,"pricePerUnit":0.215},{"minQty":10000,"pricePerUnit":0.2}]'::jsonb, '[{"minQty":1,"pricePerUnit":0.08},{"minQty":100,"pricePerUnit":0.06},{"minQty":1000,"pricePerUnit":0.04},{"minQty":5000,"pricePerUnit":0.03}]'::jsonb, '[]'::jsonb,
  0, NULL, NULL, NULL,
  'multiplier', false,
  '{}'::uuid[], NULL,
  2, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_equipment (
  id, organization_id, name, category_applies, color_capability,
  cost_unit, cost_type, markup_multiplier, unit_cost,
  color_unit_cost, black_unit_cost,
  color_tiers, black_tiers, sqft_tiers,
  initial_setup_fee, units_per_hour, time_cost_per_hour, time_cost_markup,
  markup_type, use_pricing_tiers,
  auto_add_category_ids, maintenance_vendor_id,
  sort_order, created_at, updated_at
) VALUES (
  '60f43550-e711-4824-9196-a94333f7a2b3', '00000000-0000-4000-a000-000000000001',
  'HP Latex 800', 'Signs', 'Color',
  'per_sqft', 'cost_only', 7, 0.5,
  NULL, NULL,
  '[{"minQty":1,"pricePerUnit":3.5},{"minQty":10,"pricePerUnit":3},{"minQty":50,"pricePerUnit":2.5}]'::jsonb, '[]'::jsonb, '[]'::jsonb,
  0, NULL, NULL, NULL,
  'multiplier', false,
  '{}'::uuid[], NULL,
  3, '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 18. Material Groups ───────────────────────────────────────────────────
INSERT INTO material_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  'c9ccd233-c91c-4811-b31a-d6a741495ae0', '00000000-0000-4000-a000-000000000001',
  'Digital Press', 'Papers for digital presses',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO material_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '85e3b3e7-9a43-4120-bfb9-3ff5a1d1bd0c', '00000000-0000-4000-a000-000000000001',
  'Wide-Format Rolls', 'Roll media for wide-format printers',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO material_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '74d0a4e3-0993-4193-86dd-2f881fc0954d', '00000000-0000-4000-a000-000000000001',
  'Wide-Format Rigids', 'Rigid substrates for sign production',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO material_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  'ce0c344c-2778-4d3d-a71f-321f56ac8fe1', '00000000-0000-4000-a000-000000000001',
  'Envelopes', 'Envelope stocks',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 19. Material Group ↔ Category Junction ────────────────────────────────
INSERT INTO material_group_categories (group_id, category_id, created_at, updated_at)
VALUES ('c9ccd233-c91c-4811-b31a-d6a741495ae0', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_categories (group_id, category_id, created_at, updated_at)
VALUES ('85e3b3e7-9a43-4120-bfb9-3ff5a1d1bd0c', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_categories (group_id, category_id, created_at, updated_at)
VALUES ('74d0a4e3-0993-4193-86dd-2f881fc0954d', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_categories (group_id, category_id, created_at, updated_at)
VALUES ('ce0c344c-2778-4d3d-a71f-321f56ac8fe1', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;

-- ── 20. Pricing Materials ─────────────────────────────────────────────────
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'e2477684-5ad7-40ff-8f65-77084b1abd69', '00000000-0000-4000-a000-000000000001',
  'paper', '18PT White C2S Digital Cover - Tango', '13x19', 13, 19,
  'cost_per_m', 198.3, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '0ece3007-07df-45fc-97f8-fa6c040d1f14', '00000000-0000-4000-a000-000000000001',
  'paper', '20# Exact Color Multipurpose', '8.5x11', 8.5, 11,
  'cost_per_m', 18.73, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'b54f175f-6530-4bb5-b8ca-665df5427c29', '00000000-0000-4000-a000-000000000001',
  'paper', '65# Colored Cover Astrobrights', '8.5x11', 8.5, 11,
  'cost_per_m', 56, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'f9fcc1d3-5110-4cd3-91ba-70b2e80ba9c0', '00000000-0000-4000-a000-000000000001',
  'paper', '80# Classic Linen Text', '23x35', 23, 35,
  'cost_per_m', 357, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'fcb1945c-f88f-4092-98c4-da1848e74407', '00000000-0000-4000-a000-000000000001',
  'paper', 'Chipboard Point #90 Item 073630', '12x18', 12, 18,
  'cost_per_m', 120, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'c76081db-31cd-4447-b621-fcfd02731c0c', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss Cover 100# 13x19', '26x40', 26, 40,
  'cost_per_m', 360, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'fde02527-e104-4f94-94a1-2150a4e5d50b', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss Cover 100# 26x40', '13x19', 13, 19,
  'cost_per_m', 118.75, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'b8c24beb-3cef-4a4c-a64c-159a046a9c23', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss Cover 130# 13x19', '26x40', 26, 40,
  'cost_per_m', 67.26, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '13c712de-e6bb-4f23-af95-64a46f2357a6', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss Cover 130# WHITE 26x40 - McGregor', '13x19', 13, 19,
  'cost_per_m', 102.6, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '9693c385-6099-460a-b207-be5aafd1c628', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss Cover 80# 13x19', '13x19', 13, 19,
  'cost_per_m', 65, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '09f236a0-4327-4e29-985d-b7070a6d0580', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss Text 100# 13x19', '13x19', 13, 19,
  'cost_per_m', 56.18, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '5ba1c05f-8ef9-46f7-83cc-1dee627df56f', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss Text 80# 13x19', '13x19', 13, 19,
  'cost_per_m', 128.25, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '0ecbd611-b239-420f-9f92-b8ae531f1f4a', '00000000-0000-4000-a000-000000000001',
  'paper', 'Matte 100# Cover 13x19', '13x19', 13, 19,
  'cost_per_m', 70.2, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'c2a7a8ec-6e2f-45ce-aee0-3660db30e799', '00000000-0000-4000-a000-000000000001',
  'paper', 'Matte 100# Text 13x19', '12x19', 12, 19,
  'cost_per_m', 720, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '4ec706f5-7873-4852-b8f3-a9813212bd59', '00000000-0000-4000-a000-000000000001',
  'paper', 'Mohawk Superfine White Smooth Finish 150# Cover', '19x13', 19, 13,
  'cost_per_m', 95, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'd5e6d4e8-2107-4925-89e3-c93433c227e6', '00000000-0000-4000-a000-000000000001',
  'paper', 'Satin 80# Cover 19x13 - Coronet Paper', '13x19', 13, 19,
  'cost_per_m', 75, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '55924b61-aaee-4b92-9123-fb3759b4e967', '00000000-0000-4000-a000-000000000001',
  'paper', 'Satin Text 100# 13x19', '13x19', 13, 19,
  'cost_per_m', 196, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '95eecd5e-2d63-45f6-a7ed-c303376c025c', '00000000-0000-4000-a000-000000000001',
  'paper', 'Uncoated Accent Cover 120# Opaque Smooth', '13x19', 13, 19,
  'cost_per_m', 342.9, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '278523fd-c056-4c67-ba10-8e6f5f795fe5', '00000000-0000-4000-a000-000000000001',
  'paper', 'Uncoated Cougar Cover 130# Super Smooth', '13x19', 13, 19,
  'cost_per_m', 167, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '6561c57f-e777-42cd-af9c-f5f6f72cc0ac', '00000000-0000-4000-a000-000000000001',
  'paper', 'Uncoated Opaque Cover 130# 13x19', '13x19', 13, 19,
  'cost_per_m', 102.4, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '1f043889-d4be-42c2-b517-b363d17c3229', '00000000-0000-4000-a000-000000000001',
  'paper', 'Uncoated Opaque Cover 80# 13x19', '8.5x11', 8.5, 11,
  'cost_per_m', 103.9, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '7e4c7efb-c57a-40fe-a452-647d3def29d1', '00000000-0000-4000-a000-000000000001',
  'paper', 'ZAPCO SECURITY GUARD+ BLUE(VD)', '8.5x11', 8.5, 11,
  'cost_per_m', 10, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '258d6f47-ff06-4e60-bd01-71c5b37ade43', '00000000-0000-4000-a000-000000000001',
  'paper', '20# Bond White Multiuse 067333', '11x17', 11, 17,
  'cost_per_m', 18, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '9b4c5392-3753-4591-9dff-576eb353252b', '00000000-0000-4000-a000-000000000001',
  'paper', '20# Bond White QuickCopy 066000', '8.5x11', 8.5, 11,
  'cost_per_m', 13, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '0b5c62ab-9b44-4313-862a-0fc86a5c108e', '00000000-0000-4000-a000-000000000001',
  'paper', '20# Colored Bond Earthchoice Colors (500ct)', '11x17', 11, 17,
  'cost_per_m', 26, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'e087097c-d0fc-4c23-ab3f-252b42980a57', '00000000-0000-4000-a000-000000000001',
  'paper', '20# Colored Bond Earthchoice Colors (250ct)', '11x17', 11, 17,
  'cost_per_m', 57.27, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'f64eeed4-088f-48d0-9919-4ef5714cc9d1', '00000000-0000-4000-a000-000000000001',
  'paper', 'NCR 2 Part 11x17', '11x17', 11, 17,
  'cost_per_m', 66, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '2ae818ea-3c01-4a85-a4ec-eec713fc72dc', '00000000-0000-4000-a000-000000000001',
  'paper', 'NCR 4 Part 8.5x11', '8.5x11', 8.5, 11,
  'cost_per_m', 18, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '7fab3478-c77c-4a97-91fa-90b3e10a1eb5', '00000000-0000-4000-a000-000000000001',
  'paper', 'Laser House Sheet 60# Accent 068543', '12x18', 12, 18,
  'cost_per_m', 38.75, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'c0b777f4-3bf3-433e-a4f6-f4f3daaa83cc', '00000000-0000-4000-a000-000000000001',
  'paper', 'Laser House Sheet 60# 11x17', '11x17', 11, 17,
  'cost_per_m', 23, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '0e1f4c33-fea6-4dc4-a3da-336410dbce8c', '00000000-0000-4000-a000-000000000001',
  'paper', '60# Offset White Husky 065990', '13x19', 13, 19,
  'cost_per_m', 59.6, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'd2dc5632-5efe-4c3c-94da-5b1f11061b54', '00000000-0000-4000-a000-000000000001',
  'paper', '60# Offset White Text Smooth Husky Digital 068794', '12x18', 12, 18,
  'cost_per_m', 52, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '439f2858-85dc-46ab-b5d1-161b4bf0fbb1', '00000000-0000-4000-a000-000000000001',
  'paper', 'Linen 100# Cover Sundance 063135', '12x18', 12, 18,
  'cost_per_m', 332, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'ce62ddcd-e99b-48a4-b728-5b9816c16af7', '00000000-0000-4000-a000-000000000001',
  'paper', 'Uncoated 80# Cover 12x18', '12x18', 12, 18,
  'cost_per_m', 89.1, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '2159f4e1-3313-4dc4-97e8-e399bb8cb1fd', '00000000-0000-4000-a000-000000000001',
  'paper', 'Uncoated 100# Cover Lynx N45715', '12x18', 12, 18,
  'cost_per_m', 110, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '05bb5bba-5909-4fce-9740-32f485ced0c2', '00000000-0000-4000-a000-000000000001',
  'paper', 'Uncoated 120# Cover Lynx 068823', '12x18', 12, 18,
  'cost_per_m', 140, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'efbb0944-6481-48a6-89be-05b06d6a6ac6', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss 80# Gloss Text 12x18', '12x18', 12, 18,
  'cost_per_m', 59.8, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '48877b77-524b-421c-b066-32ecbd86a8a5', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss 100# Gloss Text 12x18', '12x18', 12, 18,
  'cost_per_m', 59.8, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'fc4cf2c2-c0d8-478f-849b-6687a9428a98', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss 80# Cover 12x18', '12x18', 12, 18,
  'cost_per_m', 89.1, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '3af25566-7f76-455f-b0ff-af0b3e85147b', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss 100# Cover Blazer N64750', '12x18', 12, 18,
  'cost_per_m', 85, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '693173eb-1a08-4ff5-baa7-d08aeafb1139', '00000000-0000-4000-a000-000000000001',
  'paper', 'Gloss 130# Cover Blazer 065024', '12x18', 12, 18,
  'cost_per_m', 109, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '0c736ee1-8ee8-4519-96c9-cef2ca282f1a', '00000000-0000-4000-a000-000000000001',
  'paper', 'Satin 110# Cover Blazer 064932', '12x18', 12, 18,
  'cost_per_m', 94, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '0066fc23-41e7-49d9-b45e-a1746156c658', '00000000-0000-4000-a000-000000000001',
  'paper', '60# Self-Adhesive Gloss Starboard 092512 12x18', '12x18', 12, 18,
  'cost_per_m', 350, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '3f429cea-2cd5-4f8f-81b2-9e6ee3914ede', '00000000-0000-4000-a000-000000000001',
  'paper', '60# Self-Adhesive Gloss Starboard 092512 8.5x11', '8.5x11', 8.5, 11,
  'cost_per_m', 210, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'f24ff5ff-1da1-4581-b622-a1b8e5b9b1a0', '00000000-0000-4000-a000-000000000001',
  'paper', 'NCR 2 Part 8.5x11', '8.5x11', 8.5, 11,
  'cost_per_m', 17, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '1af73c7c-f65d-479f-b66c-7ceb60aea6c8', '00000000-0000-4000-a000-000000000001',
  'paper', 'NCR 3 Part 11x17', '11x17', 11, 17,
  'cost_per_m', 69.93, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'be72bb7a-05b4-4a1a-a8b9-e61f41557b8e', '00000000-0000-4000-a000-000000000001',
  'paper', 'NCR 3 Part 8.5x11', '8.5x11', 8.5, 11,
  'cost_per_m', 19, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '3931c165-e2eb-4cdb-88b8-dbd1915cf7fe', '00000000-0000-4000-a000-000000000001',
  'paper', 'Acetate Front Cover', '8.5x11', 8.5, 11,
  'cost_per_m', 200, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'f4f2c202-b161-47b0-ae53-ab2e3a7db0b4', '00000000-0000-4000-a000-000000000001',
  'paper', 'Back Vinyl Covers (Blue or Black)', '8.5x11', 8.5, 11,
  'cost_per_m', 300, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '82ca8db7-7015-47e9-96e1-f580114d5a3e', '00000000-0000-4000-a000-000000000001',
  'paper', 'Tabs Our Stock', '8.5x11', 8.5, 11,
  'cost_per_m', 80, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'fbd9c276-e606-45be-b041-f363c0d3f47e', '00000000-0000-4000-a000-000000000001',
  'roll_media', 'HP Premium Matte Polypropylene 36"', '36', 36, 0,
  'cost_per_sqft', 0, NULL, 0.42,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 60,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '99ce7456-32bb-4cd2-a5ea-f50b3940bc9b', '00000000-0000-4000-a000-000000000001',
  'roll_media', 'Avery MPI 1105 Gloss White Vinyl 54"', '54', 54, 0,
  'cost_per_sqft', 0, NULL, 0.42,
  285, 150,
  '[]'::jsonb, 0, 'percent', 55,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '6b427a22-8b3f-4baf-a66c-f1d94f9294d1', '00000000-0000-4000-a000-000000000001',
  'roll_media', '3M IJ35 Matte White Vinyl 48"', '48', 48, 0,
  'cost_per_sqft', 0, NULL, 0.57,
  340, 150,
  '[]'::jsonb, 0, 'percent', 55,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '5d1c1a19-7aa1-47bc-92ff-c7145605eccf', '00000000-0000-4000-a000-000000000001',
  'roll_media', 'Oracal 651 Gloss Vinyl 24"', '24', 24, 0,
  'cost_per_sqft', 0, NULL, 0.28,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 65,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '4ded4f43-3f71-4b3b-a8f1-abf28a8e4310', '00000000-0000-4000-a000-000000000001',
  'rigid_substrate', 'Coroplast 4mm White 48x96', '48x96', 48, 96,
  'cost_per_unit', 0, 12.5, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 60,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '6a8b566d-6ba8-40dd-acd0-d59e84e166fd', '00000000-0000-4000-a000-000000000001',
  'rigid_substrate', 'Sintra PVC 3mm White 48x96', '48x96', 48, 96,
  'cost_per_unit', 0, 18.75, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 60,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  '89e9c6ec-1c72-4e02-b4b4-4d5f93e62706', '00000000-0000-4000-a000-000000000001',
  'rigid_substrate', 'Gatorfoam 3/16" White 48x96', '48x96', 48, 96,
  'cost_per_sqft', 0, NULL, 1.15,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 55,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'd25ee363-6d5a-48f7-9723-8bc2274d2c85', '00000000-0000-4000-a000-000000000001',
  'rigid_substrate', 'Aluminum Composite Panel 3mm 48x96', '48x96', 48, 96,
  'cost_per_unit', 0, 45, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 50,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'a78e3195-d124-4aa5-9bba-63aa02ecf9b2', '00000000-0000-4000-a000-000000000001',
  'blanks', 'Ceramic Mug 11oz White', NULL, 0, 0,
  'cost_per_unit', 0, 2.5, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 70,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_materials (
  id, organization_id, material_type, name, size, size_width, size_height,
  pricing_model, price_per_m, cost_per_unit, cost_per_sqft,
  roll_cost, roll_length,
  pricing_tiers, minimum_charge, markup_type, markup,
  is_favorite, use_count,
  description, vendor_name, vendor_id, vendor_material_id,
  vendor_contact_name, vendor_contact_title, vendor_sales_rep,
  created_at, updated_at
) VALUES (
  'ba8639af-cbba-4390-87fc-a81779df9e3f', '00000000-0000-4000-a000-000000000001',
  'blanks', 'Metal License Plate Blank', NULL, 0, 0,
  'cost_per_unit', 0, 3.25, NULL,
  NULL, NULL,
  '[]'::jsonb, 0, 'percent', 65,
  false, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 21. Material ↔ Group Assignments ──────────────────────────────────────
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('e2477684-5ad7-40ff-8f65-77084b1abd69', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('0ece3007-07df-45fc-97f8-fa6c040d1f14', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('b54f175f-6530-4bb5-b8ca-665df5427c29', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('f9fcc1d3-5110-4cd3-91ba-70b2e80ba9c0', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('fcb1945c-f88f-4092-98c4-da1848e74407', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('c76081db-31cd-4447-b621-fcfd02731c0c', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('fde02527-e104-4f94-94a1-2150a4e5d50b', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('b8c24beb-3cef-4a4c-a64c-159a046a9c23', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('13c712de-e6bb-4f23-af95-64a46f2357a6', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('9693c385-6099-460a-b207-be5aafd1c628', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('09f236a0-4327-4e29-985d-b7070a6d0580', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('5ba1c05f-8ef9-46f7-83cc-1dee627df56f', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('0ecbd611-b239-420f-9f92-b8ae531f1f4a', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('c2a7a8ec-6e2f-45ce-aee0-3660db30e799', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('4ec706f5-7873-4852-b8f3-a9813212bd59', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('d5e6d4e8-2107-4925-89e3-c93433c227e6', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('55924b61-aaee-4b92-9123-fb3759b4e967', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('95eecd5e-2d63-45f6-a7ed-c303376c025c', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('278523fd-c056-4c67-ba10-8e6f5f795fe5', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('6561c57f-e777-42cd-af9c-f5f6f72cc0ac', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('1f043889-d4be-42c2-b517-b363d17c3229', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('7e4c7efb-c57a-40fe-a452-647d3def29d1', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('258d6f47-ff06-4e60-bd01-71c5b37ade43', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('9b4c5392-3753-4591-9dff-576eb353252b', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('0b5c62ab-9b44-4313-862a-0fc86a5c108e', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('e087097c-d0fc-4c23-ab3f-252b42980a57', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('f64eeed4-088f-48d0-9919-4ef5714cc9d1', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('2ae818ea-3c01-4a85-a4ec-eec713fc72dc', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('7fab3478-c77c-4a97-91fa-90b3e10a1eb5', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('c0b777f4-3bf3-433e-a4f6-f4f3daaa83cc', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('0e1f4c33-fea6-4dc4-a3da-336410dbce8c', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('d2dc5632-5efe-4c3c-94da-5b1f11061b54', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('439f2858-85dc-46ab-b5d1-161b4bf0fbb1', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('ce62ddcd-e99b-48a4-b728-5b9816c16af7', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('2159f4e1-3313-4dc4-97e8-e399bb8cb1fd', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('05bb5bba-5909-4fce-9740-32f485ced0c2', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('efbb0944-6481-48a6-89be-05b06d6a6ac6', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('48877b77-524b-421c-b066-32ecbd86a8a5', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('fc4cf2c2-c0d8-478f-849b-6687a9428a98', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('3af25566-7f76-455f-b0ff-af0b3e85147b', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('693173eb-1a08-4ff5-baa7-d08aeafb1139', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('0c736ee1-8ee8-4519-96c9-cef2ca282f1a', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('0066fc23-41e7-49d9-b45e-a1746156c658', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('3f429cea-2cd5-4f8f-81b2-9e6ee3914ede', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('f24ff5ff-1da1-4581-b622-a1b8e5b9b1a0', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('1af73c7c-f65d-479f-b66c-7ceb60aea6c8', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('be72bb7a-05b4-4a1a-a8b9-e61f41557b8e', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('3931c165-e2eb-4cdb-88b8-dbd1915cf7fe', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('f4f2c202-b161-47b0-ae53-ab2e3a7db0b4', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('82ca8db7-7015-47e9-96e1-f580114d5a3e', 'c9ccd233-c91c-4811-b31a-d6a741495ae0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('fbd9c276-e606-45be-b041-f363c0d3f47e', '85e3b3e7-9a43-4120-bfb9-3ff5a1d1bd0c', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('99ce7456-32bb-4cd2-a5ea-f50b3940bc9b', '85e3b3e7-9a43-4120-bfb9-3ff5a1d1bd0c', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('6b427a22-8b3f-4baf-a66c-f1d94f9294d1', '85e3b3e7-9a43-4120-bfb9-3ff5a1d1bd0c', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('5d1c1a19-7aa1-47bc-92ff-c7145605eccf', '85e3b3e7-9a43-4120-bfb9-3ff5a1d1bd0c', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('4ded4f43-3f71-4b3b-a8f1-abf28a8e4310', '74d0a4e3-0993-4193-86dd-2f881fc0954d', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('6a8b566d-6ba8-40dd-acd0-d59e84e166fd', '74d0a4e3-0993-4193-86dd-2f881fc0954d', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('89e9c6ec-1c72-4e02-b4b4-4d5f93e62706', '74d0a4e3-0993-4193-86dd-2f881fc0954d', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO material_group_assignments (material_id, group_id, created_at, updated_at)
VALUES ('d25ee363-6d5a-48f7-9723-8bc2274d2c85', '74d0a4e3-0993-4193-86dd-2f881fc0954d', now(), now())
ON CONFLICT DO NOTHING;

-- ── 22. Material ↔ Category Assignments ───────────────────────────────────

-- ── 23. Material ↔ Product Assignments ────────────────────────────────────

-- ── 24. Finishing Groups ──────────────────────────────────────────────────
INSERT INTO finishing_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '307d7ea4-14e9-4e75-b8a4-89693877f4a9', '00000000-0000-4000-a000-000000000001',
  'Cutting & Trimming', 'Paper cutting, trimming, die cutting',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO finishing_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '8cd5630b-1d87-4612-93d0-1693985162e5', '00000000-0000-4000-a000-000000000001',
  'Folding', 'Mechanical and hand folding',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO finishing_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '7ad31e5d-9883-4fc9-8dad-2638ca2a26c4', '00000000-0000-4000-a000-000000000001',
  'Binding & Drilling', 'Drilling, stapling, binding',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO finishing_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '0c6b7fba-7f68-4eb9-b1ef-2f9401da6f5e', '00000000-0000-4000-a000-000000000001',
  'Laminating & Coating', 'Sheet lamination, roll lamination, UV coating',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO finishing_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '6dca2f6e-8e41-47f7-8c70-9ba1a4d70821', '00000000-0000-4000-a000-000000000001',
  'Mailing & Fulfillment', 'Inserting, addressing, tabbing, metering',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO finishing_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  'eb27d166-d72d-4d58-be4d-2848b454e953', '00000000-0000-4000-a000-000000000001',
  'Sign Finishing', 'Routing, mounting, grommeting, hemming',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 25. Pricing Finishing ─────────────────────────────────────────────────
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  '50076122-a9f1-42bc-ae2d-100546e33c86', '00000000-0000-4000-a000-000000000001',
  'Cut', 'Standard paper cutting on guillotine cutter',
  'time_only', 'per_stack', NULL, NULL,
  0, 40, 150, 0,
  0, 0, false, 0, 0,
  500, 150,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], 'Batch cutting — 500 sheets per stack pass',
  0, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  'c6d21b29-04e2-4294-b0a4-ad04678281d1', '00000000-0000-4000-a000-000000000001',
  'Tri-Fold', 'Letter-fold / tri-fold on folder',
  'time_only', 'per_unit', NULL, NULL,
  0, 40, 5000, 0,
  0, 0, false, 0, 0,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  1, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  '19f0a4ec-4899-446f-ba0d-9e44725e37cd', '00000000-0000-4000-a000-000000000001',
  'Bi-Fold', 'Half-fold on folder',
  'time_only', 'per_unit', NULL, NULL,
  0, 40, 5000, 0,
  0, 0, false, 0, 0,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  2, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  '6f7e5f30-554e-4bc5-9f8e-bd5263473a39', '00000000-0000-4000-a000-000000000001',
  'Drill 1-Hole', 'Single hole drill',
  'time_only', 'per_stack', NULL, NULL,
  0, 40, 5000, 0,
  0, 0, false, 0, 0,
  500, 300,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  3, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  'e8864bdd-79b7-41b0-ad73-3f125f21ed77', '00000000-0000-4000-a000-000000000001',
  'Drill 2-Hole', 'Double hole drill',
  'time_only', 'per_stack', NULL, NULL,
  0, 40, 5000, 0,
  0, 0, false, 0, 0,
  500, 250,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  4, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  'af4a8ef8-a22c-4899-9c8b-64627079e2bf', '00000000-0000-4000-a000-000000000001',
  'Laminate — Sheet', 'Sheet-fed lamination (pouch or roll-to-sheet)',
  'cost_plus_time', 'per_unit', NULL, NULL,
  0.15, 35, 300, 5,
  50, 0, false, 0, 0,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  5, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  '07bb5e35-1a44-4674-b7a8-59ee45e4fec3', '00000000-0000-4000-a000-000000000001',
  'Laminate — Roll', 'Roll-to-roll lamination for wide format',
  'cost_plus_time', 'per_sqft', NULL, NULL,
  0.3, 40, 200, 10,
  50, 0, false, 0, 0,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  6, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  'cf86ce8b-5ac9-4518-aee7-7d691b9cdfb8', '00000000-0000-4000-a000-000000000001',
  'Insert & Seal', 'Machine inserting and sealing envelopes',
  'time_only', 'per_unit', NULL, NULL,
  0, 35, 1500, 15,
  30, 0, false, 0, 0,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  7, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  '223d94df-66e5-4ab3-8bd1-8cdc49941914', '00000000-0000-4000-a000-000000000001',
  'Address & Tab', 'Inkjet addressing and tabbing for self-mailers',
  'cost_plus_time', 'per_unit', NULL, NULL,
  0.03, 35, 4000, 20,
  30, 0, false, 0, 0,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  8, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  'fca2fd9b-9beb-4ef6-add0-2b1035ae6c5a', '00000000-0000-4000-a000-000000000001',
  'Route / Contour Cut', 'CNC routing or contour cutting on flatbed',
  'cost_plus_time', 'per_sqft', NULL, NULL,
  0.5, 55, 50, 15,
  60, 0, false, 0, 0,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  9, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  '4e63494b-3e55-4fd8-b106-f90fe2b4cac8', '00000000-0000-4000-a000-000000000001',
  'Grommet', 'Adding grommets to banners',
  'time_only', 'per_unit', NULL, NULL,
  0, 30, 120, 0,
  40, 0, false, 0, 0,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  10, '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_finishing (
  id, organization_id, name, description,
  cost_type, charge_basis, perimeter_mode, perimeter_interval_inches,
  unit_cost, hourly_cost, output_per_hour, initial_setup_fee,
  markup_percent, minimum_charge, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  sheets_per_stack, stacks_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  sort_order, created_at, updated_at
) VALUES (
  '634c830d-48ff-4133-acc0-fb2dd7d80ef2', '00000000-0000-4000-a000-000000000001',
  'Hem & Pole Pocket', 'Banner hemming and pole pocket sewing',
  'time_only', 'per_hour', NULL, NULL,
  0, 35, 1, 0,
  50, 0, false, 0, 0,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  11, '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 26. Finishing ↔ Group Assignments ─────────────────────────────────────
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('50076122-a9f1-42bc-ae2d-100546e33c86', '307d7ea4-14e9-4e75-b8a4-89693877f4a9', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('c6d21b29-04e2-4294-b0a4-ad04678281d1', '8cd5630b-1d87-4612-93d0-1693985162e5', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('19f0a4ec-4899-446f-ba0d-9e44725e37cd', '8cd5630b-1d87-4612-93d0-1693985162e5', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('6f7e5f30-554e-4bc5-9f8e-bd5263473a39', '7ad31e5d-9883-4fc9-8dad-2638ca2a26c4', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('e8864bdd-79b7-41b0-ad73-3f125f21ed77', '7ad31e5d-9883-4fc9-8dad-2638ca2a26c4', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('af4a8ef8-a22c-4899-9c8b-64627079e2bf', '0c6b7fba-7f68-4eb9-b1ef-2f9401da6f5e', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('07bb5e35-1a44-4674-b7a8-59ee45e4fec3', '0c6b7fba-7f68-4eb9-b1ef-2f9401da6f5e', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('cf86ce8b-5ac9-4518-aee7-7d691b9cdfb8', '6dca2f6e-8e41-47f7-8c70-9ba1a4d70821', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('223d94df-66e5-4ab3-8bd1-8cdc49941914', '6dca2f6e-8e41-47f7-8c70-9ba1a4d70821', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('fca2fd9b-9beb-4ef6-add0-2b1035ae6c5a', 'eb27d166-d72d-4d58-be4d-2848b454e953', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('4e63494b-3e55-4fd8-b106-f90fe2b4cac8', 'eb27d166-d72d-4d58-be4d-2848b454e953', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_group_assignments (finishing_id, group_id, created_at, updated_at)
VALUES ('634c830d-48ff-4133-acc0-fb2dd7d80ef2', 'eb27d166-d72d-4d58-be4d-2848b454e953', now(), now())
ON CONFLICT DO NOTHING;

-- ── 27. Finishing ↔ Category Assignments ──────────────────────────────────
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('50076122-a9f1-42bc-ae2d-100546e33c86', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('c6d21b29-04e2-4294-b0a4-ad04678281d1', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('19f0a4ec-4899-446f-ba0d-9e44725e37cd', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('6f7e5f30-554e-4bc5-9f8e-bd5263473a39', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('e8864bdd-79b7-41b0-ad73-3f125f21ed77', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('af4a8ef8-a22c-4899-9c8b-64627079e2bf', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('07bb5e35-1a44-4674-b7a8-59ee45e4fec3', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('cf86ce8b-5ac9-4518-aee7-7d691b9cdfb8', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('223d94df-66e5-4ab3-8bd1-8cdc49941914', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('fca2fd9b-9beb-4ef6-add0-2b1035ae6c5a', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('4e63494b-3e55-4fd8-b106-f90fe2b4cac8', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO finishing_category_assignments (finishing_id, category_id, created_at, updated_at)
VALUES ('634c830d-48ff-4133-acc0-fb2dd7d80ef2', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;

-- ── 28. Finishing ↔ Product Assignments ───────────────────────────────────

-- ── 29. Labor Groups ──────────────────────────────────────────────────────
INSERT INTO labor_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '20a8317d-8d39-40f0-96de-9577946063a0', '00000000-0000-4000-a000-000000000001',
  'Design & Prepress', 'Graphic design, prepress, and proofing services',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO labor_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '92b80bb9-aa80-4688-bc2f-60077df5588f', '00000000-0000-4000-a000-000000000001',
  'Assembly & Fulfillment', 'Manual assembly, kitting, packaging, and fulfillment',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO labor_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '803a6ead-433f-4b97-aafd-25133ef3736a', '00000000-0000-4000-a000-000000000001',
  'Installation', 'On-site installation and application services',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 30. Pricing Labor ─────────────────────────────────────────────────────
INSERT INTO pricing_labor (
  id, organization_id, name, description,
  charge_basis, hourly_cost, initial_setup_fee, markup_percent,
  is_pre_press, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  minimum_charge, output_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  created_at, updated_at
) VALUES (
  'e8b43159-aed4-4ab5-9b39-e95a68c73808', '00000000-0000-4000-a000-000000000001',
  'Graphic Design', 'Design and layout services',
  'per_hour', 30, 10, 100,
  false, false, 0, 0,
  0, 1,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_labor (
  id, organization_id, name, description,
  charge_basis, hourly_cost, initial_setup_fee, markup_percent,
  is_pre_press, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  minimum_charge, output_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  created_at, updated_at
) VALUES (
  '400f4560-f99a-45ad-af02-b5fbbe8dbf21', '00000000-0000-4000-a000-000000000001',
  'Installation', 'On-site installation of signage and graphics',
  'per_sqft', 1, 25, 80,
  false, false, 0, 0,
  0, 1,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_labor (
  id, organization_id, name, description,
  charge_basis, hourly_cost, initial_setup_fee, markup_percent,
  is_pre_press, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  minimum_charge, output_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  created_at, updated_at
) VALUES (
  'c6b8d90b-9a77-4073-8cb1-8a36a5cd509d', '00000000-0000-4000-a000-000000000001',
  'Manual Assembly', 'Hand assembly, collating, packaging',
  'per_hour', 25, 0, 100,
  false, false, 0, 0,
  0, 1,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_labor (
  id, organization_id, name, description,
  charge_basis, hourly_cost, initial_setup_fee, markup_percent,
  is_pre_press, is_fixed_charge, fixed_charge_amount, fixed_charge_cost,
  minimum_charge, output_per_hour,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  created_at, updated_at
) VALUES (
  'b315d092-b7a8-4b8c-907d-e52785d6bff9', '00000000-0000-4000-a000-000000000001',
  'Fulfillment', 'Kitting, packaging, and shipping prep',
  'per_hour', 25, 5, 100,
  false, false, 0, 0,
  0, 1,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 31. Labor ↔ Group Assignments ─────────────────────────────────────────
INSERT INTO labor_group_assignments (labor_id, group_id, created_at, updated_at)
VALUES ('e8b43159-aed4-4ab5-9b39-e95a68c73808', '20a8317d-8d39-40f0-96de-9577946063a0', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_group_assignments (labor_id, group_id, created_at, updated_at)
VALUES ('400f4560-f99a-45ad-af02-b5fbbe8dbf21', '803a6ead-433f-4b97-aafd-25133ef3736a', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_group_assignments (labor_id, group_id, created_at, updated_at)
VALUES ('c6b8d90b-9a77-4073-8cb1-8a36a5cd509d', '92b80bb9-aa80-4688-bc2f-60077df5588f', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_group_assignments (labor_id, group_id, created_at, updated_at)
VALUES ('b315d092-b7a8-4b8c-907d-e52785d6bff9', '92b80bb9-aa80-4688-bc2f-60077df5588f', now(), now())
ON CONFLICT DO NOTHING;

-- ── 32. Labor ↔ Category Assignments ──────────────────────────────────────
INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('e8b43159-aed4-4ab5-9b39-e95a68c73808', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('e8b43159-aed4-4ab5-9b39-e95a68c73808', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('e8b43159-aed4-4ab5-9b39-e95a68c73808', '9964f762-4764-49b6-9109-fd96136c6da2', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('400f4560-f99a-45ad-af02-b5fbbe8dbf21', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('c6b8d90b-9a77-4073-8cb1-8a36a5cd509d', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('c6b8d90b-9a77-4073-8cb1-8a36a5cd509d', '9964f762-4764-49b6-9109-fd96136c6da2', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('b315d092-b7a8-4b8c-907d-e52785d6bff9', '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('b315d092-b7a8-4b8c-907d-e52785d6bff9', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO labor_category_assignments (labor_id, category_id, created_at, updated_at)
VALUES ('b315d092-b7a8-4b8c-907d-e52785d6bff9', '9964f762-4764-49b6-9109-fd96136c6da2', now(), now())
ON CONFLICT DO NOTHING;

-- ── 33. Brokered Groups ───────────────────────────────────────────────────
INSERT INTO brokered_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '16e07df1-66b7-4c0a-a9de-b84ba3c3ec4c', '00000000-0000-4000-a000-000000000001',
  'Outsourced Print', 'Print jobs sent to outside vendors',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO brokered_groups (
  id, organization_id, name, description, created_at, updated_at
) VALUES (
  '2a817c37-59ea-4f2a-abc3-918752eb23f7', '00000000-0000-4000-a000-000000000001',
  'Specialty Services', 'Embroidery, promotional products, specialty finishing',
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 34. Pricing Brokered ──────────────────────────────────────────────────
INSERT INTO pricing_brokered (
  id, organization_id, name, description,
  cost_basis, unit_cost, initial_setup_fee, markup_percent,
  vendor_id, vendor_name,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  created_at, updated_at
) VALUES (
  'd9036def-4ce2-42ab-ae15-22c50c90cb6e', '00000000-0000-4000-a000-000000000001',
  'Banners (Vendor)', 'Outsourced banner printing',
  'per_sqft', 3.5, 10, 50,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_brokered (
  id, organization_id, name, description,
  cost_basis, unit_cost, initial_setup_fee, markup_percent,
  vendor_id, vendor_name,
  pricing_mode, sell_rate, sell_rate_tiers,
  auto_add_category_ids, notes,
  created_at, updated_at
) VALUES (
  'ddf08ef0-9a1b-4192-8cc9-b78d138bd7e4', '00000000-0000-4000-a000-000000000001',
  'Embroidery', 'Outsourced embroidery services',
  'per_unit', 8, 25, 40,
  NULL, NULL,
  NULL, NULL, '[]'::jsonb,
  '{}'::uuid[], NULL,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 35. Brokered ↔ Group Assignments ──────────────────────────────────────
INSERT INTO brokered_group_assignments (brokered_id, group_id, created_at, updated_at)
VALUES ('d9036def-4ce2-42ab-ae15-22c50c90cb6e', '16e07df1-66b7-4c0a-a9de-b84ba3c3ec4c', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO brokered_group_assignments (brokered_id, group_id, created_at, updated_at)
VALUES ('ddf08ef0-9a1b-4192-8cc9-b78d138bd7e4', '2a817c37-59ea-4f2a-abc3-918752eb23f7', now(), now())
ON CONFLICT DO NOTHING;

-- ── 36. Brokered ↔ Category Assignments ───────────────────────────────────
INSERT INTO brokered_category_assignments (brokered_id, category_id, created_at, updated_at)
VALUES ('d9036def-4ce2-42ab-ae15-22c50c90cb6e', '9fc1c20f-0ebd-4fec-98e8-5797fed53934', now(), now())
ON CONFLICT DO NOTHING;
INSERT INTO brokered_category_assignments (brokered_id, category_id, created_at, updated_at)
VALUES ('ddf08ef0-9a1b-4192-8cc9-b78d138bd7e4', '9964f762-4764-49b6-9109-fd96136c6da2', now(), now())
ON CONFLICT DO NOTHING;

-- ── 37. Product Templates ─────────────────────────────────────────────────
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  '36555c07-7e9a-426e-9812-8bb7f8032afc', '00000000-0000-4000-a000-000000000001',
  'Business Cards', 'digital_print', '🃏', 'Standard 3.5" x 2" business cards, full color both sides',
  '{"productFamily":"digital_print","description":"Business Cards - Full Color 2/2","width":3.5,"height":2,"unit":"each","quantity":500,"markup":45,"materialId":"m12","materialName":"14pt C2S Card Stock"}'::jsonb, true, 142,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  'bcd32c5e-29c6-4a03-a373-9220fd533da5', '00000000-0000-4000-a000-000000000001',
  'Postcards 4x6', 'digital_print', '📮', '4x6 full color postcard, 100lb gloss cover',
  '{"productFamily":"digital_print","description":"Postcards 4x6 - Full Color","width":6,"height":4,"unit":"each","quantity":500,"markup":45}'::jsonb, true, 98,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  '385a51fb-d8b4-4c40-b414-e04bb980939a', '00000000-0000-4000-a000-000000000001',
  'Postcards 5x8', 'digital_print', '📮', '5x8 full color postcard, 100lb gloss cover',
  '{"productFamily":"digital_print","description":"Postcards 5x8 - Full Color","width":8,"height":5,"unit":"each","quantity":500,"markup":45}'::jsonb, true, 76,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  'd79fd3aa-2a0b-48ef-bd7d-2808e8cbbe3a', '00000000-0000-4000-a000-000000000001',
  'Yard Signs', 'rigid_sign', '🪧', '18x24 Coroplast yard sign, double-sided',
  '{"productFamily":"rigid_sign","description":"Yard Signs 18x24 - Coroplast","width":24,"height":18,"unit":"each","quantity":10,"markup":60,"materialId":"m5","materialName":"4mm White Coroplast"}'::jsonb, true, 76,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  'f65fc46a-1ddd-4190-a7ea-23c08b19f687', '00000000-0000-4000-a000-000000000001',
  'Vinyl Banner', 'wide_format', '🎌', 'Standard 3x6 vinyl banner with hemming and grommets',
  '{"productFamily":"wide_format","description":"Vinyl Banner 3x6 - 13oz Scrim","width":72,"height":36,"unit":"each","quantity":1,"markup":55,"materialId":"m8","materialName":"13oz Scrim Banner"}'::jsonb, true, 88,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  'c4855849-5c21-486d-b0e7-b4fa6e978ef4', '00000000-0000-4000-a000-000000000001',
  'Flyers 8.5x11', 'digital_print', '📄', 'Letter size single or double-sided flyers',
  '{"productFamily":"digital_print","description":"Flyers 8.5x11 - Full Color","width":8.5,"height":11,"unit":"each","quantity":250,"markup":40}'::jsonb, false, 112,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  'd1beb669-02fa-49d6-abba-41d687077f80', '00000000-0000-4000-a000-000000000001',
  'Step & Repeat', 'wide_format', '🏆', '8x8 step & repeat backdrop, standard event size',
  '{"productFamily":"wide_format","description":"Step & Repeat Backdrop 8x8","width":96,"height":96,"unit":"each","quantity":1,"markup":60,"materialId":"m8","materialName":"13oz Scrim Banner"}'::jsonb, true, 43,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  '89e19f0b-b7cc-4069-baec-73760c8aea67', '00000000-0000-4000-a000-000000000001',
  'Foam Board Sign', 'rigid_sign', '🪟', '1/2" foam board sign, various sizes',
  '{"productFamily":"rigid_sign","description":"Foam Board Sign - 1/2\"","width":24,"height":36,"unit":"each","quantity":1,"markup":55,"materialId":"m9","materialName":"1/2\" White Foam Board"}'::jsonb, false, 31,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  '015c64fc-1c0c-4f06-9e38-5fd2fbd78b73', '00000000-0000-4000-a000-000000000001',
  'T-Shirt Screen Print', 'apparel', '👕', '1-color screen print on Gildan tee',
  '{"productFamily":"apparel","description":"T-Shirts - 1 Color Screen Print","unit":"each","quantity":24,"markup":80,"materialId":"m7","materialName":"Gildan 5000 T-Shirt"}'::jsonb, true, 55,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  'c1e78e20-49b3-4c86-a9be-ca2d206f5825', '00000000-0000-4000-a000-000000000001',
  'Window Decal', 'wide_format', '🔲', 'Clear or white vinyl window decal',
  '{"productFamily":"wide_format","description":"Window Decal - Clear Vinyl","unit":"sqft","quantity":2,"markup":65,"materialId":"m3","materialName":"3M IJ180 White Vinyl"}'::jsonb, false, 28,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  '3c2d1b6f-d3cb-456f-b00f-92c4e641057d', '00000000-0000-4000-a000-000000000001',
  'Brochure Trifold', 'digital_print', '📑', '8.5x11 trifold brochure full color',
  '{"productFamily":"digital_print","description":"Trifold Brochure 8.5x11 - Full Color","width":8.5,"height":11,"unit":"each","quantity":250,"markup":42}'::jsonb, true, 67,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO product_templates (
  id, organization_id, name, product_family, icon, description,
  default_line_item, is_favorite, usage_count, created_at, updated_at
) VALUES (
  '6589b7af-2dd1-4bd7-9884-ad9c6476f6dd', '00000000-0000-4000-a000-000000000001',
  'Vehicle Wrap', 'wide_format', '🚗', 'Partial or full vehicle wrap - vinyl',
  '{"productFamily":"wide_format","description":"Vehicle Wrap - Cast Vinyl","unit":"sqft","quantity":80,"markup":65,"materialId":"m3","materialName":"3M IJ180 White Vinyl"}'::jsonb, false, 19,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 38. Pricing Templates ─────────────────────────────────────────────────
INSERT INTO pricing_templates (
  id, organization_id, name,
  category_id, category_name, product_id, product_name,
  quantity, final_width, final_height,
  material_id, material_name, equipment_id, equipment_name,
  color, sides, folding,
  is_favorite, usage_count, created_at, updated_at
) VALUES (
  'e80b2eaa-d335-4479-94a7-038506e3cdda', '00000000-0000-4000-a000-000000000001',
  'Business Cards — 1000 Color 2-Sided',
  '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', 'Digital Press',
  '573e8667-0a93-4ee9-9e19-55a210c29e8c', 'Business Cards',
  1000, 3.5, 2,
  NULL, 'Uncoated Cougar Cover 130# Super Smooth',
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', 'Ricoh 9200',
  'Color', 'Double', NULL,
  true, 84,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_templates (
  id, organization_id, name,
  category_id, category_name, product_id, product_name,
  quantity, final_width, final_height,
  material_id, material_name, equipment_id, equipment_name,
  color, sides, folding,
  is_favorite, usage_count, created_at, updated_at
) VALUES (
  '1261b093-7fc4-4815-86cf-89de0c84f005', '00000000-0000-4000-a000-000000000001',
  'Postcards 5x7 — Color 2-Sided',
  '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', 'Digital Press',
  'e5f506b2-867f-4757-8954-4ccff814d3fe', 'Postcards',
  1000, 5, 7,
  NULL, 'Gloss 100# Cover Blazer N64750',
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', 'Ricoh 9200',
  'Color', 'Double', NULL,
  true, 56,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_templates (
  id, organization_id, name,
  category_id, category_name, product_id, product_name,
  quantity, final_width, final_height,
  material_id, material_name, equipment_id, equipment_name,
  color, sides, folding,
  is_favorite, usage_count, created_at, updated_at
) VALUES (
  '7852d125-f5d0-447b-8db2-a5ec3f3133e1', '00000000-0000-4000-a000-000000000001',
  'Tri-Fold Brochure — 1000 Color',
  '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', 'Digital Press',
  '6261bcfa-81b8-4c59-a29b-de5bc337466e', 'Brochures',
  1000, 8.5, 11,
  NULL, 'Gloss 80# Gloss Text 12x18',
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', 'Ricoh 9200',
  'Color', 'Double', 'Tri-Fold',
  true, 43,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);
INSERT INTO pricing_templates (
  id, organization_id, name,
  category_id, category_name, product_id, product_name,
  quantity, final_width, final_height,
  material_id, material_name, equipment_id, equipment_name,
  color, sides, folding,
  is_favorite, usage_count, created_at, updated_at
) VALUES (
  '83ed23e4-4a7c-4ac1-ad00-43061a24710b', '00000000-0000-4000-a000-000000000001',
  'Sell Sheets 8.5x11 — 500 Color',
  '1aa2b24c-2b5a-4318-9710-63f6bd0bc369', 'Digital Press',
  'c88ad6f7-1159-4800-a8d2-44669c14b11a', 'Sell Sheet',
  500, 8.5, 11,
  NULL, 'Gloss Text 100# 13x19',
  'bcc07f9a-a47c-46ab-9e65-e4d6ff3769c6', 'Ricoh 9200',
  'Color', 'Single', NULL,
  false, 31,
  '2024-01-01T00:00:00Z'::timestamptz, now()
);

-- ── 39. Quotes ────────────────────────────────────────────────────────────
INSERT INTO quotes (
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
  'e2cdfd4c-9112-442a-b929-6bbd7d2a3252', '00000000-0000-4000-a000-000000000001', 'Q000001', 'hot',
  '58a41a31-befb-4de6-bd18-cd2cec352538', 'Pixels on Target LLC', NULL, NULL,
  'Annual Marketing Package - Q1 2026', NULL,
  1185.28, 0.07, 82.97, 1268.25,
  NULL, '2026-04-30'::date,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', 'a85975c7-0c2c-417c-8dcd-2fd0e15d6089',
  NULL, NULL, '{}'::text[],
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-20T00:00:00Z'::timestamptz, '2026-03-25T00:00:00Z'::timestamptz
);
INSERT INTO quotes (
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
  '5a0b7edf-f717-4b2b-9244-476e20919f1d', '00000000-0000-4000-a000-000000000001', 'Q000002', 'pending',
  '3df43acc-22e3-4901-b7b0-fca4a74cf782', 'Strategic Solutions Network', NULL, NULL,
  'Conference Signage Package', NULL,
  1959.2, 0.07, 137.14, 2096.34,
  NULL, '2026-04-15'::date,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, '{}'::text[],
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-22T00:00:00Z'::timestamptz, '2026-03-22T00:00:00Z'::timestamptz
);
INSERT INTO quotes (
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
  '46397607-1d9c-42fc-9cd3-c4f141185f4f', '00000000-0000-4000-a000-000000000001', 'Q000003', 'won',
  '5671fd58-f090-4098-a828-9bc3e213c9a4', '4eon', NULL, NULL,
  'Event Booth Package - Spring Expo', NULL,
  1139.25, 0, 0, 1139.25,
  NULL, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, '{}'::text[],
  '1243dce4-40b0-4e7d-823e-5a008fea786d', NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-10T00:00:00Z'::timestamptz, '2026-03-12T00:00:00Z'::timestamptz
);
INSERT INTO quotes (
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
  'c93d9c1e-38aa-488c-ae6b-86c4b6b37e87', '00000000-0000-4000-a000-000000000001', 'Q000004', 'cold',
  '75b71841-535c-476e-952a-b16b75988b1a', 'Leon Marketing', NULL, NULL,
  'Wayfinding Signage System', NULL,
  3930, 0.07, 275.1, 4205.1,
  NULL, '2026-04-01'::date,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', 'a85975c7-0c2c-417c-8dcd-2fd0e15d6089',
  NULL, NULL, '{}'::text[],
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-05T00:00:00Z'::timestamptz, '2026-03-08T00:00:00Z'::timestamptz
);
INSERT INTO quotes (
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
  '8b6e6e8f-bb05-4b3b-a7f0-db1b3cbdd9c3', '00000000-0000-4000-a000-000000000001', 'Q000005', 'pending',
  '9a8c6049-b485-413f-b772-973f097bdbd5', 'MP Integrative Marketing', NULL, NULL,
  'Staff Uniform T-Shirts + Promo', NULL,
  952.2, 0.07, 66.65, 1018.85,
  NULL, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, '{}'::text[],
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-25T00:00:00Z'::timestamptz, '2026-03-25T00:00:00Z'::timestamptz
);

-- ── 40. Quote Line Items ──────────────────────────────────────────────────
INSERT INTO quote_line_items (
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
  '252f8d80-873c-48b3-9969-9cc6837e7a79', '00000000-0000-4000-a000-000000000001', 'e2cdfd4c-9112-442a-b929-6bbd7d2a3252', 0,
  'digital_print', 'Business Cards - Full Color 2/2', 1000, 'each',
  3.5, 2,
  '6efad76f-6466-4a0f-8963-ca635db43956', '14pt C2S Card Stock', 90,
  '6fdfada1-355a-49dd-90cc-006ef59d2b40', 'HP Indigo 7K', NULL, 25,
  0.5, 45, 22.5,
  NULL, NULL,
  25, 0, 162.5, 45, 235.63,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  now(), now()
);
INSERT INTO quote_line_items (
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
  'eaf3bfcd-6472-458b-8ba3-4635de02a1bb', '00000000-0000-4000-a000-000000000001', 'e2cdfd4c-9112-442a-b929-6bbd7d2a3252', 1,
  'digital_print', 'Postcards 5x8 - Full Color', 2500, 'each',
  8, 5,
  'd53f9144-d685-4d6b-ba6d-4a769f02771b', '100lb Gloss Cover', 200,
  '6fdfada1-355a-49dd-90cc-006ef59d2b40', 'HP Indigo 7K', NULL, 55,
  1, 45, 45,
  NULL, NULL,
  25, 0, 325, 45, 471.25,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  now(), now()
);
INSERT INTO quote_line_items (
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
  '53c65de5-78c1-4c9f-86ee-9540273916f5', '00000000-0000-4000-a000-000000000001', 'e2cdfd4c-9112-442a-b929-6bbd7d2a3252', 2,
  'wide_format', 'Step & Repeat Backdrop 8x8', 1, 'each',
  96, 96,
  '51e5207e-feb5-4dd7-80d3-b1ef4f83480a', '13oz Scrim Banner', 144,
  '83e73706-157d-4b4b-835b-73351b035ea0', 'HP Latex 800W', NULL, 65,
  2, 45, 90,
  NULL, NULL,
  0, 0, 299, 60, 478.4,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  now(), now()
);
INSERT INTO quote_line_items (
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
  'c01e3237-9d1e-498b-b304-9c36f89ca696', '00000000-0000-4000-a000-000000000001', '5a0b7edf-f717-4b2b-9244-476e20919f1d', 0,
  'wide_format', 'Vinyl Banners 4x8 with Grommets', 8, 'each',
  96, 48,
  '51e5207e-feb5-4dd7-80d3-b1ef4f83480a', '13oz Scrim Banner', 384,
  '83e73706-157d-4b4b-835b-73351b035ea0', 'HP Latex 800W', NULL, 120,
  4, 45, 180,
  NULL, NULL,
  0, 0, 684, 55, 1060.2,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  now(), now()
);
INSERT INTO quote_line_items (
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
  '62030bbd-0100-4e88-9e7d-ddd979bf5cbc', '00000000-0000-4000-a000-000000000001', '5a0b7edf-f717-4b2b-9244-476e20919f1d', 1,
  'rigid_sign', 'Foam Board Signs 24x36', 12, 'each',
  24, 36,
  '531b9ff6-4171-4312-bbe3-ab8d989e6ca4', '1/2" White Foam Board', 360,
  '83e73706-157d-4b4b-835b-73351b035ea0', 'HP Latex 800W', NULL, 85,
  3, 45, 135,
  NULL, NULL,
  0, 0, 580, 55, 899,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  now(), now()
);
INSERT INTO quote_line_items (
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
  '86beb6c3-31e1-4116-833b-bff7c2e852f6', '00000000-0000-4000-a000-000000000001', '46397607-1d9c-42fc-9cd3-c4f141185f4f', 0,
  'wide_format', 'Booth Wrap - 3 Faces Full Color', 1, 'sqft',
  NULL, NULL,
  'b7a183ff-3adb-483a-aca7-382bdfecc59a', '3M IJ180 White Vinyl', 340,
  '83e73706-157d-4b4b-835b-73351b035ea0', 'HP Latex 800W', NULL, 120,
  5, 55, 275,
  NULL, NULL,
  0, 0, 735, 55, 1139.25,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  now(), now()
);
INSERT INTO quote_line_items (
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
  '834d7b48-b05f-47d2-abe8-d1e470aebe17', '00000000-0000-4000-a000-000000000001', 'c93d9c1e-38aa-488c-ae6b-86c4b6b37e87', 0,
  'rigid_sign', 'Aluminum Dibond Signs 24x18', 20, 'each',
  24, 18,
  'c9f0e01b-40fd-49ae-b94d-41861fa34202', '1/8" Aluminum Dibond', 1680,
  '83e73706-157d-4b4b-835b-73351b035ea0', 'HP Latex 800W', NULL, 280,
  12, 55, 660,
  NULL, NULL,
  0, 0, 2620, 50, 3930,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  now(), now()
);
INSERT INTO quote_line_items (
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
  '28817311-5e17-4bdd-8ad6-e2d441920c9d', '00000000-0000-4000-a000-000000000001', '8b6e6e8f-bb05-4b3b-a7f0-db1b3cbdd9c3', 0,
  'apparel', 'T-Shirts - 2 Color Front Screen Print', 72, 'each',
  NULL, NULL,
  '12610aa9-7a3f-424d-9233-7eb8ef16bd86', 'Gildan 5000 T-Shirt', 324,
  NULL, NULL, NULL, NULL,
  3, 45, 135,
  NULL, NULL,
  70, 0, 529, 80, 952.2,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  now(), now()
);

-- ── 41. Orders ────────────────────────────────────────────────────────────
INSERT INTO orders (
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
  '1243dce4-40b0-4e7d-823e-5a008fea786d', '00000000-0000-4000-a000-000000000001', 'O000001', 'in_progress',
  '46397607-1d9c-42fc-9cd3-c4f141185f4f', 'Q000003',
  '5671fd58-f090-4098-a828-9bc3e213c9a4', '4eon', NULL, NULL,
  'Event Booth Package - Spring Expo', NULL,
  1139.25, 0, 0, 1139.25,
  '2026-03-31'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee', '55596d00-661a-412b-b2e2-5a09ae88e5e1', 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-12T00:00:00Z'::timestamptz, '2026-03-25T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '79b14dea-a281-40b3-bf49-71ca1516ecf1', '00000000-0000-4000-a000-000000000001', 'O000002', 'in_progress',
  NULL, NULL,
  '58a41a31-befb-4de6-bd18-cd2cec352538', 'Pixels on Target LLC', NULL, NULL,
  'Trade Show Graphics Package', NULL,
  635.15, 0.07, 44.46, 679.61,
  '2026-03-28'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', 'a85975c7-0c2c-417c-8dcd-2fd0e15d6089',
  'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee', '9831c6d8-7316-40e3-baa7-10d0debbcdec', 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-18T00:00:00Z'::timestamptz, '2026-03-22T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '1d60f1f8-6d38-424f-a94e-6dffbf5c04b0', '00000000-0000-4000-a000-000000000001', 'O000003', 'completed',
  NULL, NULL,
  '3df43acc-22e3-4901-b7b0-fca4a74cf782', 'Strategic Solutions Network', NULL, NULL,
  'Business Cards - Executive Team', NULL,
  137.75, 0.07, 9.64, 147.39,
  NULL, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  '09cda956-188d-47a8-993d-35def9970ee4', '673164ff-e16a-4951-9001-73a0979fbe7a', 'order',
  NULL, NULL, NULL,
  '269f304e-24c0-4f0f-8dae-f7e90cf4314b',
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-01T00:00:00Z'::timestamptz, '2026-03-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '246a6a18-80cc-44c2-9025-9364cc933dea', '00000000-0000-4000-a000-000000000001', 'O000004', 'on_hold',
  NULL, NULL,
  '80761f54-3852-42d4-b1e0-49b359e0f612', 'Worldwide Business Research Limited', NULL, NULL,
  'Conference Backdrop - Art Hold', NULL,
  456, 0.07, 31.92, 487.92,
  '2026-04-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  'c58fa7e1-c2e9-49e1-ac1e-ae91476b3aee', 'dec70c80-9cfe-4244-88fb-7f0473367989', 'order',
  NULL, 'On hold — waiting for customer to approve final artwork. Sara confirmed ETA April 3.', NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-20T00:00:00Z'::timestamptz, '2026-03-24T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'e1d1963f-077d-46aa-a581-cc6fe1515e32', '00000000-0000-4000-a000-000000000001', 'O097402', 'completed',
  NULL, NULL,
  'c2a67a1f-f101-4ca8-93cc-75d804823848', 'A2B Destination Marketing', NULL, NULL,
  'Africa Portfolio Flyer -  25.5" x 11  folded to 8.5 x 11 - Color two sides', NULL,
  475, 0.07, 33.25, 508.25,
  '2026-01-28'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-05-07T00:00:00Z'::timestamptz, '2026-01-28T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'c3a2d83e-f955-4857-aa6c-08ee1e0353aa', '00000000-0000-4000-a000-000000000001', 'O098270', 'completed',
  NULL, NULL,
  'b4471466-d68e-49f2-bfbc-355b85721bf2', 'Savel, Inc.', NULL, NULL,
  'Savel Tags -Blank  4"x 3" Black and White Single Sided Tags on 130# Cougar Cards', NULL,
  314.96, 0.07, 22.05, 337.01,
  '2025-12-19'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-08-20T00:00:00Z'::timestamptz, '2025-12-19T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '43d46e27-761d-4d5d-aad1-33cac21e62a9', '00000000-0000-4000-a000-000000000001', 'O098996', 'completed',
  NULL, NULL,
  '0c3e0de0-b311-4556-a8dc-95dd7605d3e2', 'Warner Bros. Discovery', NULL, NULL,
  'EVA Outdoor Waterproof Large Capacity Hole Bag', NULL,
  2280, 0.07, 159.6, 2439.6,
  '2026-01-12'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-05T00:00:00Z'::timestamptz, '2026-01-12T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'e0b414a0-5f19-4ad6-a7bf-0f8118a1978b', '00000000-0000-4000-a000-000000000001', 'O099020', 'completed',
  NULL, NULL,
  '32db0e6b-9aa9-4141-b5f4-fa41876a4dd0', 'The Adolphus, Autograph Collection', NULL, NULL,
  'Custom Made Cookie/Pastry Holder', NULL,
  4250, 0.07, 297.5, 4547.5,
  '2025-12-30'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-07T00:00:00Z'::timestamptz, '2025-12-30T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '08030d6f-fdf6-43cb-81e4-9acc3bd0a910', '00000000-0000-4000-a000-000000000001', 'O099032', 'completed',
  NULL, NULL,
  '58a41a31-befb-4de6-bd18-cd2cec352538', 'Leon Marketing', NULL, NULL,
  'Bilingual Brochure Prevention 8.5 x 5.5" - 16 pages self cover - Gloss Text 100#', NULL,
  2975, 0.07, 208.25, 3183.25,
  '2025-12-03'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-10T00:00:00Z'::timestamptz, '2025-12-03T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '30cbe658-085e-49ff-862c-d016690dc5ac', '00000000-0000-4000-a000-000000000001', 'O099037', 'completed',
  NULL, NULL,
  '58a41a31-befb-4de6-bd18-cd2cec352538', 'Leon Marketing', NULL, NULL,
  'Bilingual Brochure 50 Male - 8.5 x 5.5" - 16 pages self cover - Gloss Text 100# ', NULL,
  2975, 0.07, 208.25, 3183.25,
  '2025-12-03'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-10T00:00:00Z'::timestamptz, '2025-12-03T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '79400c7b-e825-4189-9d8e-a404dfda1bcd', '00000000-0000-4000-a000-000000000001', 'O099069', 'completed',
  NULL, NULL,
  '8775168c-f6c4-4dc0-b74c-ea725c225c9d', 'BNP Paribas', NULL, NULL,
  '16'' x 8'' Light Box, Single Sided', NULL,
  4500, 0.07, 315, 4815,
  '2025-12-02'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-13T00:00:00Z'::timestamptz, '2025-12-02T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '7d0db3ab-3630-42a9-938b-8892dd3b19c9', '00000000-0000-4000-a000-000000000001', 'O099070', 'completed',
  NULL, NULL,
  'c2b795a4-fb20-4f18-88fb-ad816c297e69', 'Gottliebs Quickway', NULL, NULL,
  '2025 Calendar - 11 x 17 cak Cover with 8.25 x 11 13 pages pads- drill hole', NULL,
  3485, 0.07, 243.95, 3728.95,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-13T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'd3e9c84c-98cd-432c-96a9-58bdd873385d', '00000000-0000-4000-a000-000000000001', 'O099090', 'completed',
  NULL, NULL,
  'fd678fec-980b-4def-87bb-60ff3b479323', 'Leon Health', NULL, NULL,
  'Leon Health Inc- Claim Account Check order', NULL,
  3259.74, 0.07, 228.18, 3487.92,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-14T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '9b959c67-caec-45af-b91b-266057274c40', '00000000-0000-4000-a000-000000000001', 'O099100', 'completed',
  NULL, NULL,
  '664cb9ec-84d7-4f2b-8d3a-ebe349b136ea', 'Empower IT Group', NULL, NULL,
  'Ball Point Pen with LED and Pointer', NULL,
  870, 0.07, 60.9, 930.9,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-17T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '9a88523a-5939-4032-bce9-e20d52adb3b0', '00000000-0000-4000-a000-000000000001', 'O099101', 'completed',
  NULL, NULL,
  '664cb9ec-84d7-4f2b-8d3a-ebe349b136ea', 'Empower IT Group', NULL, NULL,
  'Embroidery Decoration - Left Chest', NULL,
  171, 0.07, 11.97, 182.97,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-17T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '4c711d13-8df2-4123-877f-d630e360322e', '00000000-0000-4000-a000-000000000001', 'O099108', 'completed',
  NULL, NULL,
  '5671fd58-f090-4098-a828-9bc3e213c9a4', 'Strategic Solutions Network', NULL, NULL,
  'Shipping and drop-off fee', NULL,
  2582, 0.07, 180.74, 2762.74,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-18T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '233dce74-920a-460d-bc18-222478f3e41f', '00000000-0000-4000-a000-000000000001', 'O099114', 'completed',
  NULL, NULL,
  'cb8bb3aa-0d6b-4729-8ef1-ccc650cee4c5', 'Bee Watch USA', NULL, NULL,
  'USPS - Standard Class', NULL,
  996.46, 0.07, 69.75, 1066.21,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-18T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'aac00152-2a64-4e28-8a0d-a4f29f995b20', '00000000-0000-4000-a000-000000000001', 'O099131', 'completed',
  NULL, NULL,
  'd81fe12c-603f-4195-ada1-492e2b5e7561', 'Gunther Motor Company of Plantation', NULL, NULL,
  'Used Cars Stock Card-4" x 4.375"- White  Paper - Black Ink - Single Sided', NULL,
  100, 0.07, 7, 107,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-20T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '838e2cf4-8d0b-45d4-bea1-72d6d671be77', '00000000-0000-4000-a000-000000000001', 'O099134', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'Remove existing signs, delivery and Installation', NULL,
  665, 0.07, 46.55, 711.55,
  '2025-12-04'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-20T00:00:00Z'::timestamptz, '2025-12-04T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'bce2d926-2c2d-4a2d-9381-1b3c707fcbf7', '00000000-0000-4000-a000-000000000001', 'O099139', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'P110725-10516792051 - Counter Cards 5"x7"', NULL,
  52, 0.07, 3.64, 55.64,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-21T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'f18ff11a-dd42-4d0b-bedb-0d285514f4af', '00000000-0000-4000-a000-000000000001', 'O099150', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'Swatch Kit Set', NULL,
  0, 0.07, 0, 0,
  '2025-12-03'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-21T00:00:00Z'::timestamptz, '2025-12-03T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '38cc6070-b35d-4548-b739-29a092f35d78', '00000000-0000-4000-a000-000000000001', 'O099156', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'Delivery and Installation including SEG graphics suplied by 4EON', NULL,
  223, 0.07, 15.61, 238.61,
  '2025-12-04'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-23T00:00:00Z'::timestamptz, '2025-12-04T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '65c0ee19-4db8-4d38-8aa9-9ce8d06af425', '00000000-0000-4000-a000-000000000001', 'O099159', 'completed',
  NULL, NULL,
  'd89e99a9-6f32-4b81-af6d-40dedac8f1f8', 'Indigo Events', NULL, NULL,
  'Labels', NULL,
  210, 0.07, 14.7, 224.7,
  '2025-12-02'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-24T00:00:00Z'::timestamptz, '2025-12-02T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '01dd56cc-0a03-4ea7-895a-844fae1a07e3', '00000000-0000-4000-a000-000000000001', 'O099167', 'completed',
  NULL, NULL,
  '023358d8-98ab-4328-816c-a56772f6eb8c', 'Cliff Pools', NULL, NULL,
  'Presentation Folders, UV Coated, Two Pockets, BC Slits on Left Side', NULL,
  2785, 0.07, 194.95, 2979.95,
  '2025-12-17'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-25T00:00:00Z'::timestamptz, '2025-12-17T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'c33e9d50-9ed6-4249-9487-f2f85ad4627c', '00000000-0000-4000-a000-000000000001', 'O099175', 'completed',
  NULL, NULL,
  '0a346f3c-a895-4639-851a-dd061a425091', 'Network Cargo', NULL, NULL,
  '2026 Desktop Calendars - Network Cargo', NULL,
  3300, 0.07, 231, 3531,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-26T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'd622ab1f-b945-454d-8a51-2b6cf66fdc13', '00000000-0000-4000-a000-000000000001', 'O099178', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'YSL/Gucci: Poster Cardstock- 11" x 14" - Color One side', NULL,
  608, 0.07, 42.56, 650.56,
  '2025-12-04'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-26T00:00:00Z'::timestamptz, '2025-12-04T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '37e88552-f03d-480c-a347-06fea41ee21e', '00000000-0000-4000-a000-000000000001', 'O099182', 'completed',
  NULL, NULL,
  '80761f54-3852-42d4-b1e0-49b359e0f612', 'Smile Performance LLC / EIN 372072426', NULL, NULL,
  'Flyers 8.5 x 5.5 - Gloss text 100 - Color two side-BigFix AEX', NULL,
  1197, 0.07, 83.79, 1280.79,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-01T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '7dfee094-ef3b-49e5-8efe-7294c480415d', '00000000-0000-4000-a000-000000000001', 'O099184', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'POV Dolphin Mall -  Duratrans Provided by Client delivery and Installation', NULL,
  4325, 0.07, 302.75, 4627.75,
  '2025-12-17'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-01T00:00:00Z'::timestamptz, '2025-12-17T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '724696ec-6c63-428c-9b1c-a3902f6b876f', '00000000-0000-4000-a000-000000000001', 'O099185', 'completed',
  NULL, NULL,
  '8775168c-f6c4-4dc0-b74c-ea725c225c9d', 'BNP Paribas', NULL, NULL,
  '16'' x 8'' Light Box, Single Sided - After Hours De-Install at 10:30 PM', NULL,
  750, 0.07, 52.5, 802.5,
  '2025-12-01'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-01T00:00:00Z'::timestamptz, '2025-12-01T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '97e6c9e7-0e28-4f46-a85f-c5ace0f2812f', '00000000-0000-4000-a000-000000000001', 'O099186', 'completed',
  NULL, NULL,
  '04004fc8-e88c-493c-8109-37c6575d1fe1', 'Adapt', NULL, NULL,
  'Custom Greeting Cards, Scored - Adapt Foundation', NULL,
  420, 0.07, 29.4, 449.4,
  '2025-12-03'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-02T00:00:00Z'::timestamptz, '2025-12-03T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '9f3f1c7c-c4ae-4e33-9d10-e68df128bbb4', '00000000-0000-4000-a000-000000000001', 'O099187', 'completed',
  NULL, NULL,
  'd9ef6103-cdeb-4cc2-896a-b8553ac0581c', 'The Graham Companies', NULL, NULL,
  'Postcard 6 x 4, 100# Uncoated Cover - Full Color - Single Sided', NULL,
  225, 0.07, 15.75, 240.75,
  '2025-12-03'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-02T00:00:00Z'::timestamptz, '2025-12-03T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '6575ef15-021a-4e80-9149-9b34a18e3f03', '00000000-0000-4000-a000-000000000001', 'O099188', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'S111425-10566782933 Store ID 214529 - Window Perf Cling TomFord 28.75" x 78.25" ', NULL,
  136, 0.07, 9.52, 145.52,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-02T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '15f7cc53-e6e6-4c95-ba6f-2edbbdd14c3d', '00000000-0000-4000-a000-000000000001', 'O099189', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'S111825-10589855171 Store ID 2137560049 - Window Perf Cling Guess&Marciano 39.5"', NULL,
  70, 0.07, 4.9, 74.9,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-02T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '358abcfb-5d00-461f-bdf2-af079f26a15c', '00000000-0000-4000-a000-000000000001', 'O099190', 'completed',
  NULL, NULL,
  '27a69d73-bab1-400a-a0ee-b837f1ab6daa', 'Urbano Society', NULL, NULL,
  'Magnets for shuttle bus 12" x 12', NULL,
  95, 0.07, 6.65, 101.65,
  '2025-12-03'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-02T00:00:00Z'::timestamptz, '2025-12-03T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'f089eccb-e989-4655-8644-4250f523b1e6', '00000000-0000-4000-a000-000000000001', 'O099195', 'completed',
  NULL, NULL,
  '27a69d73-bab1-400a-a0ee-b837f1ab6daa', 'Urbano Society', NULL, NULL,
  'Seating Cards - Personalized, Scored in half - Delivered Flat', NULL,
  140, 0.07, 9.8, 149.8,
  '2025-12-02'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-02T00:00:00Z'::timestamptz, '2025-12-02T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'd194673c-9e1a-4c51-ab11-e9c25f2e7939', '00000000-0000-4000-a000-000000000001', 'O099200', 'completed',
  NULL, NULL,
  '434ecdeb-6e21-44b5-b84d-e9e8b5845d65', 'Fan & Lighting World', NULL, NULL,
  'Fan & Lighting World - Invoice - 4 Part - Blak ink', NULL,
  2100, 0.07, 147, 2247,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-03T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '4eb83fc9-36b9-405d-9125-b9399339599d', '00000000-0000-4000-a000-000000000001', 'O099201', 'completed',
  NULL, NULL,
  'a867d521-8cfd-4118-9c5f-898b5021cf81', 'Ellie''s Army Foundation', NULL, NULL,
  'Reply card - 8.5 x 3.5 Full color One Side', NULL,
  1215, 0.07, 85.05, 1300.05,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-03T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'a2f34ecc-6794-48ba-b141-726cb25c8de7', '00000000-0000-4000-a000-000000000001', 'O099203', 'completed',
  NULL, NULL,
  '27a69d73-bab1-400a-a0ee-b837f1ab6daa', 'Urbano Society', NULL, NULL,
  'Dinner Prompts + Inteviews Qs - set of 4', NULL,
  35, 0.07, 2.45, 37.45,
  '2025-12-03'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-03T00:00:00Z'::timestamptz, '2025-12-03T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '71bdf03d-b692-40e9-8914-2e75cbdec19f', '00000000-0000-4000-a000-000000000001', 'O099204', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'Aventura - Foamboard  Double side 3/16"- 16" x 60" - Cartier Winter Campaign', NULL,
  140, 0.07, 9.8, 149.8,
  '2025-12-04'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-03T00:00:00Z'::timestamptz, '2025-12-04T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '175959c5-46ff-487e-bc00-cd94b54bd433', '00000000-0000-4000-a000-000000000001', 'O099205', 'completed',
  NULL, NULL,
  'cb8bb3aa-0d6b-4729-8ef1-ccc650cee4c5', 'Bee Watch USA', NULL, NULL,
  'Installation', NULL,
  505, 0.07, 35.35, 540.35,
  '2025-12-18'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-03T00:00:00Z'::timestamptz, '2025-12-18T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '265c601b-bf4b-453c-a566-51227bda1f5d', '00000000-0000-4000-a000-000000000001', 'O099206', 'completed',
  NULL, NULL,
  '58a41a31-befb-4de6-bd18-cd2cec352538', 'Leon Marketing', NULL, NULL,
  'Benefit Consultant  Business Cards 3.5 x 2 - Yaismary Gil', NULL,
  880, 0.07, 61.6, 941.6,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-03T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '95cd52fe-bb51-45e1-a31f-f219f543dc5e', '00000000-0000-4000-a000-000000000001', 'O099216', 'completed',
  NULL, NULL,
  'd81fe12c-603f-4195-ada1-492e2b5e7561', 'Gunther Motor Company of Plantation', NULL, NULL,
  '2025 CX5 Car Cards -3.5"X 4.25" - 65# Uncoated Cover Rocket RED- Black Ink - Sin', NULL,
  140, 0.07, 9.8, 149.8,
  '2025-12-15'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-04T00:00:00Z'::timestamptz, '2025-12-15T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '99fc19f4-2d7e-40f9-97f7-4f30d7a610bb', '00000000-0000-4000-a000-000000000001', 'O099224', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'Tom Ford - Cohens Production - Duratrans TF 37.96" x 61.96"', NULL,
  357, 0.07, 24.99, 381.99,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-05T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '6c703fb0-09ed-415d-a509-c59c6f00b196', '00000000-0000-4000-a000-000000000001', 'O099226', 'completed',
  NULL, NULL,
  '7be6efcb-b848-4697-856a-bc6ae6ce42b2', 'Pixels on Target LLC', NULL, NULL,
  'BC - Tina Boyles - Sales Operations & Compliance Specialist', NULL,
  70, 0.07, 4.9, 74.9,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-05T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'f76cedb2-c873-4089-9e2e-22218168df7b', '00000000-0000-4000-a000-000000000001', 'O099227', 'completed',
  NULL, NULL,
  '16d1601c-9546-4450-b8f5-abab00395d97', 'Poggesi USA', NULL, NULL,
  'Christmas Postcards - Uncoated', NULL,
  125, 0.07, 8.75, 133.75,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-05T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'cbf92814-042e-4fbf-b3ad-ce6359884218', '00000000-0000-4000-a000-000000000001', 'O099231', 'completed',
  NULL, NULL,
  '27a69d73-bab1-400a-a0ee-b837f1ab6daa', 'Urbano Society', NULL, NULL,
  'Business Cards - 3.5 x 2 - Dull cover 120# - Color both sides', NULL,
  55, 0.07, 3.85, 58.85,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-05T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '7e632830-91e9-44cf-9737-64d4816ed676', '00000000-0000-4000-a000-000000000001', 'O099233', 'completed',
  NULL, NULL,
  'fa2e5b64-fa33-470f-9f5f-9becf641162b', 'White Water Pool Guys', NULL, NULL,
  'EDDM Flyers 6.25"x9", 100# Gloss Cover, Full Color, Double Sided, Packs of 100', NULL,
  1975, 0.07, 138.25, 2113.25,
  '2025-12-23'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-05T00:00:00Z'::timestamptz, '2025-12-23T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '5da96c89-3397-4791-b875-de62ceb46815', '00000000-0000-4000-a000-000000000001', 'O099236', 'completed',
  NULL, NULL,
  '7be6efcb-b848-4697-856a-bc6ae6ce42b2', 'Pixels on Target LLC', NULL, NULL,
  'Water Bottle Decoration - Full Color Raised UV Sticker', NULL,
  1350, 0.07, 94.5, 1444.5,
  '2025-12-15'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-05T00:00:00Z'::timestamptz, '2025-12-15T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '171582d8-9f5c-423b-a2c1-b0d241e70c8e', '00000000-0000-4000-a000-000000000001', 'O099238', 'completed',
  NULL, NULL,
  'd81fe12c-603f-4195-ada1-492e2b5e7561', 'Gunther Motor Company of Plantation', NULL, NULL,
  'BC -  Kyle Mejia- Sales Associate - KIA', NULL,
  70, 0.07, 4.9, 74.9,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-05T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '18a7deb8-63c8-4fcf-9f0c-adca0e3f5f45', '00000000-0000-4000-a000-000000000001', 'O099242', 'completed',
  NULL, NULL,
  '1abb64df-c20d-4c37-a6f4-c3476121e405', 'Protocool', NULL, NULL,
  'Sales Orders (2 PART FORWARD) REFLEX BLUE/RED NUMBERING', NULL,
  445, 0.07, 31.15, 476.15,
  '2025-12-17'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-08T00:00:00Z'::timestamptz, '2025-12-17T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '5ed1643e-9bdc-435b-8aa9-1106678f0944', '00000000-0000-4000-a000-000000000001', 'O099249', 'completed',
  NULL, NULL,
  'b0349369-7c89-42b9-8e37-2d9f2b650402', 'Chen Moore', NULL, NULL,
  'BC -Hannah Ward - Engineer - Pensacola Template', NULL,
  59, 0.07, 4.13, 63.13,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-08T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '81def98b-90e2-47cb-965b-c38af9495b6c', '00000000-0000-4000-a000-000000000001', 'O099250', 'completed',
  NULL, NULL,
  '590ea43e-5b50-4471-8654-19c6e5cdbfee', 'Garland Food', NULL, NULL,
  'Mockup Labels - Adhesive Paper - Garlic Powder 8.5 oz', NULL,
  112, 0.07, 7.84, 119.84,
  '2025-12-18'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-08T00:00:00Z'::timestamptz, '2025-12-18T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '541c75e6-476f-4727-80f3-9f1743223322', '00000000-0000-4000-a000-000000000001', 'O099251', 'completed',
  NULL, NULL,
  'fd678fec-980b-4def-87bb-60ff3b479323', 'Leon Health', NULL, NULL,
  'Replacement Cards', NULL,
  5165.4, 0.07, 361.58, 5526.98,
  '2025-12-08'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-08T00:00:00Z'::timestamptz, '2025-12-08T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'c8920e9e-77d2-46f8-88c8-38c03590f2f1', '00000000-0000-4000-a000-000000000001', 'O099252', 'completed',
  NULL, NULL,
  'e3481828-fe70-49be-ac0c-a3a2fbe86800', 'Maxicon', NULL, NULL,
  'Gift Tag - Top Hole - 4/0', NULL,
  155, 0.07, 10.85, 165.85,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-08T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'ee0fc4ba-3375-45c7-83e6-c8f6327a28b9', '00000000-0000-4000-a000-000000000001', 'O099258', 'completed',
  NULL, NULL,
  'b0349369-7c89-42b9-8e37-2d9f2b650402', 'Chen Moore', NULL, NULL,
  'BC - Peter J. Sahwell - Associate Engineer- WPB Template', NULL,
  59, 0.07, 4.13, 63.13,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-08T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '032e43e1-df7e-404e-86f0-4cd80f774082', '00000000-0000-4000-a000-000000000001', 'O099259', 'completed',
  NULL, NULL,
  'ccdc0e9b-dd7a-475b-9880-c630d83d60ab', 'Leon Advertising', NULL, NULL,
  'Flower card English/ Spanish - 6 x 4 -  130 # Cover Uncoated - Ingles / Español ', NULL,
  985, 0.07, 68.95, 1053.95,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-08T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'e57be789-c21b-498b-adfa-0c1c6b641276', '00000000-0000-4000-a000-000000000001', 'O099263', 'completed',
  NULL, NULL,
  'ba12dcd7-808e-4d8f-bceb-19264dcad421', 'Cantey Tech Consulting', NULL, NULL,
  'Custom Made Mouse Pad - 2025 Cantey Calendar', NULL,
  1875, 0.07, 131.25, 2006.25,
  '2025-12-19'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-09T00:00:00Z'::timestamptz, '2025-12-19T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '01a0cdd2-7b26-4573-9ca1-dfd8ebf2b971', '00000000-0000-4000-a000-000000000001', 'O099264', 'completed',
  NULL, NULL,
  'd81fe12c-603f-4195-ada1-492e2b5e7561', 'Gunther Motor Company of Plantation', NULL, NULL,
  'BC - Jeff Lindeman - Service Consultant (VW)', NULL,
  140, 0.07, 9.8, 149.8,
  '2025-12-11'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-09T00:00:00Z'::timestamptz, '2025-12-11T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '396a1b8c-9cbc-4679-910d-7fc22db53d52', '00000000-0000-4000-a000-000000000001', 'O099266', 'completed',
  NULL, NULL,
  '3df43acc-22e3-4901-b7b0-fca4a74cf782', 'MP Integrative Marketing', NULL, NULL,
  'Program 8.5 x 11 Flat Folded to 8.5 x 5.5 - Color - 100# Gloss Text -  Selfcover', NULL,
  1695, 0.07, 118.65, 1813.65,
  '2025-12-10'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-10T00:00:00Z'::timestamptz, '2025-12-10T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'fa2ea97a-d3c3-431c-b478-de07bec9c6a1', '00000000-0000-4000-a000-000000000001', 'O099268', 'completed',
  NULL, NULL,
  'fd678fec-980b-4def-87bb-60ff3b479323', 'Leon Health', NULL, NULL,
  '"BROKERS Spanish/English Sales Powerpoint" 100# Cover - Plastic Coil', NULL,
  3500, 0.07, 245, 3745,
  '2025-12-15'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-10T00:00:00Z'::timestamptz, '2025-12-15T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '04453b94-0348-4b0c-a027-d32bdecd384f', '00000000-0000-4000-a000-000000000001', 'O099270', 'in_progress',
  NULL, NULL,
  'dba46213-fb90-4947-be26-11eea742ad42', 'Aramark Uniform Services MC# 840', NULL, NULL,
  '30 Pads of HACCP Tag Color Vulcar Green- 5.5 x 4.25 - Drill hole on top - Pads o', NULL,
  2871, 0.07, 200.97, 3071.97,
  '2025-12-17'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-10T00:00:00Z'::timestamptz, '2025-12-17T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'e534e91c-3ab7-43c6-b991-323544088af0', '00000000-0000-4000-a000-000000000001', 'O099272', 'in_progress',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'S093025-18082148097 Store ID 1117631 - Window Perf Cling Kate Spade -  42" x 57.', NULL,
  170, 0.07, 11.9, 181.9,
  '2026-01-13'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-10T00:00:00Z'::timestamptz, '2026-01-13T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'e86a6eea-bdbf-4b5d-9182-8d638a50526c', '00000000-0000-4000-a000-000000000001', 'O099273', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'S100925-18147204571 Store ID 1126090 - Window Perf Cling Kate Spade -  70.65" x ', NULL,
  120, 0.07, 8.4, 128.4,
  '2025-12-17'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-10T00:00:00Z'::timestamptz, '2025-12-17T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '3e70206c-83f2-4750-9b5c-5c1fb92fdc04', '00000000-0000-4000-a000-000000000001', 'O099280', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'P120425-10707647680 STORE ID 1127042 - DURATRAN - David Beckham - 37.5 x 21.75', NULL,
  42, 0.07, 2.94, 44.94,
  '2025-12-17'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-12T00:00:00Z'::timestamptz, '2025-12-17T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'bec77065-4696-44cd-b9a6-139afcdb4f64', '00000000-0000-4000-a000-000000000001', 'O099281', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'P111925-10599720990 STORE ID 0001124841- DURATRAN - CARRERA - 28" X 7', NULL,
  14, 0.07, 0.98, 14.98,
  '2025-12-17'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-12T00:00:00Z'::timestamptz, '2025-12-17T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'd967accd-c51c-4fb2-838d-467be34fa575', '00000000-0000-4000-a000-000000000001', 'O099282', 'completed',
  NULL, NULL,
  'd81fe12c-603f-4195-ada1-492e2b5e7561', 'Gunther Motor Company of Plantation', NULL, NULL,
  'BC -Jesse Kolbe - Service Consultant (VW)', NULL,
  140, 0.07, 9.8, 149.8,
  '2025-12-19'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-15T00:00:00Z'::timestamptz, '2025-12-19T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '9a13f79b-b9b8-4f8f-aac1-b9e1f52b1a1d', '00000000-0000-4000-a000-000000000001', 'O099294', 'completed',
  NULL, NULL,
  'a867d521-8cfd-4118-9c5f-898b5021cf81', 'Ellie''s Army Foundation', NULL, NULL,
  'Flyers 8.5 x 11, Gloss text 100# - color one side - ENGLISH', NULL,
  305, 0.07, 21.35, 326.35,
  '2025-12-19'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-16T00:00:00Z'::timestamptz, '2025-12-19T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '03a5fcf5-cd9b-4f8f-8b65-9dbc8a65e7a4', '00000000-0000-4000-a000-000000000001', 'O099296', 'completed',
  NULL, NULL,
  'b4471466-d68e-49f2-bfbc-355b85721bf2', 'Savel, Inc.', NULL, NULL,
  'Memo Tags (Scored)-  4"x 3" - 10 pt C2/S Scored Tags 10.28.25 - 26 references (q', NULL,
  487.26, 0.07, 34.11, 521.37,
  '2025-12-22'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-16T00:00:00Z'::timestamptz, '2025-12-22T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'aea50fff-ba0d-4180-800c-7c236099ca63', '00000000-0000-4000-a000-000000000001', 'O099297', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'White acrylic 12"x2.5"', NULL,
  75, 0.07, 5.25, 80.25,
  '2025-12-19'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-16T00:00:00Z'::timestamptz, '2025-12-19T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'c70984be-f9ab-4759-bc4e-1e6726ad4de7', '00000000-0000-4000-a000-000000000001', 'O099299', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'P101525-18194276169 - Store ID - 2137560039 - Foamboard - TB 36"x36" MARCOLIN', NULL,
  78.75, 0.07, 5.51, 84.26,
  '2025-12-17'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-16T00:00:00Z'::timestamptz, '2025-12-17T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'fa048269-4a5f-4926-a48d-5a296f784514', '00000000-0000-4000-a000-000000000001', 'O099300', 'completed',
  NULL, NULL,
  '2dc7ad50-8d7b-47de-8dac-7dcfdaafe340', 'MoSteel', NULL, NULL,
  'Marc''s Crane - Vehicle Inspection Report -  2 Part NCR Forms - Full Color -  Pad', NULL,
  510, 0.07, 35.7, 545.7,
  '2026-01-09'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-16T00:00:00Z'::timestamptz, '2026-01-09T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'ae18f4ef-0633-4701-9634-8075bd3ca4f2', '00000000-0000-4000-a000-000000000001', 'O099301', 'completed',
  NULL, NULL,
  '2dc7ad50-8d7b-47de-8dac-7dcfdaafe340', 'MoSteel', NULL, NULL,
  'UVStickers for Mini Notebook & Pens - Installed', NULL,
  650, 0.07, 45.5, 695.5,
  '2026-02-04'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-16T00:00:00Z'::timestamptz, '2026-02-04T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '8f6800d7-ebc1-4532-b004-92eac7dcd3db', '00000000-0000-4000-a000-000000000001', 'O099303', 'completed',
  NULL, NULL,
  '00934abe-2a9f-4e5c-8276-2b80428bcb4d', 'Nattkus Creative Studio', NULL, NULL,
  'Custom Cut on Ultraboard provided by Customer - Hours', NULL,
  8779.8, 0.07, 614.59, 9394.39,
  '2026-01-16'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-17T00:00:00Z'::timestamptz, '2026-01-16T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '7dfadca6-93e4-4f10-a60d-cac2ca32c036', '00000000-0000-4000-a000-000000000001', 'O099310', 'completed',
  NULL, NULL,
  '8d46deb7-1657-45fd-aa9b-ac088bb76a6e', 'Pulse and Remedy', NULL, NULL,
  'Classic Retractable Rollup Banner Stand - Anticurl, Soft Surface Graphics', NULL,
  785, 0.07, 54.95, 839.95,
  '2025-12-19'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-17T00:00:00Z'::timestamptz, '2025-12-19T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'bb08999d-a42b-4747-ba5f-1d70f0b4ecc4', '00000000-0000-4000-a000-000000000001', 'O099318', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'Delivery and Installation Cartier SEG graphics suplied by 4EON', NULL,
  150, 0.07, 10.5, 160.5,
  '2025-12-18'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-18T00:00:00Z'::timestamptz, '2025-12-18T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '226e801e-2adc-4c7d-a078-5dcec9234c3b', '00000000-0000-4000-a000-000000000001', 'O099319', 'completed',
  NULL, NULL,
  'fd678fec-980b-4def-87bb-60ff3b479323', 'Leon Health', NULL, NULL,
  'CY2026 ANOC - Saddle Stitched - Weekly Enrollments - Oct 1st to Dec 15th', NULL,
  1164.64, 0.07, 81.52, 1246.16,
  '2025-12-23'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-18T00:00:00Z'::timestamptz, '2025-12-23T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'b6c8d83b-011c-475c-9a9c-1c7d4226955b', '00000000-0000-4000-a000-000000000001', 'O099326', 'in_progress',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'P092925-18071483166 - Store 157810 - Duratrans TF 17.25"x11.25"- MARCOLIN', NULL,
  14, 0.07, 0.98, 14.98,
  '2026-01-13'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-19T00:00:00Z'::timestamptz, '2026-01-13T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '5b4b1fa3-d4fd-4ad5-b572-c5ca29e1306b', '00000000-0000-4000-a000-000000000001', 'O099329', 'completed',
  NULL, NULL,
  'd81fe12c-603f-4195-ada1-492e2b5e7561', 'Gunther Motor Company of Plantation', NULL, NULL,
  'KIA Special Offer Coupon Books - Insides Perfect Binding', NULL,
  4990, 0.07, 349.3, 5339.3,
  '2026-01-13'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-19T00:00:00Z'::timestamptz, '2026-01-13T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '92347196-1e45-4af1-958b-31ac8f1d5f8e', '00000000-0000-4000-a000-000000000001', 'O099337', 'in_progress',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'P121625-10790980677 - Store 219261 - Duratrans TF 15" x 15 ''- MARCOLIN', NULL,
  28, 0.07, 1.96, 29.96,
  '2026-01-13'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-19T00:00:00Z'::timestamptz, '2026-01-13T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '94c09206-90cc-4c79-a355-d2cb39a948e6', '00000000-0000-4000-a000-000000000001', 'O099340', 'in_progress',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'P121625-10794848729 - Store ID 187640 - Poster - "Conservative TF"78"x35" MARCOL', NULL,
  152, 0.07, 10.64, 162.64,
  '2026-01-13'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-22T00:00:00Z'::timestamptz, '2026-01-13T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'addf3c42-8650-42ba-8a8b-076082c0de14', '00000000-0000-4000-a000-000000000001', 'O099341', 'completed',
  NULL, NULL,
  'df7054b8-a1da-4143-8eed-4b30f1c9db19', 'WeCanIt', NULL, NULL,
  'Self Standing Life Size Standees - WeCanIt - with Easel Back', NULL,
  1500, 0.07, 105, 1605,
  '2026-01-05'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-22T00:00:00Z'::timestamptz, '2026-01-05T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  'de9290df-0ee4-4211-8380-2204e8b4e4b0', '00000000-0000-4000-a000-000000000001', 'O099342', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'Pedestal wrap 12 W'' x 12" L x 36" H - JOL - MIU MIU', NULL,
  3490, 0.07, 244.3, 3734.3,
  '2026-01-05'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-22T00:00:00Z'::timestamptz, '2026-01-05T00:00:00Z'::timestamptz
);
INSERT INTO orders (
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
  '9fd4e0b8-54b8-435c-b6cf-ba34f1375f2b', '00000000-0000-4000-a000-000000000001', 'O099344', 'completed',
  NULL, NULL,
  'a9ff5e44-d0f6-422e-bee0-a320faea5ded', '4eon', NULL, NULL,
  'Delivery and Installation Cartier SEG graphics suplied by 4EON - JOL', NULL,
  150, 0.07, 10.5, 160.5,
  '2026-01-06'::date, NULL,
  'f2253de0-53bf-478b-ae27-1409352d0e9e', NULL,
  NULL, NULL, 'order',
  NULL, NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  true,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-22T00:00:00Z'::timestamptz, '2026-01-06T00:00:00Z'::timestamptz
);

-- ── 42. Order Line Items ──────────────────────────────────────────────────
INSERT INTO order_line_items (
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
  'cb21b6c5-72ab-4d9b-8244-a472ca7fb87a', '00000000-0000-4000-a000-000000000001', '1243dce4-40b0-4e7d-823e-5a008fea786d', 0,
  'wide_format', 'Booth Wrap - 3 Faces Full Color', 1, 'sqft',
  NULL, NULL,
  'b7a183ff-3adb-483a-aca7-382bdfecc59a', '3M IJ180 White Vinyl', 340,
  '83e73706-157d-4b4b-835b-73351b035ea0', 'HP Latex 800W', NULL, 120,
  5, 55, 275,
  NULL, NULL,
  0, 0, 735, 55, 1139.25,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  's9', 'f5240f84-5f3f-4e0d-bd53-ef39b7edcd69',
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'f55ce118-9f23-4a82-96c0-0d53f47d08bf', '00000000-0000-4000-a000-000000000001', '79b14dea-a281-40b3-bf49-71ca1516ecf1', 0,
  'wide_format', 'Step & Repeat 8x8', 1, 'each',
  96, 96,
  '51e5207e-feb5-4dd7-80d3-b1ef4f83480a', '13oz Scrim Banner', 144,
  '83e73706-157d-4b4b-835b-73351b035ea0', 'HP Latex 800W', NULL, 65,
  2, 45, 90,
  NULL, NULL,
  0, 0, 299, 60, 478.4,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  's8', 'f5240f84-5f3f-4e0d-bd53-ef39b7edcd69',
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '0eab3355-e39b-4fe5-b007-acc8cffcab26', '00000000-0000-4000-a000-000000000001', '79b14dea-a281-40b3-bf49-71ca1516ecf1', 1,
  'wide_format', 'Table Runner 2x6', 3, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 95, 65, 156.75,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  's8', NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'dfc2e63a-8d32-4a3e-8827-cad80daa5928', '00000000-0000-4000-a000-000000000001', '1d60f1f8-6d38-424f-a94e-6dffbf5c04b0', 0,
  'digital_print', 'Business Cards 3.5x2 - Full Color 2/2', 500, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 95, 45, 137.75,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  's6', NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '30cc5b9e-6686-421e-b15a-596324d6e0aa', '00000000-0000-4000-a000-000000000001', '246a6a18-80cc-44c2-9025-9364cc933dea', 0,
  'wide_format', 'Step & Repeat Backdrop 10x8', 1, 'each',
  120, 96,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 285, 60, 456,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  's7', NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '127ea010-03d6-4d4d-a3e0-a152eac57e71', '00000000-0000-4000-a000-000000000001', 'e1d1963f-077d-46aa-a581-cc6fe1515e32', 0,
  'digital_print', 'Africa Portfolio Flyer -  25.5" x 11  folded to 8.5 x 11 - Color two sides', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 261.25, 45, 475,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '3878a5b5-098e-40ef-a06c-ce1d2d088eca', '00000000-0000-4000-a000-000000000001', 'c3a2d83e-f955-4857-aa6c-08ee1e0353aa', 0,
  'digital_print', 'Savel Tags -Blank  4"x 3" Black and White Single Sided Tags on 130# Cougar Cardstock- scored', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 30.25, 45, 55,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '286ad0d9-498a-46d4-b581-96da4dcc9d90', '00000000-0000-4000-a000-000000000001', 'c3a2d83e-f955-4857-aa6c-08ee1e0353aa', 1,
  'digital_print', 'Savel Laminated Tags - 3.5 x 3.5 -28 references, (Qty 1 Each)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 30.8, 45, 56,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'f5262116-96f0-40f1-901f-6bfff29badb7', '00000000-0000-4000-a000-000000000001', 'c3a2d83e-f955-4857-aa6c-08ee1e0353aa', 2,
  'digital_print', 'Savel Tags (Scored)-  4"x 3" - 10 pt C2/S Scored Tags 8.18.25 - 5 references (qty 80)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 29.96, 45, 54.48,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '39057547-fb15-45ac-80ea-232f2c9335c5', '00000000-0000-4000-a000-000000000001', 'c3a2d83e-f955-4857-aa6c-08ee1e0353aa', 3,
  'wide_format', 'Set up Price for New tags', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 52.25, 45, 95,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '9b8702ba-0cd7-40e9-b9fe-4587092a6374', '00000000-0000-4000-a000-000000000001', 'c3a2d83e-f955-4857-aa6c-08ee1e0353aa', 4,
  'digital_print', 'Saladino Tags (Scored)-  4"x 3" - 10 pt C2/S Scored Tags 8.18.25 - 5 references (qty 80)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 29.96, 45, 54.48,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '721dd18f-f386-4672-9175-d430642676d2', '00000000-0000-4000-a000-000000000001', '43d46e27-761d-4d5d-aad1-33cac21e62a9', 0,
  'digital_print', 'EVA Outdoor Waterproof Large Capacity Hole Bag', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1210, 45, 2200,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e3f73227-41d2-48cc-aaed-a71f61c4b04d', '00000000-0000-4000-a000-000000000001', '43d46e27-761d-4d5d-aad1-33cac21e62a9', 1,
  'digital_print', 'Setup', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 44, 45, 80,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '5906d60a-3740-4015-871e-27da092e590e', '00000000-0000-4000-a000-000000000001', 'e0b414a0-5f19-4ad6-a7bf-0f8118a1978b', 0,
  'outsourced', 'Custom Made Cookie/Pastry Holder', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 2337.5, 45, 4250,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '1ac08b40-ccbb-4414-8718-dd6277afb3d2', '00000000-0000-4000-a000-000000000001', '08030d6f-fdf6-43cb-81e4-9acc3bd0a910', 0,
  'digital_print', 'Bilingual Brochure Prevention 8.5 x 5.5" - 16 pages self cover - Gloss Text 100# - Color - Stiched -', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1636.25, 45, 2975,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'a8ed04ec-921f-4389-bd89-bcc596d5582b', '00000000-0000-4000-a000-000000000001', '30cbe658-085e-49ff-862c-d016690dc5ac', 0,
  'digital_print', 'Bilingual Brochure 50 Male - 8.5 x 5.5" - 16 pages self cover - Gloss Text 100# - Color - Stiched - ', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1636.25, 45, 2975,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '43397b51-0e9a-4965-8f9f-8ea1bf4701e8', '00000000-0000-4000-a000-000000000001', '79400c7b-e825-4189-9d8e-a404dfda1bcd', 0,
  'wide_format', '16'' x 8'' Light Box, Single Sided', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 2475, 45, 4500,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '7a18dbd3-e46d-413d-a82e-62853466dc55', '00000000-0000-4000-a000-000000000001', '7d0db3ab-3630-42a9-938b-8892dd3b19c9', 0,
  'digital_print', '2025 Calendar - 11 x 17 cak Cover with 8.25 x 11 13 pages pads- drill hole', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1707.75, 45, 3105,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '8571cc4a-5f7a-4cfd-9654-7ef1f86a66a4', '00000000-0000-4000-a000-000000000001', '7d0db3ab-3630-42a9-938b-8892dd3b19c9', 1,
  'wide_format', 'One time Graphic Fee Change Layout', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 209, 45, 380,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '078cc2de-50fe-468d-a7c7-c8547fdfe873', '00000000-0000-4000-a000-000000000001', 'd3e9c84c-98cd-432c-96a9-58bdd873385d', 0,
  'outsourced', 'Leon Health Inc- Claim Account Check order', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1792.86, 45, 3259.74,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '6c633ef9-5b2c-4e23-8f83-9464c4284676', '00000000-0000-4000-a000-000000000001', '9b959c67-caec-45af-b91b-266057274c40', 0,
  'digital_print', 'Ball Point Pen with LED and Pointer', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 478.5, 45, 870,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '981443cc-83fc-4d24-9db3-01517ac742d2', '00000000-0000-4000-a000-000000000001', '9a88523a-5939-4032-bce9-e20d52adb3b0', 0,
  'outsourced', 'Embroidery Decoration - Left Chest', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 54.45, 45, 99,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '461a7aac-2b35-41f9-9a78-1d15504fbd2e', '00000000-0000-4000-a000-000000000001', '9a88523a-5939-4032-bce9-e20d52adb3b0', 1,
  'outsourced', 'Embroidery Decoration - Bag - Center on Pocket', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 39.6, 45, 72,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '819deec5-808a-4f5f-a99a-ee7a3d04a488', '00000000-0000-4000-a000-000000000001', '4c711d13-8df2-4123-877f-d630e360322e', 0,
  'digital_print', 'Shipping and drop-off fee', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 22, 45, 40,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '632892b8-3c12-4f5d-8e71-6f0a2445a8c9', '00000000-0000-4000-a000-000000000001', '4c711d13-8df2-4123-877f-d630e360322e', 1,
  'digital_print', 'Bing Cards 8.5 x 11- Cardstock 130# - Color One side', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 132, 45, 240,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'eececd78-c4c4-41dc-85df-bffa76ad5f2f', '00000000-0000-4000-a000-000000000001', '4c711d13-8df2-4123-877f-d630e360322e', 2,
  'digital_print', 'Postcards Wi-Fi 5" x 7"', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 32.45, 45, 59,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '197568d8-c52b-4229-a431-c5750b5ba8f1', '00000000-0000-4000-a000-000000000001', '4c711d13-8df2-4123-877f-d630e360322e', 3,
  'digital_print', 'Table tents', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 26.4, 45, 48,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '49979660-4fba-47be-bd2e-d455e0d03a17', '00000000-0000-4000-a000-000000000001', '4c711d13-8df2-4123-877f-d630e360322e', 4,
  'wide_format', 'Posters FoamBoard Signs Sponsor +  2 QR Codes', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 288.75, 45, 525,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '9b96957b-841b-4990-96ea-8c28f2395302', '00000000-0000-4000-a000-000000000001', '233dce74-920a-460d-bc18-222478f3e41f', 0,
  'outsourced', 'USPS - Standard Class', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 0, 45, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '0bbd9ffd-1c17-4d55-b041-e95083deda17', '00000000-0000-4000-a000-000000000001', '233dce74-920a-460d-bc18-222478f3e41f', 1,
  'digital_print', 'Variable Data:  6 x 9 Postcards color both sides -  personalized', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 347.3, 45, 631.46,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '7b0179c8-ab21-471c-b32f-40652e3cc540', '00000000-0000-4000-a000-000000000001', '233dce74-920a-460d-bc18-222478f3e41f', 2,
  'outsourced', 'Mailing List: Filtered Business in Broward - Multiple Use - Reduced Categories', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 200.75, 45, 365,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'ce8f21e4-2d0e-4f84-8b49-e604f53219af', '00000000-0000-4000-a000-000000000001', 'aac00152-2a64-4e28-8a0d-a4f29f995b20', 0,
  'digital_print', 'Used Cars Stock Card-4" x 4.375"- White  Paper - Black Ink - Single Sided', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 55, 45, 100,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '37aa3bf5-e2a6-40d0-bacb-19e061891362', '00000000-0000-4000-a000-000000000001', '838e2cf4-8d0b-45d4-bea1-72d6d671be77', 0,
  'digital_print', 'Remove existing signs, delivery and Installation', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 165, 45, 300,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '1b93f959-2716-4188-aa1b-a1939a0a7d18', '00000000-0000-4000-a000-000000000001', '838e2cf4-8d0b-45d4-bea1-72d6d671be77', 1,
  'digital_print', 'Dior Backlit Vinyls - 46.875 x 102.4', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 154, 45, 280,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '28eeda50-4814-4ba5-8c6c-444ce62a0344', '00000000-0000-4000-a000-000000000001', '838e2cf4-8d0b-45d4-bea1-72d6d671be77', 2,
  'digital_print', 'Dior Backlit Vynil, 26" X 61.5".  Photo finish HD quality.', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 46.75, 45, 85,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'cc94bc98-9182-4896-8f5c-f718ba71dcde', '00000000-0000-4000-a000-000000000001', 'bce2d926-2c2d-4a2d-9381-1b3c707fcbf7', 0,
  'wide_format', 'P110725-10516792051 - Counter Cards 5"x7"', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 7.15, 45, 13,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '61c8378b-4560-43ce-940a-4279acb7eaf2', '00000000-0000-4000-a000-000000000001', 'bce2d926-2c2d-4a2d-9381-1b3c707fcbf7', 1,
  'wide_format', 'P110725-10516792051 - Counter Cards 5"x7"', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 7.15, 45, 13,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '55f1c8f6-37a3-42ba-8c3c-480c4b50fd0a', '00000000-0000-4000-a000-000000000001', 'bce2d926-2c2d-4a2d-9381-1b3c707fcbf7', 2,
  'wide_format', 'P110725-10516792051 - Counter Cards 5"x7"', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 7.15, 45, 13,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '0aa61d76-eb8f-466e-9b81-1575a52d286d', '00000000-0000-4000-a000-000000000001', 'bce2d926-2c2d-4a2d-9381-1b3c707fcbf7', 3,
  'wide_format', 'P110725-10516792051 - Counter Cards 5"x7"', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 7.15, 45, 13,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '3d89a8d1-3c4a-4afd-9eed-40d3f90b11f6', '00000000-0000-4000-a000-000000000001', 'f18ff11a-dd42-4d0b-bedb-0d285514f4af', 0,
  'wide_format', 'Swatch Kit Set', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 0, 45, 0,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '074c07c1-52b7-4d33-893a-ff2cb8651130', '00000000-0000-4000-a000-000000000001', '38cc6070-b35d-4548-b739-29a092f35d78', 0,
  'installation', 'Delivery and Installation including SEG graphics suplied by 4EON', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 82.5, 45, 150,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'f268fa32-c60c-4da3-b7ab-46af94792ab6', '00000000-0000-4000-a000-000000000001', '38cc6070-b35d-4548-b739-29a092f35d78', 1,
  'wide_format', 'GUCCI JOL Dolphin Mall, Backlit, 43.125 x 21.375"  Photo finish HD quality SL 3364 10 MIL Satin Back', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 40.15, 45, 73,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '3c0ac1ed-2f9c-46cb-9a14-1f71b3f75587', '00000000-0000-4000-a000-000000000001', '65c0ee19-4db8-4d38-8aa9-9ce8d06af425', 0,
  'digital_print', 'Labels', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 16.5, 45, 30,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '5ed87b86-ac51-49b8-b7b7-b42caaf874e9', '00000000-0000-4000-a000-000000000001', '65c0ee19-4db8-4d38-8aa9-9ce8d06af425', 1,
  'wide_format', 'PVC Sign - 44" Diameter', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 99, 45, 180,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'fd0d094a-dc76-4679-9885-6cd85fc87fcc', '00000000-0000-4000-a000-000000000001', '01dd56cc-0a03-4ea7-895a-844fae1a07e3', 0,
  'digital_print', 'Presentation Folders, UV Coated, Two Pockets, BC Slits on Left Side', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1531.75, 45, 2785,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'cd54804d-4545-4e96-9745-22c4b0ca6da1', '00000000-0000-4000-a000-000000000001', 'c33e9d50-9ed6-4249-9487-f2f85ad4627c', 0,
  'digital_print', '2026 Desktop Calendars - Network Cargo', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1815, 45, 3300,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'c0e9f741-7c52-4283-8a62-fc1182bcb879', '00000000-0000-4000-a000-000000000001', 'd622ab1f-b945-454d-8a51-2b6cf66fdc13', 0,
  'wide_format', 'YSL/Gucci: Poster Cardstock- 11" x 14" - Color One side', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 334.4, 45, 608,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '4173c61c-6582-4fd8-89b2-bfca0df1597c', '00000000-0000-4000-a000-000000000001', '37e88552-f03d-480c-a347-06fea41ee21e', 0,
  'digital_print', 'Flyers 8.5 x 5.5 - Gloss text 100 - Color two side-BigFix AEX', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 55, 45, 100,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '4f92e8a6-529e-4613-8758-960e8a0d5c9c', '00000000-0000-4000-a000-000000000001', '37e88552-f03d-480c-a347-06fea41ee21e', 1,
  'digital_print', 'Flyers 8.5 x 5.5 - Gloss text 100 - Color two side-BigFix family general', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 55, 45, 100,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '2f4987db-5c0c-42a4-b614-959b689f5224', '00000000-0000-4000-a000-000000000001', '37e88552-f03d-480c-a347-06fea41ee21e', 2,
  'digital_print', 'Flyers 8.5 x 5.5 - Gloss text 100 - Color two side-BigFix SaaS Remediate', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 27.5, 45, 50,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e492ecd8-63e2-4733-918d-666dcb149923', '00000000-0000-4000-a000-000000000001', '37e88552-f03d-480c-a347-06fea41ee21e', 3,
  'digital_print', 'Standard Retractable Banner, 33.5" X 78", Full Color Colors, Carrying Case Included. - UNICA+', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 493.35, 45, 897,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '344797bd-ceb8-4234-a950-5648c732de97', '00000000-0000-4000-a000-000000000001', '37e88552-f03d-480c-a347-06fea41ee21e', 4,
  'digital_print', 'Flyers 8.5 x 5.5 - Gloss text 100 - Color two side-', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 27.5, 45, 50,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '24166365-aa60-4de0-8a41-3682de8d61bf', '00000000-0000-4000-a000-000000000001', '7dfee094-ef3b-49e5-8efe-7294c480415d', 0,
  'installation', 'POV Dolphin Mall -  Duratrans Provided by Client delivery and Installation', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 52.25, 45, 95,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'faa01cd0-a7cd-4b0b-8d90-312ea108c7b8', '00000000-0000-4000-a000-000000000001', '7dfee094-ef3b-49e5-8efe-7294c480415d', 1,
  'installation', 'JOL Dolphin -  Delivery and Installation -', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 52.25, 45, 95,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e17abe36-2079-4343-ad82-735ec78c9dff', '00000000-0000-4000-a000-000000000001', '7dfee094-ef3b-49e5-8efe-7294c480415d', 2,
  'wide_format', 'DIOR  JOL Dolphin: Foamboard 1/2", 37" X 96" Black Core,  Mount DIOR  vinyl suplied by customer', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 181.5, 45, 330,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e10d0065-9792-4006-9dc3-9b23a0e9a836', '00000000-0000-4000-a000-000000000001', '7dfee094-ef3b-49e5-8efe-7294c480415d', 3,
  'digital_print', 'Removal of special material on windows', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 96.25, 45, 175,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '022ff834-c507-4289-9be3-c71f57ded765', '00000000-0000-4000-a000-000000000001', '7dfee094-ef3b-49e5-8efe-7294c480415d', 4,
  'digital_print', 'EOL Installation Fee -1 Windows with suplied material -', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 165, 45, 300,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '87ad3a1b-fc1e-495d-9532-e42931744061', '00000000-0000-4000-a000-000000000001', '724696ec-6c63-428c-9b1c-a3902f6b876f', 0,
  'installation', '16'' x 8'' Light Box, Single Sided - After Hours De-Install at 10:30 PM', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 412.5, 45, 750,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e0376ea3-0f60-4fcf-a9cf-12ebca3011ab', '00000000-0000-4000-a000-000000000001', '97e6c9e7-0e28-4f46-a85f-c5ace0f2812f', 0,
  'digital_print', 'Custom Greeting Cards, Scored - Adapt Foundation', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 115.5, 45, 210,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '035f9d88-0c54-4331-8255-c5148089d6d3', '00000000-0000-4000-a000-000000000001', '97e6c9e7-0e28-4f46-a85f-c5ace0f2812f', 1,
  'digital_print', 'Custom Greeting Cards, Scored - Adapt', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 115.5, 45, 210,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e5e3acb0-4030-48cd-96ce-5b0efb4be958', '00000000-0000-4000-a000-000000000001', '9f3f1c7c-c4ae-4e33-9d10-e68df128bbb4', 0,
  'digital_print', 'Postcard 6 x 4, 100# Uncoated Cover - Full Color - Single Sided', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 123.75, 45, 225,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '827bcb91-fedd-469b-9ed3-0fc70a469231', '00000000-0000-4000-a000-000000000001', '6575ef15-021a-4e80-9149-9b34a18e3f03', 0,
  'wide_format', 'S111425-10566782933 Store ID 214529 - Window Perf Cling TomFord 28.75" x 78.25" - MARCOLIN', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 44, 45, 80,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '7796a517-c6bf-4f2f-b19d-6a81f4a189b5', '00000000-0000-4000-a000-000000000001', '6575ef15-021a-4e80-9149-9b34a18e3f03', 1,
  'wide_format', 'S111425-10566782933 Store ID 214529 - Window Perf Cling TomFord 28.25" x 34" - MARCOLIN', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 30.8, 45, 56,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'c4101f65-d5c6-4657-a1fd-169654aa0bf0', '00000000-0000-4000-a000-000000000001', '15f7cc53-e6e6-4c95-ba6f-2edbbdd14c3d', 0,
  'wide_format', 'S111825-10589855171 Store ID 2137560049 - Window Perf Cling Guess&Marciano 39.5" x 49.5" - MARCOLIN', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 38.5, 45, 70,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '2fecdfe1-7013-4cbc-a424-39c45af56555', '00000000-0000-4000-a000-000000000001', '358abcfb-5d00-461f-bdf2-af079f26a15c', 0,
  'wide_format', 'Magnets for shuttle bus 12" x 12', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 52.25, 45, 95,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '34120ae4-75bf-4ce9-900d-9b6d6b3c02f0', '00000000-0000-4000-a000-000000000001', 'f089eccb-e989-4655-8644-4250f523b1e6', 0,
  'digital_print', 'Seating Cards - Personalized, Scored in half - Delivered Flat', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 24.75, 45, 45,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '4fdb4422-8382-47f1-ba7b-99b58f61c26c', '00000000-0000-4000-a000-000000000001', 'f089eccb-e989-4655-8644-4250f523b1e6', 1,
  'digital_print', 'Food Menus', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 19.25, 45, 35,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'dc35e218-a589-4858-8661-8ff25f447b73', '00000000-0000-4000-a000-000000000001', 'f089eccb-e989-4655-8644-4250f523b1e6', 2,
  'digital_print', 'Cocktail Menus', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 16.5, 45, 30,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'bf1a2114-2469-445d-8fcb-1048d7add00e', '00000000-0000-4000-a000-000000000001', 'f089eccb-e989-4655-8644-4250f523b1e6', 3,
  'digital_print', 'Itinerary Cards', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 16.5, 45, 30,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '3037e30e-25a5-42a3-9b2a-0ca62c090899', '00000000-0000-4000-a000-000000000001', 'd194673c-9e1a-4c51-ab11-e9c25f2e7939', 0,
  'digital_print', 'Fan & Lighting World - Invoice - 4 Part - Blak ink', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1155, 45, 2100,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '9ec9ce56-d7c4-4426-911b-4e2f14163730', '00000000-0000-4000-a000-000000000001', '4eb83fc9-36b9-405d-9125-b9399339599d', 0,
  'digital_print', 'Reply card - 8.5 x 3.5 Full color One Side', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 46.75, 45, 85,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'bdf3557a-791f-4167-8e10-7134626c6dce', '00000000-0000-4000-a000-000000000001', '4eb83fc9-36b9-405d-9125-b9399339599d', 1,
  'digital_print', 'Envelopes #9 business Reply Color one side -', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 137.5, 45, 250,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '955f587e-7fc5-4165-aa11-a7f2d02fb46c', '00000000-0000-4000-a000-000000000001', '4eb83fc9-36b9-405d-9125-b9399339599d', 2,
  'digital_print', 'Envelopes 6" x 9"  Color one side -', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 154, 45, 280,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '1605701b-8143-42cd-a182-d1e3258f3c3b', '00000000-0000-4000-a000-000000000001', '4eb83fc9-36b9-405d-9125-b9399339599d', 3,
  'digital_print', 'Home For the Holidays 8.5 x 11 folded to 8.5 x 5.5 color both sides - inserted into 6" x 9"  and stu', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 330, 45, 600,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '0301de2f-9b82-4ae5-992d-da58b8ab06ef', '00000000-0000-4000-a000-000000000001', 'a2f34ecc-6794-48ba-b141-726cb25c8de7', 0,
  'digital_print', 'Dinner Prompts + Inteviews Qs - set of 4', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 19.25, 45, 35,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '795d0149-0e54-477d-bea4-1c2a1f9923aa', '00000000-0000-4000-a000-000000000001', '71bdf03d-b692-40e9-8914-2e75cbdec19f', 0,
  'wide_format', 'Aventura - Foamboard  Double side 3/16"- 16" x 60" - Cartier Winter Campaign', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 24.75, 45, 45,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '111c42e5-ffe1-4e50-a892-1aeeaff8d45f', '00000000-0000-4000-a000-000000000001', '71bdf03d-b692-40e9-8914-2e75cbdec19f', 1,
  'installation', 'Aventura install and Delivery - Foamboard', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 52.25, 45, 95,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '8e4c869e-9377-4a32-840a-b2d0bc0b78d2', '00000000-0000-4000-a000-000000000001', '175959c5-46ff-487e-bc00-cd94b54bd433', 0,
  'installation', 'Installation', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 66, 45, 120,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'eecac376-b956-4a90-a2d1-c59cc8378b14', '00000000-0000-4000-a000-000000000001', '175959c5-46ff-487e-bc00-cd94b54bd433', 1,
  'wide_format', 'Truck Back Window - Microperf', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 96.25, 45, 175,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'b98d2d02-1c87-4401-bb30-a76613269c4f', '00000000-0000-4000-a000-000000000001', '175959c5-46ff-487e-bc00-cd94b54bd433', 2,
  'wide_format', 'Contour Cut Letters - URL and Instagram', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 115.5, 45, 210,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'b41f7b69-501b-4a72-a69c-b4ce593b998a', '00000000-0000-4000-a000-000000000001', '265c601b-bf4b-453c-a566-51227bda1f5d', 0,
  'digital_print', 'Benefit Consultant  Business Cards 3.5 x 2 - Yaismary Gil', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 60.5, 45, 110,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '2d22fe69-7c96-4bb8-963a-17670ea55585', '00000000-0000-4000-a000-000000000001', '265c601b-bf4b-453c-a566-51227bda1f5d', 1,
  'digital_print', 'Benefit Consultant  Business Cards 3.5 x 2 - Yaimiri De Armas - Benefit Consultant', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 60.5, 45, 110,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '5e746e9d-ff5e-40f3-9c3a-7c3c48a0cdeb', '00000000-0000-4000-a000-000000000001', '265c601b-bf4b-453c-a566-51227bda1f5d', 2,
  'digital_print', 'Benefit Consultant  Business Cards 3.5 x 2 - Eduardo Travieso - Benefit Consultant', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 60.5, 45, 110,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'c009ded9-28a9-45e9-90c0-ffb87d1a8868', '00000000-0000-4000-a000-000000000001', '265c601b-bf4b-453c-a566-51227bda1f5d', 3,
  'digital_print', 'Benefit Consultant  Business Cards 3.5 x 2 - Heidy Paez Gil - Benefit Consultant', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 60.5, 45, 110,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'a543b9ff-2089-4d40-b095-86f7145d1ef9', '00000000-0000-4000-a000-000000000001', '265c601b-bf4b-453c-a566-51227bda1f5d', 4,
  'digital_print', 'Benefit Consultant  Business Cards 3.5 x 2 - Maiby Quintana - Benefit Consultant', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 60.5, 45, 110,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '187e0005-ce26-43ef-87f3-7d768a0cb3ce', '00000000-0000-4000-a000-000000000001', '95cd52fe-bb51-45e1-a31f-f219f543dc5e', 0,
  'digital_print', '2025 CX5 Car Cards -3.5"X 4.25" - 65# Uncoated Cover Rocket RED- Black Ink - Single Sided', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 19.25, 45, 35,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '49bdcf26-c6a0-47b2-a297-e31ea1d6c213', '00000000-0000-4000-a000-000000000001', '95cd52fe-bb51-45e1-a31f-f219f543dc5e', 1,
  'digital_print', '2026 CX90 Car Cards - 3.5"X 4.25" - 65# Uncoated Cover - Stardust White - Black Ink - Single Sided', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 19.25, 45, 35,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '2b786a71-0857-462c-9775-c5a74ece5b51', '00000000-0000-4000-a000-000000000001', '95cd52fe-bb51-45e1-a31f-f219f543dc5e', 2,
  'digital_print', '2026 CX50 Car Cards -3.5"X 4.25" - 65# Uncoated Cover Fireball Fuchsia- Black Ink - Single Sided', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 19.25, 45, 35,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '49a4e956-f74e-44a0-a6b5-cb2757871c2c', '00000000-0000-4000-a000-000000000001', '95cd52fe-bb51-45e1-a31f-f219f543dc5e', 3,
  'digital_print', '2026 CX30 Car Cards - 3.5"X 4.25" - 65# Uncoated Cover Martian Green Black Ink - Single Sided', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 19.25, 45, 35,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'c3edd9ee-bfac-4900-bfd0-c343683e7273', '00000000-0000-4000-a000-000000000001', '99fc19f4-2d7e-40f9-97f7-4f30d7a610bb', 0,
  'wide_format', 'Tom Ford - Cohens Production - Duratrans TF 37.96" x 61.96"', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 65.45, 45, 119,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'c26b5c02-866b-4d3e-8ca0-79efda6d9355', '00000000-0000-4000-a000-000000000001', '99fc19f4-2d7e-40f9-97f7-4f30d7a610bb', 1,
  'wide_format', 'Tom Ford - Cohens Production - Duratrans TF 37.96" x 61.96"', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 65.45, 45, 119,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'fc2292b9-5b26-48a0-b38d-b609076fe9d9', '00000000-0000-4000-a000-000000000001', '99fc19f4-2d7e-40f9-97f7-4f30d7a610bb', 2,
  'wide_format', 'Tom Ford - Cohens Production - Duratrans TF 37.96" x 61.96"', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 65.45, 45, 119,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '55b001be-3c20-44fe-bab2-b15117b4fd2f', '00000000-0000-4000-a000-000000000001', '6c703fb0-09ed-415d-a509-c59c6f00b196', 0,
  'digital_print', 'BC - Tina Boyles - Sales Operations & Compliance Specialist', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 38.5, 45, 70,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e32a46e1-b7f0-4c2a-a56b-de43d9ff440b', '00000000-0000-4000-a000-000000000001', 'f76cedb2-c873-4089-9e2e-22218168df7b', 0,
  'digital_print', 'Christmas Postcards - Uncoated', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 68.75, 45, 125,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '870e4f46-b6cc-4f25-abf1-4354d3f2be2d', '00000000-0000-4000-a000-000000000001', 'cbf92814-042e-4fbf-b3ad-ce6359884218', 0,
  'digital_print', 'Business Cards - 3.5 x 2 - Dull cover 120# - Color both sides', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 30.25, 45, 55,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '8ab21166-b860-4c07-a822-809d1b53db1f', '00000000-0000-4000-a000-000000000001', '7e632830-91e9-44cf-9737-64d4816ed676', 0,
  'digital_print', 'EDDM Flyers 6.25"x9", 100# Gloss Cover, Full Color, Double Sided, Packs of 100', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 550, 45, 1000,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'ad2a9491-8dab-4135-84db-9e7df79a5dac', '00000000-0000-4000-a000-000000000001', '7e632830-91e9-44cf-9737-64d4816ed676', 1,
  'digital_print', '1 Time Graphic Fee (Artwork Recreation) For EDDM Flyer', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 82.5, 45, 150,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '227cc024-4b10-43a3-b872-7483280e5dff', '00000000-0000-4000-a000-000000000001', '7e632830-91e9-44cf-9737-64d4816ed676', 2,
  'outsourced', 'Door Hangers 4/4 + UV on front 14pt', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 453.75, 45, 825,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '30f5accc-6896-473a-826b-6669dd5a5bd1', '00000000-0000-4000-a000-000000000001', '5da96c89-3397-4791-b875-de62ceb46815', 0,
  'digital_print', 'Water Bottle Decoration - Full Color Raised UV Sticker', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 742.5, 45, 1350,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '3415312c-59c6-4a52-9121-91a20ac6844d', '00000000-0000-4000-a000-000000000001', '171582d8-9f5c-423b-a2c1-b0d241e70c8e', 0,
  'digital_print', 'BC -  Kyle Mejia- Sales Associate - KIA', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 38.5, 45, 70,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '5b69cb1e-81a2-4ad1-9d58-2d95f7062b49', '00000000-0000-4000-a000-000000000001', '18a7deb8-63c8-4fcf-9f0c-adca0e3f5f45', 0,
  'digital_print', 'Sales Orders (2 PART FORWARD) REFLEX BLUE/RED NUMBERING', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 244.75, 45, 445,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '07ea7205-605b-486e-b996-74d67b68aa0c', '00000000-0000-4000-a000-000000000001', '5ed1643e-9bdc-435b-8aa9-1106678f0944', 0,
  'digital_print', 'BC -Hannah Ward - Engineer - Pensacola Template', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 32.45, 45, 59,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '4c608021-e20a-49de-97ce-59fb851cadb3', '00000000-0000-4000-a000-000000000001', '81def98b-90e2-47cb-965b-c38af9495b6c', 0,
  'digital_print', 'Mockup Labels - Adhesive Paper - Garlic Powder 8.5 oz', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 19.8, 45, 36,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'bbbbd4f8-0b87-45c0-899a-80caae7ffa04', '00000000-0000-4000-a000-000000000001', '81def98b-90e2-47cb-965b-c38af9495b6c', 1,
  'digital_print', 'Mockup Labels - Adhesive Paper - Garlic Powder 4 oz', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 19.8, 45, 36,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'ab3bea74-3127-455f-9a77-ca0ea7a7b763', '00000000-0000-4000-a000-000000000001', '81def98b-90e2-47cb-965b-c38af9495b6c', 2,
  'digital_print', 'Mockup Labels - Adhesive Paper - Garlic Powder & Granulated Garlic', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 22, 45, 40,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '704673b7-8d35-4aed-9c1d-e98e1aa670ed', '00000000-0000-4000-a000-000000000001', '541c75e6-476f-4727-80f3-9f1743223322', 0,
  'digital_print', 'Replacement Cards', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1131.57, 45, 2057.4,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '5e4ac8cc-5eff-4111-8b3b-305747ecc1c6', '00000000-0000-4000-a000-000000000001', '541c75e6-476f-4727-80f3-9f1743223322', 1,
  'digital_print', 'Welcome Kits', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1709.4, 45, 3108,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '88b0a77c-c5b3-475d-ab87-76b40e1c4178', '00000000-0000-4000-a000-000000000001', 'c8920e9e-77d2-46f8-88c8-38c03590f2f1', 0,
  'digital_print', 'Gift Tag - Top Hole - 4/0', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 24.75, 45, 45,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '7bf8736c-89de-4874-997d-526d7aae70e3', '00000000-0000-4000-a000-000000000001', 'c8920e9e-77d2-46f8-88c8-38c03590f2f1', 1,
  'digital_print', 'PostCards Flyer Brochure - Scored in half - 4/4', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 60.5, 45, 110,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '60541d7f-e186-4e0b-8789-05a2358c7a5c', '00000000-0000-4000-a000-000000000001', 'ee0fc4ba-3375-45c7-83e6-c8f6327a28b9', 0,
  'digital_print', 'BC - Peter J. Sahwell - Associate Engineer- WPB Template', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 32.45, 45, 59,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'fdcc6a98-979c-4f72-a124-e6e1415c3bf2', '00000000-0000-4000-a000-000000000001', '032e43e1-df7e-404e-86f0-4cd80f774082', 0,
  'digital_print', 'Flower card English/ Spanish - 6 x 4 -  130 # Cover Uncoated - Ingles / Español - Color two side', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 541.75, 45, 985,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'db495328-369a-4708-8e2f-72a7cecb93eb', '00000000-0000-4000-a000-000000000001', 'e57be789-c21b-498b-adfa-0c1c6b641276', 0,
  'outsourced', 'Custom Made Mouse Pad - 2025 Cantey Calendar', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1031.25, 45, 1875,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '19349561-6d36-4ab7-bd8c-aa3bcb286e40', '00000000-0000-4000-a000-000000000001', '01a0cdd2-7b26-4573-9ca1-dfd8ebf2b971', 0,
  'digital_print', 'BC - Jeff Lindeman - Service Consultant (VW)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 38.5, 45, 70,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'dfeeb1f6-2c17-4439-8e78-7bb4d029ad92', '00000000-0000-4000-a000-000000000001', '01a0cdd2-7b26-4573-9ca1-dfd8ebf2b971', 1,
  'digital_print', 'BC - Rob Milton - Service Consultant (VW)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 38.5, 45, 70,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'b1e5789c-58ef-4db6-aeae-81e4b58cf346', '00000000-0000-4000-a000-000000000001', '396a1b8c-9cbc-4679-910d-7fc22db53d52', 0,
  'digital_print', 'Program 8.5 x 11 Flat Folded to 8.5 x 5.5 - Color - 100# Gloss Text -  Selfcover', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 932.25, 45, 1695,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'afda5e98-d455-451d-b216-74e7f4869b38', '00000000-0000-4000-a000-000000000001', 'fa2ea97a-d3c3-431c-b478-de07bec9c6a1', 0,
  'digital_print', '"BROKERS Spanish/English Sales Powerpoint" 100# Cover - Plastic Coil', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1925, 45, 3500,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'c9cb8eff-e3fc-4d3b-99a7-5ff34c766dc7', '00000000-0000-4000-a000-000000000001', '04453b94-0348-4b0c-a027-d32bdecd384f', 0,
  'digital_print', '30 Pads of HACCP Tag Color Vulcar Green- 5.5 x 4.25 - Drill hole on top - Pads of 50', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 94.05, 45, 171,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '3ea9845a-fe05-4648-b691-00843cfbffe0', '00000000-0000-4000-a000-000000000001', '04453b94-0348-4b0c-a027-d32bdecd384f', 1,
  'digital_print', '30 Pads of Solar YELLOW LOT F.P. Tag Color - 5.5 x 4.25 - Drill hole on top - Pads of 50', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 94.05, 45, 171,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '821d7a67-4e02-4eb0-ab77-6f46b2a47bc8', '00000000-0000-4000-a000-000000000001', '04453b94-0348-4b0c-a027-d32bdecd384f', 2,
  'digital_print', '30 Pads of Terrestial TEAL LOT B POMPANO Tag Color - 5.5 x 4.25 - Drill hole on top - Pads of 50', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 94.05, 45, 171,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '9ac6a9fd-86dd-461a-bc84-6134ee0d83a3', '00000000-0000-4000-a000-000000000001', '04453b94-0348-4b0c-a027-d32bdecd384f', 3,
  'digital_print', '30 Pads of Pulsar PINK LOT A POMPANO Tag Color - 5.5 x 4.25 - Drill hole on top - Pads of 50', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 94.05, 45, 171,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '82b188e3-98cc-4817-86c5-ae23dd85899d', '00000000-0000-4000-a000-000000000001', '04453b94-0348-4b0c-a027-d32bdecd384f', 4,
  'digital_print', 'Allied  Sling  Tag  White Paper with a Grey Color on a background - (Grey Color paper not found)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1202.85, 45, 2187,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '3070aa0f-b470-4147-ae20-f47e5ee06686', '00000000-0000-4000-a000-000000000001', 'e534e91c-3ab7-43c6-b991-323544088af0', 0,
  'wide_format', 'S093025-18082148097 Store ID 1117631 - Window Perf Cling Kate Spade -  42" x 57.5" - Safilo', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 93.5, 45, 170,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '189c35d8-e7f8-4b76-926c-d2b709f7d120', '00000000-0000-4000-a000-000000000001', 'e86a6eea-bdbf-4b5d-9182-8d638a50526c', 0,
  'wide_format', 'S100925-18147204571 Store ID 1126090 - Window Perf Cling Kate Spade -  70.65" x 46.90" - Safilo', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 66, 45, 120,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'aae91b97-0265-4a7d-9203-64eb77829ce5', '00000000-0000-4000-a000-000000000001', '3e70206c-83f2-4750-9b5c-5c1fb92fdc04', 0,
  'wide_format', 'P120425-10707647680 STORE ID 1127042 - DURATRAN - David Beckham - 37.5 x 21.75', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 23.1, 45, 42,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '6c93b184-fa88-451d-a463-196ba402f210', '00000000-0000-4000-a000-000000000001', 'bec77065-4696-44cd-b9a6-139afcdb4f64', 0,
  'wide_format', 'P111925-10599720990 STORE ID 0001124841- DURATRAN - CARRERA - 28" X 7', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 7.7, 45, 14,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'ecef4055-487d-43a5-94d6-381aeaad24b8', '00000000-0000-4000-a000-000000000001', 'd967accd-c51c-4fb2-838d-467be34fa575', 0,
  'digital_print', 'BC -Jesse Kolbe - Service Consultant (VW)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 38.5, 45, 70,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'a924fa38-2505-484d-96eb-73d7a2766415', '00000000-0000-4000-a000-000000000001', 'd967accd-c51c-4fb2-838d-467be34fa575', 1,
  'digital_print', 'BC -  Brandon Christie - Service Consultant (VW)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 38.5, 45, 70,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '29602c43-7dba-4077-908b-7d2c1f490406', '00000000-0000-4000-a000-000000000001', '9a13f79b-b9b8-4f8f-aac1-b9e1f52b1a1d', 0,
  'digital_print', 'Flyers 8.5 x 11, Gloss text 100# - color one side - ENGLISH', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 134.75, 45, 245,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '2b632877-1aca-4568-9cda-3e2ca7801c3f', '00000000-0000-4000-a000-000000000001', '9a13f79b-b9b8-4f8f-aac1-b9e1f52b1a1d', 1,
  'digital_print', 'Flyers 8.5 x 11, Gloss text 100# - color Double Sided - SPANISH/ENGLISH', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 33, 45, 60,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e31df51e-f185-44e4-98f4-4082231b8a56', '00000000-0000-4000-a000-000000000001', '03a5fcf5-cd9b-4f8f-8b65-9dbc8a65e7a4', 0,
  'digital_print', 'Memo Tags (Scored)-  4"x 3" - 10 pt C2/S Scored Tags 10.28.25 - 26 references (qty 15)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 29.22, 45, 53.12,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'b15b235a-8838-4c78-b15f-c090e54f66a9', '00000000-0000-4000-a000-000000000001', '03a5fcf5-cd9b-4f8f-8b65-9dbc8a65e7a4', 1,
  'digital_print', 'Set up Price for New tags', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 52.25, 45, 95,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '5e267d51-df0c-4556-97e6-adb7f17059a4', '00000000-0000-4000-a000-000000000001', '03a5fcf5-cd9b-4f8f-8b65-9dbc8a65e7a4', 2,
  'digital_print', 'Memo Tags (Scored)-  4"x 3" - 10 pt C2/S Saladino Scored Tags 9.4.25 9 reference, 100 Each', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 67.42, 45, 122.58,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'b029b3dd-3d10-45c7-bb67-0c018a53ec2c', '00000000-0000-4000-a000-000000000001', '03a5fcf5-cd9b-4f8f-8b65-9dbc8a65e7a4', 3,
  'digital_print', 'Memo Tags (Scored)-  4"x 3" - 10 pt C2/S Scored Tags 10.28.25 - 20 references (qty 75)', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 112.37, 45, 204.3,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e563e1f0-579a-43d2-9247-3912e14a111d', '00000000-0000-4000-a000-000000000001', '03a5fcf5-cd9b-4f8f-8b65-9dbc8a65e7a4', 4,
  'digital_print', 'Memo Tags (Scored)-  4"x 3" - 10 pt C2/S Scored Tags 10.28.25 - 1 references (qty 40)  & 1 Reference', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 6.74, 45, 12.26,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '883b641e-cad8-4d76-8d45-308020dbcb82', '00000000-0000-4000-a000-000000000001', 'aea50fff-ba0d-4180-800c-7c236099ca63', 0,
  'wide_format', 'White acrylic 12"x2.5"', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 41.25, 45, 75,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'a2c302af-0d10-404d-9939-0f70d26fa134', '00000000-0000-4000-a000-000000000001', 'c70984be-f9ab-4759-bc4e-1e6726ad4de7', 0,
  'wide_format', 'P101525-18194276169 - Store ID - 2137560039 - Foamboard - TB 36"x36" MARCOLIN', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 43.31, 45, 78.75,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '2e4eef3b-a2c5-4797-bfb3-8a913da571b7', '00000000-0000-4000-a000-000000000001', 'fa048269-4a5f-4926-a48d-5a296f784514', 0,
  'outsourced', 'Marc''s Crane - Vehicle Inspection Report -  2 Part NCR Forms - Full Color -  Padded', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 96.25, 45, 175,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '734f3bf5-1c95-4323-abc7-ba8c72238539', '00000000-0000-4000-a000-000000000001', 'fa048269-4a5f-4926-a48d-5a296f784514', 1,
  'outsourced', 'Marc''s Crane - Service Agreement 3 Part NCR Forms - Full Color Numbered - Booklets', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 184.25, 45, 335,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'fa91df0c-4f51-4986-83ed-9a2e51bcb12a', '00000000-0000-4000-a000-000000000001', 'ae18f4ef-0633-4701-9634-8075bd3ca4f2', 0,
  'outsourced', 'UVStickers for Mini Notebook & Pens - Installed', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 165, 45, 300,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'baa362f6-b484-4377-98b8-13dfd5da2e7a', '00000000-0000-4000-a000-000000000001', 'ae18f4ef-0633-4701-9634-8075bd3ca4f2', 1,
  'digital_print', 'Miller Notebook & Tres-Chic Softy Pen Gift Set - White', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 192.5, 45, 350,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '90da63be-2a74-4244-ae9c-c146fda939b5', '00000000-0000-4000-a000-000000000001', '8f6800d7-ebc1-4532-b004-92eac7dcd3db', 0,
  'wide_format', 'Custom Cut on Ultraboard provided by Customer - Hours', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1650, 45, 3000,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'db3ca154-3326-4a12-b13b-01d2964e3a74', '00000000-0000-4000-a000-000000000001', '8f6800d7-ebc1-4532-b004-92eac7dcd3db', 1,
  'wide_format', 'Flat Bed Full Color Print  on Ultraboard provided by Customer - 5x10', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1724.25, 45, 3135,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '6c5e2878-58d9-41df-bead-1511d9b98067', '00000000-0000-4000-a000-000000000001', '8f6800d7-ebc1-4532-b004-92eac7dcd3db', 2,
  'wide_format', 'Flat Bed Full Color Print  on Ultraboard provided by Customer - 4x8', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 1454.64, 45, 2644.8,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '94016a1b-fef1-46a7-9907-4d0d3ff230f4', '00000000-0000-4000-a000-000000000001', '7dfadca6-93e4-4f10-a60d-cac2ca32c036', 0,
  'wide_format', 'Classic Retractable Rollup Banner Stand - Anticurl, Soft Surface Graphics', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 112.75, 45, 205,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e150f343-1c08-49f4-a515-53dbe71c6e16', '00000000-0000-4000-a000-000000000001', '7dfadca6-93e4-4f10-a60d-cac2ca32c036', 1,
  'digital_print', 'BC - 2"x3.5" Uncoated 120# Cover Double Sided  - Ankeet Choxi, MD', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 30.25, 45, 55,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '57b04308-6557-4b41-baf6-12c76f740528', '00000000-0000-4000-a000-000000000001', '7dfadca6-93e4-4f10-a60d-cac2ca32c036', 2,
  'digital_print', 'STEMS - Saddle Stitched Booklet - Reprint', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 247.5, 45, 450,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'aa98a76b-a1f4-40a9-85d4-b8496c10d8c9', '00000000-0000-4000-a000-000000000001', '7dfadca6-93e4-4f10-a60d-cac2ca32c036', 3,
  'wide_format', 'Artwork adapatation for Retractable Banner', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 41.25, 45, 75,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '4f53d567-5f47-45ce-a046-78f8387bdd42', '00000000-0000-4000-a000-000000000001', 'bb08999d-a42b-4747-ba5f-1d70f0b4ecc4', 0,
  'installation', 'Delivery and Installation Cartier SEG graphics suplied by 4EON', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 82.5, 45, 150,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '34993313-8b32-46ff-ad43-55b8463e4560', '00000000-0000-4000-a000-000000000001', '226e801e-2adc-4c7d-a078-5dcec9234c3b', 0,
  'digital_print', 'CY2026 ANOC - Saddle Stitched - Weekly Enrollments - Oct 1st to Dec 15th', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 640.55, 45, 1164.64,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '9829944f-320e-40ad-bab6-9eeda85dd0fe', '00000000-0000-4000-a000-000000000001', 'b6c8d83b-011c-475c-9a9c-1c7d4226955b', 0,
  'wide_format', 'P092925-18071483166 - Store 157810 - Duratrans TF 17.25"x11.25"- MARCOLIN', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 7.7, 45, 14,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '7edc030b-8cbe-4dce-8cea-9679fee9aaf5', '00000000-0000-4000-a000-000000000001', '5b4b1fa3-d4fd-4ad5-b572-c5ca29e1306b', 0,
  'digital_print', 'KIA Special Offer Coupon Books - Insides Perfect Binding', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 2455.75, 45, 4465,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'b10f96b2-af5b-4181-982a-33187efcec58', '00000000-0000-4000-a000-000000000001', '5b4b1fa3-d4fd-4ad5-b572-c5ca29e1306b', 1,
  'digital_print', 'KIA Special Offers Coupon Books - Front & Back Cover', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 288.75, 45, 525,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '08204936-aa2f-4a65-bc81-aad52fff89c1', '00000000-0000-4000-a000-000000000001', '92347196-1e45-4af1-958b-31ac8f1d5f8e', 0,
  'wide_format', 'P121625-10790980677 - Store 219261 - Duratrans TF 15" x 15 ''- MARCOLIN', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 7.7, 45, 14,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '86533099-69ce-4911-8493-6e5efba7a71d', '00000000-0000-4000-a000-000000000001', '92347196-1e45-4af1-958b-31ac8f1d5f8e', 1,
  'wide_format', 'P121625-10790980677 - Store 219261 - Duratrans TF 28.5" x 9.5 ''- MARCOLIN', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 7.7, 45, 14,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '419290ac-2639-46bc-ba97-397819f7a8cf', '00000000-0000-4000-a000-000000000001', '94c09206-90cc-4c79-a355-d2cb39a948e6', 0,
  'wide_format', 'P121625-10794848729 - Store ID 187640 - Poster - "Conservative TF"78"x35" MARCOLIN', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 83.6, 45, 152,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'f8baa6c6-834d-4d60-b074-ebe253b3c1be', '00000000-0000-4000-a000-000000000001', 'addf3c42-8650-42ba-8a8b-076082c0de14', 0,
  'wide_format', 'Self Standing Life Size Standees - WeCanIt - with Easel Back', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 357.5, 45, 650,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '59971d56-05dd-49d8-95a1-3be519af2833', '00000000-0000-4000-a000-000000000001', 'addf3c42-8650-42ba-8a8b-076082c0de14', 1,
  'outsourced', '8ft AF Deluxe PopUp Structure  with Graphics - Front Only', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 467.5, 45, 850,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '8284456a-69eb-4108-9e58-1c69991a9c7e', '00000000-0000-4000-a000-000000000001', 'de9290df-0ee4-4211-8380-2204e8b4e4b0', 0,
  'wide_format', 'Pedestal wrap 12 W'' x 12" L x 36" H - JOL - MIU MIU', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 192.5, 45, 350,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'd813ba97-e963-4513-9114-6dbd10d59edb', '00000000-0000-4000-a000-000000000001', 'de9290df-0ee4-4211-8380-2204e8b4e4b0', 1,
  'wide_format', 'JOL Foamboard 3/16" - full Color 96. 5"H x 30.5 W with holes for standoffs - COLUMN - MIU MIU', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 132, 45, 240,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'e5543255-6cf0-49ce-80e0-9d79d27666ce', '00000000-0000-4000-a000-000000000001', 'de9290df-0ee4-4211-8380-2204e8b4e4b0', 2,
  'digital_print', 'JOL Dolphin: Foamboard 1/2", 37" X 96" Black Core, Direct to Print Photo Quality Finish, Double Side', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 181.5, 45, 330,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  '8cd88910-4a8f-44e4-b4f7-aa8a562b05fc', '00000000-0000-4000-a000-000000000001', 'de9290df-0ee4-4211-8380-2204e8b4e4b0', 3,
  'digital_print', 'JOL Dolphin: Foamboard 1/2", 37" X 96" Black Core, Direct to Print Photo Quality Finish, Double Side', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 181.5, 45, 330,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'b6fb1315-f6be-4132-b509-0a9eeb1fc52f', '00000000-0000-4000-a000-000000000001', 'de9290df-0ee4-4211-8380-2204e8b4e4b0', 4,
  'outsourced', 'POV Dolphin Mall -  Delivery and Installation', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 52.25, 45, 95,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);
INSERT INTO order_line_items (
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
  'a583c081-8809-4217-8e26-959added6122', '00000000-0000-4000-a000-000000000001', '9fd4e0b8-54b8-435c-b6cf-ba34f1375f2b', 0,
  'installation', 'Delivery and Installation Cartier SEG graphics suplied by 4EON - JOL', 1, 'each',
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  0, 0, 0,
  NULL, NULL,
  0, 0, 82.5, 45, 150,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  false, NULL,
  NULL, NULL, NULL,
  '{}'::jsonb, false, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  now(), now()
);

-- ── 43. Invoices ──────────────────────────────────────────────────────────
INSERT INTO invoices (
  id, organization_id, number, status,
  customer_id, customer_name,
  subtotal, tax_rate, tax_amount, total,
  due_date, paid_date, paid_amount,
  notes,
  created_at, updated_at
) VALUES (
  '5a7ae377-1fed-466a-b661-6043ef5b4a73', '00000000-0000-4000-a000-000000000001', 'I000001', 'paid',
  '3df43acc-22e3-4901-b7b0-fca4a74cf782', 'Strategic Solutions Network',
  137.75, 0.07, 9.64, 147.39,
  '2026-03-15'::date, '2026-03-12'::date, 147.39,
  NULL,
  '2026-03-08T00:00:00Z'::timestamptz, '2026-03-12T00:00:00Z'::timestamptz
);

-- ── 44. Invoice Line Items ────────────────────────────────────────────────
INSERT INTO invoice_line_items (
  id, organization_id, invoice_id, order_id, order_item_id,
  description, quantity, unit, unit_price, total,
  position, created_at
) VALUES (
  'e2e6bef9-bfe9-412e-8e0e-458749f11084', '00000000-0000-4000-a000-000000000001', '5a7ae377-1fed-466a-b661-6043ef5b4a73',
  '1d60f1f8-6d38-424f-a94e-6dffbf5c04b0', NULL,
  'Business Cards 3.5x2 (O000003)', 500, 'each',
  0.28, 137.75,
  0, now()
);

-- ── 45. Invoice ↔ Order Junction ──────────────────────────────────────────
INSERT INTO invoice_orders (invoice_id, order_id, created_at, updated_at)
VALUES ('5a7ae377-1fed-466a-b661-6043ef5b4a73', '1d60f1f8-6d38-424f-a94e-6dffbf5c04b0', now(), now())
ON CONFLICT DO NOTHING;

-- ── 46. Purchase Orders ───────────────────────────────────────────────────
INSERT INTO purchase_orders (
  id, organization_id, number,
  vendor_id, order_id, status,
  subtotal, tax, total,
  notes, expected_date, received_date,
  sent_at, acknowledged_at,
  created_by, created_at, updated_at
) VALUES (
  '8e9873d0-e805-4fdb-8762-742219f00c05', '00000000-0000-4000-a000-000000000001', 'PO000001',
  'e214529d-79e5-4a28-b5e2-e48fe43adad3', '1243dce4-40b0-4e7d-823e-5a008fea786d', 'received',
  370, 0, 370,
  'Rush order for 4eon booth wrap', '2026-03-20'::date, '2026-03-19'::date,
  '2026-03-13T00:00:00Z'::timestamptz, '2026-03-14T00:00:00Z'::timestamptz,
  'f2253de0-53bf-478b-ae27-1409352d0e9e',
  '2026-03-13T00:00:00Z'::timestamptz, '2026-03-19T00:00:00Z'::timestamptz
);

-- ── 47. Purchase Order Items ──────────────────────────────────────────────
INSERT INTO purchase_order_items (
  id, organization_id, purchase_order_id,
  description, quantity, unit, unit_cost, total,
  order_item_id, received_quantity, position,
  created_at
) VALUES (
  '37a0fb91-daf4-4700-b880-6899b3203072', '00000000-0000-4000-a000-000000000001', '8e9873d0-e805-4fdb-8762-742219f00c05',
  '3M IJ180 White Vinyl - 54" x 25yd roll', 2, 'roll',
  185, 370,
  NULL, 2, 0,
  now()
);

-- ── Re-enable audit triggers ──────────────────────────────────────────────
ALTER TABLE company_settings ENABLE TRIGGER ALL;
ALTER TABLE document_templates ENABLE TRIGGER ALL;
ALTER TABLE customers ENABLE TRIGGER ALL;
ALTER TABLE customer_shipping_addresses ENABLE TRIGGER ALL;
ALTER TABLE contacts ENABLE TRIGGER ALL;
ALTER TABLE vendors ENABLE TRIGGER ALL;
ALTER TABLE purchase_orders ENABLE TRIGGER ALL;
ALTER TABLE purchase_order_items ENABLE TRIGGER ALL;
ALTER TABLE quotes ENABLE TRIGGER ALL;
ALTER TABLE quote_line_items ENABLE TRIGGER ALL;
ALTER TABLE orders ENABLE TRIGGER ALL;
ALTER TABLE order_line_items ENABLE TRIGGER ALL;
ALTER TABLE invoices ENABLE TRIGGER ALL;
ALTER TABLE invoice_line_items ENABLE TRIGGER ALL;
ALTER TABLE invoice_orders ENABLE TRIGGER ALL;
ALTER TABLE workflows ENABLE TRIGGER ALL;
ALTER TABLE workflow_stages ENABLE TRIGGER ALL;
ALTER TABLE tracking_devices ENABLE TRIGGER ALL;
ALTER TABLE pricing_categories ENABLE TRIGGER ALL;
ALTER TABLE pricing_products ENABLE TRIGGER ALL;
ALTER TABLE pricing_product_categories ENABLE TRIGGER ALL;
ALTER TABLE pricing_equipment ENABLE TRIGGER ALL;
ALTER TABLE maintenance_records ENABLE TRIGGER ALL;
ALTER TABLE pricing_materials ENABLE TRIGGER ALL;
ALTER TABLE material_groups ENABLE TRIGGER ALL;
ALTER TABLE material_group_assignments ENABLE TRIGGER ALL;
ALTER TABLE material_category_assignments ENABLE TRIGGER ALL;
ALTER TABLE material_product_assignments ENABLE TRIGGER ALL;
ALTER TABLE material_group_categories ENABLE TRIGGER ALL;
ALTER TABLE material_change_history ENABLE TRIGGER ALL;
ALTER TABLE pricing_finishing ENABLE TRIGGER ALL;
ALTER TABLE finishing_groups ENABLE TRIGGER ALL;
ALTER TABLE finishing_group_assignments ENABLE TRIGGER ALL;
ALTER TABLE finishing_category_assignments ENABLE TRIGGER ALL;
ALTER TABLE finishing_product_assignments ENABLE TRIGGER ALL;
ALTER TABLE pricing_labor ENABLE TRIGGER ALL;
ALTER TABLE labor_groups ENABLE TRIGGER ALL;
ALTER TABLE labor_group_assignments ENABLE TRIGGER ALL;
ALTER TABLE labor_category_assignments ENABLE TRIGGER ALL;
ALTER TABLE pricing_brokered ENABLE TRIGGER ALL;
ALTER TABLE brokered_groups ENABLE TRIGGER ALL;
ALTER TABLE brokered_group_assignments ENABLE TRIGGER ALL;
ALTER TABLE brokered_category_assignments ENABLE TRIGGER ALL;
ALTER TABLE product_templates ENABLE TRIGGER ALL;
ALTER TABLE pricing_templates ENABLE TRIGGER ALL;

COMMIT;

-- ============================================================================
-- Seed data migration complete!
-- ============================================================================
-- Summary:
--   Profiles:              5
--   Organization:          1
--   Customers:             80
--   Contacts:              97
--   Vendors:               5
--   Workflows:             3
--   Workflow Stages:       17
--   Tracking Devices:      1
--   Pricing Categories:    3
--   Pricing Products:      6
--   Pricing Equipment:     4
--   Pricing Materials:     60
--   Pricing Finishing:     12
--   Pricing Labor:         4
--   Pricing Brokered:      2
--   Material Groups:       4
--   Finishing Groups:      6
--   Labor Groups:          3
--   Brokered Groups:       2
--   Product Templates:     12
--   Pricing Templates:     4
--   Quotes:                5
--   Orders:                83 (4 active + 79 historical)
--   Invoices:              1
--   Purchase Orders:       1
--   Document Templates:    5
-- ============================================================================