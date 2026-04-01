import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Edit2, Plus,
  FileText, ShoppingCart, Receipt, TrendingUp, User, Tag,
  ExternalLink, Clock, DollarSign, Star, MoreVertical
} from 'lucide-react';
import { useStore } from '../../store';
import {
  Button, Card, Badge, Modal, Input, Textarea, PageHeader, Table, EmptyState, StatCard
} from '../../components/ui';
import { nanoid } from '../../utils/nanoid';
import { formatDate, formatCurrency } from '../../data/mockData';

const TABS = ['Overview', 'Quotes', 'Orders', 'Invoices', 'Contacts', 'Activity'];

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, contacts, quotes, orders, invoices, updateCustomer, addContact } = useStore();

  const customer = customers.find(c => c.id === id);
  const [activeTab, setActiveTab] = useState('Overview');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<typeof customer>(customer);
  const [showNewContact, setShowNewContact] = useState(false);
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', title: '', email: '', phone: '', isPrimary: false, notes: '' });

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Customer not found.</p>
        <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const custContacts = contacts.filter(c => c.customerId === customer.id);
  const custQuotes = quotes.filter(q => q.customerId === customer.id);
  const custOrders = orders.filter(o => o.customerId === customer.id);
  const custInvoices = invoices.filter(i => i.customerId === customer.id);
  const primaryContact = custContacts.find(c => c.isPrimary) || custContacts[0];

  const totalRevenue = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const openQuotes = custQuotes.filter(q => q.status === 'pending' || q.status === 'hot').length;
  const activeOrders = custOrders.filter(o => o.status === 'in_progress').length;
  const unpaidBalance = custInvoices.filter(i => i.status !== 'paid' && i.status !== 'void').reduce((sum, i) => sum + (i.total - (i.paidAmount || 0)), 0);

  const handleSaveEdit = () => {
    if (editForm) {
      updateCustomer(customer.id, editForm);
      setEditMode(false);
    }
  };

  const handleAddContact = () => {
    addContact({
      id: nanoid(),
      customerId: customer.id,
      ...contactForm,
      isPrimary: custContacts.length === 0 ? true : contactForm.isPrimary,
      createdAt: new Date().toISOString(),
    });
    setShowNewContact(false);
    setContactForm({ firstName: '', lastName: '', title: '', email: '', phone: '', isPrimary: false, notes: '' });
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: 'yellow', hot: 'red', cold: 'blue', won: 'green', lost: 'gray',
      in_progress: 'blue', on_hold: 'yellow', completed: 'green', canceled: 'gray',
      draft: 'gray', sent: 'blue', posted: 'purple', paid: 'green', overdue: 'red', void: 'gray',
    };
    return (map[s] || 'gray') as 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/customers')}>
          Customers
        </Button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium">{customer.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="text-sm text-gray-500 hover:text-brand-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />{customer.email}
                </a>
              )}
              {customer.phone && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />{customer.phone}
                </span>
              )}
              {(customer.city || customer.state) && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />{[customer.city, customer.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              {customer.tags?.map(tag => <Badge key={tag} color="blue">{tag}</Badge>)}
              {customer.taxExempt && <Badge color="yellow">Tax Exempt</Badge>}
              {customer.source === 'planprophet' && <Badge color="purple">PlanProphet</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Edit2 className="w-4 h-4" />} onClick={() => { setEditForm(customer); setEditMode(true); }}>
            Edit
          </Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate(`/quotes/new?customerId=${customer.id}`)}>
            New Quote
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="12-Month Revenue"
          value={formatCurrency(customer.sales12m || totalRevenue)}
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          color="green"
        />
        <StatCard
          title="All-Time Revenue"
          value={formatCurrency(customer.salesHistorically || totalRevenue)}
          icon={<DollarSign className="w-5 h-5 text-brand-600" />}
          color="blue"
        />
        <StatCard
          title="Open Quotes"
          value={String(openQuotes)}
          icon={<FileText className="w-5 h-5 text-yellow-600" />}
          color="yellow"
        />
        <StatCard
          title="Active Orders"
          value={String(activeOrders)}
          icon={<ShoppingCart className="w-5 h-5 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0">
          {TABS.map(tab => (
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
              {tab === 'Quotes' && custQuotes.length > 0 && (
                <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{custQuotes.length}</span>
              )}
              {tab === 'Orders' && custOrders.length > 0 && (
                <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{custOrders.length}</span>
              )}
              {tab === 'Contacts' && custContacts.length > 0 && (
                <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{custContacts.length}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Recent Activity */}
            <Card>
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
              </div>
              {custOrders.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No orders yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {custOrders.slice(0, 8).map(o => (
                    <div key={o.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{o.number}</p>
                          <p className="text-xs text-gray-500">{o.description || 'Order'} · {formatDate(o.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={statusColor(o.status)}>{o.status.replace('_', ' ')}</Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(o.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Quotes */}
            <Card>
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Recent Quotes</h3>
              </div>
              {custQuotes.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No quotes yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {custQuotes.slice(0, 5).map(q => (
                    <div key={q.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/quotes/${q.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{q.number}</p>
                          <p className="text-xs text-gray-500">{q.title} · {formatDate(q.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={statusColor(q.status)}>{q.status}</Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(q.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Primary Contact */}
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Primary Contact</h3>
                  <Button size="sm" variant="ghost" onClick={() => setActiveTab('Contacts')}>All</Button>
                </div>
                {primaryContact ? (
                  <div onClick={() => navigate(`/contacts/${primaryContact.id}`)} className="flex items-start gap-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold">
                      {primaryContact.firstName.charAt(0)}{primaryContact.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{primaryContact.firstName} {primaryContact.lastName}</p>
                      {primaryContact.title && <p className="text-xs text-gray-500">{primaryContact.title}</p>}
                      {primaryContact.email && (
                        <a href={`mailto:${primaryContact.email}`} className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />{primaryContact.email}
                        </a>
                      )}
                      {primaryContact.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{primaryContact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400 mb-2">No contacts yet</p>
                    <Button size="sm" variant="secondary" onClick={() => setShowNewContact(true)}>Add Contact</Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Company Info */}
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Company Info</h3>
                <div className="space-y-2">
                  {customer.address && (
                    <div className="flex gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-600 text-xs">{customer.address}{customer.city ? `, ${customer.city}` : ''}{customer.state ? `, ${customer.state}` : ''} {customer.zip || ''}</span>
                    </div>
                  )}
                  {customer.website && (
                    <div className="flex gap-2 text-sm">
                      <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-xs">{customer.website}</a>
                    </div>
                  )}
                  <div className="flex gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-gray-600 text-xs">Customer since {formatDate(customer.createdAt)}</span>
                  </div>
                  {customer.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">{customer.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Financial Summary</h3>
                <div className="space-y-2">
                  {[
                    { label: '12-Month Sales', value: formatCurrency(customer.sales12m || 0), highlight: true },
                    { label: 'All-Time Sales', value: formatCurrency(customer.salesHistorically || 0) },
                    { label: 'Total Orders', value: String(custOrders.length) },
                    { label: 'Open Balance', value: formatCurrency(unpaidBalance), warn: unpaidBalance > 0 },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{row.label}</span>
                      <span className={`font-semibold ${row.highlight ? 'text-green-600' : row.warn ? 'text-red-600' : 'text-gray-900'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'Quotes' && (
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Quotes</h3>
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate(`/quotes/new?customerId=${customer.id}`)}>New Quote</Button>
          </div>
          {custQuotes.length === 0 ? (
            <EmptyState icon={<FileText className="w-8 h-8 text-gray-300" />} title="No quotes" description="Create the first quote for this customer." action={<Button variant="primary" onClick={() => navigate(`/quotes/new?customerId=${customer.id}`)}>New Quote</Button>} />
          ) : (
            <Table headers={['Quote #', 'Title', 'Status', 'Created', 'Valid Until', 'Total', '']}>
              {custQuotes.map(q => (
                <tr key={q.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/quotes/${q.id}`)}>
                  <td className="py-3 px-4 text-sm obj-num font-medium text-brand-600">{q.number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{q.title}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(q.status)}>{q.status}</Badge></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(q.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{q.validUntil ? formatDate(q.validUntil) : '—'}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatCurrency(q.total)}</td>
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
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate(`/orders/new?customerId=${customer.id}`)}>New Order</Button>
          </div>
          {custOrders.length === 0 ? (
            <EmptyState icon={<ShoppingCart className="w-8 h-8 text-gray-300" />} title="No orders" description="No orders for this customer yet." />
          ) : (
            <Table headers={['Order #', 'Description', 'Status', 'Date In', 'Date Out', 'Total', '']}>
              {custOrders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                  <td className="py-3 px-4 text-sm obj-num font-medium text-brand-600">{o.number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{o.description || '—'}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(o.status)}>{o.status.replace('_', ' ')}</Badge></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(o.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{o.dueDate ? formatDate(o.dueDate) : '—'}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatCurrency(o.total)}</td>
                  <td className="py-3 px-4"><Button size="sm" variant="ghost">View</Button></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'Invoices' && (
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Invoices</h3>
          </div>
          {custInvoices.length === 0 ? (
            <EmptyState icon={<Receipt className="w-8 h-8 text-gray-300" />} title="No invoices" description="Invoices appear here after converting orders." />
          ) : (
            <Table headers={['Invoice #', 'Status', 'Issued', 'Due', 'Total', 'Paid', 'Balance', '']}>
              {custInvoices.map(i => (
                <tr key={i.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/invoices/${i.id}`)}>
                  <td className="py-3 px-4 text-sm obj-num font-medium text-brand-600">{i.number}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(i.status)}>{i.status}</Badge></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(i.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{i.dueDate ? formatDate(i.dueDate) : '—'}</td>
                  <td className="py-3 px-4 text-sm font-semibold">{formatCurrency(i.total)}</td>
                  <td className="py-3 px-4 text-sm text-green-600">{formatCurrency(i.paidAmount || 0)}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-red-600">{formatCurrency(i.total - (i.paidAmount || 0))}</td>
                  <td className="py-3 px-4"><Button size="sm" variant="ghost">View</Button></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'Contacts' && (
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Contacts</h3>
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNewContact(true)}>Add Contact</Button>
          </div>
          {custContacts.length === 0 ? (
            <EmptyState icon={<User className="w-8 h-8 text-gray-300" />} title="No contacts" description="Add contacts for this customer." action={<Button variant="primary" onClick={() => setShowNewContact(true)}>Add Contact</Button>} />
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4">
              {custContacts.map(c => (
                <div key={c.id} onClick={() => navigate(`/contacts/${c.id}`)} className="border border-gray-200 rounded-xl p-4 hover:border-brand-300 transition-colors text-left cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                        {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                          {c.isPrimary && <Badge color="blue">Primary</Badge>}
                        </div>
                        {c.title && <p className="text-xs text-gray-500">{c.title}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="text-xs text-brand-600 hover:underline flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />{c.email}
                      </a>
                    )}
                    {c.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />{c.phone}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'Activity' && (
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Activity Log</h3>
          </div>
          <div className="p-4 space-y-3">
            {[...custOrders.slice(0, 5), ...custQuotes.slice(0, 5)]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((item, i) => {
                const isOrder = 'orderNumber' in item;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOrder ? 'bg-brand-100' : 'bg-yellow-100'}`}>
                      {isOrder ? <ShoppingCart className="w-4 h-4 text-brand-600" /> : <FileText className="w-4 h-4 text-yellow-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {isOrder ? `Order ${(item as any).orderNumber}` : `Quote ${(item as any).quoteNumber}`} — {(item as any).description || (item as any).title || 'Item'}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency((item as any).total)}</span>
                  </div>
                );
              })}
            {custOrders.length === 0 && custQuotes.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No activity yet</div>
            )}
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editMode} onClose={() => setEditMode(false)} title="Edit Customer" size="lg">
        {editForm && (
          <div className="space-y-4">
            <Input label="Company Name" value={editForm.name} onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={editForm.email || ''} onChange={e => setEditForm(f => f ? { ...f, email: e.target.value } : f)} />
              <Input label="Phone" value={editForm.phone || ''} onChange={e => setEditForm(f => f ? { ...f, phone: e.target.value } : f)} />
            </div>
            <Input label="Website" value={editForm.website || ''} onChange={e => setEditForm(f => f ? { ...f, website: e.target.value } : f)} />
            <Input label="Address" value={editForm.address || ''} onChange={e => setEditForm(f => f ? { ...f, address: e.target.value } : f)} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="City" value={editForm.city || ''} onChange={e => setEditForm(f => f ? { ...f, city: e.target.value } : f)} />
              <Input label="State" value={editForm.state || ''} onChange={e => setEditForm(f => f ? { ...f, state: e.target.value } : f)} />
              <Input label="ZIP" value={editForm.zip || ''} onChange={e => setEditForm(f => f ? { ...f, zip: e.target.value } : f)} />
            </div>
            <Textarea label="Notes" value={editForm.notes || ''} onChange={e => setEditForm(f => f ? { ...f, notes: e.target.value } : f)} rows={3} />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Contact Modal */}
      <Modal isOpen={showNewContact} onClose={() => setShowNewContact(false)} title="Add Contact">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={contactForm.firstName} onChange={e => setContactForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input label="Last Name" value={contactForm.lastName} onChange={e => setContactForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Input label="Title / Role" value={contactForm.title} onChange={e => setContactForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Marketing Manager" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <Textarea label="Notes" value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowNewContact(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddContact} disabled={!contactForm.firstName || !contactForm.lastName}>Add Contact</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
