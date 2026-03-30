import React, { useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Card, PageHeader, Table, Modal, Input, Select } from '../../components/ui';
import { formatDate } from '../../data/mockData';
import type { UserRole } from '../../types';

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features and settings' },
  { value: 'manager', label: 'Manager', description: 'Access to all features except billing/admin' },
  { value: 'estimator', label: 'Estimator', description: 'Can create and manage quotes and orders' },
  { value: 'csr', label: 'CSR', description: 'Can manage orders and customer communications' },
  { value: 'sales', label: 'Sales', description: 'Can view and manage quotes and customers' },
  { value: 'production', label: 'Production', description: 'Can update order/production status' },
  { value: 'accounting', label: 'Accounting', description: 'Can manage invoices and financial data' },
];

export const Users: React.FC = () => {
  const { users } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'csr' as UserRole });

  return (
    <div>
      <PageHeader title="Users & Roles" subtitle={`${users.length} team members`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>Invite User</Button>}
      />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <Table headers={['Name', 'Email', 'Role', 'Status', 'Joined', '']}>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-xs font-bold text-white">{u.name[0]}</span></div>
                      <span className="text-sm font-semibold text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{u.email}</td>
                  <td className="py-3 px-4"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">{u.role}</span></td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-3 px-4 text-sm text-gray-400">{formatDate(u.createdAt)}</td>
                  <td className="py-3 px-4"><Button size="sm" variant="ghost">Edit</Button></td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
        <div>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> Role Guide</h3>
            <div className="space-y-3">
              {ROLES.map(r => (
                <div key={r.value} className="border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-900">{r.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{r.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Invite Team Member" size="sm">
        <div className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Select label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
            options={ROLES.map(r => ({ value: r.value, label: r.label }))} />
          {form.role && <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">{ROLES.find(r => r.value === form.role)?.description}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="primary" disabled={!form.name || !form.email} onClick={() => setShowNew(false)}>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
