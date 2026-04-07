import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Copy } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Card, PageHeader, Table, Badge, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

export const History: React.FC = () => {
  const { orders } = useStore();
  const navigate = useNavigate();
  const completed = orders.filter(o => ['completed', 'canceled'].includes(o.status));
  const [reorderTarget, setReorderTarget] = useState<typeof completed[0] | null>(null);
  const [cloneQuoteTarget, setCloneQuoteTarget] = useState<typeof completed[0] | null>(null);

  return (
    <div>
      <PageHeader title="Job History" subtitle="Completed and canceled orders" />
      <Card>
        <Table headers={['Order #', 'Title', 'Customer', 'Status', 'Total', 'Date', 'Invoice', 'Actions']}>
          {completed.length === 0 ? <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400">No completed orders yet</td></tr> :
            completed.map(o => (
              <tr
                key={o.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <td className="py-3 px-4">
                  <span className="obj-num text-sm text-gray-900">{o.number}</span>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{o.title}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{o.customerName || '—'}</td>
                <td className="py-3 px-4"><Badge label={o.status} /></td>
                <td className="py-3 px-4 text-sm font-bold">{formatCurrency(o.total)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{formatDate(o.updatedAt)}</td>
                <td className="py-3 px-4">{o.invoiceId ? <span className="obj-num text-xs text-emerald-600 font-medium">{o.invoiceId} ✓</span> : '—'}</td>
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setReorderTarget(o)}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded-md hover:bg-blue-50 transition-colors font-medium"
                      title="Re-order"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Re-order
                    </button>
                    <button
                      onClick={() => setCloneQuoteTarget(o)}
                      className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 hover:underline px-2 py-1 rounded-md hover:bg-violet-50 transition-colors font-medium"
                      title="Clone as Quote"
                    >
                      <Copy className="w-3 h-3" />
                      Clone as Quote
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </Table>
      </Card>
      <ConfirmDialog
        isOpen={!!reorderTarget}
        onClose={() => setReorderTarget(null)}
        onConfirm={() => { if (reorderTarget) navigate(`/orders/new?cloneOrderId=${reorderTarget.id}`); setReorderTarget(null); }}
        title="Re-order"
        message={reorderTarget ? `Create a new Order based on ${reorderTarget.number}${reorderTarget.title ? ` — ${reorderTarget.title}` : ''}?` : ''}
        confirmLabel="Re-order"
      />
      <ConfirmDialog
        isOpen={!!cloneQuoteTarget}
        onClose={() => setCloneQuoteTarget(null)}
        onConfirm={() => { if (cloneQuoteTarget) navigate(`/quotes/new?cloneId=${cloneQuoteTarget.id}&source=order`); setCloneQuoteTarget(null); }}
        title="Clone as Quote"
        message={cloneQuoteTarget ? `Create a new Quote from Order ${cloneQuoteTarget.number}${cloneQuoteTarget.title ? ` — ${cloneQuoteTarget.title}` : ''}?` : ''}
        confirmLabel="Clone as Quote"
      />
    </div>
  );
};
