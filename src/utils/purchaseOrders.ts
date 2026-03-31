import type { Material, Order, PurchaseOrder, PurchaseOrderItem, Vendor, Workflow } from '../types';

const PURCHASE_STATUS_TO_STAGE: Record<PurchaseOrder['status'], string | null> = {
  draft: null,
  sent: 'PO Sent',
  acknowledged: 'In Production (Vendor)',
  partial: 'Received',
  received: 'QC / Fulfilled',
  canceled: null,
};

export function getPurchasableOrderItems(order: Order, materials: Material[], vendorId?: string) {
  const items = order.lineItems.filter((item) => {
    const materialVendorId = item.materialId
      ? materials.find((material) => material.id === item.materialId)?.vendorId
      : undefined;
    const candidateVendorId = item.vendorId || materialVendorId;
    const isPurchasable = Boolean(item.vendorId || item.vendorCost || item.materialId || item.materialCost);
    if (!isPurchasable) return false;
    if (!vendorId) return true;
    return candidateVendorId === vendorId;
  });

  return items.length > 0 ? items : order.lineItems;
}

export function suggestVendorForOrder(order: Order, materials: Material[], vendors: Vendor[]): string {
  const counts = new Map<string, number>();
  order.lineItems.forEach((item) => {
    const materialVendorId = item.materialId
      ? materials.find((material) => material.id === item.materialId)?.vendorId
      : undefined;
    const candidateVendorId = item.vendorId || materialVendorId;
    if (!candidateVendorId) return;
    counts.set(candidateVendorId, (counts.get(candidateVendorId) || 0) + 1);
  });

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted[0]?.[0]) return sorted[0][0];
  return vendors[0]?.id || '';
}

export function buildPOItemsFromOrder(order: Order, materials: Material[], vendorId?: string): PurchaseOrderItem[] {
  return getPurchasableOrderItems(order, materials, vendorId).map((item) => {
    const quantity = item.quantity || 1;
    const unitCost = item.vendorCost
      ? item.vendorCost / quantity
      : item.materialCost
        ? item.materialCost / quantity
        : item.totalCost
          ? item.totalCost / quantity
          : 0;

    return {
      id: `${item.id}_po`,
      description: item.description || 'Order item',
      quantity,
      unit: item.unit,
      unitCost: Number(unitCost.toFixed(2)),
      total: Number((quantity * unitCost).toFixed(2)),
      orderItemId: item.id,
      receivedQuantity: 0,
    };
  });
}

export function summarizePOReceiving(po: PurchaseOrder) {
  const ordered = po.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const received = po.items.reduce((sum, item) => sum + Math.min(item.receivedQuantity || 0, item.quantity || 0), 0);
  const allReceived = po.items.length > 0 && po.items.every((item) => (item.receivedQuantity || 0) >= item.quantity);
  const anyReceived = po.items.some((item) => (item.receivedQuantity || 0) > 0);

  return { ordered, received, allReceived, anyReceived };
}

export function getPOStatusFromItems(po: PurchaseOrder): PurchaseOrder['status'] {
  const { allReceived, anyReceived } = summarizePOReceiving(po);
  if (allReceived) return 'received';
  if (anyReceived) return 'partial';
  return po.status;
}

export function getVendorWorkflowStageId(status: PurchaseOrder['status'], workflows: Workflow[], orderWorkflowId?: string) {
  const workflow = workflows.find((item) => item.id === orderWorkflowId) || workflows.find((item) => item.name === 'Vendor / Outsourced');
  if (!workflow) return undefined;

  const targetStageName = PURCHASE_STATUS_TO_STAGE[status];
  if (!targetStageName) return undefined;
  return workflow.stages.find((stage) => stage.name === targetStageName)?.id || workflow.stages[0]?.id;
}

export function linkPOToOrder(order: Order, poId: string): string[] {
  const existing = order.purchaseOrderIds || [];
  return existing.includes(poId) ? existing : [...existing, poId];
}
