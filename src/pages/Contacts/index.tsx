import React, { useState } from 'react';
import { Plus, Mail, Phone } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Card, PageHeader, Table, Modal, Input, Select } from '../../components/ui';
import { nanoid } from '../../utils/nanoid';

export const Contacts: React.FC = () => {
  const { contacts, customers, addContact } = useStore();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ customerId: '', firstName: '', lastName: '', email: '', phone: '', mobile: '', title: '', isPrimary: false });

  const filtered = contacts.filter(c => !search || `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    addContact({ id: nanoid(), ...form, createdAt: new Date().toISOString() });
    setShowNew(false);
    setForm({ customerId: '', firstName: '', lastName: '', email: '', phone: '', mobile: '', title: '', isPrimary: false });
  };

  return (
    <div>
      <PageHeader title="Contacts" subtitle={`${contacts.length} contacts`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>Add Contact</Button>}
      />
      <Card className="mb-4"><div className="flex gap-4 px-4 py-3"><SearchInput value={search} onChange={setSearch} placeholder="Search contacts..." /></div></Card>
      <Card>
        <Table headers={['Name', 'Title', 'Company', 'Email', 'Phone', 'Primary']}>
          {filtered.map(c => {
            const company = customers.find(cu => cu.id === c.customerId);
            return (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-sm text-gray-900">{c.firstName} {c.lastName}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{c.title || '—'}</td>
                <td className="py-3 px-4 text-sm text-blue-600">{company?.name || '—'}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{c.email ? <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-blue-600" onClick={e => e.stopPropagation()}><Mail className="w-3 h-3" />{c.email}</a> : '—'}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{c.phone || '—'}</td>
                <td className="py-3 px-4">{c.isPrimary && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Primary</span>}</td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Contact">
        <div className="space-y-4">
          <Select label="Customer / Company" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
            options={[{ value: '', label: 'Select company...' }, ...customers.map(c => ({ value: c.id, label: c.name }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input label="Last Name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Input label="Title / Role" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Marketing Director" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={!form.firstName}>Add Contact</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
