import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../../store';
import { formatCurrency, formatDate } from '../../data/mockData';

export const QuotePrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { quotes, customers, contacts, users } = useStore();
  const quote = quotes.find(q => q.id === id);
  const customer = quote ? customers.find(c => c.id === quote.customerId) : null;
  const primaryContact = quote ? contacts.find(c => c.customerId === quote.customerId && c.isPrimary) || contacts.find(c => c.customerId === quote.customerId) : null;
  const assignedUser = quote ? users.find(u => u.id === quote.csrId) : null;

  useEffect(() => {
    document.title = quote ? `Quote ${quote.number} - QuikQuote` : 'Quote';
    // Auto-print after a short delay for print-to-PDF workflow
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [quote]);

  if (!quote) return (
    <div className="flex items-center justify-center h-screen text-gray-500">Quote not found.</div>
  );

  const validUntilDate = quote.validUntil ? new Date(quote.validUntil) : null;
  const isExpired = validUntilDate && validUntilDate < new Date();

  return (
    <div className="bg-white min-h-screen">
      <style>{`
        @media print {
          @page { margin: 0.75in; size: letter; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        body { font-family: 'Inter', system-ui, sans-serif; color: #111827; }
      `}</style>

      {/* Print button (hidden on print) */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-blue-700">
          🖨 Print / Save PDF
        </button>
        <button onClick={() => window.close()} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-gray-200">
          Close
        </button>
      </div>

      <div className="max-w-[780px] mx-auto px-10 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="text-2xl font-black text-blue-600 tracking-tight mb-1">QuikQuote</div>
            <div className="text-xs text-gray-500">Professional Print & Sign Estimating</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-gray-900 tracking-tight">QUOTE</div>
            <div className="text-lg font-bold text-blue-600 mt-1">{quote.number}</div>
            {isExpired && (
              <div className="text-xs font-bold text-red-600 mt-1 uppercase tracking-wide">EXPIRED</div>
            )}
          </div>
        </div>

        {/* Customer & Quote Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</div>
            <div className="font-bold text-gray-900 text-lg">{customer?.name || quote.customerName}</div>
            {primaryContact && (
              <div className="text-sm text-gray-600 mt-0.5">Attn: {primaryContact.firstName} {primaryContact.lastName}{primaryContact.title ? `, ${primaryContact.title}` : ''}</div>
            )}
            {customer?.address && <div className="text-sm text-gray-600 mt-1">{customer.address}</div>}
            {customer?.city && <div className="text-sm text-gray-600">{customer.city}{customer.state ? `, ${customer.state}` : ''} {customer.zip || ''}</div>}
            {primaryContact?.email && <div className="text-sm text-gray-500 mt-1">{primaryContact.email}</div>}
            {primaryContact?.phone && <div className="text-sm text-gray-500">{primaryContact.phone}</div>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Quote Date</span>
              <span className="font-semibold">{formatDate(quote.createdAt)}</span>
            </div>
            {quote.validUntil && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Valid Until</span>
                <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>{formatDate(quote.validUntil)}</span>
              </div>
            )}
            {assignedUser && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Prepared By</span>
                <span className="font-semibold">{assignedUser.firstName || assignedUser.name.split(' ')[0]} {assignedUser.lastName || assignedUser.name.split(' ').slice(1).join(' ')}</span>
              </div>
            )}
            {assignedUser?.email && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Email</span>
                <span className="text-gray-700">{assignedUser.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        {quote.title && (
          <div className="mb-6">
            <div className="text-lg font-bold text-gray-900">{quote.title}</div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#1d4ed8', color: 'white' }}>
                <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide rounded-tl-lg">#</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide">Description</th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold uppercase tracking-wide">Qty</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wide">Unit Price</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wide rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((item, i) => {
                const unitPrice = item.quantity > 0 ? item.sellPrice / item.quantity : item.sellPrice;
                return (
                  <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                    <td className="py-3 px-3 text-sm text-gray-500 align-top">{i + 1}</td>
                    <td className="py-3 px-3 align-top">
                      <div className="text-sm font-semibold text-gray-900">{item.description}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.width && item.height ? `${item.width}" × ${item.height}" · ` : ''}
                        {item.productFamily?.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-center text-gray-700 align-top">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-3 text-sm text-right text-gray-700 align-top">{formatCurrency(unitPrice)}</td>
                    <td className="py-3 px-3 text-sm text-right font-bold text-gray-900 align-top">{formatCurrency(item.sellPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.taxRate && quote.taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({quote.taxRate}%)</span>
                <span className="font-medium">{formatCurrency(quote.taxAmount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black border-t-2 border-gray-200 pt-2">
              <span>TOTAL</span>
              <span className="text-blue-600">{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</div>
          </div>
        )}

        {/* Terms */}
        <div className="border-t border-gray-200 pt-6">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Terms & Conditions</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            This quote is valid for {quote.validUntil ? `until ${formatDate(quote.validUntil)}` : '30 days from the date of issue'}.
            Prices are subject to change after the expiration date. A 50% deposit is required to begin production.
            Colors may vary slightly from proofs due to the nature of the printing process.
            All artwork must be provided in the agreed format before production begins.
            Rush orders and changes after proof approval may incur additional charges.
          </div>
        </div>

        {/* Signature Block */}
        <div className="mt-10 grid grid-cols-2 gap-12">
          <div>
            <div className="border-b-2 border-gray-300 mb-2 h-10"></div>
            <div className="text-xs text-gray-500">Customer Signature</div>
          </div>
          <div>
            <div className="border-b-2 border-gray-300 mb-2 h-10"></div>
            <div className="text-xs text-gray-500">Date</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <div className="text-xs text-gray-400">
            Quote generated by QuikQuote MIS · {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};
