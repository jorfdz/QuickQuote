import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Customer, Contact, Quote, Order, Invoice,
  Material, Equipment, Vendor, PurchaseOrder, User, Workflow, ProductTemplate,
  CompanySettings, DocumentTemplates, TrackingDevice, OrderTrackingMode,
} from '../types';
import {
  mockQuotes, mockOrders, mockInvoices,
  mockMaterials, mockEquipment, mockVendors, mockPurchaseOrders,
  mockUsers, mockWorkflows, mockTemplates, currentUser
} from '../data/mockData';
import trackingDevicesSeed from '../data/trackingDevices.json';
import { realCustomers, realContacts, realOrders } from '../data/realData';
import { DEFAULT_COMPANY_SETTINGS, DEFAULT_DOCUMENT_TEMPLATES } from '../data/documentSettings';

// Merge real data with mock data (deduplicate by id)
const allCustomers = realCustomers;
const allContacts = realContacts;
const allOrders: Order[] = [
  ...realOrders,
  ...mockOrders.filter((m) => !realOrders.find((r) => r.id === m.id)),
];
const defaultTrackingDevices = trackingDevicesSeed as TrackingDevice[];

interface AppStore {
  // Auth
  currentUser: User;

  // Data
  customers: Customer[];
  contacts: Contact[];
  quotes: Quote[];
  orders: Order[];
  invoices: Invoice[];
  materials: Material[];
  equipment: Equipment[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  users: User[];
  workflows: Workflow[];
  trackingDevices: TrackingDevice[];
  templates: ProductTemplate[];
  companySettings: CompanySettings;
  documentTemplates: DocumentTemplates;

  // Counters for ID generation
  quoteCount: number;
  orderCount: number;
  invoiceCount: number;
  poCount: number;

  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;

  // Customers
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Contacts
  addContact: (c: Contact) => void;
  updateContact: (id: string, c: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  // Quotes
  addQuote: (q: Quote) => void;
  updateQuote: (id: string, q: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  nextQuoteNumber: () => string;

  // Orders
  addOrder: (o: Order) => void;
  updateOrder: (id: string, o: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  nextOrderNumber: () => string;
  updateOrderTrackingMode: (id: string, trackingMode: OrderTrackingMode) => void;

  // Invoices
  addInvoice: (i: Invoice) => void;
  updateInvoice: (id: string, i: Partial<Invoice>) => void;
  nextInvoiceNumber: () => string;

  // Materials
  addMaterial: (m: Material) => void;
  updateMaterial: (id: string, m: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  // Equipment
  addEquipment: (e: Equipment) => void;
  updateEquipment: (id: string, e: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;

  // Vendors
  addVendor: (v: Vendor) => void;
  updateVendor: (id: string, v: Partial<Vendor>) => void;

  // Purchase Orders
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => void;
  nextPONumber: () => string;

  // Templates
  addTemplate: (t: ProductTemplate) => void;
  updateTemplate: (id: string, t: Partial<ProductTemplate>) => void;
  deleteTemplate: (id: string) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  addTrackingDevice: (device: TrackingDevice) => void;
  updateTrackingDevice: (id: string, device: Partial<TrackingDevice>) => void;
  deleteTrackingDevice: (id: string) => void;
  processTrackingDeviceScan: (deviceId: string, orderItemId: string) => void;
  processTrackingDeviceOrderScan: (deviceId: string, orderNumber: string) => { success: boolean; message: string };
  processOrderScanToDestination: (workflowId: string, stageId: string, orderNumber: string) => { success: boolean; message: string };
  processOrderItemScanToDestination: (workflowId: string, stageId: string, orderItemId: string) => { success: boolean; message: string };
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  updateDocumentTemplates: (templates: Partial<DocumentTemplates>) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentUser,
      customers: allCustomers,
      contacts: allContacts,
      quotes: mockQuotes,
      orders: allOrders,
      invoices: mockInvoices,
      materials: mockMaterials,
      equipment: mockEquipment,
      vendors: mockVendors,
      purchaseOrders: mockPurchaseOrders,
      users: mockUsers,
      workflows: mockWorkflows,
      trackingDevices: defaultTrackingDevices,
      templates: mockTemplates,
      companySettings: DEFAULT_COMPANY_SETTINGS,
      documentTemplates: DEFAULT_DOCUMENT_TEMPLATES,
      quoteCount: 5,
      orderCount: allOrders.length,
      invoiceCount: 1,
      poCount: 1,
      sidebarCollapsed: false,

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // Customers
      addCustomer: (c) => set((s) => ({ customers: [c, ...s.customers] })),
      updateCustomer: (id, c) => set((s) => ({ customers: s.customers.map(x => x.id === id ? { ...x, ...c, updatedAt: new Date().toISOString() } : x) })),
      deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter(x => x.id !== id) })),

      // Contacts
      addContact: (c) => set((s) => ({ contacts: [c, ...s.contacts] })),
      updateContact: (id, c) => set((s) => ({ contacts: s.contacts.map(x => x.id === id ? { ...x, ...c } : x) })),
      deleteContact: (id) => set((s) => ({ contacts: s.contacts.filter(x => x.id !== id) })),

      // Quotes
      addQuote: (q) => set((s) => ({ quotes: [q, ...s.quotes], quoteCount: s.quoteCount + 1 })),
      updateQuote: (id, q) => set((s) => ({
        quotes: s.quotes.map(x => {
          if (x.id !== id) return x;
          const now = new Date().toISOString();
          const statusChanged = q.status !== undefined && q.status !== x.status;
          return { ...x, ...q, updatedAt: now, ...(statusChanged ? { statusChangedAt: now } : {}) };
        }),
      })),
      deleteQuote: (id) => set((s) => ({ quotes: s.quotes.filter(x => x.id !== id) })),
      nextQuoteNumber: () => { const c = get().quoteCount + 1; return `Q${String(c).padStart(6, '0')}`; },

      // Orders
      addOrder: (o) => set((s) => ({ orders: [{ ...o, trackingMode: o.trackingMode || 'order' }, ...s.orders], orderCount: s.orderCount + 1 })),
      updateOrder: (id, o) => set((s) => ({ orders: s.orders.map(x => x.id === id ? { ...x, ...o, updatedAt: new Date().toISOString() } : x) })),
      deleteOrder: (id) => set((s) => ({ orders: s.orders.filter(x => x.id !== id) })),
      nextOrderNumber: () => { const c = get().orderCount + 1; return `O${String(c).padStart(6, '0')}`; },
      updateOrderTrackingMode: (id, trackingMode) => set((s) => ({
        orders: s.orders.map((order) => {
          if (order.id !== id) return order;

          const now = new Date().toISOString();
          const fallbackStageId = deriveOrderStage(order) || order.currentStageId;

          if (trackingMode === 'order') {
            return {
              ...order,
              trackingMode,
              currentStageId: fallbackStageId,
              updatedAt: now,
              lineItems: order.lineItems.map((item) => ({
                ...item,
                workflowStageId: fallbackStageId,
              })),
            };
          }

          return {
            ...order,
            trackingMode,
            currentStageId: fallbackStageId,
            updatedAt: now,
            lineItems: order.lineItems.map((item) => ({
              ...item,
              workflowStageId: item.workflowStageId || fallbackStageId,
            })),
          };
        }),
      })),

      // Invoices
      addInvoice: (i) => set((s) => ({ invoices: [i, ...s.invoices], invoiceCount: s.invoiceCount + 1 })),
      updateInvoice: (id, i) => set((s) => ({ invoices: s.invoices.map(x => x.id === id ? { ...x, ...i, updatedAt: new Date().toISOString() } : x) })),
      nextInvoiceNumber: () => { const c = get().invoiceCount + 1; return `I${String(c).padStart(6, '0')}`; },

      // Materials
      addMaterial: (m) => set((s) => ({ materials: [m, ...s.materials] })),
      updateMaterial: (id, m) => set((s) => ({ materials: s.materials.map(x => x.id === id ? { ...x, ...m } : x) })),
      deleteMaterial: (id) => set((s) => ({ materials: s.materials.filter(x => x.id !== id) })),

      // Equipment
      addEquipment: (e) => set((s) => ({ equipment: [e, ...s.equipment] })),
      updateEquipment: (id, e) => set((s) => ({ equipment: s.equipment.map(x => x.id === id ? { ...x, ...e } : x) })),
      deleteEquipment: (id) => set((s) => ({ equipment: s.equipment.filter(x => x.id !== id) })),

      // Vendors
      addVendor: (v) => set((s) => ({ vendors: [v, ...s.vendors] })),
      updateVendor: (id, v) => set((s) => ({ vendors: s.vendors.map(x => x.id === id ? { ...x, ...v } : x) })),

      // Purchase Orders
      addPurchaseOrder: (po) => set((s) => ({ purchaseOrders: [po, ...s.purchaseOrders], poCount: s.poCount + 1 })),
      updatePurchaseOrder: (id, po) => set((s) => ({ purchaseOrders: s.purchaseOrders.map(x => x.id === id ? { ...x, ...po, updatedAt: new Date().toISOString() } : x) })),
      nextPONumber: () => { const c = get().poCount + 1; return `PO${String(c).padStart(6, '0')}`; },

      // Templates
      addTemplate: (t) => set((s) => ({ templates: [t, ...s.templates] })),
      updateTemplate: (id, t) => set((s) => ({ templates: s.templates.map(x => x.id === id ? { ...x, ...t } : x) })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter(x => x.id !== id) })),
      addWorkflow: (workflow) => set((s) => ({ workflows: [...s.workflows, workflow] })),
      updateWorkflow: (id, workflow) => set((s) => ({
        workflows: s.workflows.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            ...workflow,
            stages: workflow.stages || item.stages,
          };
        }),
      })),
      deleteWorkflow: (id) => set((s) => ({
        workflows: s.workflows.filter((item) => item.id !== id),
        trackingDevices: s.trackingDevices.filter((device) => device.workflowId !== id),
        orders: s.orders.map((order) => (
          order.workflowId === id
            ? { ...order, workflowId: undefined, currentStageId: undefined, updatedAt: new Date().toISOString() }
            : order
        )),
      })),
      addTrackingDevice: (device) => set((s) => ({ trackingDevices: [device, ...s.trackingDevices] })),
      updateTrackingDevice: (id, device) => set((s) => ({
        trackingDevices: s.trackingDevices.map((item) => item.id === id ? { ...item, ...device } : item),
      })),
      deleteTrackingDevice: (id) => set((s) => ({ trackingDevices: s.trackingDevices.filter((item) => item.id !== id) })),
      processTrackingDeviceScan: (deviceId, orderItemId) => set((s) => {
        const device = s.trackingDevices.find((item) => item.id === deviceId && item.isActive);
        if (!device) return {};

        const now = new Date().toISOString();
        return {
          orders: s.orders.map((order) => {
            const lineItemIndex = order.lineItems.findIndex((item) => item.id === orderItemId);
            if (lineItemIndex < 0) return order;

            return {
              ...order,
              workflowId: device.workflowId,
              currentStageId: device.stageId,
              trackingMode: order.trackingMode || 'item',
              updatedAt: now,
              lineItems: order.lineItems.map((item) => (
                item.id === orderItemId
                  ? { ...item, workflowStageId: device.stageId }
                  : item
              )),
            };
          }),
        };
      }),
      processTrackingDeviceOrderScan: (deviceId, orderNumber) => {
        const device = get().trackingDevices.find((item) => item.id === deviceId && item.isActive);
        if (!device) {
          return { success: false, message: 'Tracking device is inactive or not found.' };
        }
        return get().processOrderScanToDestination(device.workflowId, device.stageId, orderNumber);
      },
      processOrderScanToDestination: (workflowId, stageId, orderNumber) => {
        const workflow = get().workflows.find((item) => item.id === workflowId);
        if (!workflow) {
          return { success: false, message: 'Selected board was not found.' };
        }

        const stage = workflow.stages.find((item) => item.id === stageId);
        if (!stage) {
          return { success: false, message: 'Selected stage was not found.' };
        }

        const normalizedOrderNumber = orderNumber.trim().toUpperCase();
        const order = get().orders.find((item) => item.number.toUpperCase() === normalizedOrderNumber);
        if (!order) {
          return { success: false, message: `Order ${normalizedOrderNumber} was not found.` };
        }

        const now = new Date().toISOString();
        set((s) => ({
          orders: s.orders.map((item) => (
            item.id === order.id
              ? applyOrderScanDestination(item, workflowId, stageId, now)
              : item
          )),
        }));

        const trackingMode = order.trackingMode || 'order';
        const suffix = trackingMode === 'item'
          ? 'All items in the order were moved together because this job is item-tracked.'
          : 'The order card was updated.';
        return { success: true, message: `Moved ${normalizedOrderNumber} to ${workflow.name} / ${stage.name}. ${suffix}` };
      },
      processOrderItemScanToDestination: (workflowId, stageId, orderItemId) => {
        const workflow = get().workflows.find((item) => item.id === workflowId);
        if (!workflow) {
          return { success: false, message: 'Selected board was not found.' };
        }

        const stage = workflow.stages.find((item) => item.id === stageId);
        if (!stage) {
          return { success: false, message: 'Selected stage was not found.' };
        }

        const normalizedOrderItemId = orderItemId.trim();
        const order = get().orders.find((entry) => entry.lineItems.some((lineItem) => lineItem.id === normalizedOrderItemId));
        if (!order) {
          return { success: false, message: 'Scanned item was not found.' };
        }

        const scannedItem = order.lineItems.find((lineItem) => lineItem.id === normalizedOrderItemId);
        if (!scannedItem) {
          return { success: false, message: 'Scanned item was not found.' };
        }

        const now = new Date().toISOString();
        const nextLineItems = order.lineItems.map((lineItem) => (
          lineItem.id === normalizedOrderItemId
            ? { ...lineItem, workflowStageId: stageId }
            : lineItem
        ));

        set((s) => ({
          orders: s.orders.map((entry) => (
            entry.id === order.id
              ? {
                  ...entry,
                  workflowId,
                  trackingMode: entry.trackingMode || 'item',
                  currentStageId: deriveCurrentStageFromItems({ ...entry, lineItems: nextLineItems }, workflow),
                  updatedAt: now,
                  lineItems: nextLineItems,
                }
              : entry
          )),
        }));

        return {
          success: true,
          message: `Moved ${order.number} / ${scannedItem.description || 'item'} to ${workflow.name} / ${stage.name}.`,
        };
      },
      updateCompanySettings: (settings) => set((s) => ({ companySettings: { ...s.companySettings, ...settings } })),
      updateDocumentTemplates: (templates) => set((s) => ({ documentTemplates: { ...s.documentTemplates, ...templates } })),
    }),
    {
      name: 'quikquote-storage',
      version: 9,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AppStore> | undefined;

        if (!state) {
          return state;
        }

        return {
          ...state,
          workflows: (state.workflows || mockWorkflows).map((workflow) => {
            const nextWorkflow = workflow as Workflow & { description?: string; isActive?: boolean };
            return {
              ...nextWorkflow,
              description: nextWorkflow.description || '',
              isActive: nextWorkflow.isActive ?? true,
            };
          }),
          trackingDevices: mergeTrackingDevices(defaultTrackingDevices, state.trackingDevices || []),
          companySettings: { ...DEFAULT_COMPANY_SETTINGS, ...state.companySettings },
          documentTemplates: { ...DEFAULT_DOCUMENT_TEMPLATES, ...state.documentTemplates },
          orders: (state.orders || allOrders).map((order) => ({
            ...order,
            trackingMode: order.trackingMode || 'order',
          })),
        };
      },
    }
  )
);

const mergeTrackingDevices = (defaults: TrackingDevice[], stored: TrackingDevice[]) => {
  const merged = new Map<string, TrackingDevice>();
  defaults.forEach((device) => merged.set(device.code.toUpperCase(), device));
  stored.forEach((device) => merged.set(device.code.toUpperCase(), device));
  return Array.from(merged.values());
};

const deriveOrderStage = (order: Order) => {
  const stageIds = order.lineItems.map((item) => item.workflowStageId).filter(Boolean) as string[];
  return stageIds[0];
};

const applyOrderScanDestination = (order: Order, workflowId: string, stageId: string, updatedAt: string): Order => {
  const trackingMode = order.trackingMode || 'order';
  const nextLineItems = order.lineItems.map((lineItem) => ({
    ...lineItem,
    workflowStageId: trackingMode === 'item' ? stageId : stageId,
  }));

  return {
    ...order,
    workflowId,
    currentStageId: stageId,
    trackingMode,
    updatedAt,
    lineItems: nextLineItems,
  };
};

const deriveCurrentStageFromItems = (order: Order, workflow: Workflow) => {
  const stageIds = order.lineItems
    .map((item) => item.workflowStageId)
    .filter((stageId): stageId is string => Boolean(stageId));

  if (stageIds.length === 0) {
    return order.currentStageId;
  }

  const rankedIds = workflow.stages.slice().sort((a, b) => a.order - b.order).map((stage) => stage.id);
  return stageIds.reduce((selected, stageId) => {
    if (!selected) return stageId;
    return rankedIds.indexOf(stageId) < rankedIds.indexOf(selected) ? stageId : selected;
  }, order.currentStageId);
};
