import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../../store';
import { formatCurrency, formatDate } from '../../data/mockData';

export const QuotePrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { quotes, customers, contacts, users } = useStore();
  const quote = quotes.find(q => q.id === id);
  const customer = quote ? customers.find(c => c.id === quote.customerId) : null;
  const primaryContact = quote
    ? contacts.find(c => c.customerId === quote.customerId && c.isPrimary)
      || contacts.find(c => c.customerId === quote.customerId)
    : null;
  const assignedUser = quote ? users.find(u => u.id === quote.csrId) : null;

  useEffect(() => {
    document.title = quote ? `Quote ${quote.number} - QuikQuote` : 'Quote';
  }, [quote]);

  if (!quote) return (
    <div className="flex items-center justify-center h-screen text-gray-500">Quote not found.</div>
  );

  const validUntilDate = quote.validUntil ? new Date(quote.validUntil) : null;
  const isExpired = validUntilDate && validUntilDate < new Date();

  return (
    <div className="bg-white min-h-screen print-page">
      <style>{`
        @media print {
          @page {
            margin: 0.6in 0.75in;
            size: letter;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          nav, header, aside, .sidebar {
            display: none !important;
          }
          .print-page {
            box-shadow: none !important;
          }
        }
        @media screen {
          .print-page {
            max-width: 850px;
            margin: 0 auto;
            box-shadow: 0 0 40px rgba(0,0,0,0.08);
          }
        }
        .print-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .print-table td {
          padding: 10px 14px;
          font-size: 13px;
          border-bottom: 1px solid #e5e7eb;
        }
        .print-table tr:last-child td {
          border-bottom: none;
        }
      `}</style>

      {/* Print / Close buttons - hidden on print */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg hover:bg-blue-700 transition-colors"
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.history.back()}
          className="bg-white text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg hover:bg-gray-50 border border-gray-200 transition-colors"
        >
          Back
        </button>
      </div>

      <div className="px-12 py-10">
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between pb-8 border-b-2 border-gray-800">
          <div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">PrintCo Solutions</div>
            <div className="text-sm text-gray-500 mt-1 leading-relaxed">
              100 Print Ave, Miami, FL 33101<br />
              555-100-0000 &middot; admin@printco.com
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tracking-tight text-gray-900">QUOTE</div>
            <div className="text-lg font-semibold text-blue-600 mt-1">{quote.number}</div>
            {isExpired && (
              <div className="text-xs font-bold text-red-600 mt-1 uppercase tracking-wide">EXPIRED</div>
            )}
          </div>
        </div>

        {/* ── CUSTOMER & QUOTE META ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-10 py-8">
          {/* Bill To */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">Bill To</div>
            <div className="text-base font-semibold text-gray-900">
              {customer?.name || quote.customerName}
            </div>
            {primaryContact && (
              <div className="text-sm text-gray-600 mt-0.5">
                Attn: {primaryContact.firstName} {primaryContact.lastName}
                {primaryContact.title ? `, ${primaryContact.title}` : ''}
              </div>
            )}
            {customer?.address && (
              <div className="text-sm text-gray-600 mt-1">{customer.address}</div>
            )}
            {customer?.city && (
              <div className="text-sm text-gray-600">
                {customer.city}{customer.state ? `, ${customer.state}` : ''} {customer.zip || ''}
              </div>
            )}
            {primaryContact?.email && (
              <div className="text-sm text-gray-500 mt-1">{primaryContact.email}</div>
            )}
            {primaryContact?.phone && (
              <div className="text-sm text-gray-500">{primaryContact.phone}</div>
            )}
          </div>

          {/* Quote Details */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">Quote Details</div>
            <table className="text-sm w-full">
              <tbody>
                <tr>
                  <td className="text-gray-500 py-1 pr-4 font-medium">Quote Date</td>
                  <td className="text-gray-900 font-semibold text-right">{formatDate(quote.createdAt)}</td>
                </tr>
                {quote.validUntil && (
                  <tr>
                    <td className="text-gray-500 py-1 pr-4 font-medium">Valid Until</td>
                    <td className={`font-semibold text-right ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(quote.validUntil)}
                    </td>
                  </tr>
                )}
                {assignedUser && (
                  <tr>
                    <td className="text-gray-500 py-1 pr-4 font-medium">Prepared By</td>
                    <td className="text-gray-900 font-semibold text-right">
                      {assignedUser.firstName || assignedUser.name.split(' ')[0]}{' '}
                      {assignedUser.lastName || assignedUser.name.split(' ').slice(1).join(' ')}
                    </td>
                  </tr>
                )}
                {assignedUser?.email && (
                  <tr>
                    <td className="text-gray-500 py-1 pr-4 font-medium">Email</td>
                    <td className="text-gray-700 text-right">{assignedUser.email}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TITLE ──────────────────────────────────────────────── */}
        {quote.title && (
          <div className="mb-6">
            <div className="text-base font-bold text-gray-900">{quote.title}</div>
          </div>
        )}

        {/* ── LINE ITEMS TABLE ───────────────────────────────────── */}
        <table className="w-full print-table mb-2">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="rounded-tl" style={{ width: '50%' }}>Description</th>
              <th className="text-center" style={{ width: '10%' }}>Qty</th>
              <th className="text-right" style={{ width: '20%' }}>Unit Price</th>
              <th className="text-right rounded-tr" style={{ width: '20%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((item, i) => {
              const unitPrice = item.quantity > 0 ? item.sellPrice / item.quantity : item.sellPrice;
              return (
                <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                  <td>
                    <div className="font-medium text-gray-900">{item.description}</div>
                    {(item.width || item.height || item.productFamily) && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.width && item.height ? `${item.width}" x ${item.height}" ` : ''}
                        {item.productFamily ? item.productFamily.replace(/_/g, ' ') : ''}
                      </div>
                    )}
                  </td>
                  <td className="text-center text-gray-700">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="text-right text-gray-700">{formatCurrency(unitPrice)}</td>
                  <td className="text-right font-semibold text-gray-900">{formatCurrency(item.sellPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── TOTALS ─────────────────────────────────────────────── */}
        <div className="flex justify-end mt-4 mb-8">
          <div className="w-72">
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.taxRate != null && quote.taxRate > 0 && (
              <div className="flex justify-between text-sm py-1.5">
                <span className="text-gray-500">Tax ({quote.taxRate}%)</span>
                <span className="font-medium text-gray-900">{formatCurrency(quote.taxAmount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-3 mt-2">
              <span className="text-gray-900">TOTAL</span>
              <span className="text-gray-900">{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* ── NOTES ──────────────────────────────────────────────── */}
        {quote.notes && (
          <div className="mb-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">Notes</div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-l-2 border-gray-200 pl-4">
              {quote.notes}
            </div>
          </div>
        )}

        {/* ── TERMS & CONDITIONS ─────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">Terms & Conditions</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            This quote is valid {quote.validUntil
              ? `until ${formatDate(quote.validUntil)}`
              : 'for 30 days from the date of issue'}.
            Prices are subject to change after the expiration date. A 50% deposit is required to begin production.
            Colors may vary slightly from proofs due to the nature of the printing process.
            All artwork must be provided in the agreed format before production begins.
            Rush orders and changes after proof approval may incur additional charges.
          </div>
        </div>

        {/* ── SIGNATURE BLOCK ────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-2 gap-16">
          <div>
            <div className="border-b-2 border-gray-300 mb-2 h-10" />
            <div className="text-xs text-gray-500">Customer Signature</div>
          </div>
          <div>
            <div className="border-b-2 border-gray-300 mb-2 h-10" />
            <div className="text-xs text-gray-500">Date</div>
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-center">
          <div className="text-xs text-gray-400">
            PrintCo Solutions &middot; 100 Print Ave, Miami, FL 33101 &middot; 555-100-0000 &middot; admin@printco.com
          </div>
          <div className="text-[10px] text-gray-300 mt-1">
            Generated by QuikQuote &middot; {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};
