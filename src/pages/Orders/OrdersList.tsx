import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Badge, Table, PageHeader, EmptyState, Card } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'on_hold', label: 'On Hold' },
  { id: 'completed', label: 'Completed' },
  { id: 'canceled', label: 'Canceled' },
];

export const OrdersList: React.FC = () => {
  const { orders } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.number.toLowerCase().includes(search.toLowerCase()) || (o.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    on_hold: orders.filter(o => o.status === 'on_hold').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${orders.length} total orders`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/orders/new')}>New Order</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Active', value: counts.in_progress, color: 'text-blue-600 bg-blue-50' },
          { label: 'On Hold', value: counts.on_hold, color: 'text-amber-600 bg-amber-50' },
          { label: 'Completed', value: counts.completed, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Revenue', value: formatCurrency(orders.reduce((s, o) => s + o.total, 0)), color: 'text-gray-900 bg-gray-50' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search orders..." />
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            {STATUS_FILTERS.map(f => (
              <button key={f.id} onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${statusFilter === f.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<span className="text-2xl">📦</span>} title="No orders found" description="Create your first order to get started." action={<Button variant="primary" onClick={() => navigate('/orders/new')}>New Order</Button>} />
        ) : (
          <Table headers={['Order #', 'Title', 'Customer', 'Status', 'Total', 'Due Date', 'Quote #', '']}>
            {filtered.map(order => {
              const isOverdue = order.dueDate && order.status === 'in_progress' && new Date(order.dueDate) < new Date();
              return (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/orders/${order.id}`)}>
                  <td className="py-3 px-4 obj-num text-xs text-gray-500">{order.number}</td>
                  <td className="py-3 px-4"><p className="text-sm font-medium text-gray-900">{order.title}</p></td>
                  <td className="py-3 px-4 text-sm text-gray-600">{order.customerName || '—'}</td>
                  <td className="py-3 px-4"><Badge label={order.status} /></td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>{order.dueDate ? formatDate(order.dueDate) : '—'}</span>
                    {isOverdue && <span className="ml-1 text-xs text-red-500">⚠️ Overdue</span>}
                  </td>
                  <td className="py-3 px-4 text-xs obj-num text-gray-400">{order.quoteNumber || '—'}</td>
                  <td className="py-3 px-4">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>View</Button>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
};
