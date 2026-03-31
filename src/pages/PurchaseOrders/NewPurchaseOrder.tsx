import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Send } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Card, Input, PageHeader, Select, Textarea } from '../../components/ui';
import type { PurchaseOrder, PurchaseOrderItem } from '../../types';
import { formatCurrency } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';
import { buildPOItemsFromOrder, getVendorWorkflowStageId, linkPOToOrder, suggestVendorForOrder } from '../../utils/purchaseOrders';

const emptyItem = (): PurchaseOrderItem => ({
  id: nanoid(),
  description: '',
  quantity: 1,
  unit: 'each',
  unitCost: 0,
  total: 0,
  receivedQuantity: 0,
});

export const NewPurchaseOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    orders, vendors, materials, addPurchaseOrder, updateOrder,
    nextPONumber, currentUser, workflows,
  } = useStore();

  const orderId = searchParams.get('orderId') || '';
  const sourceOrder = orders.find((order) => order.id === orderId);
  const initialVendorId = sourceOrder ? suggestVendorForOrder(sourceOrder, materials, vendors) : '';
  const [poNumber] = useState(() => nextPONumber());

  const [vendorId, setVendorId] = useState(initialVendorId);
  const [linkedOrderId, setLinkedOrderId] = useState(orderId);
  const [expectedDate, setExpectedDate] = useState(sourceOrder?.dueDate || '');
  const [notes, setNotes] = useState(sourceOrder?.notes || '');
  const [items, setItems] = useState<PurchaseOrderItem[]>(() => (
    sourceOrder ? buildPOItemsFromOrder(sourceOrder, materials, initialVendorId) : [emptyItem()]
  ));
  const [saving, setSaving] = useState(false);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === linkedOrderId),
    [orders, linkedOrderId]
  );
  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === vendorId),
    [vendors, vendorId]
  );

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  const syncItemsFromOrder = (nextOrderId: string, nextVendorId: string) => {
    const order = orders.find((item) => item.id === nextOrderId);
    if (!order) {
      setItems((prev) => (prev.length > 0 ? prev : [emptyItem()]));
      return;
    }
    const built = buildPOItemsFromOrder(order, materials, nextVendorId);
    setItems(built.length > 0 ? built : [emptyItem()]);
  };

  const updateItem = (id: string, updates: Partial<PurchaseOrderItem>) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...updates };
      const quantity = Number(next.quantity) || 0;
      const unitCost = Number(next.unitCost) || 0;
      return {
        ...next,
        quantity,
        unitCost,
        total: Number((quantity * unitCost).toFixed(2)),
      };
    }));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  const savePO = async (status: PurchaseOrder['status']) => {
    if (!vendorId || items.every((item) => !item.description.trim())) return;
    setSaving(true);
    const now = new Date().toISOString();
    const po: PurchaseOrder = {
      id: nanoid(),
      number: poNumber,
      vendorId,
      orderId: linkedOrderId || undefined,
      status,
      items: items
        .filter((item) => item.description.trim())
        .map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          unitCost: Number(item.unitCost) || 0,
          total: Number(((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)).toFixed(2)),
          receivedQuantity: Math.min(item.receivedQuantity || 0, Number(item.quantity) || 0),
        })),
      subtotal: Number(subtotal.toFixed(2)),
      total: Number(subtotal.toFixed(2)),
      notes: notes || undefined,
      expectedDate: expectedDate || undefined,
      sentAt: status === 'sent' ? now : undefined,
      createdBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
    };

    addPurchaseOrder(po);

    if (selectedOrder) {
      const vendorWorkflowStageId = status === 'sent'
        ? getVendorWorkflowStageId(status, workflows, selectedOrder.workflowId)
        : undefined;

      updateOrder(selectedOrder.id, {
        purchaseOrderIds: linkPOToOrder(selectedOrder, po.id),
        currentStageId: vendorWorkflowStageId || selectedOrder.currentStageId,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    setSaving(false);
    navigate(`/purchase-orders/${po.id}`);
  };

  return (
    <div>
      <PageHeader
        title="New Purchase Order"
        subtitle={selectedVendor ? `Vendor: ${selectedVendor.name}` : 'Create a vendor purchase order'}
        back={() => navigate('/purchase-orders')}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>Cancel</Button>
            <Button variant="primary" onClick={() => savePO('draft')} loading={saving}>Save Draft</Button>
            <Button variant="success" icon={<Send className="w-4 h-4" />} onClick={() => savePO('sent')} loading={saving}>
              Save & Send
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Vendor"
                value={vendorId}
                onChange={(e) => {
                  const nextVendorId = e.target.value;
                  setVendorId(nextVendorId);
                  if (linkedOrderId) syncItemsFromOrder(linkedOrderId, nextVendorId);
                }}
                options={[
                  { value: '', label: 'Select vendor...' },
                  ...vendors.map((vendor) => ({ value: vendor.id, label: vendor.name })),
                ]}
              />
              <Select
                label="Linked Order"
                value={linkedOrderId}
                onChange={(e) => {
                  const nextOrderId = e.target.value;
                  setLinkedOrderId(nextOrderId);
                  syncItemsFromOrder(nextOrderId, vendorId);
                }}
                options={[
                  { value: '', label: 'No linked order' },
                  ...orders.map((order) => ({ value: order.id, label: `${order.number} · ${order.title}` })),
                ]}
              />
              <Input label="Expected Date" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
              <Input
                label="PO Number"
                value={poNumber}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="mt-4">
              <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Items</h2>
                <p className="text-sm text-gray-500 mt-0.5">Capture what is being ordered from the vendor.</p>
              </div>
              <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addItem}>Add Item</Button>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((item, index) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <Input
                        label={`Description ${index + 1}`}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="Qty"
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Select
                        label="Unit"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value as PurchaseOrderItem['unit'] })}
                        options={[
                          { value: 'each', label: 'Each' },
                          { value: 'sheet', label: 'Sheet' },
                          { value: 'sqft', label: 'Sq Ft' },
                          { value: 'roll', label: 'Roll' },
                          { value: 'set', label: 'Set' },
                          { value: 'box', label: 'Box' },
                          { value: 'hour', label: 'Hour' },
                          { value: 'day', label: 'Day' },
                        ]}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="Unit Cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) => updateItem(item.id, { unitCost: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Line total: <span className="font-semibold text-gray-900">{formatCurrency(item.total)}</span>
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
              <div className="flex justify-between"><span className="text-gray-500">Vendor</span><span>{selectedVendor?.name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Linked Order</span><span>{selectedOrder?.number || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Items</span><span>{items.filter((item) => item.description.trim()).length}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </Card>

          {selectedOrder && (
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Order Context</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Order</span><span>{selectedOrder.number}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{selectedOrder.customerName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span>{selectedOrder.dueDate || '—'}</span></div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
