import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Edit2, Plus, X, Check,
  FileText, ShoppingCart, Receipt, TrendingUp, User,
  ExternalLink, Clock, DollarSign, Star, Truck, CreditCard,
  ChevronRight, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { useStore } from '../../store';
import {
  Button, Card, Badge, Modal, Input, Textarea, PageHeader, Table, EmptyState, StatCard
} from '../../components/ui';
import { AddressAutocomplete } from '../../components/ui/AddressAutocomplete';
import { nanoid } from '../../utils/nanoid';
import { formatDate, formatCurrency } from '../../data/mockData';
import type { CustomerShippingAddress } from '../../types';

// ─── Tab list ────────────────────────────────────────────────────────────────
const TABS = ['Details', 'Contacts', 'Quotes', 'Orders', 'Invoices', 'Activity'];

// ─── Activity event builder ───────────────────────────────────────────────────
type ActivityEvent = {
  id: string;
  ts: string;
  icon: React.ReactNode;
  color: string;
  label: string;
  sub: string;
  amount?: number;
  link?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtAddr = (a: Partial<CustomerShippingAddress> & { address?: string; city?: string; state?: string; zip?: string; country?: string }) =>
  [a.address, a.city, a.state, a.zip, a.country].filter(Boolean).join(', ');

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, contacts, quotes, orders, invoices, updateCustomer, addContact, companySettings } = useStore();

  const customer = customers.find(c => c.id === id);

  const [activeTab, setActiveTab] = useState('Details');

  // ── Edit customer modal state ──
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<typeof customer>(customer);

  // ── New contact modal state ──
  const [showNewContact, setShowNewContact] = useState(false);
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', title: '', email: '', phone: '', mobile: '', isPrimary: false, notes: '' });

  // ── Shipping address modal state ──
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState<Omit<CustomerShippingAddress, 'id'>>({ label: '', address: '', city: '', state: '', zip: '', country: '', isDefault: false });

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

  const custContacts  = contacts.filter(c => c.customerId === customer.id);
  const custQuotes    = quotes.filter(q => q.customerId === customer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const custOrders    = orders.filter(o => o.customerId === customer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const custInvoices  = invoices.filter(i => i.customerId === customer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const primaryContact = custContacts.find(c => c.isPrimary) || custContacts[0];
  const defaultBuyer   = customer.defaultBuyerContactId ? custContacts.find(c => c.id === customer.defaultBuyerContactId) : undefined;
  const defaultPayer   = customer.defaultPayerContactId ? custContacts.find(c => c.id === customer.defaultPayerContactId) : undefined;
  const shippingAddresses: CustomerShippingAddress[] = customer.shippingAddresses || [];

  const totalRevenue  = custOrders.reduce((s, o) => s + (o.total || 0), 0);
  const openQuotes    = custQuotes.filter(q => q.status === 'pending' || q.status === 'hot').length;
  const activeOrders  = custOrders.filter(o => o.status === 'in_progress').length;
  const unpaidBalance = custInvoices.filter(i => i.status !== 'paid' && i.status !== 'void').reduce((s, i) => s + (i.total - ((i as any).paidAmount || 0)), 0);

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: 'yellow', hot: 'red', cold: 'blue', won: 'green', lost: 'gray',
      in_progress: 'blue', on_hold: 'yellow', completed: 'green', canceled: 'gray',
      draft: 'gray', sent: 'blue', posted: 'purple', paid: 'green', overdue: 'red', void: 'gray',
    };
    return (map[s] || 'gray') as 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple';
  };

  // ── Activity timeline ──────────────────────────────────────────────────────
  const activityEvents: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];

    custQuotes.forEach(q => {
      events.push({
        id: `q-created-${q.id}`,
        ts: q.createdAt,
        icon: <FileText className="w-4 h-4" />,
        color: 'bg-yellow-100 text-yellow-600',
        label: `Quote created — ${q.number}`,
        sub: q.title || '',
        amount: q.total,
        link: `/quotes/${q.id}`,
      });
      if (q.status === 'won') {
        events.push({
          id: `q-won-${q.id}`,
          ts: q.statusChangedAt || q.updatedAt,
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-emerald-100 text-emerald-600',
          label: `Quote won — ${q.number}`,
          sub: q.title || '',
          amount: q.total,
          link: `/quotes/${q.id}`,
        });
      }
      if (q.status === 'lost') {
        events.push({
          id: `q-lost-${q.id}`,
          ts: q.statusChangedAt || q.updatedAt,
          icon: <XCircle className="w-4 h-4" />,
          color: 'bg-red-100 text-red-500',
          label: `Quote lost — ${q.number}`,
          sub: q.title || '',
          amount: q.total,
          link: `/quotes/${q.id}`,
        });
      }
      if (q.convertedToOrderId) {
        events.push({
          id: `q-converted-${q.id}`,
          ts: q.statusChangedAt || q.updatedAt,
          icon: <ChevronRight className="w-4 h-4" />,
          color: 'bg-blue-100 text-blue-600',
          label: `Quote converted to order — ${q.number}`,
          sub: q.title || '',
          amount: q.total,
          link: `/quotes/${q.id}`,
        });
      }
    });

    custOrders.forEach(o => {
      events.push({
        id: `o-created-${o.id}`,
        ts: o.createdAt,
        icon: <ShoppingCart className="w-4 h-4" />,
        color: 'bg-brand-100 text-brand-600',
        label: `Order entered — ${o.number}`,
        sub: o.title || o.description || '',
        amount: o.total,
        link: `/orders/${o.id}`,
      });
      if (o.status === 'completed') {
        events.push({
          id: `o-completed-${o.id}`,
          ts: o.updatedAt,
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-emerald-100 text-emerald-600',
          label: `Order completed — ${o.number}`,
          sub: o.title || o.description || '',
          amount: o.total,
          link: `/orders/${o.id}`,
        });
      }
      if (o.status === 'canceled') {
        events.push({
          id: `o-canceled-${o.id}`,
          ts: o.updatedAt,
          icon: <XCircle className="w-4 h-4" />,
          color: 'bg-gray-100 text-gray-500',
          label: `Order canceled — ${o.number}`,
          sub: o.title || o.description || '',
          amount: o.total,
          link: `/orders/${o.id}`,
        });
      }
    });

    custInvoices.forEach(inv => {
      if ((inv as any).paidAmount >= inv.total) {
        events.push({
          id: `inv-paid-${inv.id}`,
          ts: (inv as any).paidAt || inv.updatedAt,
          icon: <DollarSign className="w-4 h-4" />,
          color: 'bg-emerald-100 text-emerald-700',
          label: `Invoice paid — ${inv.number}`,
          sub: '',
          amount: inv.total,
          link: `/invoices/${inv.id}`,
        });
      }
      if (inv.status === 'overdue') {
        events.push({
          id: `inv-overdue-${inv.id}`,
          ts: inv.updatedAt,
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'bg-red-100 text-red-600',
          label: `Invoice overdue — ${inv.number}`,
          sub: '',
          amount: inv.total - ((inv as any).paidAmount || 0),
          link: `/invoices/${inv.id}`,
        });
      }
    });

    return events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  }, [custQuotes, custOrders, custInvoices]);

  // ── Customer save ──────────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (editForm) { updateCustomer(customer.id, editForm); setEditMode(false); }
  };

  // ── Contact add ────────────────────────────────────────────────────────────
  const handleAddContact = () => {
    addContact({
      id: nanoid(), customerId: customer.id, ...contactForm,
      isPrimary: custContacts.length === 0 ? true : contactForm.isPrimary,
      createdAt: new Date().toISOString(),
    });
    setShowNewContact(false);
    setContactForm({ firstName: '', lastName: '', title: '', email: '', phone: '', mobile: '', isPrimary: false, notes: '' });
  };

  // ── Shipping address CRUD ──────────────────────────────────────────────────
  const openNewAddr = () => {
    setEditingAddrId(null);
    setAddrForm({ label: '', address: '', city: '', state: '', zip: '', country: '', isDefault: false });
    setShowAddrModal(true);
  };
  const openEditAddr = (addr: CustomerShippingAddress) => {
    setEditingAddrId(addr.id);
    setAddrForm({ label: addr.label || '', address: addr.address, city: addr.city || '', state: addr.state || '', zip: addr.zip || '', country: addr.country || '', isDefault: addr.isDefault || false });
    setShowAddrModal(true);
  };
  const handleSaveAddr = () => {
    const existing = customer.shippingAddresses || [];
    let updated: CustomerShippingAddress[];
    if (editingAddrId) {
      updated = existing.map(a => a.id === editingAddrId ? { ...a, ...addrForm } : a);
    } else {
      const newAddr: CustomerShippingAddress = { id: nanoid(), ...addrForm };
      updated = addrForm.isDefault ? [...existing.map(a => ({ ...a, isDefault: false })), newAddr] : [...existing, newAddr];
    }
    if (addrForm.isDefault) updated = updated.map(a => ({ ...a, isDefault: a.id === (editingAddrId || updated[updated.length - 1].id) }));
    updateCustomer(customer.id, { shippingAddresses: updated });
    setShowAddrModal(false);
  };
  const handleDeleteAddr = (addrId: string) => {
    updateCustomer(customer.id, { shippingAddresses: (customer.shippingAddresses || []).filter(a => a.id !== addrId) });
  };

  const DEFAULT_PAYMENT_TERMS   = ['Net 10', 'Net 15', 'Net 30', 'COD'];
  const DEFAULT_DELIVERY_METHODS = ['Pickup', 'Local Delivery', 'FedEx', 'UPS'];
  const allTerms   = [...DEFAULT_PAYMENT_TERMS,   ...(companySettings.customTerms           || [])];
  const allMethods = [...DEFAULT_DELIVERY_METHODS, ...(companySettings.customDeliveryMethods || [])];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/customers')}>Customers</Button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium">{customer.name}</span>
      </div>

      {/* Hero */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {customer.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              {customer.customerNumber && (
                <span className="text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg tracking-wide">
                  {customer.customerNumber}
                </span>
              )}
            </div>
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
          <Button variant="secondary" icon={<Edit2 className="w-4 h-4" />} onClick={() => { setEditForm(customer); setEditMode(true); }}>Edit</Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate(`/quotes/new?customerId=${customer.id}`)}>New Quote</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="12-Month Revenue" value={formatCurrency(customer.sales12m || totalRevenue)} icon={<TrendingUp className="w-5 h-5 text-green-600" />} color="green" />
        <StatCard title="All-Time Revenue"  value={formatCurrency(customer.salesHistorically || totalRevenue)} icon={<DollarSign className="w-5 h-5 text-brand-600" />} color="blue" />
        <StatCard title="Open Quotes"       value={String(openQuotes)}   icon={<FileText className="w-5 h-5 text-yellow-600" />} color="yellow" />
        <StatCard title="Active Orders"     value={String(activeOrders)} icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} color="purple" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              {tab}
              {tab === 'Quotes'   && custQuotes.length   > 0 && <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{custQuotes.length}</span>}
              {tab === 'Orders'   && custOrders.length   > 0 && <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{custOrders.length}</span>}
              {tab === 'Contacts' && custContacts.length > 0 && <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{custContacts.length}</span>}
              {tab === 'Activity' && activityEvents.length > 0 && <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{activityEvents.length}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* ══════════════ DETAILS TAB ══════════════════════════════════════════════ */}
      {activeTab === 'Details' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">

            {/* Default Contacts */}
            <Card>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Default Contacts</h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('Contacts')}>Manage contacts</Button>
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {/* Default Buyer */}
                <div className="p-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Default Buyer
                  </p>
                  {defaultBuyer ? (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold flex-shrink-0">
                        {defaultBuyer.firstName.charAt(0)}{defaultBuyer.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{defaultBuyer.firstName} {defaultBuyer.lastName}</p>
                        {defaultBuyer.title && <p className="text-xs text-gray-500">{defaultBuyer.title}</p>}
                        {defaultBuyer.email && <a href={`mailto:${defaultBuyer.email}`} className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-1"><Mail className="w-3 h-3" />{defaultBuyer.email}</a>}
                        {defaultBuyer.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{defaultBuyer.phone}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-400 italic">Not assigned</p>
                      {custContacts.length > 0 && (
                        <select
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600"
                          value=""
                          onChange={e => e.target.value && updateCustomer(customer.id, { defaultBuyerContactId: e.target.value })}
                        >
                          <option value="">Assign…</option>
                          {custContacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                        </select>
                      )}
                    </div>
                  )}
                  {defaultBuyer && (
                    <button className="mt-3 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => updateCustomer(customer.id, { defaultBuyerContactId: undefined })}>
                      Remove assignment
                    </button>
                  )}
                  {!defaultBuyer && custContacts.length === 0 && (
                    <button className="mt-2 text-xs text-brand-600 hover:underline" onClick={() => setShowNewContact(true)}>Add a contact first</button>
                  )}
                </div>
                {/* Default Payer */}
                <div className="p-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Default Payer
                  </p>
                  {defaultPayer ? (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold flex-shrink-0">
                        {defaultPayer.firstName.charAt(0)}{defaultPayer.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{defaultPayer.firstName} {defaultPayer.lastName}</p>
                        {defaultPayer.title && <p className="text-xs text-gray-500">{defaultPayer.title}</p>}
                        {defaultPayer.email && <a href={`mailto:${defaultPayer.email}`} className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-1"><Mail className="w-3 h-3" />{defaultPayer.email}</a>}
                        {defaultPayer.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{defaultPayer.phone}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-400 italic">Not assigned</p>
                      {custContacts.length > 0 && (
                        <select
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600"
                          value=""
                          onChange={e => e.target.value && updateCustomer(customer.id, { defaultPayerContactId: e.target.value })}
                        >
                          <option value="">Assign…</option>
                          {custContacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                        </select>
                      )}
                    </div>
                  )}
                  {defaultPayer && (
                    <button className="mt-3 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => updateCustomer(customer.id, { defaultPayerContactId: undefined })}>
                      Remove assignment
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Addresses */}
            <Card>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> Addresses</h3>
              </div>
              {/* Main billing/mailing address */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Main Address (Billing / Mailing)</p>
                {customer.address ? (
                  <p className="text-sm text-gray-700">{fmtAddr(customer)}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No main address on file</p>
                )}
              </div>
              {/* Shipping addresses */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Shipping Addresses</p>
                  <button onClick={openNewAddr}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-semibold transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                {shippingAddresses.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No shipping addresses yet.</p>
                ) : (
                  <div className="space-y-2">
                    {shippingAddresses.map(addr => (
                      <div key={addr.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            {addr.label && <span className="text-xs font-semibold text-gray-700">{addr.label}</span>}
                            {addr.isDefault && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Default</span>}
                          </div>
                          <p className="text-sm text-gray-600">{fmtAddr(addr)}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditAddr(addr)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteAddr(addr.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Notes */}
            {customer.notes && (
              <Card className="px-5 py-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{customer.notes}</p>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Terms & Delivery — inline editable */}
            <Card>
              <div className="px-4 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Terms & Delivery</h3>
              </div>
              <div className="px-4 py-4 space-y-3">
                {/* Payment Terms — inline select */}
                <div className="flex justify-between items-center gap-3 text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5 flex-shrink-0"><CreditCard className="w-3.5 h-3.5 text-gray-400" /> Payment Terms</span>
                  <select
                    value={customer.terms || ''}
                    onChange={e => updateCustomer(customer.id, { terms: e.target.value || undefined })}
                    className="text-xs font-semibold text-gray-800 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-300 appearance-none bg-white cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <option value="">— None —</option>
                    {allTerms.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {/* Delivery Method — inline select */}
                <div className="flex justify-between items-center gap-3 text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5 flex-shrink-0"><Truck className="w-3.5 h-3.5 text-gray-400" /> Delivery</span>
                  <select
                    value={customer.deliveryMethod || ''}
                    onChange={e => updateCustomer(customer.id, { deliveryMethod: e.target.value || undefined, thirdPartyShipping: false, thirdPartyCarrierAccountNumber: undefined })}
                    className="text-xs font-semibold text-gray-800 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-300 appearance-none bg-white cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <option value="">— None —</option>
                    {allMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {/* Third-party shipping toggle — shown when FedEx or UPS selected */}
                {(customer.deliveryMethod === 'FedEx' || customer.deliveryMethod === 'UPS') && (
                  <div className="pl-5 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={customer.thirdPartyShipping || false}
                        onChange={e => updateCustomer(customer.id, { thirdPartyShipping: e.target.checked, thirdPartyCarrierAccountNumber: e.target.checked ? customer.thirdPartyCarrierAccountNumber : undefined })}
                        className="rounded border-gray-300 text-brand-600"
                      />
                      Third Party Shipping
                    </label>
                    {customer.thirdPartyShipping && (
                      <input
                        type="text"
                        value={customer.thirdPartyCarrierAccountNumber || ''}
                        onChange={e => updateCustomer(customer.id, { thirdPartyCarrierAccountNumber: e.target.value || undefined })}
                        placeholder="Carrier account number"
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white"
                      />
                    )}
                  </div>
                )}
                {customer.taxExempt && (
                  <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                    <span className="text-gray-500">Tax Status</span>
                    <span className="font-semibold text-amber-600">Exempt{customer.taxId ? ` · ${customer.taxId}` : ''}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Account Info */}
            <Card>
              <div className="px-4 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Account</h3>
              </div>
              <div className="px-4 py-4 space-y-2.5 text-sm">
                {[
                  { label: 'Customer #', value: customer.customerNumber },
                  { label: 'Account #',  value: customer.accountNumber },
                  { label: 'Website',    value: customer.website, link: customer.website },
                  { label: 'Since',      value: formatDate(customer.createdAt) },
                ].filter(r => r.value).map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-gray-400">{r.label}</span>
                    {r.link ? (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center gap-1 font-medium">
                        {r.value} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-800">{r.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Financial summary */}
            <Card>
              <div className="px-4 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Financial Summary</h3>
              </div>
              <div className="px-4 py-4 space-y-2.5 text-sm">
                {[
                  { label: '12-Month Sales', value: formatCurrency(customer.sales12m || 0), highlight: true },
                  { label: 'All-Time Sales',  value: formatCurrency(customer.salesHistorically || 0) },
                  { label: 'Total Orders',    value: String(custOrders.length) },
                  { label: 'Open Balance',    value: formatCurrency(unpaidBalance), warn: unpaidBalance > 0 },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-gray-500">{row.label}</span>
                    <span className={`font-semibold ${row.highlight ? 'text-green-600' : (row as any).warn ? 'text-red-600' : 'text-gray-900'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════ CONTACTS TAB ══════════════════════════════════════════════ */}
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
                <div key={c.id} className="border border-gray-200 rounded-xl p-4 hover:border-brand-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                        {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                          {c.isPrimary && <Badge color="blue">Primary</Badge>}
                          {c.id === customer.defaultBuyerContactId && <Badge color="yellow">Buyer</Badge>}
                          {c.id === customer.defaultPayerContactId && <Badge color="green">Payer</Badge>}
                        </div>
                        {c.title && <p className="text-xs text-gray-500">{c.title}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {c.email && <a href={`mailto:${c.email}`} className="text-xs text-brand-600 hover:underline flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email}</a>}
                    {c.phone && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.phone}</p>}
                    {(c as any).mobile && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3 h-3" />{(c as any).mobile} (mobile)</p>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 flex-wrap">
                    {c.id !== customer.defaultBuyerContactId && (
                      <button onClick={() => updateCustomer(customer.id, { defaultBuyerContactId: c.id })}
                        className="text-[10px] text-gray-400 hover:text-brand-600 font-medium transition-colors">Set as Buyer</button>
                    )}
                    {c.id !== customer.defaultPayerContactId && (
                      <button onClick={() => updateCustomer(customer.id, { defaultPayerContactId: c.id })}
                        className="text-[10px] text-gray-400 hover:text-emerald-600 font-medium transition-colors">Set as Payer</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ══════════════ QUOTES TAB ═══════════════════════════════════════════════ */}
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

      {/* ══════════════ ORDERS TAB ═══════════════════════════════════════════════ */}
      {activeTab === 'Orders' && (
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Orders</h3>
          </div>
          {custOrders.length === 0 ? (
            <EmptyState icon={<ShoppingCart className="w-8 h-8 text-gray-300" />} title="No orders" description="No orders for this customer yet." />
          ) : (
            <Table headers={['Order #', 'Description', 'Status', 'Date In', 'Due Date', 'Total', '']}>
              {custOrders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                  <td className="py-3 px-4 text-sm obj-num font-medium text-brand-600">{o.number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{o.title || o.description || '—'}</td>
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

      {/* ══════════════ INVOICES TAB ═════════════════════════════════════════════ */}
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
                  <td className="py-3 px-4 text-sm text-gray-500">{(i as any).dueDate ? formatDate((i as any).dueDate) : '—'}</td>
                  <td className="py-3 px-4 text-sm font-semibold">{formatCurrency(i.total)}</td>
                  <td className="py-3 px-4 text-sm text-green-600">{formatCurrency((i as any).paidAmount || 0)}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-red-600">{formatCurrency(i.total - ((i as any).paidAmount || 0))}</td>
                  <td className="py-3 px-4"><Button size="sm" variant="ghost">View</Button></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {/* ══════════════ ACTIVITY TAB ══════════════════════════════════════════════ */}
      {activeTab === 'Activity' && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Activity Timeline</h3>
            <span className="text-xs text-gray-400">{activityEvents.length} events</span>
          </div>
          {activityEvents.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No activity yet for this customer.</div>
          ) : (
            <div className="px-5 py-4">
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                <div className="space-y-4">
                  {activityEvents.map(ev => (
                    <div key={ev.id} className="flex items-start gap-4 relative">
                      {/* Icon bubble */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${ev.color}`}>
                        {ev.icon}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {ev.link ? (
                              <button onClick={() => navigate(ev.link!)}
                                className="text-sm font-medium text-gray-900 hover:text-brand-600 hover:underline transition-colors text-left">
                                {ev.label}
                              </button>
                            ) : (
                              <p className="text-sm font-medium text-gray-900">{ev.label}</p>
                            )}
                            {ev.sub && <p className="text-xs text-gray-400 truncate max-w-md">{ev.sub}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {ev.amount !== undefined && (
                              <p className="text-sm font-semibold text-gray-800">{formatCurrency(ev.amount)}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(ev.ts)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ══════════════ EDIT CUSTOMER MODAL ══════════════════════════════════════ */}
      <Modal isOpen={editMode} onClose={() => setEditMode(false)} title="Edit Customer" size="lg">
        {editForm && (
          <div className="space-y-4">
            <Input label="Company Name" value={editForm.name} onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={editForm.email || ''} onChange={e => setEditForm(f => f ? { ...f, email: e.target.value } : f)} />
              <Input label="Phone" value={editForm.phone || ''} onChange={e => setEditForm(f => f ? { ...f, phone: e.target.value } : f)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Website" value={editForm.website || ''} onChange={e => setEditForm(f => f ? { ...f, website: e.target.value } : f)} />
              <Input label="Account Number" value={editForm.accountNumber || ''} onChange={e => setEditForm(f => f ? { ...f, accountNumber: e.target.value } : f)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Address</label>
              <AddressAutocomplete
                value={editForm.address || ''}
                onChange={v => setEditForm(f => f ? { ...f, address: v } : f)}
                onPlaceSelected={p => setEditForm(f => f ? { ...f, address: p.address, city: p.city, state: p.state, zip: p.zip, country: p.country } : f)}
                apiKey={companySettings.googleMapsApiKey}
                className="w-full px-2.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 pl-8"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="City"  value={editForm.city  || ''} onChange={e => setEditForm(f => f ? { ...f, city:  e.target.value } : f)} />
              <Input label="State" value={editForm.state || ''} onChange={e => setEditForm(f => f ? { ...f, state: e.target.value } : f)} />
              <Input label="ZIP"   value={editForm.zip   || ''} onChange={e => setEditForm(f => f ? { ...f, zip:   e.target.value } : f)} />
            </div>
            <Input label="Country" value={editForm.country || ''} onChange={e => setEditForm(f => f ? { ...f, country: e.target.value } : f)} placeholder="US" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Payment Terms</label>
                <select value={editForm.terms || ''} onChange={e => setEditForm(f => f ? { ...f, terms: e.target.value || undefined } : f)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none bg-white text-gray-700">
                  <option value="">— None —</option>
                  {allTerms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Method</label>
                <select value={editForm.deliveryMethod || ''} onChange={e => setEditForm(f => f ? { ...f, deliveryMethod: e.target.value || undefined, thirdPartyShipping: false, thirdPartyCarrierAccountNumber: undefined } : f)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none bg-white text-gray-700">
                  <option value="">— None —</option>
                  {allMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            {(editForm.deliveryMethod === 'FedEx' || editForm.deliveryMethod === 'UPS') && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.thirdPartyShipping || false}
                    onChange={e => setEditForm(f => f ? { ...f, thirdPartyShipping: e.target.checked, thirdPartyCarrierAccountNumber: e.target.checked ? f.thirdPartyCarrierAccountNumber : undefined } : f)}
                    className="rounded border-gray-300 text-brand-600" />
                  <span className="text-sm font-medium text-gray-700">Third Party Shipping</span>
                </label>
                {editForm.thirdPartyShipping && (
                  <Input label="Carrier Account Number" value={editForm.thirdPartyCarrierAccountNumber || ''} onChange={e => setEditForm(f => f ? { ...f, thirdPartyCarrierAccountNumber: e.target.value } : f)} placeholder="Enter carrier account number" />
                )}
              </div>
            )}
            <Textarea label="Notes" value={editForm.notes || ''} onChange={e => setEditForm(f => f ? { ...f, notes: e.target.value } : f)} rows={3} />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════ NEW CONTACT MODAL ════════════════════════════════════════ */}
      <Modal isOpen={showNewContact} onClose={() => setShowNewContact(false)} title="Add Contact">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={contactForm.firstName} onChange={e => setContactForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input label="Last Name"  value={contactForm.lastName}  onChange={e => setContactForm(f => ({ ...f, lastName:  e.target.value }))} />
          </div>
          <Input label="Title / Role" value={contactForm.title} onChange={e => setContactForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Marketing Manager" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email"  type="email" value={contactForm.email}  onChange={e => setContactForm(f => ({ ...f, email:  e.target.value }))} />
            <Input label="Phone"              value={contactForm.phone}  onChange={e => setContactForm(f => ({ ...f, phone:  e.target.value }))} />
          </div>
          <Input label="Mobile" value={contactForm.mobile} onChange={e => setContactForm(f => ({ ...f, mobile: e.target.value }))} />
          <Textarea label="Notes" value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowNewContact(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddContact} disabled={!contactForm.firstName || !contactForm.lastName}>Add Contact</Button>
          </div>
        </div>
      </Modal>

      {/* ══════════════ SHIPPING ADDRESS MODAL ═══════════════════════════════════ */}
      <Modal isOpen={showAddrModal} onClose={() => setShowAddrModal(false)} title={editingAddrId ? 'Edit Shipping Address' : 'Add Shipping Address'} size="md">
        <div className="space-y-4">
          <Input label="Label (optional)" value={addrForm.label || ''} onChange={e => setAddrForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Warehouse, Main Office" />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Street Address</label>
            <AddressAutocomplete
              value={addrForm.address}
              onChange={v => setAddrForm(f => ({ ...f, address: v }))}
              onPlaceSelected={p => setAddrForm(f => ({ ...f, address: p.address, city: p.city, state: p.state, zip: p.zip, country: p.country }))}
              apiKey={companySettings.googleMapsApiKey}
              className="w-full px-2.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 pl-8"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="City"  value={addrForm.city  || ''} onChange={e => setAddrForm(f => ({ ...f, city:  e.target.value }))} />
            <Input label="State" value={addrForm.state || ''} onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))} />
            <Input label="ZIP"   value={addrForm.zip   || ''} onChange={e => setAddrForm(f => ({ ...f, zip:   e.target.value }))} />
          </div>
          <Input label="Country (optional)" value={addrForm.country || ''} onChange={e => setAddrForm(f => ({ ...f, country: e.target.value }))} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Notes (optional)</label>
            <textarea rows={2} value={addrForm.notes || ''} onChange={e => setAddrForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Loading dock, access code, contact on arrival…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={addrForm.isDefault || false} onChange={e => setAddrForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded border-gray-300 text-brand-600" />
            <span className="text-sm font-medium text-gray-700">Set as default shipping address</span>
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowAddrModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveAddr} disabled={!addrForm.address}>
              {editingAddrId ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
