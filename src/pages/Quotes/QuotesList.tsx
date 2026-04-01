import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Badge, Table, PageHeader, EmptyState, Card } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { QuoteStatus } from '../../types';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'hot', label: 'Hot' },
  { id: 'cold', label: 'Cold' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

export const QuotesList: React.FC = () => {
  const { quotes, deleteQuote } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = quotes.filter(q => {
    const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.number.toLowerCase().includes(search.toLowerCase()) || (q.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle={`${quotes.length} total quotes`}
        actions={
          <>
            <Button variant="secondary" icon={<Download className="w-4 h-4" />}>Export</Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/quotes/new')}>New Quote</Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search quotes..." />
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            {STATUS_FILTERS.map(f => (
              <button key={f.id} onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${statusFilter === f.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-auto">{filtered.length} results</span>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<span className="text-2xl">📋</span>} title="No quotes found" description="Create your first quote to get started." action={<Button variant="primary" onClick={() => navigate('/quotes/new')}>New Quote</Button>} />
        ) : (
          <Table headers={['Quote #', 'Title', 'Customer', 'Status', 'Total', 'Created', 'Valid Until', '']}>
            {filtered.map(quote => (
              <tr key={quote.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/quotes/${quote.id}`)}>
                <td className="py-3 px-4">
                  <span className="obj-num text-sm text-gray-900">{quote.number}</span>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm font-medium text-gray-900">{quote.title}</p>
                  {quote.convertedToOrderId && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Converted to Order</span>}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{quote.customerName || '—'}</td>
                <td className="py-3 px-4"><Badge label={quote.status} /></td>
                <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatCurrency(quote.total)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{formatDate(quote.createdAt)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{quote.validUntil ? formatDate(quote.validUntil) : '—'}</td>
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/quotes/${quote.id}/edit`)} className="text-xs text-blue-600 hover:underline px-2 py-1">Edit</button>
                    {!quote.convertedToOrderId && quote.status === 'won' && (
                      <button onClick={() => navigate(`/orders/new?quoteId=${quote.id}`)} className="text-xs text-emerald-600 hover:underline px-2 py-1">→ Order</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
};
