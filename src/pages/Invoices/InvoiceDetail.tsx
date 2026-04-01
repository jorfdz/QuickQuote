import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, Modal, PageHeader, Select } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { InvoiceStatus } from '../../types';
import { buildInvoiceTemplateHtml } from '../../utils/documentTemplates';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    invoices,
    orders,
    customers,
    contacts,
    companySettings,
    documentTemplates,
    updateInvoice,
  } = useStore();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const invoice = invoices.find((item) => item.id === id);
  if (!invoice) return <div className="text-center py-16 text-gray-400">Invoice not found</div>;

  const customer = customers.find((item) => item.id === invoice.customerId) || null;
  const primaryContact = contacts.find((item) => item.customerId === invoice.customerId && item.isPrimary)
    || contacts.find((item) => item.customerId === invoice.customerId)
    || null;
  const linkedOrders = orders.filter((order) => invoice.orderIds.includes(order.id));
  const balanceDue = Math.max(invoice.total - (invoice.paidAmount || 0), 0);

  const printHtml = useMemo(() => buildInvoiceTemplateHtml({
    template: documentTemplates.invoice,
    company: companySettings,
    invoice,
    customer,
    contact: primaryContact,
  }), [companySettings, customer, documentTemplates.invoice, invoice, primaryContact]);

  const openPrintWindow = () => {
    const blob = new Blob([printHtml], { type: 'text/html' });
    const printUrl = URL.createObjectURL(blob);
    const printWindow = window.open(printUrl, '_blank');

    if (!printWindow) {
      URL.revokeObjectURL(printUrl);
      return;
    }

    const cleanup = () => {
      URL.revokeObjectURL(printUrl);
    };

    printWindow.addEventListener('load', () => {
      printWindow.focus();
      window.setTimeout(() => {
        printWindow.print();
      }, 150);
      window.setTimeout(cleanup, 60000);
    }, { once: true });
  };

  const statuses: { value: InvoiceStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'posted', label: 'Posted' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'void', label: 'Void' },
  ];

  const setInvoiceStatus = (status: InvoiceStatus) => {
    updateInvoice(invoice.id, {
      status,
      paidDate: status === 'paid' ? (invoice.paidDate || new Date().toISOString().split('T')[0]) : invoice.paidDate,
      paidAmount: status === 'paid' ? invoice.total : invoice.paidAmount,
    });
    setShowStatusModal(false);
  };

  return (
    <div>
      <PageHeader
        title={invoice.number}
        subtitle={`${invoice.customerName || 'No customer'}${linkedOrders[0] ? ` · ${linkedOrders[0].number}` : ''}`}
        back={() => navigate('/invoices')}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowStatusModal(true)}>Status</Button>
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={openPrintWindow}>Print PDF</Button>
            {linkedOrders[0] && (
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate(`/orders/${linkedOrders[0].id}`)}>
                View Order
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-6">
        <div
          className="px-5 py-4 flex items-center justify-between cursor-pointer select-none"
          onClick={() => setHeaderCollapsed(!headerCollapsed)}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 obj-num">{invoice.number}</h1>
            <span className="text-sm text-gray-500">{invoice.customerName || 'No customer'}</span>
            <Badge label={invoice.status} />
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
            {headerCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
        {!headerCollapsed && (
          <div className="px-5 pb-4 pt-0 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account Name</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{invoice.customerName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</p>
                <div className="mt-1"><Badge label={invoice.status} /></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Invoice Date</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(invoice.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Due Date</p>
                <p className={`text-sm font-medium mt-1 ${invoice.dueDate && new Date(invoice.dueDate) < new Date() && balanceDue > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                  {invoice.dueDate ? formatDate(invoice.dueDate) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Paid Date</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{invoice.paidDate ? formatDate(invoice.paidDate) : '—'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="p-4 flex items-center gap-4">
            <Badge label={invoice.status} />
            {invoice.status === 'paid' && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Payment recorded</span>
              </div>
            )}
            <div className="ml-auto w-56">
              <Select
                label="Quick Status"
                value={invoice.status}
                onChange={(e) => setInvoiceStatus(e.target.value as InvoiceStatus)}
                options={statuses.map((status) => ({ value: status.value, label: status.label }))}
              />
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {invoice.lineItems.map((item, index) => {
                const sourceOrder = linkedOrders.find((order) => order.id === item.orderId);
                return (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-gray-400 mr-2">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900">{item.description}</span>
                        <p className="text-xs text-gray-500 mt-1">{item.quantity} {item.unit}</p>
                        {sourceOrder && (
                          <button
                            onClick={() => navigate(`/orders/${sourceOrder.id}`)}
                            className="text-xs text-blue-600 hover:underline mt-1"
                          >
                            From {sourceOrder.number}
                          </button>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.total)}</p>
                        <p className="text-xs text-gray-400">Unit Price: {formatCurrency(item.unitPrice)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {invoice.notes && (
            <Card className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Invoice Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              {invoice.taxRate && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax ({invoice.taxRate}%)</span><span>{formatCurrency(invoice.taxAmount || 0)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-gray-500">Paid</span><span className="text-emerald-600">{formatCurrency(invoice.paidAmount || 0)}</span></div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-2"><span>Balance Due</span><span className={balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}>{formatCurrency(balanceDue)}</span></div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Customer</dt><dd className="font-medium">{invoice.customerName || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Invoice Date</dt><dd>{formatDate(invoice.createdAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Due Date</dt><dd>{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><Badge label={invoice.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Source Orders</dt><dd>{linkedOrders.length || '—'}</dd></div>
            </dl>
          </Card>

          {linkedOrders.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Linked Orders</h3>
              <div className="space-y-3">
                {linkedOrders.map((order) => (
                  <button key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="w-full text-left border border-gray-100 rounded-lg p-3 hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{order.number}</span>
                      <Badge label={order.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{order.title || order.description || 'Order'}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(order.total)}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Change Invoice Status" size="sm">
        <div className="space-y-2">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => setInvoiceStatus(status.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${invoice.status === status.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};
