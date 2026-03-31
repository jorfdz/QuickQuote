import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Badge, Button, Card, PageHeader, SearchInput, Table } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import { summarizePOReceiving } from '../../utils/purchaseOrders';

export const PurchaseOrders: React.FC = () => {
  const navigate = useNavigate();
  const { purchaseOrders, vendors } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => purchaseOrders.filter((po) => {
    const vendor = vendors.find((item) => item.id === po.vendorId);
    const q = search.toLowerCase();
    const matchesSearch = !search
      || po.number.toLowerCase().includes(q)
      || (vendor?.name || '').toLowerCase().includes(q)
      || (po.orderId || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [purchaseOrders, vendors, search, statusFilter]);

  const openCount = purchaseOrders.filter((po) => po.status !== 'received' && po.status !== 'canceled').length;
  const receivedCount = purchaseOrders.filter((po) => po.status === 'received').length;
  const lateCount = purchaseOrders.filter((po) => po.expectedDate && po.status !== 'received' && po.status !== 'canceled' && new Date(po.expectedDate) < new Date()).length;

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle={`${purchaseOrders.length} purchase orders`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/purchase-orders/new')}>New PO</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Open</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{openCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Received</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{receivedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Late</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{lateCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Spend</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(purchaseOrders.reduce((sum, po) => sum + po.total, 0))}</p>
        </Card>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search purchase orders..." />
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            {['all', 'draft', 'sent', 'acknowledged', 'partial', 'received', 'canceled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${statusFilter === status ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <Table headers={['PO #', 'Vendor', 'Status', 'Total', 'Expected', 'Receiving', 'Order']}>
          {filtered.map((po) => {
            const vendor = vendors.find((item) => item.id === po.vendorId);
            const receiving = summarizePOReceiving(po);
            return (
              <tr key={po.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-500">{po.number}</td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{vendor?.name || '—'}</td>
                <td className="py-3 px-4"><Badge label={po.status} /></td>
                <td className="py-3 px-4 text-sm font-bold text-gray-900">{formatCurrency(po.total)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{po.expectedDate ? formatDate(po.expectedDate) : '—'}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{receiving.received}/{receiving.ordered}</td>
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{po.orderId || '—'}</td>
              </tr>
            );
          })}
          {filtered.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No purchase orders found</td></tr>}
        </Table>
      </Card>
    </div>
  );
};
