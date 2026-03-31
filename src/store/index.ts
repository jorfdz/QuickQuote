import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Customer, Contact, Quote, Order, Invoice,
  Material, Equipment, Vendor, PurchaseOrder, User, Workflow, ProductTemplate,
  CompanySettings, DocumentTemplates,
} from '../types';
import {
  mockQuotes, mockOrders, mockInvoices,
  mockMaterials, mockEquipment, mockVendors, mockPurchaseOrders,
  mockUsers, mockWorkflows, mockTemplates, currentUser
} from '../data/mockData';
import { realCustomers, realContacts, realOrders } from '../data/realData';
import { DEFAULT_COMPANY_SETTINGS, DEFAULT_DOCUMENT_TEMPLATES } from '../data/documentSettings';

// Merge real data with mock data (deduplicate by id)
const allCustomers = realCustomers;
const allContacts = realContacts;
const allOrders: Order[] = [
  ...realOrders,
  ...mockOrders.filter((m) => !realOrders.find((r) => r.id === m.id)),
];

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
      updateQuote: (id, q) => set((s) => ({ quotes: s.quotes.map(x => x.id === id ? { ...x, ...q, updatedAt: new Date().toISOString() } : x) })),
      deleteQuote: (id) => set((s) => ({ quotes: s.quotes.filter(x => x.id !== id) })),
      nextQuoteNumber: () => { const c = get().quoteCount + 1; return `Q${String(c).padStart(6, '0')}`; },

      // Orders
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders], orderCount: s.orderCount + 1 })),
      updateOrder: (id, o) => set((s) => ({ orders: s.orders.map(x => x.id === id ? { ...x, ...o, updatedAt: new Date().toISOString() } : x) })),
      deleteOrder: (id) => set((s) => ({ orders: s.orders.filter(x => x.id !== id) })),
      nextOrderNumber: () => { const c = get().orderCount + 1; return `O${String(c).padStart(6, '0')}`; },

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
      updateCompanySettings: (settings) => set((s) => ({ companySettings: { ...s.companySettings, ...settings } })),
      updateDocumentTemplates: (templates) => set((s) => ({ documentTemplates: { ...s.documentTemplates, ...templates } })),
    }),
    {
      name: 'quikquote-storage',
      version: 4,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AppStore> | undefined;

        if (!state) {
          return state;
        }

        return {
          ...state,
          companySettings: { ...DEFAULT_COMPANY_SETTINGS, ...state.companySettings },
          documentTemplates: { ...DEFAULT_DOCUMENT_TEMPLATES, ...state.documentTemplates },
        };
      },
    }
  )
);
