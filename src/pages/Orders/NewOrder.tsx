import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Calculator, Copy,
  ArrowRight, Search, X, Scissors, FoldVertical, CircleDot, Printer,
  Package, DollarSign, Grid3X3, Edit3, Check, Star, Settings2,
  FileText, Calendar,
} from 'lucide-react';
import { useStore } from '../../store';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Input, Textarea, Card, Badge, Modal } from '../../components/ui';
import type { QuoteLineItem, Order, OrderItem } from '../../types';
import type { PricingProduct, PricingServiceLine } from '../../types/pricing';
import { formatCurrency } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = (n: number) => formatCurrency(n);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const slId = () => `sl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── PER-LINE-ITEM PRICING STATE ────────────────────────────────────────────

interface LineItemPricingState {
  productId: string;
  productName: string;
  categoryName: string;
  quantity: number;
  finalWidth: number;
  finalHeight: number;
  materialId: string;
  equipmentId: string;
  colorMode: 'Color' | 'Black';
  sides: 'Single' | 'Double';
  foldingType: string;
  drillingType: string;
  cuttingEnabled: boolean;
  sheetsPerStack: number;
  serviceLines: PricingServiceLine[];
}

const DEFAULT_PRICING_STATE = (): LineItemPricingState => ({
  productId: '', productName: '', categoryName: '',
  quantity: 1000, finalWidth: 0, finalHeight: 0,
  materialId: '', equipmentId: '',
  colorMode: 'Color', sides: 'Double',
  foldingType: '', drillingType: '',
  cuttingEnabled: true, sheetsPerStack: 500,
  serviceLines: [],
});

// ─── EMPTY LINE ITEM ────────────────────────────────────────────────────────

const EMPTY_LINE_ITEM = (): OrderItem => ({
  id: nanoid(), productFamily: 'digital_print', description: '', quantity: 1, unit: 'each',
  totalCost: 0, markup: 0, sellPrice: 0,
});

// ═════════════════════════════════════════════════════════════════════════════
// ORDER BUILDER (mirrors QuoteBuilder but creates Orders)
// ═════════════════════════════════════════════════════════════════════════════

export const NewOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    customers, contacts, quotes, addOrder, nextOrderNumber, addInvoice, nextInvoiceNumber,
    currentUser, users, workflows, addCustomer, addContact,
  } = useStore();
  const pricing = usePricingStore();

  // ── Pre-fill from quote if quoteId param ─────────────────────────────
  const quoteId = searchParams.get('quoteId');
  const sourceQuote = quotes.find(q => q.id === quoteId);

  // ── Generate order number immediately on mount ──────────────────────
  const [orderNumber] = useState(() => nextOrderNumber());

  // ── Order-level state ────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: sourceQuote?.title || '',
    customerId: sourceQuote?.customerId || '',
    contactId: sourceQuote?.contactId || '',
    status: 'in_progress' as Order['status'],
    taxRate: sourceQuote?.taxRate ?? 7,
    dueDate: '',
    workflowId: workflows[0]?.id || '',
    poNumber: '',
    csrId: sourceQuote?.csrId || currentUser.id,
    salesId: sourceQuote?.salesId || '',
    notes: sourceQuote?.notes || '',
    internalNotes: sourceQuote?.internalNotes || '',
    shipToAddress: '',
  });

  // Build initial line items: either from source quote or one empty item
  const buildInitialLineItems = (): OrderItem[] => {
    if (sourceQuote && sourceQuote.lineItems.length > 0) {
      return sourceQuote.lineItems.map(li => ({ ...li, id: nanoid() }));
    }
    return [EMPTY_LINE_ITEM()];
  };

  const [lineItems, setLineItems] = useState<OrderItem[]>(buildInitialLineItems);
  const [pricingStates, setPricingStates] = useState<Record<string, LineItemPricingState>>(() => {
    const states: Record<string, LineItemPricingState> = {};
    if (sourceQuote && sourceQuote.lineItems.length > 0) {
      // For quote-sourced items, create pricing states seeded with known data
      const items = buildInitialLineItems();
      items.forEach((item) => {
        states[item.id] = {
          ...DEFAULT_PRICING_STATE(),
          productName: item.description || '',
          quantity: item.quantity || 1000,
          finalWidth: item.width || 0,
          finalHeight: item.height || 0,
          materialId: item.materialId || '',
          equipmentId: item.equipmentId || '',
        };
      });
    } else {
      const first = EMPTY_LINE_ITEM();
      states[first.id] = DEFAULT_PRICING_STATE();
    }
    return states;
  });

  const [expandedItem, setExpandedItem] = useState<string | null>(lineItems[0]?.id || null);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!sourceQuote);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showShipToModal, setShowShipToModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [newContactForm, setNewContactForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  // ── Customer search state ────────────────────────────────────────────
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const customerContacts = contacts.filter(c => c.customerId === form.customerId);

  const filteredCustomers = useMemo(() => {
    if (!customerQuery.trim()) return customers.slice(0, 20);
    const q = customerQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [customers, customerQuery]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Mark dirty on any change
  useEffect(() => { setIsDirty(true); }, [form, lineItems]);

  const subtotal = lineItems.reduce((s, i) => s + (i.sellPrice || 0), 0);
  const taxAmount = subtotal * (form.taxRate / 100);
  const total = subtotal + taxAmount;
  const totalCostAll = lineItems.reduce((s, i) => s + (i.totalCost || 0), 0);

  // ── Pricing state helpers ─────────────────────────────────────────────
  const getPricingState = (id: string) => pricingStates[id] || DEFAULT_PRICING_STATE();
  const updatePricingState = useCallback((id: string, updates: Partial<LineItemPricingState>) => {
    setPricingStates(prev => ({ ...prev, [id]: { ...(prev[id] || DEFAULT_PRICING_STATE()), ...updates } }));
  }, []);

  // ── Add / remove line items ───────────────────────────────────────────
  const addLineItem = () => {
    const item = EMPTY_LINE_ITEM();
    setLineItems(prev => [...prev, item]);
    setPricingStates(prev => ({ ...prev, [item.id]: DEFAULT_PRICING_STATE() }));
    setExpandedItem(item.id);
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
    setPricingStates(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  const duplicateLineItem = (item: OrderItem) => {
    const newId = nanoid();
    const newItem = { ...item, id: newId };
    setLineItems(prev => [...prev, newItem]);
    setPricingStates(prev => ({ ...prev, [newId]: { ...(prev[item.id] || DEFAULT_PRICING_STATE()) } }));
    setExpandedItem(newId);
  };

  // ── Load from pricing template ────────────────────────────────────────
  const addFromTemplate = (tmplId: string) => {
    const tmpl = pricing.templates.find(t => t.id === tmplId);
    if (!tmpl) return;
    pricing.incrementTemplateUsage(tmplId);

    const item = EMPTY_LINE_ITEM();
    item.description = tmpl.productName;
    item.quantity = tmpl.quantity;
    item.unit = 'each';
    if (tmpl.finalWidth) item.width = tmpl.finalWidth;
    if (tmpl.finalHeight) item.height = tmpl.finalHeight;

    const mat = tmpl.materialId
      ? pricing.materials.find(m => m.id === tmpl.materialId)
      : tmpl.materialName
        ? pricing.materials.find(m => m.name === tmpl.materialName)
        : undefined;

    setLineItems(prev => [...prev.filter(i => i.description !== ''), item]);
    setPricingStates(prev => ({
      ...prev,
      [item.id]: {
        ...DEFAULT_PRICING_STATE(),
        productId: tmpl.productId || '',
        productName: tmpl.productName,
        categoryName: tmpl.categoryName,
        quantity: tmpl.quantity,
        finalWidth: tmpl.finalWidth,
        finalHeight: tmpl.finalHeight,
        materialId: mat?.id || '',
        equipmentId: tmpl.equipmentId || '',
        colorMode: (tmpl.color === 'Black' ? 'Black' : 'Color') as 'Color' | 'Black',
        sides: tmpl.sides,
        foldingType: tmpl.folding || '',
        cuttingEnabled: true,
        sheetsPerStack: 500,
      },
    }));
    setExpandedItem(item.id);
    setShowTemplates(false);
  };

  // ── Cancel with confirmation ──────────────────────────────────────────
  const handleCancel = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate('/orders');
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async (andCreateInvoice = false) => {
    setSaving(true);
    const number = orderNumber;
    const selectedWorkflow = workflows.find(w => w.id === form.workflowId);

    const order: Order = {
      id: nanoid(),
      number,
      status: form.status,
      quoteId: sourceQuote?.id,
      quoteNumber: sourceQuote?.number,
      customerId: form.customerId || undefined,
      customerName: selectedCustomer?.name,
      contactId: form.contactId || undefined,
      title: form.title || `Order ${number}`,
      lineItems,
      subtotal,
      taxRate: form.taxRate,
      taxAmount,
      total,
      dueDate: form.dueDate || undefined,
      workflowId: form.workflowId || undefined,
      currentStageId: selectedWorkflow?.stages[0]?.id,
      csrId: form.csrId || undefined,
      salesId: form.salesId || undefined,
      notes: form.notes || undefined,
      internalNotes: form.internalNotes || undefined,
      poNumber: form.poNumber || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addOrder(order);

    // If converting to invoice as well
    if (andCreateInvoice && form.customerId) {
      const invNumber = nextInvoiceNumber();
      addInvoice({
        id: nanoid(),
        number: invNumber,
        status: 'draft',
        customerId: form.customerId,
        customerName: selectedCustomer?.name || '',
        orderIds: [order.id],
        lineItems: lineItems.filter(li => li.description).map(li => ({
          id: nanoid(),
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
          unitPrice: li.sellPrice / (li.quantity || 1),
          total: li.sellPrice,
          orderItemId: li.id,
          orderId: order.id,
        })),
        subtotal,
        taxRate: form.taxRate,
        taxAmount,
        total,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
    navigate(`/orders/${order.id}`);
  };

  // ── Filtered templates for sidebar ────────────────────────────────────
  const sortedTemplates = useMemo(() =>
    [...pricing.templates].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || b.usageCount - a.usageCount),
    [pricing.templates]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div>
      {/* ─── Top Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <button onClick={handleCancel} className="hover:text-blue-600">Orders</button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{orderNumber}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Build Order
            {sourceQuote && (
              <span className="text-blue-600 text-base font-normal ml-2">from {sourceQuote.number}</span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          <Button variant="success" onClick={() => handleSave(false)} loading={saving}>Save Order</Button>
          <Button variant="primary" onClick={() => handleSave(true)} loading={saving} icon={<FileText className="w-4 h-4" />}>
            Save & Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ─── Main form ─────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">
          {/* Order info (collapsible) */}
          <Card className="overflow-hidden">
            <button
              onClick={() => setHeaderCollapsed(!headerCollapsed)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <h2 className="font-semibold text-gray-900">Order Details</h2>
              <div className="flex items-center gap-2">
                {headerCollapsed && selectedCustomer && (
                  <span className="text-sm text-gray-500">{selectedCustomer.name}</span>
                )}
                {headerCollapsed && form.dueDate && (
                  <Badge color="blue">{form.dueDate}</Badge>
                )}
                {headerCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
            {!headerCollapsed && (
              <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-2.5">
                {/* Line 1: Order Title */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Order Title</label>
                  <input
                    type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., Spring Marketing Package for Acme Corp"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>

                {/* Line 2: Customer + Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div ref={customerRef}>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Customer
                      {selectedCustomer && (
                        <button
                          onClick={() => window.open(`/customers/${selectedCustomer.id}`, '_blank')}
                          className="ml-2 text-[10px] text-blue-600 hover:text-blue-800 font-medium normal-case"
                        >
                          {selectedCustomer.name} &#8599;
                        </button>
                      )}
                      <button onClick={() => setShowNewCustomerModal(true)} className="ml-2 text-[10px] text-emerald-600 hover:text-emerald-800 font-medium normal-case">+ New</button>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={form.customerId ? (selectedCustomer?.name || '') : customerQuery}
                        onChange={e => {
                          setCustomerQuery(e.target.value);
                          setShowCustomerDropdown(true);
                          if (form.customerId) setForm(f => ({ ...f, customerId: '', contactId: '' }));
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="Search customers..."
                        className="w-full pl-8 pr-7 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                      {form.customerId && (
                        <button onClick={() => { setForm(f => ({ ...f, customerId: '', contactId: '' })); setCustomerQuery(''); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full">
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                      {showCustomerDropdown && !form.customerId && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {filteredCustomers.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400">No customers found</div>
                          ) : filteredCustomers.map(c => (
                            <button key={c.id}
                              onClick={() => { setForm(f => ({ ...f, customerId: c.id, contactId: '' })); setCustomerQuery(''); setShowCustomerDropdown(false); }}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors text-sm border-b border-gray-50 last:border-0">
                              <span className="font-medium text-gray-900">{c.name}</span>
                              {c.email && <span className="text-xs text-gray-400 ml-2">{c.email}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Contact
                      {form.contactId && (() => {
                        const ct = contacts.find(c => c.id === form.contactId);
                        return ct ? (
                          <button
                            onClick={() => window.open(`/customers/${form.customerId}`, '_blank')}
                            className="ml-2 text-[10px] text-blue-600 hover:text-blue-800 font-medium normal-case"
                          >
                            {ct.firstName} {ct.lastName} &#8599;
                          </button>
                        ) : null;
                      })()}
                      {form.customerId && <button onClick={() => setShowNewContactModal(true)} className="ml-2 text-[10px] text-emerald-600 hover:text-emerald-800 font-medium normal-case">+ New</button>}
                    </label>
                    <select
                      value={form.contactId}
                      onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}
                      disabled={!form.customerId}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">Select contact...</option>
                      {customerContacts.map(c => (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ship To inline below customer/contact */}
                <div className="text-[10px] text-gray-400">
                  Ship to: <span className="text-gray-500">{form.shipToAddress || 'Same as billing'}</span>
                  {' '}
                  <button onClick={() => setShowShipToModal(true)} className="text-blue-600 hover:text-blue-800 font-medium">[Edit]</button>
                </div>

                {/* Line 3: Status, Due Date, PO # */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Order['status'] }))}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="in_progress">In Progress</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Due Date <span className="text-red-400">*</span>
                    </label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className={`w-full px-2 py-1.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !form.dueDate ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
                      }`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer PO #</label>
                    <input type="text" value={form.poNumber} onChange={e => setForm(f => ({ ...f, poNumber: e.target.value }))}
                      placeholder="PO number"
                      className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                  </div>
                </div>

                {/* Line 4: Workflow, CSR, Sales Rep */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Production Workflow</label>
                    <select value={form.workflowId} onChange={e => setForm(f => ({ ...f, workflowId: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">CSR</label>
                    <select value={form.csrId} onChange={e => setForm(f => ({ ...f, csrId: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select CSR...</option>
                      {users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Sales Rep</label>
                    <select value={form.salesId} onChange={e => setForm(f => ({ ...f, salesId: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Sales Rep...</option>
                      {users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Ship To Address Modal */}
            {showShipToModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={() => setShowShipToModal(false)} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Ship To Address</h3>
                  <textarea
                    value={form.shipToAddress}
                    onChange={e => setForm(f => ({ ...f, shipToAddress: e.target.value }))}
                    placeholder="Enter shipping address... (leave empty for same as billing)"
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => { setForm(f => ({ ...f, shipToAddress: '' })); setShowShipToModal(false); }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Reset to Billing</button>
                    <button onClick={() => setShowShipToModal(false)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Done</button>
                  </div>
                </div>
              </div>
            )}

            {/* New Customer Modal */}
            {showNewCustomerModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={() => setShowNewCustomerModal(false)} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">New Customer</h3>
                  <div className="space-y-2">
                    <input type="text" placeholder="Company / Customer Name *" value={newCustomerForm.name} onChange={e => setNewCustomerForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                    <input type="email" placeholder="Email" value={newCustomerForm.email} onChange={e => setNewCustomerForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                    <input type="tel" placeholder="Phone" value={newCustomerForm.phone} onChange={e => setNewCustomerForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                    <input type="text" placeholder="Address" value={newCustomerForm.address} onChange={e => setNewCustomerForm(f => ({ ...f, address: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => setShowNewCustomerModal(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={() => {
                      if (!newCustomerForm.name.trim()) return;
                      const id = nanoid();
                      addCustomer({ id, name: newCustomerForm.name, email: newCustomerForm.email || undefined, phone: newCustomerForm.phone || undefined, address: newCustomerForm.address || undefined, taxExempt: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
                      setForm(f => ({ ...f, customerId: id, contactId: '' }));
                      setCustomerQuery('');
                      setNewCustomerForm({ name: '', email: '', phone: '', address: '' });
                      setShowNewCustomerModal(false);
                    }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Customer</button>
                  </div>
                </div>
              </div>
            )}

            {/* New Contact Modal */}
            {showNewContactModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={() => setShowNewContactModal(false)} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">New Contact</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="First Name *" value={newContactForm.firstName} onChange={e => setNewContactForm(f => ({ ...f, firstName: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                      <input type="text" placeholder="Last Name *" value={newContactForm.lastName} onChange={e => setNewContactForm(f => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                    </div>
                    <input type="email" placeholder="Email" value={newContactForm.email} onChange={e => setNewContactForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                    <input type="tel" placeholder="Phone" value={newContactForm.phone} onChange={e => setNewContactForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => setShowNewContactModal(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={() => {
                      if (!newContactForm.firstName.trim() || !newContactForm.lastName.trim()) return;
                      const id = nanoid();
                      addContact({ id, customerId: form.customerId, firstName: newContactForm.firstName, lastName: newContactForm.lastName, email: newContactForm.email || undefined, phone: newContactForm.phone || undefined, isPrimary: false, createdAt: new Date().toISOString() });
                      setForm(f => ({ ...f, contactId: id }));
                      setNewContactForm({ firstName: '', lastName: '', email: '', phone: '' });
                      setShowNewContactModal(false);
                    }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Contact</button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Source quote info banner */}
          {sourceQuote && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">Converting from {sourceQuote.number}</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {sourceQuote.lineItems.length} line items imported — {fmt(sourceQuote.total)} original total
                </p>
              </div>
              <Badge color="blue">From Quote</Badge>
            </div>
          )}

          {/* Templates quick pick */}
          {showTemplates && sortedTemplates.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">Quick Start from Template</h3>
                <button onClick={() => setShowTemplates(false)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {sortedTemplates.filter(t => t.isFavorite).slice(0, 8).map(t => (
                  <button key={t.id} onClick={() => addFromTemplate(t.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                    <Package className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 text-center leading-tight">{t.name}</span>
                    <span className="text-[10px] text-gray-400">{t.quantity.toLocaleString()} pcs</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* ─── Line Items ──────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
              <Button variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addLineItem}>
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <PricingLineItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  pricingState={getPricingState(item.id)}
                  isExpanded={expandedItem === item.id}
                  onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  onUpdateItem={(updates) => setLineItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i))}
                  onUpdatePricing={(updates) => updatePricingState(item.id, updates)}
                  onRemove={() => removeLineItem(item.id)}
                  onDuplicate={() => duplicateLineItem(item)}
                />
              ))}
            </div>

            <button onClick={addLineItem}
              className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> + Add Item
            </button>
          </div>

          {/* Notes */}
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <Textarea label="Customer Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes visible to customer..." rows={3} />
              <Textarea label="Internal Notes" value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))} placeholder="Internal notes for your team..." rows={3} />
            </div>
          </Card>
        </div>

        {/* ─── Sidebar ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="p-5 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-500" /> Order Summary</h3>
            <div className="space-y-3 mb-4">
              {lineItems.filter(i => i.description).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-2">{item.description || 'Untitled'}</span>
                  <span className="font-medium text-gray-900 flex-shrink-0">{fmt(item.sellPrice || 0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Tax</span>
                  <input type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-12 px-1 py-0.5 text-xs border border-gray-200 rounded text-center" />
                  <span>%</span>
                </div>
                <span>{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span className="text-blue-600">{fmt(total)}</span>
              </div>
            </div>

            {/* Due date reminder in sidebar */}
            {form.dueDate && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due: <b className="text-gray-700">{new Date(form.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</b></span>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <Button variant="success" className="w-full justify-center" onClick={() => handleSave(false)} loading={saving}>Save Order</Button>
              <Button variant="success" className="w-full justify-center" onClick={() => handleSave(true)} loading={saving} icon={<FileText className="w-4 h-4" />}>
                Save & Create Invoice
              </Button>
            </div>
          </Card>

          {/* Margin analysis */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Margin Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Total Cost</span><span className="font-medium">{fmt(totalCostAll)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Revenue</span><span className="font-medium">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-emerald-600">Gross Profit</span>
                <span className="text-emerald-600">{fmt(subtotal - totalCostAll)}</span>
              </div>
              {subtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Margin</span>
                  <span className={`font-semibold ${((subtotal - totalCostAll) / subtotal) * 100 >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {fmtPct(((subtotal - totalCostAll) / subtotal) * 100)}
                  </span>
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>

      {/* ─── Cancel Confirmation Modal ───────────────────────────────── */}
      <Modal isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} title="Discard Changes?" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          You have unsaved changes. Are you sure you want to leave? All progress will be lost.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>Keep Editing</Button>
          <Button variant="danger" onClick={() => navigate('/orders')}>Discard & Leave</Button>
        </div>
      </Modal>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// PRICING LINE ITEM ROW — each line item has the full pricing engine
// ═════════════════════════════════════════════════════════════════════════════

interface PricingLineItemRowProps {
  item: OrderItem;
  index: number;
  pricingState: LineItemPricingState;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateItem: (u: Partial<OrderItem>) => void;
  onUpdatePricing: (u: Partial<LineItemPricingState>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const PricingLineItemRow: React.FC<PricingLineItemRowProps> = ({
  item, index, pricingState: ps, isExpanded, onToggle,
  onUpdateItem, onUpdatePricing, onRemove, onDuplicate,
}) => {
  const pricing = usePricingStore();
  const { categories, products, equipment, finishing, materials,
    searchProducts, getEquipmentForCategory, calculateImposition, lookupClickPrice } = pricing;

  // ── Local UI state ────────────────────────────────────────────────────
  const [productQuery, setProductQuery] = useState(ps.productName || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PricingServiceLine>>({});

  // Sync product query when pricing state changes externally (e.g. template load)
  useEffect(() => { setProductQuery(ps.productName || ''); }, [ps.productName]);

  // ── Derived data ──────────────────────────────────────────────────────
  const selectedMaterial = useMemo(() => materials.find(m => m.id === ps.materialId), [materials, ps.materialId]);
  const selectedEquipment = useMemo(() => equipment.find(e => e.id === ps.equipmentId), [equipment, ps.equipmentId]);

  const availableEquipment = useMemo(() => {
    if (!ps.categoryName) return equipment;
    const catEq = getEquipmentForCategory(ps.categoryName);
    return catEq.length > 0 ? catEq : equipment;
  }, [ps.categoryName, equipment, getEquipmentForCategory]);

  const availableMaterials = useMemo(() => {
    if (ps.finalWidth <= 0 || ps.finalHeight <= 0) return materials;
    return materials.filter(m => {
      return (m.sizeWidth >= ps.finalWidth && m.sizeHeight >= ps.finalHeight) ||
        (m.sizeHeight >= ps.finalWidth && m.sizeWidth >= ps.finalHeight);
    });
  }, [materials, ps.finalWidth, ps.finalHeight]);

  const suggestions = useMemo(() => {
    if (!productQuery.trim() || productQuery.length < 1) return [];
    return searchProducts(productQuery).slice(0, 6);
  }, [productQuery, searchProducts]);

  // ── Imposition ────────────────────────────────────────────────────────
  const imposition = useMemo(() => {
    if (!selectedMaterial || ps.finalWidth <= 0 || ps.finalHeight <= 0)
      return { upsAcross: 0, upsDown: 0, totalUps: 0, sheetsNeeded: 0, cutsPerSheet: 0 };
    const r = calculateImposition(ps.finalWidth, ps.finalHeight, selectedMaterial.sizeWidth, selectedMaterial.sizeHeight);
    const sheetsNeeded = r.totalUps > 0 ? Math.ceil(ps.quantity / r.totalUps) : 0;
    const cutsPerSheet = r.upsAcross + r.upsDown;
    return { ...r, sheetsNeeded, cutsPerSheet };
  }, [selectedMaterial, ps.finalWidth, ps.finalHeight, ps.quantity, calculateImposition]);

  // ── Price Calculation ─────────────────────────────────────────────────
  const computeServiceLines = useCallback((): PricingServiceLine[] => {
    const lines: PricingServiceLine[] = [];

    // MATERIAL
    if (selectedMaterial && imposition.sheetsNeeded > 0) {
      const costPerSheet = selectedMaterial.pricePerM / 1000;
      const totalCost = imposition.sheetsNeeded * costPerSheet;
      const markup = selectedMaterial.markup;
      lines.push({
        id: slId(), service: 'Material',
        description: `${selectedMaterial.name} (${selectedMaterial.size}) — ${imposition.sheetsNeeded} sheets`,
        quantity: imposition.sheetsNeeded, unit: 'sheets', unitCost: costPerSheet,
        totalCost, markupPercent: markup, sellPrice: totalCost * (1 + markup / 100), editable: true,
      });
    }

    // PRINTING
    if (selectedEquipment) {
      if (selectedEquipment.costUnit === 'per_click') {
        const totalClicks = imposition.sheetsNeeded * (ps.sides === 'Double' ? 2 : 1);
        const costPerClick = selectedEquipment.unitCost;
        const totalCost = totalClicks * costPerClick;
        const sellPerClick = lookupClickPrice(selectedEquipment.id, totalClicks, ps.colorMode);
        const totalSell = totalClicks * sellPerClick;
        const markupPct = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId(), service: 'Printing',
          description: `${selectedEquipment.name} — ${totalClicks} clicks (${ps.colorMode}, ${ps.sides === 'Double' ? '2-sided' : '1-sided'}) @ ${fmt(sellPerClick)}/click`,
          quantity: totalClicks, unit: 'clicks', unitCost: costPerClick,
          totalCost, markupPercent: markupPct, sellPrice: totalSell, editable: true,
        });
      } else if (selectedEquipment.costUnit === 'per_sqft') {
        const sqft = (ps.finalWidth * ps.finalHeight * ps.quantity) / 144;
        const costPerSqft = selectedEquipment.unitCost;
        const totalCost = sqft * costPerSqft;
        const mult = selectedEquipment.markupMultiplier || 1;
        const totalSell = sqft * costPerSqft * mult;
        const markupPct = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId(), service: 'Printing',
          description: `${selectedEquipment.name} — ${sqft.toFixed(1)} sqft @ ${fmt(costPerSqft * mult)}/sqft`,
          quantity: parseFloat(sqft.toFixed(1)), unit: 'sqft', unitCost: costPerSqft,
          totalCost, markupPercent: markupPct, sellPrice: totalSell, editable: true,
        });
      }
      if (selectedEquipment.initialSetupFee > 0) {
        lines.push({
          id: slId(), service: 'Setup',
          description: `${selectedEquipment.name} — Setup fee`,
          quantity: 1, unit: 'flat', unitCost: selectedEquipment.initialSetupFee,
          totalCost: selectedEquipment.initialSetupFee, markupPercent: 0,
          sellPrice: selectedEquipment.initialSetupFee, editable: true,
        });
      }
    }

    // CUTTING
    if (ps.cuttingEnabled && imposition.sheetsNeeded > 0 && imposition.cutsPerSheet > 0) {
      const cutSvc = finishing.find(f => f.name === 'Cut');
      if (cutSvc) {
        const totalStacks = Math.ceil(imposition.sheetsNeeded / ps.sheetsPerStack);
        const totalCuts = imposition.cutsPerSheet * totalStacks;
        const hours = totalCuts / cutSvc.outputPerHour;
        const totalCost = hours * cutSvc.hourlyCost;
        const markup = cutSvc.markupPercent;
        lines.push({
          id: slId(), service: 'Cutting',
          description: `${totalCuts} cuts (${imposition.cutsPerSheet}/sheet × ${totalStacks} stacks) — ${(hours * 60).toFixed(0)} min`,
          quantity: totalCuts, unit: 'cuts', unitCost: cutSvc.hourlyCost / cutSvc.outputPerHour,
          totalCost, markupPercent: markup, sellPrice: totalCost * (1 + markup / 100), editable: true,
        });
      }
    }

    // FOLDING
    if (ps.foldingType) {
      const fSvc = finishing.find(f => f.name.toLowerCase().replace('-', '') === ps.foldingType.toLowerCase().replace('-', ''));
      if (fSvc) {
        const hours = ps.quantity / fSvc.outputPerHour;
        const totalCost = hours * fSvc.hourlyCost;
        lines.push({
          id: slId(), service: 'Folding',
          description: `${ps.foldingType} — ${ps.quantity} pcs @ ${fSvc.outputPerHour}/hr`,
          quantity: ps.quantity, unit: 'pcs', unitCost: fSvc.hourlyCost / fSvc.outputPerHour,
          totalCost, markupPercent: fSvc.markupPercent, sellPrice: totalCost * (1 + fSvc.markupPercent / 100), editable: true,
        });
      }
    }

    // DRILLING
    if (ps.drillingType) {
      const dSvc = finishing.find(f => f.name === ps.drillingType);
      if (dSvc) {
        const hours = ps.quantity / dSvc.outputPerHour;
        const totalCost = hours * dSvc.hourlyCost;
        lines.push({
          id: slId(), service: 'Drilling',
          description: `${ps.drillingType} — ${ps.quantity} pcs @ ${dSvc.outputPerHour}/hr`,
          quantity: ps.quantity, unit: 'pcs', unitCost: dSvc.hourlyCost / dSvc.outputPerHour,
          totalCost, markupPercent: dSvc.markupPercent, sellPrice: totalCost * (1 + dSvc.markupPercent / 100), editable: true,
        });
      }
    }

    return lines;
  }, [selectedMaterial, selectedEquipment, imposition, ps, finishing, lookupClickPrice]);

  // Recompute and sync to parent
  useEffect(() => {
    const lines = computeServiceLines();
    onUpdatePricing({ serviceLines: lines });

    const totalCost = lines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = lines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;

    // Map to OrderItem fields
    const matLine = lines.find(l => l.service === 'Material');
    const printLine = lines.find(l => l.service === 'Printing');
    const setupLine = lines.find(l => l.service === 'Setup');
    const finishingCost = lines.filter(l => ['Cutting', 'Folding', 'Drilling'].includes(l.service)).reduce((s, l) => s + l.totalCost, 0);

    onUpdateItem({
      description: ps.productName || item.description,
      quantity: ps.quantity || item.quantity,
      width: ps.finalWidth || undefined,
      height: ps.finalHeight || undefined,
      materialId: ps.materialId || undefined,
      materialName: selectedMaterial?.name,
      materialCost: matLine?.totalCost || 0,
      equipmentId: ps.equipmentId || undefined,
      equipmentName: selectedEquipment?.name,
      equipmentCost: printLine?.totalCost || 0,
      laborCost: finishingCost,
      setupCost: setupLine?.totalCost || 0,
      totalCost,
      markup: Math.round(overallMarkup),
      sellPrice: totalSell,
      upsPerSheet: imposition.totalUps || undefined,
      sheetSize: selectedMaterial?.size,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeServiceLines]);

  // ── Select product from search ────────────────────────────────────────
  const selectProduct = (product: PricingProduct) => {
    setProductQuery(product.name);
    setShowSuggestions(false);
    const cat = categories.find(c => product.categoryIds.includes(c.id));

    // Find a matching material
    const matMatch = materials.find(m =>
      m.name.toLowerCase().includes((product.defaultMaterialName || '').toLowerCase().split(' ').slice(-2).join(' '))
    );

    onUpdatePricing({
      productId: product.id,
      productName: product.name,
      categoryName: cat?.name || '',
      quantity: product.defaultQuantity,
      finalWidth: product.defaultFinalWidth,
      finalHeight: product.defaultFinalHeight,
      materialId: matMatch?.id || '',
      equipmentId: product.defaultEquipmentId || '',
      colorMode: product.defaultColor === 'Black' ? 'Black' : 'Color',
      sides: product.defaultSides,
      foldingType: product.defaultFolding || '',
      drillingType: '',
      cuttingEnabled: true,
      sheetsPerStack: 500,
    });
    onUpdateItem({ description: product.name, quantity: product.defaultQuantity });
  };

  // ── Inline edit service line ──────────────────────────────────────────
  const applyEditLine = () => {
    if (!editingLineId) return;
    const updatedLines = ps.serviceLines.map(l => {
      if (l.id !== editingLineId) return l;
      const cost = editValues.totalCost ?? l.totalCost;
      const markup = editValues.markupPercent ?? l.markupPercent;
      return { ...l, totalCost: cost, markupPercent: markup, sellPrice: cost * (1 + markup / 100) };
    });
    onUpdatePricing({ serviceLines: updatedLines });

    // Recalc item totals from edited lines
    const totalCost = updatedLines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = updatedLines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
    onUpdateItem({ totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });

    setEditingLineId(null);
    setEditValues({});
  };

  // Finishing options from pricing store
  const foldingOptions = finishing.filter(f => f.finishingGroupIds?.includes('fg2')).map(f => f.name);
  const drillingOptions = finishing.filter(f => f.finishingGroupIds?.includes('fg3')).map(f => f.name);

  // ═══ RENDER LINE ITEM ═════════════════════════════════════════════════

  return (
    <Card className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Collapsed header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <span className="w-5 h-5 bg-gray-100 rounded text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">{index + 1}</span>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.description || <span className="text-gray-400">New line item — search a product</span>}</p>
          <p className="text-xs text-gray-400">
            {ps.categoryName && <><Badge color="blue" className="mr-1">{ps.categoryName}</Badge></>}
            {ps.quantity > 0 && `${ps.quantity.toLocaleString()} pcs`}
            {ps.finalWidth > 0 && ps.finalHeight > 0 && ` · ${ps.finalWidth}" × ${ps.finalHeight}"`}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {item.totalCost > 0 && (
            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-400">Cost: {fmt(item.totalCost)}</p>
            </div>
          )}
          <p className="text-sm font-bold text-gray-900">{fmt(item.sellPrice || 0)}</p>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={onDuplicate} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Copy className="w-3.5 h-3.5" /></button>
            <button onClick={onRemove} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Expanded pricing form */}
      {isExpanded && (
        <div className="px-4 pb-5 border-t border-gray-50 pt-4 space-y-4">
          {/* ── Product Search ──────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Product</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" value={productQuery}
                onChange={e => { setProductQuery(e.target.value); setShowSuggestions(true); if (!e.target.value.trim()) onUpdatePricing({ productId: '', productName: '' }); }}
                onFocus={() => productQuery && setShowSuggestions(true)}
                placeholder="Type product name (Business Cards, Postcards, Trifold, Brochures...)"
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              {productQuery && (
                <button onClick={() => { setProductQuery(''); onUpdatePricing({ productId: '', productName: '', categoryName: '' }); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
              {showSuggestions && suggestions.length > 0 && !ps.productId && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  {suggestions.map(p => {
                    const cat = categories.find(c => p.categoryIds.includes(c.id));
                    return (
                      <button key={p.id} onClick={() => selectProduct(p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{p.name}</span>
                          {p.aliases.length > 0 && <span className="text-xs text-gray-400 ml-2">aka {p.aliases.slice(0, 3).join(', ')}</span>}
                        </div>
                        <Badge color="gray">{cat?.name}</Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Configuration Grid ─────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Quantity</label>
              <input type="number" value={ps.quantity} min={1}
                onChange={e => onUpdatePricing({ quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Width (in)</label>
              <input type="number" step="0.125" value={ps.finalWidth} min={0}
                onChange={e => onUpdatePricing({ finalWidth: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Height (in)</label>
              <input type="number" step="0.125" value={ps.finalHeight} min={0}
                onChange={e => onUpdatePricing({ finalHeight: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color</label>
              <select value={ps.colorMode} onChange={e => onUpdatePricing({ colorMode: e.target.value as 'Color' | 'Black' })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="Color">Color</option>
                <option value="Black">Black & White</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sides</label>
              <select value={ps.sides} onChange={e => onUpdatePricing({ sides: e.target.value as 'Single' | 'Double' })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="Single">Single Sided</option>
                <option value="Double">Double Sided</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Equipment</label>
              <select value={ps.equipmentId} onChange={e => onUpdatePricing({ equipmentId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="">— Select —</option>
                {availableEquipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Material</label>
              <select value={ps.materialId} onChange={e => onUpdatePricing({ materialId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="">— Select material —</option>
                {availableMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.size}) — {fmt(m.pricePerM)}/M</option>)}
              </select>
            </div>
          </div>

          {/* ── Imposition ─────────────────────────────────────────── */}
          {selectedMaterial && imposition.totalUps > 0 && (
            <div className="bg-blue-50/50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Grid3X3 className="w-3.5 h-3.5 text-blue-500" /> Imposition
              </h4>
              <div className="grid grid-cols-5 gap-2">
                <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                  <p className="text-[10px] text-blue-600 font-medium">Parent</p>
                  <p className="text-sm font-bold text-blue-900">{selectedMaterial.size}</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-emerald-100">
                  <p className="text-[10px] text-emerald-600 font-medium">Ups</p>
                  <p className="text-sm font-bold text-emerald-900">{imposition.totalUps}</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-purple-100">
                  <p className="text-[10px] text-purple-600 font-medium">Layout</p>
                  <p className="text-sm font-bold text-purple-900">{imposition.upsAcross}x{imposition.upsDown}</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
                  <p className="text-[10px] text-amber-600 font-medium">Sheets</p>
                  <p className="text-sm font-bold text-amber-900">{imposition.sheetsNeeded.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                  <p className="text-[10px] text-gray-500 font-medium">Cuts/Sheet</p>
                  <p className="text-sm font-bold text-gray-900">{imposition.cutsPerSheet}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Finishing ──────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-xl border p-3 transition-all ${ps.cuttingEnabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
              <label className="flex items-center gap-1.5 cursor-pointer mb-2">
                <input type="checkbox" checked={ps.cuttingEnabled} onChange={e => onUpdatePricing({ cuttingEnabled: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 rounded" />
                <Scissors className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-700">Cutting</span>
              </label>
              {ps.cuttingEnabled && (
                <input type="number" value={ps.sheetsPerStack} min={1} placeholder="Sheets/stack"
                  onChange={e => onUpdatePricing({ sheetsPerStack: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg" />
              )}
            </div>
            <div className={`rounded-xl border p-3 transition-all ${ps.foldingType ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <FoldVertical className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-700">Folding</span>
              </div>
              <select value={ps.foldingType} onChange={e => onUpdatePricing({ foldingType: e.target.value })}
                className="w-full px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg appearance-none">
                <option value="">None</option>
                {foldingOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className={`rounded-xl border p-3 transition-all ${ps.drillingType ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <CircleDot className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-700">Drilling</span>
              </div>
              <select value={ps.drillingType} onChange={e => onUpdatePricing({ drillingType: e.target.value })}
                className="w-full px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg appearance-none">
                <option value="">None</option>
                {drillingOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* ── Price Breakdown Table ─────────────────────────────── */}
          {ps.serviceLines.length > 0 && (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-200/60">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Price Breakdown
                </h4>
                <span className="text-[10px] text-gray-400">Click row to edit</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200/60">
                    <th className="text-left py-2 px-4 font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                    <th className="text-right py-2 px-4 font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                    <th className="text-right py-2 px-4 font-semibold text-gray-500 uppercase tracking-wide">Markup</th>
                    <th className="text-right py-2 px-4 font-semibold text-gray-500 uppercase tracking-wide">Sell Price</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ps.serviceLines.map(line => {
                    const isEditing = editingLineId === line.id;
                    return (
                      <tr key={line.id}
                        className={`transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-white cursor-pointer'}`}
                        onClick={() => { if (!isEditing) { setEditingLineId(line.id); setEditValues({ totalCost: line.totalCost, markupPercent: line.markupPercent }); } }}>
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-1.5">
                            {line.service === 'Material' && <Package className="w-3 h-3 text-amber-500" />}
                            {line.service === 'Printing' && <Printer className="w-3 h-3 text-blue-500" />}
                            {line.service === 'Setup' && <Settings2 className="w-3 h-3 text-gray-400" />}
                            {line.service === 'Cutting' && <Scissors className="w-3 h-3 text-purple-500" />}
                            {line.service === 'Folding' && <FoldVertical className="w-3 h-3 text-emerald-500" />}
                            {line.service === 'Drilling' && <CircleDot className="w-3 h-3 text-orange-500" />}
                            <span className="font-medium text-gray-800">{line.service}</span>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-gray-500 max-w-[200px] truncate">{line.description}</td>
                        <td className="py-2 px-4 text-right font-mono">
                          {isEditing ? (
                            <input type="number" step="0.01" value={editValues.totalCost ?? line.totalCost}
                              onChange={e => setEditValues(v => ({ ...v, totalCost: parseFloat(e.target.value) || 0 }))}
                              onClick={e => e.stopPropagation()}
                              className="w-20 px-1.5 py-0.5 text-right text-xs border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          ) : fmt(line.totalCost)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-0.5">
                              <input type="number" step="0.1" value={editValues.markupPercent ?? line.markupPercent}
                                onChange={e => setEditValues(v => ({ ...v, markupPercent: parseFloat(e.target.value) || 0 }))}
                                onClick={e => e.stopPropagation()}
                                className="w-16 px-1.5 py-0.5 text-right text-xs border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              <span className="text-gray-400">%</span>
                            </div>
                          ) : (
                            <span className={line.markupPercent > 0 ? 'text-emerald-600' : 'text-gray-400'}>{fmtPct(line.markupPercent)}</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-gray-900">
                          {isEditing
                            ? fmt((editValues.totalCost ?? line.totalCost) * (1 + (editValues.markupPercent ?? line.markupPercent) / 100))
                            : fmt(line.sellPrice)
                          }
                        </td>
                        <td className="py-2 px-1">
                          {isEditing ? (
                            <div className="flex items-center gap-0.5">
                              <button onClick={e => { e.stopPropagation(); applyEditLine(); }}
                                className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-3 h-3" /></button>
                              <button onClick={e => { e.stopPropagation(); setEditingLineId(null); }}
                                className="p-0.5 text-red-500 hover:bg-red-50 rounded"><X className="w-3 h-3" /></button>
                            </div>
                          ) : <Edit3 className="w-3 h-3 text-gray-300" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Line totals */}
              <div className="px-4 py-2.5 border-t border-gray-200/60 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">Cost: <b className="text-gray-700">{fmt(item.totalCost)}</b></span>
                  <span className="text-xs text-gray-500">Margin: <b className={item.sellPrice > 0 && ((item.sellPrice - item.totalCost) / item.sellPrice) * 100 >= 30 ? 'text-emerald-600' : 'text-amber-600'}>
                    {item.sellPrice > 0 ? fmtPct(((item.sellPrice - item.totalCost) / item.sellPrice) * 100) : '0%'}
                  </b></span>
                </div>
                <span className="text-sm font-bold text-blue-700">Sell: {fmt(item.sellPrice)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <Input label="Line Item Notes" value={item.notes || ''} onChange={e => onUpdateItem({ notes: e.target.value })} placeholder="Notes for this item..." />
        </div>
      )}
    </Card>
  );
};
