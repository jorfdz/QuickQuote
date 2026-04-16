import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useStore } from '../../store';
import { useNavigation } from '../../hooks/useNavigation';
import { Button, SearchInput, Badge, Table, PageHeader, EmptyState, Card, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { QuoteStatus } from '../../types';

// ─── Sort state ───────────────────────────────────────────────────────────────
type QuoteSortCol = 'number' | 'title' | 'customer' | 'total' | 'created' | 'status';
type SortDir = 'asc' | 'desc';

const SortIcon: React.FC<{ col: QuoteSortCol; active: QuoteSortCol; dir: SortDir }> = ({ col, active, dir }) => {
  if (col !== active) return <ChevronsUpDown className="w-3 h-3 text-gray-300 ml-0.5 inline" />;
  return dir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-[var(--brand)] ml-0.5 inline" />
    : <ChevronDown className="w-3 h-3 text-[var(--brand)] ml-0.5 inline" />;
};

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

// ─── Status filter persistence ────────────────────────────────────────────────

const STATUS_FILTER_KEY = 'quikquote-quotes-status-filter';

function loadStatusFilter(): Set<QuoteStatus> {
  try {
    const raw = localStorage.getItem(STATUS_FILTER_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      if (Array.isArray(arr)) return new Set(arr as QuoteStatus[]);
    }
  } catch {}
  return new Set<QuoteStatus>(); // empty = show all
}

function saveStatusFilter(s: Set<QuoteStatus>) {
  try { localStorage.setItem(STATUS_FILTER_KEY, JSON.stringify([...s])); } catch {}
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const QuotesList: React.FC = () => {
  const { quotes, deleteQuote, updateQuote, users } = useStore();
  const navigate = useNavigate();
  const nav = useNavigation(); // respects "open in new tab" preference

  // Filters
  const [search, setSearch] = useState('');
  // Multi-select status filter — empty set means "All"
  const [selectedStatuses, setSelectedStatuses] = useState<Set<QuoteStatus>>(loadStatusFilter);
  const [csrFilter, setCsrFilter] = useState('all');
  const [salesFilter, setSalesFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const toggleStatus = (status: QuoteStatus) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      saveStatusFilter(next);
      return next;
    });
  };

  const clearStatuses = () => {
    setSelectedStatuses(new Set());
    saveStatusFilter(new Set());
  };

  const csrUsers  = useMemo(() => users.filter(u => u.active && ['csr','admin','manager'].includes(u.role)), [users]);
  const salesUsers = useMemo(() => users.filter(u => u.active && ['sales','admin','manager'].includes(u.role)), [users]);

  const filtered = useMemo(() => quotes.filter(q => {
    if (search) {
      const s = search.toLowerCase();
      if (!q.title?.toLowerCase().includes(s) && !q.number?.toLowerCase().includes(s) && !(q.customerName || '').toLowerCase().includes(s) && !(q.contactName || '').toLowerCase().includes(s)) return false;
    }
    if (selectedStatuses.size > 0 && !selectedStatuses.has(q.status)) return false;
    if (csrFilter !== 'all' && q.csrId !== csrFilter) return false;
    if (salesFilter !== 'all' && (q as any).salesId !== salesFilter) return false;
    if (!inDateRange(q.createdAt, dateFilter)) return false;
    return true;
  }), [quotes, search, selectedStatuses, csrFilter, salesFilter, dateFilter]);

  // Sorting
  const [sortCol, setSortCol] = useState<QuoteSortCol>('created');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (col: QuoteSortCol) => {
    if (sortCol === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortCol(col); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'number')   cmp = a.number.localeCompare(b.number);
      if (sortCol === 'title')    cmp = (a.title || '').localeCompare(b.title || '');
      if (sortCol === 'customer') cmp = (a.customerName || '').localeCompare(b.customerName || '');
      if (sortCol === 'total')    cmp = (a.total || 0) - (b.total || 0);
      if (sortCol === 'created')  cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortCol === 'status')   cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const quoteToDelete = deleteConfirmId ? quotes.find(q => q.id === deleteConfirmId) : null;

  const filterCount = [
    selectedStatuses.size > 0, csrFilter !== 'all', salesFilter !== 'all', dateFilter !== 'all'
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
              <button onClick={() => { clearStatuses(); setCsrFilter('all'); setSalesFilter('all'); setDateFilter('all'); }}
                className="text-xs text-[var(--brand)] hover:underline flex-shrink-0">
                Clear {filterCount} filter{filterCount > 1 ? 's' : ''}
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} quote{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Row 2: Status pills (multi-select) + dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* "All" pill — active only when nothing is selected */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={clearStatuses}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedStatuses.size === 0
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                All
              </button>
              {STATUS_OPTIONS.map(s => {
                const active = selectedStatuses.has(s.value);
                return (
                  <button key={s.value} onClick={() => toggleStatus(s.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                      active
                        ? `${STATUS_COLORS[s.value]} border-transparent shadow-sm`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}>
                    {s.label}
                    {active && selectedStatuses.size > 1 && (
                      <span className="ml-1 opacity-70">
                        ({filtered.filter(q => q.status === s.value).length})
                      </span>
                    )}
                  </button>
                );
              })}
              {selectedStatuses.size > 0 && (
                <span className="text-[10px] text-gray-400 font-medium ml-1">
                  {selectedStatuses.size} selected
                </span>
              )}
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
          <Table headers={[
            <button key="number"   onClick={() => toggleSort('number')}   className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Quote # <SortIcon col="number"   active={sortCol} dir={sortDir} /></button>,
            <button key="title"    onClick={() => toggleSort('title')}    className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Title <SortIcon col="title"    active={sortCol} dir={sortDir} /></button>,
            <button key="customer" onClick={() => toggleSort('customer')} className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Customer <SortIcon col="customer" active={sortCol} dir={sortDir} /></button>,
            'Buyer',
            <button key="total"   onClick={() => toggleSort('total')}   className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Total <SortIcon col="total"   active={sortCol} dir={sortDir} /></button>,
            <button key="created" onClick={() => toggleSort('created')} className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Created <SortIcon col="created" active={sortCol} dir={sortDir} /></button>,
            <button key="status"  onClick={() => toggleSort('status')}  className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Status <SortIcon col="status"  active={sortCol} dir={sortDir} /></button>,
            '',
          ]}>
            {sorted.map(quote => (
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
