import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowRight, Trash2, ChevronDown, ChevronUp, CheckCircle, Copy, Clock, Edit3, Plus, Search, Building2, X, Send, FileDown, AlertCircle } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Badge, Card, PageHeader, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { QuoteStatus } from '../../types';
import { buildQuoteTemplateHtml } from '../../utils/documentTemplates';
import { ProductEditModal, LineItemPricingState, DEFAULT_PRICING_STATE } from '../../components/pricing/ItemEditModal';
import { usePricingStore } from '../../store/pricingStore';
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

// ─── Helper: does an item have meaningful user content? ───────────────────────
function itemHasContent(item: any): boolean {
  return !!(
    item.description ||
    (item.sellPrice && item.sellPrice > 0) ||
    (item.totalCost && item.totalCost > 0) ||
    item.materialId ||
    item.productId ||
    item.pricingContext
  );
}

// ─── No-Account Guard Modal ───────────────────────────────────────────────────
const NoAccountGuard: React.FC<{
  quoteNumber: string;
  onAssignAccount: () => void;
  onDeleteQuote: () => void;
  onDismiss: () => void;
}> = ({ quoteNumber, onAssignAccount, onDeleteQuote, onDismiss }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
      <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
        <X className="w-4 h-4 text-gray-400" />
      </button>

      {/* Icon */}
      <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-7 h-7 text-amber-500" />
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-2">Account Required</h2>
      <p className="text-sm text-gray-500 mb-1">
        <span className="font-semibold text-gray-700">{quoteNumber}</span> doesn't have a client account assigned yet.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Every quote must be linked to an account before it can be filed. Assign an account now, or remove this quote if it's no longer needed.
      </p>

      <div className="space-y-2">
        <Button
          variant="primary"
          className="w-full justify-center"
          icon={<Building2 className="w-4 h-4" />}
          onClick={onAssignAccount}
        >
          Assign Account to This Quote
        </Button>
        <Button
          variant="danger"
          className="w-full justify-center"
          icon={<Trash2 className="w-4 h-4" />}
          onClick={onDeleteQuote}
        >
          Delete This Quote
        </Button>
      </div>

      <button onClick={onDismiss} className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors underline-offset-2 hover:underline">
        Stay on this quote
      </button>
    </div>
  </div>
);

// ─── Inline editable field — auto-saves on blur (click outside) ─────────────
const InlineField: React.FC<{
  label: string;
  value: string;
  displayValue?: string;
  onSave: (v: string) => void;
  type?: 'text' | 'date';
  /** For date fields: the ISO value used in the <input type="date"> when editing.
   *  The `value` prop carries the formatted display string (e.g. "Apr 9, 2026"). */
  rawValue?: string;
  searchable?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  onAddNew?: () => void;
  forwardRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ label, value, rawValue, onSave, type = 'text', searchable, options, placeholder, onAddNew, forwardRef }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rawValue ?? value);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => { setDraft(rawValue ?? value); setSearch(value); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); };
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
      <div
        ref={forwardRef}
        className="group cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1.5 -mx-2 transition-colors"
        onClick={start}
      >
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-sm font-semibold text-gray-800">{value || <span className="text-gray-300 font-normal">—</span>}</p>
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
// ADDRESS DIALOG — shared between Quote and Order screens
// ═════════════════════════════════════════════════════════════════════════════

interface AddrBlock { name: string; address: string; city: string; state: string; zip: string; country: string; }
interface ShipBlock extends AddrBlock { same: boolean; }

const FieldRow: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }> =
  ({ label, value, onChange, placeholder, textarea }) => (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {textarea ? (
        <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] resize-none" />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]" />
      )}
    </div>
  );

export const AddressDialog: React.FC<{
  title: string;
  billTo: AddrBlock;
  shipTo: ShipBlock;
  onSave: (bill: AddrBlock, ship: ShipBlock) => void;
  onClose: () => void;
}> = ({ title, billTo: initBill, shipTo: initShip, onSave, onClose }) => {
  const [bill, setBill] = React.useState<AddrBlock>({ ...initBill });
  const [ship, setShip] = React.useState<ShipBlock>({ ...initShip });

  const updateBill = (k: keyof AddrBlock, v: string) => setBill(p => ({ ...p, [k]: v }));
  const updateShip = (k: keyof AddrBlock, v: string) => setShip(p => ({ ...p, [k]: v }));

  const AddrForm: React.FC<{ data: AddrBlock; onChange: (k: keyof AddrBlock, v: string) => void; disabled?: boolean }> =
    ({ data, onChange, disabled }) => (
      <div className={`space-y-2.5 ${disabled ? 'opacity-40 pointer-events-none select-none' : ''}`}>
        <FieldRow label="Name / Company" value={data.name} onChange={v => onChange('name', v)} placeholder="Recipient or company name" />
        <FieldRow label="Street Address" value={data.address} onChange={v => onChange('address', v)} placeholder="123 Main St" textarea />
        <div className="grid grid-cols-3 gap-2">
          <FieldRow label="City" value={data.city} onChange={v => onChange('city', v)} placeholder="City" />
          <FieldRow label="State" value={data.state} onChange={v => onChange('state', v)} placeholder="FL" />
          <FieldRow label="ZIP" value={data.zip} onChange={v => onChange('zip', v)} placeholder="33101" />
        </div>
        <FieldRow label="Country" value={data.country} onChange={v => onChange('country', v)} placeholder="US" />
      </div>
    );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900">Ship To &amp; Bill To</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">{title} · addresses are saved to this document only</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body — two columns */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-2 gap-6">
            {/* Bill To */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Bill To
              </h3>
              <AddrForm data={bill} onChange={updateBill} />
            </div>

            {/* Ship To */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" /></svg>
                Ship To
              </h3>
              {/* Same as Bill To toggle */}
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <div className={`relative w-8 h-4 rounded-full transition-colors ${ship.same ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  onClick={() => setShip(p => ({ ...p, same: !p.same }))}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${ship.same ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-[11px] font-medium text-gray-600">Same as Bill To</span>
              </label>
              <AddrForm data={ship.same ? bill : ship} onChange={updateShip} disabled={ship.same} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={() => onSave(bill, ship)}
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Save Addresses
          </button>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// QUOTE SEND DIALOG
// ═════════════════════════════════════════════════════════════════════════════

const QuoteSendDialog: React.FC<{
  quoteNumber: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  subject: string;
  defaultMessage: string;
  hasEmailConfig: boolean;
  onClose: () => void;
}> = ({ quoteNumber, fromEmail, fromName, toEmail, toName, subject: initSubject, defaultMessage, hasEmailConfig, onClose }) => {
  const navigate = useNavigate();
  const [to,      setTo]      = React.useState(toEmail ? `${toName ? toName + ' <' : ''}${toEmail}${toName ? '>' : ''}` : '');
  const [subj,    setSubj]    = React.useState(initSubject);
  const [msg,     setMsg]     = React.useState(defaultMessage);
  const [sending, setSending] = React.useState(false);
  const [sent,    setSent]    = React.useState(false);

  const handleSend = () => {
    setSending(true);
    // Simulate send — real integration wired up in Settings → Email
    setTimeout(() => { setSending(false); setSent(true); }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-[#F890E7]" />
            Send Quote {quoteNumber}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* No email config warning */}
        {!hasEmailConfig && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              No outbound email is configured. Your team will need to send this manually.{' '}
              <button type="button" onClick={() => { onClose(); navigate('/settings?tab=email'); }}
                className="underline font-semibold hover:text-amber-900 transition-colors">
                Configure email in Settings →
              </button>
            </span>
          </div>
        )}

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* Attachment indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <FileDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-[11px] text-gray-600 flex-1">Attached: <span className="font-semibold">Quote-{quoteNumber}.pdf</span></span>
            <span className="text-[10px] text-gray-400">PDF</span>
          </div>

          {/* From */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">From</label>
            <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600 select-none">
              {fromName ? `${fromName} <${fromEmail}>` : fromEmail || <span className="text-gray-400 italic">Not configured — add in Settings → Email</span>}
            </div>
          </div>

          {/* To */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">To</label>
            <input
              type="text" value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Subject</label>
            <input
              type="text" value={subj}
              onChange={e => setSubj(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Message</label>
            <textarea
              rows={6}
              value={msg}
              onChange={e => setMsg(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
          {sent ? (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {hasEmailConfig ? 'Quote sent!' : 'Marked as sent'}
            </span>
          ) : (
            <p className="text-[10px] text-gray-400">{hasEmailConfig ? 'Sends via your connected email account.' : 'Email not configured — message will be shown for manual sending.'}</p>
          )}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors">
              {sent ? 'Close' : 'Cancel'}
            </button>
            {!sent && (
              <button
                onClick={handleSend}
                disabled={sending || !to.trim() || !subj.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#F890E7] hover:bg-[#e57dd6] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending…' : hasEmailConfig ? 'Send' : 'Mark as Sent'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════

export const QuoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, updateQuote, deleteQuote, users, customers, contacts, companySettings, documentTemplates } = useStore();
  const { templates: pricingTemplates } = usePricingStore();

  const [showDelete, setShowDelete] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [showCloneConfirm, setShowCloneConfirm] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  // ── No-account guard ──────────────────────────────────────────────────────
  const [showNoAccountGuard, setShowNoAccountGuard] = useState(false);
  // Where we were trying to navigate when the guard fired
  const pendingNavRef = useRef<string | null>(null);
  // Ref to the Account inline field container so we can scroll to it
  const accountFieldRef = useRef<HTMLDivElement>(null);

  // ── Item editing state ────────────────────────────────────────────────────
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [pricingStates, setPricingStates] = useState<Record<string, LineItemPricingState>>({});
  const pricingStatesRef = useRef<Record<string, LineItemPricingState>>({});
  pricingStatesRef.current = pricingStates;

  // ── Item delete confirm state ─────────────────────────────────────────────
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<string | null>(null);

  const quote = quotes.find(q => q.id === id);

  const currentItemsRef = useRef<any[]>([]);
  currentItemsRef.current = (quote?.lineItems as any[]) || [];
  const currentItems: any[] = currentItemsRef.current;

  // ── Navigation guard — intercept leaving without an account ───────────────
  const guardedNavigate = useCallback((path: string) => {
    if (!quote?.customerName) {
      pendingNavRef.current = path;
      setShowNoAccountGuard(true);
    } else {
      navigate(path);
    }
  }, [quote?.customerName, navigate]);

  // ── Restore pricing state ─────────────────────────────────────────────────
  const getPricingState = (iid: string): LineItemPricingState => {
    if (pricingStates[iid]) return pricingStates[iid];
    const saved = currentItemsRef.current.find((i: any) => i.id === iid);
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
        cuttingEnabled: saved.cuttingEnabled ?? false,
        sheetsPerStack: saved.sheetsPerStack || 500,
        serviceLines: saved.serviceLines || [],
        selectedLaborIds: saved.selectedLaborIds || [],
        selectedBrokeredIds: saved.selectedBrokeredIds || [],
      };
    }
    return DEFAULT_PRICING_STATE();
  };

  // ── Pre-populate pricingStates BEFORE the modal mounts ───────────────────
  const openItemForEdit = useCallback((itemId: string) => {
    setPricingStates(prev => {
      if (prev[itemId]) return prev;
      const saved = (currentItemsRef.current.find((i: any) => i.id === itemId) || null) as any;
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
          cuttingEnabled: saved.cuttingEnabled ?? false,
          sheetsPerStack: saved.sheetsPerStack || 500,
          serviceLines: saved.serviceLines || [],
          selectedLaborIds: saved.selectedLaborIds || [],
          selectedBrokeredIds: saved.selectedBrokeredIds || [],
        };
      }
      return { ...prev, [itemId]: restored };
    });
    setEditingItemId(itemId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Matching templates for the currently-editing item ────────────────────
  const matchingTemplatesForItem = useMemo(() => {
    if (!editingItemId) return [];
    const ps = pricingStatesRef.current[editingItemId];
    // Only show templates for the exact same product — match by productId first,
    // then fall back to productName match. Never show templates for other products
    // just because they share a category.
    return pricingTemplates.filter(t => {
      if (ps?.productId && t.productId) return t.productId === ps.productId;
      if (ps?.productName && t.productName) return t.productName.toLowerCase() === ps.productName.toLowerCase();
      return false;
    });
  }, [editingItemId, pricingTemplates, pricingStates]);

  const handleApplyTemplate = useCallback((tmplId: string) => {
    const tmpl = pricingTemplates.find(t => t.id === tmplId);
    if (!tmpl || !editingItemId) return;
    setPricingStates(prev => ({
      ...prev,
      [editingItemId]: {
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
        cuttingEnabled: false,
        sheetsPerStack: 500,
        serviceLines: [],
        selectedLaborIds: [],
        selectedBrokeredIds: [],
      },
    }));
  }, [editingItemId, pricingTemplates]);

  // ── Write items to store ──────────────────────────────────────────────────
  const persistItems = useCallback((items: any[]) => {
    const q = quotes.find(qq => qq.id === id);
    const subtotal = items.reduce((s: number, i: any) => s + (i.sellPrice || 0), 0);
    const taxAmount = subtotal * ((q?.taxRate || 0) / 100);
    const titleUpdate = !q?.title && items.find((i: any) => i.description)?.description
      ? { title: items.find((i: any) => i.description).description }
      : {};
    updateQuote(id!, { lineItems: items, subtotal, taxAmount, total: subtotal + taxAmount, ...titleUpdate });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, updateQuote, quotes]);

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

  // Print — opens rendered quote in a new tab and immediately triggers the browser's Print dialog
  const openPrintWindow = () => {
    const blob = new Blob([printHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) { URL.revokeObjectURL(url); return; }
    w.addEventListener('load', () => { w.focus(); setTimeout(() => w.print(), 150); setTimeout(() => URL.revokeObjectURL(url), 60000); }, { once: true });
  };

  // PDF download — injects a print-to-PDF instruction into the page so the browser's
  // "Save as PDF" destination is pre-selected, then triggers print.
  // This is the standard browser-native PDF download path without a server dependency.
  const downloadPdf = () => {
    // Wrap the HTML with a @media print rule that hides the browser chrome
    // and a script that calls print() immediately on load so the user gets
    // the Save dialog instead of a visible page.
    const pdfHtml = printHtml.replace(
      '</head>',
      `<style>
        @media screen { body { margin: 0; } }
        @media print { @page { margin: 10mm; } }
      </style>
      <script>
        window.addEventListener('load', function() {
          document.title = 'Quote-${quote.number}';
          setTimeout(function() { window.print(); }, 200);
        });
      </script>
      </head>`
    );
    const blob = new Blob([pdfHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) {
      // Popup blocked — fall back to download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quote-${quote.number}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const addItem = () => {
    const item: any = { id: nanoid(), productFamily: 'digital_print', description: '', quantity: 1, unit: 'each', totalCost: 0, markup: 0, sellPrice: 0 };
    const newItems = [...currentItems, item];
    persistItems(newItems);
    setPricingStates(prev => ({ ...prev, [item.id]: DEFAULT_PRICING_STATE() }));
    openItemForEdit(item.id);
  };

  // ── Direct-delete from list ───────────────────────────────────────────────
  const requestDeleteItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // don't open the edit modal
    const item = currentItemsRef.current.find((i: any) => i.id === itemId);
    if (!item) return;
    if (itemHasContent(item)) {
      setDeleteConfirmItemId(itemId);
    } else {
      // No content — delete immediately, no confirm needed
      const newItems = currentItemsRef.current.filter((i: any) => i.id !== itemId);
      persistItems(newItems);
    }
  };

  const confirmDeleteItem = () => {
    if (!deleteConfirmItemId) return;
    const newItems = currentItemsRef.current.filter((i: any) => i.id !== deleteConfirmItemId);
    persistItems(newItems);
    setDeleteConfirmItemId(null);
  };

  const removeItem = (iid: string) => {
    const newItems = currentItems.filter((i: any) => i.id !== iid);
    persistItems(newItems);
  };

  // Header save helpers
  const saveField = (field: Partial<typeof quote>) => updateQuote(id!, field);

  const csrOptions = users.filter(u => ['csr', 'admin', 'manager'].includes(u.role)).map(u => ({ value: u.id, label: u.name }));
  const salesOptions = users.filter(u => ['sales', 'admin', 'manager'].includes(u.role)).map(u => ({ value: u.id, label: u.name }));
  const contactOptions = contacts.filter(c => c.customerId === quote.customerId).map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }));
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));

  // Delete confirm item info
  const deleteConfirmItem = deleteConfirmItemId
    ? currentItems.find((i: any) => i.id === deleteConfirmItemId)
    : null;

  return (
    <div>
      <PageHeader
        title={quote.title}
        back={() => guardedNavigate('/quotes')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={openPrintWindow} title="Open print dialog">Print</Button>
            <Button variant="secondary" size="sm" icon={<FileDown className="w-4 h-4" />} onClick={downloadPdf} title="Download as PDF">PDF</Button>
            <Button variant="secondary" size="sm" icon={<Send className="w-4 h-4" />} onClick={() => setShowSendDialog(true)}>Send</Button>
            <Button variant="secondary" size="sm" icon={<Copy className="w-4 h-4" />} onClick={() => setShowCloneConfirm(true)}>Clone</Button>
            {!quote.convertedToOrderId && (
              <Button variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => setShowConvertConfirm(true)}>
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

            {/* Status pills */}
            <div className="flex items-center gap-1">
              {STATUS_OPTIONS.map(s => {
                const isActive = quote.status === s.value;
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
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : dotColors[s.value]}`} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Account + contact compact */}
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

        {/* Expandable header — inline editable fields */}
        {!headerCollapsed && (
          <div className="px-5 pb-5 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Click any field to edit</p>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 items-start">

              {/* ── Row 1: Account | Title | Ship/Bill To ── */}
              <InlineField
                label="Account"
                value={quote.customerName || ''}
                placeholder="Search accounts..."
                searchable options={customerOptions}
                forwardRef={accountFieldRef}
                onAddNew={() => {}}
                onSave={v => {
                  const c = customers.find(x => x.id === v);
                  const primary = v ? (contacts.find(ct => ct.customerId === v && ct.isPrimary) || contacts.find(ct => ct.customerId === v)) : undefined;
                  saveField({
                    customerId: v || undefined,
                    customerName: c?.name,
                    contactId: primary?.id,
                    contactName: primary ? `${primary.firstName} ${primary.lastName}` : undefined,
                  });
                }}
              />
              <InlineField label="Title" value={quote.title} placeholder="Quote title..."
                onSave={v => saveField({ title: v })} />
              {/* Ship/Bill To — lives in col 3, row 1 */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Addresses</p>
                <button
                  onClick={() => setShowAddressDialog(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg transition-colors shadow-sm w-full justify-center"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Ship / Bill To
                  {(quote.billToAddress || quote.shipToAddress) && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                </button>
              </div>

              {/* ── Row 2: Contact | Quote Date + Valid Until | CSR + Sales Rep ── */}
              <InlineField label="Contact" value={quote.contactName || ''} placeholder="Search contacts..."
                searchable options={contactOptions}
                onAddNew={() => {}}
                onSave={v => { const c = contacts.find(x => x.id === v); saveField({ contactId: v || undefined, contactName: c ? `${c.firstName} ${c.lastName}` : undefined }); }} />
              {/* Quote Date + Valid Until — both under col 2 (Title above) */}
              <div className="grid grid-cols-2 gap-x-4">
                <InlineField label="Quote Date"
                  value={quote.quoteDate ? formatDate(quote.quoteDate) : (quote.createdAt ? formatDate(quote.createdAt) : '')}
                  rawValue={quote.quoteDate || quote.createdAt?.slice(0,10) || ''}
                  type="date" onSave={v => saveField({ quoteDate: v || undefined })} />
                <InlineField label="Valid Until"
                  value={quote.validUntil ? formatDate(quote.validUntil) : ''}
                  rawValue={quote.validUntil || ''}
                  type="date" onSave={v => saveField({ validUntil: v || undefined })} />
              </div>
              {/* CSR + Sales Rep — both under col 3 (Ship/Bill To above) */}
              <div className="grid grid-cols-2 gap-x-4">
                <InlineField label="CSR" value={csr?.name || ''} placeholder="Search CSR..."
                  searchable options={csrOptions}
                  onSave={v => saveField({ csrId: v || undefined })} />
                <InlineField label="Sales Rep" value={salesRep?.name || ''} placeholder="Search Sales Rep..."
                  searchable options={salesOptions}
                  onSave={v => saveField({ salesId: v || undefined })} />
              </div>

            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">

          {/* ═══ Line Items ════════════════════════════════════════════════════ */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Line Items
                
              </h2>
              <button onClick={addItem}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-[var(--brand)] hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {currentItems.map((item: any, i: number) => {
                const mp = item as any;
                const isMP = mp.isMultiPart && Array.isArray(mp.parts) && mp.parts.length > 0;
                return (
                  <div key={item.id}
                    className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => openItemForEdit(item.id)}
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
                          <p className="text-xs text-gray-500 mt-0.5 ml-5 font-medium">
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

                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 num">{formatCurrency(item.sellPrice)}</p>
                          {item.totalCost > 0 && (
                            <p className="text-[10px] text-gray-600 font-medium">Cost: {formatCurrency(item.totalCost)}</p>
                          )}
                        </div>
                        {/* Inline delete button — visible on hover */}
                        <button
                          onClick={e => requestDeleteItem(e, item.id)}
                          className="p-1.5 rounded-lg text-gray-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {currentItems.length === 0 && (
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
        </div>
      </div>

      {/* Item edit modal */}
      {editingItemId && (() => {
        const editingItem = currentItems.find((i: any) => i.id === editingItemId);
        const editingPs = getPricingState(editingItemId);
        if (!editingItem) return null;
        return (
          <ProductEditModal
            item={editingItem}
            pricingState={editingPs}
            isNew={!editingItem.description}
            onUpdateItem={updates => {
              const newItems = currentItemsRef.current.map((i: any) =>
                i.id === editingItemId ? { ...i, ...updates } : i
              );
              persistItems(newItems);
            }}
            onUpdatePricing={updates => {
              setPricingStates(prev => {
                const existing = prev[editingItemId];
                let base: LineItemPricingState;
                if (existing) {
                  base = existing;
                } else {
                  const saved = currentItemsRef.current.find((i: any) => i.id === editingItemId) as any;
                  if (saved?.pricingContext) {
                    base = { ...DEFAULT_PRICING_STATE(), ...(saved.pricingContext as Partial<LineItemPricingState>) };
                  } else if (saved) {
                    base = {
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
                      cuttingEnabled: saved.cuttingEnabled ?? false,
                      sheetsPerStack: saved.sheetsPerStack || 500,
                      serviceLines: saved.serviceLines || [],
                      selectedLaborIds: saved.selectedLaborIds || [],
                      selectedBrokeredIds: saved.selectedBrokeredIds || [],
                    };
                  } else {
                    base = DEFAULT_PRICING_STATE();
                  }
                }
                return { ...prev, [editingItemId]: { ...base, ...updates } };
              });
            }}
            onClose={() => {
              const finalPs = pricingStatesRef.current[editingItemId] || getPricingState(editingItemId);
              // Always derive totalCost / sellPrice from the live service lines so the quote
              // list shows the correct total even when the recompute effect never called onUpdateItem
              // (e.g. when a product was loaded from catalog defaultPricingContext).
              const slTotalCost = finalPs.serviceLines?.reduce((s: number, l: any) => s + (l.totalCost || 0), 0) ?? 0;
              const slTotalSell = finalPs.serviceLines?.reduce((s: number, l: any) => s + (l.sellPrice || 0), 0) ?? 0;
              const slMarkup = slTotalCost > 0 ? Math.round(((slTotalSell - slTotalCost) / slTotalCost) * 100) : 0;
              const finalItems = currentItemsRef.current.map((i: any) => {
                if (i.id !== editingItemId) return i;
                const base = { ...i, pricingContext: { ...finalPs } };
                if (slTotalSell > 0) {
                  return { ...base, totalCost: slTotalCost, sellPrice: slTotalSell, markup: slMarkup };
                }
                return base;
              });
              persistItems(finalItems);
              setEditingItemId(null);
            }}
            onRemove={() => { removeItem(editingItemId); setEditingItemId(null); }}
            matchingTemplates={matchingTemplatesForItem}
            onApplyTemplate={handleApplyTemplate}
          />
        );
      })()}

      <ConfirmDialog
        isOpen={showConvertConfirm}
        onClose={() => setShowConvertConfirm(false)}
        onConfirm={() => { updateQuote(id!, { status: 'won' }); navigate(`/orders/new?quoteId=${quote.id}`); setShowConvertConfirm(false); }}
        title="Convert to Order"
        message={`Convert ${quote.number} into a new Order? The quote will be marked as Won.`}
        confirmLabel="Convert to Order"
      />
      <ConfirmDialog
        isOpen={showCloneConfirm}
        onClose={() => setShowCloneConfirm(false)}
        onConfirm={() => { navigate(`/quotes/new?cloneId=${quote.id}`); setShowCloneConfirm(false); }}
        title="Clone Quote"
        message={`Create a new duplicate of ${quote.number}${quote.title ? ` — ${quote.title}` : ''}?`}
        confirmLabel="Clone Quote"
      />
      {/* Delete quote confirm */}
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={() => { deleteQuote(id!); navigate('/quotes'); }}
        title="Delete Quote" message={`Delete ${quote.number}? This cannot be undone.`} />

      {/* Delete item confirm (only shown for items with content) */}
      <ConfirmDialog
        isOpen={!!deleteConfirmItemId}
        onClose={() => setDeleteConfirmItemId(null)}
        onConfirm={confirmDeleteItem}
        title="Remove Line Item"
        message={
          deleteConfirmItem?.description
            ? `Remove "${deleteConfirmItem.description}" from this quote? Any pricing data will be lost.`
            : 'Remove this item from the quote? Any pricing data will be lost.'
        }
        confirmLabel="Remove Item"
      />

      {/* ── Ship To / Bill To address dialog ────────────────────────────── */}
      {showAddressDialog && (() => {
        const customer = customers.find(c => c.id === quote.customerId);
        // Default Bill To from customer if not yet set
        const defaultBillTo = {
          name: quote.billToName ?? quote.customerName ?? '',
          address: quote.billToAddress ?? (customer?.address ?? ''),
          city: quote.billToCity ?? (customer?.city ?? ''),
          state: quote.billToState ?? (customer?.state ?? ''),
          zip: quote.billToZip ?? (customer?.zip ?? ''),
          country: quote.billToCountry ?? (customer?.country ?? 'US'),
        };
        const shipSame = quote.shipToSameAsBillTo ?? true;
        return (
          <AddressDialog
            title={`Addresses — ${quote.number}`}
            billTo={defaultBillTo}
            shipTo={{
              same: shipSame,
              name: quote.shipToName ?? '',
              address: quote.shipToAddress ?? '',
              city: quote.shipToCity ?? '',
              state: quote.shipToState ?? '',
              zip: quote.shipToZip ?? '',
              country: quote.shipToCountry ?? 'US',
            }}
            onSave={(bill, ship) => {
              updateQuote(id!, {
                billToName: bill.name, billToAddress: bill.address, billToCity: bill.city,
                billToState: bill.state, billToZip: bill.zip, billToCountry: bill.country,
                shipToSameAsBillTo: ship.same,
                shipToName: ship.same ? bill.name : ship.name,
                shipToAddress: ship.same ? bill.address : ship.address,
                shipToCity: ship.same ? bill.city : ship.city,
                shipToState: ship.same ? bill.state : ship.state,
                shipToZip: ship.same ? bill.zip : ship.zip,
                shipToCountry: ship.same ? bill.country : ship.country,
              });
              setShowAddressDialog(false);
            }}
            onClose={() => setShowAddressDialog(false)}
          />
        );
      })()}

      {/* ── Send Quote dialog ─────────────────────────────────────────── */}
      {showSendDialog && (() => {
        const customer = customers.find(c => c.id === quote.customerId);
        const primaryContact = contacts.find(c => c.customerId === quote.customerId && c.isPrimary)
          || contacts.find(c => c.customerId === quote.customerId);
        const toEmail = primaryContact?.email || customer?.email || '';
        const toName = primaryContact
          ? `${primaryContact.firstName} ${primaryContact.lastName}`
          : (quote.contactName || quote.customerName || '');
        const emailCfg = (companySettings as any).emailSettings;
        const fromEmail = emailCfg?.fromEmail || companySettings.email || '';
        const fromName  = emailCfg?.fromName  || companySettings.name  || '';
        const subject   = `Quote ${quote.number}${quote.title ? ' — ' + quote.title : ''} from ${companySettings.name}`;
        const defaultMsg = `Hi ${primaryContact?.firstName || quote.contactName?.split(' ')[0] || 'there'},\n\nPlease find your quote ${quote.number} attached. This quote is valid until ${quote.validUntil ? formatDate(quote.validUntil) : 'further notice'}.\n\nPlease don't hesitate to reach out with any questions.\n\nThank you for the opportunity,\n${fromName}`;
        return (
          <QuoteSendDialog
            quoteNumber={quote.number}
            fromEmail={fromEmail}
            fromName={fromName}
            toEmail={toEmail}
            toName={toName}
            subject={subject}
            defaultMessage={defaultMsg}
            hasEmailConfig={!!emailCfg?.host}
            onClose={() => setShowSendDialog(false)}
          />
        );
      })()}

      {/* No-account guard modal */}
      {showNoAccountGuard && (
        <NoAccountGuard
          quoteNumber={quote.number}
          onAssignAccount={() => {
            setShowNoAccountGuard(false);
            pendingNavRef.current = null;
            // Expand header and scroll to Account field
            setHeaderCollapsed(false);
            setTimeout(() => accountFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
          }}
          onDeleteQuote={() => {
            deleteQuote(id!);
            setShowNoAccountGuard(false);
            navigate(pendingNavRef.current || '/quotes');
            pendingNavRef.current = null;
          }}
          onDismiss={() => {
            setShowNoAccountGuard(false);
            pendingNavRef.current = null;
          }}
        />
      )}
    </div>
  );
};
