import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Sparkles, ChevronDown, ChevronRight, Calculator, Copy, ArrowRight } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Input, Select, Textarea, Modal, Card, Badge } from '../../components/ui';
import type { QuoteLineItem, ProductFamily, Quote } from '../../types';
import { formatCurrency } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';

const PRODUCT_FAMILIES: { id: ProductFamily; label: string; icon: string; description: string }[] = [
  { id: 'digital_print', label: 'Digital Print', icon: '🖨️', description: 'Business cards, flyers, postcards, brochures' },
  { id: 'offset_print', label: 'Offset Print', icon: '🗞️', description: 'High-volume litho printing' },
  { id: 'wide_format', label: 'Wide Format', icon: '🖼️', description: 'Banners, wraps, window graphics' },
  { id: 'rigid_sign', label: 'Rigid Signs', icon: '🪧', description: 'Coroplast, aluminum, foam board' },
  { id: 'roll_sign', label: 'Roll Signs', icon: '🎌', description: 'Vinyl rolls, decals, cut vinyl' },
  { id: 'label', label: 'Labels', icon: '🏷️', description: 'Custom labels and stickers' },
  { id: 'apparel', label: 'Apparel', icon: '👕', description: 'T-shirts, embroidery, screen print' },
  { id: 'finishing', label: 'Finishing', icon: '✂️', description: 'Laminating, cutting, binding, folding' },
  { id: 'installation', label: 'Installation', icon: '🔧', description: 'Labor, delivery, installation services' },
  { id: 'outsourced', label: 'Outsourced', icon: '🏭', description: 'Vendor/trade items' },
  { id: 'buyout', label: 'Buyout Item', icon: '📦', description: 'Resale or promotional products' },
];

// Smart pricing engine
function calculateLineItem(item: Partial<QuoteLineItem>): Partial<QuoteLineItem> {
  const matCost = item.materialCost || 0;
  const eqCost = item.equipmentCost || 0;
  const laborCost = (item.laborHours || 0) * (item.laborRate || 45);
  const setupCost = item.setupCost || 0;
  const vendorCost = item.vendorCost || 0;
  const additionalCost = item.additionalCost || 0;
  const totalCost = matCost + eqCost + laborCost + setupCost + vendorCost + additionalCost;
  const markup = item.markup || 45;
  const sellPrice = totalCost * (1 + markup / 100);
  return { ...item, laborCost, totalCost, sellPrice };
}

// AI Natural Language Interpreter (simulated)
function interpretNLQ(text: string): Partial<QuoteLineItem> | null {
  const t = text.toLowerCase();
  
  if (t.includes('business card')) {
    const qtyMatch = t.match(/(\d+)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 500;
    return {
      productFamily: 'digital_print', description: 'Business Cards - Full Color',
      width: 3.5, height: 2, quantity: qty, unit: 'each',
      materialCost: qty * 0.09, equipmentCost: 25, laborHours: 0.5, laborRate: 45,
      setupCost: 25, markup: 45,
    };
  }
  if (t.includes('postcard') && (t.includes('4x6') || t.includes('4 x 6'))) {
    const qtyMatch = t.match(/(\d{3,})/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 500;
    return {
      productFamily: 'digital_print', description: 'Postcards 4x6 - Full Color',
      width: 6, height: 4, quantity: qty, unit: 'each',
      materialCost: qty * 0.08, equipmentCost: 35, laborHours: 0.75, laborRate: 45,
      setupCost: 25, markup: 45,
    };
  }
  if (t.includes('banner') || t.includes('vinyl banner')) {
    const sizeMatch = t.match(/(\d+)\s*x\s*(\d+)/);
    const w = sizeMatch ? parseInt(sizeMatch[1]) : 3;
    const h = sizeMatch ? parseInt(sizeMatch[2]) : 6;
    const sqft = (w * 12 * h) / 144;
    const qty = 1;
    return {
      productFamily: 'wide_format', description: `Vinyl Banner ${w}x${h} - 13oz Scrim`,
      width: w * 12, height: h * 12, quantity: qty, unit: 'each',
      materialCost: sqft * 0.45, equipmentCost: sqft * 0.25, laborHours: 0.5, laborRate: 45,
      setupCost: 15, markup: 55,
    };
  }
  if (t.includes('yard sign') || t.includes('coroplast')) {
    const qtyMatch = t.match(/(\d+)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 10;
    return {
      productFamily: 'rigid_sign', description: 'Yard Signs 18x24 - Coroplast',
      width: 24, height: 18, quantity: qty, unit: 'each',
      materialCost: qty * 5.5, equipmentCost: qty * 2, laborHours: qty * 0.1, laborRate: 45,
      setupCost: 20, markup: 60,
    };
  }
  if (t.includes('t-shirt') || t.includes('tshirt') || t.includes('screen print')) {
    const qtyMatch = t.match(/(\d+)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 24;
    const colors = t.includes('2 color') || t.includes('2color') ? 2 : 1;
    return {
      productFamily: 'apparel', description: `T-Shirts - ${colors} Color Screen Print`,
      quantity: qty, unit: 'each',
      materialCost: qty * 4.5, laborHours: qty * 0.05, laborRate: 45,
      setupCost: 35 * colors, markup: 80,
    };
  }
  if (t.includes('flyer') || t.includes('8.5x11') || t.includes('letter')) {
    const qtyMatch = t.match(/(\d{2,})/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 250;
    return {
      productFamily: 'digital_print', description: 'Flyers 8.5x11 - Full Color',
      width: 8.5, height: 11, quantity: qty, unit: 'each',
      materialCost: qty * 0.06, equipmentCost: 25, laborHours: 0.5, laborRate: 45,
      setupCost: 20, markup: 40,
    };
  }
  if (t.includes('5x7') || (t.includes('5') && t.includes('7') && t.includes('postcard'))) {
    const qtyMatch = t.match(/(\d{3,})/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 500;
    return {
      productFamily: 'digital_print', description: 'Postcards 5x7 - Full Color',
      width: 7, height: 5, quantity: qty, unit: 'each',
      materialCost: qty * 0.10, equipmentCost: 35, laborHours: 0.75, laborRate: 45,
      setupCost: 25, markup: 45,
    };
  }
  if (t.includes('5x8') || (t.includes('5') && t.includes('8') && t.includes('postcard'))) {
    const qtyMatch = t.match(/(\d{3,})/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 500;
    return {
      productFamily: 'digital_print', description: 'Postcards 5x8 - Full Color',
      width: 8, height: 5, quantity: qty, unit: 'each',
      materialCost: qty * 0.12, equipmentCost: 35, laborHours: 0.75, laborRate: 45,
      setupCost: 25, markup: 45,
    };
  }
  if (t.includes('brochure') || t.includes('trifold') || t.includes('tri-fold')) {
    const qtyMatch = t.match(/(\d{3,})/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 500;
    return {
      productFamily: 'digital_print', description: 'Trifold Brochure 8.5x11 - Full Color',
      width: 8.5, height: 11, quantity: qty, unit: 'each',
      materialCost: qty * 0.10, equipmentCost: 30, laborHours: 0.75, laborRate: 45,
      setupCost: 30, markup: 45,
    };
  }
  if (t.includes('step and repeat') || t.includes('step & repeat') || t.includes('backdrop')) {
    const sizeMatch = t.match(/(\d+)\s*x\s*(\d+)/);
    const w = sizeMatch ? parseInt(sizeMatch[1]) : 8;
    const h = sizeMatch ? parseInt(sizeMatch[2]) : 8;
    const sqft = (w * h);
    return {
      productFamily: 'wide_format', description: `Step & Repeat Backdrop ${w}x${h}ft`,
      width: w * 12, height: h * 12, quantity: 1, unit: 'each',
      materialCost: sqft * 1.20, equipmentCost: sqft * 0.80, laborHours: 1.5, laborRate: 45,
      setupCost: 45, markup: 60,
    };
  }
  if (t.includes('vehicle wrap') || t.includes('car wrap') || t.includes('truck wrap')) {
    const partial = t.includes('partial');
    return {
      productFamily: 'wide_format', description: partial ? 'Partial Vehicle Wrap' : 'Full Vehicle Wrap',
      quantity: 1, unit: 'each',
      materialCost: partial ? 350 : 800, equipmentCost: partial ? 150 : 350, laborHours: partial ? 8 : 20, laborRate: 65,
      setupCost: 95, markup: 50,
    };
  }
  if (t.includes('window graphic') || t.includes('window perf') || t.includes('window vinyl')) {
    const sizeMatch = t.match(/(\d+)\s*x\s*(\d+)/);
    const w = sizeMatch ? parseFloat(sizeMatch[1]) : 24;
    const h = sizeMatch ? parseFloat(sizeMatch[2]) : 36;
    const sqft = (w * h) / 144;
    return {
      productFamily: 'wide_format', description: `Window Graphics ${w}"x${h}"`,
      width: w, height: h, quantity: 1, unit: 'each',
      materialCost: sqft * 2.50, equipmentCost: sqft * 1.20, laborHours: 0.5, laborRate: 45,
      setupCost: 20, markup: 55,
    };
  }
  if (t.includes('foam board') || t.includes('foamboard') || t.includes('foam core')) {
    const sizeMatch = t.match(/(\d+)\s*x\s*(\d+)/);
    const w = sizeMatch ? parseInt(sizeMatch[1]) : 24;
    const h = sizeMatch ? parseInt(sizeMatch[2]) : 36;
    const qtyMatch = t.match(/(\d+)\s*(ea|each|pc|pcs|piece)/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
    return {
      productFamily: 'rigid_sign', description: `Foam Board Signs ${w}"x${h}"`,
      width: w, height: h, quantity: qty, unit: 'each',
      materialCost: qty * (w * h / 144) * 4.5, equipmentCost: qty * 2.5, laborHours: qty * 0.15, laborRate: 45,
      setupCost: 20, markup: 55,
    };
  }
  if (t.includes('aluminum sign') || t.includes('alum sign') || t.includes('dibond') || t.includes('alumalite')) {
    const sizeMatch = t.match(/(\d+)\s*x\s*(\d+)/);
    const w = sizeMatch ? parseInt(sizeMatch[1]) : 24;
    const h = sizeMatch ? parseInt(sizeMatch[2]) : 18;
    const qtyMatch = t.match(/(\d+)\s*(ea|each|pc|pcs)/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
    return {
      productFamily: 'rigid_sign', description: `Aluminum Sign ${w}"x${h}" - .040 Alum`,
      width: w, height: h, quantity: qty, unit: 'each',
      materialCost: qty * (w * h / 144) * 7.5, equipmentCost: qty * 3.5, laborHours: qty * 0.2, laborRate: 45,
      setupCost: 25, markup: 60,
    };
  }
  if (t.includes('retractable') || t.includes('roll up') || t.includes('roll-up') || t.includes('pull up banner')) {
    const qtyMatch = t.match(/(\d+)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
    return {
      productFamily: 'wide_format', description: 'Retractable Banner Stand 33"x80"',
      width: 33, height: 80, quantity: qty, unit: 'each',
      materialCost: qty * 35, equipmentCost: qty * 15, laborHours: qty * 0.25, laborRate: 45,
      setupCost: 20, vendorCost: qty * 55, markup: 45,
    };
  }
  if (t.includes('door hanger')) {
    const qtyMatch = t.match(/(\d{2,})/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 250;
    return {
      productFamily: 'digital_print', description: 'Door Hangers 3.5x8.5 - Full Color',
      width: 3.5, height: 8.5, quantity: qty, unit: 'each',
      materialCost: qty * 0.12, equipmentCost: 30, laborHours: 0.5, laborRate: 45,
      setupCost: 25, markup: 50,
    };
  }
  if (t.includes('sticker') || t.includes('label')) {
    const sizeMatch = t.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/);
    const w = sizeMatch ? parseFloat(sizeMatch[1]) : 4;
    const h = sizeMatch ? parseFloat(sizeMatch[2]) : 3;
    const qtyMatch = t.match(/(\d{2,})/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 100;
    return {
      productFamily: 'label', description: `Custom Stickers/Labels ${w}"x${h}"`,
      width: w, height: h, quantity: qty, unit: 'each',
      materialCost: qty * 0.18, equipmentCost: 20, laborHours: 0.35, laborRate: 45,
      setupCost: 20, markup: 55,
    };
  }
  if (t.includes('embroidery') || t.includes('polo') || t.includes('hat')) {
    const qtyMatch = t.match(/(\d+)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 12;
    const isHat = t.includes('hat') || t.includes('cap');
    return {
      productFamily: 'apparel', description: isHat ? 'Embroidered Hats/Caps' : 'Embroidered Polo Shirts',
      quantity: qty, unit: 'each',
      materialCost: qty * (isHat ? 8 : 12), laborHours: qty * 0.1, laborRate: 45,
      setupCost: 45, markup: 70,
    };
  }
  if (t.includes('installation') || t.includes('install') || t.includes('mounting')) {
    const hoursMatch = t.match(/(\d+)\s*hr/i);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 2;
    return {
      productFamily: 'installation', description: 'Installation / Mounting Service',
      quantity: hours, unit: 'hour',
      laborHours: hours, laborRate: 75,
      markup: 30,
    };
  }
  return null;
}

const EMPTY_LINE_ITEM = (): QuoteLineItem => ({
  id: nanoid(), productFamily: 'digital_print', description: '', quantity: 1, unit: 'each',
  totalCost: 0, markup: 45, sellPrice: 0,
});

export const QuoteBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customers, contacts, templates, addQuote, nextQuoteNumber, currentUser } = useStore();

  const [form, setForm] = useState({
    title: '', customerId: '', contactId: '', status: 'pending' as Quote['status'],
    taxRate: 7, validUntil: '', notes: '', internalNotes: '', csrId: currentUser.id,
  });
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([EMPTY_LINE_ITEM()]);
  const [expandedItem, setExpandedItem] = useState<string | null>(lineItems[0]?.id || null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const customerContacts = contacts.filter(c => c.customerId === form.customerId);

  const subtotal = lineItems.reduce((s, i) => s + (i.sellPrice || 0), 0);
  const taxAmount = subtotal * (form.taxRate / 100);
  const total = subtotal + taxAmount;

  const updateLineItem = useCallback((id: string, updates: Partial<QuoteLineItem>) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      const calculated = calculateLineItem(updated);
      return { ...updated, ...calculated } as QuoteLineItem;
    }));
  }, []);

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  const addFromTemplate = (templateId: string) => {
    const t = templates.find(x => x.id === templateId);
    if (!t) return;
    const item: QuoteLineItem = {
      ...EMPTY_LINE_ITEM(),
      ...t.defaultLineItem,
      id: nanoid(),
      description: t.defaultLineItem.description || t.name,
      totalCost: 0, markup: t.defaultLineItem.markup || 45, sellPrice: 0,
    } as QuoteLineItem;
    const calc = calculateLineItem(item);
    setLineItems(prev => [...prev, { ...item, ...calc } as QuoteLineItem]);
    setExpandedItem(item.id);
    setShowTemplates(false);
  };

  const handleAIInterpret = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate API
    const result = interpretNLQ(aiPrompt);
    if (result) {
      const item: QuoteLineItem = {
        ...EMPTY_LINE_ITEM(),
        ...result,
        id: nanoid(),
      } as QuoteLineItem;
      const calc = calculateLineItem(item);
      setLineItems(prev => [...prev.filter(i => i.description !== ''), { ...item, ...calc } as QuoteLineItem]);
      setExpandedItem(item.id);
      setAiPrompt('');
      setShowAI(false);
    }
    setAiLoading(false);
  };

  const handleSave = async (andConvert = false) => {
    setSaving(true);
    const number = nextQuoteNumber();
    const quote: Quote = {
      id: nanoid(), number, status: form.status,
      customerId: form.customerId || undefined, customerName: selectedCustomer?.name,
      contactId: form.contactId || undefined,
      title: form.title || `Quote ${number}`,
      lineItems, subtotal, taxRate: form.taxRate, taxAmount, total,
      validUntil: form.validUntil || undefined,
      notes: form.notes || undefined, internalNotes: form.internalNotes || undefined,
      csrId: form.csrId,
      source: 'scratch',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addQuote(quote);
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
    if (andConvert) navigate(`/orders/new?quoteId=${quote.id}`);
    else navigate(`/quotes/${quote.id}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <button onClick={() => navigate('/quotes')} className="hover:text-blue-600">Quotes</button>
            <span>/</span>
            <span className="text-gray-900 font-medium">New Quote</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Build Quote</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/quotes')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave()} loading={saving}>Save Draft</Button>
          <Button variant="primary" onClick={() => handleSave(true)} loading={saving} icon={<ArrowRight className="w-4 h-4" />}>Save & Convert to Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main form */}
        <div className="col-span-2 space-y-4">
          {/* Quote info */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quote Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Quote Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Spring Marketing Package for Acme Corp" />
              </div>
              <div>
                <Select label="Customer" value={form.customerId}
                  onChange={e => setForm(f => ({ ...f, customerId: e.target.value, contactId: '' }))}
                  options={[{ value: '', label: 'Select customer...' }, ...customers.map(c => ({ value: c.id, label: c.name }))]}
                />
              </div>
              <div>
                <Select label="Contact" value={form.contactId}
                  onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}
                  options={[{ value: '', label: 'Select contact...' }, ...customerContacts.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))]}
                  disabled={!form.customerId}
                />
              </div>
              <div>
                <Select label="Status" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as Quote['status'] }))}
                  options={[{ value: 'pending', label: 'Pending' }, { value: 'hot', label: 'Hot 🔥' }, { value: 'cold', label: 'Cold ❄️' }]}
                />
              </div>
              <div>
                <Input label="Valid Until" type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
              </div>
            </div>
          </Card>

          {/* AI Quick Quote */}
          <Card className="p-5 border-dashed border-2 border-blue-200 bg-blue-50/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-blue-900 text-sm">AI Quick Quote</span>
              <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Smart</span>
            </div>
            <div className="flex gap-2">
              <input
                value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAIInterpret()}
                placeholder='Try: "500 5x8 postcards full color" or "20 yard signs 18x24" or "48 t-shirts 1 color screen print"'
                className="flex-1 px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-300"
              />
              <Button variant="primary" onClick={handleAIInterpret} loading={aiLoading} icon={<Sparkles className="w-4 h-4" />}>
                Add Item
              </Button>
            </div>
            <p className="text-xs text-blue-400 mt-2">Describe what you need to quote — AI will fill in product type, sizing, and estimated pricing.</p>
          </Card>

          {/* Templates quick pick */}
          {showTemplates && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">Quick Start from Template</h3>
                <button onClick={() => setShowTemplates(false)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {templates.filter(t => t.isFavorite).map(t => (
                  <button key={t.id} onClick={() => addFromTemplate(t.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 text-center">{t.name}</span>
                    <span className="text-[10px] text-gray-400">{t.defaultLineItem.quantity} {t.defaultLineItem.unit}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => { const item = EMPTY_LINE_ITEM(); setLineItems(p => [...p, item]); setExpandedItem(item.id); }}>
                  Add Item
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <LineItemRow
                  key={item.id} item={item} index={idx}
                  isExpanded={expandedItem === item.id}
                  onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  onUpdate={(updates) => updateLineItem(item.id, updates)}
                  onRemove={() => removeLineItem(item.id)}
                  onDuplicate={() => {
                    const newItem = { ...item, id: nanoid() };
                    setLineItems(prev => [...prev, newItem]);
                    setExpandedItem(newItem.id);
                  }}
                />
              ))}
            </div>

            <button onClick={() => { const item = EMPTY_LINE_ITEM(); setLineItems(p => [...p, item]); setExpandedItem(item.id); }}
              className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </div>

          {/* Notes */}
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <Textarea label="Customer Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes visible to customer on quote PDF..." rows={3} />
              <Textarea label="Internal Notes" value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))} placeholder="Internal notes for your team..." rows={3} />
            </div>
          </Card>
        </div>

        {/* Sidebar summary */}
        <div className="space-y-4">
          <Card className="p-5 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-500" /> Quote Summary</h3>
            <div className="space-y-3 mb-4">
              {lineItems.filter(i => i.description).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-2">{item.description || 'Untitled item'}</span>
                  <span className="font-medium text-gray-900 flex-shrink-0">{formatCurrency(item.sellPrice || 0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Tax</span>
                  <input type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-12 px-1 py-0.5 text-xs border border-gray-200 rounded text-center" />
                  <span>%</span>
                </div>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button variant="primary" className="w-full justify-center" onClick={() => handleSave()} loading={saving}>Save Quote</Button>
              <Button variant="success" className="w-full justify-center" onClick={() => handleSave(true)} loading={saving} icon={<ArrowRight className="w-4 h-4" />}>Convert to Order</Button>
            </div>
          </Card>

          {/* Margin summary */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Margin Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Cost</span>
                <span className="font-medium">{formatCurrency(lineItems.reduce((s, i) => s + (i.totalCost || 0), 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Revenue</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-emerald-600">Gross Profit</span>
                <span className="text-emerald-600">{formatCurrency(subtotal - lineItems.reduce((s, i) => s + (i.totalCost || 0), 0))}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── LINE ITEM ROW ───────────────────────────────────────────────────────────

interface LineItemRowProps {
  item: QuoteLineItem; index: number;
  isExpanded: boolean; onToggle: () => void;
  onUpdate: (u: Partial<QuoteLineItem>) => void;
  onRemove: () => void; onDuplicate: () => void;
}

const LineItemRow: React.FC<LineItemRowProps> = ({ item, index, isExpanded, onToggle, onUpdate, onRemove, onDuplicate }) => {
  const { materials, equipment, vendors } = useStore();
  const familyLabel = PRODUCT_FAMILIES.find(f => f.id === item.productFamily);

  return (
    <Card className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <span className="w-5 h-5 bg-gray-100 rounded text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">{index + 1}</span>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.description || <span className="text-gray-400">Untitled line item</span>}</p>
          <p className="text-xs text-gray-400">{familyLabel?.icon} {familyLabel?.label} · {item.quantity} {item.unit}</p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-400">Cost: {formatCurrency(item.totalCost || 0)}</p>
            <p className="text-xs text-gray-500">Markup: {item.markup}%</p>
          </div>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(item.sellPrice || 0)}</p>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={onDuplicate} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Copy className="w-3.5 h-3.5" /></button>
            <button onClick={onRemove} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Expanded form */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4">
          {/* Product family */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Product Type</label>
            <div className="grid grid-cols-4 gap-1.5 md:grid-cols-6">
              {PRODUCT_FAMILIES.map(f => (
                <button key={f.id} onClick={() => onUpdate({ productFamily: f.id })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${item.productFamily === f.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                  <span>{f.icon}</span>
                  <span className="font-medium leading-tight text-center">{f.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <Input label="Description" value={item.description} onChange={e => onUpdate({ description: e.target.value })} placeholder="Describe this product or service..." />
            </div>
            <Input label="Quantity" type="number" value={item.quantity} onChange={e => onUpdate({ quantity: parseFloat(e.target.value) || 1 })} />
            <Select label="Unit" value={item.unit} onChange={e => onUpdate({ unit: e.target.value as QuoteLineItem['unit'] })}
              options={['each', 'sqft', 'sqin', 'linear_ft', 'sheet', 'hour', 'piece', 'roll', 'lb', 'set'].map(u => ({ value: u, label: u }))} />
            {(item.productFamily === 'digital_print' || item.productFamily === 'offset_print' || item.productFamily === 'wide_format' || item.productFamily === 'rigid_sign' || item.productFamily === 'roll_sign' || item.productFamily === 'label') && (
              <>
                <Input label="Width (in)" type="number" value={item.width || ''} onChange={e => onUpdate({ width: parseFloat(e.target.value) || undefined })} placeholder="e.g. 8.5" />
                <Input label="Height (in)" type="number" value={item.height || ''} onChange={e => onUpdate({ height: parseFloat(e.target.value) || undefined })} placeholder="e.g. 11" />
              </>
            )}
          </div>

          {/* Costing section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Cost Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Select label="Material" value={item.materialId || ''} onChange={e => {
                  const mat = materials.find(m => m.id === e.target.value);
                  onUpdate({ materialId: e.target.value || undefined, materialName: mat?.name });
                }}
                  options={[{ value: '', label: 'None' }, ...materials.map(m => ({ value: m.id, label: m.name }))]} />
              </div>
              <Input label="Material Cost ($)" type="number" value={item.materialCost || ''} onChange={e => onUpdate({ materialCost: parseFloat(e.target.value) || 0 })} prefix="$" />
              <div>
                <Select label="Equipment" value={item.equipmentId || ''} onChange={e => {
                  const eq = equipment.find(x => x.id === e.target.value);
                  onUpdate({ equipmentId: e.target.value || undefined, equipmentName: eq?.name });
                }}
                  options={[{ value: '', label: 'None' }, ...equipment.map(eq => ({ value: eq.id, label: eq.name }))]} />
              </div>
              <Input label="Equipment Cost ($)" type="number" value={item.equipmentCost || ''} onChange={e => onUpdate({ equipmentCost: parseFloat(e.target.value) || 0 })} prefix="$" />
              <Input label="Labor Hours" type="number" value={item.laborHours || ''} onChange={e => onUpdate({ laborHours: parseFloat(e.target.value) || 0 })} />
              <Input label="Labor Rate ($/hr)" type="number" value={item.laborRate || 45} onChange={e => onUpdate({ laborRate: parseFloat(e.target.value) || 45 })} prefix="$" />
              <Input label="Setup Cost ($)" type="number" value={item.setupCost || ''} onChange={e => onUpdate({ setupCost: parseFloat(e.target.value) || 0 })} prefix="$" />
              <Input label="Vendor Cost ($)" type="number" value={item.vendorCost || ''} onChange={e => onUpdate({ vendorCost: parseFloat(e.target.value) || 0 })} prefix="$" />
              <Input label="Additional ($)" type="number" value={item.additionalCost || ''} onChange={e => onUpdate({ additionalCost: parseFloat(e.target.value) || 0 })} prefix="$" />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4 bg-blue-50 rounded-xl p-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Total Cost</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(item.totalCost || 0)}</p>
            </div>
            <Input label="Markup %" type="number" value={item.markup} onChange={e => onUpdate({ markup: parseFloat(e.target.value) || 0 })} suffix="%" className="bg-white" />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sell Price</p>
              <input
                type="number" value={(item.sellPrice || 0).toFixed(2)}
                onChange={e => {
                  const sp = parseFloat(e.target.value) || 0;
                  const cost = item.totalCost || 0;
                  const markup = cost > 0 ? ((sp - cost) / cost) * 100 : 0;
                  onUpdate({ sellPrice: sp, markup: Math.round(markup) });
                }}
                className="w-full px-3 py-2 text-lg font-bold text-blue-700 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <Input label="Line Item Notes" value={item.notes || ''} onChange={e => onUpdate({ notes: e.target.value })} placeholder="Notes for this item..." />
        </div>
      )}
    </Card>
  );
};
