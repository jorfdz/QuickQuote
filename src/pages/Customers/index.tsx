import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Mail, Phone } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Card, PageHeader, EmptyState, Table, Modal, Input, Select, Textarea, Badge } from '../../components/ui';
import { formatDate } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';

export const Customers: React.FC = () => {
  const { customers, contacts, quotes, orders, addCustomer } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', taxExempt: false, notes: '' });

  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    addCustomer({ id: nanoid(), ...form, source: 'manual', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setShowNew(false);
    setForm({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', taxExempt: false, notes: '' });
  };

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${customers.length} accounts`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>Add Customer</Button>}
      />
      <Card className="mb-4"><div className="flex items-center gap-4 px-4 py-3"><SearchInput value={search} onChange={setSearch} placeholder="Search customers..." /></div></Card>
      <Card>
        {filtered.length === 0 ? <EmptyState icon={<span className="text-2xl">👥</span>} title="No customers" description="Add your first customer." action={<Button variant="primary" onClick={() => setShowNew(true)}>Add Customer</Button>} /> :
          <Table headers={['Customer', 'Contact', 'Location', 'Quotes', 'Orders', 'Since', '']}>
            {filtered.map(c => {
              const primary = contacts.find(ct => ct.customerId === c.id && ct.isPrimary);
              const custQuotes = quotes.filter(q => q.customerId === c.id);
              const custOrders = orders.filter(o => o.customerId === c.id);
              return (
                <tr key={c.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/customers/${c.id}`)}>
                  <td className="py-3 px-4">
                    <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                    {c.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{primary ? `${primary.firstName} ${primary.lastName}` : '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{c.city && c.state ? `${c.city}, ${c.state}` : '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">{custQuotes.length}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">{custOrders.length}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="py-3 px-4"><Button size="sm" variant="ghost">View</Button></td>
                </tr>
              );
            })}
          </Table>
        }
      </Card>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Customer">
        <div className="space-y-4">
          <Input label="Company Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corporation" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
            <Input label="ZIP" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={!form.name}>Add Customer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
