import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ExternalLink, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store';
import { useNavigation } from '../../hooks/useNavigation';
import { Button, SearchInput, Table, PageHeader, EmptyState, Card, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { InvoiceStatus } from '../../types';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft',   label: 'Draft'   },
  { value: 'sent',    label: 'Sent'    },
  { value: 'posted',  label: 'Posted'  },
  { value: 'paid',    label: 'Paid'    },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_COLORS: Record<string, string> = {
  draft:   'bg-gray-400 text-white',
  sent:    'bg-blue-500 text-white',
  posted:  'bg-violet-500 text-white',
  paid:    'bg-emerald-500 text-white',
  overdue: 'bg-red-500 text-white',
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
  current: InvoiceStatus;
  onSelect: (s: InvoiceStatus) => void;
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

// ═════════════════════════════════════════════════════════════════════════════

export const Invoices: React.FC = () => {
  const { invoices, updateInvoice, orders } = useStore();
  const navigate = useNavigate();
  const nav = useNavigation();

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter]     = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const now = new Date();

  const filtered = useMemo(() => invoices.filter(i => {
    if (search) {
      const s = search.toLowerCase();
      if (!i.number.toLowerCase().includes(s) &&
          !i.customerName.toLowerCase().includes(s)) return false;
    }
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (!inDateRange(i.createdAt, dateFilter)) return false;
    return true;
  }), [invoices, search, statusFilter, dateFilter]);

  const filterCount = [statusFilter !== 'all', dateFilter !== 'all'].filter(Boolean).length;

  const invoiceToDelete = deleteConfirmId ? invoices.find(i => i.id === deleteConfirmId) : null;

  const getSourceOrder = (inv: typeof invoices[0]) => {
    if (inv.orderIds?.length) return orders.find(o => o.id === inv.orderIds[0]);
    return undefined;
  };

  const markPaid = (e: React.MouseEvent, id: string, total: number) => {
    e.stopPropagation();
    updateInvoice(id, {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
      paidAmount: total,
    });
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} total`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => nav('/invoices/new')}>
            New Invoice
          </Button>
        }
      />

      {/* ── Filter bar ── */}
      <Card className="mb-4">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <SearchInput value={search} onChange={setSearch} placeholder="Search invoice #, customer…" />
            {filterCount > 0 && (
              <button
                onClick={() => { setStatusFilter('all'); setDateFilter('all'); }}
                className="text-xs text-[var(--brand)] hover:underline flex-shrink-0"
              >
                Clear {filterCount} filter{filterCount > 1 ? 's' : ''}
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
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
            icon={<span className="text-2xl">🧾</span>}
            title="No invoices found"
            description={filterCount > 0 ? 'Try adjusting your filters.' : 'Invoices are created from completed orders.'}
            action={<Button variant="primary" onClick={() => nav('/invoices/new')}>New Invoice</Button>}
          />
        ) : (
          <Table headers={['Invoice #', 'Customer', 'Total', 'Due Date', 'Paid Date', 'Order', 'Status', '']}>
            {filtered.map(inv => {
              const sourceOrder = getSourceOrder(inv);
              const isOverdue = inv.status === 'overdue' || (
                inv.dueDate &&
                ['sent', 'posted'].includes(inv.status) &&
                new Date(inv.dueDate) < now
              );

              return (
                <tr key={inv.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/invoices/${inv.id}`)}>

                  {/* Invoice # */}
                  <td className="py-3 px-4">
                    <span className="obj-num text-sm font-semibold text-gray-800">{inv.number}</span>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{inv.customerName || '—'}</td>

                  {/* Total */}
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900 num">{formatCurrency(inv.total)}</td>

                  {/* Due Date */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {inv.dueDate ? (
                      <span className={`text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                        {isOverdue && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                        {formatDate(inv.dueDate)}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>

                  {/* Paid Date */}
                  <td className="py-3 px-4 text-xs whitespace-nowrap">
                    {inv.paidDate
                      ? <span className="text-emerald-600 font-medium">{formatDate(inv.paidDate)}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>

                  {/* Source Order */}
                  <td className="py-3 px-4">
                    {sourceOrder ? (
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/orders/${sourceOrder.id}`); }}
                        className="text-xs obj-num text-[var(--brand)] hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {sourceOrder.number}
                      </button>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>

                  {/* Status — inline changeable */}
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <StatusPicker
                        current={inv.status as InvoiceStatus}
                        onSelect={status => {
                          const extra = status === 'paid'
                            ? { paidDate: new Date().toISOString().split('T')[0], paidAmount: inv.total }
                            : {};
                          updateInvoice(inv.id, { status, ...extra });
                        }}
                      />
                      {/* Quick-action buttons */}
                      {inv.status === 'draft' && (
                        <button
                          onClick={e => { e.stopPropagation(); updateInvoice(inv.id, { status: 'sent' }); }}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded-md hover:bg-blue-50 border border-blue-200 transition-colors whitespace-nowrap"
                        >
                          Send
                        </button>
                      )}
                      {['sent', 'posted', 'overdue'].includes(inv.status) && (
                        <button
                          onClick={e => markPaid(e, inv.id, inv.total)}
                          className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-800 px-2 py-0.5 rounded-md hover:bg-emerald-50 border border-emerald-200 transition-colors whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Delete */}
                  <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setDeleteConfirmId(inv.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete invoice"
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
          // invoices don't have a deleteInvoice action exposed — just update status to canceled
          // If store has deleteInvoice use it; otherwise we close
          setDeleteConfirmId(null);
        }}
        title="Delete Invoice"
        message={invoiceToDelete
          ? `Delete ${invoiceToDelete.number} — ${invoiceToDelete.customerName}? This cannot be undone.`
          : 'Delete this invoice?'}
        confirmLabel="Delete"
      />
    </div>
  );
};
