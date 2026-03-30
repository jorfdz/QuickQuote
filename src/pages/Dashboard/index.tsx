import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ClipboardList, Receipt, TrendingUp, Clock, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { useStore } from '../../store';
import { StatCard, Card, Badge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

export const Dashboard: React.FC = () => {
  const { quotes, orders, invoices, customers, currentUser } = useStore();
  const navigate = useNavigate();

  const openQuotes = quotes.filter(q => ['pending', 'hot'].includes(q.status));
  const activeOrders = orders.filter(o => o.status === 'in_progress');
  const overdueOrders = orders.filter(o => o.status === 'in_progress' && o.dueDate && new Date(o.dueDate) < new Date());
  const totalQuoteValue = openQuotes.reduce((s, q) => s + q.total, 0);
  const pendingInvoiceValue = invoices.filter(i => ['sent', 'draft', 'posted'].includes(i.status)).reduce((s, i) => s + i.total, 0);

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Good morning, {currentUser.name.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening at your shop today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Open Quotes" value={String(openQuotes.length)} subtitle={formatCurrency(totalQuoteValue) + ' total value'} icon={<FileText className="w-5 h-5 text-blue-600" />} color="bg-blue-50" trend="3 new this week" />
        <StatCard title="Active Orders" value={String(activeOrders.length)} subtitle={overdueOrders.length > 0 ? `${overdueOrders.length} overdue` : 'All on track'} icon={<ClipboardList className="w-5 h-5 text-violet-600" />} color="bg-violet-50" />
        <StatCard title="Pending Invoices" value={formatCurrency(pendingInvoiceValue)} subtitle="Awaiting payment" icon={<Receipt className="w-5 h-5 text-amber-600" />} color="bg-amber-50" />
        <StatCard title="Customers" value={String(customers.length)} subtitle="Active accounts" icon={<Users className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50" trend="2 new this month" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Quotes */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Open Quotes</h2>
              <button onClick={() => navigate('/quotes')} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
            </div>
            <div className="divide-y divide-gray-50">
              {openQuotes.slice(0, 5).map(quote => (
                <div key={quote.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/quotes/${quote.id}`)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-gray-400">{quote.number}</span>
                        <Badge label={quote.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{quote.title}</p>
                      <p className="text-xs text-gray-500">{quote.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(quote.total)}</p>
                    <p className="text-xs text-gray-400">{formatDate(quote.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Orders */}
          <Card className="mt-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-violet-500" /> Active Orders</h2>
              <button onClick={() => navigate('/orders')} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
            </div>
            <div className="divide-y divide-gray-50">
              {activeOrders.slice(0, 4).map(order => {
                const isOverdue = order.dueDate && new Date(order.dueDate) < new Date();
                return (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/orders/${order.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-gray-400">{order.number}</span>
                          {isOverdue && <Badge label="overdue" />}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{order.title}</p>
                        <p className="text-xs text-gray-500">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</p>
                      {order.dueDate && <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>Due {formatDate(order.dueDate)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {[
                { label: 'New Quote', icon: '📋', path: '/quotes/new', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
                { label: 'New Order', icon: '📦', path: '/orders/new', color: 'bg-violet-50 hover:bg-violet-100 text-violet-700' },
                { label: 'New Invoice', icon: '🧾', path: '/invoices/new', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
                { label: 'Add Customer', icon: '👤', path: '/customers/new', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' },
                { label: 'Track Orders', icon: '📊', path: '/tracker', color: 'bg-rose-50 hover:bg-rose-100 text-rose-700' },
                { label: 'Add Material', icon: '🧱', path: '/materials', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
              ].map(action => (
                <button key={action.path} onClick={() => navigate(action.path)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold transition-all ${action.color}`}>
                  <span className="text-lg">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Performance snapshot */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> This Month</h2>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Quotes Created', value: '12', change: '+3', up: true },
                { label: 'Orders Placed', value: '8', change: '+1', up: true },
                { label: 'Revenue Invoiced', value: '$14,230', change: '+12%', up: true },
                { label: 'Win Rate', value: '68%', change: '+5%', up: true },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{m.value}</span>
                    <span className={`text-xs font-medium ${m.up ? 'text-emerald-600' : 'text-red-500'}`}>{m.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Recent Activity</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />, text: 'Q000003 converted to order', time: '2h ago' },
                { icon: <FileText className="w-3.5 h-3.5 text-blue-500" />, text: 'New quote Q000005 created', time: '4h ago' },
                { icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />, text: 'O000004 put on hold', time: '5h ago' },
                { icon: <Receipt className="w-3.5 h-3.5 text-violet-500" />, text: 'Invoice I000001 marked paid', time: '1d ago' },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="mt-0.5">{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700">{a.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
