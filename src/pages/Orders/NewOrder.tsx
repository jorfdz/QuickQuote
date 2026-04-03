import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Calculator, Copy,
  Search, X, Edit3, Package,
  Calendar,
} from 'lucide-react';
import { useStore } from '../../store';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Textarea, Card, Badge, Modal } from '../../components/ui';
import type { Order, OrderItem, OrderTrackingMode } from '../../types';
import { formatCurrency } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';
import {
  ProductEditModal,
  LineItemPricingState,
  DEFAULT_PRICING_STATE,
} from '../../components/pricing/ItemEditModal';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = (n: number) => formatCurrency(n);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// ─── EMPTY LINE ITEM ────────────────────────────────────────────────────────

const EMPTY_LINE_ITEM = (): OrderItem => ({
  id: nanoid(), productFamily: 'digital_print', description: '', quantity: 1, unit: 'each',
  totalCost: 0, markup: 0, sellPrice: 0,
});

// ═════════════════════════════════════════════════════════════════════════════
// ORDER BUILDER (mirrors QuoteBuilder but creates Orders)
// ═════════════════════════════════════════════════════════════════════════════

export const NewOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    customers, contacts, quotes, orders, addOrder, nextOrderNumber,
    currentUser, users, workflows, addCustomer, addContact,
  } = useStore();
  const pricing = usePricingStore();

  // ── Pre-fill from quote if quoteId param ─────────────────────────────
  const quoteId = searchParams.get('quoteId');
  const sourceQuote = quotes.find(q => q.id === quoteId);
  const initialCustomerId = searchParams.get('customerId') || '';
  const initialContactId = searchParams.get('contactId') || '';

  // ── Clone handling ────────────────────────────────────────────────────
  const cloneOrderId = searchParams.get('cloneOrderId');
  const cloneId = searchParams.get('cloneId');
  const cloneParamSource = searchParams.get('source');
  const sourceOrder = cloneOrderId ? orders.find(o => o.id === cloneOrderId) : null;
  const orderCloneSource = (cloneId && cloneParamSource === 'order') ? orders.find(o => o.id === cloneId) : null;
  const quoteCloneSource = (cloneId && !cloneParamSource) ? quotes.find(q => q.id === cloneId) : null;
  // Unified clone base: prefer explicit clone sources over quote conversion
  const cloneBase = sourceOrder || orderCloneSource || quoteCloneSource;

  // ── Generate order number immediately on mount ──────────────────────
  const [orderNumber] = useState(() => nextOrderNumber());

  // ── Order-level state ────────────────────────────────────────────────
  const effectiveBase = cloneBase || sourceQuote;
  const [form, setForm] = useState({
    title: cloneBase ? `Copy of ${cloneBase.title || ''}` : (sourceQuote?.title || ''),
    customerId: (effectiveBase as any)?.customerId || initialCustomerId,
    contactId: (effectiveBase as any)?.contactId || initialContactId,
    status: 'in_progress' as Order['status'],
    taxRate: (effectiveBase as any)?.taxRate ?? 7,
    dueDate: '',
    workflowId: workflows[0]?.id || '',
    trackingMode: ((cloneBase as Order | null)?.trackingMode || 'order') as OrderTrackingMode,
    poNumber: '',
    csrId: (effectiveBase as any)?.csrId || currentUser.id,
    salesId: (effectiveBase as any)?.salesId || '',
    notes: (effectiveBase as any)?.notes || '',
    internalNotes: (effectiveBase as any)?.internalNotes || '',
    shipToAddress: '',
  });

  // Build initial line items: from clone source, quote source, or empty
  const buildInitialLineItems = (): OrderItem[] => {
    const source = cloneBase || sourceQuote;
    if (source && source.lineItems && source.lineItems.length > 0) {
      return source.lineItems.map(li => ({ ...li, id: nanoid() }));
    }
    return [EMPTY_LINE_ITEM()];
  };

  const [lineItems, setLineItems] = useState<OrderItem[]>(buildInitialLineItems);
  const [pricingStates, setPricingStates] = useState<Record<string, LineItemPricingState>>(() => {
    const states: Record<string, LineItemPricingState> = {};
    const source = cloneBase || sourceQuote;
    if (source && source.lineItems && source.lineItems.length > 0) {
      // For sourced items, create pricing states seeded with known data
      const items = buildInitialLineItems();
      items.forEach((item) => {
        states[item.id] = {
          ...DEFAULT_PRICING_STATE(),
          productName: item.description || '',
          quantity: item.quantity || 1000,
          finalWidth: (item as any).width || 0,
          finalHeight: (item as any).height || 0,
          materialId: (item as any).materialId || '',
          equipmentId: (item as any).equipmentId || '',
        };
      });
    } else {
      const first = EMPTY_LINE_ITEM();
      states[first.id] = DEFAULT_PRICING_STATE();
    }
    return states;
  });

  // ── Draft initialization ref (prevents double-fire in StrictMode) ────
  const draftInitialized = useRef(false);

  // ── Auto-create draft order on mount and redirect to order detail ────
  useEffect(() => {
    if (!draftInitialized.current) {
      draftInitialized.current = true;
      const selectedWorkflow = workflows.find(w => w.id === form.workflowId);
      const stageId = selectedWorkflow?.stages[0]?.id;
      const newId = nanoid();
      const trackingMode = form.trackingMode || 'order';
      const nextLineItems = lineItems.map((lineItem) => ({
        ...lineItem,
        workflowStageId: trackingMode === 'order' ? stageId : (lineItem.workflowStageId || stageId),
      }));
      const sub = nextLineItems.reduce((s, i) => s + (i.sellPrice || 0), 0);
      const ta = sub * (form.taxRate / 100);
      const draft: Order = {
        id: newId,
        number: orderNumber,
        status: form.status,
        quoteId: sourceQuote?.id,
        quoteNumber: sourceQuote?.number,
        customerId: form.customerId || undefined,
        customerName: customers.find(c => c.id === form.customerId)?.name,
        contactId: form.contactId || undefined,
        title: form.title || nextLineItems.find(i => i.description)?.description || `Order ${orderNumber}`,
        lineItems: nextLineItems,
        subtotal: sub,
        taxRate: form.taxRate,
        taxAmount: ta,
        total: sub + ta,
        dueDate: form.dueDate || undefined,
        workflowId: form.workflowId || undefined,
        currentStageId: stageId,
        trackingMode,
        csrId: form.csrId || undefined,
        salesId: form.salesId || undefined,
        notes: form.notes || undefined,
        internalNotes: form.internalNotes || undefined,
        poNumber: form.poNumber || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addOrder(draft);
      navigate(`/orders/${newId}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [editingItemModal, setEditingItemModal] = useState<string | null>(null);
  const [showConvertDropdown, setShowConvertDropdown] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!effectiveBase);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showNeedsCustomerWarning, setShowNeedsCustomerWarning] = useState(false);
  const [showShipToModal, setShowShipToModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [newContactForm, setNewContactForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  // ── Customer search state ────────────────────────────────────────────
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const customerContacts = contacts.filter(c => c.customerId === form.customerId);

  const filteredCustomers = useMemo(() => {
    if (!customerQuery.trim()) return customers.slice(0, 20);
    const q = customerQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [customers, customerQuery]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  const subtotal = lineItems.reduce((s, i) => s + (i.sellPrice || 0), 0);
  const taxAmount = subtotal * (form.taxRate / 100);
  const total = subtotal + taxAmount;
  const totalCostAll = lineItems.reduce((s, i) => s + (i.totalCost || 0), 0);

  // ── Pricing state helpers ─────────────────────────────────────────────
  const getPricingState = (id: string) => pricingStates[id] || DEFAULT_PRICING_STATE();
  const updatePricingState = useCallback((id: string, updates: Partial<LineItemPricingState>) => {
    setPricingStates(prev => ({ ...prev, [id]: { ...(prev[id] || DEFAULT_PRICING_STATE()), ...updates } }));
  }, []);

  // ── Add / remove line items ───────────────────────────────────────────
  const addLineItem = () => {
    const item = EMPTY_LINE_ITEM();
    setLineItems(prev => [...prev, item]);
    setPricingStates(prev => ({ ...prev, [item.id]: DEFAULT_PRICING_STATE() }));
    setEditingItemModal(item.id);
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
    setPricingStates(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (editingItemModal === id) setEditingItemModal(null);
  };

  const duplicateLineItem = (item: OrderItem) => {
    const newId = nanoid();
    const newItem = { ...item, id: newId };
    setLineItems(prev => [...prev, newItem]);
    setPricingStates(prev => ({ ...prev, [newId]: { ...(prev[item.id] || DEFAULT_PRICING_STATE()) } }));
    setEditingItemModal(newId);
  };

  // ── Load from pricing template ────────────────────────────────────────
  const addFromTemplate = (tmplId: string) => {
    const tmpl = pricing.templates.find(t => t.id === tmplId);
    if (!tmpl) return;
    pricing.incrementTemplateUsage(tmplId);

    const item = EMPTY_LINE_ITEM();
    item.description = tmpl.productName;
    item.quantity = tmpl.quantity;
    item.unit = 'each';
    if (tmpl.finalWidth) item.width = tmpl.finalWidth;
    if (tmpl.finalHeight) item.height = tmpl.finalHeight;

    const mat = tmpl.materialId
      ? pricing.materials.find(m => m.id === tmpl.materialId)
      : tmpl.materialName
        ? pricing.materials.find(m => m.name === tmpl.materialName)
        : undefined;

    setLineItems(prev => [...prev.filter(i => i.description !== ''), item]);
    setPricingStates(prev => ({
      ...prev,
      [item.id]: {
        ...DEFAULT_PRICING_STATE(),
        productId: tmpl.productId || '',
        productName: tmpl.productName,
        categoryName: tmpl.categoryName,
        quantity: tmpl.quantity,
        finalWidth: tmpl.finalWidth,
        finalHeight: tmpl.finalHeight,
        materialId: mat?.id || '',
        equipmentId: tmpl.equipmentId || '',
        colorMode: (tmpl.color === 'Black' ? 'Black' : 'Color') as 'Color' | 'Black',
        sides: tmpl.sides,
        foldingType: tmpl.folding || '',
        cuttingEnabled: true,
        sheetsPerStack: 500,
      },
    }));
    setEditingItemModal(item.id);
    setShowTemplates(false);
  };

  // ── Cancel handler ────────────────────────────────────────────────────
  const handleCancel = () => {
    if (!form.customerId) {
      setShowNeedsCustomerWarning(true);
    } else {
      navigate('/orders');
    }
  };

  // ── Filtered templates for sidebar ────────────────────────────────────
  const sortedTemplates = useMemo(() =>
    [...pricing.templates].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || b.usageCount - a.usageCount),
    [pricing.templates]
  );

  // ── Apply template to a specific item ────────────────────────────────
  const applyTemplateToItem = (tmplId: string, targetItemId: string) => {
    const tmpl = pricing.templates.find(t => t.id === tmplId);
    if (!tmpl) return;
    pricing.incrementTemplateUsage(tmplId);

    const mat = tmpl.materialId
      ? pricing.materials.find(m => m.id === tmpl.materialId)
      : tmpl.materialName
        ? pricing.materials.find(m => m.name === tmpl.materialName)
        : undefined;

    setLineItems(prev => prev.map(i => i.id === targetItemId ? {
      ...i,
      description: tmpl.productName,
      quantity: tmpl.quantity,
      unit: 'each' as const,
      width: tmpl.finalWidth || undefined,
      height: tmpl.finalHeight || undefined,
    } : i));

    setPricingStates(prev => ({
      ...prev,
      [targetItemId]: {
        ...DEFAULT_PRICING_STATE(),
        productId: tmpl.productId || '',
        productName: tmpl.productName,
        categoryName: tmpl.categoryName,
        quantity: tmpl.quantity,
        finalWidth: tmpl.finalWidth,
        finalHeight: tmpl.finalHeight,
        materialId: mat?.id || '',
        equipmentId: tmpl.equipmentId || '',
        colorMode: (tmpl.color === 'Black' ? 'Black' : 'Color') as 'Color' | 'Black',
        sides: tmpl.sides,
        foldingType: tmpl.folding || '',
        cuttingEnabled: true,
        sheetsPerStack: 500,
        serviceLines: [],
      },
    }));
  };

  // ── Currently editing item ────────────────────────────────────────────
  const editingItem = editingItemModal ? lineItems.find(i => i.id === editingItemModal) : null;
  const editingPs = editingItemModal ? getPricingState(editingItemModal) : null;
  const isNewItem = editingItem ? !editingItem.description : false;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  // Always render null — the draft is created and redirected to OrderDetail in the useEffect.
  // Nothing should ever render here; the user always lands on the OrderDetail page.
  return null;

};
