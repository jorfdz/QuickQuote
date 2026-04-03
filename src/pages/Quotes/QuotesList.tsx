import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { useStore } from '../../store';
import { useNavigation } from '../../hooks/useNavigation';
import { Button, SearchInput, Badge, Table, PageHeader, EmptyState, Card, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { QuoteStatus } from '../../types';

// ─── Status options ──────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'hot',     label: 'Hot' },
  { value: 'cold',    label: 'Cold' },
  { value: 'won',     label: 'Won' },
  { value: 'lost',    label: 'Lost' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500 text-white',
  hot:     'bg-red-500 text-white',
  cold:    'bg-sky-500 text-white',
  won:     'bg-emerald-500 text-white',
  lost:    'bg-gray-500 text-white',
};

// ─── Date range options ───────────────────────────────────────────────────────

const DATE_OPTIONS = [
  { id: 'all',     label: 'All Time' },
  { id: 'week',    label: 'This Week' },
  { id: 'lastweek', label: 'Last Week' },
  { id: 'month',   label: 'This Month' },
  { id: 'last30',  label: 'Last 30 Days' },
  { id: 'last90',  label: 'Last 90 Days' },
  { id: 'last6m',  label: 'Last 6 Months' },
];

function inDateRange(dateStr: string, range: string): boolean {
  if (range === 'all') return true;
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  const ms = (n: number) => n * 24 * 60 * 60 * 1000;
  if (range === 'last30') return d >= now - ms(30);
  if (range === 'last90') return d >= now - ms(90);
  if (range === 'last6m') return d >= now - ms(180);
  const nowDate = new Date();
  if (range === 'week') {
    const start = new Date(nowDate); start.setDate(nowDate.getDate() - nowDate.getDay());
    start.setHours(0,0,0,0);
    return d >= start.getTime();
  }
  if (range === 'lastweek') {
    const endOfLast = new Date(nowDate); endOfLast.setDate(nowDate.getDate() - nowDate.getDay());
    endOfLast.setHours(0,0,0,0);
    const startOfLast = new Date(endOfLast); startOfLast.setDate(endOfLast.getDate() - 7);
    return d >= startOfLast.getTime() && d < endOfLast.getTime();
  }
  if (range === 'month') {
    const start = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    return d >= start.getTime();
  }
  return true;
}

// ─── Status inline selector ───────────────────────────────────────────────────
const StatusPicker: React.FC<{
  current: QuoteStatus;
  onSelect: (s: QuoteStatus) => void;
}> = ({ current, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${STATUS_COLORS[current] || 'bg-gray-200 text-gray-700'}`}
      >
        {STATUS_OPTIONS.find(s => s.value === current)?.label || current}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden min-w-[120px]">
          {STATUS_OPTIONS.map(s => (
            <button key={s.value}
              onClick={e => { e.stopPropagation(); onSelect(s.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                s.value === current ? 'bg-gray-50 font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${STATUS_COLORS[s.value]}`} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const QuotesList: React.FC = () => {
  const { quotes, deleteQuote, updateQuote, users } = useStore();
  const navigate = useNavigate();
  const nav = useNavigation(); // respects "open in new tab" preference

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [csrFilter, setCsrFilter] = useState('all');
  const [salesFilter, setSalesFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const csrUsers  = useMemo(() => users.filter(u => u.active && ['csr','admin','manager'].includes(u.role)), [users]);
  const salesUsers = useMemo(() => users.filter(u => u.active && ['sales','admin','manager'].includes(u.role)), [users]);

  const filtered = useMemo(() => quotes.filter(q => {
    if (search) {
      const s = search.toLowerCase();
      if (!q.title?.toLowerCase().includes(s) && !q.number?.toLowerCase().includes(s) && !(q.customerName || '').toLowerCase().includes(s) && !(q.contactName || '').toLowerCase().includes(s)) return false;
    }
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (csrFilter !== 'all' && q.csrId !== csrFilter) return false;
    if (salesFilter !== 'all' && (q as any).salesId !== salesFilter) return false;
    if (!inDateRange(q.createdAt, dateFilter)) return false;
    return true;
  }), [quotes, search, statusFilter, csrFilter, salesFilter, dateFilter]);

  const quoteToDelete = deleteConfirmId ? quotes.find(q => q.id === deleteConfirmId) : null;

  const filterCount = [
    statusFilter !== 'all', csrFilter !== 'all', salesFilter !== 'all', dateFilter !== 'all'
  ].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle={`${quotes.length} total`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => nav('/quotes/new')}>
            New Quote
          </Button>
        }
      />

      {/* ── Filter bar ── */}
      <Card className="mb-4">
        <div className="px-4 py-3 space-y-3">
          {/* Row 1: Search + active filter count */}
          <div className="flex items-center gap-3 flex-wrap">
            <SearchInput value={search} onChange={setSearch} placeholder="Search quote #, title, customer…" />
            {filterCount > 0 && (
              <button onClick={() => { setStatusFilter('all'); setCsrFilter('all'); setSalesFilter('all'); setDateFilter('all'); }}
                className="text-xs text-[var(--brand)] hover:underline flex-shrink-0">
                Clear {filterCount} filter{filterCount > 1 ? 's' : ''}
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} quote{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Row 2: Status pills + dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {[{ id: 'all', label: 'All' }, ...STATUS_OPTIONS.map(s => ({ id: s.value, label: s.label }))].map(f => (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                    statusFilter === f.id
                      ? (f.id === 'all' ? 'bg-gray-800 text-white border-gray-800' : `${STATUS_COLORS[f.id]} border-transparent`)
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200" />

            {/* CSR filter */}
            <select value={csrFilter} onChange={e => setCsrFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--brand)] bg-white text-gray-600">
              <option value="all">All CSRs</option>
              {csrUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            {/* Sales Rep filter */}
            <select value={salesFilter} onChange={e => setSalesFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--brand)] bg-white text-gray-600">
              <option value="all">All Sales Reps</option>
              {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            {/* Date filter */}
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--brand)] bg-white text-gray-600">
              {DATE_OPTIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📋</span>}
            title="No quotes found"
            description={filterCount > 0 ? 'Try adjusting your filters.' : 'Create your first quote to get started.'}
            action={<Button variant="primary" onClick={() => nav('/quotes/new')}>New Quote</Button>}
          />
        ) : (
          <Table headers={['Quote #', 'Title', 'Customer', 'Buyer', 'Total', 'Created', 'Status', '']}>
            {filtered.map(quote => (
              <tr key={quote.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/quotes/${quote.id}`)}>

                {/* Quote # */}
                <td className="py-3 px-4">
                  <span className="obj-num text-sm font-semibold text-gray-800">{quote.number}</span>
                </td>

                {/* Title */}
                <td className="py-3 px-4 max-w-[180px]">
                  <p className="text-sm font-medium text-gray-900 truncate">{quote.title || '—'}</p>
                  {quote.convertedToOrderId && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">→ Order</span>
                  )}
                </td>

                {/* Customer */}
                <td className="py-3 px-4 text-sm text-gray-700">{quote.customerName || '—'}</td>

                {/* Buyer (contact) */}
                <td className="py-3 px-4 text-sm text-gray-500">{quote.contactName || '—'}</td>

                {/* Total */}
                <td className="py-3 px-4 text-sm font-semibold text-gray-900 num">{formatCurrency(quote.total)}</td>

                {/* Created */}
                <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(quote.createdAt)}</td>

                {/* Status — inline changeable */}
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <StatusPicker current={quote.status} onSelect={status => updateQuote(quote.id, { status })} />
                </td>

                {/* Delete action */}
                <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setDeleteConfirmId(quote.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete quote"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { if (deleteConfirmId) { deleteQuote(deleteConfirmId); setDeleteConfirmId(null); } }}
        title="Delete Quote"
        message={quoteToDelete ? `Delete ${quoteToDelete.number}${quoteToDelete.title ? ` — ${quoteToDelete.title}` : ''}? This cannot be undone.` : 'Delete this quote?'}
        confirmLabel="Delete"
      />
    </div>
  );
};
