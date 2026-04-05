import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, PageHeader, Table, ConfirmDialog } from '../../components/ui';
import { usePricingStore } from '../../store/pricingStore';
import { ProductEditModal, LineItemPricingState, DEFAULT_PRICING_STATE } from '../../components/pricing/ItemEditModal';
import type { QuoteLineItem } from '../../types';
import { nanoid } from '../../utils/nanoid';

// ═══════════════════════════════════════════════════════════════════════════════

export const Templates: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pricing = usePricingStore();
  const { templates, categories } = pricing;

  // ── Filter / sort ────────────────────────────────────────────────────
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [sortField, setSortField] = useState<'name' | 'productName' | 'usageCount'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filteredTemplates = useMemo(() => {
    let list = [...templates];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.productName.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      return 0;
    });
    return list;
  }, [templates, search, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // ── Delete state ────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [removeAllConfirm, setRemoveAllConfirm] = useState(false);

  const handleDelete = (id: string) => { pricing.deleteTemplate(id); setDeleteConfirmId(null); };
  const handleRemoveAll = () => { templates.forEach(t => pricing.deleteTemplate(t.id)); setRemoveAllConfirm(false); };

  // ── ProductEditModal state ──────────────────────────────────────────
  const [tplItemModalOpen, setTplItemModalOpen] = useState(false);
  const [tplItem, setTplItem] = useState<QuoteLineItem | null>(null);
  const [tplPricingState, setTplPricingState] = useState<LineItemPricingState>(DEFAULT_PRICING_STATE());
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const openNewTemplate = () => {
    const item: QuoteLineItem = {
      id: nanoid(), productFamily: 'digital_print', description: '', quantity: 1000, unit: 'each',
      totalCost: 0, markup: 0, sellPrice: 0,
    };
    setTplItem(item);
    setTplPricingState(DEFAULT_PRICING_STATE());
    setEditingTemplateId(null);
    setTplItemModalOpen(true);
  };

  const openEditTemplate = (t: typeof templates[0]) => {
    const item: QuoteLineItem = {
      id: t.id,
      productFamily: 'digital_print',
      description: t.productName,
      quantity: t.quantity,
      unit: 'each',
      width: t.finalWidth || undefined,
      height: t.finalHeight || undefined,
      materialId: t.materialId,
      materialName: t.materialName,
      equipmentId: t.equipmentId,
      equipmentName: t.equipmentName,
      totalCost: 0, markup: 0, sellPrice: 0,
      pricingContext: {
        productName: t.productName,
        quantity: t.quantity,
        finalWidth: t.finalWidth,
        finalHeight: t.finalHeight,
        materialId: t.materialId || '',
        equipmentId: t.equipmentId || '',
        colorMode: t.color === 'Black' ? 'Black' : 'Color',
        sides: t.sides,
        foldingType: t.folding || '',
        drillingType: '',
        cuttingEnabled: true,
        sheetsPerStack: 500,
        serviceLines: [],
      } as Record<string, unknown>,
    };
    const ps: LineItemPricingState = {
      ...DEFAULT_PRICING_STATE(),
      productName: t.productName,
      quantity: t.quantity,
      finalWidth: t.finalWidth,
      finalHeight: t.finalHeight,
      materialId: t.materialId || '',
      equipmentId: t.equipmentId || '',
      colorMode: (t.color === 'Black' ? 'Black' : 'Color') as 'Color' | 'Black',
      sides: t.sides,
      foldingType: t.folding || '',
    };
    setTplItem(item);
    setTplPricingState(ps);
    setEditingTemplateId(t.id);
    setTplItemModalOpen(true);
  };

  const handleSaveFromModal = (finalItem: QuoteLineItem, finalPs: LineItemPricingState) => {
    const w = finalPs.finalWidth || finalItem.width || 0;
    const h = finalPs.finalHeight || finalItem.height || 0;
    const cat = categories.find(c => c.name === finalPs.categoryName) || categories[0];
    const tplData = {
      name: finalItem.description || finalPs.productName || 'New Template',
      categoryId: cat?.id || '',
      categoryName: cat?.name || finalPs.categoryName || '',
      productId: finalPs.productId || undefined,
      productName: finalPs.productName || finalItem.description || '',
      quantity: finalPs.quantity || finalItem.quantity || 1000,
      finalWidth: w,
      finalHeight: h,
      materialId: finalPs.materialId || finalItem.materialId || undefined,
      materialName: finalItem.materialName || undefined,
      equipmentId: finalPs.equipmentId || finalItem.equipmentId || undefined,
      equipmentName: finalItem.equipmentName || undefined,
      color: finalPs.colorMode === 'Black' ? 'Black' : 'Color',
      sides: finalPs.sides,
      folding: finalPs.foldingType || undefined,
      isFavorite: editingTemplateId
        ? (templates.find(t => t.id === editingTemplateId)?.isFavorite || false)
        : false,
    };
    if (editingTemplateId) {
      pricing.updateTemplate(editingTemplateId, tplData);
    } else {
      pricing.addTemplate(tplData);
    }
    setTplItemModalOpen(false);
    setTplItem(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="Manage reusable product pricing templates for fast quoting"
        actions={
          <div className="flex gap-2">
            {templates.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setRemoveAllConfirm(true)}>Remove All</Button>
            )}
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openNewTemplate}>New Template</Button>
          </div>
        }
      />

      {/* Search bar */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <span className="text-xs text-gray-400">{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}</span>
        </div>
      </Card>

      {/* Templates table */}
      <Card>
        <Table headers={['Name', 'Product', 'Category', 'Qty', 'Size', 'Material', 'Equipment', 'Color', 'Sides', 'Used', 'Actions']}>
          {filteredTemplates.map(t => (
            <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEditTemplate(t)}>
              <td className="py-2.5 px-4 font-medium text-sm text-gray-900">{t.name}</td>
              <td className="py-2.5 px-4 text-sm text-gray-600">{t.productName}</td>
              <td className="py-2.5 px-4">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.categoryName || '--'}</span>
              </td>
              <td className="py-2.5 px-4 text-sm text-gray-600">{t.quantity.toLocaleString()}</td>
              <td className="py-2.5 px-4 text-xs text-gray-600">{t.finalWidth}x{t.finalHeight}</td>
              <td className="py-2.5 px-4 text-xs text-gray-500 max-w-[120px] truncate">{t.materialName || '--'}</td>
              <td className="py-2.5 px-4 text-xs text-gray-500">{t.equipmentName || '--'}</td>
              <td className="py-2.5 px-4 text-xs text-gray-600">{t.color}</td>
              <td className="py-2.5 px-4 text-xs text-gray-600">{t.sides}</td>
              <td className="py-2.5 px-4 text-xs text-gray-400">{t.usageCount}x</td>
              <td className="py-2.5 px-4" onClick={e => e.stopPropagation()}>
                {deleteConfirmId === t.id ? (
                  <div className="flex gap-1 items-center">
                    <button onClick={() => handleDelete(t.id)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded">Delete</button>
                    <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-0.5 text-xs text-gray-500">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirmId(t.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
          {filteredTemplates.length === 0 && (
            <tr><td colSpan={11} className="py-12 text-center text-sm text-gray-400">No templates found. Create one to get started.</td></tr>
          )}
        </Table>
      </Card>

      {/* Remove All confirm */}
      <ConfirmDialog
        isOpen={removeAllConfirm}
        onClose={() => setRemoveAllConfirm(false)}
        onConfirm={handleRemoveAll}
        title="Remove All Templates"
        message="Are you sure you want to remove all templates? This action cannot be undone."
        confirmLabel="Remove All"
      />

      {/* ══ ProductEditModal for adding/editing templates ══ */}
      {tplItemModalOpen && tplItem && (
        <ProductEditModal
          item={tplItem}
          pricingState={tplPricingState}
          isNew={!editingTemplateId}
          onUpdateItem={updates => setTplItem(prev => prev ? { ...prev, ...updates } : prev)}
          onUpdatePricing={updates => setTplPricingState(prev => ({ ...prev, ...updates }))}
          onClose={() => {
            if (tplItem) handleSaveFromModal(tplItem, tplPricingState);
            else setTplItemModalOpen(false);
          }}
          onRemove={() => { setTplItemModalOpen(false); setTplItem(null); }}
          matchingTemplates={[]}
          onApplyTemplate={() => {}}
        />
      )}
    </div>
  );
};
