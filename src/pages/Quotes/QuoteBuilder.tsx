import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Calculator, Copy,
  ArrowRight, Search, X, DollarSign, Edit3,
  ChevronUp, Percent, Layers,
} from 'lucide-react';
import { useStore } from '../../store';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Input, Textarea, Card, Badge, Modal, ConfirmDialog } from '../../components/ui';
import type { QuoteLineItem, Quote } from '../../types';
import { formatCurrency } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';
import {
  ProductEditModal,
  LineItemPricingState,
  DEFAULT_PRICING_STATE,
} from '../../components/pricing/ItemEditModal';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = (n: number) => formatCurrency(n);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

/** Returns a date string N days from now in YYYY-MM-DD format */
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

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
  const { id: editId } = useParams<{ id: string }>();
  const { customers, contacts, quotes, orders, addQuote, updateQuote, nextQuoteNumber, currentUser, users, addCustomer, addContact } = useStore();
  const pricing = usePricingStore();
  const initialCustomerId = searchParams.get('customerId') || '';
  const initialContactId = searchParams.get('contactId') || '';
  const cloneId = searchParams.get('cloneId');
  const cloneSource = searchParams.get('source'); // 'order' or undefined

  // ── Determine mode ──────────────────────────────────────────────────────
  // editId is present when route is /quotes/:id/edit → load existing quote
  const existingQuote = editId ? quotes.find(q => q.id === editId) : null;
  const isEditMode = !!existingQuote;
  const sourceClone = !isEditMode && cloneId
    ? (cloneSource === 'order' ? orders.find(o => o.id === cloneId) : quotes.find(q => q.id === cloneId))
    : null;

  // ── Use existing quote number when editing, else generate new ──────────
  const [quoteNumber] = useState(() => isEditMode ? existingQuote!.number : nextQuoteNumber());

  // ── Seed from existing quote (edit) or clone source or defaults ────────
  const seed = existingQuote || (sourceClone as any) || null;

  const [form, setForm] = useState({
    title: isEditMode ? (seed?.title || '') : (sourceClone ? `Copy of ${(sourceClone as any).title}` : ''),
    customerId: seed?.customerId || initialCustomerId,
    contactId: seed?.contactId || initialContactId,
    status: (isEditMode ? seed?.status : 'pending') as Quote['status'],
    taxRate: seed?.taxRate ?? 7,
    validUntil: isEditMode ? (seed?.validUntil || daysFromNow(45)) : daysFromNow(45),
    notes: seed?.notes || '',
    internalNotes: seed?.internalNotes || '',
    csrId: seed?.csrId || currentUser.id,
    salesId: (seed as any)?.salesId || currentUser.id,
    dueDate: (seed as any)?.dueDate || '',
    shipping: 0,
    discount: 0,
    discountType: 'fixed' as 'fixed' | 'percent',
    postage: 0,
    shipToAddress: '',
  });
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>(() => {
    // Edit mode: load existing items as-is (same IDs so edits are in-place)
    if (isEditMode && existingQuote?.lineItems?.length) {
      return existingQuote.lineItems;
    }
    // Clone mode: copy items with fresh IDs
    if (!isEditMode && sourceClone && (sourceClone as any).lineItems?.length) {
      return (sourceClone as any).lineItems.map((li: QuoteLineItem) => ({ ...li, id: nanoid() }));
    }
    return [EMPTY_LINE_ITEM()];
  });
  const [pricingStates, setPricingStates] = useState<Record<string, LineItemPricingState>>(() => {
    // Return empty — each item will get a default state when accessed via getPricingState
    return {};
  });
  const [saving, setSaving] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────
  const [editingItemModal, setEditingItemModal] = useState<string | null>(null);
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({});
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

    if (isEditMode && existingQuote) {
      // Update existing quote
      updateQuote(existingQuote.id, {
        title: form.title || lineItems.find(i => i.description)?.description || `Quote ${number}`,
        status: form.status,
        customerId: form.customerId || undefined,
        customerName: selectedCustomer?.name,
        contactId: form.contactId || undefined,
        lineItems,
        subtotal,
        taxRate: form.taxRate,
        taxAmount,
        total,
        validUntil: form.validUntil || undefined,
        notes: form.notes || undefined,
        internalNotes: form.internalNotes || undefined,
        csrId: form.csrId,
        salesId: form.salesId,
      });
      await new Promise(r => setTimeout(r, 150));
      setSaving(false);
      if (andConvert) navigate(`/orders/new?quoteId=${existingQuote.id}`);
      else navigate(`/quotes/${existingQuote.id}`);
    } else {
      // Create new quote
      const quote: Quote = {
        id: nanoid(), number, status: form.status,
        customerId: form.customerId || undefined, customerName: selectedCustomer?.name,
        contactId: form.contactId || undefined,
        title: form.title || lineItems.find(i => i.description)?.description || `Quote ${number}`,
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
    }
  };

  // ── Cancel handler ────────────────────────────────────────────────────
  const handleCancel = () => {
    if (!isEditMode && hasContent) {
      setShowCancelConfirm(true);
    } else if (isEditMode) {
      // In edit mode, cancel goes back to quote detail without confirming
      navigate(`/quotes/${editId}`);
    } else {
      navigate('/quotes');
    }
  };

  // ── Close dropdowns on outside click ─────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
      // Close Convert dropdown on any outside click
      setShowSaveDropdown(false);
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
            <button onClick={() => navigate('/quotes')} className="hover:text-[#F890E7]">Quotes</button>
            <span>/</span>
            <span className="text-gray-900 font-medium obj-num">{quoteNumber}</span>
            {sourceClone && <span className="text-gray-400 ml-1">— Clone of {(sourceClone as any).number}</span>}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Quote' : 'New Quote'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          <Button variant="success" onClick={() => handleSave(false)} loading={saving}>Save</Button>
          {/* Clone — save first then open clone */}
          <Button variant="secondary" icon={<Copy className="w-3.5 h-3.5" />} onClick={async () => {
            setSaving(true);
            const savedId = isEditMode ? existingQuote!.id : nanoid();
            if (isEditMode) {
              updateQuote(savedId, { title: form.title || lineItems.find(i => i.description)?.description || `Quote ${quoteNumber}`, status: form.status, customerId: form.customerId || undefined, customerName: selectedCustomer?.name, contactId: form.contactId || undefined, lineItems, subtotal, taxRate: form.taxRate, taxAmount, total, validUntil: form.validUntil || undefined, notes: form.notes || undefined, internalNotes: form.internalNotes || undefined, csrId: form.csrId, salesId: form.salesId });
            } else {
              addQuote({ id: savedId, number: quoteNumber, status: form.status, customerId: form.customerId || undefined, customerName: selectedCustomer?.name, contactId: form.contactId || undefined, title: form.title || lineItems.find(i => i.description)?.description || `Quote ${quoteNumber}`, lineItems, subtotal, taxRate: form.taxRate, taxAmount, total, validUntil: form.validUntil || undefined, notes: form.notes || undefined, internalNotes: form.internalNotes || undefined, csrId: form.csrId, salesId: form.salesId, source: 'scratch', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            }
            await new Promise(r => setTimeout(r, 150));
            setSaving(false);
            navigate(`/quotes/new?cloneId=${savedId}`);
          }} loading={saving}>Clone</Button>
          {/* Convert to Order — save first then convert */}
          <Button variant="primary" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => handleSave(true)} loading={saving}>Convert to Order</Button>
        </div>
      </div>

      {sourceClone && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
          <Copy className="w-3.5 h-3.5" />
          Cloning from {(sourceClone as any).number} — {(sourceClone as any).title}
        </div>
      )}

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
                const mp = (item as any);
                const isMP = !!mp.isMultiPart && Array.isArray(mp.parts) && mp.parts.length > 0;
                const partsExpanded = !!expandedParts[item.id];
                const setPartsExpanded = (v: boolean | ((prev: boolean) => boolean)) => {
                  const next = typeof v === 'function' ? v(partsExpanded) : v;
                  setExpandedParts(prev => ({ ...prev, [item.id]: next }));
                };
                return (
                  <Card key={item.id} className={`overflow-hidden transition-all ${isMP ? 'border-[#F890E7]/30' : 'hover:border-gray-200'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="w-5 h-5 bg-gray-100 rounded text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingItemModal(item.id)}>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.description || <span className="text-gray-400 italic">New line item — click to configure</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isMP && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#F890E7]/10 text-[#F890E7] border border-[#F890E7]/20 flex-shrink-0">
                              <Layers className="w-2.5 h-2.5" />
                              {mp.parts.length} parts
                            </span>
                          )}
                          {ps.categoryName && <Badge color="blue" className="text-[10px]">{ps.categoryName}</Badge>}
                          {!isMP && ps.quantity > 0 && <span className="text-xs text-gray-400">{ps.quantity.toLocaleString()} pcs</span>}
                          {!isMP && ps.finalWidth > 0 && ps.finalHeight > 0 && <span className="text-xs text-gray-400">{ps.finalWidth}" x {ps.finalHeight}"</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900 num">{fmt(item.sellPrice || 0)}</p>
                        <div className="flex items-center gap-1">
                          {isMP && (
                            <button
                              onClick={e => { e.stopPropagation(); setPartsExpanded(v => !v); }}
                              className="p-1 hover:bg-[#F890E7]/10 rounded text-[#F890E7]/60 hover:text-[#F890E7] transition-colors"
                              title={partsExpanded ? 'Collapse parts' : 'Expand parts'}
                            >
                              {partsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button onClick={() => setEditingItemModal(item.id)} className="p-1 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => duplicateLineItem(item)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeLineItem(item.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>

                    {/* Multi-part expand panel */}
                    {isMP && partsExpanded && (
                      <div className="border-t border-[#F890E7]/10 bg-[#F890E7]/3">
                        <div className="px-4 py-2 divide-y divide-gray-50">
                          {mp.parts.map((part: any, pIdx: number) => {
                            const partMargin = part.totalSell > 0 ? ((part.totalSell - part.totalCost) / part.totalSell) * 100 : 0;
                            return (
                              <div key={part.id} className="flex items-center justify-between py-2 group">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-4 h-4 rounded-full bg-[#F890E7]/20 text-[#F890E7] text-[9px] font-bold flex items-center justify-center flex-shrink-0">{pIdx + 1}</span>
                                  <div className="min-w-0">
                                    <span className="text-xs font-semibold text-gray-700">{part.partName}</span>
                                    {part.partDescription && <span className="text-[10px] text-gray-400 ml-2">{part.partDescription}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                  <span className="text-[10px] text-gray-400 num">Cost: {fmt(part.totalCost)}</span>
                                  {part.totalSell > 0 && (
                                    <span className={`text-[10px] num ${partMargin >= 30 ? 'text-emerald-600' : 'text-amber-500'}`}>
                                      {partMargin.toFixed(0)}%
                                    </span>
                                  )}
                                  <span className="text-xs font-semibold text-gray-800 num">{fmt(part.totalSell)}</span>
                                  <button
                                    onClick={() => setEditingItemModal(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-[10px] text-[#F890E7] hover:underline transition-opacity"
                                  >
                                    Edit →
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Parts total */}
                        <div className="px-4 py-1.5 border-t border-[#F890E7]/10 bg-[#F890E7]/5 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">{mp.parts.length} parts · click any part to edit in item dialog</span>
                          <span className="text-xs font-bold text-gray-800 num">{fmt(item.sellPrice)}</span>
                        </div>
                      </div>
                    )}
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
