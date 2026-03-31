import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Search, X, ChevronDown } from 'lucide-react';
import { Button, Card, PageHeader, Table, Modal, ConfirmDialog, Input, Badge } from '../../components/ui';
import { usePricingStore } from '../../store/pricingStore';
import type { PricingProduct, PricingServiceLine } from '../../types/pricing';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const slId = () => `sl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ═══════════════════════════════════════════════════════════════════════════════

export const Templates: React.FC = () => {
  const pricing = usePricingStore();
  const { templates, categories, products, materials, equipment, materialGroups, finishing } = pricing;

  // ── Filter / sort ────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
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

  // ── Delete state ────────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [removeAllConfirm, setRemoveAllConfirm] = useState(false);

  const handleDelete = (id: string) => { pricing.deleteTemplate(id); setDeleteConfirmId(null); };
  const handleRemoveAll = () => { templates.forEach(t => pricing.deleteTemplate(t.id)); setRemoveAllConfirm(false); };

  // ── New Template modal ──────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PricingProduct | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [finalWidth, setFinalWidth] = useState(0);
  const [finalHeight, setFinalHeight] = useState(0);
  const [materialId, setMaterialId] = useState('');
  const [materialQuery, setMaterialQuery] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [equipmentId, setEquipmentId] = useState('');
  const [colorMode, setColorMode] = useState<'Color' | 'Black'>('Color');
  const [sides, setSides] = useState<'Single' | 'Double'>('Double');
  const [foldingType, setFoldingType] = useState('');
  const materialInputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!productQuery.trim()) return products;
    return pricing.searchProducts(productQuery);
  }, [productQuery, products, pricing]);

  const selectedMaterial = useMemo(() => materials.find(m => m.id === materialId), [materials, materialId]);
  const selectedEquipment = useMemo(() => equipment.find(e => e.id === equipmentId), [equipment, equipmentId]);

  const availableMaterials = useMemo(() => {
    if (!selectedProduct || selectedProduct.categoryIds.length === 0) return materials;
    const matchingGroupIds = materialGroups
      .filter(g => g.categoryIds.some(cid => selectedProduct.categoryIds.includes(cid)))
      .map(g => g.id);
    if (matchingGroupIds.length === 0) return materials;
    return materials.filter(m => m.materialGroupId && matchingGroupIds.includes(m.materialGroupId));
  }, [selectedProduct, materials, materialGroups]);

  const filteredMaterials = useMemo(() => {
    if (!materialQuery.trim()) return availableMaterials;
    const q = materialQuery.toLowerCase();
    return availableMaterials.filter(m => m.name.toLowerCase().includes(q) || m.size.toLowerCase().includes(q));
  }, [availableMaterials, materialQuery]);

  const availableEquipment = useMemo(() => {
    if (!selectedProduct || selectedProduct.categoryIds.length === 0) return equipment;
    const catNames = selectedProduct.categoryIds.map(id => categories.find(c => c.id === id)?.name?.toLowerCase() || '').filter(Boolean);
    return equipment.filter(e => catNames.includes(e.categoryApplies.toLowerCase()));
  }, [selectedProduct, equipment, categories]);

  const availableFinishing = useMemo(() => {
    if (!categoryName) return [];
    return pricing.getFinishingForCategory(categoryName);
  }, [categoryName, pricing]);

  const foldOptions = useMemo(() => {
    return availableFinishing.filter(f => f.finishingGroupIds?.includes('fg2')).map(f => f.name);
  }, [availableFinishing]);

  const selectProduct = (product: PricingProduct) => {
    setSelectedProduct(product);
    setProductQuery(product.name);
    setShowSuggestions(false);
    setTplName(product.name);
    const cat = categories.find(c => product.categoryIds.includes(c.id));
    setCategoryName(cat?.name || '');
    setQuantity(product.defaultQuantity);
    setFinalWidth(product.defaultFinalWidth);
    setFinalHeight(product.defaultFinalHeight);
    setEquipmentId(product.defaultEquipmentId || '');
    setColorMode(product.defaultColor === 'Black' ? 'Black' : 'Color');
    setSides(product.defaultSides);
    setFoldingType(product.defaultFolding || '');
    // Try to match material
    const matMatch = materials.find(m =>
      m.name.toLowerCase().includes((product.defaultMaterialName || '').toLowerCase().split(' ').slice(-2).join(' '))
    );
    if (matMatch) {
      setMaterialId(matMatch.id);
      setMaterialQuery(matMatch.name);
    } else {
      setMaterialId('');
      setMaterialQuery(product.defaultMaterialName || '');
    }
  };

  const openNewTemplate = () => {
    setTplName('');
    setProductQuery('');
    setSelectedProduct(null);
    setCategoryName('');
    setQuantity(1000);
    setFinalWidth(0);
    setFinalHeight(0);
    setMaterialId('');
    setMaterialQuery('');
    setEquipmentId('');
    setColorMode('Color');
    setSides('Double');
    setFoldingType('');
    setModalOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!tplName || !selectedProduct) return;
    pricing.addTemplate({
      name: tplName,
      categoryId: categories.find(c => c.name === categoryName)?.id || '',
      categoryName,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      finalWidth,
      finalHeight,
      materialId: materialId || undefined,
      materialName: selectedMaterial?.name,
      equipmentId: equipmentId || undefined,
      equipmentName: selectedEquipment?.name,
      color: colorMode,
      sides,
      folding: foldingType || undefined,
      isFavorite: false,
    });
    setModalOpen(false);
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
            <tr key={t.id} className="hover:bg-gray-50">
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
              <td className="py-2.5 px-4">
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

      {/* ═══ NEW TEMPLATE MODAL ═══ */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Template" size="2xl">
        <div className="space-y-4">
          {/* Product search */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Product</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" value={productQuery}
                onChange={e => { setProductQuery(e.target.value); setShowSuggestions(true); if (!e.target.value.trim()) setSelectedProduct(null); }}
                onFocus={() => productQuery && setShowSuggestions(true)}
                placeholder="Type product name..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              {productQuery && (
                <button onClick={() => { setProductQuery(''); setSelectedProduct(null); setCategoryName(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
              {showSuggestions && suggestions.length > 0 && !selectedProduct && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {suggestions.map(p => {
                    const cat = categories.find(c => p.categoryIds.includes(c.id));
                    return (
                      <button key={p.id} onClick={() => selectProduct(p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{p.name}</span>
                          {p.aliases.length > 0 && <span className="text-xs text-gray-400 ml-2">aka {p.aliases.slice(0, 3).join(', ')}</span>}
                        </div>
                        <Badge color="gray">{cat?.name}</Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Template name + category */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Template Name" value={tplName} onChange={e => setTplName(e.target.value)} placeholder="Auto-fills from product" />
            <Input label="Category" value={categoryName} disabled />
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-4 gap-3">
            <Input label="Quantity" type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} />
            <Input label="Width (in)" type="number" value={finalWidth || ''} onChange={e => setFinalWidth(parseFloat(e.target.value) || 0)} />
            <Input label="Height (in)" type="number" value={finalHeight || ''} onChange={e => setFinalHeight(parseFloat(e.target.value) || 0)} />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color</label>
              <select value={colorMode} onChange={e => setColorMode(e.target.value as any)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="Color">Color</option>
                <option value="Black">Black</option>
              </select>
            </div>
          </div>

          {/* Material + Equipment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Material</label>
              <div className="relative">
                <input
                  ref={materialInputRef}
                  type="text" value={materialQuery}
                  onChange={e => { setMaterialQuery(e.target.value); setShowMaterialDropdown(true); }}
                  onFocus={() => setShowMaterialDropdown(true)}
                  onBlur={() => setTimeout(() => setShowMaterialDropdown(false), 200)}
                  placeholder="Search materials..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                />
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {showMaterialDropdown && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredMaterials.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No materials found</div>}
                  {filteredMaterials.slice(0, 30).map(m => (
                    <button key={m.id} type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { setMaterialId(m.id); setMaterialQuery(m.name); setShowMaterialDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-900">{m.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{m.size}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Equipment</label>
              <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select equipment...</option>
                {availableEquipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} ({eq.categoryApplies})</option>)}
              </select>
            </div>
          </div>

          {/* Sides + Folding */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sides</label>
              <select value={sides} onChange={e => setSides(e.target.value as any)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="Single">Single</option>
                <option value="Double">Double</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Folding</label>
              <select value={foldingType} onChange={e => setFoldingType(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">None</option>
                {foldOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveTemplate} disabled={!tplName || !selectedProduct}>Save Template</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
