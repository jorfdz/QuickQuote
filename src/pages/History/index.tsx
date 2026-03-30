import React from 'react';
import { useStore } from '../../store';
import { Card, PageHeader, Table, Badge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

export const History: React.FC = () => {
  const { orders } = useStore();
  const completed = orders.filter(o => ['completed', 'canceled'].includes(o.status));
  return (
    <div>
      <PageHeader title="Job History" subtitle="Completed and canceled orders" />
      <Card>
        <Table headers={['Order #', 'Title', 'Customer', 'Status', 'Total', 'Date', 'Invoice']}>
          {completed.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No completed orders yet</td></tr> :
            completed.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-500">{o.number}</td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{o.title}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{o.customerName || '—'}</td>
                <td className="py-3 px-4"><Badge label={o.status} /></td>
                <td className="py-3 px-4 text-sm font-bold">{formatCurrency(o.total)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{formatDate(o.updatedAt)}</td>
                <td className="py-3 px-4">{o.invoiceId ? <span className="text-xs text-emerald-600 font-mono font-medium">{o.invoiceId} ✓</span> : '—'}</td>
              </tr>
            ))}
        </Table>
      </Card>
    </div>
  );
};
