import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, DollarSign, Edit2, FileText, Mail, MapPin, Phone, Plus, Receipt, ShoppingCart, Star, User,
} from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, EmptyState, Input, Modal, StatCard, Table, Textarea } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

const TABS = ['Overview', 'Estimates', 'Orders', 'Invoices', 'Activity'];

const statusColor = (status: string) => {
  const map: Record<string, 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple'> = {
    pending: 'yellow',
    hot: 'red',
    cold: 'blue',
    won: 'green',
    lost: 'gray',
    in_progress: 'blue',
    on_hold: 'yellow',
    completed: 'green',
    canceled: 'gray',
    draft: 'gray',
    sent: 'blue',
    posted: 'purple',
    paid: 'green',
    overdue: 'red',
    void: 'gray',
  };

  return map[status] || 'gray';
};

export const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contacts, customers, quotes, orders, invoices, updateContact } = useStore();
  const [activeTab, setActiveTab] = useState('Overview');
  const [editMode, setEditMode] = useState(false);

  const contact = contacts.find((item) => item.id === id);
  const [editForm, setEditForm] = useState(contact);

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Contact not found.</p>
        <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/contacts')}>
          Back to Contacts
        </Button>
      </div>
    );
  }

  const customer = customers.find((item) => item.id === contact.customerId);
  const contactQuotes = quotes.filter((item) => item.contactId === contact.id);
  const contactOrders = orders.filter((item) => item.contactId === contact.id);
  const contactOrderIds = new Set(contactOrders.map((item) => item.id));
  const contactInvoices = invoices.filter((item) => item.orderIds.some((orderId) => contactOrderIds.has(orderId)));

  const openEstimates = contactQuotes.filter((item) => item.status === 'pending' || item.status === 'hot').length;
  const activeOrders = contactOrders.filter((item) => item.status === 'in_progress').length;
  const unpaidBalance = contactInvoices
    .filter((item) => item.status !== 'paid' && item.status !== 'void')
    .reduce((sum, item) => sum + (item.total - (item.paidAmount || 0)), 0);
  const orderRevenue = contactOrders.reduce((sum, item) => sum + (item.total || 0), 0);

  const activity = useMemo(() => (
    [
      ...contactQuotes.map((item) => ({
        id: item.id,
        type: 'estimate' as const,
        number: item.number,
        title: item.title,
        status: item.status,
        total: item.total,
        createdAt: item.createdAt,
      })),
      ...contactOrders.map((item) => ({
        id: item.id,
        type: 'order' as const,
        number: item.number,
        title: item.title || item.description || 'Order',
        status: item.status,
        total: item.total,
        createdAt: item.createdAt,
      })),
      ...contactInvoices.map((item) => ({
        id: item.id,
        type: 'invoice' as const,
        number: item.number,
        title: customer?.name || 'Invoice',
        status: item.status,
        total: item.total,
        createdAt: item.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  ), [contactInvoices, contactOrders, contactQuotes, customer?.name]);

  const handleSaveEdit = () => {
    if (!editForm) return;

    if (editForm.isPrimary) {
      contacts
        .filter((item) => item.customerId === contact.customerId && item.id !== contact.id && item.isPrimary)
        .forEach((item) => updateContact(item.id, { isPrimary: false }));
    }

    updateContact(contact.id, editForm);
    setEditMode(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/contacts')}>
          Contacts
        </Button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium">{contact.firstName} {contact.lastName}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{contact.firstName} {contact.lastName}</h1>
              {contact.isPrimary && <Badge color="blue">Primary</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {contact.title && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />{contact.title}
                </span>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="text-sm text-gray-500 hover:text-brand-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />{contact.email}
                </a>
              )}
              {contact.phone && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />{contact.phone}
                </span>
              )}
              {contact.mobile && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />{contact.mobile}
                </span>
              )}
            </div>
            {customer && (
              <button
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
              >
                <Building2 className="w-3.5 h-3.5" />
                {customer.name}
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Edit2 className="w-4 h-4" />} onClick={() => { setEditForm(contact); setEditMode(true); }}>
            Edit
          </Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate(`/quotes/new?customerId=${contact.customerId}&contactId=${contact.id}`)}>
            New Estimate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Open Estimates" value={String(openEstimates)} icon={<FileText className="w-5 h-5 text-yellow-600" />} color="bg-yellow-50" />
        <StatCard title="Active Orders" value={String(activeOrders)} icon={<ShoppingCart className="w-5 h-5 text-brand-600" />} color="bg-brand-50" />
        <StatCard title="Order Revenue" value={formatCurrency(orderRevenue)} icon={<DollarSign className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="Balance Due" value={formatCurrency(unpaidBalance)} icon={<Receipt className="w-5 h-5 text-red-600" />} color="bg-red-50" />
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
              {tab === 'Estimates' && contactQuotes.length > 0 && <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{contactQuotes.length}</span>}
              {tab === 'Orders' && contactOrders.length > 0 && <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{contactOrders.length}</span>}
              {tab === 'Invoices' && contactInvoices.length > 0 && <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{contactInvoices.length}</span>}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Recent Estimates</h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('Estimates')}>All</Button>
              </div>
              {contactQuotes.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No estimates for this contact yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {contactQuotes.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/quotes/${item.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.number}</p>
                          <p className="text-xs text-gray-500">{item.title} · {formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={statusColor(item.status)}>{item.status}</Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('Orders')}>All</Button>
              </div>
              {contactOrders.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No orders for this contact yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {contactOrders.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${item.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.number}</p>
                          <p className="text-xs text-gray-500">{item.title || item.description || 'Order'} · {formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={statusColor(item.status)}>{item.status.replace('_', ' ')}</Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Recent Invoices</h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('Invoices')}>All</Button>
              </div>
              {contactInvoices.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No invoices for this contact yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {contactInvoices.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/invoices/${item.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.number}</p>
                          <p className="text-xs text-gray-500">{formatDate(item.createdAt)}{item.dueDate ? ` · due ${formatDate(item.dueDate)}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={statusColor(item.status)}>{item.status}</Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Details</h3>
                <div className="space-y-2">
                  {contact.email && (
                    <div className="flex gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <a href={`mailto:${contact.email}`} className="text-brand-600 hover:underline text-xs">{contact.email}</a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-600 text-xs">{contact.phone}</span>
                    </div>
                  )}
                  {contact.mobile && (
                    <div className="flex gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-600 text-xs">Mobile: {contact.mobile}</span>
                    </div>
                  )}
                  {contact.title && (
                    <div className="flex gap-2 text-sm">
                      <Star className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-600 text-xs">{contact.title}</span>
                    </div>
                  )}
                  <div className="flex gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-gray-600 text-xs">Added {formatDate(contact.createdAt)}</span>
                  </div>
                  {contact.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">{contact.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {customer && (
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Account</h3>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/customers/${customer.id}`)}>Open</Button>
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => navigate(`/customers/${customer.id}`)} className="text-left text-sm font-semibold text-brand-600 hover:underline">
                      {customer.name}
                    </button>
                    {(customer.city || customer.state) && (
                      <div className="flex gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-gray-600 text-xs">{[customer.city, customer.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-gray-600 text-xs">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-gray-600 text-xs">{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Estimates</span>
                    <span className="font-semibold text-gray-900">{contactQuotes.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Orders</span>
                    <span className="font-semibold text-gray-900">{contactOrders.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Invoices</span>
                    <span className="font-semibold text-gray-900">{contactInvoices.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Order Revenue</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(orderRevenue)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'Estimates' && (
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Estimates</h3>
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate(`/quotes/new?customerId=${contact.customerId}&contactId=${contact.id}`)}>
              New Estimate
            </Button>
          </div>
          {contactQuotes.length === 0 ? (
            <EmptyState icon={<FileText className="w-8 h-8 text-gray-300" />} title="No estimates" description="Create the first estimate for this contact." action={<Button variant="primary" onClick={() => navigate(`/quotes/new?customerId=${contact.customerId}&contactId=${contact.id}`)}>New Estimate</Button>} />
          ) : (
            <Table headers={['Estimate #', 'Title', 'Status', 'Created', 'Valid Until', 'Total', '']}>
              {contactQuotes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/quotes/${item.id}`)}>
                  <td className="py-3 px-4 text-sm font-mono font-medium text-brand-600">{item.number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{item.title}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(item.status)}>{item.status}</Badge></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{item.validUntil ? formatDate(item.validUntil) : '—'}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                  <td className="py-3 px-4"><Button size="sm" variant="ghost">View</Button></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'Orders' && (
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Orders</h3>
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate(`/orders/new?customerId=${contact.customerId}&contactId=${contact.id}`)}>
              New Order
            </Button>
          </div>
          {contactOrders.length === 0 ? (
            <EmptyState icon={<ShoppingCart className="w-8 h-8 text-gray-300" />} title="No orders" description="Create the first order for this contact." action={<Button variant="primary" onClick={() => navigate(`/orders/new?customerId=${contact.customerId}&contactId=${contact.id}`)}>New Order</Button>} />
          ) : (
            <Table headers={['Order #', 'Title', 'Status', 'Created', 'Due Date', 'Total', '']}>
              {contactOrders.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${item.id}`)}>
                  <td className="py-3 px-4 text-sm font-mono font-medium text-brand-600">{item.number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{item.title || item.description || 'Order'}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(item.status)}>{item.status.replace('_', ' ')}</Badge></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{item.dueDate ? formatDate(item.dueDate) : '—'}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                  <td className="py-3 px-4"><Button size="sm" variant="ghost">View</Button></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'Invoices' && (
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Invoices</h3>
          </div>
          {contactInvoices.length === 0 ? (
            <EmptyState icon={<Receipt className="w-8 h-8 text-gray-300" />} title="No invoices" description="Invoices will appear here once this contact's orders are invoiced." />
          ) : (
            <Table headers={['Invoice #', 'Status', 'Issued', 'Due', 'Total', 'Paid', 'Balance', '']}>
              {contactInvoices.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/invoices/${item.id}`)}>
                  <td className="py-3 px-4 text-sm font-mono font-medium text-brand-600">{item.number}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(item.status)}>{item.status}</Badge></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{item.dueDate ? formatDate(item.dueDate) : '—'}</td>
                  <td className="py-3 px-4 text-sm font-semibold">{formatCurrency(item.total)}</td>
                  <td className="py-3 px-4 text-sm text-green-600">{formatCurrency(item.paidAmount || 0)}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-red-600">{formatCurrency(item.total - (item.paidAmount || 0))}</td>
                  <td className="py-3 px-4"><Button size="sm" variant="ghost">View</Button></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'Activity' && (
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Activity Log</h3>
          </div>
          <div className="p-4 space-y-3">
            {activity.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => navigate(`/${item.type === 'estimate' ? 'quotes' : item.type === 'order' ? 'orders' : 'invoices'}/${item.id}`)}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  item.type === 'estimate' ? 'bg-yellow-100' : item.type === 'order' ? 'bg-brand-100' : 'bg-purple-100'
                }`}>
                  {item.type === 'estimate' ? <FileText className="w-4 h-4 text-yellow-600" /> : item.type === 'order' ? <ShoppingCart className="w-4 h-4 text-brand-600" /> : <Receipt className="w-4 h-4 text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {item.type === 'estimate' ? 'Estimate' : item.type === 'order' ? 'Order' : 'Invoice'} {item.number} - {item.title}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge color={statusColor(item.status)}>{item.status.replace('_', ' ')}</Badge>
                  <span className="text-sm font-semibold text-gray-700">{formatCurrency(item.total)}</span>
                </div>
              </button>
            ))}
            {activity.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No activity yet</div>
            )}
          </div>
        </Card>
      )}

      <Modal isOpen={editMode} onClose={() => setEditMode(false)} title="Edit Contact" size="lg">
        {editForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={editForm.firstName} onChange={(e) => setEditForm((current) => current ? { ...current, firstName: e.target.value } : current)} />
              <Input label="Last Name" value={editForm.lastName} onChange={(e) => setEditForm((current) => current ? { ...current, lastName: e.target.value } : current)} />
            </div>
            <Input label="Title / Role" value={editForm.title || ''} onChange={(e) => setEditForm((current) => current ? { ...current, title: e.target.value } : current)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={editForm.email || ''} onChange={(e) => setEditForm((current) => current ? { ...current, email: e.target.value } : current)} />
              <Input label="Phone" value={editForm.phone || ''} onChange={(e) => setEditForm((current) => current ? { ...current, phone: e.target.value } : current)} />
            </div>
            <Input label="Mobile" value={editForm.mobile || ''} onChange={(e) => setEditForm((current) => current ? { ...current, mobile: e.target.value } : current)} />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editForm.isPrimary}
                onChange={(e) => setEditForm((current) => current ? { ...current, isPrimary: e.target.checked } : current)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Primary contact
            </label>
            <Textarea label="Notes" value={editForm.notes || ''} onChange={(e) => setEditForm((current) => current ? { ...current, notes: e.target.value } : current)} rows={3} />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={!editForm.firstName || !editForm.lastName}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
