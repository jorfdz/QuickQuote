import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ClipboardList, Receipt, AlertTriangle,
  Clock, CheckCircle, Users, ChevronRight, TrendingUp,
  ArrowRight, Flame, Circle,
} from 'lucide-react';
import { useStore } from '../../store';
import { Card, Badge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const now = new Date();

function daysAgo(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

function thisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

function thisMonth(dateStr: string) {
  const d = new Date(dateStr);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// ─── Status dot colors ────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  hot: 'bg-red-500',
  cold: 'bg-sky-400',
  won: 'bg-emerald-500',
  lost: 'bg-gray-400',
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KPI: React.FC<{
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  onClick?: () => void;
  alert?: boolean;
}> = ({ label, value, sub, accent = 'text-gray-900', onClick, alert }) => (
  <div
    className={`bg-white border rounded-xl p-4 flex flex-col gap-1 ${onClick ? 'cursor-pointer hover:border-[var(--brand)]/40 hover:shadow-sm transition-all' : ''} ${alert ? 'border-red-200 bg-red-50/40' : 'border-gray-100'}`}
    onClick={onClick}
  >
    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className={`text-2xl font-bold ${accent}`}>{value}</span>
    {sub && <span className="text-[11px] text-gray-500 leading-tight">{sub}</span>}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════

export const Dashboard: React.FC = () => {
  const { quotes, orders, invoices, customers, workflows, currentUser, users } = useStore();
  const navigate = useNavigate();
  const [activityFilter, setActivityFilter] = useState<'all' | 'quotes' | 'customers'>('all');

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const openQuotes = useMemo(() => quotes.filter(q => ['pending', 'hot', 'cold'].includes(q.status)), [quotes]);
  const hotQuotes = useMemo(() => quotes.filter(q => q.status === 'hot'), [quotes]);
  const newQuotesThisWeek = useMemo(() => quotes.filter(q => thisWeek(q.createdAt)), [quotes]);
  const activeOrders = useMemo(() => orders.filter(o => o.status === 'in_progress'), [orders]);
  const overdueOrders = useMemo(() => activeOrders.filter(o => o.dueDate && new Date(o.dueDate) < now), [activeOrders]);
  const ar = useMemo(() => invoices.filter(i => ['sent', 'posted', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0), [invoices]);
  const overdueAR = useMemo(() => invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0), [invoices]);

  // Top 20 customers by revenue (using orders)
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; total: number; orderCount: number; lastActivity: string }> = {};
    orders.forEach(o => {
      if (!o.customerId || !o.customerName) return;
      if (!map[o.customerId]) map[o.customerId] = { name: o.customerName, total: 0, orderCount: 0, lastActivity: o.updatedAt };
      map[o.customerId].total += o.total;
      map[o.customerId].orderCount += 1;
      if (o.updatedAt > map[o.customerId].lastActivity) map[o.customerId].lastActivity = o.updatedAt;
    });
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  }, [orders]);

  // ── Order Tracker summary ─────────────────────────────────────────────────
  const trackerSummary = useMemo(() => {
    const defaultWorkflow = workflows.find(w => w.isDefault) || workflows[0];
    if (!defaultWorkflow) return [];
    return defaultWorkflow.stages.map(stage => ({
      stage,
      orders: activeOrders.filter(o => {
        // match by currentStageId or any item's workflowStageId
        if (o.currentStageId === stage.id) return true;
        return o.lineItems.some((li: any) => li.workflowStageId === stage.id);
      }),
    })).filter(s => s.orders.length > 0);
  }, [workflows, activeOrders]);

  // ── Activity feed (derived from real data) ────────────────────────────────
  const activityFeed = useMemo(() => {
    const items: { type: 'quote' | 'customer'; icon: React.ReactNode; text: string; sub: string; date: string; path: string }[] = [];

    // Recent quotes
    quotes.slice(0, 20).forEach(q => {
      items.push({
        type: 'quote',
        icon: <FileText className="w-3.5 h-3.5 text-blue-500" />,
        text: `${q.number} — ${q.title || q.customerName || 'Quote'}`,
        sub: q.status === 'won' ? 'Converted to order' : q.status === 'hot' ? 'Hot quote' : `${q.status} · ${formatCurrency(q.total)}`,
        date: q.updatedAt,
        path: `/quotes/${q.id}`,
      });
    });

    // Recent customers
    customers.slice(0, 10).forEach(c => {
      items.push({
        type: 'customer',
        icon: <Users className="w-3.5 h-3.5 text-emerald-500" />,
        text: c.name,
        sub: 'Customer account',
        date: c.createdAt,
        path: `/customers/${c.id}`,
      });
    });

    // Recent orders
    orders.slice(0, 10).forEach(o => {
      items.push({
        type: 'customer',
        icon: <ClipboardList className="w-3.5 h-3.5 text-violet-500" />,
        text: `${o.number} — ${o.title || o.customerName}`,
        sub: o.status === 'in_progress' ? `In production · ${formatCurrency(o.total)}` : o.status,
        date: o.updatedAt,
        path: `/orders/${o.id}`,
      });
    });

    return items
      .filter(i => activityFilter === 'all' || i.type === activityFilter || (activityFilter === 'customers' && i.type === 'customer'))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12);
  }, [quotes, orders, customers, activityFilter]);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-5 pb-6">

      {/* ── Greeting ── */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{greeting}, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {overdueOrders.length > 0 && (
          <button onClick={() => navigate('/orders')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors">
            <AlertTriangle className="w-3.5 h-3.5" />
            {overdueOrders.length} overdue order{overdueOrders.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI
          label="Open Quotes"
          value={String(openQuotes.length)}
          sub={`${newQuotesThisWeek.length} added this week · ${formatCurrency(openQuotes.reduce((s, q) => s + q.total, 0))} total`}
          accent={openQuotes.length > 0 ? 'text-gray-900' : 'text-gray-400'}
          onClick={() => navigate('/quotes')}
        />
        <KPI
          label="Hot Quotes"
          value={String(hotQuotes.length)}
          sub={hotQuotes.length > 0 ? formatCurrency(hotQuotes.reduce((s, q) => s + q.total, 0)) + ' at stake' : 'None active'}
          accent={hotQuotes.length > 0 ? 'text-red-600' : 'text-gray-400'}
          onClick={() => navigate('/quotes')}
        />
        <KPI
          label="Orders in Production"
          value={String(activeOrders.length)}
          sub={overdueOrders.length > 0 ? `${overdueOrders.length} overdue` : 'All on schedule'}
          accent={overdueOrders.length > 0 ? 'text-red-600' : 'text-gray-900'}
          alert={overdueOrders.length > 0}
          onClick={() => navigate('/orders')}
        />
        <KPI
          label="Accounts Receivable"
          value={formatCurrency(ar)}
          sub={overdueAR > 0 ? `${formatCurrency(overdueAR)} overdue` : 'Outstanding invoices'}
          accent={overdueAR > 0 ? 'text-red-600' : 'text-gray-900'}
          alert={overdueAR > 0}
          onClick={() => navigate('/invoices')}
        />
      </div>

      {/* ── Order Tracker — production floor at a glance ── */}
      {trackerSummary.length > 0 && (
        <Card>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-violet-500" /> Production Floor
            </h2>
            <button onClick={() => navigate('/tracker')} className="text-[11px] text-[var(--brand)] hover:underline font-medium flex items-center gap-0.5">
              Full Tracker <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="px-5 py-4">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {trackerSummary.map(({ stage, orders: stageOrders }) => (
                <div key={stage.id}
                  className="flex-shrink-0 min-w-[160px] max-w-[200px] bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide truncate">{stage.name}</span>
                    <span className="ml-auto text-[10px] font-bold text-gray-500 flex-shrink-0">{stageOrders.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {stageOrders.slice(0, 3).map(o => (
                      <button key={o.id} onClick={() => navigate(`/orders/${o.id}`)}
                        className="w-full text-left bg-white rounded-lg px-2.5 py-2 border border-gray-100 hover:border-[var(--brand)]/30 hover:bg-[var(--brand-light)] transition-all">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] obj-num text-gray-400 flex-shrink-0">{o.number}</span>
                          {o.dueDate && new Date(o.dueDate) < now && (
                            <span className="text-[9px] text-red-600 font-bold flex-shrink-0">OVERDUE</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-800 mt-0.5 truncate">{o.title || o.customerName}</p>
                        {o.dueDate && (
                          <p className={`text-[10px] mt-0.5 ${new Date(o.dueDate) < now ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            Due {formatDate(o.dueDate)}
                          </p>
                        )}
                      </button>
                    ))}
                    {stageOrders.length > 3 && (
                      <button onClick={() => navigate('/tracker')}
                        className="w-full text-[10px] text-center text-gray-400 hover:text-[var(--brand)] py-1 transition-colors">
                        +{stageOrders.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ── Main 3-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Open Quotes — col 1 */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Open Quotes</h2>
            <button onClick={() => navigate('/quotes')} className="text-[11px] text-[var(--brand)] hover:underline">View all</button>
          </div>
          <div className="divide-y divide-gray-50">
            {openQuotes.slice(0, 6).map(q => (
              <button key={q.id} onClick={() => navigate(`/quotes/${q.id}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[q.status] || 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] obj-num text-gray-400">{q.number}</span>
                    {q.status === 'hot' && <Flame className="w-3 h-3 text-red-500" />}
                  </div>
                  <p className="text-xs font-medium text-gray-800 truncate mt-0.5">{q.customerName || q.title || '—'}</p>
                </div>
                <span className="text-xs font-semibold text-gray-700 num flex-shrink-0">{formatCurrency(q.total)}</span>
              </button>
            ))}
            {openQuotes.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-gray-400">No open quotes</div>
            )}
          </div>
        </Card>

        {/* Top Customers — col 2 */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Top Customers</h2>
            <button onClick={() => navigate('/customers')} className="text-[11px] text-[var(--brand)] hover:underline">View all</button>
          </div>
          <div className="divide-y divide-gray-50">
            {topCustomers.slice(0, 8).map((c, i) => (
              <button key={c.id} onClick={() => navigate(`/customers/${c.id}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <span className="text-[10px] font-bold text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-xs font-semibold text-gray-700 num flex-shrink-0">{formatCurrency(c.total)}</span>
              </button>
            ))}
            {topCustomers.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-gray-400">No order history yet</div>
            )}
          </div>
        </Card>

        {/* Activity Feed — col 3 */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" /> Activity
            </h2>
            {/* Filter tabs */}
            <div className="flex items-center gap-0.5">
              {([
                { id: 'all', label: 'All' },
                { id: 'quotes', label: 'Quotes' },
                { id: 'customers', label: 'Clients' },
              ] as const).map(f => (
                <button key={f.id} onClick={() => setActivityFilter(f.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    activityFilter === f.id
                      ? 'bg-[var(--brand)] text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {activityFeed.map((item, i) => (
              <button key={i} onClick={() => navigate(item.path)}
                className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 font-medium truncate">{item.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
                </div>
                <span className="text-[10px] text-gray-300 flex-shrink-0 mt-0.5">{daysAgo(item.date)}</span>
              </button>
            ))}
            {activityFeed.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-gray-400">No recent activity</div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
};
