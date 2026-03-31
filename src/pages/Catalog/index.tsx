import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Star, Layers, Package, Search } from 'lucide-react';
import { Card, PageHeader, Button, Input, Table, Modal, Select, ConfirmDialog } from '../../components/ui';
import { usePricingStore } from '../../store/pricingStore';
import type { PricingCategory, PricingProduct } from '../../types/pricing';

// ─── Form defaults ─────────────────────────────────────────────────────────

const blankCategory = (): Omit<PricingCategory, 'id' | 'createdAt'> => ({
  name: '', description: '', sortOrder: 0,
});

const blankProduct = (): Omit<PricingProduct, 'id' | 'createdAt'> => ({
  categoryId: '', name: '', aliases: [], defaultQuantity: 1000,
  defaultFinalSize: '', defaultFinalWidth: 0, defaultFinalHeight: 0,
  defaultColor: 'Color', defaultSides: 'Double', isTemplate: false,
});

const SUBTABS = [
  { id: 'categories', label: 'Categories' },
  { id: 'products', label: 'Products' },
];

// ═════════════════════════════════════════════════════════════════════════════

export const Catalog: React.FC = () => {
  const {
    categories, products,
    addCategory, updateCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct, toggleProductTemplate,
  } = usePricingStore();

  const [subTab, setSubTab] = useState('categories');
  const [search, setSearch] = useState('');

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

  // ── Derived ────────────────────────────────────────────────────────────
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => { counts[p.categoryId] = (counts[p.categoryId] || 0) + 1; });
    return counts;
  }, [products]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '--';

  const filteredProducts = useMemo(() => {
    let list = products;
    if (prodCategoryFilter !== 'all') list = list.filter(p => p.categoryId === prodCategoryFilter);
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
    setProdModalOpen(true);
  };
  const openEditProduct = (p: PricingProduct) => {
    setProdEditId(p.id);
    setProdForm({
      categoryId: p.categoryId, name: p.name, aliases: p.aliases,
      defaultQuantity: p.defaultQuantity, defaultMaterialId: p.defaultMaterialId,
      defaultMaterialName: p.defaultMaterialName,
      defaultFinalSize: p.defaultFinalSize, defaultFinalWidth: p.defaultFinalWidth,
      defaultFinalHeight: p.defaultFinalHeight, defaultEquipmentId: p.defaultEquipmentId,
      defaultEquipmentName: p.defaultEquipmentName, defaultColor: p.defaultColor,
      defaultSides: p.defaultSides, defaultFolding: p.defaultFolding, isTemplate: p.isTemplate,
    });
    setProdAliasesStr(p.aliases.join(', '));
    setProdModalOpen(true);
  };
  const handleSaveProduct = () => {
    const data = { ...prodForm, aliases: prodAliasesStr.split(',').map(s => s.trim()).filter(Boolean) };
    if (prodEditId) updateProduct(prodEditId, data);
    else addProduct(data);
    setProdModalOpen(false);
  };
  const handleDeleteProduct = (id: string) => { deleteProduct(id); setProdDeleteConfirm(null); };

  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Catalog"
        subtitle="Manage product categories and product definitions"
        actions={
          subTab === 'categories' ? (
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddCategory}>Add Category</Button>
          ) : (
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddProduct}>Add Product</Button>
          )
        }
      />

      {/* Sub-tabs + Search */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-2.5 flex-wrap">
          <div className="flex border border-gray-200 rounded-lg p-0.5">
            {SUBTABS.map(st => (
              <button key={st.id} onClick={() => { setSubTab(st.id); setSearch(''); }}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${subTab === st.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {st.id === 'categories' ? <Layers className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                {st.label} ({st.id === 'categories' ? categories.length : products.length})
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${subTab}...`}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          {subTab === 'products' && (
            <select value={prodCategoryFilter} onChange={e => setProdCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
          <Table headers={['Name', 'Category', 'Aliases', 'Size', 'Paper', 'Equipment', 'Color', 'Sides', '', 'Actions']}>
            {filteredProducts.map(prod => (
              <tr key={prod.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEditProduct(prod)}>
                <td className="py-2.5 px-4 font-medium text-sm text-gray-900">{prod.name}</td>
                <td className="py-2.5 px-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{getCategoryName(prod.categoryId)}</span></td>
                <td className="py-2.5 px-4 text-gray-500 text-xs max-w-[140px] truncate">{prod.aliases.length > 0 ? prod.aliases.join(', ') : '--'}</td>
                <td className="py-2.5 px-4 text-gray-600 text-xs">{prod.defaultFinalSize || '--'}</td>
                <td className="py-2.5 px-4 text-gray-500 text-xs max-w-[120px] truncate">{prod.defaultMaterialName || '--'}</td>
                <td className="py-2.5 px-4 text-gray-500 text-xs">{prod.defaultEquipmentName || '--'}</td>
                <td className="py-2.5 px-4 text-gray-600 text-xs">{prod.defaultColor}</td>
                <td className="py-2.5 px-4 text-gray-600 text-xs">{prod.defaultSides}</td>
                <td className="py-2.5 px-4" onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleProductTemplate(prod.id)} className="p-1 rounded transition-colors hover:bg-yellow-50">
                    <Star className={`w-3.5 h-3.5 ${prod.isTemplate ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                </td>
                <td className="py-2.5 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
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
              <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-400">No products found</td></tr>
            )}
          </Table>
        </Card>
      )}

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
      <Modal isOpen={prodModalOpen} onClose={() => setProdModalOpen(false)} title={prodEditId ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Product Name" value={prodForm.name} onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Business Cards" />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
              <select value={prodForm.categoryId} onChange={e => setProdForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <Input label="Aliases (comma-separated)" value={prodAliasesStr}
            onChange={e => setProdAliasesStr(e.target.value)}
            placeholder="e.g. BCARD, BC, Presentation Cards" />
          <div className="grid grid-cols-4 gap-3">
            <Input label="Default Qty" type="number" value={prodForm.defaultQuantity}
              onChange={e => setProdForm(f => ({ ...f, defaultQuantity: parseInt(e.target.value) || 0 }))} />
            <Input label="Final Size" value={prodForm.defaultFinalSize}
              onChange={e => {
                const val = e.target.value;
                const match = val.match(/^(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)$/);
                setProdForm(f => ({
                  ...f, defaultFinalSize: val,
                  ...(match ? { defaultFinalWidth: parseFloat(match[1]), defaultFinalHeight: parseFloat(match[2]) } : {}),
                }));
              }}
              placeholder="e.g. 3.5x2" />
            <Input label="Width (in)" type="number" value={prodForm.defaultFinalWidth || ''}
              onChange={e => setProdForm(f => ({ ...f, defaultFinalWidth: parseFloat(e.target.value) || 0 }))} />
            <Input label="Height (in)" type="number" value={prodForm.defaultFinalHeight || ''}
              onChange={e => setProdForm(f => ({ ...f, defaultFinalHeight: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Default Paper" value={prodForm.defaultMaterialName || ''}
              onChange={e => setProdForm(f => ({ ...f, defaultMaterialName: e.target.value }))}
              placeholder="e.g. 120lb Cougar Cover" />
            <Input label="Default Equipment" value={prodForm.defaultEquipmentName || ''}
              onChange={e => setProdForm(f => ({ ...f, defaultEquipmentName: e.target.value }))}
              placeholder="e.g. Ricoh 9200" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color</label>
              <select value={prodForm.defaultColor} onChange={e => setProdForm(f => ({ ...f, defaultColor: e.target.value as any }))}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="Color">Color</option>
                <option value="Black">Black</option>
                <option value="Color & Black">Color & Black</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sides</label>
              <select value={prodForm.defaultSides} onChange={e => setProdForm(f => ({ ...f, defaultSides: e.target.value as any }))}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="Single">Single</option>
                <option value="Double">Double</option>
              </select>
            </div>
            <Input label="Default Folding" value={prodForm.defaultFolding || ''}
              onChange={e => setProdForm(f => ({ ...f, defaultFolding: e.target.value }))}
              placeholder="e.g. Tri-Fold" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setProdModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProduct} disabled={!prodForm.name || !prodForm.categoryId}>
              {prodEditId ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
