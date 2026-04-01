import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, Sparkles, ChevronDown, ChevronRight, Calculator, Copy,
  ArrowRight, Search, X, Scissors, FoldVertical, CircleDot, Printer,
  Package, DollarSign, Grid3X3, Edit3, Check, Star, Settings2,
  ChevronUp, Percent, Hash, Info, RefreshCw, Eye, Layers, Wrench,
} from 'lucide-react';
import { useStore } from '../../store';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Input, Textarea, Card, Badge, Modal, ConfirmDialog } from '../../components/ui';
import type { QuoteLineItem, Quote } from '../../types';
import type { PricingProduct, PricingServiceLine, ProductPricingTemplate } from '../../types/pricing';
import { formatCurrency } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = (n: number) => formatCurrency(n);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
// Stable deterministic IDs — must not change between renders so edit mode survives re-renders
const slId = (service: string, index = 0) => `sl_${service.toLowerCase().replace(/\s+/g, '_')}_${index}`;

/** Returns a date string N days from now in YYYY-MM-DD format */
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

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

const EMPTY_LINE_ITEM = (): QuoteLineItem => ({
  id: nanoid(), productFamily: 'digital_print', description: '', quantity: 1, unit: 'each',
  totalCost: 0, markup: 0, sellPrice: 0,
});

// ═════════════════════════════════════════════════════════════════════════════
// QUOTE BUILDER
// ═════════════════════════════════════════════════════════════════════════════

export const QuoteBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customers, contacts, addQuote, nextQuoteNumber, currentUser, users, addCustomer, addContact } = useStore();
  const pricing = usePricingStore();
  const initialCustomerId = searchParams.get('customerId') || '';
  const initialContactId = searchParams.get('contactId') || '';

  // ── Generate quote number immediately on mount ───────────────────────
  const [quoteNumber] = useState(() => nextQuoteNumber());

  // ── Quote-level state ─────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '', customerId: initialCustomerId, contactId: initialContactId, status: 'pending' as Quote['status'],
    taxRate: 7, validUntil: daysFromNow(45), notes: '', internalNotes: '',
    csrId: currentUser.id, salesId: currentUser.id,
    dueDate: '',
    shipping: 0,
    discount: 0,
    discountType: 'fixed' as 'fixed' | 'percent',
    postage: 0,
    shipToAddress: '',
  });
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([EMPTY_LINE_ITEM()]);
  const [pricingStates, setPricingStates] = useState<Record<string, LineItemPricingState>>({
    [lineItems[0].id]: DEFAULT_PRICING_STATE(),
  });
  const [saving, setSaving] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────
  const [editingItemModal, setEditingItemModal] = useState<string | null>(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showShipToModal, setShowShipToModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [newContactForm, setNewContactForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const customerSearchRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const customerContacts = contacts.filter(c => c.customerId === form.customerId);

  // ── Filtered customers for searchable field ───────────────────────────
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 20);
    const q = customerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q)).slice(0, 20);
  }, [customerSearch, customers]);

  // ── CSR and Sales users ───────────────────────────────────────────────
  const csrUsers = useMemo(() => users.filter(u => u.active && (u.role === 'csr' || u.role === 'admin' || u.role === 'manager')), [users]);
  const salesUsers = useMemo(() => users.filter(u => u.active && (u.role === 'sales' || u.role === 'admin' || u.role === 'manager')), [users]);

  // ── Calculations ──────────────────────────────────────────────────────
  const subtotal = lineItems.reduce((s, i) => s + (i.sellPrice || 0), 0);
  const discountAmount = form.discountType === 'percent' ? subtotal * (form.discount / 100) : form.discount;
  const afterDiscount = subtotal - discountAmount + form.shipping + form.postage;
  const taxAmount = afterDiscount * (form.taxRate / 100);
  const total = afterDiscount + taxAmount;
  const totalCostAll = lineItems.reduce((s, i) => s + (i.totalCost || 0), 0);

  // ── Pricing state helpers ─────────────────────────────────────────────
  const getPricingState = (id: string) => pricingStates[id] || DEFAULT_PRICING_STATE();
  const updatePricingState = useCallback((id: string, updates: Partial<LineItemPricingState>) => {
    setPricingStates(prev => ({ ...prev, [id]: { ...(prev[id] || DEFAULT_PRICING_STATE()), ...updates } }));
  }, []);

  // ── Has unsaved content check ─────────────────────────────────────────
  const hasContent = lineItems.some(i => i.description || i.sellPrice > 0) || form.title || form.customerId;

  // ── Add / remove line items ───────────────────────────────────────────
  const addLineItem = () => {
    const item = EMPTY_LINE_ITEM();
    setLineItems(prev => [...prev, item]);
    setPricingStates(prev => ({ ...prev, [item.id]: DEFAULT_PRICING_STATE() }));
    setEditingItemModal(item.id);
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
    setPricingStates(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (editingItemModal === id) setEditingItemModal(null);
  };

  const duplicateLineItem = (item: QuoteLineItem) => {
    const newId = nanoid();
    const newItem = { ...item, id: newId };
    setLineItems(prev => [...prev, newItem]);
    setPricingStates(prev => ({ ...prev, [newId]: { ...(prev[item.id] || DEFAULT_PRICING_STATE()) } }));
    setEditingItemModal(newId);
  };

  // ── Load from pricing template into a specific item ───────────────────
  const applyTemplateToItem = (tmplId: string, targetItemId: string) => {
    const tmpl = pricing.templates.find(t => t.id === tmplId);
    if (!tmpl) return;
    pricing.incrementTemplateUsage(tmplId);

    const mat = tmpl.materialId
      ? pricing.materials.find(m => m.id === tmpl.materialId)
      : tmpl.materialName
        ? pricing.materials.find(m => m.name === tmpl.materialName)
        : undefined;

    setLineItems(prev => prev.map(i => i.id === targetItemId ? {
      ...i,
      description: tmpl.productName,
      quantity: tmpl.quantity,
      unit: 'each' as const,
      width: tmpl.finalWidth || undefined,
      height: tmpl.finalHeight || undefined,
    } : i));

    setPricingStates(prev => ({
      ...prev,
      [targetItemId]: {
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
        serviceLines: [],
      },
    }));
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async (andConvert = false) => {
    setSaving(true);
    const number = quoteNumber;
    const quote: Quote = {
      id: nanoid(), number, status: form.status,
      customerId: form.customerId || undefined, customerName: selectedCustomer?.name,
      contactId: form.contactId || undefined,
      title: form.title || `Quote ${number}`,
      lineItems, subtotal, taxRate: form.taxRate, taxAmount, total,
      validUntil: form.validUntil || undefined,
      notes: form.notes || undefined, internalNotes: form.internalNotes || undefined,
      csrId: form.csrId, salesId: form.salesId, source: 'scratch',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addQuote(quote);
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
    if (andConvert) navigate(`/orders/new?quoteId=${quote.id}`);
    else navigate(`/quotes/${quote.id}`);
  };

  // ── Cancel handler ────────────────────────────────────────────────────
  const handleCancel = () => {
    if (hasContent) {
      setShowCancelConfirm(true);
    } else {
      navigate('/quotes');
    }
  };

  // ── Close dropdown on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Sorted templates ──────────────────────────────────────────────────
  const sortedTemplates = useMemo(() =>
    [...pricing.templates].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || b.usageCount - a.usageCount),
    [pricing.templates]
  );

  // ── Currently editing item ────────────────────────────────────────────
  const editingItem = editingItemModal ? lineItems.find(i => i.id === editingItemModal) : null;
  const editingPs = editingItemModal ? getPricingState(editingItemModal) : null;
  const isNewItem = editingItem ? !editingItem.description : false;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div>
      {/* ─── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <button onClick={() => navigate('/quotes')} className="hover:text-blue-600">Quotes</button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{quoteNumber}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Build Quote</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          <Button variant="success" onClick={() => handleSave()} loading={saving}>Save Draft</Button>
          {/* Save & Convert dropdown */}
          <div className="relative">
            <div className="flex">
              <Button variant="primary" onClick={() => handleSave(true)} loading={saving}
                icon={<ArrowRight className="w-4 h-4" />}
                className="rounded-r-none border-r-0">
                Save & Convert to Order
              </Button>
              <button
                onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                className="px-2 bg-blue-600 text-white border border-blue-600 rounded-r-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            {showSaveDropdown && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
                <button onClick={() => { setShowSaveDropdown(false); handleSave(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                  Save as New Quote
                </button>
                <button onClick={() => { setShowSaveDropdown(false); handleSave(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-t border-gray-100">
                  Save & Convert to Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ─── Main form ─────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* ─── Collapsible Quote Header ────────────────────────────── */}
          <Card className="overflow-hidden">
            <button
              onClick={() => setHeaderCollapsed(!headerCollapsed)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {headerCollapsed
                  ? <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
                <div className="text-left min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">
                    {form.title || 'New Quote'}
                  </h2>
                  {headerCollapsed && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {selectedCustomer?.name || 'No customer selected'}
                      {form.status !== 'pending' && <Badge color="blue" className="ml-2">{form.status}</Badge>}
                    </p>
                  )}
                </div>
              </div>
              {headerCollapsed && (
                <span className="text-xs text-gray-400 flex-shrink-0">Click to expand</span>
              )}
            </button>

            {!headerCollapsed && (
              <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-2.5">
                {/* Line 1: Quote Title */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Quote Title</label>
                  <input
                    type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., Spring Marketing Package for Acme Corp"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>

                {/* Line 2: Customer + Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div ref={customerSearchRef}>
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
                        value={form.customerId ? (selectedCustomer?.name || '') : customerSearch}
                        onChange={e => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerDropdown(true);
                          if (form.customerId) setForm(f => ({ ...f, customerId: '', contactId: '' }));
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="Search customers..."
                        className="w-full pl-8 pr-7 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                      {form.customerId && (
                        <button onClick={() => { setForm(f => ({ ...f, customerId: '', contactId: '' })); setCustomerSearch(''); }}
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
                              onClick={() => { setForm(f => ({ ...f, customerId: c.id, contactId: '' })); setCustomerSearch(''); setShowCustomerDropdown(false); }}
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

                {/* Line 3: Status, Valid Until, Due Date */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Quote['status'] }))}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="pending">Pending</option>
                      <option value="hot">Hot</option>
                      <option value="cold">Cold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Valid Until</label>
                    <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date Due</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* Line 4: CSR + Sales Rep */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">CSR</label>
                    <select value={form.csrId} onChange={e => setForm(f => ({ ...f, csrId: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select CSR...</option>
                      {csrUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Sales Rep</label>
                    <select value={form.salesId} onChange={e => setForm(f => ({ ...f, salesId: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Sales Rep...</option>
                      {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
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
                      setCustomerSearch('');
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

          {/* ─── Line Items ──────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
              <Button variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addLineItem}>
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => {
                const ps = getPricingState(item.id);
                return (
                  <Card key={item.id} className="overflow-hidden hover:border-gray-200 transition-all">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="w-5 h-5 bg-gray-100 rounded text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingItemModal(item.id)}>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.description || <span className="text-gray-400 italic">New line item -- click to configure</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {ps.categoryName && <Badge color="blue" className="text-[10px]">{ps.categoryName}</Badge>}
                          {ps.quantity > 0 && <span className="text-xs text-gray-400">{ps.quantity.toLocaleString()} pcs</span>}
                          {ps.finalWidth > 0 && ps.finalHeight > 0 && <span className="text-xs text-gray-400">{ps.finalWidth}" x {ps.finalHeight}"</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{fmt(item.sellPrice || 0)}</p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingItemModal(item.id)} className="p-1 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => duplicateLineItem(item)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeLineItem(item.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <button onClick={addLineItem}
              className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> + Add Item
            </button>
          </div>

          {/* Notes */}
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <Textarea label="Customer Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes visible to customer on quote PDF..." rows={3} />
              <Textarea label="Internal Notes" value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))} placeholder="Internal notes for your team..." rows={3} />
            </div>
          </Card>
        </div>

        {/* ─── Sidebar ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="p-5 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-500" /> Quote Summary</h3>
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

              {/* Shipping */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">$</span>
                  <input type="number" value={form.shipping || ''} min={0} step="0.01"
                    onChange={e => setForm(f => ({ ...f, shipping: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-20 px-1.5 py-0.5 text-xs border border-gray-200 rounded text-right" />
                </div>
              </div>

              {/* Postage */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Postage</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">$</span>
                  <input type="number" value={form.postage || ''} min={0} step="0.01"
                    onChange={e => setForm(f => ({ ...f, postage: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-20 px-1.5 py-0.5 text-xs border border-gray-200 rounded text-right" />
                </div>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span>Discount</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, discountType: f.discountType === 'fixed' ? 'percent' : 'fixed' }))}
                    className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                    title={`Switch to ${form.discountType === 'fixed' ? 'percent' : 'fixed'} discount`}
                  >
                    {form.discountType === 'fixed'
                      ? <DollarSign className="w-3 h-3" />
                      : <Percent className="w-3 h-3" />
                    }
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">{form.discountType === 'fixed' ? '$' : ''}</span>
                  <input type="number" value={form.discount || ''} min={0} step="0.01"
                    onChange={e => setForm(f => ({ ...f, discount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-20 px-1.5 py-0.5 text-xs border border-gray-200 rounded text-right" />
                  <span className="text-gray-400 text-xs">{form.discountType === 'percent' ? '%' : ''}</span>
                </div>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-red-500 pl-4">
                  <span>Discount amount</span><span>-{fmt(discountAmount)}</span>
                </div>
              )}

              {/* Tax */}
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
            <div className="mt-4 space-y-2">
              <Button variant="primary" className="w-full justify-center" onClick={() => handleSave(true)} loading={saving} icon={<ArrowRight className="w-4 h-4" />}>Save & Convert to Order</Button>
              <Button variant="success" className="w-full justify-center" onClick={() => handleSave()} loading={saving}>Save Quote</Button>
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

      {/* ─── Product Edit Modal ──────────────────────────────────────── */}
      {editingItemModal && editingItem && editingPs && (
        <ProductEditModal
          item={editingItem}
          pricingState={editingPs}
          isNew={isNewItem}
          onUpdateItem={(updates) => setLineItems(prev => prev.map(i => i.id === editingItemModal ? { ...i, ...updates } : i))}
          onUpdatePricing={(updates) => updatePricingState(editingItemModal, updates)}
          onClose={() => setEditingItemModal(null)}
          onRemove={() => removeLineItem(editingItemModal)}
          matchingTemplates={editingPs?.productName
            ? sortedTemplates.filter(t =>
                t.productName.toLowerCase() === editingPs.productName.toLowerCase() ||
                t.productName.toLowerCase().includes(editingPs.productName.toLowerCase()) ||
                editingPs.productName.toLowerCase().includes(t.productName.toLowerCase())
              )
            : []
          }
          onApplyTemplate={(tmplId) => applyTemplateToItem(tmplId, editingItemModal)}
        />
      )}

      {/* ─── Cancel Confirmation Dialog ──────────────────────────────── */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate('/quotes')}
        title="Discard Changes?"
        message="Are you sure? Unsaved changes will be lost."
        confirmLabel="Discard"
      />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT EDIT MODAL — full pricing engine in a modal dialog
// ═════════════════════════════════════════════════════════════════════════════

interface SavedPart {
  id: string;
  partName: string;
  description: string;
  totalCost: number;
  totalSell: number;
  serviceLines: PricingServiceLine[];
}

interface ProductEditModalProps {
  item: QuoteLineItem;
  pricingState: LineItemPricingState;
  isNew: boolean;
  onUpdateItem: (u: Partial<QuoteLineItem>) => void;
  onUpdatePricing: (u: Partial<LineItemPricingState>) => void;
  onClose: () => void;
  onRemove: () => void;
  matchingTemplates: ProductPricingTemplate[];
  onApplyTemplate: (tmplId: string) => void;
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({
  item, pricingState: ps, isNew,
  onUpdateItem, onUpdatePricing, onClose, onRemove,
  matchingTemplates, onApplyTemplate,
}) => {
  const pricing = usePricingStore();
  const { categories, products, equipment, finishing, materials, finishingGroups,
    searchProducts, getEquipmentForCategory, calculateImposition, lookupClickPrice } = pricing;

  // ── Local UI state ────────────────────────────────────────────────────
  const [productQuery, setProductQuery] = useState(ps.productName || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PricingServiceLine>>({});
  const [savedAsTemplate, setSavedAsTemplate] = useState(false);
  const [multiQtyInput, setMultiQtyInput] = useState(String(ps.quantity || 1000));
  const [autoDescribe, setAutoDescribe] = useState(true);
  const [sizeInput, setSizeInput] = useState(
    ps.finalWidth > 0 && ps.finalHeight > 0 ? `${ps.finalWidth}x${ps.finalHeight}` : ''
  );
  const [sizeError, setSizeError] = useState('');

  // ── Imposition calculator state ──────────────────────────────────────
  const [showImpositionCalc, setShowImpositionCalc] = useState(false);
  const [impositionBleed, setImpositionBleed] = useState(0.125);
  const [impositionGutter, setImpositionGutter] = useState(0);
  const [impositionOrientation, setImpositionOrientation] = useState<'auto' | 'A' | 'B'>('auto');
  const [runSizeInput, setRunSizeInput] = useState('');
  const [customRunWidth, setCustomRunWidth] = useState(0);
  const [customRunHeight, setCustomRunHeight] = useState(0);

  // ── Template panel state ─────────────────────────────────────────────
  const [templatePanelCollapsed, setTemplatePanelCollapsed] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // ── Price breakdown state ────────────────────────────────────────────
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});
  const [showBreakdownDialog, setShowBreakdownDialog] = useState(false);

  // ── Multi-part state ───────────────────────────────────────────────
  const [isMultiPart, setIsMultiPart] = useState(false);
  const [globalProduct, setGlobalProduct] = useState('');
  const [globalDescription, setGlobalDescription] = useState('');
  const [savedParts, setSavedParts] = useState<SavedPart[]>([]);
  const [activePartName, setActivePartName] = useState('Cover');
  const [partDescription, setPartDescription] = useState('');
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);

  // ── Multi-material entries ────────────────────────────────────────────
  const [materialEntries, setMaterialEntries] = useState<Array<{
    materialId: string;
    sides: 'Single' | 'Double';
    colorMode: 'Color' | 'Black';
    originals: number;
  }>>([{
    materialId: ps.materialId || '',
    sides: ps.sides,
    colorMode: ps.colorMode,
    originals: 1,
  }]);

  // ── Services selection state ──────────────────────────────────────────
  const [selectedFinishingIds, setSelectedFinishingIds] = useState<string[]>(() => {
    const ids: string[] = [];
    if (ps.cuttingEnabled) {
      const cutSvc = finishing.find(f => f.name === 'Cut');
      if (cutSvc) ids.push(cutSvc.id);
    }
    if (ps.foldingType) {
      const fSvc = finishing.find(f => f.name.toLowerCase().replace('-', '') === ps.foldingType.toLowerCase().replace('-', ''));
      if (fSvc) ids.push(fSvc.id);
    }
    if (ps.drillingType) {
      const dSvc = finishing.find(f => f.name === ps.drillingType);
      if (dSvc) ids.push(dSvc.id);
    }
    return ids;
  });
  const [selectedLaborIds, setSelectedLaborIds] = useState<string[]>([]);
  const [selectedBrokeredIds, setSelectedBrokeredIds] = useState<string[]>([]);

  // Sync first material entry to pricing state
  useEffect(() => {
    if (materialEntries.length > 0) {
      const first = materialEntries[0];
      if (first.materialId !== ps.materialId || first.sides !== ps.sides || first.colorMode !== ps.colorMode) {
        onUpdatePricing({
          materialId: first.materialId,
          sides: first.sides,
          colorMode: first.colorMode,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialEntries]);

  // Sync material entries from pricing state when externally changed (template load)
  useEffect(() => {
    setMaterialEntries(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[0] = { ...updated[0], materialId: ps.materialId || '', sides: ps.sides, colorMode: ps.colorMode };
      }
      return updated;
    });
  }, [ps.materialId, ps.sides, ps.colorMode]);

  // Sync product query when pricing state changes externally (e.g. template load)
  useEffect(() => { setProductQuery(ps.productName || ''); }, [ps.productName]);
  useEffect(() => { setMultiQtyInput(String(ps.quantity || 1000)); }, [ps.quantity]);
  useEffect(() => {
    if (ps.finalWidth > 0 && ps.finalHeight > 0) {
      setSizeInput(`${ps.finalWidth}x${ps.finalHeight}`);
    }
  }, [ps.finalWidth, ps.finalHeight]);

  // ── Auto-describe helper ──────────────────────────────────────────────
  const buildDescription = useCallback(() => {
    const materialName = materials.find(m => m.id === ps.materialId)?.name;
    let desc = ps.productName || '';
    if (materialName) desc += ' - ' + materialName;
    if (ps.finalWidth && ps.finalHeight) desc += ', ' + ps.finalWidth + 'x' + ps.finalHeight;
    if (ps.colorMode) desc += ', ' + ps.colorMode;
    if (ps.sides) desc += ', ' + ps.sides + '-Sided';
    return desc;
  }, [ps.productName, ps.materialId, ps.finalWidth, ps.finalHeight, ps.colorMode, ps.sides, materials]);

  useEffect(() => {
    if (autoDescribe && ps.productName) {
      onUpdateItem({ description: buildDescription() });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDescribe, buildDescription]);

  // Auto-collapse template panel when user starts filling fields
  useEffect(() => {
    if (userInteracted && matchingTemplates.length > 0 && !templatePanelCollapsed) {
      setTemplatePanelCollapsed(true);
    }
  }, [userInteracted]);

  // ── Derived data ──────────────────────────────────────────────────────
  const selectedMaterial = useMemo(() => materials.find(m => m.id === ps.materialId), [materials, ps.materialId]);
  const selectedEquipment = useMemo(() => equipment.find(e => e.id === ps.equipmentId), [equipment, ps.equipmentId]);

  // Initialize run size input from selected material
  useEffect(() => {
    if (selectedMaterial) {
      setRunSizeInput(`${selectedMaterial.sizeWidth}x${selectedMaterial.sizeHeight}`);
    }
  }, [selectedMaterial]);

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

  // ── Multiple quantities parsing ───────────────────────────────────────
  const parsedQuantities = useMemo(() => {
    const parts = multiQtyInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    return parts.length > 0 ? parts : [ps.quantity || 1000];
  }, [multiQtyInput, ps.quantity]);

  const isMultiQty = parsedQuantities.length > 1;

  // ── Imposition ────────────────────────────────────────────────────────
  const imposition = useMemo(() => {
    if (!selectedMaterial || ps.finalWidth <= 0 || ps.finalHeight <= 0)
      return { upsAcross: 0, upsDown: 0, totalUps: 0, sheetsNeeded: 0, cutsPerSheet: 0 };
    const r = calculateImposition(ps.finalWidth, ps.finalHeight, selectedMaterial.sizeWidth, selectedMaterial.sizeHeight);
    const sheetsNeeded = r.totalUps > 0 ? Math.ceil(ps.quantity / r.totalUps) : 0;
    const cutsPerSheet = r.upsAcross + r.upsDown;
    return { ...r, sheetsNeeded, cutsPerSheet };
  }, [selectedMaterial, ps.finalWidth, ps.finalHeight, ps.quantity, calculateImposition]);

  // ── Enhanced imposition with bleed/gutter/orientation ────────────────
  const enhancedImposition = useMemo(() => {
    if (!selectedMaterial || ps.finalWidth <= 0 || ps.finalHeight <= 0)
      return { ...imposition, runWidth: 0, runHeight: 0, waste: 0, orientationA: imposition, orientationB: { upsAcross: 0, upsDown: 0, totalUps: 0 }, bestOrientation: 'A' as const };

    const bleed2 = impositionBleed * 2;
    const runW = ps.finalWidth + bleed2;
    const runH = ps.finalHeight + bleed2;
    const sheetW = customRunWidth > 0 ? customRunWidth : selectedMaterial.sizeWidth;
    const sheetH = customRunHeight > 0 ? customRunHeight : selectedMaterial.sizeHeight;
    const gutter = impositionGutter;

    // Orientation A: finalW along sheetW
    const aAcross = Math.floor((sheetW + gutter) / (runW + gutter));
    const aDown = Math.floor((sheetH + gutter) / (runH + gutter));
    const aTotal = aAcross * aDown;

    // Orientation B: finalH along sheetW (rotated)
    const bAcross = Math.floor((sheetW + gutter) / (runH + gutter));
    const bDown = Math.floor((sheetH + gutter) / (runW + gutter));
    const bTotal = bAcross * bDown;

    const orientationA = { upsAcross: aAcross, upsDown: aDown, totalUps: aTotal };
    const orientationB = { upsAcross: bAcross, upsDown: bDown, totalUps: bTotal };

    let chosen = impositionOrientation === 'A' ? orientationA :
                 impositionOrientation === 'B' ? orientationB :
                 aTotal >= bTotal ? orientationA : orientationB;
    const bestOrientation = impositionOrientation !== 'auto' ? impositionOrientation : (aTotal >= bTotal ? 'A' : 'B');

    const sheetsNeeded = chosen.totalUps > 0 ? Math.ceil(ps.quantity / chosen.totalUps) : 0;
    const cutsPerSheet = chosen.upsAcross > 0 && chosen.upsDown > 0 ? (chosen.upsAcross - 1) + (chosen.upsDown - 1) + 2 : 0;
    const usedArea = chosen.totalUps * runW * runH;
    const sheetArea = sheetW * sheetH;
    const waste = sheetArea > 0 ? ((sheetArea - usedArea) / sheetArea) * 100 : 0;

    return {
      ...chosen, sheetsNeeded, cutsPerSheet,
      runWidth: runW, runHeight: runH,
      waste: Math.max(0, waste),
      orientationA, orientationB, bestOrientation
    };
  }, [selectedMaterial, ps.finalWidth, ps.finalHeight, ps.quantity, impositionBleed, impositionGutter, impositionOrientation, customRunWidth, customRunHeight]);

  // ── Price Calculation ─────────────────────────────────────────────────
  const computeServiceLines = useCallback((): PricingServiceLine[] => {
    const lines: PricingServiceLine[] = [];

    // MATERIAL — stable id: sl_material_0
    if (selectedMaterial && imposition.sheetsNeeded > 0) {
      const costPerSheet = selectedMaterial.pricePerM / 1000;
      const totalCost = imposition.sheetsNeeded * costPerSheet;
      const markup = selectedMaterial.markup;
      lines.push({
        id: slId('material'), service: 'Material',
        description: `${selectedMaterial.name} (${selectedMaterial.size}) — ${imposition.sheetsNeeded} sheets`,
        quantity: imposition.sheetsNeeded, unit: 'sheets', unitCost: costPerSheet,
        totalCost, markupPercent: markup, sellPrice: totalCost * (1 + markup / 100), editable: true,
      });
    }

    // PRINTING — stable id: sl_printing_0
    if (selectedEquipment) {
      if (selectedEquipment.costUnit === 'per_click') {
        const totalClicks = imposition.sheetsNeeded * (ps.sides === 'Double' ? 2 : 1);
        const costPerClick = selectedEquipment.unitCost;
        const totalCost = totalClicks * costPerClick;
        const sellPerClick = lookupClickPrice(selectedEquipment.id, totalClicks, ps.colorMode);
        const totalSell = totalClicks * sellPerClick;
        const markupPct = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId('printing'), service: 'Printing',
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
          id: slId('printing'), service: 'Printing',
          description: `${selectedEquipment.name} — ${sqft.toFixed(1)} sqft @ ${fmt(costPerSqft * mult)}/sqft`,
          quantity: parseFloat(sqft.toFixed(1)), unit: 'sqft', unitCost: costPerSqft,
          totalCost, markupPercent: markupPct, sellPrice: totalSell, editable: true,
        });
      }
      if (selectedEquipment.initialSetupFee > 0) {
        lines.push({
          id: slId('setup'), service: 'Setup',
          description: `${selectedEquipment.name} — Setup fee`,
          quantity: 1, unit: 'flat', unitCost: selectedEquipment.initialSetupFee,
          totalCost: selectedEquipment.initialSetupFee, markupPercent: 0,
          sellPrice: selectedEquipment.initialSetupFee, editable: true,
        });
      }
    }

    // CUTTING — stable id: sl_cutting_0
    if (ps.cuttingEnabled && imposition.sheetsNeeded > 0 && imposition.cutsPerSheet > 0) {
      const cutSvc = finishing.find(f => f.name === 'Cut');
      if (cutSvc) {
        const totalStacks = Math.ceil(imposition.sheetsNeeded / ps.sheetsPerStack);
        const totalCuts = imposition.cutsPerSheet * totalStacks;
        const hours = totalCuts / cutSvc.outputPerHour;
        const totalCost = hours * cutSvc.hourlyCost;
        const markup = cutSvc.markupPercent;
        lines.push({
          id: slId('cutting'), service: 'Cutting',
          description: `${totalCuts} cuts (${imposition.cutsPerSheet}/sheet × ${totalStacks} stacks)`,
          quantity: totalCuts, unit: 'cuts', unitCost: cutSvc.hourlyCost / cutSvc.outputPerHour,
          totalCost, markupPercent: markup, sellPrice: totalCost * (1 + markup / 100), editable: true,
          hourlyCost: cutSvc.hourlyCost, hoursActual: hours, hoursCharge: hours,
        });
      }
    }

    // FOLDING — stable id: sl_folding_0
    if (ps.foldingType) {
      const fSvc = finishing.find(f => f.name.toLowerCase().replace('-', '') === ps.foldingType.toLowerCase().replace('-', ''));
      if (fSvc) {
        const hours = ps.quantity / fSvc.outputPerHour;
        const totalCost = hours * fSvc.hourlyCost;
        lines.push({
          id: slId('folding'), service: 'Folding',
          description: `${ps.foldingType} — ${ps.quantity.toLocaleString()} pcs @ ${fSvc.outputPerHour.toLocaleString()}/hr`,
          quantity: ps.quantity, unit: 'pcs', unitCost: fSvc.hourlyCost / fSvc.outputPerHour,
          totalCost, markupPercent: fSvc.markupPercent, sellPrice: totalCost * (1 + fSvc.markupPercent / 100), editable: true,
          hourlyCost: fSvc.hourlyCost, hoursActual: hours, hoursCharge: hours,
        });
      }
    }

    // DRILLING — stable id: sl_drilling_0
    if (ps.drillingType) {
      const dSvc = finishing.find(f => f.name === ps.drillingType);
      if (dSvc) {
        const hours = ps.quantity / dSvc.outputPerHour;
        const totalCost = hours * dSvc.hourlyCost;
        lines.push({
          id: slId('drilling'), service: 'Drilling',
          description: `${ps.drillingType} — ${ps.quantity.toLocaleString()} pcs @ ${dSvc.outputPerHour.toLocaleString()}/hr`,
          quantity: ps.quantity, unit: 'pcs', unitCost: dSvc.hourlyCost / dSvc.outputPerHour,
          totalCost, markupPercent: dSvc.markupPercent, sellPrice: totalCost * (1 + dSvc.markupPercent / 100), editable: true,
          hourlyCost: dSvc.hourlyCost, hoursActual: hours, hoursCharge: hours,
        });
      }
    }

    return lines;
  // Depend only on the specific ps fields that actually affect calculations — NOT ps.serviceLines
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMaterial, selectedEquipment, imposition,
      ps.quantity, ps.sides, ps.colorMode, ps.materialId, ps.equipmentId,
      ps.cuttingEnabled, ps.sheetsPerStack, ps.foldingType, ps.drillingType,
      ps.finalWidth, ps.finalHeight,
      finishing, lookupClickPrice]);

  // Recompute and sync to parent — but SKIP if user is currently editing or has saved overrides
  useEffect(() => {
    // Never recompute while a row is being edited (would wipe the edit inputs)
    if (editingLineId !== null) return;
    // Never recompute if there are saved manual overrides
    if (Object.keys(manualOverrides).length > 0) return;

    const lines = computeServiceLines();
    onUpdatePricing({ serviceLines: lines });

    const totalCost = lines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = lines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;

    // Map to QuoteLineItem fields
    const matLine = lines.find(l => l.service === 'Material');
    const printLine = lines.find(l => l.service === 'Printing');
    const setupLine = lines.find(l => l.service === 'Setup');
    const finishingCost = lines.filter(l => ['Cutting', 'Folding', 'Drilling'].includes(l.service)).reduce((s, l) => s + l.totalCost, 0);

    onUpdateItem({
      description: autoDescribe ? buildDescription() : (ps.productName || item.description),
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

  // ── Multi-quantity pricing computation ────────────────────────────────
  const multiQtyPricing = useMemo(() => {
    if (!isMultiQty) return [];
    return parsedQuantities.map(qty => {
      // Recompute cost/sell for this qty
      let tCost = 0;
      let tSell = 0;

      if (selectedMaterial && ps.finalWidth > 0 && ps.finalHeight > 0) {
        const imp = calculateImposition(ps.finalWidth, ps.finalHeight, selectedMaterial.sizeWidth, selectedMaterial.sizeHeight);
        const sheets = imp.totalUps > 0 ? Math.ceil(qty / imp.totalUps) : 0;
        const costPerSheet = selectedMaterial.pricePerM / 1000;
        const matCost = sheets * costPerSheet;
        tCost += matCost;
        tSell += matCost * (1 + selectedMaterial.markup / 100);

        if (selectedEquipment) {
          if (selectedEquipment.costUnit === 'per_click') {
            const clicks = sheets * (ps.sides === 'Double' ? 2 : 1);
            const clickCost = clicks * selectedEquipment.unitCost;
            const sellPerClick = lookupClickPrice(selectedEquipment.id, clicks, ps.colorMode);
            tCost += clickCost;
            tSell += clicks * sellPerClick;
            if (selectedEquipment.initialSetupFee > 0) {
              tCost += selectedEquipment.initialSetupFee;
              tSell += selectedEquipment.initialSetupFee;
            }
          } else if (selectedEquipment.costUnit === 'per_sqft') {
            const sqft = (ps.finalWidth * ps.finalHeight * qty) / 144;
            const cost = sqft * selectedEquipment.unitCost;
            const mult = selectedEquipment.markupMultiplier || 1;
            tCost += cost;
            tSell += sqft * selectedEquipment.unitCost * mult;
          }
        }
      }

      return { qty, cost: tCost, sell: tSell };
    });
  }, [isMultiQty, parsedQuantities, selectedMaterial, selectedEquipment, ps, calculateImposition, lookupClickPrice]);

  // ── Select product from search ────────────────────────────────────────
  const selectProduct = (product: PricingProduct) => {
    setProductQuery(product.name);
    setShowSuggestions(false);
    const cat = categories.find(c => product.categoryIds.includes(c.id));

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
    setMultiQtyInput(String(product.defaultQuantity));
  };

  // ── Inline edit service line ──────────────────────────────────────────
  const applyEditLine = () => {
    if (!editingLineId) return;
    const updatedLines = ps.serviceLines.map(l => {
      if (l.id !== editingLineId) return l;
      const cost = editValues.totalCost ?? l.totalCost;
      const markup = editValues.markupPercent ?? l.markupPercent;
      // If user directly edited sell price, use that; otherwise compute from cost + markup
      const sell = editValues.sellPrice != null
        ? editValues.sellPrice
        : cost * (1 + markup / 100);
      return { ...l, totalCost: cost, markupPercent: markup, sellPrice: sell };
    });
    onUpdatePricing({ serviceLines: updatedLines });

    const totalCost = updatedLines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = updatedLines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
    onUpdateItem({ totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });

    setEditingLineId(null);
    setEditValues({});
  };

  // ── Recalculate (reset manual overrides) ─────────────────────────────
  const handleRecalculate = () => {
    setManualOverrides({});
    setEditingLineId(null);
    setEditValues({});
    // Force fresh recompute now that overrides are cleared
    const lines = computeServiceLines();
    onUpdatePricing({ serviceLines: lines });
    const totalCost = lines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = lines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
    onUpdateItem({ totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });
  };

  // ── Save as template ──────────────────────────────────────────────────
  const handleSaveAsTemplate = () => {
    if (!ps.productName) return;
    pricing.addTemplate({
      name: ps.productName,
      categoryId: categories.find(c => c.name === ps.categoryName)?.id || '',  // template still uses single categoryId
      categoryName: ps.categoryName,
      productId: ps.productId,
      productName: ps.productName,
      quantity: ps.quantity,
      finalWidth: ps.finalWidth,
      finalHeight: ps.finalHeight,
      materialId: ps.materialId || undefined,
      materialName: selectedMaterial?.name,
      equipmentId: ps.equipmentId || undefined,
      equipmentName: selectedEquipment?.name,
      color: ps.colorMode,
      sides: ps.sides,
      folding: ps.foldingType || undefined,
      isFavorite: false,
    });
    setSavedAsTemplate(true);
    setTimeout(() => setSavedAsTemplate(false), 2000);
  };

  // (multi-part handlers removed — replaced by new savedParts flow)

  // Finishing options from pricing store
  const foldingOptions = finishing.filter(f => f.finishingGroupIds?.includes('fg2')).map(f => f.name);
  const drillingOptions = finishing.filter(f => f.finishingGroupIds?.includes('fg3')).map(f => f.name);

  // Grouped finishing services for dynamic finishing UI
  const groupedFinishing = useMemo(() => {
    // Filter finishing by current category if we have one
    const catId = categories.find(c => c.name === ps.categoryName)?.id;
    const relevantFinishing = catId
      ? finishing.filter(f => f.categoryIds.length === 0 || f.categoryIds.includes(catId))
      : finishing;

    const groups: Array<{ group: { id: string; name: string }; services: typeof finishing }> = [];
    const assignedIds = new Set<string>();

    for (const fg of finishingGroups) {
      const services = relevantFinishing.filter(f => f.finishingGroupIds?.includes(fg.id));
      if (services.length > 0) {
        groups.push({ group: fg, services });
        services.forEach(s => assignedIds.add(s.id));
      }
    }

    // Also add any finishing services not assigned to a group
    const ungrouped = relevantFinishing.filter(f => !assignedIds.has(f.id));
    if (ungrouped.length > 0) {
      groups.push({ group: { id: '_other', name: 'Other' }, services: ungrouped });
    }

    return groups;
  }, [finishing, finishingGroups, categories, ps.categoryName]);

  // ── Cost/Markup/Margin summary ────────────────────────────────────────
  const itemTotalCost = item.totalCost;
  const itemTotalSell = item.sellPrice;
  const itemMarkupAmt = itemTotalSell - itemTotalCost;
  const itemMarginPct = itemTotalSell > 0 ? ((itemTotalSell - itemTotalCost) / itemTotalSell) * 100 : 0;

  // ═══ RENDER MODAL ═════════════════════════════════════════════════════

  const orientA = enhancedImposition.orientationA;
  const orientB = enhancedImposition.orientationB;
  const activeOrientation = enhancedImposition.bestOrientation as string;

  // Proportional diagram sizes for imposition orientation
  const maxDiagramSize = 80;
  const sheetRatio = selectedMaterial ? selectedMaterial.sizeWidth / selectedMaterial.sizeHeight : 1;
  const diagWidth = sheetRatio >= 1 ? maxDiagramSize : Math.round(maxDiagramSize * sheetRatio);
  const diagHeight = sheetRatio >= 1 ? Math.round(maxDiagramSize / sheetRatio) : maxDiagramSize;

  // Helper: mark userInteracted on any pricing field change
  const trackInteraction = () => { if (!userInteracted) setUserInteracted(true); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">

        {/* ═══ Modal Header ═══════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{isNew ? 'Add Item' : 'Edit Item'}</h2>
            {ps.productName && (
              <button
                onClick={handleSaveAsTemplate}
                className={`p-1.5 rounded-lg transition-colors ${savedAsTemplate ? 'bg-amber-50 text-amber-500' : 'hover:bg-gray-100 text-gray-400 hover:text-amber-500'}`}
                title={savedAsTemplate ? 'Saved as Template!' : 'Save as Template'}
              >
                <Star className={`w-4 h-4 ${savedAsTemplate ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            )}
            {savedAsTemplate && <span className="text-xs text-amber-600 font-medium">Item saved as Template</span>}
            {/* Multi-Part Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none ml-4">
              <input
                type="checkbox"
                checked={isMultiPart}
                onChange={e => {
                  const checked = e.target.checked;
                  setIsMultiPart(checked);
                  if (checked) {
                    setActivePartName('Cover');
                    setPartDescription('');
                    setSavedParts([]);
                    setGlobalProduct(ps.productName || '');
                    setGlobalDescription(item.description || '');
                  }
                }}
                className="w-3.5 h-3.5 rounded border-gray-300 text-[#F890E7] focus:ring-[#F890E7]"
              />
              <span className="text-xs font-semibold text-gray-600">Multi-Part</span>
            </label>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* ═══ Modal Body ═════════════════════════════════════════════════ */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="flex gap-4">
            {/* ── Main Form Column ──────────────────────────────────────── */}
            <div className={`flex-1 space-y-4 min-w-0 ${matchingTemplates.length > 0 && !templatePanelCollapsed ? '' : ''}`}>

              {/* ── Global Item Section (Multi-Part only) ────────────── */}
              {isMultiPart && (
                <div className="bg-blue-50/60 rounded-lg px-3 py-2.5 border border-blue-100 mb-4">
                  <p className="text-[9px] font-semibold text-blue-400 uppercase tracking-widest mb-2">Global Item (Parent)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Item Product</label>
                      <input value={globalProduct} onChange={e => setGlobalProduct(e.target.value)}
                        placeholder="e.g., Catalog, Booklet..."
                        className="w-full px-2.5 py-1.5 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Item Description</label>
                      <input value={globalDescription} onChange={e => setGlobalDescription(e.target.value)}
                        placeholder="Overall item description..."
                        className="w-full px-2.5 py-1.5 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Product Search Row ────────────────────────────────── */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Product</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" value={productQuery}
                    onChange={e => { setProductQuery(e.target.value); setShowSuggestions(true); if (!e.target.value.trim()) onUpdatePricing({ productId: '', productName: '' }); }}
                    onFocus={() => productQuery && setShowSuggestions(true)}
                    placeholder="Type product name (Business Cards, Postcards, Trifold, Brochures...)"
                    className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400"
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

              {/* ── Description + Auto-describe ──────────────────────── */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={e => { setAutoDescribe(false); onUpdateItem({ description: e.target.value }); }}
                  placeholder="Item description..."
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400"
                />
                <label className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1 cursor-pointer">
                  <input type="checkbox" checked={autoDescribe} onChange={e => { setAutoDescribe(e.target.checked); if (e.target.checked) onUpdateItem({ description: buildDescription() }); }} className="w-3 h-3 rounded border-gray-300 text-[#F890E7] focus:ring-[#F890E7]" />
                  Auto-describe
                </label>
              </div>

              {/* ── Saved Parts List ──────────────────────────────────── */}
              {isMultiPart && savedParts.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Saved Parts</div>
                  {savedParts.map((part, idx) => (
                    <div key={part.id} className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#F890E7]/20 text-[#F890E7] text-[10px] font-bold flex items-center justify-center">{idx + 1}</div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{part.partName}</p>
                          {part.description && <p className="text-[10px] text-gray-400">{part.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-700">{formatCurrency(part.totalSell)}</span>
                        <button onClick={() => setSavedParts(prev => prev.filter(p => p.id !== part.id))}
                          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between text-[10px] text-gray-500 px-1">
                    <span>{savedParts.length} part{savedParts.length !== 1 ? 's' : ''} saved</span>
                    <span>Subtotal: {formatCurrency(savedParts.reduce((s, p) => s + p.totalSell, 0))}</span>
                  </div>
                </div>
              )}

              {/* ── Current Part Header ───────────────────────────────── */}
              {isMultiPart && (
                <div className="bg-[#F890E7]/8 border border-[#F890E7]/20 rounded-lg px-3 py-2.5 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-[#F890E7]/20 text-[#F890E7] text-[10px] font-bold flex items-center justify-center">
                      {savedParts.length + 1}
                    </div>
                    <input
                      value={activePartName}
                      onChange={e => setActivePartName(e.target.value)}
                      className="text-sm font-semibold bg-transparent border-0 border-b border-dashed border-[#F890E7]/40 focus:outline-none focus:border-[#F890E7] text-gray-800 pb-0.5"
                      placeholder="Part name..."
                    />
                  </div>
                  <input
                    value={partDescription}
                    onChange={e => setPartDescription(e.target.value)}
                    placeholder="Part description (optional)..."
                    className="w-full text-xs bg-transparent border-0 text-gray-500 focus:outline-none placeholder-gray-300"
                  />
                </div>
              )}

              {/* ── Quantity / Size / Sides / Color (4-col row) ────── */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Quantity</label>
                  <input type="text" value={multiQtyInput}
                    onChange={e => {
                      trackInteraction();
                      setMultiQtyInput(e.target.value);
                      const qParts = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
                      if (qParts.length > 0) onUpdatePricing({ quantity: qParts[0] });
                    }}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]" />
                  {isMultiQty && <p className="text-[10px] text-purple-500 mt-0.5">{parsedQuantities.length} quantities</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Size (L x H, in)</label>
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={e => {
                      trackInteraction();
                      setSizeInput(e.target.value);
                      const match = e.target.value.match(/^(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)$/);
                      if (match) {
                        onUpdatePricing({ finalWidth: parseFloat(match[1]), finalHeight: parseFloat(match[2]) });
                        setSizeError('');
                      } else if (e.target.value && !e.target.value.match(/^[\d.]+\s*[xX×]?\s*[\d.]*$/)) {
                        setSizeError('Use format: LxH (e.g., 3.5x2)');
                      } else {
                        setSizeError('');
                      }
                    }}
                    placeholder="e.g., 3.5x2"
                    className={`w-full px-3 py-2 text-sm bg-white border ${sizeError ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]`}
                  />
                  {sizeError && <p className="text-[9px] text-red-500 mt-0.5">{sizeError}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Sides</label>
                  <select value={materialEntries[0]?.sides || ps.sides}
                    onChange={e => {
                      trackInteraction();
                      const updated = [...materialEntries];
                      updated[0] = { ...updated[0], sides: e.target.value as 'Single' | 'Double' };
                      setMaterialEntries(updated);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Color</label>
                  <select value={materialEntries[0]?.colorMode || ps.colorMode}
                    onChange={e => {
                      trackInteraction();
                      const updated = [...materialEntries];
                      updated[0] = { ...updated[0], colorMode: e.target.value as 'Color' | 'Black' };
                      setMaterialEntries(updated);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="Color">Color</option>
                    <option value="Black">B&W</option>
                  </select>
                </div>
              </div>

              {/* ── Material / Equipment (2-col equal width) ──────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Material</label>
                  <select value={materialEntries[0]?.materialId || ps.materialId}
                    onChange={e => {
                      trackInteraction();
                      const updated = [...materialEntries];
                      updated[0] = { ...updated[0], materialId: e.target.value };
                      setMaterialEntries(updated);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="">-- Select material --</option>
                    {availableMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.size}) -- {fmt(m.pricePerM)}/M</option>)}
                  </select>
                  {/* Additional material entries */}
                  {materialEntries.length > 1 && materialEntries.slice(1).map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1 mt-1">
                      <select value={entry.materialId}
                        onChange={e => {
                          const updated = [...materialEntries];
                          updated[idx + 1] = { ...updated[idx + 1], materialId: e.target.value };
                          setMaterialEntries(updated);
                        }}
                        className="flex-1 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                        <option value="">-- Select --</option>
                        {availableMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.size})</option>)}
                      </select>
                      <button onClick={() => setMaterialEntries(prev => prev.filter((_, i) => i !== idx + 1))}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <button
                    onClick={() => setMaterialEntries(prev => [...prev, { materialId: '', sides: 'Single', colorMode: 'Color', originals: 1 }])}
                    className="text-[10px] font-semibold text-[#F890E7] hover:text-pink-600 transition-colors flex items-center gap-1 mt-1"
                  >
                    <Plus className="w-3 h-3" /> Add Material
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Equipment</label>
                  <select value={ps.equipmentId}
                    onChange={e => { trackInteraction(); onUpdatePricing({ equipmentId: e.target.value }); }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="">-- Select --</option>
                    {availableEquipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>

              {/* ═══ IMPOSITION (collapsible) ═════════════════════════ */}
              {selectedMaterial && imposition.totalUps > 0 && (
                <div className="rounded-xl border border-blue-200 overflow-hidden">
                  <button
                    onClick={() => setShowImpositionCalc(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50/60 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Imposition</span>
                      {!showImpositionCalc && (
                        <span className="text-[10px] text-gray-500 ml-2 font-normal normal-case">
                          {selectedMaterial.size} | {enhancedImposition.totalUps} ups | {enhancedImposition.sheetsNeeded.toLocaleString()} sheets | {enhancedImposition.waste.toFixed(1)}% waste
                        </span>
                      )}
                    </div>
                    {showImpositionCalc ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </button>

                  {showImpositionCalc && (
                    <div className="px-4 py-3 bg-blue-50/30">
                      <div className="flex gap-4">
                        {/* LEFT: 3x3 grid of values */}
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                            <p className="text-[10px] text-blue-600 font-medium">Parent</p>
                            <p className="text-sm font-bold text-blue-900">{selectedMaterial.size}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                            <p className="text-[10px] text-blue-600 font-medium">Run Size</p>
                            <input
                              type="text"
                              value={runSizeInput}
                              onChange={e => {
                                setRunSizeInput(e.target.value);
                                const match = e.target.value.match(/^(\d+\.?\d*)\s*[xX\u00D7]\s*(\d+\.?\d*)$/);
                                if (match) {
                                  setCustomRunWidth(parseFloat(match[1]));
                                  setCustomRunHeight(parseFloat(match[2]));
                                }
                              }}
                              placeholder="LxH"
                              className="w-full text-center text-xs font-bold bg-blue-50 border border-blue-200 rounded px-1 py-0.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-[#F890E7]"
                            />
                            <p className="text-[8px] text-gray-400 mt-0.5">Default = Parent</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 font-medium">Finish Size</p>
                            <p className="text-sm font-bold text-emerald-900">{ps.finalWidth}x{ps.finalHeight}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 font-medium">Ups</p>
                            <p className="text-sm font-bold text-emerald-900">{enhancedImposition.totalUps}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
                            <p className="text-[10px] text-amber-600 font-medium">Sheets</p>
                            <p className="text-sm font-bold text-amber-900">{enhancedImposition.sheetsNeeded.toLocaleString()}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                            <p className="text-[10px] text-gray-500 font-medium">Cuts/Sheet</p>
                            <p className="text-sm font-bold text-gray-900">{enhancedImposition.cutsPerSheet}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                            <p className="text-[10px] text-blue-600 font-medium">Bleed</p>
                            <input type="number" step="0.0625" value={impositionBleed} min={0}
                              onChange={e => setImpositionBleed(parseFloat(e.target.value) || 0)}
                              className="w-full text-center text-xs font-bold bg-blue-50 border border-blue-200 rounded px-1 py-0.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-[#F890E7]" />
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-purple-100">
                            <p className="text-[10px] text-purple-600 font-medium">Gutter</p>
                            <input type="number" step="0.0625" value={impositionGutter} min={0}
                              onChange={e => setImpositionGutter(parseFloat(e.target.value) || 0)}
                              className="w-full text-center text-xs font-bold bg-purple-50 border border-purple-200 rounded px-1 py-0.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-[#F890E7]" />
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-red-100">
                            <p className="text-[10px] text-red-500 font-medium">Waste</p>
                            <p className="text-sm font-bold text-red-700">{enhancedImposition.waste.toFixed(1)}%</p>
                          </div>
                        </div>

                        {/* RIGHT: Orientation diagrams A & B */}
                        <div className="flex flex-col gap-2 w-[200px] flex-shrink-0">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Orientation</p>
                          <div className="flex gap-3">
                            {/* Orientation A */}
                            <button
                              onClick={() => setImpositionOrientation('A')}
                              className={`flex-1 rounded-lg p-2 border-2 transition-all flex flex-col items-center gap-1 ${
                                activeOrientation === 'A' ? 'border-[#F890E7] bg-pink-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className={`text-[10px] font-bold ${activeOrientation === 'A' ? 'text-[#F890E7]' : 'text-gray-500'}`}>A</span>
                              <div className="grid gap-px bg-gray-300 p-px" style={{
                                gridTemplateColumns: `repeat(${orientA.upsAcross || 1}, 1fr)`,
                                gridTemplateRows: `repeat(${orientA.upsDown || 1}, 1fr)`,
                                width: diagWidth, height: diagHeight
                              }}>
                                {Array.from({ length: orientA.totalUps || 0 }).map((_, i) => (
                                  <div key={i} className={activeOrientation === 'A' ? 'bg-pink-100' : 'bg-gray-100'} />
                                ))}
                              </div>
                              <span className="text-[9px] text-gray-500">{orientA.upsAcross}x{orientA.upsDown} = {orientA.totalUps}</span>
                            </button>
                            {/* Orientation B */}
                            <button
                              onClick={() => setImpositionOrientation('B')}
                              className={`flex-1 rounded-lg p-2 border-2 transition-all flex flex-col items-center gap-1 ${
                                activeOrientation === 'B' ? 'border-[#F890E7] bg-pink-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className={`text-[10px] font-bold ${activeOrientation === 'B' ? 'text-[#F890E7]' : 'text-gray-500'}`}>B</span>
                              <div className="grid gap-px bg-gray-300 p-px" style={{
                                gridTemplateColumns: `repeat(${orientB.upsAcross || 1}, 1fr)`,
                                gridTemplateRows: `repeat(${orientB.upsDown || 1}, 1fr)`,
                                width: diagWidth, height: diagHeight
                              }}>
                                {Array.from({ length: orientB.totalUps || 0 }).map((_, i) => (
                                  <div key={i} className={activeOrientation === 'B' ? 'bg-pink-100' : 'bg-gray-100'} />
                                ))}
                              </div>
                              <span className="text-[9px] text-gray-500">{orientB.upsAcross}x{orientB.upsDown} = {orientB.totalUps}</span>
                            </button>
                          </div>
                          <button
                            onClick={() => setImpositionOrientation('auto')}
                            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                              impositionOrientation === 'auto'
                                ? 'bg-[#F890E7]/10 text-[#F890E7] font-semibold'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            Auto (best fit)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ SERVICES ═════════════════════════════════════════ */}
              <div className="space-y-3 pt-1">
                {/* Section label */}
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Services</span>
                </div>

                {/* ── FINISHING ─────────────────────────────────────────── */}
                <div className="space-y-1.5">
                  {/* Label row + selected pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Scissors className="w-3 h-3 text-purple-500" />
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Finishing</span>
                    </div>
                    {selectedFinishingIds.map(id => {
                      const svc = finishing.find(f => f.id === id);
                      return svc ? (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                          {svc.name}
                          <button
                            type="button"
                            onClick={() => {
                              const nextIds = selectedFinishingIds.filter(x => x !== id);
                              setSelectedFinishingIds(nextIds);
                              const sel = finishing.filter(f => nextIds.includes(f.id));
                              onUpdatePricing({
                                cuttingEnabled: sel.some(f => f.name === 'Cut'),
                                foldingType: sel.find(f => f.finishingGroupIds?.includes('fg2'))?.name || '',
                                drillingType: sel.find(f => f.finishingGroupIds?.includes('fg3'))?.name || '',
                              });
                            }}
                            className="hover:text-purple-900 ml-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* One dropdown per finishing group — side by side */}
                  {groupedFinishing.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {groupedFinishing.map(({ group, services }) => {
                        const available = services.filter(s => !selectedFinishingIds.includes(s.id));
                        return (
                          <div key={group.id} className="relative min-w-[140px] max-w-[200px] flex-1">
                            <select
                              value=""
                              onChange={e => {
                                if (!e.target.value) return;
                                trackInteraction();
                                const nextIds = [...selectedFinishingIds, e.target.value];
                                setSelectedFinishingIds(nextIds);
                                const sel = finishing.filter(f => nextIds.includes(f.id));
                                onUpdatePricing({
                                  cuttingEnabled: sel.some(f => f.name === 'Cut'),
                                  foldingType: sel.find(f => f.finishingGroupIds?.includes('fg2'))?.name || '',
                                  drillingType: sel.find(f => f.finishingGroupIds?.includes('fg3'))?.name || '',
                                });
                              }}
                              disabled={available.length === 0}
                              className="w-full pl-2 pr-7 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300 appearance-none text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-purple-300 transition-colors cursor-pointer"
                            >
                              <option value="">{group.name}</option>
                              {available.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── LABOR ─────────────────────────────────────────────── */}
                {pricing.labor.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Wrench className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Labor</span>
                      </div>
                      {selectedLaborIds.map(id => {
                        const svc = pricing.labor.find(l => l.id === id);
                        return svc ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            {svc.name}
                            <button type="button" onClick={() => setSelectedLaborIds(prev => prev.filter(x => x !== id))} className="hover:text-blue-900 ml-0.5">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>

                    {/* One dropdown per labor group */}
                    {pricing.laborGroups.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pricing.laborGroups.map(lg => {
                          const available = pricing.labor.filter(l => l.laborGroupIds?.includes(lg.id) && !selectedLaborIds.includes(l.id));
                          return (
                            <div key={lg.id} className="relative min-w-[140px] max-w-[200px] flex-1">
                              <select
                                value=""
                                onChange={e => { if (e.target.value) { trackInteraction(); setSelectedLaborIds(prev => [...prev, e.target.value]); } }}
                                disabled={available.length === 0}
                                className="w-full pl-2 pr-7 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 appearance-none text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-300 transition-colors cursor-pointer"
                              >
                                <option value="">{lg.name}</option>
                                {available.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── BROKERED ──────────────────────────────────────────── */}
                {pricing.brokered.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Package className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Brokered</span>
                      </div>
                      {selectedBrokeredIds.map(id => {
                        const svc = pricing.brokered.find(b => b.id === id);
                        return svc ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            {svc.name}
                            <button type="button" onClick={() => setSelectedBrokeredIds(prev => prev.filter(x => x !== id))} className="hover:text-amber-900 ml-0.5">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>

                    {/* One dropdown per brokered group */}
                    {pricing.brokeredGroups.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pricing.brokeredGroups.map(bg => {
                          const available = pricing.brokered.filter(b => b.brokeredGroupIds?.includes(bg.id) && !selectedBrokeredIds.includes(b.id));
                          return (
                            <div key={bg.id} className="relative min-w-[140px] max-w-[200px] flex-1">
                              <select
                                value=""
                                onChange={e => { if (e.target.value) { trackInteraction(); setSelectedBrokeredIds(prev => [...prev, e.target.value]); } }}
                                disabled={available.length === 0}
                                className="w-full pl-2 pr-7 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300 appearance-none text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-300 transition-colors cursor-pointer"
                              >
                                <option value="">{bg.name}</option>
                                {available.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Multi-Quantity Price Table ────────────────────────── */}
              {isMultiQty && multiQtyPricing.length > 0 && (
                <div className="bg-purple-50/50 rounded-xl p-4">
                  <h4 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-purple-500" /> Multi-Quantity Pricing
                  </h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-200/60">
                        <th className="text-left py-1.5 px-3 font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                        <th className="text-right py-1.5 px-3 font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                        <th className="text-right py-1.5 px-3 font-semibold text-gray-500 uppercase tracking-wide">Sell Price</th>
                        <th className="text-right py-1.5 px-3 font-semibold text-gray-500 uppercase tracking-wide">Per Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100/60">
                      {multiQtyPricing.map((row, idx) => (
                        <tr key={idx} className={idx === 0 ? 'bg-purple-100/30 font-semibold' : ''}>
                          <td className="py-1.5 px-3 text-gray-900">{row.qty.toLocaleString()}{idx === 0 && <span className="text-[10px] text-purple-500 ml-1">(primary)</span>}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-gray-600">{fmt(row.cost)}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-gray-900">{fmt(row.sell)}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-gray-500">{row.qty > 0 ? fmt(row.sell / row.qty) : '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ═══ PRICE BREAKDOWN ══════════════════════════════════ */}
              {ps.serviceLines.length > 0 && (
                <div className="rounded-xl border border-emerald-200 overflow-hidden">
                  {/* Header — click anywhere on the section to open edit dialog */}
                  <button
                    type="button"
                    onClick={() => setShowBreakdownDialog(true)}
                    className="w-full text-left px-4 py-2.5 flex items-center justify-between bg-emerald-50/60 hover:bg-emerald-50 transition-colors border-b border-emerald-200/60"
                  >
                    <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Price Breakdown
                      {Object.keys(manualOverrides).length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px]">
                          {Object.keys(manualOverrides).length} override{Object.keys(manualOverrides).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-[#F890E7] font-medium flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit Pricing
                    </span>
                  </button>

                  {/* Read-only summary — click to open dialog */}
                  <div
                    className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setShowBreakdownDialog(true)}
                  >
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-gray-50">
                        {ps.serviceLines.map(line => (
                          <tr key={line.id}>
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-1.5">
                                {line.service === 'Material' && <Package className="w-3 h-3 text-amber-400" />}
                                {line.service === 'Printing' && <Printer className="w-3 h-3 text-blue-400" />}
                                {line.service === 'Setup' && <Settings2 className="w-3 h-3 text-gray-400" />}
                                {line.service === 'Cutting' && <Scissors className="w-3 h-3 text-purple-400" />}
                                {line.service === 'Folding' && <FoldVertical className="w-3 h-3 text-emerald-400" />}
                                {line.service === 'Drilling' && <CircleDot className="w-3 h-3 text-orange-400" />}
                                <span className="text-gray-700 font-medium">{line.service}</span>
                                {manualOverrides[line.id] && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Manually overridden" />}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-gray-400 text-[10px] truncate max-w-[160px]">{line.description}</td>
                            <td className="py-2 px-3 text-right font-mono text-gray-500">{fmt(line.totalCost)}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className={line.markupPercent > 0 ? 'text-emerald-600' : 'text-gray-400'}>{fmtPct(line.markupPercent)}</span>
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-semibold text-gray-900">{fmt(line.sellPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-100 bg-gray-50">
                          <td className="py-2 px-4 text-[10px] font-semibold text-gray-500 uppercase" colSpan={2}>Total</td>
                          <td className="py-2 px-3 text-right font-mono text-gray-600 text-[11px]">{fmt(itemTotalCost)}</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600 text-[11px]">
                            {itemTotalCost > 0 ? fmtPct(((itemTotalSell - itemTotalCost) / itemTotalCost) * 100) : '—'}
                          </td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-gray-900">{fmt(itemTotalSell)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    <div className="px-4 py-1.5 flex items-center justify-between bg-gray-50 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">Margin: <span className={`font-semibold ${itemMarginPct >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{fmtPct(itemMarginPct)}</span></span>
                      <span className="text-[10px] text-gray-400">Click anywhere to edit →</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ PRICE BREAKDOWN EDIT DIALOG ══════════════════════ */}
              {showBreakdownDialog && (
                <PriceBreakdownDialog
                  lines={ps.serviceLines}
                  onSave={(updatedLines) => {
                    onUpdatePricing({ serviceLines: updatedLines });
                    const totalCost = updatedLines.reduce((s, l) => s + l.totalCost, 0);
                    const totalSell = updatedLines.reduce((s, l) => s + l.sellPrice, 0);
                    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
                    onUpdateItem({ totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });
                    // Mark all lines with changes as overridden
                    const newOverrides: Record<string, boolean> = {};
                    updatedLines.forEach((l, i) => {
                      const orig = ps.serviceLines[i];
                      if (orig && (l.totalCost !== orig.totalCost || l.markupPercent !== orig.markupPercent)) {
                        newOverrides[l.id] = true;
                      }
                    });
                    setManualOverrides(prev => ({ ...prev, ...newOverrides }));
                    setShowBreakdownDialog(false);
                  }}
                  onRecalculate={() => {
                    handleRecalculate();
                    setShowBreakdownDialog(false);
                  }}
                  onClose={() => setShowBreakdownDialog(false)}
                />
              )}

              {/* ── Notes ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer Notes</label>
                  <textarea
                    value={item.notes || ''}
                    onChange={e => onUpdateItem({ notes: e.target.value })}
                    placeholder="Notes visible to the customer..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Internal Notes</label>
                  <textarea
                    value={(item as any).internalNotes || ''}
                    onChange={e => onUpdateItem({ internalNotes: e.target.value } as any)}
                    placeholder="Internal notes (not shown to customer)..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ── Right panel: Templates ──────────────────────────────── */}
            {matchingTemplates.length > 0 && (
              templatePanelCollapsed ? (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setTemplatePanelCollapsed(false)}
                    className="p-2 rounded-lg border border-gray-200 hover:border-[#F890E7] hover:bg-pink-50/50 transition-all"
                    title="Show templates"
                  >
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </button>
                </div>
              ) : (
                <div className="w-52 flex-shrink-0 transition-all duration-300">
                  <div className="sticky top-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Templates</h4>
                      <button onClick={() => setTemplatePanelCollapsed(true)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors" title="Collapse">
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                      {matchingTemplates.slice(0, 12).map(t => (
                        <button key={t.id} onClick={() => onApplyTemplate(t.id)}
                          className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:border-[#F890E7] hover:bg-pink-50/50 transition-all text-xs group">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 group-hover:text-[#F890E7] truncate">{t.name}</span>
                            {t.isFavorite && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {t.categoryName} · {t.quantity.toLocaleString()} pcs
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ═══ Modal Footer ═══════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {!isMultiPart && (
              <Button variant="danger" size="sm" onClick={onRemove} icon={<Trash2 className="w-3.5 h-3.5" />}>Remove Item</Button>
            )}
            {isMultiPart && savedParts.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => {
                setActivePartName(`Part ${savedParts.length + 2}`);
                setPartDescription('');
                onUpdatePricing(DEFAULT_PRICING_STATE());
                setProductQuery('');
                setMultiQtyInput('1000');
                setMaterialEntries([{ materialId: '', sides: 'Double', colorMode: 'Color', originals: 1 }]);
                setSelectedFinishingIds([]);
                setSizeInput('');
              }}>
                Discard Part
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isMultiPart ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => {
                  const part: SavedPart = {
                    id: nanoid(),
                    partName: activePartName,
                    description: partDescription,
                    totalCost: item.totalCost,
                    totalSell: item.sellPrice,
                    serviceLines: [...ps.serviceLines],
                  };
                  setSavedParts(prev => [...prev, part]);
                  const nextName = savedParts.length === 0 ? 'Interior' : `Part ${savedParts.length + 2}`;
                  setActivePartName(nextName);
                  setPartDescription('');
                  onUpdatePricing(DEFAULT_PRICING_STATE());
                  setProductQuery('');
                  setMultiQtyInput('1000');
                  setMaterialEntries([{ materialId: '', sides: 'Double', colorMode: 'Color', originals: 1 }]);
                  setSelectedFinishingIds([]);
                  setSizeInput('');
                }} icon={<Plus className="w-3.5 h-3.5" />}>
                  Save Part
                </Button>
                <Button variant="success" onClick={() => {
                  const allParts = [...savedParts];
                  if (item.totalCost > 0 || item.sellPrice > 0) {
                    allParts.push({
                      id: nanoid(),
                      partName: activePartName,
                      description: partDescription,
                      totalCost: item.totalCost,
                      totalSell: item.sellPrice,
                      serviceLines: ps.serviceLines,
                    });
                  }
                  const totalCost = allParts.reduce((s, p) => s + p.totalCost, 0);
                  const totalSell = allParts.reduce((s, p) => s + p.totalSell, 0);
                  const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
                  const desc = globalDescription || globalProduct || item.description;
                  onUpdateItem({ description: desc, totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });
                  onClose();
                }}>
                  Save Item ({savedParts.length + (item.sellPrice > 0 ? 1 : 0)} part{(savedParts.length + (item.sellPrice > 0 ? 1 : 0)) !== 1 ? 's' : ''})
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={onClose}>Done</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// PRICE BREAKDOWN DIALOG — fully isolated from the parent, owns its own state
// ═════════════════════════════════════════════════════════════════════════════

interface PriceBreakdownDialogProps {
  lines: PricingServiceLine[];
  onSave: (updatedLines: PricingServiceLine[]) => void;
  onRecalculate: () => void;
  onClose: () => void;
}

// Format decimal hours → "1h 30m" or "45m"
const fmtHours = (h: number) => {
  if (h <= 0) return '—';
  const totalMin = Math.round(h * 60);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hrs === 0) return `${mins}m`;
  return mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
};

// Parse "1h 30m", "45m", "1.5" (decimal hours) → decimal hours
const parseHoursInput = (s: string): number | null => {
  const trimmed = s.trim();
  // "1h 30m" or "1h30m"
  const hm = trimmed.match(/^(\d+)h\s*(\d+)m?$/i);
  if (hm) return parseInt(hm[1]) + parseInt(hm[2]) / 60;
  // "45m"
  const m = trimmed.match(/^(\d+)m?$/i);
  if (m) return parseInt(m[1]) / 60;
  // decimal hours "1.5"
  const n = parseFloat(trimmed);
  if (!isNaN(n) && n >= 0) return n;
  return null;
};

const isTimeBased = (line: PricingServiceLine) => line.hourlyCost != null && line.hoursActual != null;
const isQtyBased  = (line: PricingServiceLine) => !isTimeBased(line) && line.quantity != null && line.unit !== 'flat';

const SERVICE_ACCENT: Record<string, { icon: React.ReactNode; dot: string }> = {
  Material: { icon: <Package  className="w-3.5 h-3.5 text-amber-500"  />, dot: 'bg-amber-400'  },
  Printing: { icon: <Printer  className="w-3.5 h-3.5 text-blue-500"   />, dot: 'bg-blue-400'   },
  Setup:    { icon: <Settings2 className="w-3.5 h-3.5 text-gray-400"  />, dot: 'bg-gray-300'   },
  Cutting:  { icon: <Scissors  className="w-3.5 h-3.5 text-purple-500"/>, dot: 'bg-purple-400' },
  Folding:  { icon: <FoldVertical className="w-3.5 h-3.5 text-emerald-500" />, dot: 'bg-emerald-400' },
  Drilling: { icon: <CircleDot className="w-3.5 h-3.5 text-orange-500"/>, dot: 'bg-orange-400' },
};

const PriceBreakdownDialog: React.FC<PriceBreakdownDialogProps> = ({ lines, onSave, onRecalculate, onClose }) => {
  const [localLines, setLocalLines] = useState<PricingServiceLine[]>(() =>
    lines.map(l => ({ ...l }))
  );
  // Per-row time input buffer (what the user is typing before parse)
  const [timeInputs, setTimeInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    lines.forEach(l => { if (l.hoursCharge != null) init[l.id] = fmtHours(l.hoursCharge); });
    return init;
  });
  const [timeErrors, setTimeErrors] = useState<Record<string, boolean>>({});

  const updateField = (id: string, field: 'totalCost' | 'markupPercent' | 'sellPrice', raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    setLocalLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (field === 'totalCost') {
        const mk = val > 0 ? ((l.sellPrice - val) / val) * 100 : l.markupPercent;
        return { ...l, totalCost: val, markupPercent: parseFloat(mk.toFixed(2)) };
      }
      if (field === 'markupPercent') {
        return { ...l, markupPercent: val, sellPrice: parseFloat((l.totalCost * (1 + val / 100)).toFixed(4)) };
      }
      if (field === 'sellPrice') {
        const mk = l.totalCost > 0 ? ((val - l.totalCost) / l.totalCost) * 100 : 0;
        return { ...l, sellPrice: val, markupPercent: parseFloat(mk.toFixed(2)) };
      }
      return l;
    }));
  };

  const commitTimeInput = (id: string) => {
    const raw = timeInputs[id] ?? '';
    const h = parseHoursInput(raw);
    if (h === null) { setTimeErrors(e => ({ ...e, [id]: true })); return; }
    setTimeErrors(e => ({ ...e, [id]: false }));
    setLocalLines(prev => prev.map(l => {
      if (l.id !== id || l.hourlyCost == null) return l;
      const newCost = h * l.hourlyCost;
      const newSell = newCost * (1 + l.markupPercent / 100);
      return { ...l, hoursCharge: h, totalCost: parseFloat(newCost.toFixed(4)), sellPrice: parseFloat(newSell.toFixed(4)) };
    }));
    setTimeInputs(t => ({ ...t, [id]: fmtHours(h) }));
  };

  const totalCost = localLines.reduce((s, l) => s + l.totalCost, 0);
  const totalSell = localLines.reduce((s, l) => s + l.sellPrice, 0);
  const totalMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
  const marginPct   = totalSell > 0 ? ((totalSell - totalCost) / totalSell) * 100 : 0;

  const inp = (extra = '') =>
    `w-full px-2 py-1.5 text-xs text-right font-mono bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] focus:border-transparent transition-colors ${extra}`;

  const thCls = 'py-1.5 px-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wide text-right';
  const tdCls = 'py-2 px-2';
  const dimCls = 'text-gray-300'; // read-only display cells

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Edit Price Breakdown
            <span className="text-[10px] font-normal text-gray-400 ml-1">— click any field to edit</span>
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-xs border-collapse min-w-[860px]">

            {/* Column group headers */}
            <colgroup>
              <col style={{ width: '13%' }} /> {/* Service */}
              <col style={{ width: '18%' }} /> {/* Description */}
              {/* TIME group */}
              <col style={{ width: '6%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              {/* PRICING group */}
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>

            <thead>
              {/* Group row */}
              <tr>
                <th className="px-3 pb-0 pt-3" colSpan={2} />
                <th
                  className="px-2 pb-0 pt-3 text-center text-[9px] font-bold uppercase tracking-widest bg-sky-50 text-sky-600 border-l border-sky-200"
                  colSpan={4}
                >
                  Time
                </th>
                <th
                  className="px-2 pb-0 pt-3 text-center text-[9px] font-bold uppercase tracking-widest bg-violet-50 text-violet-600 border-l border-violet-200"
                  colSpan={5}
                >
                  Pricing
                </th>
              </tr>
              {/* Sub-header row */}
              <tr className="border-b border-gray-200">
                <th className={`${thCls} text-left pl-4`}>Service</th>
                <th className={`${thCls} text-left`}>Description</th>
                {/* TIME cols */}
                <th className={`${thCls} bg-sky-50 border-l border-sky-200`}>Rate/hr</th>
                <th className={`${thCls} bg-sky-50`}>Calc. Time</th>
                <th className={`${thCls} bg-sky-50`}>Charge Time</th>
                <th className={`${thCls} bg-sky-50`}>Time Cost</th>
                {/* PRICING cols */}
                <th className={`${thCls} bg-violet-50 border-l border-violet-200`}>Qty</th>
                <th className={`${thCls} bg-violet-50`}>Unit Cost</th>
                <th className={`${thCls} bg-violet-50`}>Cost $</th>
                <th className={`${thCls} bg-violet-50`}>Markup %</th>
                <th className={`${thCls} bg-violet-50 pr-4`}>Sell Price</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {localLines.map(line => {
                const accent = SERVICE_ACCENT[line.service] ?? { icon: <DollarSign className="w-3.5 h-3.5 text-gray-400" />, dot: 'bg-gray-300' };
                const timeBased = isTimeBased(line);
                const qtyBased  = isQtyBased(line);
                const timeErr   = timeErrors[line.id];

                return (
                  <tr key={line.id} className="hover:bg-gray-50/60 transition-colors">

                    {/* Service name */}
                    <td className={`${tdCls} pl-4`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${accent.dot}`} />
                        <span className="font-semibold text-gray-800">{line.service}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className={`${tdCls} max-w-0`}>
                      <span className="text-gray-400 leading-snug block truncate pr-2">{line.description}</span>
                    </td>

                    {/* ── TIME group ── */}
                    {/* Rate/hr */}
                    <td className={`${tdCls} bg-sky-50/40 border-l border-sky-100 text-right font-mono`}>
                      {timeBased
                        ? <span className="text-sky-700 font-medium">{formatCurrency(line.hourlyCost!)}/hr</span>
                        : <span className={dimCls}>—</span>
                      }
                    </td>
                    {/* Calc Time (read-only) */}
                    <td className={`${tdCls} bg-sky-50/40 text-right font-mono`}>
                      {timeBased
                        ? <span className="text-gray-500">{fmtHours(line.hoursActual!)}</span>
                        : <span className={dimCls}>—</span>
                      }
                    </td>
                    {/* Charge Time (editable) */}
                    <td className={`${tdCls} bg-sky-50/40`}>
                      {timeBased ? (
                        <input
                          type="text"
                          value={timeInputs[line.id] ?? fmtHours(line.hoursCharge ?? line.hoursActual ?? 0)}
                          onChange={e => setTimeInputs(t => ({ ...t, [line.id]: e.target.value }))}
                          onBlur={() => commitTimeInput(line.id)}
                          onKeyDown={e => { if (e.key === 'Enter') commitTimeInput(line.id); }}
                          placeholder="e.g. 45m"
                          className={`${inp(timeErr ? 'border-red-400 ring-red-300' : 'border-sky-300')} text-sky-800`}
                          title="Enter time: 45m · 1h · 1h 30m"
                        />
                      ) : (
                        <span className={dimCls + ' block text-right pr-2'}>—</span>
                      )}
                    </td>
                    {/* Time Cost */}
                    <td className={`${tdCls} bg-sky-50/40 text-right font-mono`}>
                      {timeBased
                        ? <span className="text-sky-800 font-medium">{formatCurrency(line.totalCost)}</span>
                        : <span className={dimCls}>—</span>
                      }
                    </td>

                    {/* ── PRICING group ── */}
                    {/* Qty */}
                    <td className={`${tdCls} bg-violet-50/30 border-l border-violet-100 text-right font-mono`}>
                      {qtyBased && line.quantity != null
                        ? <span className="text-gray-600">{line.quantity.toLocaleString()}<span className="text-[9px] text-gray-400 ml-0.5">{line.unit}</span></span>
                        : <span className={dimCls}>—</span>
                      }
                    </td>
                    {/* Unit Cost */}
                    <td className={`${tdCls} bg-violet-50/30 text-right font-mono`}>
                      {(qtyBased || line.service === 'Setup') && line.unitCost > 0
                        ? <span className="text-gray-600">{formatCurrency(line.unitCost)}</span>
                        : <span className={dimCls}>—</span>
                      }
                    </td>
                    {/* Cost (editable) */}
                    <td className={`${tdCls} bg-violet-50/30`}>
                      <input
                        type="number" step="0.01" min="0"
                        value={line.totalCost}
                        onChange={e => updateField(line.id, 'totalCost', e.target.value)}
                        className={inp('text-gray-700')}
                      />
                    </td>
                    {/* Markup % (editable) */}
                    <td className={`${tdCls} bg-violet-50/30`}>
                      <div className="relative">
                        <input
                          type="number" step="0.1"
                          value={line.markupPercent}
                          onChange={e => updateField(line.id, 'markupPercent', e.target.value)}
                          className={`${inp()} pr-5 ${line.markupPercent > 0 ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">%</span>
                      </div>
                    </td>
                    {/* Sell Price (editable) */}
                    <td className={`${tdCls} bg-violet-50/30 pr-4`}>
                      <input
                        type="number" step="0.01" min="0"
                        value={line.sellPrice}
                        onChange={e => updateField(line.id, 'sellPrice', e.target.value)}
                        className={inp('font-bold text-gray-900')}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals row */}
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="py-2.5 pl-4 text-[10px] text-gray-600 uppercase tracking-wide" colSpan={2}>Total</td>
                {/* TIME cols — sum of time costs */}
                <td className="py-2.5 px-2 bg-sky-50/60 border-l border-sky-100" colSpan={2} />
                <td className="py-2.5 px-2 bg-sky-50/60 text-right font-mono text-[10px] text-sky-600">
                  {fmtHours(localLines.reduce((s, l) => s + (l.hoursCharge ?? l.hoursActual ?? 0), 0))}
                </td>
                <td className="py-2.5 px-2 bg-sky-50/60 text-right font-mono text-sky-800">
                  {formatCurrency(localLines.filter(isTimeBased).reduce((s, l) => s + l.totalCost, 0))}
                </td>
                {/* PRICING cols */}
                <td className="py-2.5 px-2 bg-violet-50/60 border-l border-violet-100" colSpan={2} />
                <td className="py-2.5 px-2 bg-violet-50/60 text-right font-mono text-gray-700">
                  {formatCurrency(totalCost)}
                </td>
                <td className="py-2.5 px-2 bg-violet-50/60 text-right font-mono">
                  <span className={totalMarkup > 0 ? 'text-emerald-700 font-bold' : 'text-gray-400'}>
                    {totalMarkup.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 px-2 pr-4 bg-violet-50/60 text-right font-mono font-bold text-gray-900 text-sm">
                  {formatCurrency(totalSell)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Summary bar ── */}
        <div className="px-6 py-2.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <span className="text-gray-500">
              Cost: <span className="font-semibold text-gray-800">{formatCurrency(totalCost)}</span>
            </span>
            <span className="text-gray-500">
              Profit: <span className="font-semibold text-emerald-700">{formatCurrency(totalSell - totalCost)}</span>
            </span>
            <span className="text-gray-500">
              Margin: <span className={`font-bold ${marginPct >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{marginPct.toFixed(1)}%</span>
            </span>
          </div>
          <span className="text-[10px] text-gray-400 hidden md:block">Charge Time column accepts: <code className="bg-gray-100 px-1 rounded">45m · 1h · 1h 30m</code></span>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onRecalculate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#F890E7] hover:bg-pink-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset to calculated values
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="success" onClick={() => onSave(localLines)}>
              Apply Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
