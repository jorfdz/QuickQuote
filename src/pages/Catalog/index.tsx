import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Layers, Package, Search, Copy, ChevronDown, FileText, X, ChevronRight } from 'lucide-react';
import { Card, PageHeader, Button, Input, Table, Modal, ConfirmDialog } from '../../components/ui';
import { usePricingStore } from '../../store/pricingStore';
import type { PricingCategory, PricingProduct, ProductPricingTemplate } from '../../types/pricing';

// ─── Product Material Entry (multi-material support) ────────────────────────

interface ProductMaterialEntry {
  materialId: string;
  materialName: string;
  sides: 'Single' | 'Double';
  color: 'Color' | 'Black' | 'Color & Black';
  originals: number;
}

const blankMaterialEntry = (): ProductMaterialEntry => ({
  materialId: '', materialName: '', sides: 'Double', color: 'Color', originals: 1,
});

// ─── Form defaults ─────────────────────────────────────────────────────────

const blankCategory = (): Omit<PricingCategory, 'id' | 'createdAt'> => ({
  name: '', description: '', sortOrder: 0,
});

const blankProduct = (): Omit<PricingProduct, 'id' | 'createdAt'> => ({
  categoryIds: [], name: '', aliases: [], defaultQuantity: 1000,
  defaultFinalSize: '', defaultFinalWidth: 0, defaultFinalHeight: 0,
  defaultColor: 'Color', defaultSides: 'Double', isTemplate: false,
  defaultFinishingIds: [],
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
    categories, products, materials, equipment, materialGroups, templates,
    finishing, finishingGroups,
    addCategory, updateCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct,
    deleteTemplate,
  } = usePricingStore();

  const [subTab, setSubTab] = useState('categories');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');

  // ── Category state ─────────────────────────────────────────────────────
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState(blankCategory());
  const [catDeleteConfirm, setCatDeleteConfirm] = useState<string | null>(null);

  // ── Product state ──────────────────────────────────────────────────────
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodEditId, setProdEditId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState(blankProduct());
  const [prodAliasesStr, setProdAliasesStr] = useState('');
  const [prodDeleteConfirm, setProdDeleteConfirm] = useState<string | null>(null);
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');
  const [prodMaterials, setProdMaterials] = useState<ProductMaterialEntry[]>([blankMaterialEntry()]);
  const [prodFinishingIds, setProdFinishingIds] = useState<string[]>([]);
  const [expandedFinishingGroups, setExpandedFinishingGroups] = useState<Record<string, boolean>>({});

  // ── Template state ─────────────────────────────────────────────────────
  const [tplDeleteConfirm, setTplDeleteConfirm] = useState<string | null>(null);
  const [tplRemoveAllConfirm, setTplRemoveAllConfirm] = useState(false);
  const [tplSearch, setTplSearch] = useState('');

  // ── Material search state (per-row for multi-material) ─────────────────
  const [materialQueries, setMaterialQueries] = useState<Record<number, string>>({});
  const [showMaterialDropdown, setShowMaterialDropdown] = useState<number | null>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  // ── Derived ────────────────────────────────────────────────────────────
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => { p.categoryIds.forEach(cid => { counts[cid] = (counts[cid] || 0) + 1; }); });
    return counts;
  }, [products]);

  const getCategoryNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return '--';
    return ids.map(id => categories.find(c => c.id === id)?.name || '').filter(Boolean).join(', ');
  };

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

  // ── Materials filtered by product's categories ────────────────────────
  const availableMaterials = useMemo(() => {
    if (!prodForm.categoryIds || prodForm.categoryIds.length === 0) return materials;
    const matchingGroupIds = materialGroups
      .filter(g => g.categoryIds.some(cid => prodForm.categoryIds.includes(cid)))
      .map(g => g.id);
    if (matchingGroupIds.length === 0) return materials;
    return materials.filter(m => m.materialGroupIds && m.materialGroupIds.some(gid => matchingGroupIds.includes(gid)));
  }, [prodForm.categoryIds, materials, materialGroups]);

  const getFilteredMaterials = (rowIndex: number) => {
    const query = materialQueries[rowIndex] || '';
    if (!query.trim()) return availableMaterials;
    const q = query.toLowerCase();
    return availableMaterials.filter(m => m.name.toLowerCase().includes(q) || m.size.toLowerCase().includes(q));
  };

  // ── Finishing filtered by product's categories ────────────────────────
  const availableFinishing = useMemo(() => {
    if (!prodForm.categoryIds || prodForm.categoryIds.length === 0) return finishing;
    return finishing.filter(f => f.categoryIds.some(cid => prodForm.categoryIds.includes(cid)));
  }, [prodForm.categoryIds, finishing]);

  // Group finishing services by their finishing groups
  const finishingByGroup = useMemo(() => {
    const grouped: Record<string, { group: { id: string; name: string }; services: typeof finishing }> = {};
    // Build a map of finishing group id -> group
    const groupMap = new Map(finishingGroups.map(g => [g.id, g]));
    availableFinishing.forEach(f => {
      f.finishingGroupIds.forEach(gid => {
        const grp = groupMap.get(gid);
        if (grp) {
          if (!grouped[gid]) grouped[gid] = { group: grp, services: [] };
          grouped[gid].services.push(f);
        }
      });
      // If service has no groups, put in "Other"
      if (f.finishingGroupIds.length === 0) {
        if (!grouped['_other']) grouped['_other'] = { group: { id: '_other', name: 'Other' }, services: [] };
        grouped['_other'].services.push(f);
      }
    });
    return Object.values(grouped);
  }, [availableFinishing, finishingGroups]);

  // ── Equipment filtered by product's categories ────────────────────────
  const availableEquipment = useMemo(() => {
    if (!prodForm.categoryIds || prodForm.categoryIds.length === 0) return equipment;
    const catNames = prodForm.categoryIds.map(id => categories.find(c => c.id === id)?.name?.toLowerCase() || '').filter(Boolean);
    if (catNames.length === 0) return equipment;
    return equipment.filter(e => catNames.includes(e.categoryApplies.toLowerCase()));
  }, [prodForm.categoryIds, equipment, categories]);

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
    setProdForm(blankProduct());
    setProdAliasesStr('');
    setProdEditId(null);
    setMaterialQueries({});
    setProdMaterials([blankMaterialEntry()]);
    setProdFinishingIds([]);
    setExpandedFinishingGroups({});
    setProdModalOpen(true);
  };
  const openEditProduct = (p: PricingProduct) => {
    setProdEditId(p.id);
    setProdForm({
      categoryIds: p.categoryIds, name: p.name, aliases: p.aliases,
      defaultQuantity: p.defaultQuantity, defaultMaterialId: p.defaultMaterialId,
      defaultMaterialName: p.defaultMaterialName,
      defaultFinalSize: p.defaultFinalSize, defaultFinalWidth: p.defaultFinalWidth,
      defaultFinalHeight: p.defaultFinalHeight, defaultEquipmentId: p.defaultEquipmentId,
      defaultEquipmentName: p.defaultEquipmentName, defaultColor: p.defaultColor,
      defaultSides: p.defaultSides, defaultFolding: p.defaultFolding, isTemplate: p.isTemplate,
      defaultFinishingIds: p.defaultFinishingIds || [],
    });
    setProdAliasesStr(p.aliases.join(', '));
    // Load first material entry from product defaults
    const firstMat: ProductMaterialEntry = {
      materialId: p.defaultMaterialId || '',
      materialName: p.defaultMaterialName || '',
      sides: p.defaultSides,
      color: p.defaultColor,
      originals: 1,
    };
    setProdMaterials([firstMat]);
    setMaterialQueries({ 0: p.defaultMaterialName || '' });
    setProdFinishingIds(p.defaultFinishingIds || []);
    setExpandedFinishingGroups({});
    setProdModalOpen(true);
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

  const handleSaveProduct = () => {
    // Save first material entry to product defaults
    const firstMat = prodMaterials[0] || blankMaterialEntry();
    const data = {
      ...prodForm,
      aliases: prodAliasesStr.split(',').map(s => s.trim()).filter(Boolean),
      defaultFinalSize: `${prodForm.defaultFinalWidth}x${prodForm.defaultFinalHeight}`,
      defaultMaterialId: firstMat.materialId || prodForm.defaultMaterialId,
      defaultMaterialName: firstMat.materialName || prodForm.defaultMaterialName,
      defaultColor: firstMat.color,
      defaultSides: firstMat.sides,
      defaultFinishingIds: prodFinishingIds,
    };
    if (prodEditId) updateProduct(prodEditId, data);
    else addProduct(data);
    setProdModalOpen(false);
  };
  const handleDeleteProduct = (id: string) => { deleteProduct(id); setProdDeleteConfirm(null); };

  const toggleCategoryId = (catId: string) => {
    setProdForm(f => {
      const ids = f.categoryIds.includes(catId)
        ? f.categoryIds.filter(id => id !== catId)
        : [...f.categoryIds, catId];
      return { ...f, categoryIds: ids };
    });
  };

  // ── Multi-material helpers ────────────────────────────────────────────
  const updateMaterialEntry = (idx: number, updates: Partial<ProductMaterialEntry>) => {
    setProdMaterials(prev => prev.map((m, i) => i === idx ? { ...m, ...updates } : m));
  };
  const addMaterialEntry = () => {
    setProdMaterials(prev => [...prev, blankMaterialEntry()]);
  };
  const removeMaterialEntry = (idx: number) => {
    setProdMaterials(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx));
    setMaterialQueries(prev => {
      const next = { ...prev };
      delete next[idx];
      // Re-index queries above the removed row
      const reindexed: Record<number, string> = {};
      Object.entries(next).forEach(([k, v]) => {
        const key = parseInt(k);
        reindexed[key > idx ? key - 1 : key] = v;
      });
      return reindexed;
    });
  };

  const toggleFinishingId = (fId: string) => {
    setProdFinishingIds(prev => prev.includes(fId) ? prev.filter(id => id !== fId) : [...prev, fId]);
  };

  const toggleFinishingGroup = (gId: string) => {
    setExpandedFinishingGroups(prev => ({ ...prev, [gId]: !prev[gId] }));
  };

  // Selected equipment details for the modal
  const selectedEquipment = useMemo(() => {
    if (!prodForm.defaultEquipmentId) return null;
    return equipment.find(e => e.id === prodForm.defaultEquipmentId) || null;
  }, [prodForm.defaultEquipmentId, equipment]);

  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Catalog"
        subtitle="Manage product categories, product definitions, and item templates"
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
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-medium text-sm text-gray-900">{t.name}</td>
                <td className="py-2.5 px-4 text-sm text-gray-600">{t.productName}</td>
                <td className="py-2.5 px-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.categoryName || '--'}</span>
                </td>
                <td className="py-2.5 px-4 text-sm text-gray-600">{t.quantity.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-xs text-gray-600">{t.finalWidth}x{t.finalHeight}</td>
                <td className="py-2.5 px-4 text-xs text-gray-500 max-w-[120px] truncate">{t.materialName || '--'}</td>
                <td className="py-2.5 px-4 text-xs text-gray-600">{t.color}</td>
                <td className="py-2.5 px-4 text-xs text-gray-600">{t.sides}</td>
                <td className="py-2.5 px-4 text-xs text-gray-400">{t.usageCount}x</td>
                <td className="py-2.5 px-4">
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
                </td>
              </tr>
            ))}
            {filteredTemplates.length === 0 && (
              <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-400">No templates found. Create one to get started.</td></tr>
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

      {/* ═══ PRODUCT MODAL ═══ */}
      <Modal isOpen={prodModalOpen} onClose={() => setProdModalOpen(false)} title={prodEditId ? 'Edit Product' : 'Add Product'} size="xl">
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

          {/* ─── Section 1: Product Info ─────────────────────────────── */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Product Name</label>
                <input
                  value={prodForm.name}
                  onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Business Cards"
                  className="w-full px-3 py-1.5 text-sm font-bold bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent placeholder-gray-400 transition-all"
                />
              </div>
              <Input label="Aliases (comma-separated)" value={prodAliasesStr}
                onChange={e => setProdAliasesStr(e.target.value)}
                placeholder="e.g. BCARD, BC, Presentation Cards" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input label="Quantity" type="number" value={prodForm.defaultQuantity}
                onChange={e => setProdForm(f => ({ ...f, defaultQuantity: parseInt(e.target.value) || 0 }))} />
              <Input label="Width (in)" type="number" value={prodForm.defaultFinalWidth || ''}
                onChange={e => setProdForm(f => ({ ...f, defaultFinalWidth: parseFloat(e.target.value) || 0 }))} />
              <Input label="Height (in)" type="number" value={prodForm.defaultFinalHeight || ''}
                onChange={e => setProdForm(f => ({ ...f, defaultFinalHeight: parseFloat(e.target.value) || 0 }))} />
            </div>

            {/* Categories as toggle pills */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => (
                  <button key={c.id} type="button" onClick={() => toggleCategoryId(c.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                      prodForm.categoryIds.includes(c.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Section 2: Equipment ────────────────────────────────── */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Equipment</div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Equipment</label>
              <select
                value={prodForm.defaultEquipmentId || ''}
                onChange={e => {
                  const eq = equipment.find(x => x.id === e.target.value);
                  setProdForm(f => ({ ...f, defaultEquipmentId: eq?.id || '', defaultEquipmentName: eq?.name || '' }));
                }}
                className="w-full px-3 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent"
              >
                <option value="">Select equipment...</option>
                {availableEquipment.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name} ({eq.categoryApplies})</option>
                ))}
              </select>
            </div>
            {selectedEquipment && (
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                <span>Cost Model: <span className="font-medium text-gray-700">{selectedEquipment.costType.replace(/_/g, ' ')}</span></span>
                <span>Cost/Unit: <span className="font-medium text-gray-700">${selectedEquipment.unitCost.toFixed(4)}</span></span>
                <span>Unit: <span className="font-medium text-gray-700">{selectedEquipment.costUnit === 'per_click' ? 'per click' : 'per sqft'}</span></span>
              </div>
            )}
          </div>

          {/* ─── Section 3: Materials & Sides ────────────────────────── */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Materials & Sides</div>
            <div className="space-y-2">
              {prodMaterials.map((mat, idx) => {
                const rowMaterials = getFilteredMaterials(idx);
                return (
                  <div key={idx} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2.5">
                    {/* Material searchable dropdown */}
                    <div className="relative flex-1 min-w-0">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Material</label>
                      <div className="relative">
                        <input
                          ref={idx === 0 ? materialInputRef : undefined}
                          type="text"
                          value={materialQueries[idx] ?? mat.materialName}
                          onChange={e => {
                            setMaterialQueries(prev => ({ ...prev, [idx]: e.target.value }));
                            setShowMaterialDropdown(idx);
                          }}
                          onFocus={() => setShowMaterialDropdown(idx)}
                          onBlur={() => setTimeout(() => setShowMaterialDropdown(null), 200)}
                          placeholder="Search materials..."
                          className="w-full px-3 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent pr-8 placeholder-gray-400"
                        />
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {showMaterialDropdown === idx && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {rowMaterials.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400">No materials found</div>
                          )}
                          {rowMaterials.slice(0, 30).map(m => (
                            <button key={m.id} type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                updateMaterialEntry(idx, { materialId: m.id, materialName: m.name });
                                setMaterialQueries(prev => ({ ...prev, [idx]: m.name }));
                                setShowMaterialDropdown(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
                              <span className="font-medium text-gray-900">{m.name}</span>
                              <span className="text-xs text-gray-400 ml-2">{m.size}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sides dropdown */}
                    <div className="w-24 flex-shrink-0">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Sides</label>
                      <select value={mat.sides} onChange={e => updateMaterialEntry(idx, { sides: e.target.value as 'Single' | 'Double' })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent">
                        <option value="Single">Single</option>
                        <option value="Double">Double</option>
                      </select>
                    </div>

                    {/* Color dropdown */}
                    <div className="w-32 flex-shrink-0">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Color</label>
                      <select value={mat.color} onChange={e => updateMaterialEntry(idx, { color: e.target.value as 'Color' | 'Black' | 'Color & Black' })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent">
                        <option value="Color">Color</option>
                        <option value="Black">Black</option>
                        <option value="Color & Black">Color & Black</option>
                      </select>
                    </div>

                    {/* Originals */}
                    <div className="w-16 flex-shrink-0">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Orig.</label>
                      <input type="number" min={1} value={mat.originals}
                        onChange={e => updateMaterialEntry(idx, { originals: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent text-center" />
                    </div>

                    {/* Remove button */}
                    <div className="flex-shrink-0 pt-5">
                      <button type="button" onClick={() => removeMaterialEntry(idx)}
                        disabled={prodMaterials.length <= 1}
                        className={`p-1.5 rounded transition-colors ${prodMaterials.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={addMaterialEntry}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Material
            </button>
          </div>

          {/* ─── Section 4: Finishing ────────────────────────────────── */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Finishing</div>
            {finishingByGroup.length === 0 && (
              <p className="text-xs text-gray-400 italic">No finishing services available for selected categories.</p>
            )}
            <div className="space-y-1">
              {finishingByGroup.map(({ group, services }) => (
                <div key={group.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => toggleFinishingGroup(group.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedFinishingGroups[group.id] ? 'rotate-90' : ''}`} />
                    {group.name}
                    <span className="text-[10px] text-gray-400 font-normal ml-auto">
                      {services.filter(s => prodFinishingIds.includes(s.id)).length}/{services.length} selected
                    </span>
                  </button>
                  {expandedFinishingGroups[group.id] && (
                    <div className="border-t border-gray-100 px-3 py-2 space-y-1.5 bg-gray-50/50">
                      {services.map(svc => (
                        <label key={svc.id} className="flex items-center gap-2 text-sm cursor-pointer select-none py-0.5">
                          <input type="checkbox"
                            checked={prodFinishingIds.includes(svc.id)}
                            onChange={() => toggleFinishingId(svc.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                          <span className={prodFinishingIds.includes(svc.id) ? 'text-gray-900 font-medium' : 'text-gray-600'}>{svc.name}</span>
                          <span className="text-[10px] text-gray-400 ml-auto">{svc.chargeBasis.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Actions ─────────────────────────────────────────────── */}
          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setProdModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProduct} disabled={!prodForm.name || prodForm.categoryIds.length === 0}>
              {prodEditId ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
