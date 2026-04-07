import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit3, Search, Star, Copy, Settings, X, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Check, Layers, Package, ArrowUpDown, Clock, ArrowRight, ImageIcon, User, Truck, FlaskConical, Info } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Modal, Input, Checkbox } from '../../components/ui';

import type { PricingMaterial, MaterialGroup, MaterialChangeRecord, MaterialType, MaterialPricingModel, MaterialMarkupType } from '../../types/pricing';
import { MATERIAL_TYPE_LABELS, PRICING_MODEL_LABELS, MATERIAL_TYPE_PRICING_MODELS } from '../../types/pricing';
import { getUnitCost, getUnitLabel, getUnitSell, getOrderSell, deriveRollCostPerSqft, getTierCost } from '../../utils/materialCost';

// ─── Sort / Pagination types ────────────────────────────────────────────────

type SortColumn = 'name' | 'materialType' | 'group' | 'size' | 'sizeWidth' | 'sizeHeight' | 'unitCost' | 'markup' | 'unitSell' | 'vendor';
type SortDir = 'asc' | 'desc';
type PageSize = 50 | 100 | 200;

const Tip: React.FC<{ label: string; tip: string }> = ({ label, tip }) => (
  <span className="inline-flex items-center gap-1 group relative">
    <span>{label}</span>
    <Info className="w-3 h-3 text-gray-400" />
    <span className="invisible group-hover:visible absolute bottom-full left-0 mb-1 w-56 p-2 text-[10px] bg-gray-900 text-white rounded-lg shadow-lg z-10">
      {tip}
    </span>
  </span>
);

const emptyForm = {
  materialType: 'paper' as MaterialType,
  name: '',
  size: '',
  sizeWidth: 0,
  sizeHeight: 0,
  pricingModel: 'cost_per_m' as MaterialPricingModel,
  pricePerM: 0,
  costPerUnit: 0,
  costPerSqft: 0,
  rollCost: 0,
  rollLength: 0,
  pricingTiers: [] as { minQty: number; costPerUnit: number }[],
  minimumCharge: 0,
  markupType: 'percent' as 'percent' | 'fixed' | 'global_flat' | 'global_percent',
  markup: 70,
  materialGroupIds: [] as string[],
  categoryIds: [] as string[],
  productIds: [] as string[],
  favoriteProductIds: [] as string[],
  favoriteCategoryIds: [] as string[],
  isFavorite: false,
  imageUrl: '' as string | undefined,
  description: '',
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
  const [searchParams] = useSearchParams();
  const {
    materials, addMaterial, updateMaterial, deleteMaterial, toggleMaterialFavorite,
    materialGroups, addMaterialGroup, updateMaterialGroup, deleteMaterialGroup,
    categories, products,
    getMaterialHistory, clearMaterialHistory,
  } = usePricingStore();

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filters
  const sizeGroups = Array.from(new Set(materials.map(m => m.size).filter(Boolean))).sort();
  const [sizeFilter, setSizeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<MaterialType | 'all'>('all');

  // Vendor filter
  const vendorNames = useMemo(() =>
    Array.from(new Set(materials.map(m => m.vendorName).filter(Boolean) as string[])).sort(),
  [materials]);
  const [vendorFilter, setVendorFilter] = useState('all');

  // Favorites filter: 'favorites' or 'all'
  const hasFavorites = materials.some(m => m.isFavorite);
  const [favFilter, setFavFilter] = useState<'favorites' | 'all'>(hasFavorites ? 'favorites' : 'all');

  // Sorting
  const [sortCol, setSortCol] = useState<SortColumn | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Pagination
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Material Group management modal
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<string | null>(null);

  // Modal tab state: 'details' or 'history'
  const [modalTab, setModalTab] = useState<'details' | 'vendor' | 'photos' | 'history'>('details');

  // Test pricing state
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testQty, setTestQty] = useState(1000);

  // Product & category assignment state
  const [productSearch, setProductSearch] = useState('');
  const [assignmentsCollapsed, setAssignmentsCollapsed] = useState(false);
  const [costConfigCollapsed, setCostConfigCollapsed] = useState(false);
  const [browseCategoryFilter, setBrowseCategoryFilter] = useState<string>('all');
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);

  // Close material groups dropdown on outside click
  useEffect(() => {
    if (!groupDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target as Node)) {
        setGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [groupDropdownOpen]);

  // Filtered categories for the browser panel (search matching)
  const browseFilteredCategories = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, productSearch]);

  // Filtered products for the browser panel (search + category filter)
  const browseFilteredProducts = useMemo(() => {
    let result = products;
    const q = productSearch.toLowerCase().trim();
    if (q) {
      // Include products that match by name/alias OR belong to a matching category
      const matchingCatIds = browseFilteredCategories.map(c => c.id);
      result = result.filter(
        p => p.name.toLowerCase().includes(q) ||
             p.aliases.some(a => a.toLowerCase().includes(q)) ||
             p.categoryIds.some(cid => matchingCatIds.includes(cid))
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
      favoriteCategoryIds: f.categoryIds.includes(catId)
        ? f.favoriteCategoryIds.filter(id => id !== catId)
        : f.favoriteCategoryIds,
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
      favoriteProductIds: f.favoriteProductIds.filter(id => id !== prodId),
    }));
  }, []);

  const toggleProductFavorite = useCallback((prodId: string) => {
    setForm(f => ({
      ...f,
      favoriteProductIds: f.favoriteProductIds.includes(prodId)
        ? f.favoriteProductIds.filter(id => id !== prodId)
        : [...f.favoriteProductIds, prodId],
    }));
  }, []);

  const toggleCategoryFavorite = useCallback((catId: string) => {
    setForm(f => ({
      ...f,
      favoriteCategoryIds: f.favoriteCategoryIds.includes(catId)
        ? f.favoriteCategoryIds.filter(id => id !== catId)
        : [...f.favoriteCategoryIds, catId],
    }));
  }, []);

  const getGroupNames = (groupIds?: string[]) => {
    if (!groupIds || groupIds.length === 0) return '--';
    const names = groupIds.map(gid => materialGroups.find(g => g.id === gid)?.name).filter(Boolean);
    return names.length > 0 ? names.join(', ') : '--';
  };

  // Derive group IDs matching selected category filter
  const groupIdsForCategory = useMemo(() => {
    if (categoryFilter === 'all') return null;
    return materialGroups
      .filter(g => g.categoryIds.includes(categoryFilter))
      .map(g => g.id);
  }, [categoryFilter, materialGroups]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return materials.filter(m => {
      const matchSearch = !search
        || m.name.toLowerCase().includes(q)
        || (m.size && m.size.toLowerCase().includes(q))
        || (m.vendorName && m.vendorName.toLowerCase().includes(q))
        || (m.vendorId && m.vendorId.toLowerCase().includes(q))
        || (m.vendorMaterialId && m.vendorMaterialId.toLowerCase().includes(q))
        || (m.vendorContactName && m.vendorContactName.toLowerCase().includes(q))
        || (m.vendorSalesRep && m.vendorSalesRep.toLowerCase().includes(q))
        || (MATERIAL_TYPE_LABELS[m.materialType] || '').toLowerCase().includes(q);
      const matchSize = sizeFilter === 'all' || m.size === sizeFilter;
      const matchGroup = groupFilter === 'all' || (m.materialGroupIds && m.materialGroupIds.includes(groupFilter));
      const matchCategory = !groupIdsForCategory || (m.materialGroupIds && m.materialGroupIds.some(gid => groupIdsForCategory.includes(gid)));
      const matchVendor = vendorFilter === 'all' || m.vendorName === vendorFilter;
      const matchFav = favFilter === 'all' || m.isFavorite;
      const matchType = typeFilter === 'all' || (m.materialType || 'paper') === typeFilter;
      return matchSearch && matchSize && matchGroup && matchCategory && matchVendor && matchFav && matchType;
    });
  }, [materials, search, sizeFilter, groupFilter, groupIdsForCategory, vendorFilter, favFilter, typeFilter]);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'name':         cmp = a.name.localeCompare(b.name); break;
        case 'materialType': cmp = (a.materialType || 'paper').localeCompare(b.materialType || 'paper'); break;
        case 'group':        cmp = (getGroupNames(a.materialGroupIds)).localeCompare(getGroupNames(b.materialGroupIds)); break;
        case 'size':         cmp = (a.size || '').localeCompare(b.size || ''); break;
        case 'sizeWidth':    cmp = a.sizeWidth - b.sizeWidth; break;
        case 'sizeHeight':   cmp = a.sizeHeight - b.sizeHeight; break;
        case 'unitCost':     cmp = getUnitCost(a) - getUnitCost(b); break;
        case 'markup':       cmp = a.markup - b.markup; break;
        case 'unitSell':     cmp = getUnitSell(a) - getUnitSell(b); break;
        case 'vendor':       cmp = (a.vendorName || '').localeCompare(b.vendorName || ''); break;
      }
      return cmp * dir;
    });
  }, [filtered, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  // Reset to page 1 when filters / sort change
  const prevFilterKey = useRef('');
  const filterKey = `${search}|${sizeFilter}|${groupFilter}|${categoryFilter}|${vendorFilter}|${favFilter}|${typeFilter}|${sortCol}|${sortDir}|${pageSize}`;
  if (filterKey !== prevFilterKey.current) {
    prevFilterKey.current = filterKey;
    if (currentPage !== 1) setCurrentPage(1);
  }

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const SortIcon: React.FC<{ col: SortColumn }> = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1 inline-block" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-600 ml-1 inline-block" />
      : <ChevronDown className="w-3 h-3 text-blue-600 ml-1 inline-block" />;
  };

  const PaginationBar: React.FC = () => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value) as PageSize)}
          className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </div>
      <span className="text-xs text-gray-500">
        {sorted.length === 0 ? '0 of 0' : `${(safePage - 1) * pageSize + 1}\u2013${Math.min(safePage * pageSize, sorted.length)} of ${sorted.length}`}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => setCurrentPage(1)} disabled={safePage <= 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="First page">
          <ChevronsLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Previous page">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-xs text-gray-600 font-medium px-2">Page {safePage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Next page">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Last page">
          <ChevronsRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );

  const handleOpenNew = () => {
    setForm(emptyForm);
    setProductSearch('');
    setModalTab('details');
    setShowNew(true);
  };

  const handleAdd = () => {
    if (!form.name) return;
    const sizeStr = form.materialType === 'blanks' ? '' :
      form.materialType === 'roll_media' ? `${form.sizeWidth}` :
      form.size || `${form.sizeWidth}x${form.sizeHeight}`;
    addMaterial({
      materialType: form.materialType,
      name: form.name,
      size: sizeStr,
      sizeWidth: form.sizeWidth,
      sizeHeight: form.sizeHeight,
      pricingModel: form.pricingModel,
      pricePerM: form.pricePerM,
      costPerUnit: form.costPerUnit || undefined,
      costPerSqft: form.costPerSqft || undefined,
      rollCost: form.rollCost || undefined,
      rollLength: form.rollLength || undefined,
      pricingTiers: form.pricingTiers,
      minimumCharge: form.minimumCharge,
      markupType: form.markupType,
      markup: form.markup,
      materialGroupIds: form.materialGroupIds,
      categoryIds: form.categoryIds,
      productIds: form.productIds,
      favoriteProductIds: form.favoriteProductIds,
      favoriteCategoryIds: form.favoriteCategoryIds,
      isFavorite: form.isFavorite,
      imageUrl: form.imageUrl || undefined,
      description: form.description || undefined,
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
      materialType: m.materialType || 'paper',
      name: m.name,
      size: m.size,
      sizeWidth: m.sizeWidth,
      sizeHeight: m.sizeHeight,
      pricingModel: m.pricingModel || 'cost_per_m',
      pricePerM: m.pricePerM,
      costPerUnit: m.costPerUnit || 0,
      costPerSqft: m.costPerSqft || 0,
      rollCost: m.rollCost || 0,
      rollLength: m.rollLength || 0,
      pricingTiers: m.pricingTiers || [],
      minimumCharge: m.minimumCharge || 0,
      markupType: m.markupType || 'percent',
      markup: m.markup,
      materialGroupIds: m.materialGroupIds || [],
      categoryIds: m.categoryIds || [],
      productIds: m.productIds || [],
      favoriteProductIds: m.favoriteProductIds || [],
      favoriteCategoryIds: m.favoriteCategoryIds || [],
      isFavorite: m.isFavorite,
      imageUrl: m.imageUrl || '',
      description: m.description || '',
      vendorName: m.vendorName || '',
      vendorId: m.vendorId || '',
      vendorMaterialId: m.vendorMaterialId || '',
      vendorContactName: m.vendorContactName || '',
      vendorContactTitle: m.vendorContactTitle || '',
      vendorSalesRep: m.vendorSalesRep || '',
    });
    setProductSearch('');
    setModalTab('details');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const sizeStr = form.materialType === 'blanks' ? '' :
      form.materialType === 'roll_media' ? `${form.sizeWidth}` :
      form.size || `${form.sizeWidth}x${form.sizeHeight}`;
    updateMaterial(editingId, {
      materialType: form.materialType,
      name: form.name,
      size: sizeStr,
      sizeWidth: form.sizeWidth,
      sizeHeight: form.sizeHeight,
      pricingModel: form.pricingModel,
      pricePerM: form.pricePerM,
      costPerUnit: form.costPerUnit || undefined,
      costPerSqft: form.costPerSqft || undefined,
      rollCost: form.rollCost || undefined,
      rollLength: form.rollLength || undefined,
      pricingTiers: form.pricingTiers,
      minimumCharge: form.minimumCharge,
      markupType: form.markupType,
      markup: form.markup,
      materialGroupIds: form.materialGroupIds,
      categoryIds: form.categoryIds,
      productIds: form.productIds,
      favoriteProductIds: form.favoriteProductIds,
      favoriteCategoryIds: form.favoriteCategoryIds,
      isFavorite: form.isFavorite,
      imageUrl: form.imageUrl || undefined,
      description: form.description || undefined,
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
      materialType: m.materialType || 'paper',
      name: `Clone of ${m.name}`,
      size: m.size,
      sizeWidth: m.sizeWidth,
      sizeHeight: m.sizeHeight,
      pricingModel: m.pricingModel || 'cost_per_m',
      pricePerM: m.pricePerM,
      costPerUnit: m.costPerUnit || 0,
      costPerSqft: m.costPerSqft || 0,
      rollCost: m.rollCost || 0,
      rollLength: m.rollLength || 0,
      pricingTiers: m.pricingTiers || [],
      minimumCharge: m.minimumCharge || 0,
      markupType: m.markupType || 'percent',
      markup: m.markup,
      materialGroupIds: m.materialGroupIds || [],
      categoryIds: m.categoryIds || [],
      productIds: m.productIds || [],
      favoriteProductIds: m.favoriteProductIds || [],
      favoriteCategoryIds: m.favoriteCategoryIds || [],
      isFavorite: m.isFavorite,
      imageUrl: m.imageUrl || '',
      description: m.description || '',
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


  const formatCurrency = (n: number) => `$${n.toFixed(2)}`;

  // ── Change History helpers ──
  const formatChangeValue = useCallback((field: string, value: unknown): string => {
    if (value === null || value === undefined || value === '') return '(empty)';
    if (Array.isArray(value)) {
      if (value.length === 0) return '(none)';
      if (field === 'categoryIds' || field === 'favoriteCategoryIds') {
        return value.map(id => categories.find(c => c.id === id)?.name || id).join(', ');
      }
      if (field === 'productIds' || field === 'favoriteProductIds') {
        return value.map(id => products.find(p => p.id === id)?.name || id).join(', ');
      }
      return value.join(', ');
    }
    if (field === 'materialGroupIds') {
      return (value as string[]).map(id => materialGroups.find(g => g.id === id)?.name || id).join(', ');
    }
    if (field === 'materialType') return MATERIAL_TYPE_LABELS[value as MaterialType] || String(value);
    if (field === 'pricingModel') return PRICING_MODEL_LABELS[value as MaterialPricingModel] || String(value);
    if (field === 'markupType') return value === 'percent' ? 'Per Unit %' : value === 'fixed' ? 'Per Unit $' : value === 'global_flat' ? 'Flat Total $' : value === 'global_percent' ? 'Global Total %' : String(value);
    if (field === 'pricePerM' || field === 'costPerUnit' || field === 'costPerSqft' || field === 'rollCost' || field === 'minimumCharge') return `$${Number(value).toFixed(2)}`;
    if (field === 'rollLength') return `${value} ft`;
    if (field === 'markup') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }, [categories, products, materialGroups]);

  const formatTimestamp = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const historyRecords = useMemo(() => {
    if (!editingId) return [];
    return getMaterialHistory(editingId);
  }, [editingId, getMaterialHistory]);

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
              placeholder="Search by name, size, vendor..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as MaterialType | 'all')}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {(['paper', 'roll_media', 'rigid_substrate', 'blanks'] as MaterialType[]).map(t => (
              <option key={t} value={t}>{MATERIAL_TYPE_LABELS[t]}</option>
            ))}
          </select>
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
          <select
            value={vendorFilter}
            onChange={e => setVendorFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Vendors</option>
            {vendorNames.map(v => (
              <option key={v} value={v}>{v}</option>
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
          <span className="text-xs text-gray-400">{sorted.length} results</span>
        </div>
      </Card>

      {/* Sortable Table */}
      <Card>
        {sorted.length > 0 && <PaginationBar />}
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap w-8"></th>
                {([
                  ['name',         'Material Name'],
                  ['materialType', 'Type'],
                  ['group',        'Group'],
                  ['vendor',       'Vendor'],
                  ['size',         'Size'],
                  ['unitCost',     'Unit Cost'],
                  ['markup',       'Markup'],
                  ['unitSell',     'Sell Price'],
                ] as [SortColumn, string][]).map(([col, label]) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {label}<SortIcon col={col} />
                  </th>
                ))}
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedRows.map(m => (
                <tr
                  key={m.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleStartEdit(m)}
                >
                  <td className="py-3 px-2 w-8">
                    {(() => {
                      const favCats = (m.favoriteCategoryIds || []).map(id => categories.find(c => c.id === id)).filter(Boolean);
                      const favProds = (m.favoriteProductIds || []).map(id => products.find(p => p.id === id)).filter(Boolean);
                      const hasFavItems = favCats.length > 0 || favProds.length > 0;
                      return (
                        <div className="relative group/fav">
                          <div className="p-1">
                            <Star className={`w-4 h-4 ${hasFavItems ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                          </div>
                          {hasFavItems && (
                            <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/fav:block">
                              <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2.5 text-xs whitespace-nowrap min-w-[200px] max-w-[300px]">
                                {/* Arrow */}
                                <div className="absolute bottom-full left-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-gray-900" />
                                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  Favorite Assignments
                                </p>
                                {favCats.length > 0 && (
                                  <div className={favProds.length > 0 ? 'mb-2 pb-2 border-b border-gray-700' : ''}>
                                    <p className="text-[10px] text-gray-400 font-medium mb-1">Categories ({favCats.length})</p>
                                    {favCats.map(cat => (
                                      <div key={cat!.id} className="flex items-center gap-1.5 py-0.5">
                                        <Layers className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                        <span className="text-gray-100 truncate">{cat!.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {favProds.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-gray-400 font-medium mb-1">Products ({favProds.length})</p>
                                    {favProds.map(prod => (
                                      <div key={prod!.id} className="flex items-center gap-1.5 py-0.5">
                                        <Package className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                        <span className="text-gray-100 truncate">{prod!.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {m.imageUrl ? (
                        <img src={m.imageUrl} alt={m.name} className="w-8 h-8 rounded object-cover flex-shrink-0 border border-gray-200" />
                      ) : null}
                      <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                      (m.materialType || 'paper') === 'paper' ? 'bg-blue-50 text-blue-700' :
                      m.materialType === 'roll_media' ? 'bg-emerald-50 text-emerald-700' :
                      m.materialType === 'rigid_substrate' ? 'bg-orange-50 text-orange-700' :
                      'bg-purple-50 text-purple-700'
                    }`}>
                      {MATERIAL_TYPE_LABELS[m.materialType || 'paper']}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{getGroupNames(m.materialGroupIds)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 truncate max-w-[120px]" title={m.vendorName || '--'}>{m.vendorName || '--'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 font-medium">{m.materialType === 'blanks' ? '--' : m.materialType === 'roll_media' ? `${m.sizeWidth}" wide` : m.size || '--'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">{formatCurrency(getUnitCost(m))}<span className="text-[10px] text-gray-400 ml-0.5">{getUnitLabel(m)}</span></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{m.markupType === 'percent' || !m.markupType ? `${m.markup}%/u` : m.markupType === 'fixed' ? `$${m.markup}/u` : m.markupType === 'global_percent' ? `${m.markup}% total` : `$${m.markup} flat`}</td>
                  <td className="py-3 px-4 text-sm font-bold text-blue-700">
                    {formatCurrency(getUnitSell(m))}<span className="text-[10px] text-gray-400 ml-0.5">{getUnitLabel(m)}</span>
                    {(m.markupType === 'global_flat' || m.markupType === 'global_percent') && <span className="text-[9px] text-amber-500 ml-1" title="Markup is applied on the order total">+total</span>}
                  </td>
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
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No materials found</p>
          </div>
        )}
        {favFilter === 'favorites' && sorted.length > 0 && (
          <div className="text-center py-3 border-t border-gray-100">
            <button
              onClick={() => setFavFilter('all')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Materials ({materials.length})
            </button>
          </div>
        )}

        {sorted.length > 0 && <PaginationBar />}
      </Card>

      {/* Add / Edit Material Modal */}
      <Modal isOpen={showNew || editingId !== null} onClose={() => { setShowNew(false); setEditingId(null); }}
        title={editingId ? 'Edit Material' : 'Add Material'} size="half">
        {/* Tab Bar */}
        <div className="flex border-b border-gray-200 mb-4 -mt-1">
          <button
            type="button"
            onClick={() => setModalTab('details')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              modalTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setModalTab('vendor')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              modalTab === 'vendor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Vendor Info
          </button>
          <button
            type="button"
            onClick={() => setModalTab('photos')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              modalTab === 'photos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Photos
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => setModalTab('history')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                modalTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Change History
              {historyRecords.length > 0 && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  modalTab === 'history' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {historyRecords.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* ── Change History Tab ── */}
        {modalTab === 'history' && editingId && (
          <div className="space-y-3">
            {historyRecords.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">No changes recorded yet</p>
                <p className="text-xs text-gray-300 mt-1">Changes to this material will be tracked here automatically</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{historyRecords.length} change{historyRecords.length !== 1 ? 's' : ''} recorded</p>
                  <button
                    type="button"
                    onClick={() => { if (editingId) clearMaterialHistory(editingId); }}
                    className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors"
                  >
                    Clear history
                  </button>
                </div>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />

                  <div className="space-y-0">
                    {historyRecords.map((record: MaterialChangeRecord, idx: number) => (
                      <div key={record.id} className="relative flex gap-3 py-3">
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex-shrink-0 w-[31px] h-[31px] rounded-full flex items-center justify-center ${
                          record.action === 'created'
                            ? 'bg-green-100'
                            : record.action === 'deleted'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                        }`}>
                          {record.action === 'created' && <Plus className="w-3.5 h-3.5 text-green-600" />}
                          {record.action === 'updated' && <Edit3 className="w-3.5 h-3.5 text-blue-600" />}
                          {record.action === 'deleted' && <Trash2 className="w-3.5 h-3.5 text-red-600" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header: action + user + timestamp */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${
                              record.action === 'created'
                                ? 'text-green-700'
                                : record.action === 'deleted'
                                ? 'text-red-700'
                                : 'text-blue-700'
                            }`}>
                              {record.action === 'created' ? 'Material Created' : record.action === 'deleted' ? 'Material Deleted' : 'Material Updated'}
                            </span>
                            <span className="text-[10px] text-gray-300">|</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                              <User className="w-3 h-3 text-gray-400" />
                              {record.userName || 'Unknown User'}
                            </span>
                            <span className="text-[10px] text-gray-300">|</span>
                            <span className="text-[10px] text-gray-400">{formatTimestamp(record.timestamp)}</span>
                          </div>

                          {/* Field changes — fully expanded, no truncation */}
                          {record.changes.length > 0 && (
                            <div className="mt-2.5 border border-gray-100 rounded-lg overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-[160px]">Field</th>
                                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Previous Value</th>
                                    <th className="w-6"></th>
                                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">New Value</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {record.changes.map((change, cIdx) => (
                                    <tr key={cIdx} className={cIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                      <td className="px-3 py-2 font-semibold text-gray-600 align-top whitespace-nowrap">
                                        {change.fieldLabel}
                                      </td>
                                      <td className="px-3 py-2 text-red-400 align-top break-words">
                                        <span className="line-through">{formatChangeValue(change.field, change.oldValue)}</span>
                                      </td>
                                      <td className="py-2 text-center align-top">
                                        <ArrowRight className="w-3 h-3 text-gray-300 inline-block" />
                                      </td>
                                      <td className="px-3 py-2 text-gray-800 font-medium align-top break-words">
                                        {formatChangeValue(change.field, change.newValue)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Separator between entries */}
                          {idx < historyRecords.length - 1 && <div className="border-b border-gray-100 mt-3" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Photos Tab ── */}
        {modalTab === 'photos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Material Photos</h3>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setForm(f => ({ ...f, imageUrl: reader.result as string || undefined }));
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }} />
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Photo
                </span>
              </label>
            </div>
            <div className="columns-3 gap-3 space-y-3">
              {form.imageUrl && (
                <div className="relative group break-inside-avoid">
                  <img src={form.imageUrl} alt="Material" className="w-full rounded-lg border border-gray-200 object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, imageUrl: undefined }))}
                      className="p-1.5 bg-white/90 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-blue-600 text-white rounded">Main</span>
                </div>
              )}
              {/* Sample material photos */}
              <div className="break-inside-avoid">
                <img src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop" alt="Paper texture closeup" className="w-full rounded-lg border border-gray-200 object-cover" />
              </div>
              <div className="break-inside-avoid">
                <img src="https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=500&fit=crop" alt="Stacked paper sheets" className="w-full rounded-lg border border-gray-200 object-cover" />
              </div>
              <div className="break-inside-avoid">
                <img src="https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=350&fit=crop" alt="Printed material sample" className="w-full rounded-lg border border-gray-200 object-cover" />
              </div>
              <div className="break-inside-avoid">
                <img src="https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=400&h=400&fit=crop" alt="White paper detail" className="w-full rounded-lg border border-gray-200 object-cover" />
              </div>
              <div className="break-inside-avoid">
                <img src="https://images.unsplash.com/photo-1517697471339-4aa32003c11a?w=400&h=280&fit=crop" alt="Color swatches" className="w-full rounded-lg border border-gray-200 object-cover" />
              </div>
              <div className="break-inside-avoid">
                <img src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=450&fit=crop" alt="Material roll" className="w-full rounded-lg border border-gray-200 object-cover" />
              </div>
            </div>
          </div>
        )}

        {/* ── Details Tab ── */}
        {modalTab === 'details' && <div className="space-y-4">
          <div className="flex items-start gap-4">
            {/* Name, Group, Description */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-[3]">
                  <Input label="Material Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. 100lb Gloss Cover" />
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Material Groups
                  </label>
                  <div className="relative" ref={groupDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setGroupDropdownOpen(o => !o)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      {form.materialGroupIds.length === 0 ? (
                        <span className="text-gray-400">Select groups…</span>
                      ) : (
                        <span className="flex-1 flex flex-wrap gap-1 min-w-0">
                          {form.materialGroupIds.map(gid => {
                            const g = materialGroups.find(mg => mg.id === gid);
                            if (!g) return null;
                            return (
                              <span
                                key={gid}
                                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium max-w-[140px]"
                              >
                                <span className="truncate">{g.name}</span>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setForm(f => ({ ...f, materialGroupIds: f.materialGroupIds.filter(id => id !== gid) }));
                                  }}
                                  className="flex-shrink-0 p-0.5 rounded-full hover:bg-blue-100 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {groupDropdownOpen && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-[180px] overflow-y-auto">
                        {materialGroups.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-400">No groups available</div>
                        ) : (
                          materialGroups.map(g => {
                            const isChecked = form.materialGroupIds.includes(g.id);
                            return (
                              <label
                                key={g.id}
                                className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer transition-colors ${
                                  isChecked ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => setForm(f => ({
                                    ...f,
                                    materialGroupIds: isChecked
                                      ? f.materialGroupIds.filter(id => id !== g.id)
                                      : [...f.materialGroupIds, g.id],
                                  }))}
                                  className="sr-only"
                                />
                                <span className={`text-sm ${isChecked ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                                  {g.name}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional notes about this material (e.g. finish, weight, best uses...)"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
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
                    {/* Two-column layout: left = related items, right = browser */}
                    <div className="flex" style={{ minHeight: '320px' }}>

                      {/* Left panel — Related Products & Categories */}
                      <div className="w-80 flex flex-col border-r border-gray-200">
                        <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Related Products &amp; Categories</span>
                          {totalSelected > 0 && (
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, categoryIds: [], productIds: [], favoriteProductIds: [], favoriteCategoryIds: [] }))}
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
                              <p className="mt-1 text-[10px]">Browse or search to add from the right panel</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {form.categoryIds.map(cid => {
                                const cat = categories.find(c => c.id === cid);
                                if (!cat) return null;
                                const isCatFav = form.favoriteCategoryIds.includes(cid);
                                return (
                                  <div key={`sel-cat-${cid}`} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-purple-50 group">
                                    <button
                                      type="button"
                                      onClick={() => toggleCategoryFavorite(cid)}
                                      className="p-0.5 flex-shrink-0 transition-colors"
                                      title={isCatFav ? 'Remove from favorites' : 'Mark as favorite'}
                                    >
                                      <Star className={`w-3.5 h-3.5 ${isCatFav ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                                    </button>
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
                                const isProdFav = form.favoriteProductIds.includes(pid);
                                return (
                                  <div key={`sel-prod-${pid}`} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50 group">
                                    <button
                                      type="button"
                                      onClick={() => toggleProductFavorite(pid)}
                                      className="p-0.5 flex-shrink-0 transition-colors"
                                      title={isProdFav ? 'Remove from favorites' : 'Mark as favorite'}
                                    >
                                      <Star className={`w-3.5 h-3.5 ${isProdFav ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                                    </button>
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

                      {/* Right panel — browse & search */}
                      <div className="flex-1 flex flex-col">
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
                              const catMatchesSearch = browseFilteredCategories.some(c => c.id === cat.id);
                              // Show category if it has products, or if the category name matches the search
                              if (catProducts.length === 0 && !catMatchesSearch) return null;
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
                                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors border-b border-gray-50 ${
                                          isSelected ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                        }`}>
                                          {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <Package className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                                          <p className={`text-sm whitespace-nowrap ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800 font-medium'}`}>
                                            {p.name}
                                          </p>
                                          {p.aliases.length > 0 && (
                                            <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">{p.aliases[0]}</span>
                                          )}
                                          <span className="text-[10px] text-gray-300 mx-0.5">|</span>
                                          <span className="text-[10px] text-gray-400 truncate">
                                            {[
                                              p.defaultFinalSize && `Size: ${p.defaultFinalSize}`,
                                              p.defaultColor,
                                              p.defaultSides && `${p.defaultSides}-sided`,
                                              p.defaultEquipmentName && `on ${p.defaultEquipmentName}`,
                                            ].filter(Boolean).join(' · ')}
                                          </span>
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
                                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors border-b border-gray-50 ${
                                        isSelected ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                      }`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                      </div>
                                      <Package className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                      <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                                        <p className={`text-sm whitespace-nowrap ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800 font-medium'}`}>
                                          {p.name}
                                        </p>
                                        {p.aliases.length > 0 && (
                                          <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">{p.aliases[0]}</span>
                                        )}
                                        <span className="text-[10px] text-gray-300 mx-0.5">|</span>
                                        <span className="text-[10px] text-gray-400 truncate">
                                          {[
                                            p.defaultFinalSize && `Size: ${p.defaultFinalSize}`,
                                            p.defaultColor,
                                            p.defaultSides && `${p.defaultSides}-sided`,
                                            p.defaultEquipmentName && `on ${p.defaultEquipmentName}`,
                                          ].filter(Boolean).join(' · ')}
                                        </span>
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
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Material Attributes & Cost Configurations (collapsible) ── */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setCostConfigCollapsed(c => !c)}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                {costConfigCollapsed
                  ? <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />}
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Material Attributes &amp; Cost Configurations</h3>
              </div>
              {costConfigCollapsed && (
                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {MATERIAL_TYPE_LABELS[form.materialType]} · {PRICING_MODEL_LABELS[form.pricingModel]} · {form.markupType === 'percent' ? `${form.markup}%/u` : form.markupType === 'fixed' ? `$${form.markup}/u` : form.markupType === 'global_percent' ? `${form.markup}% total` : `$${form.markup} flat`}
                </span>
              )}
            </button>

            {!costConfigCollapsed && (
              <div className="mt-3 space-y-4 pl-6">

          {/* ── Type toggle ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {(['paper', 'roll_media', 'rigid_substrate', 'blanks'] as MaterialType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const allowedModels = MATERIAL_TYPE_PRICING_MODELS[type];
                    setForm(f => ({
                      ...f,
                      materialType: type,
                      pricingModel: allowedModels.includes(f.pricingModel) ? f.pricingModel : allowedModels[0],
                      ...(type === 'blanks' ? { sizeWidth: 0, sizeHeight: 0, size: '' } : {}),
                      ...(type === 'roll_media' ? { sizeHeight: 0, size: '' } : {}),
                    }));
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    form.materialType === type
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {MATERIAL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Dimensions (conditional by type) ── */}
          {form.materialType !== 'blanks' && (
            <div className={`grid gap-4 ${form.materialType === 'roll_media' ? 'grid-cols-1 max-w-xs' : 'grid-cols-2 max-w-sm'}`}>
              <Input label={form.materialType === 'roll_media' ? 'Roll Width (in)' : 'Width (in)'} type="number" value={form.sizeWidth || ''} onChange={e => setForm(f => ({ ...f, sizeWidth: parseFloat(e.target.value) || 0 }))} />
              {form.materialType !== 'roll_media' && (
                <Input label="Height (in)" type="number" value={form.sizeHeight || ''} onChange={e => setForm(f => ({ ...f, sizeHeight: parseFloat(e.target.value) || 0 }))} />
              )}
            </div>
          )}

          {/* ── Cost Unit selector ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cost Unit</label>
            <div className="flex gap-2 flex-wrap">
              {MATERIAL_TYPE_PRICING_MODELS[form.materialType].map(model => (
                <button
                  key={model}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, pricingModel: model }))}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                    form.pricingModel === model
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {PRICING_MODEL_LABELS[model]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Base cost + roll reference (single row) ── */}
          <div className="flex gap-3 items-end">
            {/* Primary cost input */}
            <div className="w-36">
              {form.pricingModel === 'cost_per_m' && (
                <Input label="Price per M" type="number" value={form.pricePerM || ''} onChange={e => setForm(f => ({ ...f, pricePerM: parseFloat(e.target.value) || 0 }))} prefix="$" />
              )}
              {form.pricingModel === 'cost_per_unit' && (
                <Input label="Cost per Unit" type="number" value={form.costPerUnit || ''} onChange={e => setForm(f => ({ ...f, costPerUnit: parseFloat(e.target.value) || 0 }))} prefix="$" />
              )}
              {form.pricingModel === 'cost_per_sqft' && (
                <Input label="Cost per Sq Ft" type="number" value={form.costPerSqft || ''} onChange={e => setForm(f => ({ ...f, costPerSqft: parseFloat(e.target.value) || 0 }))} prefix="$" />
              )}
            </div>
            {/* Roll reference calculator (flat row, aligned with cost input) */}
            {form.materialType === 'roll_media' && (
              <div className="flex items-end gap-2">
                <span className="text-[10px] text-amber-600 font-semibold pb-1.5">←</span>
                <div className="w-28">
                  <Input label="Roll $" type="number" value={form.rollCost || ''} prefix="$"
                    onChange={e => {
                      const rollCost = parseFloat(e.target.value) || 0;
                      setForm(f => {
                        const derived = rollCost > 0 && f.rollLength > 0 && f.sizeWidth > 0
                          ? deriveRollCostPerSqft(rollCost, f.rollLength, f.sizeWidth) : null;
                        return { ...f, rollCost, ...(derived !== null ? { costPerSqft: Math.round(derived * 10000) / 10000 } : {}) };
                      });
                    }} />
                </div>
                <div className="w-28">
                  <Input label="Length (ft)" type="number" value={form.rollLength || ''} suffix="ft"
                    onChange={e => {
                      const rollLength = parseFloat(e.target.value) || 0;
                      setForm(f => {
                        const derived = f.rollCost > 0 && rollLength > 0 && f.sizeWidth > 0
                          ? deriveRollCostPerSqft(f.rollCost, rollLength, f.sizeWidth) : null;
                        return { ...f, rollLength, ...(derived !== null ? { costPerSqft: Math.round(derived * 10000) / 10000 } : {}) };
                      });
                    }} />
                </div>
                {form.rollCost > 0 && form.rollLength > 0 && form.sizeWidth > 0 && (
                  <span className="text-[10px] text-amber-600 pb-1.5 whitespace-nowrap">
                    = {(form.rollLength * (form.sizeWidth / 12)).toFixed(0)} sqft → <span className="font-semibold">{formatCurrency(deriveRollCostPerSqft(form.rollCost, form.rollLength, form.sizeWidth))}/sqft</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Tier Pricing (optional) ── */}
          <div className="max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity Tier Pricing</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, pricingTiers: [...f.pricingTiers, { minQty: 0, costPerUnit: 0 }] }))}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Tier
              </button>
            </div>
            {form.pricingTiers.length === 0 ? (
              <p className="text-[10px] text-gray-400">No tiers — base cost above applies to all quantities.</p>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[112px_112px_24px] gap-1 bg-gray-50 border-b border-gray-200 px-2 py-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Min Qty</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Cost</span>
                  <span></span>
                </div>
                {form.pricingTiers.map((tier, i) => (
                  <div key={i} className="grid grid-cols-[112px_112px_24px] gap-1 items-center px-2 py-1 border-b border-gray-100 last:border-0">
                    <input type="number" value={tier.minQty || ''} placeholder="0"
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onChange={e => setForm(f => ({
                        ...f,
                        pricingTiers: f.pricingTiers.map((t, idx) => idx === i ? { ...t, minQty: parseFloat(e.target.value) || 0 } : t),
                      }))} />
                    <div className="relative">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">$</span>
                      <input type="number" value={tier.costPerUnit || ''} placeholder="0.00"
                        className="w-full pl-4 pr-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onChange={e => setForm(f => ({
                          ...f,
                          pricingTiers: f.pricingTiers.map((t, idx) => idx === i ? { ...t, costPerUnit: parseFloat(e.target.value) || 0 } : t),
                        }))} />
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, pricingTiers: f.pricingTiers.filter((_, idx) => idx !== i) }))}
                      className="p-0.5 text-gray-300 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Minimum Charge ── */}
          <div className="w-36">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              <Tip label="Minimum Charge" tip="If the calculated total is below this amount, this minimum will be charged instead. Set to 0 for no minimum." />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" value={form.minimumCharge || ''}
                onChange={e => setForm(f => ({ ...f, minimumCharge: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-8 px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent placeholder-gray-400 transition-all" />
            </div>
          </div>

          {/* ── Markup (last — applies on top of everything) ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Markup</label>
            <div className="flex gap-3 items-end">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button type="button" onClick={() => setForm(f => ({ ...f, markupType: 'percent' }))}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    form.markupType === 'percent' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  Per Unit %
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, markupType: 'fixed' }))}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    form.markupType === 'fixed' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  Per Unit $
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, markupType: 'global_percent' }))}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    form.markupType === 'global_percent' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  Global Total %
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, markupType: 'global_flat' }))}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    form.markupType === 'global_flat' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  Flat Total $
                </button>
              </div>
              <div className="w-28">
                <Input
                  type="number"
                  value={form.markup}
                  onChange={e => setForm(f => ({ ...f, markup: parseFloat(e.target.value) || 0 }))}
                  prefix={form.markupType === 'fixed' || form.markupType === 'global_flat' ? '$' : undefined}
                  suffix={form.markupType === 'percent' || form.markupType === 'global_percent' ? '%' : undefined}
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {form.markupType === 'percent' && 'Percentage added to each unit cost.'}
              {form.markupType === 'fixed' && 'Fixed dollar amount added to each unit cost.'}
              {form.markupType === 'global_percent' && 'Percentage applied to the calculated order total.'}
              {form.markupType === 'global_flat' && 'Flat dollar amount added to the order total, regardless of quantity.'}
            </p>
          </div>

          {/* ── Test Price Calculator ── */}
          {(() => {
            const preview = { ...form, materialType: form.materialType || 'paper', pricingModel: form.pricingModel || 'cost_per_m' } as PricingMaterial;
            const baseCostPerUnit = getUnitCost(preview);
            const unitLabel = getUnitLabel(preview);
            const model = form.pricingModel || 'cost_per_m';

            if (baseCostPerUnit <= 0 && !showTestPanel) return (
              <button type="button" onClick={() => setShowTestPanel(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 transition-colors opacity-50 cursor-not-allowed" disabled>
                <FlaskConical className="w-3.5 h-3.5" /> Test Price
              </button>
            );

            // Determine quantity label and how to interpret testQty
            const matType = form.materialType || 'paper';
            const qtyLabel = model === 'cost_per_sqft' ? 'Sq Ft' : model === 'cost_per_m' ? (matType === 'blanks' ? 'Items' : 'Sheets') : 'Units';

            // Tier lookup: tiers store costPerUnit in the same unit as the base cost field
            // For cost_per_m, tiers store price-per-M → divide by 1000 to get per-sheet
            // For cost_per_unit / cost_per_sqft, tiers store the direct per-unit / per-sqft cost
            const tierRaw = getTierCost(preview, testQty);
            const tierCostPerUnit = tierRaw !== null
              ? (model === 'cost_per_m' ? tierRaw / 1000 : tierRaw)
              : null;

            const effectiveCostPerUnit = tierCostPerUnit !== null ? tierCostPerUnit : baseCostPerUnit;

            // Markup & sell via getOrderSell
            const orderResult = getOrderSell(
              { ...preview, markupType: form.markupType, markup: form.markup } as PricingMaterial,
              testQty,
              effectiveCostPerUnit,
            );
            const { sellPerUnit, markupPerUnit, totalSell, isGlobalMarkup } = orderResult;

            // Totals
            const totalCost = effectiveCostPerUnit * testQty;
            const minApplied = form.minimumCharge > 0 && totalSell < form.minimumCharge;
            const finalTotal = minApplied ? form.minimumCharge : totalSell;

            // For display: show the tier raw value in the user's configured unit
            const tierDisplayLabel = model === 'cost_per_m' ? '/M' : unitLabel;
            const tierDisplayValue = tierRaw;

            return (
              <div className="space-y-2">
                <button type="button" onClick={() => setShowTestPanel(p => !p)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 transition-colors">
                  <FlaskConical className="w-3.5 h-3.5" />
                  {showTestPanel ? 'Hide Test' : 'Test Price'}
                </button>

                {showTestPanel && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[11px] font-semibold text-amber-800">Test Price Calculator</span>
                      </div>
                      <button type="button" onClick={() => setShowTestPanel(false)} className="p-0.5 hover:bg-amber-100 rounded">
                        <X className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </div>

                    {/* Test quantity input */}
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide whitespace-nowrap">
                        Test {qtyLabel}
                      </label>
                      <input type="number" value={testQty}
                        onChange={e => setTestQty(parseInt(e.target.value) || 0)}
                        className="w-28 px-2 py-1 text-sm bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500" />
                    </div>

                    {/* Results */}
                    <div className="bg-white/60 rounded-md px-3 py-2 space-y-1">
                      {/* Per-unit breakdown */}
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-600">Base cost{unitLabel}:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(baseCostPerUnit)}</span>
                      </div>
                      {tierCostPerUnit !== null && tierDisplayValue !== null && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500">Tier price{tierDisplayLabel} (≥{testQty.toLocaleString()}):</span>
                          <span className="font-medium text-purple-700">{formatCurrency(tierDisplayValue)}</span>
                        </div>
                      )}
                      {tierCostPerUnit !== null && model === 'cost_per_m' && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500">Tier cost{unitLabel}:</span>
                          <span className="font-medium text-purple-700">{formatCurrency(tierCostPerUnit)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">+ Markup ({form.markupType === 'percent' ? `${form.markup}%/unit` : form.markupType === 'fixed' ? `${formatCurrency(form.markup)}/unit` : form.markupType === 'global_percent' ? `${form.markup}% on total` : `${formatCurrency(form.markup)} flat total`}):</span>
                        <span className="font-medium text-gray-700">{isGlobalMarkup ? formatCurrency(totalSell - (effectiveCostPerUnit * testQty)) + ' total' : formatCurrency(markupPerUnit) + unitLabel}</span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-amber-200/60">
                        <span className="text-gray-600 font-medium">Sell{unitLabel}:</span>
                        <span className="font-semibold text-blue-700">{formatCurrency(sellPerUnit)}</span>
                      </div>

                      {/* Totals */}
                      <div className="flex justify-between text-[11px] pt-1.5 mt-1.5 border-t border-amber-200">
                        <span className="text-gray-500">× {testQty.toLocaleString()} {qtyLabel.toLowerCase()}</span>
                        <span></span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Total cost:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-amber-800">Total sell:</span>
                        <span className="font-bold text-amber-900">{formatCurrency(finalTotal)}</span>
                      </div>
                      {minApplied && (
                        <div className="text-[10px] text-amber-700 bg-amber-100 rounded px-2 py-1 mt-1">
                          Calculated total {formatCurrency(totalSell)} is below minimum — {formatCurrency(form.minimumCharge)} charged instead
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

              </div>
            )}
          </div>

        </div>}

        {/* ── Vendor Info Tab ── */}
        {modalTab === 'vendor' && (
          <div className="space-y-6 py-2">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vendor Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Vendor Name" value={form.vendorName || ''} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                  placeholder="e.g. Grimco Inc" />
                <Input label="Vendor ID" value={form.vendorId || ''} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
                  placeholder="e.g. V-10042" />
                <Input label="Vendor Material ID" value={form.vendorMaterialId || ''} onChange={e => setForm(f => ({ ...f, vendorMaterialId: e.target.value }))}
                  placeholder="e.g. MAT-55810" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Primary Contact Name" value={form.vendorContactName || ''} onChange={e => setForm(f => ({ ...f, vendorContactName: e.target.value }))}
                  placeholder="e.g. Jane Smith" />
                <Input label="Contact Title" value={form.vendorContactTitle || ''} onChange={e => setForm(f => ({ ...f, vendorContactTitle: e.target.value }))}
                  placeholder="e.g. Account Director" />
                <Input label="Sales Rep / Account Manager" value={form.vendorSalesRep || ''} onChange={e => setForm(f => ({ ...f, vendorSalesRep: e.target.value }))}
                  placeholder="e.g. John Doe" />
              </div>
            </div>
          </div>
        )}

        {/* Save / Cancel buttons (visible on all tabs) */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-4">
          <Button variant="secondary" onClick={() => { setShowNew(false); setEditingId(null); }}>Cancel</Button>
          <Button variant="primary" onClick={editingId ? handleSaveEdit : handleAdd} disabled={
            !form.name ||
            ((form.materialType === 'paper' || form.materialType === 'rigid_substrate') && (form.sizeWidth <= 0 || form.sizeHeight <= 0)) ||
            (form.materialType === 'roll_media' && form.sizeWidth <= 0)
          }>
            {editingId ? 'Save Changes' : 'Add Material'}
          </Button>
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
