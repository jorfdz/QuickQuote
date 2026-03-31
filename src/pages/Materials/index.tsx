import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Plus, Trash2, Edit3, Search, Star, Copy, Settings, X, ChevronDown, ChevronRight, Check, Layers, Package } from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Table, Modal, Input, Checkbox } from '../../components/ui';
import type { PricingMaterial, MaterialGroup } from '../../types/pricing';

const emptyForm = {
  name: '',
  size: '',
  sizeWidth: 0,
  sizeHeight: 0,
  pricePerM: 0,
  markup: 70,
  materialGroupId: '',
  categoryIds: [] as string[],
  productIds: [] as string[],
  isFavorite: false,
  vendorName: '',
  vendorId: '',
  vendorMaterialId: '',
  vendorContactName: '',
  vendorContactTitle: '',
  vendorSalesRep: '',
};

const emptyGroupForm = {
  name: '',
  description: '',
  categoryIds: [] as string[],
};

export const Materials: React.FC = () => {
  const {
    materials, addMaterial, updateMaterial, deleteMaterial, toggleMaterialFavorite,
    materialGroups, addMaterialGroup, updateMaterialGroup, deleteMaterialGroup,
    categories, products,
  } = usePricingStore();

  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filters
  const sizeGroups = Array.from(new Set(materials.map(m => m.size))).sort();
  const [sizeFilter, setSizeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Favorites filter: 'favorites' or 'all'
  const hasFavorites = materials.some(m => m.isFavorite);
  const [favFilter, setFavFilter] = useState<'favorites' | 'all'>(hasFavorites ? 'favorites' : 'all');

  // Material Group management modal
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<string | null>(null);

  // Product & category assignment state
  const [productSearch, setProductSearch] = useState('');
  const [assignmentsCollapsed, setAssignmentsCollapsed] = useState(false);
  const [browseCategoryFilter, setBrowseCategoryFilter] = useState<string>('all');
  const productSearchRef = useRef<HTMLInputElement>(null);

  // Filtered products for the browser panel (search + category filter)
  const browseFilteredProducts = useMemo(() => {
    let result = products;
    const q = productSearch.toLowerCase().trim();
    if (q) {
      result = result.filter(
        p => p.name.toLowerCase().includes(q) ||
             p.aliases.some(a => a.toLowerCase().includes(q))
      );
    }
    if (browseCategoryFilter !== 'all') {
      result = result.filter(p => p.categoryIds.includes(browseCategoryFilter));
    }
    return result;
  }, [products, productSearch, browseCategoryFilter]);

  // Toggle helpers for form arrays
  const toggleFormCategory = useCallback((catId: string) => {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter(id => id !== catId)
        : [...f.categoryIds, catId],
    }));
  }, []);

  const toggleFormProduct = useCallback((prodId: string) => {
    setForm(f => ({
      ...f,
      productIds: f.productIds.includes(prodId)
        ? f.productIds.filter(id => id !== prodId)
        : [...f.productIds, prodId],
    }));
  }, []);

  const removeFormProduct = useCallback((prodId: string) => {
    setForm(f => ({
      ...f,
      productIds: f.productIds.filter(id => id !== prodId),
    }));
  }, []);

  // Derive group IDs matching selected category filter
  const groupIdsForCategory = useMemo(() => {
    if (categoryFilter === 'all') return null;
    return materialGroups
      .filter(g => g.categoryIds.includes(categoryFilter))
      .map(g => g.id);
  }, [categoryFilter, materialGroups]);

  const filtered = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.size.includes(search);
      const matchSize = sizeFilter === 'all' || m.size === sizeFilter;
      const matchGroup = groupFilter === 'all' || m.materialGroupId === groupFilter;
      const matchCategory = !groupIdsForCategory || (m.materialGroupId && groupIdsForCategory.includes(m.materialGroupId));
      const matchFav = favFilter === 'all' || m.isFavorite;
      return matchSearch && matchSize && matchGroup && matchCategory && matchFav;
    });
  }, [materials, search, sizeFilter, groupFilter, groupIdsForCategory, favFilter]);

  const handleOpenNew = () => {
    setForm(emptyForm);
    setProductSearch('');
    setShowNew(true);
  };

  const handleAdd = () => {
    if (!form.name) return;
    const sizeStr = form.size || `${form.sizeWidth}x${form.sizeHeight}`;
    addMaterial({
      name: form.name,
      size: sizeStr,
      sizeWidth: form.sizeWidth,
      sizeHeight: form.sizeHeight,
      pricePerM: form.pricePerM,
      markup: form.markup,
      materialGroupId: form.materialGroupId || undefined,
      categoryIds: form.categoryIds,
      productIds: form.productIds,
      isFavorite: form.isFavorite,
      vendorName: form.vendorName || undefined,
      vendorId: form.vendorId || undefined,
      vendorMaterialId: form.vendorMaterialId || undefined,
      vendorContactName: form.vendorContactName || undefined,
      vendorContactTitle: form.vendorContactTitle || undefined,
      vendorSalesRep: form.vendorSalesRep || undefined,
    });
    setShowNew(false);
    setForm(emptyForm);
  };

  const handleStartEdit = (m: PricingMaterial) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      size: m.size,
      sizeWidth: m.sizeWidth,
      sizeHeight: m.sizeHeight,
      pricePerM: m.pricePerM,
      markup: m.markup,
      materialGroupId: m.materialGroupId || '',
      categoryIds: m.categoryIds || [],
      productIds: m.productIds || [],
      isFavorite: m.isFavorite,
      vendorName: m.vendorName || '',
      vendorId: m.vendorId || '',
      vendorMaterialId: m.vendorMaterialId || '',
      vendorContactName: m.vendorContactName || '',
      vendorContactTitle: m.vendorContactTitle || '',
      vendorSalesRep: m.vendorSalesRep || '',
    });
    setProductSearch('');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const sizeStr = form.size || `${form.sizeWidth}x${form.sizeHeight}`;
    updateMaterial(editingId, {
      name: form.name,
      size: sizeStr,
      sizeWidth: form.sizeWidth,
      sizeHeight: form.sizeHeight,
      pricePerM: form.pricePerM,
      markup: form.markup,
      materialGroupId: form.materialGroupId || undefined,
      categoryIds: form.categoryIds,
      productIds: form.productIds,
      isFavorite: form.isFavorite,
      vendorName: form.vendorName || undefined,
      vendorId: form.vendorId || undefined,
      vendorMaterialId: form.vendorMaterialId || undefined,
      vendorContactName: form.vendorContactName || undefined,
      vendorContactTitle: form.vendorContactTitle || undefined,
      vendorSalesRep: form.vendorSalesRep || undefined,
    });
    setEditingId(null);
  };

  const handleClone = (m: PricingMaterial) => {
    setEditingId(null);
    setForm({
      name: `Clone of ${m.name}`,
      size: m.size,
      sizeWidth: m.sizeWidth,
      sizeHeight: m.sizeHeight,
      pricePerM: m.pricePerM,
      markup: m.markup,
      materialGroupId: m.materialGroupId || '',
      categoryIds: m.categoryIds || [],
      productIds: m.productIds || [],
      isFavorite: m.isFavorite,
      vendorName: m.vendorName || '',
      vendorId: m.vendorId || '',
      vendorMaterialId: m.vendorMaterialId || '',
      vendorContactName: m.vendorContactName || '',
      vendorContactTitle: m.vendorContactTitle || '',
      vendorSalesRep: m.vendorSalesRep || '',
    });
    setShowNew(true);
    setProductSearch('');
  };

  const handleDelete = (id: string) => {
    deleteMaterial(id);
    setDeleteConfirm(null);
  };

  const parseSizeInput = (val: string) => {
    const match = val.match(/^(\d+\.?\d*)\s*[xX\u00d7]\s*(\d+\.?\d*)$/);
    if (match) {
      setForm(f => ({
        ...f,
        size: val,
        sizeWidth: parseFloat(match[1]),
        sizeHeight: parseFloat(match[2]),
      }));
    } else {
      setForm(f => ({ ...f, size: val }));
    }
  };

  const formatCurrency = (n: number) => `$${n.toFixed(2)}`;
  const costPerSheet = (m: PricingMaterial) => m.pricePerM / 1000;
  const sellPerSheet = (m: PricingMaterial) => costPerSheet(m) * (1 + m.markup / 100);

  // ── Material Group management helpers ──
  const handleOpenGroupForm = (group?: MaterialGroup) => {
    if (group) {
      setEditingGroupId(group.id);
      setGroupForm({ name: group.name, description: group.description || '', categoryIds: [...group.categoryIds] });
    } else {
      setEditingGroupId(null);
      setGroupForm(emptyGroupForm);
    }
    setShowGroupForm(true);
  };

  const handleSaveGroup = () => {
    if (!groupForm.name) return;
    if (editingGroupId) {
      updateMaterialGroup(editingGroupId, {
        name: groupForm.name,
        description: groupForm.description || undefined,
        categoryIds: groupForm.categoryIds,
      });
    } else {
      addMaterialGroup({
        name: groupForm.name,
        description: groupForm.description || undefined,
        categoryIds: groupForm.categoryIds,
      });
    }
    setShowGroupForm(false);
    setEditingGroupId(null);
  };

  const handleDeleteGroup = (id: string) => {
    deleteMaterialGroup(id);
    setDeleteGroupConfirm(null);
  };

  const toggleGroupCategory = (catId: string) => {
    setGroupForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter(c => c !== catId)
        : [...f.categoryIds, catId],
    }));
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return '--';
    return materialGroups.find(g => g.id === groupId)?.name || '--';
  };

  return (
    <div>
      <PageHeader
        title="Materials"
        subtitle={`${materials.length} materials in catalog`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={<Settings className="w-4 h-4" />} onClick={() => setShowGroupManager(true)}>
              Material Groups
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenNew}>
              Add Material
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search materials by name or size..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={sizeFilter}
            onChange={e => setSizeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sizes</option>
            {sizeGroups.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Groups</option>
            {materialGroups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => setFavFilter(f => f === 'favorites' ? 'all' : 'favorites')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
              favFilter === 'favorites'
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favFilter === 'favorites' ? 'fill-amber-400 text-amber-400' : ''}`} />
            {favFilter === 'favorites' ? 'Favorites' : 'All'}
          </button>
          <span className="text-xs text-gray-400">{filtered.length} results</span>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table headers={['', 'Material Name', 'Group', 'Sheet Size', 'W', 'H', 'Price/M', 'Cost/Sheet', 'Markup %', 'Sell/Sheet', 'Actions']}>
          {filtered.map(m => (
            <tr
              key={m.id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleStartEdit(m)}
            >
              <td className="py-3 px-2 w-8" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => toggleMaterialFavorite(m.id)}
                  className="p-1 hover:bg-amber-50 rounded transition-colors"
                  title={m.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-4 h-4 ${m.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                </button>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm font-semibold text-gray-900">{m.name}</p>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">{getGroupName(m.materialGroupId)}</td>
              <td className="py-3 px-4 text-sm text-gray-600 font-medium">{m.size}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{m.sizeWidth}"</td>
              <td className="py-3 px-4 text-sm text-gray-500">{m.sizeHeight}"</td>
              <td className="py-3 px-4 text-sm text-gray-700 font-medium">{formatCurrency(m.pricePerM)}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{formatCurrency(costPerSheet(m))}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{m.markup}%</td>
              <td className="py-3 px-4 text-sm font-bold text-blue-700">{formatCurrency(sellPerSheet(m))}</td>
              <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                <div className="flex gap-1">
                  <button onClick={() => handleStartEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleClone(m)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Clone">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {deleteConfirm === m.id ? (
                    <div className="flex gap-1 items-center">
                      <button onClick={() => handleDelete(m.id)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                      <button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No materials found</p>
          </div>
        )}
        {favFilter === 'favorites' && filtered.length > 0 && (
          <div className="text-center py-3 border-t border-gray-100">
            <button
              onClick={() => setFavFilter('all')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Materials ({materials.length})
            </button>
          </div>
        )}
      </Card>

      {/* Add / Edit Material Modal */}
      <Modal isOpen={showNew || editingId !== null} onClose={() => { setShowNew(false); setEditingId(null); }}
        title={editingId ? 'Edit Material' : 'Add Material'} size="full">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-[3]">
              <Input label="Material Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 100lb Gloss Cover" />
            </div>
            <div className="flex-[1]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Material Group</label>
              <select
                value={form.materialGroupId}
                onChange={e => setForm(f => ({ ...f, materialGroupId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {materialGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="pt-5">
              <button
                onClick={() => setForm(f => ({ ...f, isFavorite: !f.isFavorite }))}
                className={`p-2 rounded-lg border transition-colors ${
                  form.isFavorite
                    ? 'bg-amber-50 border-amber-300 text-amber-500'
                    : 'border-gray-200 text-gray-300 hover:text-amber-300 hover:border-amber-200'
                }`}
                title={form.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-5 h-5 ${form.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </div>
          </div>
          {/* ── Product & Category Assignments (collapsible) ── */}
          {(() => {
            const totalSelected = form.categoryIds.length + form.productIds.length;
            return (
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setAssignmentsCollapsed(c => !c)}
                  className="w-full flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    {assignmentsCollapsed
                      ? <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />}
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product &amp; Category Assignments</h3>
                  </div>
                  {totalSelected > 0 && (
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {totalSelected} selected
                    </span>
                  )}
                </button>

                {/* Collapsed summary */}
                {assignmentsCollapsed && totalSelected > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pl-6">
                    {form.categoryIds.map(cid => {
                      const cat = categories.find(c => c.id === cid);
                      if (!cat) return null;
                      return (
                        <span key={`cat-${cid}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-medium">
                          <Layers className="w-2.5 h-2.5" />
                          {cat.name}
                        </span>
                      );
                    })}
                    {form.productIds.map(pid => {
                      const prod = products.find(p => p.id === pid);
                      if (!prod) return null;
                      return (
                        <span key={`prod-${pid}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium">
                          <Package className="w-2.5 h-2.5" />
                          {prod.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Expanded assignments panel */}
                {!assignmentsCollapsed && (
                  <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Two-column layout: left = browser, right = selected */}
                    <div className="flex" style={{ minHeight: '320px' }}>

                      {/* Left panel — browse & search */}
                      <div className="flex-1 border-r border-gray-200 flex flex-col">
                        {/* Search + category filter bar */}
                        <div className="p-3 border-b border-gray-100 space-y-2 bg-gray-50/50">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              ref={productSearchRef}
                              value={productSearch}
                              onChange={e => setProductSearch(e.target.value)}
                              placeholder="Search products by name or alias..."
                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-400 mr-1">Filter:</span>
                            <button
                              type="button"
                              onClick={() => setBrowseCategoryFilter('all')}
                              className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                                browseCategoryFilter === 'all'
                                  ? 'bg-gray-800 text-white border-gray-800'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
                              }`}
                            >
                              All
                            </button>
                            {categories.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setBrowseCategoryFilter(f => f === c.id ? 'all' : c.id)}
                                className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                                  browseCategoryFilter === c.id
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600'
                                }`}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Browsable list: categories as headers, products beneath */}
                        <div className="flex-1 overflow-y-auto">
                          {categories
                            .filter(c => browseCategoryFilter === 'all' || browseCategoryFilter === c.id)
                            .map(cat => {
                              const catProducts = browseFilteredProducts.filter(p => p.categoryIds.includes(cat.id));
                              if (catProducts.length === 0 && !productSearch) return null;
                              if (catProducts.length === 0) return null;
                              const allCatProductIds = products.filter(p => p.categoryIds.includes(cat.id)).map(p => p.id);
                              const allCatSelected = allCatProductIds.length > 0 && allCatProductIds.every(id => form.productIds.includes(id));
                              const someCatSelected = allCatProductIds.some(id => form.productIds.includes(id));
                              const isCategorySelected = form.categoryIds.includes(cat.id);
                              return (
                                <div key={cat.id}>
                                  {/* Category row */}
                                  <div className="sticky top-0 bg-gray-50 border-b border-gray-100 px-3 py-2 flex items-center gap-2 z-10">
                                    <button
                                      type="button"
                                      onClick={() => toggleFormCategory(cat.id)}
                                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isCategorySelected
                                          ? 'bg-purple-600 border-purple-600'
                                          : 'border-gray-300 hover:border-purple-400'
                                      }`}
                                      title={isCategorySelected ? 'Remove entire category' : 'Select entire category'}
                                    >
                                      {isCategorySelected && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                    <Layers className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-purple-700 flex-1">{cat.name}</span>
                                    {cat.description && (
                                      <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{cat.description}</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (allCatSelected) {
                                          setForm(f => ({ ...f, productIds: f.productIds.filter(id => !allCatProductIds.includes(id)) }));
                                        } else {
                                          setForm(f => ({ ...f, productIds: [...new Set([...f.productIds, ...allCatProductIds])] }));
                                        }
                                      }}
                                      className="text-[10px] text-purple-500 hover:text-purple-700 font-medium whitespace-nowrap"
                                    >
                                      {allCatSelected ? 'Deselect all' : someCatSelected ? 'Select rest' : 'Select all'}
                                    </button>
                                  </div>
                                  {/* Products in this category */}
                                  {catProducts.map(p => {
                                    const isSelected = form.productIds.includes(p.id);
                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => toggleFormProduct(p.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-gray-50 ${
                                          isSelected ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                        }`}>
                                          {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <Package className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className={`text-sm ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800 font-medium'}`}>
                                              {p.name}
                                            </p>
                                            {p.aliases.length > 0 && (
                                              <span className="text-[10px] text-gray-400 font-mono">{p.aliases[0]}</span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-gray-400 truncate">
                                            {[
                                              p.defaultFinalSize && `Size: ${p.defaultFinalSize}`,
                                              p.defaultColor,
                                              p.defaultSides && `${p.defaultSides}-sided`,
                                              p.defaultEquipmentName && `on ${p.defaultEquipmentName}`,
                                            ].filter(Boolean).join(' · ')}
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          {/* Products with no category */}
                          {(() => {
                            const uncategorized = browseFilteredProducts.filter(p => p.categoryIds.length === 0);
                            if (uncategorized.length === 0) return null;
                            return (
                              <div>
                                <div className="sticky top-0 bg-gray-50 border-b border-gray-100 px-3 py-2 flex items-center gap-2 z-10">
                                  <Layers className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span className="text-xs font-semibold text-gray-500">Uncategorized</span>
                                </div>
                                {uncategorized.map(p => {
                                  const isSelected = form.productIds.includes(p.id);
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => toggleFormProduct(p.id)}
                                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-gray-50 ${
                                        isSelected ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                      }`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                      </div>
                                      <Package className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className={`text-sm ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800 font-medium'}`}>
                                            {p.name}
                                          </p>
                                          {p.aliases.length > 0 && (
                                            <span className="text-[10px] text-gray-400 font-mono">{p.aliases[0]}</span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 truncate">
                                          {[
                                            p.defaultFinalSize && `Size: ${p.defaultFinalSize}`,
                                            p.defaultColor,
                                            p.defaultSides && `${p.defaultSides}-sided`,
                                            p.defaultEquipmentName && `on ${p.defaultEquipmentName}`,
                                          ].filter(Boolean).join(' · ')}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                          {browseFilteredProducts.length === 0 && (
                            <div className="px-3 py-8 text-center text-xs text-gray-400">
                              {productSearch ? `No products match "${productSearch}"` : 'No products available'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right panel — selected items summary */}
                      <div className="w-64 flex flex-col bg-gray-50/30">
                        <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selected</span>
                          {totalSelected > 0 && (
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, categoryIds: [], productIds: [] }))}
                              className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors"
                            >
                              Clear all
                            </button>
                          )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                          {totalSelected === 0 ? (
                            <div className="text-center py-8 text-xs text-gray-400">
                              <p>No items selected</p>
                              <p className="mt-1 text-[10px]">Browse or search to add</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {form.categoryIds.map(cid => {
                                const cat = categories.find(c => c.id === cid);
                                if (!cat) return null;
                                return (
                                  <div key={`sel-cat-${cid}`} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-purple-50 group">
                                    <Layers className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                    <span className="text-xs font-medium text-purple-700 flex-1 truncate">{cat.name}</span>
                                    <span className="text-[9px] text-purple-400 uppercase mr-1">Cat</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleFormCategory(cid)}
                                      className="p-0.5 rounded hover:bg-purple-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3 text-purple-500" />
                                    </button>
                                  </div>
                                );
                              })}
                              {form.productIds.map(pid => {
                                const prod = products.find(p => p.id === pid);
                                if (!prod) return null;
                                return (
                                  <div key={`sel-prod-${pid}`} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50 group">
                                    <Package className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                    <span className="text-xs font-medium text-blue-700 flex-1 truncate">{prod.name}</span>
                                    {prod.aliases.length > 0 && (
                                      <span className="text-[9px] text-blue-400 font-mono mr-1">{prod.aliases[0]}</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeFormProduct(pid)}
                                      className="p-0.5 rounded hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3 text-blue-500" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sheet Size</label>
              <input value={form.size} onChange={e => parseSizeInput(e.target.value)}
                placeholder="e.g. 13x19"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-[10px] text-gray-400 mt-1">Type "13x19" to auto-fill W/H</p>
            </div>
            <Input label="Width (in)" type="number" value={form.sizeWidth || ''} onChange={e => setForm(f => ({ ...f, sizeWidth: parseFloat(e.target.value) || 0 }))} />
            <Input label="Height (in)" type="number" value={form.sizeHeight || ''} onChange={e => setForm(f => ({ ...f, sizeHeight: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price per M (per 1,000 sheets)" type="number" value={form.pricePerM || ''} onChange={e => setForm(f => ({ ...f, pricePerM: parseFloat(e.target.value) || 0 }))} prefix="$" />
            <Input label="Markup %" type="number" value={form.markup} onChange={e => setForm(f => ({ ...f, markup: parseFloat(e.target.value) || 0 }))} suffix="%" />
          </div>
          {form.pricePerM > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Cost/sheet:</span><span className="font-medium">{formatCurrency(form.pricePerM / 1000)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sell/sheet:</span><span className="font-bold text-blue-700">{formatCurrency((form.pricePerM / 1000) * (1 + form.markup / 100))}</span></div>
            </div>
          )}

          {/* Vendor Information */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vendor Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Vendor Name" value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                  placeholder="e.g. Grimco Inc" />
                <Input label="Vendor ID" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
                  placeholder="e.g. V-10042" />
                <Input label="Vendor Material ID" value={form.vendorMaterialId} onChange={e => setForm(f => ({ ...f, vendorMaterialId: e.target.value }))}
                  placeholder="e.g. MAT-55810" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Primary Contact Name" value={form.vendorContactName} onChange={e => setForm(f => ({ ...f, vendorContactName: e.target.value }))}
                  placeholder="e.g. Jane Smith" />
                <Input label="Contact Title" value={form.vendorContactTitle} onChange={e => setForm(f => ({ ...f, vendorContactTitle: e.target.value }))}
                  placeholder="e.g. Account Director" />
                <Input label="Sales Rep / Account Manager" value={form.vendorSalesRep} onChange={e => setForm(f => ({ ...f, vendorSalesRep: e.target.value }))}
                  placeholder="e.g. John Doe" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => { setShowNew(false); setEditingId(null); }}>Cancel</Button>
            <Button variant="primary" onClick={editingId ? handleSaveEdit : handleAdd} disabled={!form.name || form.sizeWidth <= 0 || form.sizeHeight <= 0}>
              {editingId ? 'Save Changes' : 'Add Material'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Material Groups Manager Modal */}
      <Modal isOpen={showGroupManager} onClose={() => { setShowGroupManager(false); setShowGroupForm(false); }}
        title="Manage Material Groups" size="lg">
        <div className="space-y-4">
          {/* Group list */}
          {!showGroupForm && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{materialGroups.length} material groups</p>
                <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => handleOpenGroupForm()}>
                  Add Group
                </Button>
              </div>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {materialGroups.map(g => (
                  <div key={g.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{g.name}</p>
                      {g.description && <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>}
                      {g.categoryIds.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {g.categoryIds.map(cid => {
                            const cat = categories.find(c => c.id === cid);
                            return cat ? (
                              <span key={cid} className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium">{cat.name}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {deleteGroupConfirm === g.id ? (
                        <div className="flex gap-1 items-center">
                          <button onClick={() => handleDeleteGroup(g.id)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                          <button onClick={() => setDeleteGroupConfirm(null)} className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => handleOpenGroupForm(g)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteGroupConfirm(g.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {materialGroups.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No material groups yet</div>
                )}
              </div>
            </>
          )}

          {/* Group add/edit form */}
          {showGroupForm && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{editingGroupId ? 'Edit Group' : 'New Group'}</h3>
                <button onClick={() => { setShowGroupForm(false); setEditingGroupId(null); }} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <Input label="Group Name" value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Digital Press Papers" />
              <Input label="Description" value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description" />
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category Assignments</label>
                <div className="space-y-2">
                  {categories.map(c => (
                    <Checkbox
                      key={c.id}
                      checked={groupForm.categoryIds.includes(c.id)}
                      onChange={() => toggleGroupCategory(c.id)}
                      label={c.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" size="sm" onClick={() => { setShowGroupForm(false); setEditingGroupId(null); }}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleSaveGroup} disabled={!groupForm.name}>
                  {editingGroupId ? 'Save Changes' : 'Add Group'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
