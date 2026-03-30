import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowRight, Printer, Copy, Trash2, CheckCircle } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Badge, Card, PageHeader, Modal, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { QuoteStatus } from '../../types';

export const QuoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, updateQuote, deleteQuote } = useStore();
  const [showDelete, setShowDelete] = useState(false);
  const [statusModal, setStatusModal] = useState(false);

  const quote = quotes.find(q => q.id === id);
  if (!quote) return <div className="text-center py-16 text-gray-400">Quote not found</div>;

  const statuses: { value: QuoteStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' }, { value: 'hot', label: 'Hot 🔥' },
    { value: 'cold', label: 'Cold ❄️' }, { value: 'won', label: 'Won ✅' }, { value: 'lost', label: 'Lost ❌' },
  ];

  return (
    <div>
      <PageHeader
        title={quote.title}
        subtitle={`${quote.number} · ${quote.customerName || 'No customer'}`}
        back={() => navigate('/quotes')}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setStatusModal(true)}>Change Status</Button>
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={() => window.open(`/quotes/${id}/print`, '_blank')}>Print PDF</Button>
            {!quote.convertedToOrderId && (
              <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => { updateQuote(id!, { status: 'won' }); navigate(`/orders/new?quoteId=${quote.id}`); }}>
                Convert to Order
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Status bar */}
          <Card className="p-4 flex items-center gap-4">
            <Badge label={quote.status} />
            {quote.convertedToOrderId && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Converted to Order</span>
                <button onClick={() => navigate(`/orders/${quote.convertedToOrderId}`)} className="text-sm underline">View Order</button>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => navigate(`/quotes/${id}/edit`)}>Edit</Button>
              <Button variant="ghost" size="sm" icon={<Copy className="w-3.5 h-3.5" />}>Clone</Button>
              <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setShowDelete(true)}>Delete</Button>
            </div>
          </Card>

          {/* Line items */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
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
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(item.sellPrice)}</p>
                      <p className="text-xs text-gray-400">Cost: {formatCurrency(item.totalCost)} · {item.markup}% markup</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          {(quote.notes || quote.internalNotes) && (
            <Card className="p-5">
              <div className="grid grid-cols-2 gap-4">
                {quote.notes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer Notes</p><p className="text-sm text-gray-700">{quote.notes}</p></div>}
                {quote.internalNotes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Internal Notes</p><p className="text-sm text-gray-700">{quote.internalNotes}</p></div>}
              </div>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Pricing Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
              {quote.taxRate && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax ({quote.taxRate}%)</span><span>{formatCurrency(quote.taxAmount || 0)}</span></div>}
              <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3"><span>Total</span><span className="text-blue-600">{formatCurrency(quote.total)}</span></div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Customer</dt><dd className="text-gray-900 font-medium">{quote.customerName || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd className="text-gray-900">{formatDate(quote.createdAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Valid Until</dt><dd className="text-gray-900">{quote.validUntil ? formatDate(quote.validUntil) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><Badge label={quote.status} /></dd></div>
            </dl>
          </Card>
        </div>
      </div>

      {/* Status modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Change Quote Status" size="sm">
        <div className="space-y-2">
          {statuses.map(s => (
            <button key={s.value} onClick={() => { updateQuote(id!, { status: s.value }); setStatusModal(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${quote.status === s.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={() => { deleteQuote(id!); navigate('/quotes'); }} title="Delete Quote" message={`Are you sure you want to delete ${quote.number}? This cannot be undone.`} />
    </div>
  );
};
