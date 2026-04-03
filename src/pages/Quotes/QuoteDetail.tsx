import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowRight, Trash2, ChevronDown, ChevronUp, CheckCircle, Copy, Clock, Edit3, Plus, Search } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Badge, Card, PageHeader, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { QuoteStatus } from '../../types';
import { buildQuoteTemplateHtml } from '../../utils/documentTemplates';
import { ProductEditModal, LineItemPricingState, DEFAULT_PRICING_STATE } from '../../components/pricing/ItemEditModal';
import { nanoid } from '../../utils/nanoid';

// ─── Status options ──────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: 'pending', label: 'Pending'  },
  { value: 'hot',     label: 'Hot'      },
  { value: 'cold',    label: 'Cold'     },
  { value: 'won',     label: 'Won'      },
  { value: 'lost',    label: 'Lost'     },
];

const dotColors: Record<string, string> = {
  pending: 'bg-amber-400',
  hot:     'bg-red-400',
  cold:    'bg-sky-400',
  won:     'bg-emerald-400',
  lost:    'bg-gray-400',
};

// ─── Time helpers ────────────────────────────────────────────────────────────
function formatElapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days >= 1) return `${days}d ${hrs % 24}h`;
  if (hrs >= 1) return `${hrs}h ${mins % 60}m`;
  if (mins >= 1) return `${mins}m`;
  return 'just now';
}
function formatShortDT(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── Inline editable field — auto-saves on blur (click outside) ─────────────
const InlineField: React.FC<{
  label: string;
  value: string;
  displayValue?: string;
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
  const cancel = () => { setEditing(false); };

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
          <p className="text-sm font-medium text-gray-800">{value || <span className="text-gray-300 font-normal">—</span>}</p>
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
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
            onBlur={() => setTimeout(cancel, 200)}
            placeholder={placeholder || `Search ${label.toLowerCase()}...`}
            className="w-full pl-6 pr-2 py-1 text-sm bg-white border border-blue-200 rounded text-gray-800 focus:outline-none"
            autoFocus
          />
        </div>
        {filteredOptions.length > 0 && (
          <div className="mt-1 max-h-36 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
            {filteredOptions.map(o => (
              <button key={o.value} type="button"
                onMouseDown={() => { commit(o.value); }}
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

  // Text / date input
  return (
    <div className="rounded-md px-2 py-1.5 -mx-2 bg-blue-50/40 border border-blue-100">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
        onBlur={() => commit()}
        placeholder={placeholder}
        className="w-full text-sm bg-white border border-blue-200 rounded px-2 py-1 text-gray-800 focus:outline-none"
        autoFocus
      />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════

export const QuoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, updateQuote, deleteQuote, users, customers, contacts, companySettings, documentTemplates } = useStore();

  const [showDelete, setShowDelete] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);

  // ── Item editing (click item to open modal) ───────────────────────────
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [pricingStates, setPricingStates] = useState<Record<string, LineItemPricingState>>({});
  // When pricingState is missing for an item (e.g. after navigating away and back),
  // reconstruct it from the saved line item fields so material/equipment/etc. are restored
  const getPricingState = (iid: string): LineItemPricingState => {
    if (pricingStates[iid]) return pricingStates[iid];
    // Try to rebuild from the saved line item data
    const savedItem = (editingItems as any[]).find((i: any) => i.id === iid)
      || (quote?.lineItems as any[])?.find((i: any) => i.id === iid);
    if (savedItem) {
      return {
        ...DEFAULT_PRICING_STATE(),
        productName: savedItem.description || '',
        quantity: savedItem.quantity || 1000,
        finalWidth: savedItem.width || 0,
        finalHeight: savedItem.height || 0,
        materialId: savedItem.materialId || '',
        equipmentId: savedItem.equipmentId || '',
        // Restore serviceLines so pricing is shown correctly when modal opens
        serviceLines: savedItem.serviceLines || [],
      };
    }
    return DEFAULT_PRICING_STATE();
  };
  const [editingItems, setEditingItems] = useState<any[]>([]);
  const [itemsDirty, setItemsDirty] = useState(false);

  const quote = quotes.find(q => q.id === id);

  // Sync editingItems from quote when not dirty
  useEffect(() => {
    if (!itemsDirty && quote) setEditingItems(quote.lineItems as any);
  }, [quote?.lineItems, itemsDirty]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (convertRef.current && !convertRef.current.contains(e.target as Node)) setConvertOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!quote) return <div className="text-center py-16 text-gray-400">Quote not found</div>;

  const csr = users.find(u => u.id === quote.csrId);
  const salesRep = users.find(u => u.id === quote.salesId);
  const customer = customers.find(c => c.id === quote.customerId) || null;
  const primaryContact = contacts.find(c => c.customerId === quote.customerId && c.isPrimary)
    || contacts.find(c => c.customerId === quote.customerId) || null;

  const printHtml = useMemo(() => buildQuoteTemplateHtml({
    template: documentTemplates.quote, company: companySettings, quote, customer,
    contact: primaryContact, assignedUser: csr || null,
  }), [companySettings, csr, customer, documentTemplates.quote, primaryContact, quote]);

  const openPrintWindow = () => {
    const blob = new Blob([printHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) { URL.revokeObjectURL(url); return; }
    w.addEventListener('load', () => { w.focus(); setTimeout(() => w.print(), 150); setTimeout(() => URL.revokeObjectURL(url), 60000); }, { once: true });
  };

  // Save items — uses functional form to guarantee latest state, not stale closure
  const saveItems = (latestItems?: any[]) => {
    // If latestItems provided (from onClose callback), use that; otherwise read current state
    if (latestItems !== undefined) {
      const subtotal = latestItems.reduce((s: number, i: any) => s + (i.sellPrice || 0), 0);
      const taxAmount = subtotal * ((quote!.taxRate || 0) / 100);
      updateQuote(id!, { lineItems: latestItems, subtotal, taxAmount, total: subtotal + taxAmount });
      setItemsDirty(false);
    } else {
      setEditingItems(current => {
        const subtotal = current.reduce((s: number, i: any) => s + (i.sellPrice || 0), 0);
        const taxAmount = subtotal * ((quote!.taxRate || 0) / 100);
        updateQuote(id!, { lineItems: current as any, subtotal, taxAmount, total: subtotal + taxAmount });
        setItemsDirty(false);
        return current; // don't change the items, just read them
      });
    }
  };

  const addItem = () => {
    const item: any = { id: nanoid(), productFamily: 'digital_print', description: '', quantity: 1, unit: 'each', totalCost: 0, markup: 0, sellPrice: 0 };
    setEditingItems((prev: any) => [...prev, item]);
    setPricingStates(prev => ({ ...prev, [item.id]: DEFAULT_PRICING_STATE() }));
    setEditingItemId(item.id);
    setItemsDirty(true);
  };

  const removeItem = (iid: string) => {
    setEditingItems((prev: any) => prev.filter((i: any) => i.id !== iid));
    setItemsDirty(true);
  };

  // Header save helpers
  const saveField = (field: Partial<typeof quote>) => updateQuote(id!, field);

  const csrOptions = users.filter(u => ['csr', 'admin', 'manager'].includes(u.role)).map(u => ({ value: u.id, label: u.name }));
  const salesOptions = users.filter(u => ['sales', 'admin', 'manager'].includes(u.role)).map(u => ({ value: u.id, label: u.name }));
  const contactOptions = contacts.filter(c => c.customerId === quote.customerId).map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }));
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));

  return (
    <div>
      <PageHeader
        title={quote.title}
        back={() => navigate('/quotes')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={openPrintWindow}>Print PDF</Button>
            <Button variant="secondary" size="sm" icon={<Copy className="w-4 h-4" />} onClick={() => navigate(`/quotes/new?cloneId=${quote.id}`)}>Clone</Button>
            {!quote.convertedToOrderId && (
              <Button variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => { updateQuote(id!, { status: 'won' }); navigate(`/orders/new?quoteId=${quote.id}`); }}>
                Convert to Order
              </Button>
            )}
            <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDelete(true)}>Delete</Button>
          </div>
        }
      />

      {/* ═══ Quote header card ══════════════════════════════════════════════════ */}
      <Card className="mb-5">
        {/* Top row: number + status pills + time */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0 flex-wrap">
            <span className="text-lg font-semibold text-gray-700 obj-num flex-shrink-0 tracking-wide">{quote.number}</span>

            {/* Status pills — solid filled active, ghost inactive */}
            <div className="flex items-center gap-1">
              {STATUS_OPTIONS.map(s => {
                const isActive = quote.status === s.value;
                // Per-status solid colors for active state
                const activeStyles: Record<string, string> = {
                  pending: 'bg-amber-500 text-white shadow-amber-200',
                  hot:     'bg-red-500 text-white shadow-red-200',
                  cold:    'bg-sky-500 text-white shadow-sky-200',
                  won:     'bg-emerald-500 text-white shadow-emerald-200',
                  lost:    'bg-gray-500 text-white shadow-gray-200',
                };
                return (
                  <button
                    key={s.value}
                    onClick={() => updateQuote(id!, { status: s.value })}
                    title={`Set to ${s.label}`}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? `${activeStyles[s.value]} shadow-sm`
                        : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-white' : dotColors[s.value]
                    }`} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Account + contact — always visible (compact) */}
            {(quote.customerName || quote.contactName) && (
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                {quote.customerName && <span className="font-medium text-gray-700">{quote.customerName}</span>}
                {quote.contactName && <><span className="text-gray-300">·</span><span>{quote.contactName}</span></>}
              </div>
            )}

            {/* Time on stage */}
            {(quote.statusChangedAt || quote.createdAt) && (
              <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-medium">{formatElapsed(quote.statusChangedAt || quote.createdAt)}</span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px]">Since {formatShortDT(quote.statusChangedAt || quote.createdAt)}</span>
              </div>
            )}

            {quote.convertedToOrderId && (
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium flex-shrink-0">
                <CheckCircle className="w-3.5 h-3.5" />
                <button onClick={() => navigate(`/orders/${quote.convertedToOrderId}`)} className="hover:underline">→ View Order</button>
              </div>
            )}
          </div>

          <button onClick={() => setHeaderCollapsed(!headerCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 ml-3 flex-shrink-0 transition-colors">
            {headerCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        {/* Expandable header detail — inline editable fields */}
        {!headerCollapsed && (
          <div className="px-5 pb-5 pt-0 border-t border-gray-100">
            <div className="flex items-center justify-between mt-3 mb-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Click any field to edit</p>
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3 items-start">
              <InlineField label="Account" value={quote.customerName || ''} placeholder="Search accounts..."
                searchable options={customerOptions}
                onAddNew={() => { /* navigate to add customer */ }}
                onSave={v => { const c = customers.find(x => x.id === v); saveField({ customerId: v || undefined, customerName: c?.name }); }} />
              <InlineField label="Contact" value={quote.contactName || ''} placeholder="Search contacts..."
                searchable options={contactOptions}
                onAddNew={() => { /* navigate to add contact */ }}
                onSave={v => { const c = contacts.find(x => x.id === v); saveField({ contactId: v || undefined, contactName: c ? `${c.firstName} ${c.lastName}` : undefined }); }} />
              <InlineField label="Valid Until" value={quote.validUntil || ''} type="date"
                onSave={v => saveField({ validUntil: v || undefined })} />
              <InlineField label="CSR" value={csr?.name || ''} placeholder="Search CSR..."
                searchable options={csrOptions}
                onSave={v => saveField({ csrId: v || undefined })} />
              <InlineField label="Sales Rep" value={salesRep?.name || ''} placeholder="Search Sales Rep..."
                searchable options={salesOptions}
                onSave={v => saveField({ salesId: v || undefined })} />
              <InlineField label="Title" value={quote.title} placeholder="Quote title..."
                onSave={v => saveField({ title: v })} />
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">

          {/* ═══ Line Items — click item to edit ════════════════════════════ */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Line Items
                <span className="text-[10px] font-normal text-gray-400 ml-2">Click any item to edit</span>
              </h2>
              <button onClick={addItem}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-[var(--brand)] hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {(editingItems as any[]).map((item: any, i: number) => {
                const mp = item as any;
                const isMP = mp.isMultiPart && Array.isArray(mp.parts) && mp.parts.length > 0;
                return (
                  <div key={item.id}
                    className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => setEditingItemId(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-300 flex-shrink-0">#{i + 1}</span>
                          {isMP && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/20 flex-shrink-0">
                              {mp.parts.length} parts
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {item.description || <span className="text-gray-400 italic">Untitled item</span>}
                          </span>
                          <Edit3 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                        </div>
                        {!isMP && (
                          <p className="text-xs text-gray-400 mt-0.5 ml-5">
                            {item.quantity} {item.unit}
                            {item.width && item.height ? ` · ${item.width}" × ${item.height}"` : ''}
                          </p>
                        )}
                        {isMP && mp.parts.length > 0 && (
                          <div className="flex items-center gap-3 mt-1 ml-5 flex-wrap">
                            {mp.parts.map((p: any) => (
                              <span key={p.id} className="text-[10px] text-gray-400">
                                {p.partName}: <span className="text-gray-600 num">{formatCurrency(p.totalSell)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm font-bold text-gray-900 num">{formatCurrency(item.sellPrice)}</p>
                        {item.totalCost > 0 && (
                          <p className="text-[10px] text-gray-400">Cost: {formatCurrency(item.totalCost)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {(editingItems as any[]).length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400 mb-2">No items yet.</p>
                  <button onClick={addItem} className="text-sm text-[var(--brand)] hover:underline font-medium">+ Add first item</button>
                </div>
              )}
            </div>
          </Card>

          {(quote.notes || quote.internalNotes) && (
            <Card className="p-5">
              <div className="grid grid-cols-2 gap-4">
                {quote.notes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer Notes</p><p className="text-sm text-gray-700">{quote.notes}</p></div>}
                {quote.internalNotes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Internal Notes</p><p className="text-sm text-gray-700">{quote.internalNotes}</p></div>}
              </div>
            </Card>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Pricing Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="num">{formatCurrency(quote.subtotal)}</span></div>
              {quote.taxRate ? <div className="flex justify-between text-sm"><span className="text-gray-500">Tax ({quote.taxRate}%)</span><span className="num">{formatCurrency(quote.taxAmount || 0)}</span></div> : null}
              <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3">
                <span>Total</span><span className="text-brand num">{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Customer</dt><dd className="font-medium text-gray-900">{quote.customerName || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd className="text-gray-900">{formatDate(quote.createdAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Valid Until</dt><dd className="text-gray-900">{quote.validUntil ? formatDate(quote.validUntil) : '—'}</dd></div>
            </dl>
          </Card>
        </div>
      </div>

      {/* Item edit modal — triggered by clicking any item */}
      {editingItemId && (() => {
        const editingItem = (editingItems as any[]).find((i: any) => i.id === editingItemId);
        const editingPs = getPricingState(editingItemId);
        if (!editingItem) return null;
        return (
          <ProductEditModal
            item={editingItem}
            pricingState={editingPs}
            isNew={!editingItem.description}
            onUpdateItem={updates => {
              setEditingItems((prev: any) => prev.map((i: any) => i.id === editingItemId ? { ...i, ...updates } : i));
              setItemsDirty(true);
            }}
            onUpdatePricing={updates => {
              setPricingStates(prev => ({ ...prev, [editingItemId]: { ...(prev[editingItemId] || DEFAULT_PRICING_STATE()), ...updates } }));
            }}
            onClose={() => {
              // Use functional state read to get the absolute latest editingItems
              // (avoids stale closure where saveItems() would read old values)
              setEditingItems(current => {
                const subtotal = current.reduce((s: number, i: any) => s + (i.sellPrice || 0), 0);
                const taxAmount = subtotal * ((quote!.taxRate || 0) / 100);
                updateQuote(id!, { lineItems: current as any, subtotal, taxAmount, total: subtotal + taxAmount });
                setItemsDirty(false);
                return current;
              });
              setEditingItemId(null);
            }}
            onRemove={() => { removeItem(editingItemId); setEditingItemId(null); }}
            matchingTemplates={[]}
            onApplyTemplate={() => {}}
          />
        );
      })()}

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={() => { deleteQuote(id!); navigate('/quotes'); }}
        title="Delete Quote" message={`Delete ${quote.number}? This cannot be undone.`} />
    </div>
  );
};
