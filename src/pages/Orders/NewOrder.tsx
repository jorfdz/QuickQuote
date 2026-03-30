import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Input, Select, Textarea, Card } from '../../components/ui';
import type { Order } from '../../types';
import { nanoid } from '../../utils/nanoid';

export const NewOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { quotes, customers, contacts, addOrder, nextOrderNumber, workflows, currentUser } = useStore();
  
  const quoteId = searchParams.get('quoteId');
  const sourceQuote = quotes.find(q => q.id === quoteId);

  const [form, setForm] = useState({
    title: sourceQuote?.title || '',
    customerId: sourceQuote?.customerId || '',
    contactId: sourceQuote?.contactId || '',
    status: 'in_progress' as Order['status'],
    dueDate: '',
    workflowId: workflows[0]?.id || '',
    notes: sourceQuote?.notes || '',
    internalNotes: '',
    poNumber: '',
  });

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const customerContacts = contacts.filter(c => c.customerId === form.customerId);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const number = nextOrderNumber();
    const order: Order = {
      id: nanoid(), number, status: form.status,
      quoteId: sourceQuote?.id, quoteNumber: sourceQuote?.number,
      customerId: form.customerId || undefined, customerName: selectedCustomer?.name,
      contactId: form.contactId || undefined,
      title: form.title || `Order ${number}`,
      lineItems: sourceQuote ? sourceQuote.lineItems.map(li => ({ ...li, id: nanoid() })) : [],
      subtotal: sourceQuote?.subtotal || 0, taxRate: sourceQuote?.taxRate, taxAmount: sourceQuote?.taxAmount, total: sourceQuote?.total || 0,
      dueDate: form.dueDate || undefined, workflowId: form.workflowId,
      currentStageId: workflows.find(w => w.id === form.workflowId)?.stages[0]?.id,
      notes: form.notes || undefined, internalNotes: form.internalNotes || undefined, poNumber: form.poNumber || undefined,
      csrId: currentUser.id,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addOrder(order);
    await new Promise(r => setTimeout(r, 300));
    navigate(`/orders/${order.id}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <button onClick={() => navigate('/orders')} className="hover:text-blue-600">Orders</button>
            <span>/</span><span className="text-gray-900 font-medium">New Order</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Create Order {sourceQuote && <span className="text-blue-600 text-base font-normal ml-2">from {sourceQuote.number}</span>}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/orders')}>Cancel</Button>
          <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />} onClick={handleSave} loading={saving}>Create Order</Button>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card className="p-6 space-y-4">
          <Input label="Order Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Spring Marketing Package" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Customer" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value, contactId: '' }))}
              options={[{ value: '', label: 'Select customer...' }, ...customers.map(c => ({ value: c.id, label: c.name }))]} />
            <Select label="Contact" value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}
              options={[{ value: '', label: 'Select contact...' }, ...customerContacts.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))]} disabled={!form.customerId} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            <Input label="Customer PO #" value={form.poNumber} onChange={e => setForm(f => ({ ...f, poNumber: e.target.value }))} placeholder="Customer's PO number" />
          </div>
          <Select label="Production Workflow" value={form.workflowId} onChange={e => setForm(f => ({ ...f, workflowId: e.target.value }))}
            options={workflows.map(w => ({ value: w.id, label: w.name }))} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes for this order..." rows={3} />
          <Textarea label="Internal Notes" value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))} placeholder="Internal notes for your team..." rows={2} />

          {sourceQuote && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Importing from {sourceQuote.number}</p>
              <p className="text-xs text-blue-600">{sourceQuote.lineItems.length} line items · {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sourceQuote.total)} total</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
