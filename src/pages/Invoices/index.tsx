import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, DollarSign, ExternalLink } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Badge, Table, PageHeader, Card } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

const STATUS_FILTERS = [{ id: 'all', label: 'All' }, { id: 'draft', label: 'Draft' }, { id: 'sent', label: 'Sent' }, { id: 'posted', label: 'Posted' }, { id: 'paid', label: 'Paid' }, { id: 'overdue', label: 'Overdue' }];

export const Invoices: React.FC = () => {
  const { invoices, updateInvoice, orders } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = invoices.filter(i => {
    const matchSearch = !search || i.number.toLowerCase().includes(search.toLowerCase()) || i.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => ['draft', 'sent', 'posted'].includes(i.status)).reduce((s, i) => s + i.total, 0);

  // Helper to find source order for an invoice
  const getSourceOrder = (inv: typeof invoices[0]) => {
    if (inv.orderIds && inv.orderIds.length > 0) {
      return orders.find(o => o.id === inv.orderIds[0]);
    }
    return undefined;
  };

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`${invoices.length} invoices`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/invoices/new')}>New Invoice</Button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card className="p-4"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Collected</p><p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</p><p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Invoiced</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalPaid + totalPending)}</p></Card>
      </div>
      <Card className="mb-4"><div className="flex items-center gap-4 px-4 py-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoices..." />
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
          {STATUS_FILTERS.map(f => <button key={f.id} onClick={() => setStatusFilter(f.id)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${statusFilter === f.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{f.label}</button>)}
        </div>
      </div></Card>
      <Card>
        <Table headers={['Invoice #', 'Customer', 'Status', 'Total', 'Due Date', 'Paid Date', 'Source Order', '']}>
          {filtered.map(inv => {
            const sourceOrder = getSourceOrder(inv);
            return (
              <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/invoices/${inv.id}`)}>
                <td className="py-3 px-4">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }} className="obj-num text-sm text-gray-900 hover:text-blue-600">
                    {inv.number}
                  </button>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{inv.customerName}</td>
                <td className="py-3 px-4"><Badge label={inv.status} /></td>
                <td className="py-3 px-4 text-sm font-bold text-gray-900">{formatCurrency(inv.total)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                <td className="py-3 px-4 text-sm text-emerald-600">{inv.paidDate ? formatDate(inv.paidDate) : '—'}</td>
                <td className="py-3 px-4">
                  {sourceOrder ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/orders/${sourceOrder.id}`); }}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {sourceOrder.number}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}>View</Button>
                  {inv.status === 'draft' && <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); updateInvoice(inv.id, { status: 'sent' }); }}>Send</Button>}
                  {['sent', 'posted'].includes(inv.status) && <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); updateInvoice(inv.id, { status: 'paid', paidDate: new Date().toISOString().split('T')[0], paidAmount: inv.total }); }}>Mark Paid</Button>}
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
};
