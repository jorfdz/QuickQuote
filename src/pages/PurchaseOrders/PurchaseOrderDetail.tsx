import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, PackageCheck, Printer, Send, Undo2, XCircle } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, Input, PageHeader, Textarea } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { PurchaseOrder } from '../../types';
import { buildPurchaseOrderTemplateHtml } from '../../utils/documentTemplates';
import { getPOStatusFromItems, getVendorWorkflowStageId, summarizePOReceiving } from '../../utils/purchaseOrders';

export const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { purchaseOrders, vendors, orders, updatePurchaseOrder, updateOrder, workflows, companySettings, documentTemplates } = useStore();

  const po = purchaseOrders.find((item) => item.id === id);
  const vendor = vendors.find((item) => item.id === po?.vendorId);
  const linkedOrder = orders.find((item) => item.id === po?.orderId);

  const [notes, setNotes] = useState(po?.notes || '');
  const [expectedDate, setExpectedDate] = useState(po?.expectedDate || '');
  const [receipts, setReceipts] = useState<Record<string, number>>(() => Object.fromEntries(
    (po?.items || []).map((item) => [item.id, item.receivedQuantity || 0])
  ));

  useEffect(() => {
    if (!po) return;

    setNotes(po.notes || '');
    setExpectedDate(po.expectedDate || '');
    setReceipts(Object.fromEntries(
      po.items.map((item) => [item.id, item.receivedQuantity || 0])
    ));
  }, [po]);

  const receiving = useMemo(() => (po ? summarizePOReceiving({
    ...po,
    items: po.items.map((item) => ({ ...item, receivedQuantity: receipts[item.id] ?? item.receivedQuantity ?? 0 })),
  }) : { ordered: 0, received: 0, allReceived: false, anyReceived: false }), [po, receipts]);

  if (!po) return <div className="text-center py-16 text-gray-400">Purchase order not found</div>;

  const syncOrderStage = (status: PurchaseOrder['status']) => {
    if (!linkedOrder) return;
    const nextStageId = getVendorWorkflowStageId(status, workflows, linkedOrder.workflowId);
    if (!nextStageId) return;
    updateOrder(linkedOrder.id, { currentStageId: nextStageId });
  };

  const updateStatus = (status: PurchaseOrder['status'], extra: Partial<PurchaseOrder> = {}) => {
    const now = new Date().toISOString();
    updatePurchaseOrder(po.id, {
      status,
      notes,
      expectedDate: expectedDate || undefined,
      sentAt: status === 'sent' ? (po.sentAt || now) : po.sentAt,
      acknowledgedAt: status === 'acknowledged' ? (po.acknowledgedAt || now) : po.acknowledgedAt,
      receivedDate: status === 'received' ? (extra.receivedDate || now) : extra.receivedDate,
      ...extra,
    });
    syncOrderStage(status);
  };

  const saveHeader = () => updatePurchaseOrder(po.id, {
    notes,
    expectedDate: expectedDate || undefined,
  });

  const saveReceiving = () => {
    const nextItems = po.items.map((item) => {
      const nextReceived = Math.max(0, Math.min(receipts[item.id] ?? 0, item.quantity));
      return { ...item, receivedQuantity: nextReceived };
    });
    const nextStatus = getPOStatusFromItems({ ...po, items: nextItems });
    const now = new Date().toISOString();
    setReceipts(Object.fromEntries(
      nextItems.map((item) => [item.id, item.receivedQuantity || 0])
    ));
    updatePurchaseOrder(po.id, {
      items: nextItems,
      status: nextStatus,
      receivedDate: nextStatus === 'received' || nextStatus === 'partial' ? now : undefined,
      updatedAt: now,
    });
    syncOrderStage(nextStatus);
  };

  const openPrintWindow = () => {
    let printHtml = '';

    try {
      printHtml = buildPurchaseOrderTemplateHtml({
        template: documentTemplates.purchaseOrder,
        company: companySettings,
        purchaseOrder: po,
        vendor: vendor || null,
      });
    } catch (error) {
      console.error('Failed to build purchase order print HTML', error);
      return;
    }

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

  return (
    <div>
      <PageHeader
        title={po.number}
        subtitle={`${vendor?.name || 'Unknown vendor'}${linkedOrder ? ` · ${linkedOrder.number}` : ''}`}
        back={() => navigate('/purchase-orders')}
        actions={
          <>
            <Button variant="secondary" onClick={saveHeader}>Save</Button>
            <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={openPrintWindow}>Print PDF</Button>
            {po.status === 'draft' && <Button variant="primary" icon={<Send className="w-4 h-4" />} onClick={() => updateStatus('sent')}>Mark Sent</Button>}
            {po.status === 'sent' && <Button variant="primary" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => updateStatus('acknowledged')}>Acknowledge</Button>}
            {(po.status === 'sent' || po.status === 'acknowledged' || po.status === 'partial') && <Button variant="success" icon={<PackageCheck className="w-4 h-4" />} onClick={saveReceiving}>Post Receipt</Button>}
            {po.status === 'canceled' && <Button variant="secondary" icon={<Undo2 className="w-4 h-4" />} onClick={() => updateStatus('draft')}>Reopen</Button>}
            {po.status !== 'received' && po.status !== 'canceled' && <Button variant="danger" icon={<XCircle className="w-4 h-4" />} onClick={() => updateStatus('canceled')}>Cancel</Button>}
          </>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                <div className="mt-1"><Badge label={po.status} /></div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expected Date</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{expectedDate ? formatDate(expectedDate) : '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Expected Date" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vendor</label>
                <div className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-150 rounded-md">{vendor?.name || '—'}</div>
              </div>
            </div>
            <div className="mt-4">
              <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">PO Items</h2>
                <p className="text-sm text-gray-500 mt-0.5">Record ordered quantities and received quantities.</p>
              </div>
              <Badge color={receiving.allReceived ? 'green' : receiving.anyReceived ? 'yellow' : 'gray'}>
                {receiving.received}/{receiving.ordered} units received
              </Badge>
            </div>
            <div className="divide-y divide-gray-50">
              {po.items.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.quantity} {item.unit} ordered</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Unit Cost</p>
                      <div className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-150 rounded-md">{formatCurrency(item.unitCost)}</div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Line Total</p>
                      <div className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-150 rounded-md">{formatCurrency(item.total)}</div>
                    </div>
                    <div className="col-span-3">
                      <Input
                        label="Received Qty"
                        type="number"
                        min="0"
                        max={item.quantity}
                        step="1"
                        value={receipts[item.id] ?? item.receivedQuantity ?? 0}
                        onChange={(e) => setReceipts((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(po.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{formatDate(po.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sent</span><span>{po.sentAt ? formatDate(po.sentAt) : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Acknowledged</span><span>{po.acknowledgedAt ? formatDate(po.acknowledgedAt) : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Received</span><span>{po.receivedDate ? formatDate(po.receivedDate) : '—'}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(po.total)}</span>
              </div>
            </div>
          </Card>

          {linkedOrder && (
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Linked Order</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Order</span><button onClick={() => navigate(`/orders/${linkedOrder.id}`)} className="text-blue-600 hover:underline">{linkedOrder.number}</button></div>
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{linkedOrder.customerName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span>{linkedOrder.dueDate ? formatDate(linkedOrder.dueDate) : '—'}</span></div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
