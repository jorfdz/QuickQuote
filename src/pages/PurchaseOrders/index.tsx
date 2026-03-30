import React from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../../store';
import { Card, PageHeader, Table, Badge, Button } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

export const PurchaseOrders: React.FC = () => {
  const { purchaseOrders, vendors } = useStore();
  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle={`${purchaseOrders.length} purchase orders`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />}>New PO</Button>}
      />
      <Card>
        <Table headers={['PO #', 'Vendor', 'Status', 'Total', 'Expected', 'Received', 'Order']}>
          {purchaseOrders.map(po => {
            const vendor = vendors.find(v => v.id === po.vendorId);
            return (
              <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-500">{po.number}</td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{vendor?.name || '—'}</td>
                <td className="py-3 px-4"><Badge label={po.status} /></td>
                <td className="py-3 px-4 text-sm font-bold text-gray-900">{formatCurrency(po.total)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{po.expectedDate ? formatDate(po.expectedDate) : '—'}</td>
                <td className="py-3 px-4 text-sm text-emerald-600">{po.receivedDate ? formatDate(po.receivedDate) : '—'}</td>
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{po.orderId || '—'}</td>
              </tr>
            );
          })}
          {purchaseOrders.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No purchase orders yet</td></tr>}
        </Table>
      </Card>
    </div>
  );
};
