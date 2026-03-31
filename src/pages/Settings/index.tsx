import React, { useEffect, useMemo, useState } from 'react';
import { Building, CreditCard, Globe, Bell, Palette, Plus, Pencil, Trash2, Package, Layers, FileText, RotateCcw, Eye, Ruler, Workflow as WorkflowIcon } from 'lucide-react';
import { Card, PageHeader, Button, Input, Textarea, Tabs, Select, Table, Modal, ConfirmDialog } from '../../components/ui';
import { DEFAULT_COMPANY_SETTINGS, DEFAULT_INVOICE_TEMPLATE, DEFAULT_ORDER_TEMPLATE, DEFAULT_PURCHASE_ORDER_TEMPLATE, DEFAULT_QUOTE_TEMPLATE } from '../../data/documentSettings';
import { useStore } from '../../store';
import { usePricingStore } from '../../store/pricingStore';
import { nanoid } from '../../utils/nanoid';
import type { CompanySettings, DocumentTemplates, Workflow, WorkflowStage, TrackingDevice } from '../../types';
import type { PricingCategory, PricingProduct } from '../../types/pricing';

const TABS = [
  { id: 'company', label: 'Company' }, { id: 'branding', label: 'Branding' },
  { id: 'documents', label: 'Documents' },
  { id: 'defaults', label: 'Quote Defaults' }, { id: 'catalog', label: 'Catalog' },
  { id: 'order-tracker', label: 'Order Tracker' },
  { id: 'notifications', label: 'Notifications' }, { id: 'billing', label: 'Billing' },
];

const CATALOG_SUBTABS = [
  { id: 'categories', label: 'Categories' },
  { id: 'products', label: 'Products' },
];

const ORDER_TRACKER_SUBTABS = [
  { id: 'boards', label: 'Boards' },
  { id: 'devices', label: 'Tracking Devices' },
];

// ─── BLANK FORMS ──────────────────────────────────────────────────────────────

const blankCategory = (): Omit<PricingCategory, 'id' | 'createdAt'> => ({
  name: '', description: '', sortOrder: 0,
});

const blankProduct = (): Omit<PricingProduct, 'id' | 'createdAt'> => ({
  categoryIds: [], name: '', aliases: [], defaultQuantity: 250,
  defaultFinalSize: '', defaultFinalWidth: 0, defaultFinalHeight: 0,
  defaultMaterialName: '', defaultEquipmentName: '',
  defaultColor: 'Color', defaultSides: 'Single', defaultFolding: '',
  isTemplate: false,
});

const STAGE_COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f97316', '#6b7280'];

const blankStage = (workflowId = ''): WorkflowStage => ({
  id: nanoid(),
  workflowId,
  name: '',
  order: 1,
  color: STAGE_COLORS[0],
  isComplete: false,
});

const blankWorkflowForm = (): Omit<Workflow, 'id' | 'createdAt'> => ({
  name: '',
  description: '',
  isActive: true,
  productFamilies: [],
  stages: [
    { ...blankStage(), name: 'Order Received', order: 1, color: '#6366f1' },
    { ...blankStage(), name: 'Completed', order: 2, color: '#10b981', isComplete: true },
  ],
  isDefault: false,
});

const blankTrackingDeviceForm = (): Omit<TrackingDevice, 'id' | 'createdAt'> => ({
  name: '',
  code: '',
  description: '',
  workflowId: '',
  stageId: '',
  isActive: true,
});

// ─── SETTINGS COMPONENT ───────────────────────────────────────────────────────

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');
  const {
    companySettings,
    documentTemplates,
    workflows,
    trackingDevices,
    orders,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    addTrackingDevice,
    updateTrackingDevice,
    deleteTrackingDevice,
    updateCompanySettings,
    updateDocumentTemplates,
  } = useStore();
  const [company, setCompany] = useState<CompanySettings>(companySettings || DEFAULT_COMPANY_SETTINGS);

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
  const [quoteTemplate, setQuoteTemplate] = useState(documentTemplates.quote || DEFAULT_QUOTE_TEMPLATE);
  const [orderTemplate, setOrderTemplate] = useState(documentTemplates.order || DEFAULT_ORDER_TEMPLATE);
  const [invoiceTemplate, setInvoiceTemplate] = useState(documentTemplates.invoice || DEFAULT_INVOICE_TEMPLATE);
  const [purchaseOrderTemplate, setPurchaseOrderTemplate] = useState(documentTemplates.purchaseOrder || DEFAULT_PURCHASE_ORDER_TEMPLATE);
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  const [templatePreviewHtml, setTemplatePreviewHtml] = useState('');
  const [templatePreviewTitle, setTemplatePreviewTitle] = useState('');

  useEffect(() => {
    setCompany(companySettings || DEFAULT_COMPANY_SETTINGS);
  }, [companySettings]);

  useEffect(() => {
    setQuoteTemplate(documentTemplates.quote || DEFAULT_QUOTE_TEMPLATE);
    setOrderTemplate(documentTemplates.order || DEFAULT_ORDER_TEMPLATE);
    setInvoiceTemplate(documentTemplates.invoice || DEFAULT_INVOICE_TEMPLATE);
    setPurchaseOrderTemplate(documentTemplates.purchaseOrder || DEFAULT_PURCHASE_ORDER_TEMPLATE);
  }, [documentTemplates]);

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
      '{{purchaseOrderNumber}}': 'PO000078',
      '{{customerName}}': 'Acme Corporation',
      '{{vendorName}}': 'Premium Paper Supply',
      '{{vendorAddress}}': '245 Vendor Way, Orlando, FL 32801',
      '{{vendorPhone}}': '555-222-4000',
      '{{vendorEmail}}': 'orders@premiumpaper.com',
      '{{quoteDate}}': 'Mar 30, 2026',
      '{{orderDate}}': 'Mar 30, 2026',
      '{{invoiceDate}}': 'Mar 30, 2026',
      '{{purchaseOrderDate}}': 'Mar 30, 2026',
      '{{validUntil}}': 'May 14, 2026',
      '{{dueDate}}': 'Apr 30, 2026',
      '{{expectedDate}}': 'Apr 4, 2026',
      '{{purchaseOrderStatus}}': 'Sent',
      '{{purchaseOrderNotes}}': 'Please confirm stock availability and expected delivery timing.',
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

  const saveCompanySettings = () => {
    updateCompanySettings(company);
  };

  const saveDocumentTemplates = () => {
    const nextTemplates: DocumentTemplates = {
      quote: quoteTemplate,
      order: orderTemplate,
      invoice: invoiceTemplate,
      purchaseOrder: purchaseOrderTemplate,
    };

    updateDocumentTemplates(nextTemplates);
  };

  // Catalog state
  const [catalogSubTab, setCatalogSubTab] = useState('categories');
  const [orderTrackerSubTab, setOrderTrackerSubTab] = useState('boards');

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

  // Order tracker board state
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowEditId, setWorkflowEditId] = useState<string | null>(null);
  const [workflowForm, setWorkflowForm] = useState<Omit<Workflow, 'id' | 'createdAt'>>(blankWorkflowForm());
  const [workflowDeleteConfirm, setWorkflowDeleteConfirm] = useState<string | null>(null);
  const [trackingDeviceModalOpen, setTrackingDeviceModalOpen] = useState(false);
  const [trackingDeviceEditId, setTrackingDeviceEditId] = useState<string | null>(null);
  const [trackingDeviceForm, setTrackingDeviceForm] = useState<Omit<TrackingDevice, 'id' | 'createdAt'>>(blankTrackingDeviceForm());
  const [trackingDeviceDeleteConfirm, setTrackingDeviceDeleteConfirm] = useState<string | null>(null);

  // Pricing store
  const {
    categories, products,
    addCategory, updateCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct,
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
    products.forEach(p => { p.categoryIds.forEach(cid => { map[cid] = (map[cid] || 0) + 1; }); });
    return map;
  }, [products]);

  // ─── Product helpers ─────────────────────────────────────────────────────

  const openAddProduct = () => {
    setProdEditId(null);
    const blank = blankProduct();
    if (categories.length > 0) blank.categoryIds = [categories[0].id];
    setProdForm(blank);
    setProdAliasesStr('');
    setProdModalOpen(true);
  };

  const openEditProduct = (prod: PricingProduct) => {
    setProdEditId(prod.id);
    setProdForm({
      categoryIds: prod.categoryIds, name: prod.name, aliases: prod.aliases,
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
    if (!prodForm.name.trim() || prodForm.categoryIds.length === 0) return;
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
    return products.filter(p => p.categoryIds.includes(prodCategoryFilter));
  }, [products, prodCategoryFilter]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  // ─── Workflow helpers ────────────────────────────────────────────────────

  const openAddWorkflow = () => {
    setWorkflowEditId(null);
    setWorkflowForm(blankWorkflowForm());
    setWorkflowModalOpen(true);
  };

  const openEditWorkflow = (workflow: Workflow) => {
    setWorkflowEditId(workflow.id);
    setWorkflowForm({
      name: workflow.name,
      description: workflow.description || '',
      isActive: workflow.isActive,
      productFamilies: workflow.productFamilies,
      stages: workflow.stages
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((stage) => ({ ...stage })),
      isDefault: workflow.isDefault,
    });
    setWorkflowModalOpen(true);
  };

  const updateWorkflowStage = (stageId: string, changes: Partial<WorkflowStage>) => {
    setWorkflowForm((current) => ({
      ...current,
      stages: current.stages.map((stage) => (stage.id === stageId ? { ...stage, ...changes } : stage)),
    }));
  };

  const addWorkflowStage = () => {
    setWorkflowForm((current) => ({
      ...current,
      stages: [
        ...current.stages,
        { ...blankStage(), order: current.stages.length + 1, color: STAGE_COLORS[current.stages.length % STAGE_COLORS.length] },
      ],
    }));
  };

  const removeWorkflowStage = (stageId: string) => {
    setWorkflowForm((current) => ({
      ...current,
      stages: current.stages
        .filter((stage) => stage.id !== stageId)
        .map((stage, index) => ({ ...stage, order: index + 1 })),
    }));
  };

  const moveWorkflowStage = (stageId: string, direction: 'up' | 'down') => {
    setWorkflowForm((current) => {
      const index = current.stages.findIndex((stage) => stage.id === stageId);
      if (index < 0) return current;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.stages.length) return current;
      const nextStages = current.stages.slice();
      [nextStages[index], nextStages[targetIndex]] = [nextStages[targetIndex], nextStages[index]];
      return {
        ...current,
        stages: nextStages.map((stage, order) => ({ ...stage, order: order + 1 })),
      };
    });
  };

  const saveWorkflow = () => {
    const cleanedName = workflowForm.name.trim();
    const cleanedStages = workflowForm.stages
      .map((stage, index) => ({
        ...stage,
        name: stage.name.trim(),
        workflowId: workflowEditId || stage.workflowId,
        order: index + 1,
      }))
      .filter((stage) => stage.name);

    if (!cleanedName || cleanedStages.length === 0) return;

    if (workflowEditId) {
      updateWorkflow(workflowEditId, {
        ...workflowForm,
        name: cleanedName,
        description: workflowForm.description?.trim() || '',
        stages: cleanedStages.map((stage) => ({ ...stage, workflowId: workflowEditId! })),
      });
    } else {
      const workflowId = nanoid();
      addWorkflow({
        id: workflowId,
        name: cleanedName,
        description: workflowForm.description?.trim() || '',
        isActive: workflowForm.isActive,
        productFamilies: workflowForm.productFamilies,
        stages: cleanedStages.map((stage) => ({ ...stage, workflowId })),
        isDefault: workflows.length === 0,
        createdAt: new Date().toISOString(),
      });
    }

    setWorkflowModalOpen(false);
  };

  const workflowUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((order) => {
      if (!order.workflowId) return;
      counts[order.workflowId] = (counts[order.workflowId] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const openAddTrackingDevice = () => {
    const firstWorkflow = workflows.find((workflow) => workflow.isActive) || workflows[0];
    const firstStage = firstWorkflow?.stages.slice().sort((a, b) => a.order - b.order)[0];
    setTrackingDeviceEditId(null);
    setTrackingDeviceForm({
      ...blankTrackingDeviceForm(),
      workflowId: firstWorkflow?.id || '',
      stageId: firstStage?.id || '',
    });
    setTrackingDeviceModalOpen(true);
  };

  const openEditTrackingDevice = (device: TrackingDevice) => {
    setTrackingDeviceEditId(device.id);
    setTrackingDeviceForm({
      name: device.name,
      code: device.code,
      description: device.description || '',
      workflowId: device.workflowId,
      stageId: device.stageId,
      isActive: device.isActive,
    });
    setTrackingDeviceModalOpen(true);
  };

  const selectedTrackingWorkflow = workflows.find((workflow) => workflow.id === trackingDeviceForm.workflowId);
  const selectedTrackingStages = selectedTrackingWorkflow?.stages.slice().sort((a, b) => a.order - b.order) || [];

  const saveTrackingDevice = () => {
    const name = trackingDeviceForm.name.trim();
    const code = trackingDeviceForm.code.trim().toUpperCase();
    if (!name || !code || !trackingDeviceForm.workflowId || !trackingDeviceForm.stageId) return;

    const payload = {
      ...trackingDeviceForm,
      name,
      code,
      description: trackingDeviceForm.description?.trim() || '',
    };

    if (trackingDeviceEditId) {
      updateTrackingDevice(trackingDeviceEditId, payload);
    } else {
      addTrackingDevice({
        id: nanoid(),
        ...payload,
        createdAt: new Date().toISOString(),
      });
    }

    setTrackingDeviceModalOpen(false);
  };

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
              <Button variant="primary" onClick={saveCompanySettings}>Save Changes</Button>
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

          <div className="flex gap-3"><Button variant="primary" onClick={saveCompanySettings}>Save Defaults</Button></div>
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
              <Table headers={['Name', 'Categories', 'Aliases', 'Size', 'Paper', 'Equipment', 'Color', 'Sides', 'Actions']}>
                {filteredProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{prod.name}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.categoryIds.map(id => getCategoryName(id)).join(', ')}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs max-w-[160px] truncate">{prod.aliases.length > 0 ? prod.aliases.join(', ') : '--'}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultFinalSize || '--'}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultMaterialName || '--'}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultEquipmentName || '--'}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultColor}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{prod.defaultSides}</td>
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
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-400">No products found. Add one to get started.</td></tr>
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

          {/* Purchase Order Template */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" /> Purchase Order Template HTML
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => openTemplatePreview('Purchase Order Template Preview', purchaseOrderTemplate)}>
                  Preview
                </Button>
                <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setPurchaseOrderTemplate(DEFAULT_PURCHASE_ORDER_TEMPLATE)}>
                  Reset to Default
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Available placeholders: <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{purchaseOrderNumber}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{vendorName}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{lineItems}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{subtotal}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{tax}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{total}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{expectedDate}}'}</code>{' '}
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">{'{{purchaseOrderNotes}}'}</code>
            </p>
            <textarea
              value={purchaseOrderTemplate}
              onChange={e => setPurchaseOrderTemplate(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 text-sm bg-gray-900 text-green-400 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace", fontSize: '12px', lineHeight: '1.6', tabSize: 2 }}
              spellCheck={false}
            />
          </Card>

          <div className="flex gap-3">
            <Button variant="primary" onClick={saveDocumentTemplates}>Save Templates</Button>
          </div>
        </div>
      )}

      {/* ── ORDER TRACKER TAB ──────────────────────────────────────────── */}
      {activeTab === 'order-tracker' && (
        <div className="space-y-6">
          <div className="flex gap-1">
            {ORDER_TRACKER_SUBTABS.map(st => (
              <button
                key={st.id}
                onClick={() => setOrderTrackerSubTab(st.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${orderTrackerSubTab === st.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {orderTrackerSubTab === 'boards' && (
            <>
              <Card className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <WorkflowIcon className="w-4 h-4 text-blue-500" /> Order Tracker Boards
                    </h2>
                    <p className="text-sm text-gray-500 max-w-3xl">
                      Define the boards and stages used by the Order Tracker page. Active boards are available to production for routing and status tracking.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddWorkflow}>
                    Add Board
                  </Button>
                </div>
              </Card>

              <Card className="p-0">
                <Table headers={['Board', 'Description', 'Stages', 'Orders', 'Status', 'Actions']}>
                  {workflows.map((workflow) => (
                    <tr key={workflow.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{workflow.name}</span>
                          {workflow.isDefault && <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Default</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 max-w-sm">{workflow.description || '--'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {workflow.stages.slice().sort((a, b) => a.order - b.order).map((stage) => (
                            <span key={stage.id} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-600">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                              {stage.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{workflowUsage[workflow.id] || 0}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${workflow.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditWorkflow(workflow)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setWorkflowDeleteConfirm(workflow.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {workflows.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No boards configured yet. Add one to start building your production workflow.</td></tr>
                  )}
                </Table>
              </Card>
            </>
          )}

          {orderTrackerSubTab === 'devices' && (
            <>
              <Card className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <WorkflowIcon className="w-4 h-4 text-blue-500" /> Tracking Devices
                    </h2>
                    <p className="text-sm text-gray-500 max-w-3xl">
                      Define the scanners or machine devices used on the floor. Each device maps a scanned order item to a specific board and stage.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddTrackingDevice}>
                    Add Device
                  </Button>
                </div>
              </Card>

              <Card className="p-0">
                <Table headers={['Device', 'Device Code', 'Board', 'Stage', 'Status', 'Actions']}>
                  {trackingDevices.map((device) => {
                    const workflow = workflows.find((item) => item.id === device.workflowId);
                    const stage = workflow?.stages.find((item) => item.id === device.stageId);
                    return (
                      <tr key={device.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{device.name}</div>
                            <div className="text-xs text-gray-500">{device.description || '--'}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4"><span className="font-mono text-xs text-gray-700">{device.code}</span></td>
                        <td className="py-3 px-4 text-gray-600">{workflow?.name || '--'}</td>
                        <td className="py-3 px-4 text-gray-600">{stage?.name || '--'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${device.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                            {device.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditTrackingDevice(device)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setTrackingDeviceDeleteConfirm(device.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {trackingDevices.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No tracking devices configured yet. Add a device to map scans to a board and stage.</td></tr>
                  )}
                </Table>
              </Card>
            </>
          )}
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
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categories</label>
              <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-md min-h-[38px]">
                {categories.map(c => (
                  <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                    <input type="checkbox" checked={prodForm.categoryIds.includes(c.id)}
                      onChange={() => setProdForm(f => ({ ...f, categoryIds: f.categoryIds.includes(c.id) ? f.categoryIds.filter(id => id !== c.id) : [...f.categoryIds, c.id] }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className={prodForm.categoryIds.includes(c.id) ? 'text-blue-700 font-medium' : 'text-gray-600'}>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
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

      {/* ── WORKFLOW MODAL ──────────────────────────────────────────────── */}
      <Modal isOpen={workflowModalOpen} onClose={() => setWorkflowModalOpen(false)} title={workflowEditId ? 'Edit Order Tracker Board' : 'Add Order Tracker Board'} size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Board Name"
              value={workflowForm.name}
              onChange={e => setWorkflowForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="e.g. Standard Print Workflow"
            />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Board Status</label>
              <div className="flex gap-2">
                <Button variant={workflowForm.isActive ? 'success' : 'secondary'} type="button" onClick={() => setWorkflowForm((current) => ({ ...current, isActive: true }))}>
                  Active
                </Button>
                <Button variant={!workflowForm.isActive ? 'secondary' : 'ghost'} type="button" onClick={() => setWorkflowForm((current) => ({ ...current, isActive: false }))}>
                  Inactive
                </Button>
              </div>
            </div>
          </div>

          <Textarea
            label="Description"
            rows={3}
            value={workflowForm.description || ''}
            onChange={e => setWorkflowForm((current) => ({ ...current, description: e.target.value }))}
            placeholder="Describe when this board should be used and what the workflow covers."
          />

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Stages</h3>
                <p className="text-xs text-gray-500">These stages will appear as columns on the Order Tracker board.</p>
              </div>
              <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} type="button" onClick={addWorkflowStage}>
                Add Stage
              </Button>
            </div>

            <div className="p-4 space-y-3">
              {workflowForm.stages.map((stage, index) => (
                <div key={stage.id} className="rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="grid grid-cols-[minmax(0,1fr)_160px_120px_auto] gap-3 items-end">
                    <Input
                      label={`Stage ${index + 1}`}
                      value={stage.name}
                      onChange={e => updateWorkflowStage(stage.id, { name: e.target.value })}
                      placeholder="e.g. Prepress"
                    />
                    <Select
                      label="Color"
                      value={stage.color}
                      onChange={e => updateWorkflowStage(stage.id, { color: e.target.value })}
                      options={STAGE_COLORS.map((color, colorIndex) => ({ value: color, label: `Color ${colorIndex + 1}` }))}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Stage Type</label>
                      <button
                        type="button"
                        onClick={() => updateWorkflowStage(stage.id, { isComplete: !stage.isComplete })}
                        className={`w-full rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${stage.isComplete ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        {stage.isComplete ? 'Completion' : 'In Progress'}
                      </button>
                    </div>
                    <div className="flex items-center gap-1 pb-0.5">
                      <Button variant="ghost" size="sm" type="button" disabled={index === 0} onClick={() => moveWorkflowStage(stage.id, 'up')}>Up</Button>
                      <Button variant="ghost" size="sm" type="button" disabled={index === workflowForm.stages.length - 1} onClick={() => moveWorkflowStage(stage.id, 'down')}>Down</Button>
                      <Button variant="ghost" size="sm" type="button" disabled={workflowForm.stages.length <= 1} onClick={() => removeWorkflowStage(stage.id)}>Remove</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setWorkflowModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveWorkflow}>{workflowEditId ? 'Save Board' : 'Create Board'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── WORKFLOW DELETE CONFIRM ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!workflowDeleteConfirm}
        onClose={() => setWorkflowDeleteConfirm(null)}
        onConfirm={() => { if (workflowDeleteConfirm) deleteWorkflow(workflowDeleteConfirm); }}
        title="Delete Order Tracker Board"
        message="Are you sure you want to delete this board? Orders assigned to it will be unassigned from the tracker stages."
      />

      {/* ── TRACKING DEVICE MODAL ──────────────────────────────────────── */}
      <Modal isOpen={trackingDeviceModalOpen} onClose={() => setTrackingDeviceModalOpen(false)} title={trackingDeviceEditId ? 'Edit Tracking Device' : 'Add Tracking Device'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Device Name"
              value={trackingDeviceForm.name}
              onChange={e => setTrackingDeviceForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="e.g. Indigo 7K Scanner"
            />
            <Input
              label="Device Code"
              value={trackingDeviceForm.code}
              onChange={e => setTrackingDeviceForm((current) => ({ ...current, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. INDIGO-01"
            />
          </div>

          <Textarea
            label="Description"
            rows={2}
            value={trackingDeviceForm.description || ''}
            onChange={e => setTrackingDeviceForm((current) => ({ ...current, description: e.target.value }))}
            placeholder="Optional notes about the machine or scanner location."
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Destination Board"
              value={trackingDeviceForm.workflowId}
              onChange={e => {
                const workflowId = e.target.value;
                const workflow = workflows.find((item) => item.id === workflowId);
                const firstStage = workflow?.stages.slice().sort((a, b) => a.order - b.order)[0];
                setTrackingDeviceForm((current) => ({ ...current, workflowId, stageId: firstStage?.id || '' }));
              }}
              options={workflows.map((workflow) => ({ value: workflow.id, label: workflow.name }))}
            />
            <Select
              label="Destination Stage"
              value={trackingDeviceForm.stageId}
              onChange={e => setTrackingDeviceForm((current) => ({ ...current, stageId: e.target.value }))}
              options={selectedTrackingStages.map((stage) => ({ value: stage.id, label: stage.name }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Device Status</label>
            <div className="flex gap-2">
              <Button variant={trackingDeviceForm.isActive ? 'success' : 'secondary'} type="button" onClick={() => setTrackingDeviceForm((current) => ({ ...current, isActive: true }))}>
                Active
              </Button>
              <Button variant={!trackingDeviceForm.isActive ? 'secondary' : 'ghost'} type="button" onClick={() => setTrackingDeviceForm((current) => ({ ...current, isActive: false }))}>
                Inactive
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
            A scan from this device should include an order item code. The configured device mapping determines which board and stage that item is moved into.
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setTrackingDeviceModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveTrackingDevice}>{trackingDeviceEditId ? 'Save Device' : 'Create Device'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── TRACKING DEVICE DELETE CONFIRM ─────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!trackingDeviceDeleteConfirm}
        onClose={() => setTrackingDeviceDeleteConfirm(null)}
        onConfirm={() => { if (trackingDeviceDeleteConfirm) deleteTrackingDevice(trackingDeviceDeleteConfirm); }}
        title="Delete Tracking Device"
        message="Are you sure you want to delete this tracking device? Scans from this device will no longer route order items."
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
