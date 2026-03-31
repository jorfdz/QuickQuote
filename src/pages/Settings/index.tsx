import React, { useState, useMemo } from 'react';
import { Building, CreditCard, Printer, Globe, Shield, Bell, Palette, Plus, Pencil, Trash2, Star, Package, Layers, FileText, RotateCcw, Eye, Ruler } from 'lucide-react';
import { Card, PageHeader, Button, Input, Textarea, Tabs, Select, Table, Modal, ConfirmDialog } from '../../components/ui';
import { usePricingStore } from '../../store/pricingStore';
import type { PricingCategory, PricingProduct } from '../../types/pricing';

const TABS = [
  { id: 'company', label: 'Company' }, { id: 'branding', label: 'Branding' },
  { id: 'documents', label: 'Documents' },
  { id: 'defaults', label: 'Quote Defaults' }, { id: 'catalog', label: 'Catalog' },
  { id: 'notifications', label: 'Notifications' }, { id: 'billing', label: 'Billing' },
];

// ─── DEFAULT DOCUMENT TEMPLATES ─────────────────────────────────────────────

const DEFAULT_QUOTE_TEMPLATE = `<!DOCTYPE html>
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

const DEFAULT_ORDER_TEMPLATE = `<!DOCTYPE html>
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

const DEFAULT_INVOICE_TEMPLATE = `<!DOCTYPE html>
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

const CATALOG_SUBTABS = [
  { id: 'categories', label: 'Categories' },
  { id: 'products', label: 'Products' },
];

// ─── BLANK FORMS ──────────────────────────────────────────────────────────────

const blankCategory = (): Omit<PricingCategory, 'id' | 'createdAt'> => ({
  name: '', description: '', sortOrder: 0,
});

const blankProduct = (): Omit<PricingProduct, 'id' | 'createdAt'> => ({
  categoryId: '', name: '', aliases: [], defaultQuantity: 250,
  defaultFinalSize: '', defaultFinalWidth: 0, defaultFinalHeight: 0,
  defaultMaterialName: '', defaultEquipmentName: '',
  defaultColor: 'Color', defaultSides: 'Single', defaultFolding: '',
  isTemplate: false,
});

// ─── SETTINGS COMPONENT ───────────────────────────────────────────────────────

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [company, setCompany] = useState({
    name: 'PrintCo Solutions', email: 'admin@printco.com', phone: '555-100-0000',
    address: '100 Print Ave', city: 'Miami', state: 'FL', zip: '33101',
    website: 'www.printco.com', tagline: 'Quality Print. Fast Delivery.',
    defaultTaxRate: 7, defaultMarkup: 45, defaultLaborRate: 45,
    quoteValidDays: 45, currency: 'USD', timezone: 'America/New_York',
    defaultBleed: 0.125, defaultGutter: 0,
    defaultBleedWide: 0.25, defaultGutterWide: 0,
  });

  // Default sizes by category state (Item 28)
  const [defaultSizesByCategory, setDefaultSizesByCategory] = useState<Record<string, string>>({
    'Digital Press': '3.5x2, 4x6, 5x7, 8.5x11, 11x17',
    'Signs': '24x36, 48x96, 24x18',
    'Wide Format': '24x36, 36x48, 42x60',
  });

  const updateCategorySizes = (categoryName: string, sizes: string) => {
    setDefaultSizesByCategory(prev => ({ ...prev, [categoryName]: sizes }));
  };

  // Document template state
  const [quoteTemplate, setQuoteTemplate] = useState(DEFAULT_QUOTE_TEMPLATE);
  const [orderTemplate, setOrderTemplate] = useState(DEFAULT_ORDER_TEMPLATE);
  const [invoiceTemplate, setInvoiceTemplate] = useState(DEFAULT_INVOICE_TEMPLATE);
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  const [templatePreviewHtml, setTemplatePreviewHtml] = useState('');
  const [templatePreviewTitle, setTemplatePreviewTitle] = useState('');

  const openTemplatePreview = (title: string, html: string) => {
    // Replace placeholders with sample data for preview
    const sampleData: Record<string, string> = {
      '{{companyName}}': company.name,
      '{{companyAddress}}': `${company.address}, ${company.city}, ${company.state} ${company.zip}`,
      '{{companyPhone}}': company.phone,
      '{{companyEmail}}': company.email,
      '{{quoteNumber}}': 'Q000123',
      '{{orderNumber}}': 'O000045',
      '{{invoiceNumber}}': 'I000012',
      '{{customerName}}': 'Acme Corporation',
      '{{quoteDate}}': 'Mar 30, 2026',
      '{{orderDate}}': 'Mar 30, 2026',
      '{{invoiceDate}}': 'Mar 30, 2026',
      '{{validUntil}}': 'May 14, 2026',
      '{{dueDate}}': 'Apr 30, 2026',
      '{{lineItems}}': `
        <tr><td>Business Cards - 14pt C2S, Full Color</td><td style="text-align:center">500</td><td style="text-align:right">$0.12</td><td style="text-align:right">$60.00</td></tr>
        <tr style="background:#f9fafb"><td>Vinyl Banner - 13oz Matte</td><td style="text-align:center">2</td><td style="text-align:right">$85.00</td><td style="text-align:right">$170.00</td></tr>
        <tr><td>Yard Signs - Coroplast 4mm</td><td style="text-align:center">25</td><td style="text-align:right">$12.50</td><td style="text-align:right">$312.50</td></tr>`,
      '{{subtotal}}': '$542.50',
      '{{tax}}': '$37.98',
      '{{total}}': '$580.48',
    };
    let rendered = html;
    Object.entries(sampleData).forEach(([key, value]) => {
      rendered = rendered.split(key).join(value);
    });
    setTemplatePreviewTitle(title);
    setTemplatePreviewHtml(rendered);
    setTemplatePreviewOpen(true);
  };

  // Catalog state
  const [catalogSubTab, setCatalogSubTab] = useState('categories');

  // Category modal state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState(blankCategory());
  const [catDeleteConfirm, setCatDeleteConfirm] = useState<string | null>(null);

  // Product modal state
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodEditId, setProdEditId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState(blankProduct());
  const [prodAliasesStr, setProdAliasesStr] = useState('');
  const [prodDeleteConfirm, setProdDeleteConfirm] = useState<string | null>(null);
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');

  // Pricing store
  const {
    categories, products,
    addCategory, updateCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct, toggleProductTemplate,
  } = usePricingStore();

  // ─── Category helpers ────────────────────────────────────────────────────

  const openAddCategory = () => {
    setCatEditId(null);
    setCatForm(blankCategory());
    setCatModalOpen(true);
  };

  const openEditCategory = (cat: PricingCategory) => {
    setCatEditId(cat.id);
    setCatForm({ name: cat.name, description: cat.description || '', sortOrder: cat.sortOrder });
    setCatModalOpen(true);
  };

  const saveCategory = () => {
    if (!catForm.name.trim()) return;
    if (catEditId) {
      updateCategory(catEditId, catForm);
    } else {
      addCategory(catForm);
    }
    setCatModalOpen(false);
  };

  const productCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => { map[p.categoryId] = (map[p.categoryId] || 0) + 1; });
    return map;
  }, [products]);

  // ─── Product helpers ─────────────────────────────────────────────────────

  const openAddProduct = () => {
    setProdEditId(null);
    const blank = blankProduct();
    if (categories.length > 0) blank.categoryId = categories[0].id;
    setProdForm(blank);
    setProdAliasesStr('');
    setProdModalOpen(true);
  };

  const openEditProduct = (prod: PricingProduct) => {
    setProdEditId(prod.id);
    setProdForm({
      categoryId: prod.categoryId, name: prod.name, aliases: prod.aliases,
      defaultQuantity: prod.defaultQuantity, defaultFinalSize: prod.defaultFinalSize,
      defaultFinalWidth: prod.defaultFinalWidth, defaultFinalHeight: prod.defaultFinalHeight,
      defaultMaterialName: prod.defaultMaterialName || '', defaultEquipmentName: prod.defaultEquipmentName || '',
      defaultColor: prod.defaultColor, defaultSides: prod.defaultSides,
      defaultFolding: prod.defaultFolding || '', isTemplate: prod.isTemplate,
    });
    setProdAliasesStr(prod.aliases.join(', '));
    setProdModalOpen(true);
  };

  const saveProduct = () => {
    if (!prodForm.name.trim() || !prodForm.categoryId) return;
    const data = {
      ...prodForm,
      aliases: prodAliasesStr.split(',').map(a => a.trim()).filter(Boolean),
    };
    if (prodEditId) {
      updateProduct(prodEditId, data);
    } else {
      addProduct(data);
    }
    setProdModalOpen(false);
  };

  const filteredProducts = useMemo(() => {
    if (prodCategoryFilter === 'all') return products;
    return products.filter(p => p.categoryId === prodCategoryFilter);
  }, [products, prodCategoryFilter]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your QuikQuote account" />
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── COMPANY TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'company' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building className="w-4 h-4 text-blue-500" /> Company Information</h2>
          <div className="space-y-4">
            <Input label="Company Name" value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} />
              <Input label="Phone" value={company.phone} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} />
            </div>
            <Input label="Address" value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" value={company.city} onChange={e => setCompany(c => ({ ...c, city: e.target.value }))} />
              <Input label="State" value={company.state} onChange={e => setCompany(c => ({ ...c, state: e.target.value }))} />
              <Input label="ZIP" value={company.zip} onChange={e => setCompany(c => ({ ...c, zip: e.target.value }))} />
            </div>
            <Input label="Website" value={company.website} onChange={e => setCompany(c => ({ ...c, website: e.target.value }))} prefix={<Globe className="w-3.5 h-3.5" />} />
            <div className="flex gap-3 pt-2">
              <Button variant="primary">Save Changes</Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── DEFAULTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'defaults' && (
        <div className="space-y-6 max-w-2xl">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quote & Pricing Defaults</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Default Tax Rate (%)" type="number" value={company.defaultTaxRate} onChange={e => setCompany(c => ({ ...c, defaultTaxRate: parseFloat(e.target.value) }))} suffix="%" />
                <Input label="Default Markup (%)" type="number" value={company.defaultMarkup} onChange={e => setCompany(c => ({ ...c, defaultMarkup: parseFloat(e.target.value) }))} suffix="%" />
                <Input label="Default Labor Rate ($/hr)" type="number" value={company.defaultLaborRate} onChange={e => setCompany(c => ({ ...c, defaultLaborRate: parseFloat(e.target.value) }))} prefix="$" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Quote Valid (days)" type="number" value={company.quoteValidDays} onChange={e => setCompany(c => ({ ...c, quoteValidDays: parseInt(e.target.value) }))} />
                <Select label="Currency" value={company.currency} onChange={e => setCompany(c => ({ ...c, currency: e.target.value }))} options={[{ value: 'USD', label: 'USD - US Dollar' }, { value: 'CAD', label: 'CAD - Canadian Dollar' }]} />
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Shop Profile</h3>
                <p className="text-xs text-blue-600 mb-3">Tell QuikQuote what products you produce to personalize your experience.</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Digital Print', 'Wide Format', 'Offset Print', 'Signs & Displays', 'Apparel', 'Labels', 'Promo Products', 'Finishing', 'Installation'].map(p => (
                    <label key={p} className="flex items-center gap-2 text-xs text-blue-800 cursor-pointer">
                      <input type="checkbox" defaultChecked={['Digital Print', 'Wide Format', 'Signs & Displays'].includes(p)} className="rounded border-blue-300 text-blue-600" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> Imposition Defaults</h2>
            <p className="text-xs text-gray-500 mb-4">Default bleed and gutter values used when calculating imposition layouts.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Default Bleed (in)" type="number" step="0.001" value={company.defaultBleed} onChange={e => setCompany(c => ({ ...c, defaultBleed: parseFloat(e.target.value) || 0 }))} suffix="in" />
                <Input label="Default Gutter (in)" type="number" step="0.001" value={company.defaultGutter} onChange={e => setCompany(c => ({ ...c, defaultGutter: parseFloat(e.target.value) || 0 }))} suffix="in" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Default Bleed - Wide Format (in)" type="number" step="0.001" value={company.defaultBleedWide} onChange={e => setCompany(c => ({ ...c, defaultBleedWide: parseFloat(e.target.value) || 0 }))} suffix="in" />
                <Input label="Default Gutter - Wide Format (in)" type="number" step="0.001" value={company.defaultGutterWide} onChange={e => setCompany(c => ({ ...c, defaultGutterWide: parseFloat(e.target.value) || 0 }))} suffix="in" />
              </div>
            </div>
          </Card>

          {/* Default Sizes by Category (Item 28) */}
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Ruler className="w-4 h-4 text-blue-500" /> Default Sizes by Category</h2>
            <p className="text-xs text-gray-500 mb-4">Define common sizes for each pricing category. These will appear as quick-select options when creating materials. Enter sizes as comma-separated values (e.g. "3.5x2, 4x6, 8.5x11").</p>
            <div className="space-y-3">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-start gap-3">
                  <div className="w-32 flex-shrink-0 pt-2">
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  </div>
                  <div className="flex-1">
                    <input
                      value={defaultSizesByCategory[cat.name] || ''}
                      onChange={e => updateCategorySizes(cat.name, e.target.value)}
                      placeholder="e.g. 3.5x2, 4x6, 8.5x11, 11x17"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    />
                    {defaultSizesByCategory[cat.name] && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {defaultSizesByCategory[cat.name].split(',').map(s => s.trim()).filter(Boolean).map((size, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{size}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-gray-400 italic">No categories defined. Add categories in the Catalog tab first.</p>
              )}
            </div>
          </Card>

          <div className="flex gap-3"><Button variant="primary">Save Defaults</Button></div>
        </div>
      )}

      {/* ── CATALOG TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'catalog' && (
        <div>
          {/* Sub-tabs */}
          <div className="flex gap-1 mb-6">
            {CATALOG_SUBTABS.map(st => (
              <button key={st.id} onClick={() => setCatalogSubTab(st.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${catalogSubTab === st.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                {st.label}
              </button>
            ))}
          </div>

          {/* ── CATEGORIES SUB-TAB ──────────────────────────────────────── */}
          {catalogSubTab === 'categories' && (
            <Card className="p-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" /> Categories
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-1">{categories.length}</span>
                </h2>
                <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddCategory}>Add Category</Button>
              </div>
              <Table headers={['Name', 'Description', 'Sort Order', '# Products', 'Actions']}>
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{cat.name}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs max-w-xs truncate">{cat.description || '--'}</td>
                    <td className="py-3 px-4 text-gray-600">{cat.sortOrder}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{productCountByCategory[cat.id] || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditCategory(cat)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setCatDeleteConfirm(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No categories yet. Add one to get started.</td></tr>
                )}
              </Table>
            </Card>
          )}

          {/* ── PRODUCTS SUB-TAB ────────────────────────────────────────── */}
          {catalogSubTab === 'products' && (
            <Card className="p-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" /> Products
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-1">{filteredProducts.length}</span>
                </h2>
                <div className="flex items-center gap-3">
                  <Select value={prodCategoryFilter} onChange={e => setProdCategoryFilter(e.target.value)}
                    options={[{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
                  <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddProduct}>Add Product</Button>
                </div>
              </div>
              <Table headers={['Name', 'Category', 'Aliases', 'Size', 'Paper', 'Equipment', 'Color', 'Sides', 'Template', 'Actions']}>
                {filteredProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{prod.name}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{getCategoryName(prod.categoryId)}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs max-w-[160px] truncate">{prod.aliases.length > 0 ? prod.aliases.join(', ') : '--'}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultFinalSize || '--'}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultMaterialName || '--'}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultEquipmentName || '--'}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultColor}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultSides}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleProductTemplate(prod.id)} className="p-1 rounded transition-colors hover:bg-yellow-50">
                        <Star className={`w-4 h-4 ${prod.isTemplate ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditProduct(prod)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setProdDeleteConfirm(prod.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-400">No products found. Add one to get started.</td></tr>
                )}
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* ── BRANDING TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Palette className="w-4 h-4 text-blue-500" /> Branding & Documents</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Company Logo</label>
              <div className="w-32 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 cursor-pointer hover:border-blue-300 transition-colors">
                <div className="text-center"><p className="text-2xl">&#x1f5bc;&#xfe0f;</p><p className="text-xs text-gray-400 mt-1">Upload logo</p></div>
              </div>
            </div>
            <Input label="Primary Brand Color" type="color" defaultValue="#2563eb" className="w-20 h-10" />
            <Textarea label="Quote Footer Text" defaultValue="Thank you for your business! Payment due within 30 days." rows={2} />
            <Textarea label="Invoice Footer Text" defaultValue="Questions? Contact us at admin@printco.com" rows={2} />
            <div className="flex gap-3 pt-2"><Button variant="primary">Save Branding</Button></div>
          </div>
        </Card>
      )}

      {/* ── DOCUMENTS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="space-y-6 max-w-4xl">
          {/* Quote Template */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> Quote Template HTML
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => openTemplatePreview('Quote Template Preview', quoteTemplate)}>
                  Preview
                </Button>
                <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setQuoteTemplate(DEFAULT_QUOTE_TEMPLATE)}>
                  Reset to Default
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Available placeholders: <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{quoteNumber}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{customerName}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{lineItems}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{subtotal}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{tax}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{total}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{companyName}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{validUntil}}'}</code>
            </p>
            <textarea
              value={quoteTemplate}
              onChange={e => setQuoteTemplate(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 text-sm bg-gray-900 text-green-400 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace", fontSize: '12px', lineHeight: '1.6', tabSize: 2 }}
              spellCheck={false}
            />
          </Card>

          {/* Order Template */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Order Template HTML
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => openTemplatePreview('Order Template Preview', orderTemplate)}>
                  Preview
                </Button>
                <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setOrderTemplate(DEFAULT_ORDER_TEMPLATE)}>
                  Reset to Default
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Available placeholders: <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{orderNumber}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{customerName}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{lineItems}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{subtotal}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{tax}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{total}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{companyName}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{dueDate}}'}</code>
            </p>
            <textarea
              value={orderTemplate}
              onChange={e => setOrderTemplate(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 text-sm bg-gray-900 text-green-400 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace", fontSize: '12px', lineHeight: '1.6', tabSize: 2 }}
              spellCheck={false}
            />
          </Card>

          {/* Invoice Template */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" /> Invoice Template HTML
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => openTemplatePreview('Invoice Template Preview', invoiceTemplate)}>
                  Preview
                </Button>
                <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setInvoiceTemplate(DEFAULT_INVOICE_TEMPLATE)}>
                  Reset to Default
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Available placeholders: <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{invoiceNumber}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{customerName}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{lineItems}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{subtotal}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{tax}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{total}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{companyName}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{dueDate}}'}</code>
            </p>
            <textarea
              value={invoiceTemplate}
              onChange={e => setInvoiceTemplate(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 text-sm bg-gray-900 text-green-400 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace", fontSize: '12px', lineHeight: '1.6', tabSize: 2 }}
              spellCheck={false}
            />
          </Card>

          <div className="flex gap-3">
            <Button variant="primary">Save Templates</Button>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" /> Notification Preferences</h2>
          <div className="space-y-3">
            {[
              { label: 'New order created', checked: true }, { label: 'Order status changed', checked: true },
              { label: 'Quote about to expire', checked: true }, { label: 'Invoice overdue', checked: true },
              { label: 'PO received from vendor', checked: false }, { label: 'PlanProphet sync events', checked: true },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700">{n.label}</span>
                <button className={`w-9 h-5 rounded-full transition-colors relative ${n.checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${n.checked ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── BILLING TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'billing' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-500" /> Subscription & Billing</h2>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-900">QuikQuote Pro</p>
                <p className="text-xs text-blue-600">$149/month · Up to 10 users</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">Active</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Your next billing date is April 1, 2026.</p>
          <div className="flex gap-3 mt-4"><Button variant="secondary">Manage Subscription</Button><Button variant="ghost">View Invoices</Button></div>
        </Card>
      )}

      {/* ── CATEGORY MODAL ───────────────────────────────────────────────── */}
      <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title={catEditId ? 'Edit Category' : 'Add Category'} size="sm">
        <div className="space-y-4">
          <Input label="Name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Digital Print" />
          <Input label="Description" value={catForm.description || ''} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          <Input label="Sort Order" type="number" value={catForm.sortOrder} onChange={e => setCatForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveCategory}>{catEditId ? 'Save Changes' : 'Add Category'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── CATEGORY DELETE CONFIRM ──────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!catDeleteConfirm}
        onClose={() => setCatDeleteConfirm(null)}
        onConfirm={() => { if (catDeleteConfirm) deleteCategory(catDeleteConfirm); }}
        title="Delete Category"
        message="Are you sure you want to delete this category? Products in this category will not be deleted but will become uncategorized."
      />

      {/* ── PRODUCT MODAL ────────────────────────────────────────────────── */}
      <Modal isOpen={prodModalOpen} onClose={() => setProdModalOpen(false)} title={prodEditId ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Product Name" value={prodForm.name} onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Business Cards" />
            <Select label="Category" value={prodForm.categoryId} onChange={e => setProdForm(f => ({ ...f, categoryId: e.target.value }))}
              options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </div>
          <Input label="Aliases (comma-separated)" value={prodAliasesStr} onChange={e => setProdAliasesStr(e.target.value)} placeholder="e.g. Biz Cards, BC, Calling Cards" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Default Quantity" type="number" value={prodForm.defaultQuantity} onChange={e => setProdForm(f => ({ ...f, defaultQuantity: parseInt(e.target.value) || 0 }))} />
            <Input label="Default Final Size" value={prodForm.defaultFinalSize} onChange={e => setProdForm(f => ({ ...f, defaultFinalSize: e.target.value }))} placeholder="e.g. 3.5x2" />
            <div />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Final Width (in)" type="number" step="0.01" value={prodForm.defaultFinalWidth} onChange={e => setProdForm(f => ({ ...f, defaultFinalWidth: parseFloat(e.target.value) || 0 }))} />
            <Input label="Final Height (in)" type="number" step="0.01" value={prodForm.defaultFinalHeight} onChange={e => setProdForm(f => ({ ...f, defaultFinalHeight: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Default Paper / Material" value={prodForm.defaultMaterialName || ''} onChange={e => setProdForm(f => ({ ...f, defaultMaterialName: e.target.value }))} placeholder="e.g. 14pt C2S" />
            <Input label="Default Equipment" value={prodForm.defaultEquipmentName || ''} onChange={e => setProdForm(f => ({ ...f, defaultEquipmentName: e.target.value }))} placeholder="e.g. Ricoh C7200" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Default Color" value={prodForm.defaultColor} onChange={e => setProdForm(f => ({ ...f, defaultColor: e.target.value as PricingProduct['defaultColor'] }))}
              options={[{ value: 'Color', label: 'Color' }, { value: 'Black', label: 'Black' }, { value: 'Color & Black', label: 'Color & Black' }]} />
            <Select label="Default Sides" value={prodForm.defaultSides} onChange={e => setProdForm(f => ({ ...f, defaultSides: e.target.value as PricingProduct['defaultSides'] }))}
              options={[{ value: 'Single', label: 'Single' }, { value: 'Double', label: 'Double' }]} />
            <Input label="Default Folding" value={prodForm.defaultFolding || ''} onChange={e => setProdForm(f => ({ ...f, defaultFolding: e.target.value }))} placeholder="e.g. Tri-Fold" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => setProdForm(f => ({ ...f, isTemplate: !f.isTemplate }))}
              className={`p-1 rounded transition-colors ${prodForm.isTemplate ? 'text-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}>
              <Star className={`w-5 h-5 ${prodForm.isTemplate ? 'fill-yellow-400' : ''}`} />
            </button>
            <span className="text-sm text-gray-600">{prodForm.isTemplate ? 'This product is a template' : 'Mark as template'}</span>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setProdModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveProduct}>{prodEditId ? 'Save Changes' : 'Add Product'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── PRODUCT DELETE CONFIRM ───────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!prodDeleteConfirm}
        onClose={() => setProdDeleteConfirm(null)}
        onConfirm={() => { if (prodDeleteConfirm) deleteProduct(prodDeleteConfirm); }}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />

      {/* ── TEMPLATE PREVIEW MODAL ──────────────────────────────────────── */}
      <Modal isOpen={templatePreviewOpen} onClose={() => setTemplatePreviewOpen(false)} title={templatePreviewTitle} size="2xl">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
          <iframe
            srcDoc={templatePreviewHtml}
            title="Template Preview"
            className="w-full border-0"
            style={{ height: '600px' }}
            sandbox="allow-same-origin"
          />
        </div>
      </Modal>
    </div>
  );
};
