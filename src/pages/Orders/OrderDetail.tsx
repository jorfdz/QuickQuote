import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, Receipt, KanbanSquare, Edit, Trash2, CheckCircle, ChevronDown, ChevronUp, Copy, ArrowRight } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Badge, Card, PageHeader, Select, Tabs, Modal, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { OrderStatus } from '../../types';
import { nanoid } from '../../utils/nanoid';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, updateOrder, deleteOrder, addInvoice, nextInvoiceNumber, invoiceCount, workflows, users, equipment } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDelete, setShowDelete] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (convertRef.current && !convertRef.current.contains(e.target as Node)) setConvertOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const order = orders.find(o => o.id === id);
  if (!order) return <div className="text-center py-16 text-gray-400">Order not found</div>;

  const workflow = workflows.find(w => w.id === order.workflowId) || workflows[0];
  const currentStage = workflow?.stages.find(s => s.id === order.currentStageId);
  const csr = users.find(u => u.id === order.csrId);
  const salesRep = users.find(u => u.id === order.salesId);

  const createInvoice = () => {
    const number = nextInvoiceNumber();
    addInvoice({
      id: nanoid(), number, status: 'draft',
      customerId: order.customerId || '', customerName: order.customerName || '',
      orderIds: [order.id],
      lineItems: order.lineItems.map(li => ({
        id: nanoid(), description: li.description, quantity: li.quantity,
        unit: li.unit, unitPrice: li.sellPrice / li.quantity, total: li.sellPrice, orderId: order.id,
      })),
      subtotal: order.subtotal, taxRate: order.taxRate, taxAmount: order.taxAmount, total: order.total,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    updateOrder(id!, { status: 'completed', invoiceId: number });
    navigate('/invoices');
  };

  const statuses: { value: OrderStatus; label: string }[] = [
    { value: 'in_progress', label: 'In Progress' }, { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' }, { value: 'canceled', label: 'Canceled' },
  ];

  return (
    <div>
      <PageHeader
        title={order.title}
        subtitle={`${order.number} · ${order.customerName || 'No customer'}`}
        back={() => navigate('/orders')}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowStatusModal(true)}>Status</Button>
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />}>Work Order</Button>
            <Button variant="secondary" size="sm" icon={<KanbanSquare className="w-4 h-4" />} onClick={() => navigate('/tracker')}>Tracker</Button>
            {/* Convert to... dropdown */}
            <div className="relative" ref={convertRef}>
              <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />} onClick={() => setConvertOpen(!convertOpen)}>
                Convert to...
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
              {convertOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => { setConvertOpen(false); navigate(`/quotes/new?cloneId=${order.id}&source=order`); }}
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                    Clone as New Quote
                  </button>
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => { setConvertOpen(false); navigate(`/orders/new?cloneOrderId=${order.id}`); }}
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                    Clone as New Order
                  </button>
                  {!order.invoiceId && (
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      onClick={() => { setConvertOpen(false); createInvoice(); }}
                    >
                      <Receipt className="w-4 h-4 text-gray-400" />
                      Create Invoice
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        }
      />

      {/* Prominent Order Number + Collapsible Header */}
      <Card className="mb-6">
        <div
          className="px-5 py-4 flex items-center justify-between cursor-pointer select-none"
          onClick={() => setHeaderCollapsed(!headerCollapsed)}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.number}</h1>
            <span className="text-sm text-gray-500">{order.customerName || 'No customer'}</span>
            <Badge label={order.status} />
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
                <p className="text-sm font-medium text-gray-900 mt-1">{order.customerName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{order.contactName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</p>
                <div className="mt-1"><Badge label={order.status} /></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Due Date</p>
                <p className={`text-sm font-medium mt-1 ${order.dueDate && new Date(order.dueDate) < new Date() && order.status === 'in_progress' ? 'text-red-500' : 'text-gray-900'}`}>
                  {order.dueDate ? formatDate(order.dueDate) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">CSR</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{csr?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sales Rep</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{salesRep?.name || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Progress bar */}
      {workflow && (
        <Card className="mb-4 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Production Progress</span>
            <Badge label={order.status} />
          </div>
          <div className="flex items-center gap-1">
            {workflow.stages.map((stage, i) => {
              const isCurrent = stage.id === order.currentStageId;
              const isPast = workflow.stages.findIndex(s => s.id === order.currentStageId) > i;
              return (
                <React.Fragment key={stage.id}>
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => updateOrder(id!, { currentStageId: stage.id })}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isCurrent ? 'ring-2 ring-offset-2' : ''} ${isPast || isCurrent ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                      style={{ backgroundColor: isPast || isCurrent ? stage.color : undefined }}>
                      {isPast ? '✓' : i + 1}
                    </div>
                    <span className={`text-[9px] mt-1 font-medium text-center max-w-[60px] leading-tight ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>{stage.name}</span>
                  </div>
                  {i < workflow.stages.length - 1 && <div className={`flex-1 h-0.5 mb-4 ${isPast ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </Card>
      )}

      <Tabs
        tabs={[{ id: 'overview', label: 'Overview' }, { id: 'production', label: 'Production' }, { id: 'documents', label: 'Documents' }]}
        active={activeTab} onChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {/* Line items */}
            <Card>
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Line Items</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {order.lineItems.map((item, i) => {
                  const eq = equipment.find(e => e.id === (item as any).equipmentId);
                  return (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-semibold text-gray-400 mr-2">#{i + 1}</span>
                          <span className="text-sm font-medium text-gray-900">{item.description}</span>
                          <p className="text-xs text-gray-500 mt-1">{item.quantity} {item.unit}</p>
                          {eq && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <span className="inline-block w-3 h-3 rounded bg-blue-100 text-center text-[8px] leading-3">E</span>
                              {eq.name}
                            </p>
                          )}
                          {item.productionNotes && <p className="text-xs text-amber-600 mt-1 italic">📝 {item.productionNotes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(item.sellPrice)}</p>
                          {item.workflowStageId && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {workflow?.stages.find(s => s.id === item.workflowStageId)?.name || 'In Progress'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            {(order.notes || order.internalNotes) && (
              <Card className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  {order.notes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p><p className="text-sm text-gray-700">{order.notes}</p></div>}
                  {order.internalNotes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Internal</p><p className="text-sm text-amber-700 bg-amber-50 p-2 rounded-lg italic">{order.internalNotes}</p></div>}
                </div>
              </Card>
            )}
          </div>
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                {order.taxRate && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax ({order.taxRate}%)</span><span>{formatCurrency(order.taxAmount || 0)}</span></div>}
                <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-2"><span>Total</span><span className="text-blue-600">{formatCurrency(order.total)}</span></div>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Customer</dt><dd className="font-medium">{order.customerName || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Order Date</dt><dd>{formatDate(order.createdAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Due Date</dt><dd className={order.dueDate && new Date(order.dueDate) < new Date() && order.status === 'in_progress' ? 'text-red-500 font-medium' : ''}>{order.dueDate ? formatDate(order.dueDate) : '—'}</dd></div>
                {order.quoteNumber && <div className="flex justify-between"><dt className="text-gray-500">From Quote</dt><dd><button onClick={() => navigate(`/quotes/${order.quoteId}`)} className="text-blue-600 hover:underline">{order.quoteNumber}</button></dd></div>}
                {order.invoiceId && <div className="flex justify-between"><dt className="text-gray-500">Invoice</dt><dd className="text-emerald-600 font-medium">{order.invoiceId} ✓</dd></div>}
              </dl>
            </Card>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setShowDelete(true)} className="flex-1 justify-center">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <div className="space-y-4">
          <Card>
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Item-Level Production Tracking</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.lineItems.map(item => {
                const assignedUser = users.find(u => u.id === item.assignedUserId);
                return (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                      </div>
                      <Badge label={workflow?.stages.find(s => s.id === item.workflowStageId)?.name || 'Not Started'} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Select label="Current Stage" value={item.workflowStageId || ''}
                        onChange={e => {
                          const items = order.lineItems.map(li => li.id === item.id ? { ...li, workflowStageId: e.target.value } : li);
                          updateOrder(id!, { lineItems: items });
                        }}
                        options={[{ value: '', label: 'Not started' }, ...(workflow?.stages || []).map(s => ({ value: s.id, label: s.name }))]}
                      />
                      <Select label="Assigned To" value={item.assignedUserId || ''}
                        onChange={e => {
                          const items = order.lineItems.map(li => li.id === item.id ? { ...li, assignedUserId: e.target.value } : li);
                          updateOrder(id!, { lineItems: items });
                        }}
                        options={[{ value: '', label: 'Unassigned' }, ...users.map(u => ({ value: u.id, label: u.name }))]}
                      />
                    </div>
                    {assignedUser && <p className="text-xs text-gray-500 mt-1">Assigned to: <span className="font-medium">{assignedUser.name}</span></p>}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: 'Customer Order Confirmation', desc: 'Customer-facing order summary with pricing', icon: '📄' },
            { title: 'Internal Work Order', desc: 'Production work order with specs and instructions', icon: '🔧' },
            { title: 'Quote PDF', desc: 'Original quote document', icon: '📋' },
          ].map(doc => (
            <Card key={doc.title} className="p-5">
              <div className="text-2xl mb-3">{doc.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
              <p className="text-xs text-gray-500 mb-4">{doc.desc}</p>
              <Button variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>Generate PDF</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Change Order Status" size="sm">
        <div className="space-y-2">
          {statuses.map(s => (
            <button key={s.value} onClick={() => { updateOrder(id!, { status: s.value }); setShowStatusModal(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${order.status === s.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={() => { deleteOrder(id!); navigate('/orders'); }}
        title="Delete Order" message={`Delete ${order.number}? This cannot be undone.`} />
    </div>
  );
};
