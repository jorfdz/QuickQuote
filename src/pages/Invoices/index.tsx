import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, DollarSign } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Badge, Table, PageHeader, Card } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

const STATUS_FILTERS = [{ id: 'all', label: 'All' }, { id: 'draft', label: 'Draft' }, { id: 'sent', label: 'Sent' }, { id: 'posted', label: 'Posted' }, { id: 'paid', label: 'Paid' }, { id: 'overdue', label: 'Overdue' }];

export const Invoices: React.FC = () => {
  const { invoices, updateInvoice } = useStore();
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
        <Table headers={['Invoice #', 'Customer', 'Status', 'Total', 'Due Date', 'Paid Date', '']}>
          {filtered.map(inv => (
            <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
              <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-500">{inv.number}</td>
              <td className="py-3 px-4 text-sm font-medium text-gray-900">{inv.customerName}</td>
              <td className="py-3 px-4"><Badge label={inv.status} /></td>
              <td className="py-3 px-4 text-sm font-bold text-gray-900">{formatCurrency(inv.total)}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
              <td className="py-3 px-4 text-sm text-emerald-600">{inv.paidDate ? formatDate(inv.paidDate) : '—'}</td>
              <td className="py-3 px-4 flex gap-2">
                {inv.status === 'draft' && <Button size="sm" variant="primary" onClick={() => updateInvoice(inv.id, { status: 'sent' })}>Send</Button>}
                {['sent', 'posted'].includes(inv.status) && <Button size="sm" variant="success" onClick={() => updateInvoice(inv.id, { status: 'paid', paidDate: new Date().toISOString().split('T')[0], paidAmount: inv.total })}>Mark Paid</Button>}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};
