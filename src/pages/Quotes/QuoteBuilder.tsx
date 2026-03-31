import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, Sparkles, ChevronDown, ChevronRight, Calculator, Copy,
  ArrowRight, Search, X, Scissors, FoldVertical, CircleDot, Printer,
  Package, DollarSign, Grid3X3, Edit3, Check, Star, Settings2,
  ChevronUp, Percent, Hash,
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
const slId = () => `sl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

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
  sheetsPerCutStack: number;
  serviceLines: PricingServiceLine[];
}

const DEFAULT_PRICING_STATE = (): LineItemPricingState => ({
  productId: '', productName: '', categoryName: '',
  quantity: 1000, finalWidth: 0, finalHeight: 0,
  materialId: '', equipmentId: '',
  colorMode: 'Color', sides: 'Double',
  foldingType: '', drillingType: '',
  cuttingEnabled: true, sheetsPerCutStack: 500,
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
  const { customers, contacts, addQuote, nextQuoteNumber, currentUser, users } = useStore();
  const pricing = usePricingStore();

  // ── Generate quote number immediately on mount ───────────────────────
  const [quoteNumber] = useState(() => nextQuoteNumber());

  // ── Quote-level state ─────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '', customerId: '', contactId: '', status: 'pending' as Quote['status'],
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
        sheetsPerCutStack: 500,
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
          <Button variant="secondary" onClick={() => handleSave()} loading={saving}>Save Draft</Button>
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

                {/* Line 3: Ship To, Status, Valid Until, Due Date */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Ship To</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 truncate flex-1">
                        {form.shipToAddress || 'Same as billing'}
                      </span>
                      <button
                        onClick={() => setShowShipToModal(true)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
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
              <Plus className="w-4 h-4" /> Add Line Item
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
              <Button variant="secondary" className="w-full justify-center" onClick={() => handleSave()} loading={saving}>Save as Quote</Button>
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
  const { categories, products, equipment, finishing, materials,
    searchProducts, getEquipmentForCategory, calculateImposition, lookupClickPrice } = pricing;

  // ── Local UI state ────────────────────────────────────────────────────
  const [productQuery, setProductQuery] = useState(ps.productName || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PricingServiceLine>>({});
  const [savedAsTemplate, setSavedAsTemplate] = useState(false);
  const [multiQtyInput, setMultiQtyInput] = useState(String(ps.quantity || 1000));

  // Sync product query when pricing state changes externally (e.g. template load)
  useEffect(() => { setProductQuery(ps.productName || ''); }, [ps.productName]);
  useEffect(() => { setMultiQtyInput(String(ps.quantity || 1000)); }, [ps.quantity]);

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
      const cutSvc = finishing.find(f => f.service === 'Cut');
      if (cutSvc) {
        const totalStacks = Math.ceil(imposition.sheetsNeeded / ps.sheetsPerCutStack);
        const totalCuts = imposition.cutsPerSheet * totalStacks;
        const hours = totalCuts / cutSvc.outputPerHour;
        const totalCost = hours * cutSvc.hourlyCost;
        const markup = cutSvc.timeCostMarkup;
        lines.push({
          id: slId(), service: 'Cutting',
          description: `${totalCuts} cuts (${imposition.cutsPerSheet}/sheet x ${totalStacks} stacks) — ${(hours * 60).toFixed(0)} min`,
          quantity: totalCuts, unit: 'cuts', unitCost: cutSvc.hourlyCost / cutSvc.outputPerHour,
          totalCost, markupPercent: markup, sellPrice: totalCost * (1 + markup / 100), editable: true,
        });
      }
    }

    // FOLDING
    if (ps.foldingType) {
      const fSvc = finishing.find(f => f.service === 'Fold' && f.subservice?.toLowerCase().replace('-', '') === ps.foldingType.toLowerCase().replace('-', ''));
      if (fSvc) {
        const hours = ps.quantity / fSvc.outputPerHour;
        const totalCost = hours * fSvc.hourlyCost;
        lines.push({
          id: slId(), service: 'Folding',
          description: `${ps.foldingType} — ${ps.quantity} pcs @ ${fSvc.outputPerHour}/hr`,
          quantity: ps.quantity, unit: 'pcs', unitCost: fSvc.hourlyCost / fSvc.outputPerHour,
          totalCost, markupPercent: fSvc.timeCostMarkup, sellPrice: totalCost * (1 + fSvc.timeCostMarkup / 100), editable: true,
        });
      }
    }

    // DRILLING
    if (ps.drillingType) {
      const dSvc = finishing.find(f => f.service === 'Drill' && f.subservice === ps.drillingType);
      if (dSvc) {
        const hours = ps.quantity / dSvc.outputPerHour;
        const totalCost = hours * dSvc.hourlyCost;
        lines.push({
          id: slId(), service: 'Drilling',
          description: `${ps.drillingType} — ${ps.quantity} pcs @ ${dSvc.outputPerHour}/hr`,
          quantity: ps.quantity, unit: 'pcs', unitCost: dSvc.hourlyCost / dSvc.outputPerHour,
          totalCost, markupPercent: dSvc.timeCostMarkup, sellPrice: totalCost * (1 + dSvc.timeCostMarkup / 100), editable: true,
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

    // Map to QuoteLineItem fields
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
    const cat = categories.find(c => c.id === product.categoryId);

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
      sheetsPerCutStack: 500,
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
      return { ...l, totalCost: cost, markupPercent: markup, sellPrice: cost * (1 + markup / 100) };
    });
    onUpdatePricing({ serviceLines: updatedLines });

    const totalCost = updatedLines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = updatedLines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
    onUpdateItem({ totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });

    setEditingLineId(null);
    setEditValues({});
  };

  // ── Save as template ──────────────────────────────────────────────────
  const handleSaveAsTemplate = () => {
    if (!ps.productName) return;
    pricing.addTemplate({
      name: ps.productName,
      categoryId: categories.find(c => c.name === ps.categoryName)?.id || '',
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

  // Finishing options from pricing store
  const foldingOptions = finishing.filter(f => f.service === 'Fold').map(f => f.subservice || '');
  const drillingOptions = finishing.filter(f => f.service === 'Drill').map(f => f.subservice || '');

  // ── Cost/Markup/Margin summary ────────────────────────────────────────
  const itemTotalCost = item.totalCost;
  const itemTotalSell = item.sellPrice;
  const itemMarkupAmt = itemTotalSell - itemTotalCost;
  const itemMarginPct = itemTotalSell > 0 ? ((itemTotalSell - itemTotalCost) / itemTotalSell) * 100 : 0;

  // ═══ RENDER MODAL ═════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{isNew ? 'Add Product' : 'Edit Product'}</h2>
            {ps.productName && (
              <button
                onClick={handleSaveAsTemplate}
                className={`p-1.5 rounded-lg transition-colors ${savedAsTemplate ? 'bg-amber-50 text-amber-500' : 'hover:bg-gray-100 text-gray-400 hover:text-amber-500'}`}
                title={savedAsTemplate ? 'Saved as Template!' : 'Save as Template'}
              >
                <Star className={`w-4 h-4 ${savedAsTemplate ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            )}
            {savedAsTemplate && <span className="text-xs text-amber-600 font-medium">Product saved as Template</span>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="flex gap-6">
            {/* Main pricing form */}
            <div className="flex-1 space-y-4 min-w-0">
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
                        const cat = categories.find(c => c.id === p.categoryId);
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quantity</label>
                  <input type="text" value={multiQtyInput}
                    onChange={e => {
                      setMultiQtyInput(e.target.value);
                      const parts = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
                      if (parts.length > 0) onUpdatePricing({ quantity: parts[0] });
                    }}
                    placeholder="e.g. 250, 500, 1000"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Separate with commas for multiple quantities</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Width (in)</label>
                  <input type="number" step="0.125" value={ps.finalWidth} min={0}
                    onChange={e => onUpdatePricing({ finalWidth: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Height (in)</label>
                  <input type="number" step="0.125" value={ps.finalHeight} min={0}
                    onChange={e => onUpdatePricing({ finalHeight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Color</label>
                  <select value={ps.colorMode} onChange={e => onUpdatePricing({ colorMode: e.target.value as 'Color' | 'Black' })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="Color">Color</option>
                    <option value="Black">Black & White</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sides</label>
                  <select value={ps.sides} onChange={e => onUpdatePricing({ sides: e.target.value as 'Single' | 'Double' })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="Single">Single Sided</option>
                    <option value="Double">Double Sided</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Equipment</label>
                  <select value={ps.equipmentId} onChange={e => onUpdatePricing({ equipmentId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="">-- Select --</option>
                    {availableEquipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Material</label>
                  <select value={ps.materialId} onChange={e => onUpdatePricing({ materialId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="">-- Select material --</option>
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
                    <input type="number" value={ps.sheetsPerCutStack} min={1} placeholder="Sheets/stack"
                      onChange={e => onUpdatePricing({ sheetsPerCutStack: parseInt(e.target.value) || 1 })}
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

              {/* ── Multi-Quantity Price Table ────────────────────────── */}
              {isMultiQty && multiQtyPricing.length > 0 && (
                <div className="bg-purple-50/50 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
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

                  {/* ── Cost / Markup / Margin Summary (item 33) ──────── */}
                  <div className="px-4 py-3 border-t border-gray-200/60 bg-white">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Total Cost</p>
                        <p className="text-sm font-bold text-gray-700">{fmt(itemTotalCost)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Total Markup</p>
                        <p className="text-sm font-bold text-blue-700">{fmt(itemMarkupAmt)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Margin</p>
                        <p className={`text-sm font-bold ${itemMarginPct >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {fmtPct(itemMarginPct)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                      <span className="text-sm font-bold text-blue-700">Sell Price: {fmt(itemTotalSell)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <Input label="Line Item Notes" value={item.notes || ''} onChange={e => onUpdateItem({ notes: e.target.value })} placeholder="Notes for this item..." />
            </div>

            {/* ── Right panel: Matching Templates ──────────────────────── */}
            {matchingTemplates.length > 0 && (
              <div className="w-52 flex-shrink-0">
                <div className="sticky top-0">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Matching Templates</h4>
                  <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                    {matchingTemplates.slice(0, 12).map(t => (
                      <button key={t.id} onClick={() => onApplyTemplate(t.id)}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-xs group">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 group-hover:text-blue-700 truncate">{t.name}</span>
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
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <Button variant="danger" size="sm" onClick={onRemove} icon={<Trash2 className="w-3.5 h-3.5" />}>Remove Item</Button>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};
