import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowRight, Trash2, ChevronDown, ChevronUp, CheckCircle, Copy, Clock } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Badge, Card, PageHeader, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { QuoteStatus } from '../../types';
import { buildQuoteTemplateHtml } from '../../utils/documentTemplates';

const STATUS_OPTIONS: { value: QuoteStatus; label: string; badge: string }[] = [
  { value: 'pending', label: 'Pending', badge: 'pending' },
  { value: 'hot',     label: 'Hot 🔥',  badge: 'hot' },
  { value: 'cold',    label: 'Cold ❄️', badge: 'cold' },
  { value: 'won',     label: 'Won ✅',  badge: 'won' },
  { value: 'lost',    label: 'Lost ❌', badge: 'lost' },
];

/** Format elapsed time from an ISO string into a human-readable string */
function formatElapsed(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (days >= 1) return `${days}d ${remHours}h`;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  if (totalMinutes >= 1) return `${totalMinutes}m`;
  return 'just now';
}

/** Format an ISO date as short human-readable: "Apr 2 at 3:45 PM" */
function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' at '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const QuoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, updateQuote, deleteQuote, users, customers, contacts, companySettings, documentTemplates } = useStore();
  const [showDelete, setShowDelete] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);
  const [convertOpen, setConvertOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (convertRef.current && !convertRef.current.contains(e.target as Node)) setConvertOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const quote = quotes.find(q => q.id === id);
  if (!quote) return <div className="text-center py-16 text-gray-400">Quote not found</div>;

  const csr = users.find(u => u.id === quote.csrId);
  const salesRep = users.find(u => u.id === quote.salesId);
  const customer = customers.find(c => c.id === quote.customerId) || null;
  const primaryContact = contacts.find(c => c.customerId === quote.customerId && c.isPrimary)
    || contacts.find(c => c.customerId === quote.customerId)
    || null;

  const printHtml = useMemo(() => buildQuoteTemplateHtml({
    template: documentTemplates.quote,
    company: companySettings,
    quote,
    customer,
    contact: primaryContact,
    assignedUser: csr || null,
  }), [companySettings, csr, customer, documentTemplates.quote, primaryContact, quote]);

  const openPrintWindow = () => {
    const blob = new Blob([printHtml], { type: 'text/html' });
    const printUrl = URL.createObjectURL(blob);
    const w = window.open(printUrl, '_blank');
    if (!w) { URL.revokeObjectURL(printUrl); return; }
    w.addEventListener('load', () => { w.focus(); setTimeout(() => w.print(), 150); setTimeout(() => URL.revokeObjectURL(printUrl), 60000); }, { once: true });
  };

  return (
    <div>
      <PageHeader
        title={quote.title}
        subtitle={`${quote.number} · ${quote.customerName || 'No customer'}`}
        back={() => navigate('/quotes')}
        actions={
          <div className="flex items-center gap-2">
            {/* Print PDF */}
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={openPrintWindow}>
              Print PDF
            </Button>

            {/* Clone */}
            <Button variant="secondary" size="sm" icon={<Copy className="w-4 h-4" />}
              onClick={() => navigate(`/quotes/new?cloneId=${quote.id}`)}>
              Clone
            </Button>

            {/* Convert to Order */}
            {!quote.convertedToOrderId && (
              <Button variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => { updateQuote(id!, { status: 'won' }); navigate(`/orders/new?quoteId=${quote.id}`); }}>
                Convert to Order
              </Button>
            )}

            {/* Delete */}
            <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDelete(true)}>
              Delete
            </Button>
          </div>
        }
      />

      {/* Quote Number + Collapsible Header — STATUS lives here */}
      <Card className="mb-6">
        {/* Always-visible collapsed row */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 obj-num flex-shrink-0">{quote.number}</h1>
            <span className="text-sm text-gray-500 truncate">{quote.customerName || 'No customer'}</span>

            {/* Status pills — click one to change status immediately */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => updateQuote(id!, { status: s.value })}
                  title={`Set status to ${s.label}`}
                  className={`transition-all rounded-full ${
                    quote.status === s.value
                      ? 'opacity-100 scale-110 shadow-sm'
                      : 'opacity-35 hover:opacity-60 hover:scale-105'
                  }`}
                >
                  <Badge label={s.badge} />
                </button>
              ))}
            </div>

            {/* Time on this stage */}
            {(quote.statusChangedAt || quote.createdAt) && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-medium">
                    {formatElapsed(quote.statusChangedAt || quote.createdAt)}
                  </span>
                </div>
                <span className="text-gray-200 text-[10px]">·</span>
                <span className="text-[10px] text-gray-400">
                  Since {formatShortDateTime(quote.statusChangedAt || quote.createdAt)}
                </span>
              </div>
            )}

            {quote.convertedToOrderId && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium flex-shrink-0">
                <CheckCircle className="w-3.5 h-3.5" />
                <button onClick={() => navigate(`/orders/${quote.convertedToOrderId}`)} className="hover:underline">
                  → View Order
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setHeaderCollapsed(!headerCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 ml-3 flex-shrink-0"
            title={headerCollapsed ? 'Expand details' : 'Collapse details'}
          >
            {headerCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        {/* Expandable details */}
        {!headerCollapsed && (
          <div className="px-5 pb-4 pt-0 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account</p><p className="text-sm font-medium text-gray-900 mt-1">{quote.customerName || '—'}</p></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p><p className="text-sm font-medium text-gray-900 mt-1">{quote.contactName || '—'}</p></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Valid Until</p><p className="text-sm font-medium text-gray-900 mt-1">{quote.validUntil ? formatDate(quote.validUntil) : '—'}</p></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Created</p><p className="text-sm font-medium text-gray-900 mt-1">{formatDate(quote.createdAt)}</p></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">CSR</p><p className="text-sm font-medium text-gray-900 mt-1">{csr?.name || '—'}</p></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sales Rep</p><p className="text-sm font-medium text-gray-900 mt-1">{salesRep?.name || '—'}</p></div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Line items */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/quotes/${id}/edit`)}>
                Edit Quote
              </Button>
            </div>
            <div className="divide-y divide-gray-50">
              {quote.lineItems.map((item, i) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 mr-2">#{i + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{item.description}</span>
                      <p className="text-xs text-gray-500 mt-1">{item.quantity} {item.unit} {item.width && item.height ? `· ${item.width}" × ${item.height}"` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 num">{formatCurrency(item.sellPrice)}</p>
                      <p className="text-xs text-gray-400">Cost: {formatCurrency(item.totalCost)} · {item.markup}% markup</p>
                    </div>
                  </div>
                </div>
              ))}
              {quote.lineItems.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  No line items.{' '}
                  <button onClick={() => navigate(`/quotes/${id}/edit`)} className="text-[#F890E7] hover:underline">Edit quote</button>
                  {' '}to add items.
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
              <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3"><span>Total</span><span className="text-[#F890E7] num">{formatCurrency(quote.total)}</span></div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Customer</dt><dd className="text-gray-900 font-medium">{quote.customerName || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd className="text-gray-900">{formatDate(quote.createdAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Valid Until</dt><dd className="text-gray-900">{quote.validUntil ? formatDate(quote.validUntil) : '—'}</dd></div>
            </dl>
          </Card>
        </div>
      </div>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={() => { deleteQuote(id!); navigate('/quotes'); }}
        title="Delete Quote"
        message={`Are you sure you want to delete ${quote.number}? This cannot be undone.`} />
    </div>
  );
};
