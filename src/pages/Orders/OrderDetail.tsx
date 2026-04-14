import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, Receipt, KanbanSquare, Edit3, Trash2, CheckCircle, ChevronDown, ChevronUp, Copy, ArrowRight, ShoppingCart, Plus, Search } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Badge, Card, PageHeader, Select, Tabs, Modal, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { OrderStatus, OrderItem, OrderTrackingMode } from '../../types';

// ─── Inline editable field (same pattern as QuoteDetail) ─────────────────────
const OrderInlineField: React.FC<{
  label: string;
  value: string;
  onSave: (v: string) => void;
  type?: 'text' | 'date';
  searchable?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  onAddNew?: () => void;
}> = ({ label, value, onSave, type = 'text', searchable, options, placeholder, onAddNew }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => { setDraft(value); setSearch(value); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); };
  const commit = (val?: string) => { onSave(val ?? draft); setEditing(false); };

  const filteredOptions = useMemo(() => {
    if (!options) return [];
    if (!search.trim()) return options.slice(0, 8);
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q)).slice(0, 8);
  }, [options, search]);

  if (!editing) {
    return (
      <div className="group cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1.5 -mx-2 transition-colors" onClick={start}>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-sm font-medium text-gray-800">{value || <span className="text-gray-300 font-normal italic">Click to set</span>}</p>
          <Edit3 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  }

  if (searchable && options) {
    return (
      <div className="rounded-md px-2 py-1.5 -mx-2 bg-blue-50/40 border border-blue-100">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
            onBlur={() => setTimeout(() => setEditing(false), 200)}
            placeholder={placeholder || `Search ${label.toLowerCase()}...`}
            className="w-full pl-6 pr-2 py-1 text-sm bg-white border border-blue-200 rounded text-gray-800 focus:outline-none" autoFocus />
        </div>
        {filteredOptions.length > 0 && (
          <div className="mt-1 max-h-36 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
            {filteredOptions.map(o => (
              <button key={o.value} type="button" onMouseDown={() => commit(o.value)}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors">
                {o.label}
              </button>
            ))}
          </div>
        )}
        {onAddNew && (
          <button type="button" onMouseDown={onAddNew}
            className="mt-1 flex items-center gap-1 px-2 py-1 text-xs text-[var(--brand)] hover:bg-[var(--brand-light)] rounded w-full transition-colors">
            <Plus className="w-3 h-3" /> Add new {label.toLowerCase()}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md px-2 py-1.5 -mx-2 bg-blue-50/40 border border-blue-100">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <input ref={inputRef} type={type} value={draft} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        onBlur={() => commit()} placeholder={placeholder}
        className="w-full text-sm bg-white border border-blue-200 rounded px-2 py-1 text-gray-800 focus:outline-none" autoFocus />
    </div>
  );
};
import { nanoid } from '../../utils/nanoid';
import { buildWorkOrderTemplateHtml } from '../../utils/documentTemplates';
import {
  ProductEditModal,
  LineItemPricingState,
  DEFAULT_PRICING_STATE,
} from '../../components/pricing/ItemEditModal';
import { usePricingStore } from '../../store/pricingStore';

// ─── EMPTY LINE ITEM ────────────────────────────────────────────────────────

const EMPTY_LINE_ITEM = (): OrderItem => ({
  id: nanoid(), productFamily: 'digital_print', description: '', quantity: 1, unit: 'each',
  totalCost: 0, markup: 0, sellPrice: 0,
});

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, invoices, updateOrder, updateOrderTrackingMode, deleteOrder, addInvoice, nextInvoiceNumber, invoiceCount, workflows, users, equipment, purchaseOrders, vendors, customers, contacts, companySettings, documentTemplates } = useStore();
  const { templates: pricingTemplates } = usePricingStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDelete, setShowDelete] = useState(false);
  const [showCloneQuoteConfirm, setShowCloneQuoteConfirm] = useState(false);
  const [showCloneOrderConfirm, setShowCloneOrderConfirm] = useState(false);
  const [showInvoiceConfirm, setShowInvoiceConfirm] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const order = orders.find(o => o.id === id);

  // ── Item editing state — same auto-save pattern as QuoteDetail ──────────────
  const [editingItemModal, setEditingItemModal] = useState<string | null>(null);
  const [pricingStates, setPricingStates] = useState<Record<string, LineItemPricingState>>({});
  // Refs that always hold the latest values without closure staleness
  const pricingStatesRef = useRef<Record<string, LineItemPricingState>>({});
  const currentItemsRef = useRef<any[]>([]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (convertRef.current && !convertRef.current.contains(e.target as Node)) setConvertOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!order) return <div className="text-center py-16 text-gray-400">Order not found</div>;

  // Keep refs in sync on every render
  pricingStatesRef.current = pricingStates;
  currentItemsRef.current = (order.lineItems as any[]) || [];

  // ── Restore pricing state from pricingContext or top-level fields ─────────
  const getPricingState = (iid: string): LineItemPricingState => {
    if (pricingStates[iid]) return pricingStates[iid];
    const saved = currentItemsRef.current.find((i: any) => i.id === iid) as any;
    if (saved?.pricingContext) {
      return { ...DEFAULT_PRICING_STATE(), ...(saved.pricingContext as Partial<LineItemPricingState>) };
    }
    if (saved) {
      return {
        ...DEFAULT_PRICING_STATE(),
        productId: saved.productId || '',
        productName: saved.productName || saved.description || '',
        categoryName: saved.categoryName || '',
        quantity: saved.quantity || 1000,
        finalWidth: saved.width || 0,
        finalHeight: saved.height || 0,
        materialId: saved.materialId || '',
        equipmentId: saved.equipmentId || '',
        colorMode: saved.colorMode || 'Color',
        sides: saved.sides || 'Double',
        foldingType: saved.foldingType || '',
        drillingType: saved.drillingType || '',
        cuttingEnabled: saved.cuttingEnabled ?? true,
        sheetsPerStack: saved.sheetsPerStack || 500,
        serviceLines: saved.serviceLines || [],
        selectedLaborIds: saved.selectedLaborIds || [],
        selectedBrokeredIds: saved.selectedBrokeredIds || [],
      };
    }
    return DEFAULT_PRICING_STATE();
  };

  // ── Persist items directly to the store ──────────────────────────────────
  const persistOrderItems = (items: any[]) => {
    const subtotal = items.reduce((s: number, i: any) => s + (i.sellPrice || 0), 0);
    const taxAmount = subtotal * ((order.taxRate || 0) / 100);
    const titleUpdate = !order.title && items.find((i: any) => i.description)?.description
      ? { title: items.find((i: any) => i.description).description }
      : {};
    updateOrder(id!, { lineItems: items, subtotal, taxAmount, total: subtotal + taxAmount, ...titleUpdate });
  };

  // ── Pre-populate pricingStates before modal mounts (same fix as QuoteDetail) ──
  const openItemForEdit = (itemId: string) => {
    setPricingStates(prev => {
      if (prev[itemId]) return prev; // Already loaded
      const saved = currentItemsRef.current.find((i: any) => i.id === itemId) as any;
      let restored: LineItemPricingState = DEFAULT_PRICING_STATE();
      if (saved?.pricingContext) {
        restored = { ...DEFAULT_PRICING_STATE(), ...(saved.pricingContext as Partial<LineItemPricingState>) };
      } else if (saved) {
        restored = {
          ...DEFAULT_PRICING_STATE(),
          productId: saved.productId || '',
          productName: saved.productName || saved.description || '',
          categoryName: saved.categoryName || '',
          quantity: saved.quantity || 1000,
          finalWidth: saved.width || 0,
          finalHeight: saved.height || 0,
          materialId: saved.materialId || '',
          equipmentId: saved.equipmentId || '',
          colorMode: saved.colorMode || 'Color',
          sides: saved.sides || 'Double',
          foldingType: saved.foldingType || '',
          drillingType: saved.drillingType || '',
          cuttingEnabled: saved.cuttingEnabled ?? true,
          sheetsPerStack: saved.sheetsPerStack || 500,
          serviceLines: saved.serviceLines || [],
          selectedLaborIds: saved.selectedLaborIds || [],
          selectedBrokeredIds: saved.selectedBrokeredIds || [],
        };
      }
      return { ...prev, [itemId]: restored };
    });
    setEditingItemModal(itemId);
  };

  // ── Matching templates for the currently-editing item ────────────────────
  const matchingTemplatesForItem = useMemo(() => {
    if (!editingItemModal) return [];
    const ps = pricingStatesRef.current[editingItemModal];
    return pricingTemplates.filter(t => {
      if (ps?.productId && t.productId) return t.productId === ps.productId;
      if (ps?.productName && t.productName) return t.productName.toLowerCase() === ps.productName.toLowerCase();
      return false;
    });
  }, [editingItemModal, pricingTemplates, pricingStates]);

  const handleApplyTemplate = useCallback((tmplId: string) => {
    const tmpl = pricingTemplates.find(t => t.id === tmplId);
    if (!tmpl || !editingItemModal) return;
    setPricingStates(prev => ({
      ...prev,
      [editingItemModal]: {
        ...DEFAULT_PRICING_STATE(),
        productId: tmpl.productId || '',
        productName: tmpl.productName,
        categoryName: tmpl.categoryName,
        quantity: tmpl.quantity,
        finalWidth: tmpl.finalWidth,
        finalHeight: tmpl.finalHeight,
        materialId: tmpl.materialId || '',
        equipmentId: tmpl.equipmentId || '',
        colorMode: (tmpl.color === 'Black' ? 'Black' : 'Color') as 'Color' | 'Black',
        sides: tmpl.sides,
        foldingType: tmpl.folding || '',
        drillingType: '',
        cuttingEnabled: true,
        sheetsPerStack: 500,
        serviceLines: [],
        selectedLaborIds: [],
        selectedBrokeredIds: [],
      },
    }));
  }, [editingItemModal, pricingTemplates]);

  const workflow = workflows.find(w => w.id === order.workflowId) || workflows[0];
  const trackingMode = order.trackingMode || 'order';
  const currentStage = workflow?.stages.find(s => s.id === deriveOrderDisplayStage(order, workflow));
  const csr = users.find(u => u.id === order.csrId);
  const salesRep = users.find(u => u.id === order.salesId);
  const customer = customers.find(c => c.id === order.customerId) || null;
  const primaryContact = contacts.find(c => c.customerId === order.customerId && c.isPrimary)
    || contacts.find(c => c.customerId === order.customerId)
    || null;
  const linkedPurchaseOrders = purchaseOrders.filter((po) => po.orderId === order.id || (order.purchaseOrderIds || []).includes(po.id));
  const linkedInvoice = invoices.find((invoice) => invoice.orderIds.includes(order.id) || invoice.number === order.invoiceId);

  const trackerUrl = useMemo(
    () => `${window.location.origin}/OrderTracker/${order.number}`,
    [order.number],
  );

  const qrCodeApiUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=84x84&data=${encodeURIComponent(trackerUrl)}`,
    [trackerUrl],
  );

  const buildWorkOrderHtml = (qrCodeUrl: string, itemQrCodeUrls: Record<string, string> = {}) => buildWorkOrderTemplateHtml({
    template: documentTemplates.workOrder,
    company: companySettings,
    order,
    customer,
    contact: primaryContact,
    csr: csr || null,
    salesRep: salesRep || null,
    qrCodeUrl,
    itemQrCodeUrls,
  });

  const fetchQrCodeDataUrl = async (sourceUrl: string) => {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`QR fetch failed with status ${response.status}`);
    }
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('QR data URL conversion failed'));
      reader.readAsDataURL(blob);
    });
  };

  const openWorkOrderPrintWindow = async () => {
    let qrCodeSrc = qrCodeApiUrl;
    let itemQrCodeUrls: Record<string, string> = {};
    try {
      qrCodeSrc = await fetchQrCodeDataUrl(qrCodeApiUrl);

      if (trackingMode === 'item') {
        const itemQrEntries = await Promise.all(order.lineItems.map(async (lineItem) => {
          const itemTrackerUrl = `${window.location.origin}/OrderTracker/${order.number}?itemId=${encodeURIComponent(lineItem.id)}`;
          const itemQrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(itemTrackerUrl)}`;
          const dataUrl = await fetchQrCodeDataUrl(itemQrApiUrl);
          return [lineItem.id, dataUrl] as const;
        }));
        itemQrCodeUrls = Object.fromEntries(itemQrEntries);
      }
    } catch (error) {
      console.error('Unable to inline QR code for work order print', error);
    }

    const workOrderHtml = buildWorkOrderHtml(qrCodeSrc, itemQrCodeUrls);
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(workOrderHtml);
    printWindow.document.close();

    const waitForImages = async () => {
      const images = Array.from(printWindow.document.images);
      if (images.length === 0) return;

      await Promise.all(images.map((image) => (
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              const finish = () => resolve();
              image.addEventListener('load', finish, { once: true });
              image.addEventListener('error', finish, { once: true });
            })
      )));
    };

    await waitForImages();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 150);
  };

  const createInvoice = () => {
    const number = nextInvoiceNumber();
    addInvoice({
      id: nanoid(), number, status: 'draft',
      customerId: order.customerId || '', customerName: order.customerName || '',
      orderIds: [order.id],
      lineItems: order.lineItems.map(li => ({
        id: nanoid(), description: li.description, quantity: li.quantity,
        unit: li.unit, unitPrice: li.sellPrice / li.quantity, total: li.sellPrice, orderId: order.id,
      })),
      subtotal: order.subtotal, taxRate: order.taxRate, taxAmount: order.taxAmount, total: order.total,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    updateOrder(id!, { status: 'completed', invoiceId: number });
    navigate('/invoices');
  };


  // ── Line item editing helpers ─────────────────────────────────────────
  const addLineItem = () => {
    const item = EMPTY_LINE_ITEM();
    const newItems = [...currentItemsRef.current, item];
    persistOrderItems(newItems);
    setPricingStates(prev => ({ ...prev, [item.id]: DEFAULT_PRICING_STATE() }));
    openItemForEdit(item.id);
  };

  const removeLineItem = (itemId: string) => {
    const newItems = currentItemsRef.current.filter((i: any) => i.id !== itemId);
    persistOrderItems(newItems);
    setPricingStates(prev => { const n = { ...prev }; delete n[itemId]; return n; });
  };
  const stageSummary = useMemo(() => buildStageSummary(order, workflow), [order, workflow]);
  const progressStageId = stageSummary.currentStageId || order.currentStageId;

  const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    { value: 'in_progress', label: 'In Progress' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
  ];

  return (
    <div>
      <PageHeader
        title={order.title}
        subtitle={`${order.number} · ${order.customerName || 'No customer'}`}
        back={() => navigate('/orders')}
        actions={
          <div className="flex items-center gap-2">
            {/* Work Order print */}
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={openWorkOrderPrintWindow}>Work Order</Button>
            {/* Tracker */}
            <Button variant="secondary" size="sm" icon={<KanbanSquare className="w-4 h-4" />} onClick={() => navigate('/tracker')}>Tracker</Button>
            {/* Create PO */}
            <Button variant="secondary" size="sm" icon={<ShoppingCart className="w-4 h-4" />} onClick={() => navigate(`/purchase-orders/new?orderId=${order.id}`)}>Create PO</Button>

            {/* Status pill — inline dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Badge label={order.status} />
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </button>
              {statusOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  {ORDER_STATUS_OPTIONS.map(s => (
                    <button key={s.value}
                      onClick={() => { updateOrder(id!, { status: s.value }); setStatusOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${order.status === s.value ? 'font-semibold bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Convert dropdown */}
            <div className="relative" ref={convertRef}>
              <button
                onClick={() => setConvertOpen(!convertOpen)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Convert
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {convertOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => { setConvertOpen(false); setShowCloneQuoteConfirm(true); }}>
                    <Copy className="w-4 h-4 text-gray-400" /> Clone as New Quote
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                    onClick={() => { setConvertOpen(false); setShowCloneOrderConfirm(true); }}>
                    <Copy className="w-4 h-4 text-gray-400" /> Clone as New Order
                  </button>
                  {!order.invoiceId && (
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                      onClick={() => { setConvertOpen(false); setShowInvoiceConfirm(true); }}>
                      <Receipt className="w-4 h-4 text-gray-400" /> Create Invoice
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Delete */}
            <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDelete(true)}>Delete</Button>
          </div>
        }
      />

      {/* Prominent Order Number + Collapsible Header */}
      <Card className="mb-6">
        <div
          className="px-5 py-4 flex items-center justify-between cursor-pointer select-none"
          onClick={() => setHeaderCollapsed(!headerCollapsed)}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 obj-num">{order.number}</h1>
            <span className="text-sm text-gray-500">{order.customerName || 'No customer'}</span>
            <Badge label={order.status} />
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
            {headerCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
        {!headerCollapsed && (
          <div className="px-5 pb-4 pt-0 border-t border-gray-100">
            <div className="flex items-center justify-between mt-3 mb-3">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Click any field to edit · saves automatically</p>
              <button
                onClick={() => setShowAddressDialog(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Ship / Bill To
                {(order.billToAddress || order.shipToAddress) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3 items-start">
              <OrderInlineField label="Account"
                value={order.customerName || ''}
                searchable
                options={customers.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Search customers..."
                onSave={v => { const c = customers.find(x => x.id === v); updateOrder(id!, { customerId: v || undefined, customerName: c?.name, contactId: undefined, contactName: undefined }); }}
              />
              <OrderInlineField label="Contact"
                value={order.contactName || ''}
                searchable
                options={contacts.filter(c => c.customerId === order.customerId).map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))}
                placeholder="Search contacts..."
                onSave={v => { const c = contacts.find(x => x.id === v); updateOrder(id!, { contactId: v || undefined, contactName: c ? `${c.firstName} ${c.lastName}` : undefined }); }}
              />
              <OrderInlineField label="Due Date" type="date"
                value={order.dueDate || ''}
                onSave={v => updateOrder(id!, { dueDate: v || undefined })}
              />
              <OrderInlineField label="Title"
                value={order.title || ''}
                placeholder="Order title..."
                onSave={v => updateOrder(id!, { title: v })}
              />
              <OrderInlineField label="CSR"
                value={csr?.name || ''}
                searchable
                options={users.filter(u => u.active && ['csr','admin','manager'].includes(u.role)).map(u => ({ value: u.id, label: u.name }))}
                placeholder="Search CSR..."
                onSave={v => updateOrder(id!, { csrId: v || undefined })}
              />
              <OrderInlineField label="Sales Rep"
                value={salesRep?.name || ''}
                searchable
                options={users.filter(u => u.active && ['sales','admin','manager'].includes(u.role)).map(u => ({ value: u.id, label: u.name }))}
                placeholder="Search Sales Rep..."
                onSave={v => updateOrder(id!, { salesId: v || undefined })}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Progress bar */}
      {workflow && (
        <Card className="mb-4 p-4">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Production Progress</span>
              <div className="mt-2 flex items-center gap-2">
                <Badge label={trackingMode === 'order' ? 'Order tracking' : 'Item tracking'} />
                {currentStage && <Badge label={currentStage.name} />}
              </div>
            </div>
            <div className="text-right">
              <Badge label={order.status} />
              {trackingMode === 'item' && (
                <p className="mt-2 text-xs text-gray-500">
                  {stageSummary.completedItems}/{stageSummary.totalItems} items at final stage
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {workflow.stages.map((stage, i) => {
              const activeIndex = workflow.stages.findIndex(s => s.id === progressStageId);
              const isCurrent = stage.id === progressStageId;
              const isPast = activeIndex > i;
              return (
                <React.Fragment key={stage.id}>
                  <div
                    className={`flex flex-col items-center group ${trackingMode === 'order' ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={() => {
                      if (trackingMode !== 'order') return;
                      updateOrder(id!, {
                        currentStageId: stage.id,
                        lineItems: order.lineItems.map((item) => ({ ...item, workflowStageId: stage.id })),
                      });
                    }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isCurrent ? 'ring-2 ring-offset-2' : ''} ${isPast || isCurrent ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                      style={{ backgroundColor: isPast || isCurrent ? stage.color : undefined }}>
                      {isPast ? '✓' : i + 1}
                    </div>
                    <span className={`text-[9px] mt-1 font-medium text-center max-w-[60px] leading-tight ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>{stage.name}</span>
                  </div>
                  {i < workflow.stages.length - 1 && <div className={`flex-1 h-0.5 mb-4 ${isPast ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>
          {trackingMode === 'item' && stageSummary.countsByStage.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {stageSummary.countsByStage.map((entry) => (
                <span
                  key={entry.stageId}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ backgroundColor: `${entry.color}18`, color: entry.color }}
                >
                  {entry.label}: {entry.count}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      <Tabs
        tabs={[{ id: 'overview', label: 'Overview' }, { id: 'production', label: 'Production' }, { id: 'documents', label: 'Documents' }]}
        active={activeTab} onChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">

            {/* Line items — auto-saved directly to store on every change */}
            <Card>
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Line Items
                  
                </h2>
                <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addLineItem}>
                  Add Item
                </Button>
              </div>
              <div className="divide-y divide-gray-50 p-2 space-y-1">
                {currentItemsRef.current.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">
                    No line items yet. Click "Add Item" to get started.
                  </div>
                )}
                {currentItemsRef.current.map((item: any, idx: number) => {
                  const itemPs = getPricingState(item.id);
                  return (
                    <Card key={item.id} className="overflow-hidden hover:border-gray-200 transition-all">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span className="w-5 h-5 bg-gray-100 rounded text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openItemForEdit(item.id)}>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.description || <span className="text-gray-400 italic">New line item — click to configure</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {itemPs.categoryName && <Badge color="blue" className="text-[10px]">{itemPs.categoryName}</Badge>}
                            {itemPs.quantity > 0 && <span className="text-xs text-gray-600 font-medium">{itemPs.quantity.toLocaleString()} pcs</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(item.sellPrice || 0)}</p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openItemForEdit(item.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeLineItem(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>

            {(order.notes || order.internalNotes) && (
              <Card className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  {order.notes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p><p className="text-sm text-gray-700">{order.notes}</p></div>}
                  {order.internalNotes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Internal</p><p className="text-sm text-amber-700 bg-amber-50 p-2 rounded-lg italic">{order.internalNotes}</p></div>}
                </div>
              </Card>
            )}
          </div>
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.taxRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax ({order.taxRate}%)</span>
                    <span>{formatCurrency(order.taxAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-2">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Customer</dt><dd className="font-medium">{order.customerName || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Order Date</dt><dd>{formatDate(order.createdAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Due Date</dt><dd className={order.dueDate && new Date(order.dueDate) < new Date() && order.status === 'in_progress' ? 'text-red-500 font-medium' : ''}>{order.dueDate ? formatDate(order.dueDate) : '—'}</dd></div>
                {order.quoteNumber && <div className="flex justify-between"><dt className="text-gray-500">From Quote</dt><dd><button onClick={() => navigate(`/quotes/${order.quoteId}`)} className="text-blue-600 hover:underline">{order.quoteNumber}</button></dd></div>}
                {order.invoiceId && <div className="flex justify-between"><dt className="text-gray-500">Invoice</dt><dd>{linkedInvoice ? <button onClick={() => navigate(`/invoices/${linkedInvoice.id}`)} className="text-emerald-600 font-medium hover:underline">{order.invoiceId} ✓</button> : <span className="text-emerald-600 font-medium">{order.invoiceId} ✓</span>}</dd></div>}
                <div className="flex justify-between"><dt className="text-gray-500">Purchase Orders</dt><dd>{linkedPurchaseOrders.length || '—'}</dd></div>
              </dl>
            </Card>
            {linkedPurchaseOrders.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Linked Purchase Orders</h3>
                <div className="space-y-3">
                  {linkedPurchaseOrders.map((po) => {
                    const vendor = vendors.find((item) => item.id === po.vendorId);
                    return (
                      <button key={po.id} onClick={() => navigate(`/purchase-orders/${po.id}`)} className="w-full text-left border border-gray-100 rounded-lg p-3 hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">{po.number}</span>
                          <Badge label={po.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{vendor?.name || 'Unknown vendor'}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatCurrency(po.total)}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setShowDelete(true)} className="flex-1 justify-center">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <div className="space-y-4">
          {/* Compact order info header */}
          <Card className="p-4">
            <div className="flex flex-wrap items-start gap-6 text-sm">
              <div className="min-w-[110px]">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">Order</span>
                <span className="obj-num text-gray-900">{order.number}</span>
              </div>
              <div className="min-w-[180px]">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">Customer</span>
                <span className="font-medium text-gray-900">{order.customerName || '—'}</span>
              </div>
              {order.dueDate && (
                <div className="min-w-[120px]">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">Due Date</span>
                  <span className={`font-medium ${new Date(order.dueDate) < new Date() && order.status === 'in_progress' ? 'text-red-500' : 'text-gray-900'}`}>
                    {formatDate(order.dueDate)}
                  </span>
                </div>
              )}
              <div className="min-w-[420px]">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">Tracking Mode</span>
                <div className="mt-1 flex items-center gap-4">
                  <div className="min-w-[240px]">
                  <Select
                    value={trackingMode}
                    onChange={(event) => updateOrderTrackingMode(order.id, event.currentTarget.value as OrderTrackingMode)}
                    options={[
                      { value: 'order', label: 'Single order card' },
                      { value: 'item', label: 'Track items independently' },
                    ]}
                  />
                  </div>
                  <p className="max-w-[320px] text-xs leading-5 text-gray-500">
                    {trackingMode === 'order'
                      ? 'Best for straightforward jobs that move together through production.'
                      : 'Each line item gets its own card in the tracker while the order still shows an overall stage summary.'}
                  </p>
                </div>
              </div>
              <div className="ml-auto self-center">
                <Badge label={order.status} />
              </div>
            </div>
          </Card>

          {trackingMode === 'item' && (
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Order-Level Visibility</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    The board will show one card per item. This order summary stays in sync so the team can still tell where the full job stands.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Current overall stage</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{currentStage?.name || 'Not started'}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Per-item production cards */}
          {order.lineItems.map((item, idx) => (
            <Card key={item.id} className="overflow-hidden">
              {/* Item header */}
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.description || 'Untitled Item'}</p>
                    <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(item.sellPrice)}</span>
                  {(item.workflowStageId || progressStageId) && (
                    <Badge label={workflow?.stages.find(s => s.id === (item.workflowStageId || progressStageId))?.name || 'In Progress'} />
                  )}
                </div>
              </div>

              {/* Item specs */}
              {((item as any).width || (item as any).height || (item as any).materialName || (item as any).equipmentName) && (
                <div className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-gray-50 text-xs">
                  {(item as any).width && (item as any).height && (
                    <div>
                      <span className="text-gray-400 block">Size</span>
                      <span className="font-medium">{(item as any).width}" × {(item as any).height}"</span>
                    </div>
                  )}
                  {(item as any).materialName && (
                    <div>
                      <span className="text-gray-400 block">Material</span>
                      <span className="font-medium">{(item as any).materialName}</span>
                    </div>
                  )}
                  {(item as any).equipmentName && (
                    <div>
                      <span className="text-gray-400 block">Equipment</span>
                      <span className="font-medium">{(item as any).equipmentName}</span>
                    </div>
                  )}
                  {(item as any).colorMode && (
                    <div>
                      <span className="text-gray-400 block">Color</span>
                      <span className="font-medium">{(item as any).colorMode}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Production controls */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  {/* Stage assignment */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tracker Board Stage</label>
                    {trackingMode === 'order' ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        Follows the order card stage: <span className="font-medium text-gray-900">{currentStage?.name || 'Not assigned'}</span>
                      </div>
                    ) : (
                      <select
                        value={item.workflowStageId || ''}
                        onChange={e => {
                          const items = order.lineItems.map(li => li.id === item.id ? { ...li, workflowStageId: e.target.value } : li);
                          const nextStageId = deriveOrderDisplayStage({ ...order, lineItems: items }, workflow);
                          updateOrder(id!, { lineItems: items, currentStageId: nextStageId });
                        }}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Not assigned</option>
                        {workflows.map(wf => (
                          <optgroup key={wf.id} label={wf.name}>
                            {wf.stages.map(stage => (
                              <option key={stage.id} value={stage.id}>{stage.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Assigned To</label>
                    <select
                      value={item.assignedUserId || ''}
                      onChange={e => {
                        const items = order.lineItems.map(li => li.id === item.id ? { ...li, assignedUserId: e.target.value } : li);
                        updateOrder(id!, { lineItems: items });
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Production notes */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Production Notes</label>
                  <textarea
                    value={item.productionNotes || ''}
                    onChange={e => {
                      const items = order.lineItems.map(li => li.id === item.id ? { ...li, productionNotes: e.target.value } : li);
                      updateOrder(id!, { lineItems: items });
                    }}
                    rows={2}
                    placeholder="Notes for production team..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Track Order button */}
                {(item.workflowStageId || progressStageId) && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<KanbanSquare className="w-3.5 h-3.5" />}
                      onClick={() => navigate('/tracker')}
                    >
                      Track Order
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {order.lineItems.length === 0 && (
            <Card className="p-8 text-center text-gray-400 text-sm">
              No line items to track. Add items in the Overview tab.
            </Card>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: 'Customer Order Confirmation', desc: 'Customer-facing order summary with pricing', icon: '📄' },
            { title: 'Internal Work Order', desc: 'Production work order with specs and instructions', icon: '🔧' },
            { title: 'Quote PDF', desc: 'Original quote document', icon: '📋' },
          ].map(doc => (
            <Card key={doc.title} className="p-5">
              <div className="text-2xl mb-3">{doc.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
              <p className="text-xs text-gray-500 mb-4">{doc.desc}</p>
              <Button variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>Generate PDF</Button>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={showCloneQuoteConfirm}
        onClose={() => setShowCloneQuoteConfirm(false)}
        onConfirm={() => { navigate(`/quotes/new?cloneId=${order.id}&source=order`); setShowCloneQuoteConfirm(false); }}
        title="Clone as New Quote"
        message={`Create a new Quote based on Order ${order.number}${order.title ? ` — ${order.title}` : ''}?`}
        confirmLabel="Clone as Quote"
      />
      <ConfirmDialog
        isOpen={showCloneOrderConfirm}
        onClose={() => setShowCloneOrderConfirm(false)}
        onConfirm={() => { navigate(`/orders/new?cloneOrderId=${order.id}`); setShowCloneOrderConfirm(false); }}
        title="Clone as New Order"
        message={`Create a new duplicate Order from ${order.number}${order.title ? ` — ${order.title}` : ''}?`}
        confirmLabel="Clone as Order"
      />
      <ConfirmDialog
        isOpen={showInvoiceConfirm}
        onClose={() => setShowInvoiceConfirm(false)}
        onConfirm={() => { createInvoice(); setShowInvoiceConfirm(false); }}
        title="Create Invoice"
        message={`Generate an Invoice for Order ${order.number}${order.title ? ` — ${order.title}` : ''}? The order will be marked as Completed.`}
        confirmLabel="Create Invoice"
      />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={() => { deleteOrder(id!); navigate('/orders'); }}
        title="Delete Order" message={`Delete ${order.number}? This cannot be undone.`} />

      {/* ProductEditModal — same auto-save pattern as QuoteDetail */}
      {editingItemModal && (() => {
        const editingItem = currentItemsRef.current.find((i: any) => i.id === editingItemModal);
        const editingPs = getPricingState(editingItemModal);
        if (!editingItem) return null;
        return (
          <ProductEditModal
            item={editingItem as any}
            pricingState={editingPs}
            isNew={!editingItem.description}
            onUpdateItem={updates => {
              // Auto-save directly to the store — no local state buffer
              const newItems = currentItemsRef.current.map((i: any) =>
                i.id === editingItemModal ? { ...i, ...updates } : i
              );
              persistOrderItems(newItems);
            }}
            onUpdatePricing={updates => {
              // CRITICAL FIX: use pre-populated base state, never DEFAULT_PRICING_STATE
              setPricingStates(prev => {
                const existing = prev[editingItemModal];
                let base: LineItemPricingState;
                if (existing) {
                  base = existing;
                } else {
                  const saved = currentItemsRef.current.find((i: any) => i.id === editingItemModal) as any;
                  if (saved?.pricingContext) {
                    base = { ...DEFAULT_PRICING_STATE(), ...(saved.pricingContext as Partial<LineItemPricingState>) };
                  } else if (saved) {
                    base = {
                      ...DEFAULT_PRICING_STATE(),
                      productId: saved.productId || '', productName: saved.productName || saved.description || '',
                      categoryName: saved.categoryName || '', quantity: saved.quantity || 1000,
                      finalWidth: saved.width || 0, finalHeight: saved.height || 0,
                      materialId: saved.materialId || '', equipmentId: saved.equipmentId || '',
                      colorMode: saved.colorMode || 'Color', sides: saved.sides || 'Double',
                      foldingType: saved.foldingType || '', drillingType: saved.drillingType || '',
                      cuttingEnabled: saved.cuttingEnabled ?? true, sheetsPerStack: saved.sheetsPerStack || 500,
                      serviceLines: saved.serviceLines || [],
                      selectedLaborIds: saved.selectedLaborIds || [],
                      selectedBrokeredIds: saved.selectedBrokeredIds || [],
                    };
                  } else {
                    base = DEFAULT_PRICING_STATE();
                  }
                }
                return { ...prev, [editingItemModal]: { ...base, ...updates } };
              });
            }}
            onClose={() => {
              // Write final pricingContext to the item and persist to store.
              // Always derive totalCost/sellPrice from live service lines so the order
              // list shows the correct total even when the recompute effect never called onUpdateItem.
              const finalPs = pricingStatesRef.current[editingItemModal] || getPricingState(editingItemModal);
              const slTotalCost = finalPs.serviceLines?.reduce((s: number, l: any) => s + (l.totalCost || 0), 0) ?? 0;
              const slTotalSell = finalPs.serviceLines?.reduce((s: number, l: any) => s + (l.sellPrice || 0), 0) ?? 0;
              const slMarkup = slTotalCost > 0 ? Math.round(((slTotalSell - slTotalCost) / slTotalCost) * 100) : 0;
              const finalItems = currentItemsRef.current.map((i: any) => {
                if (i.id !== editingItemModal) return i;
                const base = { ...i, pricingContext: { ...finalPs } };
                if (slTotalSell > 0) {
                  return { ...base, totalCost: slTotalCost, sellPrice: slTotalSell, markup: slMarkup };
                }
                return base;
              });
              persistOrderItems(finalItems);
              setEditingItemModal(null);
            }}
            onRemove={() => { removeLineItem(editingItemModal); setEditingItemModal(null); }}
            matchingTemplates={matchingTemplatesForItem}
            onApplyTemplate={handleApplyTemplate}
          />
        );
      })()}
    </div>
  );
};

const buildStageSummary = (order: { lineItems: OrderItem[]; currentStageId?: string; trackingMode?: OrderTrackingMode }, workflow?: { stages: Array<{ id: string; name: string; color: string; order: number }> }) => {
  if (!workflow) {
    return { currentStageId: order.currentStageId, totalItems: order.lineItems.length, completedItems: 0, countsByStage: [] as Array<{ stageId: string; label: string; count: number; color: string }> };
  }

  const counts = new Map<string, number>();
  order.lineItems.forEach((item) => {
    const stageId = item.workflowStageId || order.currentStageId;
    if (!stageId) return;
    counts.set(stageId, (counts.get(stageId) || 0) + 1);
  });

  const rankedStages = workflow.stages.slice().sort((a, b) => a.order - b.order);
  const currentStageId = deriveOrderDisplayStage(order, workflow);
  const finalStageId = rankedStages[rankedStages.length - 1]?.id;

  return {
    currentStageId,
    totalItems: order.lineItems.length,
    completedItems: finalStageId ? order.lineItems.filter((item) => (item.workflowStageId || order.currentStageId) === finalStageId).length : 0,
    countsByStage: rankedStages
      .filter((stage) => counts.has(stage.id))
      .map((stage) => ({
        stageId: stage.id,
        label: stage.name,
        count: counts.get(stage.id) || 0,
        color: stage.color,
      })),
  };
};

const deriveOrderDisplayStage = (order: { lineItems: OrderItem[]; currentStageId?: string; trackingMode?: OrderTrackingMode }, workflow?: { stages: Array<{ id: string; order: number }> }) => {
  if (!workflow) {
    return order.currentStageId;
  }

  if ((order.trackingMode || 'order') === 'order') {
    return order.currentStageId;
  }

  const rankedIds = workflow.stages.slice().sort((a, b) => a.order - b.order).map((stage) => stage.id);
  const itemStages = order.lineItems.map((item) => item.workflowStageId).filter((stageId): stageId is string => Boolean(stageId));

  if (itemStages.length === 0) {
    return order.currentStageId;
  }

  return itemStages.reduce((selected, stageId) => {
    if (!selected) return stageId;
    return rankedIds.indexOf(stageId) < rankedIds.indexOf(selected) ? stageId : selected;
  }, order.currentStageId);
};
