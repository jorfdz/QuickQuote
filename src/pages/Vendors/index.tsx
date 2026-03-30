import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Card, PageHeader, Table, Modal, Input, Textarea, Checkbox } from '../../components/ui';
import { nanoid } from '../../utils/nanoid';

export const Vendors: React.FC = () => {
  const { vendors, addVendor } = useStore();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '', address: '', city: '', state: '', zip: '', accountNumber: '', paymentTerms: 'Net 30', notes: '', isOutsourcedProduction: false });

  const filtered = vendors.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()));
  const handleAdd = () => {
    addVendor({ id: nanoid(), ...form, createdAt: new Date().toISOString() });
    setShowNew(false);
    setForm({ name: '', email: '', phone: '', website: '', address: '', city: '', state: '', zip: '', accountNumber: '', paymentTerms: 'Net 30', notes: '', isOutsourcedProduction: false });
  };

  return (
    <div>
      <PageHeader title="Vendors" subtitle={`${vendors.length} vendors`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>Add Vendor</Button>}
      />
      <Card className="mb-4"><div className="flex gap-4 px-4 py-3"><SearchInput value={search} onChange={setSearch} placeholder="Search vendors..." /></div></Card>
      <Card>
        <Table headers={['Name', 'Type', 'Email', 'Phone', 'Payment Terms', '']}>
          {filtered.map(v => (
            <tr key={v.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-semibold text-sm text-gray-900">{v.name}</td>
              <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.isOutsourcedProduction ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{v.isOutsourcedProduction ? 'Production' : 'Supplier'}</span></td>
              <td className="py-3 px-4 text-sm text-gray-500">{v.email || '—'}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{v.phone || '—'}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{v.paymentTerms || '—'}</td>
              <td className="py-3 px-4"><Button size="sm" variant="ghost">Edit</Button></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Vendor">
        <div className="space-y-4">
          <Input label="Vendor Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Checkbox checked={form.isOutsourcedProduction} onChange={v => setForm(f => ({ ...f, isOutsourcedProduction: v }))} label="Outsourced Production Vendor (not just a supplier)" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Number" value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
            <Input label="Payment Terms" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={!form.name}>Add Vendor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
