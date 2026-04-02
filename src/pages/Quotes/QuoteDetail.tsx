import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowRight, Trash2, ChevronDown, ChevronUp, CheckCircle, Copy } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Badge, Card, PageHeader, Modal, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { QuoteStatus } from '../../types';
import { buildQuoteTemplateHtml } from '../../utils/documentTemplates';

export const QuoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, updateQuote, deleteQuote, users, customers, contacts, companySettings, documentTemplates } = useStore();
  const [showDelete, setShowDelete] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const convertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
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

  const STATUS_OPTIONS: { value: QuoteStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'hot',     label: 'Hot 🔥',  color: 'bg-red-50 text-red-700 border-red-200' },
    { value: 'cold',    label: 'Cold ❄️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'won',     label: 'Won ✅',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'lost',    label: 'Lost ❌', color: 'bg-gray-100 text-gray-500 border-gray-200' },
  ];

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

            {/* Status pill — inline dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Badge label={quote.status} />
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </button>
              {statusOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value}
                      onClick={() => { updateQuote(id!, { status: s.value }); setStatusOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${quote.status === s.value ? 'font-semibold bg-gray-50' : 'hover:bg-gray-50'}`}
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
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => { setConvertOpen(false); navigate(`/quotes/new?cloneId=${quote.id}`); }}
                  >
                    <Copy className="w-4 h-4 text-gray-400" /> Clone as New Quote
                  </button>
                  {!quote.convertedToOrderId && (
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                      onClick={() => { setConvertOpen(false); updateQuote(id!, { status: 'won' }); navigate(`/orders/new?quoteId=${quote.id}`); }}
                    >
                      <ArrowRight className="w-4 h-4 text-gray-400" /> Convert to Order
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Delete */}
            <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDelete(true)}>
              Delete
            </Button>
          </div>
        }
      />

      {/* Quote Number + Collapsible Header */}
      <Card className="mb-6">
        <div className="px-5 py-4 flex items-center justify-between cursor-pointer select-none" onClick={() => setHeaderCollapsed(!headerCollapsed)}>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 obj-num">{quote.number}</h1>
            <span className="text-sm text-gray-500">{quote.customerName || 'No customer'}</span>
            <Badge label={quote.status} />
            {quote.convertedToOrderId && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <button onClick={e => { e.stopPropagation(); navigate(`/orders/${quote.convertedToOrderId}`); }} className="hover:underline">
                  → Order
                </button>
              </div>
            )}
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
            {headerCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
        {!headerCollapsed && (
          <div className="px-5 pb-4 pt-0 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account</p><p className="text-sm font-medium text-gray-900 mt-1">{quote.customerName || '—'}</p></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p><p className="text-sm font-medium text-gray-900 mt-1">{quote.contactName || '—'}</p></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</p><div className="mt-1"><Badge label={quote.status} /></div></div>
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
                <div className="px-5 py-8 text-center text-sm text-gray-400">No line items. <button onClick={() => navigate(`/quotes/${id}/edit`)} className="text-[#F890E7] hover:underline">Edit quote</button> to add items.</div>
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
              <div className="flex justify-between items-center"><dt className="text-gray-500">Status</dt><dd><Badge label={quote.status} /></dd></div>
            </dl>
          </Card>
        </div>
      </div>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={() => { deleteQuote(id!); navigate('/quotes'); }} title="Delete Quote" message={`Are you sure you want to delete ${quote.number}? This cannot be undone.`} />
    </div>
  );
};
