import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ClipboardList, AlertTriangle,
  Clock, Users, ChevronRight,
  Flame, Package, Layers3,
} from 'lucide-react';
import { useStore } from '../../store';
import { Card } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

// ─── Color helper (same as OrderTracker) ─────────────────────────────────────
const withAlpha = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

function endOfTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const now = new Date();

function daysAgo(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

function formatTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} at ${time}`;
}

function thisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

function daysOld(dateStr: string) {
  return Math.floor((now.getTime() - new Date(dateStr).getTime()) / 86400000);
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
  icon?: React.ReactNode;
}> = ({ label, value, sub, accent = 'text-gray-900', onClick, alert, icon }) => (
  <div
    className={`bg-white border rounded-xl p-4 flex flex-col gap-1 ${onClick ? 'cursor-pointer hover:border-[var(--brand)]/40 hover:shadow-sm transition-all' : ''} ${alert ? 'border-red-200 bg-red-50/40' : 'border-gray-100'}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-0.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      {icon && <span className="text-gray-300">{icon}</span>}
    </div>
    <span className={`text-2xl font-bold ${accent}`}>{value}</span>
    {sub && <span className="text-[11px] text-gray-500 leading-tight">{sub}</span>}
  </div>
);

// ─── Product period options ───────────────────────────────────────────────────
const PRODUCT_PERIODS = [
  { id: 'last30', label: 'Last 30 Days', days: 30 },
  { id: 'last6m', label: '6 Months', days: 182 },
  { id: 'last12m', label: '12 Months', days: 365 },
  { id: 'ytd', label: 'This Year', days: -1 },
] as const;
type ProductPeriod = typeof PRODUCT_PERIODS[number]['id'];

// ═════════════════════════════════════════════════════════════════════════════

export const Dashboard: React.FC = () => {
  const { quotes, orders, customers, workflows, currentUser, companySettings } = useStore();
  const navigate = useNavigate();
  const brandColor = companySettings?.primaryBrandColor || '#2563eb';
  const [activityFilter, setActivityFilter] = useState<'all' | 'quotes' | 'customers' | 'orders'>('all');
  const [productPeriod, setProductPeriod] = useState<ProductPeriod>('last30');

  // ── Quote KPIs ────────────────────────────────────────────────────────────
  const openQuotes = useMemo(() => quotes.filter(q => ['pending', 'hot', 'cold'].includes(q.status)), [quotes]);
  const hotQuotes = useMemo(() => quotes.filter(q => q.status === 'hot'), [quotes]);
  const lostThisWeek = useMemo(() => quotes.filter(q => q.status === 'lost' && thisWeek(q.updatedAt || q.createdAt)), [quotes]);
  // Overdue = open quotes that are more than 10 days old (no response/action)
  const overdueQuotes = useMemo(() => openQuotes.filter(q => daysOld(q.createdAt) > 10), [openQuotes]);

  // ── Order data ────────────────────────────────────────────────────────────
  const activeOrders = useMemo(() => orders.filter(o => o.status === 'in_progress'), [orders]);
  const overdueOrders = useMemo(() => activeOrders.filter(o => o.dueDate && new Date(o.dueDate) < now), [activeOrders]);

  // ── Top 20 customers by revenue (orders) ─────────────────────────────────
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; total: number; orderCount: number; id: string }> = {};
    orders.forEach(o => {
      if (!o.customerId || !o.customerName) return;
      if (!map[o.customerId]) map[o.customerId] = { id: o.customerId, name: o.customerName, total: 0, orderCount: 0 };
      map[o.customerId].total += o.total;
      map[o.customerId].orderCount += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 20);
  }, [orders]);

  // ── Top products by sell volume ───────────────────────────────────────────
  const topProducts = useMemo(() => {
    const periodDef = PRODUCT_PERIODS.find(p => p.id === productPeriod)!;
    const cutoff = periodDef.days === -1
      ? new Date(now.getFullYear(), 0, 1)  // Jan 1st this year
      : new Date(now.getTime() - periodDef.days * 86400000);

    const map: Record<string, { name: string; revenue: number; qty: number }> = {};
    orders.filter(o => new Date(o.createdAt) >= cutoff).forEach(o => {
      o.lineItems.forEach((li: any) => {
        const key = li.productName || li.description || 'Unknown';
        if (!map[key]) map[key] = { name: key, revenue: 0, qty: 0 };
        map[key].revenue += li.sellPrice || 0;
        map[key].qty += li.quantity || 1;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
  }, [orders, productPeriod]);

  // ── Board stats — same calculation as OrderTracker ────────────────────────
  const activeBoards = useMemo(() => workflows.filter(w => w.isActive), [workflows]);
  const boardStats = useMemo(() => {
    return activeBoards.map(board => {
      const boardOrders = orders.filter(o =>
        o.workflowId === board.id && o.status !== 'canceled' && o.status !== 'completed'
      );
      return {
        id: board.id,
        orderCount: boardOrders.length,
        itemCount: boardOrders.reduce((sum, o) => sum + (o.trackingMode === 'item' ? o.lineItems.length : 1), 0),
        dueSoonCount: boardOrders.filter(o => o.dueDate && new Date(o.dueDate) <= endOfTomorrow()).length,
      };
    });
  }, [activeBoards, orders]);

  // ── Activity feed ─────────────────────────────────────────────────────────
  const activityFeed = useMemo(() => {
    const items: {
      type: 'quotes' | 'customers' | 'orders';
      icon: React.ReactNode;
      text: string;
      sub: string;
      date: string;
      path: string;
    }[] = [];

    quotes.slice(0, 25).forEach(q => {
      items.push({
        type: 'quotes',
        icon: <FileText className="w-3.5 h-3.5 text-blue-500" />,
        text: `${q.number}${q.title ? ` — ${q.title}` : q.customerName ? ` — ${q.customerName}` : ''}`,
        sub: q.status === 'won' ? 'Converted to order'
          : q.status === 'hot' ? `Hot · ${formatCurrency(q.total)}`
          : q.status === 'lost' ? 'Lost'
          : `${q.status.charAt(0).toUpperCase() + q.status.slice(1)} · ${formatCurrency(q.total)}`,
        date: q.updatedAt || q.createdAt,
        path: `/quotes/${q.id}`,
      });
    });

    customers.slice(0, 15).forEach(c => {
      items.push({
        type: 'customers',
        icon: <Users className="w-3.5 h-3.5 text-emerald-500" />,
        text: c.name,
        sub: 'Customer account',
        date: c.createdAt,
        path: `/customers/${c.id}`,
      });
    });

    orders.slice(0, 20).forEach(o => {
      items.push({
        type: 'orders',
        icon: <ClipboardList className="w-3.5 h-3.5 text-violet-500" />,
        text: `${o.number}${o.title ? ` — ${o.title}` : o.customerName ? ` — ${o.customerName}` : ''}`,
        sub: o.status === 'in_progress'
          ? `In production · ${formatCurrency(o.total)}${o.dueDate && new Date(o.dueDate) < now ? ' · OVERDUE' : ''}`
          : `${o.status} · ${formatCurrency(o.total)}`,
        date: o.updatedAt || o.createdAt,
        path: `/orders/${o.id}`,
      });
    });

    return items
      .filter(i => activityFilter === 'all' || i.type === activityFilter)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 15);
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
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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

      {/* ═══ ROW 1 — Quote KPIs ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI
          label="Open Quotes"
          value={String(openQuotes.length)}
          sub={`${formatCurrency(openQuotes.reduce((s, q) => s + q.total, 0))} total value`}
          accent={openQuotes.length > 0 ? 'text-gray-900' : 'text-gray-400'}
          icon={<FileText className="w-4 h-4" />}
          onClick={() => navigate('/quotes')}
        />
        <KPI
          label="Hot Quotes"
          value={String(hotQuotes.length)}
          sub={hotQuotes.length > 0 ? `${formatCurrency(hotQuotes.reduce((s, q) => s + q.total, 0))} at stake` : 'None active'}
          accent={hotQuotes.length > 0 ? 'text-red-600' : 'text-gray-400'}
          icon={<Flame className="w-4 h-4" />}
          onClick={() => navigate('/quotes')}
        />
        <KPI
          label="Lost This Week"
          value={String(lostThisWeek.length)}
          sub={lostThisWeek.length > 0 ? `${formatCurrency(lostThisWeek.reduce((s, q) => s + q.total, 0))} lost` : 'None this week'}
          accent={lostThisWeek.length > 0 ? 'text-red-500' : 'text-gray-400'}
          alert={lostThisWeek.length > 0}
          onClick={() => navigate('/quotes')}
        />
        <KPI
          label="Quotes Overdue"
          value={String(overdueQuotes.length)}
          sub={overdueQuotes.length > 0 ? 'Open > 10 days without update' : 'All quotes are current'}
          accent={overdueQuotes.length > 0 ? 'text-amber-600' : 'text-gray-400'}
          alert={overdueQuotes.length > 0}
          onClick={() => navigate('/quotes')}
        />
      </div>

      {/* ═══ ROW 2 — Order Tracker Boards ═══════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            <Layers3 className="h-3.5 w-3.5" />
            Active Boards
          </div>
          <button onClick={() => navigate('/tracker')}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors">
            Open Full Tracker <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {activeBoards.length === 0 ? (
          <Card>
            <div className="px-5 py-6 text-center text-sm text-gray-400">No active workflow boards configured</div>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeBoards.map(board => {
              const stats = boardStats.find(s => s.id === board.id);
              return (
                <button
                  key={board.id}
                  onClick={() => navigate(`/tracker?board=${board.id}`)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    board.isDefault
                      ? 'text-white shadow-lg'
                      : 'border-gray-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                  style={board.isDefault ? {
                    borderColor: withAlpha(brandColor, 0.8),
                    backgroundImage: `linear-gradient(135deg, ${withAlpha(brandColor, 0.96)}, ${withAlpha(brandColor, 0.72)})`,
                    boxShadow: `0 20px 35px ${withAlpha(brandColor, 0.18)}`,
                  } : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold truncate ${board.isDefault ? 'text-white' : 'text-gray-900'}`}>
                        {board.name}
                      </div>
                      <p className={`mt-1 text-xs leading-5 line-clamp-2 ${board.isDefault ? 'text-white/80' : 'text-gray-500'}`}>
                        {board.description || 'No description provided.'}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      board.isDefault ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {board.isDefault ? 'Default' : 'Active'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-5">
                    <div>
                      <div className={`text-xl font-bold ${board.isDefault ? 'text-white' : 'text-gray-900'}`}>
                        {stats?.orderCount ?? 0}
                      </div>
                      <div className={`text-[11px] ${board.isDefault ? 'text-white/70' : 'text-gray-500'}`}>orders</div>
                    </div>
                    <div>
                      <div className={`text-xl font-bold ${board.isDefault ? 'text-white' : 'text-gray-900'}`}>
                        {stats?.itemCount ?? 0}
                      </div>
                      <div className={`text-[11px] ${board.isDefault ? 'text-white/70' : 'text-gray-500'}`}>items</div>
                    </div>
                    <div>
                      <div className={`text-xl font-bold ${
                        (stats?.dueSoonCount ?? 0) > 0
                          ? (board.isDefault ? 'text-yellow-200' : 'text-amber-500')
                          : (board.isDefault ? 'text-white' : 'text-gray-900')
                      }`}>
                        {stats?.dueSoonCount ?? 0}
                      </div>
                      <div className={`text-[11px] ${board.isDefault ? 'text-white/70' : 'text-gray-500'}`}>due soon</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ ROW 3 — Customers · Products · Activity ═════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top 20 Customers */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" /> Top Customers
            </h2>
            <button onClick={() => navigate('/customers')}
              className="text-[11px] text-[var(--brand)] hover:underline">View all</button>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[400px]">
            {topCustomers.map((c, i) => (
              <button key={c.id} onClick={() => navigate(`/customers/${c.id}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <span className={`text-[10px] font-bold w-4 flex-shrink-0 ${i < 3 ? 'text-[var(--brand)]' : 'text-gray-300'}`}>
                  {i + 1}
                </span>
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

        {/* Top Sold Products */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-500" /> Top Products
            </h2>
            {/* Period selector */}
            <div className="flex items-center gap-0.5">
              {PRODUCT_PERIODS.map(p => (
                <button key={p.id} onClick={() => setProductPeriod(p.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    productPeriod === p.id
                      ? 'bg-[var(--brand)] text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {p.id === 'last30' ? '30d' : p.id === 'last6m' ? '6m' : p.id === 'last12m' ? '12m' : 'YTD'}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[400px]">
            {topProducts.map((p, i) => (
              <div key={p.name}
                className="flex items-center gap-3 px-4 py-2.5">
                <span className={`text-[10px] font-bold w-4 flex-shrink-0 ${i < 3 ? 'text-amber-500' : 'text-gray-300'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.qty.toLocaleString()} pcs</p>
                </div>
                <span className="text-xs font-semibold text-gray-700 num flex-shrink-0">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-gray-400">
                No product data for this period
              </div>
            )}
          </div>
        </Card>

        {/* Activity Feed */}
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
                { id: 'orders', label: 'Orders' },
              ] as const).map(f => (
                <button key={f.id} onClick={() => setActivityFilter(f.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    activityFilter === f.id
                      ? 'bg-[var(--brand)] text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[400px]">
            {activityFeed.map((item, i) => (
              <button key={i} onClick={() => navigate(item.path)}
                className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 font-medium truncate">{item.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
                  <p className="text-[9px] text-gray-300 mt-0.5">{formatTimestamp(item.date)}</p>
                </div>
                <span className="text-[10px] text-gray-300 flex-shrink-0 mt-0.5 whitespace-nowrap">{daysAgo(item.date)}</span>
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
