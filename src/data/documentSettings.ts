import type { CompanySettings, DocumentTemplates } from '../types';

export const DEFAULT_QUOTE_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
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
</html>`;

export const DEFAULT_ORDER_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
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
</html>`;

export const DEFAULT_WORK_ORDER_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 28px; }
    .company-name { font-size: 22px; font-weight: bold; color: #1f2937; }
    .company-info { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-title { font-size: 28px; font-weight: bold; color: #1f2937; text-align: right; }
    .doc-number { font-size: 16px; font-weight: 600; color: #0f766e; text-align: right; margin-top: 4px; }
    .header-right { display: flex; align-items: flex-start; gap: 18px; }
    .header-copy { text-align: right; }
    .qr-box { width: 84px; text-align: center; }
    .qr-box img { width: 84px; height: 84px; display: block; border: 1px solid #e5e7eb; border-radius: 8px; }
    .qr-caption { font-size: 9px; color: #94a3b8; margin-top: 6px; letter-spacing: 0.06em; text-transform: uppercase; }
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
        <div class="qr-caption">Tracker Link</div>
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
</html>`;

export const DEFAULT_INVOICE_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
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
</html>`;

export const DEFAULT_PURCHASE_ORDER_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
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
</html>`;

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'PrintCo Solutions',
  email: 'admin@printco.com',
  phone: '555-100-0000',
  address: '100 Print Ave',
  city: 'Miami',
  state: 'FL',
  zip: '33101',
  website: 'www.printco.com',
  tagline: 'Quality Print. Fast Delivery.',
  primaryBrandColor: '#2563eb',
  defaultTaxRate: 7,
  defaultMarkup: 45,
  defaultLaborRate: 45,
  quoteValidDays: 45,
  currency: 'USD',
  timezone: 'America/New_York',
  defaultBleed: 0.125,
  defaultGutter: 0,
  defaultBleedWide: 0.25,
  defaultGutterWide: 0,
};

export const DEFAULT_DOCUMENT_TEMPLATES: DocumentTemplates = {
  quote: DEFAULT_QUOTE_TEMPLATE,
  order: DEFAULT_ORDER_TEMPLATE,
  workOrder: DEFAULT_WORK_ORDER_TEMPLATE,
  invoice: DEFAULT_INVOICE_TEMPLATE,
  purchaseOrder: DEFAULT_PURCHASE_ORDER_TEMPLATE,
};
