import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Layers, Package, Search, Copy, FileText } from 'lucide-react';
import { Card, PageHeader, Button, Input, Table, Modal, ConfirmDialog } from '../../components/ui';
import { usePricingStore } from '../../store/pricingStore';
import type { PricingCategory, PricingProduct } from '../../types/pricing';
import { ProductEditModal, LineItemPricingState, DEFAULT_PRICING_STATE } from '../../components/pricing/ItemEditModal';
import type { QuoteLineItem } from '../../types';
import { nanoid } from '../../utils/nanoid';

// ─── Form defaults ─────────────────────────────────────────────────────────

const blankCategory = (): Omit<PricingCategory, 'id' | 'createdAt'> => ({
  name: '', description: '', sortOrder: 0,
});

const SUBTABS = [
  { id: 'categories', label: 'Categories' },
  { id: 'products', label: 'Products' },
  { id: 'templates', label: 'Item Templates' },
];

// ═════════════════════════════════════════════════════════════════════════════

export const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    categories, products, templates,
    addCategory, updateCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct,
    deleteTemplate, updateTemplate,
  } = usePricingStore();

  const [subTab, setSubTab] = useState('categories');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');

  // ── Category state ─────────────────────────────────────────────────────
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState(blankCategory());
  const [catDeleteConfirm, setCatDeleteConfirm] = useState<string | null>(null);

  // ── Product state ──────────────────────────────────────────────────────
  const [prodDeleteConfirm, setProdDeleteConfirm] = useState<string | null>(null);
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');

  // ── Full ProductEditModal for products (same UI as quotes/orders) ───────
  const [prodItemModalOpen, setProdItemModalOpen] = useState(false);
  const [prodItem, setProdItem] = useState<QuoteLineItem | null>(null);
  const [prodPricingState, setProdPricingState] = useState<LineItemPricingState>(DEFAULT_PRICING_STATE());
  // Store the editing product id separately from the old modal
  const [prodItemEditId, setProdItemEditId] = useState<string | null>(null);
  const [prodItemAliasesStr, setProdItemAliasesStr] = useState('');
  // User-selected category IDs for the current product being created/edited
  const [prodSelectedCategoryIds, setProdSelectedCategoryIds] = useState<string[]>([]);

  // ── Template state ─────────────────────────────────────────────────────
  const [tplDeleteConfirm, setTplDeleteConfirm] = useState<string | null>(null);
  const [tplRemoveAllConfirm, setTplRemoveAllConfirm] = useState(false);
  const [tplSearch, setTplSearch] = useState('');

  // ── Template edit modal (ProductEditModal, same as products) ───────────
  const [tplItemModalOpen, setTplItemModalOpen] = useState(false);
  const [tplItem, setTplItem] = useState<QuoteLineItem | null>(null);
  const [tplPricingState, setTplPricingState] = useState<LineItemPricingState>(DEFAULT_PRICING_STATE());
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => { p.categoryIds.forEach(cid => { counts[cid] = (counts[cid] || 0) + 1; }); });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (prodCategoryFilter !== 'all') list = list.filter(p => p.categoryIds.includes(prodCategoryFilter));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.aliases.some(a => a.toLowerCase().includes(q)));
    }
    return list;
  }, [products, prodCategoryFilter, search]);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const filteredTemplates = useMemo(() => {
    if (!tplSearch) return templates;
    const q = tplSearch.toLowerCase();
    return templates.filter(t => t.name.toLowerCase().includes(q) || t.productName.toLowerCase().includes(q));
  }, [templates, tplSearch]);

  const handleDeleteTemplate = (id: string) => { deleteTemplate(id); setTplDeleteConfirm(null); };
  const handleRemoveAllTemplates = () => { templates.forEach(t => deleteTemplate(t.id)); setTplRemoveAllConfirm(false); };

  const openEditTemplate = (t: typeof templates[number]) => {
    const item: QuoteLineItem = {
      id: t.id,
      productFamily: 'digital_print',
      description: t.name,
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
        productId: t.productId || '',
        productName: t.productName,
        categoryName: t.categoryName,
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
      productId: t.productId || '',
      productName: t.productName,
      categoryName: t.categoryName,
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

  const handleSaveTemplateFromModal = (finalItem: QuoteLineItem, finalPs: LineItemPricingState) => {
    if (!editingTemplateId) return;
    const w = finalPs.finalWidth || finalItem.width || 0;
    const h = finalPs.finalHeight || finalItem.height || 0;
    updateTemplate(editingTemplateId, {
      name: finalItem.description || finalPs.productName || 'Template',
      categoryId: categories.find(c => c.name === finalPs.categoryName)?.id || '',
      categoryName: finalPs.categoryName,
      productId: finalPs.productId || undefined,
      productName: finalPs.productName,
      quantity: finalPs.quantity || finalItem.quantity,
      finalWidth: w,
      finalHeight: h,
      materialId: finalPs.materialId || finalItem.materialId || undefined,
      materialName: finalItem.materialName || undefined,
      equipmentId: finalPs.equipmentId || finalItem.equipmentId || undefined,
      equipmentName: finalItem.equipmentName || undefined,
      color: finalPs.colorMode,
      sides: finalPs.sides,
      folding: finalPs.foldingType || undefined,
    });
    setTplItemModalOpen(false);
    setTplItem(null);
    setEditingTemplateId(null);
  };

  // Also sync prodPricingState on every onUpdatePricing so the latest state is always
  // available to handleSaveProductFromModal when Done is clicked
  const handleProdUpdatePricing = (updates: Partial<LineItemPricingState>) => {
    setProdPricingState(prev => ({ ...prev, ...updates }));
  };


  // ── Category handlers ──────────────────────────────────────────────────
  const openAddCategory = () => { setCatForm(blankCategory()); setCatEditId(null); setCatModalOpen(true); };
  const openEditCategory = (c: PricingCategory) => {
    setCatEditId(c.id);
    setCatForm({ name: c.name, description: c.description || '', sortOrder: c.sortOrder });
    setCatModalOpen(true);
  };
  const handleSaveCategory = () => {
    if (catEditId) updateCategory(catEditId, catForm);
    else addCategory(catForm);
    setCatModalOpen(false);
  };
  const handleDeleteCategory = (id: string) => { deleteCategory(id); setCatDeleteConfirm(null); };

  // ── Product handlers ───────────────────────────────────────────────────
  const openAddProduct = () => {
    // Use the full ProductEditModal (same as quotes/orders)
    const newItem: QuoteLineItem = {
      id: nanoid(), productFamily: 'digital_print', description: '', quantity: 1000, unit: 'each',
      totalCost: 0, markup: 0, sellPrice: 0,
    };
    setProdItem(newItem);
    setProdPricingState(DEFAULT_PRICING_STATE());
    setProdItemEditId(null);
    setProdItemAliasesStr('');
    // Pre-select the current category filter if one is active
    setProdSelectedCategoryIds(prodCategoryFilter !== 'all' ? [prodCategoryFilter] : []);
    setProdItemModalOpen(true);
  };

  const openEditProduct = (p: PricingProduct) => {
    // If a full pricing context was previously saved, restore it directly — this preserves
    // ALL modal state: labor, brokered, service lines, markup overrides, etc.
    const savedCtx = p.defaultPricingContext as Partial<LineItemPricingState> | undefined;

    const item: QuoteLineItem = {
      id: p.id,
      productFamily: 'digital_print',
      description: p.name,
      quantity: savedCtx?.quantity ?? p.defaultQuantity,
      unit: 'each',
      width: (savedCtx?.finalWidth || p.defaultFinalWidth) || undefined,
      height: (savedCtx?.finalHeight || p.defaultFinalHeight) || undefined,
      materialId: (savedCtx?.materialId || p.defaultMaterialId) || undefined,
      materialName: p.defaultMaterialName || undefined,
      equipmentId: (savedCtx?.equipmentId || p.defaultEquipmentId) || undefined,
      equipmentName: p.defaultEquipmentName || undefined,
      totalCost: 0, markup: 0, sellPrice: 0,
      // Use saved context as pricingContext so the modal's 3-tier restore picks it up
      pricingContext: savedCtx ? { ...savedCtx } : {
        productName: p.name,
        quantity: p.defaultQuantity,
        finalWidth: p.defaultFinalWidth,
        finalHeight: p.defaultFinalHeight,
        materialId: p.defaultMaterialId || '',
        equipmentId: p.defaultEquipmentId || '',
        colorMode: p.defaultColor === 'Black' ? 'Black' : 'Color',
        sides: p.defaultSides,
        foldingType: p.defaultFolding || '',
        drillingType: '',
        cuttingEnabled: true,
        sheetsPerStack: 500,
        serviceLines: [],
        selectedLaborIds: [],
        selectedBrokeredIds: [],
      } as Record<string, unknown>,
    };

    // Build the pricing state — prefer saved context so all fields including labor/brokered are restored
    const ps: LineItemPricingState = savedCtx
      ? { ...DEFAULT_PRICING_STATE(), ...savedCtx }
      : {
          ...DEFAULT_PRICING_STATE(),
          productName: p.name,
          quantity: p.defaultQuantity,
          finalWidth: p.defaultFinalWidth,
          finalHeight: p.defaultFinalHeight,
          materialId: p.defaultMaterialId || '',
          equipmentId: p.defaultEquipmentId || '',
          colorMode: p.defaultColor === 'Black' ? 'Black' : 'Color',
          sides: p.defaultSides,
          foldingType: p.defaultFolding || '',
        };

    setProdItem(item);
    setProdPricingState(ps);
    setProdItemEditId(p.id);
    setProdItemAliasesStr(p.aliases.join(', '));
    // Restore the product's existing category assignments for editing
    setProdSelectedCategoryIds(p.categoryIds || []);
    setProdItemModalOpen(true);
  };

  const handleCloneProduct = (p: PricingProduct) => {
    addProduct({
      categoryIds: p.categoryIds, name: `Clone of ${p.name}`, aliases: [...p.aliases],
      defaultQuantity: p.defaultQuantity, defaultMaterialId: p.defaultMaterialId,
      defaultMaterialName: p.defaultMaterialName,
      defaultFinalSize: p.defaultFinalSize, defaultFinalWidth: p.defaultFinalWidth,
      defaultFinalHeight: p.defaultFinalHeight, defaultEquipmentId: p.defaultEquipmentId,
      defaultEquipmentName: p.defaultEquipmentName, defaultColor: p.defaultColor,
      defaultSides: p.defaultSides, defaultFolding: p.defaultFolding, isTemplate: false,
      defaultFinishingIds: p.defaultFinishingIds ? [...p.defaultFinishingIds] : [],
    });
  };

  // Save from the full ProductEditModal
  const handleSaveProductFromModal = (finalItem: QuoteLineItem, finalPs: LineItemPricingState) => {
    const w = finalPs.finalWidth || finalItem.width || 0;
    const h = finalPs.finalHeight || finalItem.height || 0;
    // Use the category IDs the user explicitly selected in the modal
    const categoryIds = prodSelectedCategoryIds.length > 0
      ? prodSelectedCategoryIds
      : prodItemEditId
        ? (products.find(p => p.id === prodItemEditId)?.categoryIds || [])
        : prodCategoryFilter !== 'all' ? [prodCategoryFilter] : (categories.length > 0 ? [categories[0].id] : []);
    const productDefaults = {
      categoryIds,
      name: finalItem.description || finalPs.productName || 'New Product',
      aliases: prodItemAliasesStr.split(',').map(s => s.trim()).filter(Boolean),
      defaultQuantity: finalPs.quantity || finalItem.quantity || 1000,
      defaultFinalSize: w && h ? `${w}x${h}` : '',
      defaultFinalWidth: w,
      defaultFinalHeight: h,
      defaultMaterialId: finalPs.materialId || finalItem.materialId || undefined,
      defaultMaterialName: finalItem.materialName || undefined,
      defaultEquipmentId: finalPs.equipmentId || finalItem.equipmentId || undefined,
      defaultEquipmentName: finalItem.equipmentName || undefined,
      defaultColor: (finalPs.colorMode === 'Black' ? 'Black' : 'Color') as 'Color' | 'Black' | 'Color & Black',
      defaultSides: finalPs.sides,
      defaultFolding: finalPs.foldingType || undefined,
      isTemplate: false,
      defaultFinishingIds: [],
      // ── Full pricing context — persists ALL modal state so it's restored exactly on re-open ──
      // This is the critical fix: without this, labor/brokered services, service line overrides,
      // markup edits, and all other modal state are lost when the user navigates away.
      defaultPricingContext: { ...finalPs } as Record<string, unknown>,
    };
    if (prodItemEditId) {
      updateProduct(prodItemEditId, productDefaults);
    } else {
      addProduct(productDefaults);
    }
    setProdItemModalOpen(false);
    setProdItem(null);
  };
  const handleDeleteProduct = (id: string) => { deleteProduct(id); setProdDeleteConfirm(null); };

  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Catalog"
        subtitle="Manage product categories, product definitions, and item templates"
        back={() => navigate(-1)}
        actions={
          subTab === 'categories' ? (
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddCategory}>Add Category</Button>
          ) : subTab === 'products' ? (
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddProduct}>Add Product</Button>
          ) : (
            <div className="flex gap-2">
              {templates.length > 0 && (
                <Button variant="secondary" size="sm" onClick={() => setTplRemoveAllConfirm(true)}>Remove All</Button>
              )}
              <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate('/templates')}>New Template</Button>
            </div>
          )
        }
      />

      {/* Sub-tabs + Search */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-2.5 flex-wrap">
          <div className="flex border border-gray-200 rounded-lg p-0.5">
            {SUBTABS.map(st => (
              <button key={st.id} onClick={() => { setSubTab(st.id); setSearch(''); setTplSearch(''); }}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${subTab === st.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {st.id === 'categories' ? <Layers className="w-3.5 h-3.5" /> : st.id === 'products' ? <Package className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {st.label} ({st.id === 'categories' ? categories.length : st.id === 'products' ? products.length : templates.length})
              </button>
            ))}
          </div>
          {subTab !== 'templates' && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${subTab}...`}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          )}
          {subTab === 'products' && (
            <select value={prodCategoryFilter} onChange={e => setProdCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {subTab === 'templates' && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={tplSearch} onChange={e => setTplSearch(e.target.value)} placeholder="Search templates..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          )}
        </div>
      </Card>

      {/* ═══ CATEGORIES TAB ═══ */}
      {subTab === 'categories' && (
        <Card>
          <Table headers={['Name', 'Description', 'Sort Order', '# Products', 'Actions']}>
            {filteredCategories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEditCategory(cat)}>
                <td className="py-2.5 px-4 font-medium text-sm text-gray-900">{cat.name}</td>
                <td className="py-2.5 px-4 text-gray-500 text-xs max-w-xs truncate">{cat.description || '--'}</td>
                <td className="py-2.5 px-4 text-gray-600 text-sm">{cat.sortOrder}</td>
                <td className="py-2.5 px-4">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{productCountByCategory[cat.id] || 0}</span>
                </td>
                <td className="py-2.5 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditCategory(cat)} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    {catDeleteConfirm === cat.id ? (
                      <div className="flex gap-1 items-center">
                        <button onClick={() => handleDeleteCategory(cat.id)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded">Delete</button>
                        <button onClick={() => setCatDeleteConfirm(null)} className="px-2 py-0.5 text-xs text-gray-500">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setCatDeleteConfirm(cat.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredCategories.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No categories found</td></tr>
            )}
          </Table>
        </Card>
      )}

      {/* ═══ PRODUCTS TAB ═══ */}
      {subTab === 'products' && (
        <Card>
          <Table headers={['Name', 'Categories', 'Aliases', 'Size', 'Paper', 'Equipment', 'Color', 'Sides', 'Actions']}>
            {filteredProducts.map(prod => (
              <tr key={prod.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEditProduct(prod)}>
                <td className="py-2.5 px-4 font-medium text-sm text-gray-900">{prod.name}</td>
                <td className="py-2.5 px-4">
                  <div className="flex flex-wrap gap-1">
                    {prod.categoryIds.map(cid => {
                      const catName = categories.find(c => c.id === cid)?.name;
                      return catName ? <span key={cid} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{catName}</span> : null;
                    })}
                    {(!prod.categoryIds || prod.categoryIds.length === 0) && <span className="text-xs text-gray-400">--</span>}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-gray-500 text-xs max-w-[140px] truncate">{prod.aliases.length > 0 ? prod.aliases.join(', ') : '--'}</td>
                <td className="py-2.5 px-4 text-gray-600 text-xs">{prod.defaultFinalWidth && prod.defaultFinalHeight ? `${prod.defaultFinalWidth}x${prod.defaultFinalHeight}` : '--'}</td>
                <td className="py-2.5 px-4 text-gray-500 text-xs max-w-[120px] truncate">{prod.defaultMaterialName || '--'}</td>
                <td className="py-2.5 px-4 text-gray-500 text-xs">{prod.defaultEquipmentName || '--'}</td>
                <td className="py-2.5 px-4 text-gray-600 text-xs">{prod.defaultColor}</td>
                <td className="py-2.5 px-4 text-gray-600 text-xs">{prod.defaultSides}</td>
                <td className="py-2.5 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleCloneProduct(prod)} className="p-1.5 hover:bg-green-50 rounded text-gray-400 hover:text-green-600" title="Clone product"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEditProduct(prod)} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    {prodDeleteConfirm === prod.id ? (
                      <div className="flex gap-1 items-center">
                        <button onClick={() => handleDeleteProduct(prod.id)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded">Delete</button>
                        <button onClick={() => setProdDeleteConfirm(null)} className="px-2 py-0.5 text-xs text-gray-500">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setProdDeleteConfirm(prod.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-400">No products found</td></tr>
            )}
          </Table>
        </Card>
      )}

      {/* ═══ TEMPLATES TAB ═══ */}
      {subTab === 'templates' && (
        <Card>
          <Table headers={['Name', 'Product', 'Category', 'Qty', 'Size', 'Material', 'Color', 'Sides', 'Used', 'Actions']}>
            {filteredTemplates.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEditTemplate(t)}>
                <td className="py-2.5 px-4 font-medium text-sm text-gray-900">{t.name}</td>
                <td className="py-2.5 px-4 text-sm text-gray-600">{t.productName}</td>
                <td className="py-2.5 px-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.categoryName || '--'}</span>
                </td>
                <td className="py-2.5 px-4 text-sm text-gray-600">{t.quantity.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-xs text-gray-600">{t.finalWidth && t.finalHeight ? `${t.finalWidth}x${t.finalHeight}` : '--'}</td>
                <td className="py-2.5 px-4 text-xs text-gray-500 max-w-[120px] truncate">{t.materialName || '--'}</td>
                <td className="py-2.5 px-4 text-xs text-gray-600">{t.color}</td>
                <td className="py-2.5 px-4 text-xs text-gray-600">{t.sides}</td>
                <td className="py-2.5 px-4 text-xs text-gray-400">{t.usageCount}x</td>
                <td className="py-2.5 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditTemplate(t)} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600" title="Edit template">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {tplDeleteConfirm === t.id ? (
                      <div className="flex gap-1 items-center">
                        <button onClick={() => handleDeleteTemplate(t.id)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded">Delete</button>
                        <button onClick={() => setTplDeleteConfirm(null)} className="px-2 py-0.5 text-xs text-gray-500">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setTplDeleteConfirm(t.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTemplates.length === 0 && (
              <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-400">No templates found. Star an item inside a quote to create one.</td></tr>
            )}
          </Table>
        </Card>
      )}

      {/* Remove All Templates confirm */}
      <ConfirmDialog
        isOpen={tplRemoveAllConfirm}
        onClose={() => setTplRemoveAllConfirm(false)}
        onConfirm={handleRemoveAllTemplates}
        title="Remove All Templates"
        message="Are you sure you want to remove all templates? This action cannot be undone."
        confirmLabel="Remove All"
      />

      {/* ═══ CATEGORY MODAL ═══ */}
      <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title={catEditId ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <Input label="Category Name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Digital Press" />
          <Input label="Description" value={catForm.description || ''} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
          <Input label="Sort Order" type="number" value={catForm.sortOrder} onChange={e => setCatForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveCategory} disabled={!catForm.name}>{catEditId ? 'Save Changes' : 'Add Category'}</Button>
          </div>
        </div>
      </Modal>

      {/* ══ Full ProductEditModal for adding/editing products ══ */}
      {prodItemModalOpen && prodItem && (
        <ProductEditModal
          item={prodItem}
          pricingState={prodPricingState}
          isNew={!prodItemEditId}
          isProductCreation={!prodItemEditId}
          selectedCategoryIds={prodSelectedCategoryIds}
          allCategories={categories}
          onCategoryIdsChange={setProdSelectedCategoryIds}
          onUpdateItem={updates => {
            setProdItem(prev => prev ? { ...prev, ...updates } : prev);
          }}
          onUpdatePricing={updates => {
            setProdPricingState(prev => ({ ...prev, ...updates }));
          }}
          onClose={() => {
            if (prodItem) {
              handleSaveProductFromModal(prodItem, prodPricingState);
            } else {
              setProdItemModalOpen(false);
            }
          }}
          onRemove={() => {
            setProdItemModalOpen(false);
            setProdItem(null);
          }}
          matchingTemplates={[]}
          onApplyTemplate={() => {}}
        />
      )}

      {/* ══ Full ProductEditModal for editing item templates ══ */}
      {tplItemModalOpen && tplItem && (
        <ProductEditModal
          item={tplItem}
          pricingState={tplPricingState}
          isNew={false}
          onUpdateItem={updates => {
            setTplItem(prev => prev ? { ...prev, ...updates } : prev);
          }}
          onUpdatePricing={updates => {
            setTplPricingState(prev => ({ ...prev, ...updates }));
          }}
          onClose={() => {
            if (tplItem) {
              handleSaveTemplateFromModal(tplItem, tplPricingState);
            } else {
              setTplItemModalOpen(false);
            }
          }}
          onRemove={() => {
            // Remove template on trash button inside modal
            if (editingTemplateId) deleteTemplate(editingTemplateId);
            setTplItemModalOpen(false);
            setTplItem(null);
            setEditingTemplateId(null);
          }}
          matchingTemplates={[]}
          onApplyTemplate={() => {}}
        />
      )}
    </div>
  );
};
