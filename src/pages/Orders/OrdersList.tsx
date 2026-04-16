import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp, ChevronsUpDown, AlertTriangle } from 'lucide-react';

// ─── Sort state ───────────────────────────────────────────────────────────────
type OrderSortCol = 'number' | 'title' | 'customer' | 'total' | 'dueDate' | 'created' | 'status';
type SortDir = 'asc' | 'desc';

const SortIcon: React.FC<{ col: OrderSortCol; active: OrderSortCol; dir: SortDir }> = ({ col, active, dir }) => {
  if (col !== active) return <ChevronsUpDown className="w-3 h-3 text-gray-300 ml-0.5 inline" />;
  return dir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-[var(--brand)] ml-0.5 inline" />
    : <ChevronDown className="w-3 h-3 text-[var(--brand)] ml-0.5 inline" />;
};
import { useStore } from '../../store';
import { useNavigation } from '../../hooks/useNavigation';
import { Button, SearchInput, Table, PageHeader, EmptyState, Card, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { OrderStatus } from '../../types';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold',     label: 'On Hold'     },
  { value: 'completed',   label: 'Completed'   },
  { value: 'canceled',    label: 'Canceled'    },
];

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-blue-500 text-white',
  on_hold:     'bg-amber-500 text-white',
  completed:   'bg-emerald-500 text-white',
  canceled:    'bg-gray-400 text-white',
};

// ─── Date range options ───────────────────────────────────────────────────────

const DATE_OPTIONS = [
  { id: 'all',    label: 'All Time'     },
  { id: 'week',   label: 'This Week'    },
  { id: 'month',  label: 'This Month'   },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'last90', label: 'Last 90 Days' },
];

function inDateRange(dateStr: string, range: string): boolean {
  if (range === 'all') return true;
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  const ms = (n: number) => n * 86400000;
  if (range === 'last30') return d >= now - ms(30);
  if (range === 'last90') return d >= now - ms(90);
  const nowDate = new Date();
  if (range === 'week') {
    const start = new Date(nowDate);
    start.setDate(nowDate.getDate() - nowDate.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start.getTime();
  }
  if (range === 'month') {
    return d >= new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();
  }
  return true;
}

// ─── Inline status picker ─────────────────────────────────────────────────────

const StatusPicker: React.FC<{
  current: OrderStatus;
  onSelect: (s: OrderStatus) => void;
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

  const label = STATUS_OPTIONS.find(s => s.value === current)?.label ?? current;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${STATUS_COLORS[current] ?? 'bg-gray-200 text-gray-700'}`}
      >
        {label}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden min-w-[130px]">
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

// ═════════════════════════════════════════════════════════════════════════════

export const OrdersList: React.FC = () => {
  const { orders, updateOrder, deleteOrder } = useStore();
  const navigate = useNavigate();
  const nav = useNavigation();

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dateFilter, setDateFilter]     = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const now = new Date();

  const customerOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    orders.forEach(o => {
      if (o.customerId && o.customerName && !seen.has(o.customerId)) {
        seen.add(o.customerId);
        list.push({ id: o.customerId, name: o.customerName });
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const filtered = useMemo(() => orders.filter(o => {
    if (search) {
      const s = search.toLowerCase();
      if (!o.title?.toLowerCase().includes(s) &&
          !o.number?.toLowerCase().includes(s) &&
          !(o.customerName || '').toLowerCase().includes(s)) return false;
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (customerFilter !== 'all' && o.customerId !== customerFilter) return false;
    if (!inDateRange(o.createdAt, dateFilter)) return false;
    return true;
  }), [orders, search, statusFilter, customerFilter, dateFilter]);

  const filterCount = [statusFilter !== 'all', customerFilter !== 'all', dateFilter !== 'all'].filter(Boolean).length;
  const orderToDelete = deleteConfirmId ? orders.find(o => o.id === deleteConfirmId) : null;

  // Sorting
  const [sortCol, setSortCol] = useState<OrderSortCol>('created');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (col: OrderSortCol) => {
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
      if (sortCol === 'dueDate')  cmp = new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      if (sortCol === 'created')  cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortCol === 'status')   cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => nav('/orders/new')}>
            New Order
          </Button>
        }
      />

      {/* ── Filter bar ── */}
      <Card className="mb-4">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <SearchInput value={search} onChange={setSearch} placeholder="Search order #, title, customer…" />
            {filterCount > 0 && (
              <button
                onClick={() => { setStatusFilter('all'); setCustomerFilter('all'); setDateFilter('all'); }}
                className="text-xs text-[var(--brand)] hover:underline flex-shrink-0"
              >
                Clear {filterCount} filter{filterCount > 1 ? 's' : ''}
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {filtered.length} order{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {[{ id: 'all', label: 'All' }, ...STATUS_OPTIONS.map(s => ({ id: s.value, label: s.label }))].map(f => (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
                    statusFilter === f.id
                      ? (f.id === 'all'
                          ? 'bg-gray-800 text-white border-gray-800'
                          : `${STATUS_COLORS[f.id]} border-transparent`)
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--brand)] bg-white text-gray-600">
              <option value="all">All Customers</option>
              {customerOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

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
            icon={<span className="text-2xl">📦</span>}
            title="No orders found"
            description={filterCount > 0 ? 'Try adjusting your filters.' : 'Create your first order to get started.'}
            action={<Button variant="primary" onClick={() => nav('/orders/new')}>New Order</Button>}
          />
        ) : (
          <Table headers={[
            <button key="number"   onClick={() => toggleSort('number')}   className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Order # <SortIcon col="number"   active={sortCol} dir={sortDir} /></button>,
            <button key="title"    onClick={() => toggleSort('title')}    className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Title <SortIcon col="title"    active={sortCol} dir={sortDir} /></button>,
            <button key="customer" onClick={() => toggleSort('customer')} className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Customer <SortIcon col="customer" active={sortCol} dir={sortDir} /></button>,
            <button key="total"   onClick={() => toggleSort('total')}   className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Total <SortIcon col="total"   active={sortCol} dir={sortDir} /></button>,
            <button key="dueDate" onClick={() => toggleSort('dueDate')} className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Due Date <SortIcon col="dueDate" active={sortCol} dir={sortDir} /></button>,
            'Quote #',
            <button key="status"  onClick={() => toggleSort('status')}  className="flex items-center whitespace-nowrap hover:text-gray-900 transition-colors">Status <SortIcon col="status"  active={sortCol} dir={sortDir} /></button>,
            '',
          ]}>
            {sorted.map(order => {
              const isOverdue = order.dueDate && order.status === 'in_progress' && new Date(order.dueDate) < now;
              return (
                <tr key={order.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/orders/${order.id}`)}>

                  <td className="py-3 px-4">
                    <span className="obj-num text-sm font-semibold text-gray-800">{order.number}</span>
                  </td>

                  <td className="py-3 px-4 max-w-[180px]">
                    <p className="text-sm font-medium text-gray-900 truncate">{order.title || '—'}</p>
                  </td>

                  <td className="py-3 px-4 text-sm text-gray-700">{order.customerName || '—'}</td>

                  <td className="py-3 px-4 text-sm font-semibold text-gray-900 num">{formatCurrency(order.total)}</td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {order.dueDate ? (
                      <span className={`text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                        {isOverdue && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                        {formatDate(order.dueDate)}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>

                  <td className="py-3 px-4">
                    {order.quoteNumber ? (
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/quotes/${order.quoteId}`); }}
                        className="text-xs obj-num text-[var(--brand)] hover:underline"
                      >
                        {order.quoteNumber}
                      </button>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>

                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <StatusPicker current={order.status} onSelect={status => updateOrder(order.id, { status })} />
                  </td>

                  <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setDeleteConfirmId(order.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) { deleteOrder(deleteConfirmId); setDeleteConfirmId(null); }
        }}
        title="Delete Order"
        message={orderToDelete
          ? `Delete ${orderToDelete.number}${orderToDelete.title ? ` — ${orderToDelete.title}` : ''}? This cannot be undone.`
          : 'Delete this order?'}
        confirmLabel="Delete"
      />
    </div>
  );
};
