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

const MultiSelectFilter: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}> = ({ label, options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  const pluralize = (s: string) => s.endsWith('y') ? s.slice(0, -1) + 'ies' : s + 's';
  const displayLabel = selected.length === 0
    ? `All ${pluralize(label)}`
    : selected.length === 1
      ? (options.find(o => o.value === selected[0])?.label ?? selected[0])
      : `${selected.length} selected`;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap ${
          selected.length > 0 ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
        }`}
      >
        {displayLabel}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] max-h-60 overflow-y-auto">
          {options.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="rounded border-gray-300 text-blue-600"
              />
              {opt.label}
            </label>
          ))}
          {selected.length > 0 && (
            <button
              onClick={() => { onChange([]); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-red-500 border-t border-gray-100"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

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
  rollPricingMode: 'direct' as 'direct' | 'from_roll',
  rollCost: 0,
  rollLength: 0,
  pricingTiers: [] as { minQty: number; costPerUnit: number }[],
  minimumCharge: 0,
  markupType: 'percent' as 'percent' | 'multiplier' | 'profit_percent',
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
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<MaterialType[]>([]);

  // Vendor filter
  const vendorNames = useMemo(() =>
    Array.from(new Set(materials.map(m => m.vendorName).filter(Boolean) as string[])).sort(),
  [materials]);
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);

  // Favorites filter: 'favorites' or 'all'
  const hasFavorites = materials.some(m => m.isFavorite);
  const [favFilter, setFavFilter] = useState<'favorites' | 'all'>(hasFavorites ? 'favorites' : 'all');

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const clearSelection = () => { setSelectedIds(new Set()); setBulkPanel(null); };
  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteMaterial(id));
    clearSelection();
  };

  // Bulk action panel state
  type BulkPanel = 'type' | 'group' | 'markup' | 'vendor' | 'favorite' | 'delete' | null;
  const [bulkPanel, setBulkPanel] = useState<BulkPanel>(null);
  const [bulkType, setBulkType] = useState<MaterialType>('paper');
  const [bulkGroupIds, setBulkGroupIds] = useState<string[]>([]);
  const [bulkGroupMode, setBulkGroupMode] = useState<'add' | 'replace'>('add');
  const [bulkMarkupType, setBulkMarkupType] = useState<'percent' | 'multiplier' | 'profit_percent'>('percent');
  const [bulkMarkupValue, setBulkMarkupValue] = useState(0);
  const [bulkVendor, setBulkVendor] = useState('');
  const [bulkFavorite, setBulkFavorite] = useState(true);

  const openBulkPanel = (panel: BulkPanel) => setBulkPanel(prev => prev === panel ? null : panel);

  const applyBulkUpdate = (patch: Partial<PricingMaterial>) => {
    selectedIds.forEach(id => updateMaterial(id, patch));
    setBulkPanel(null);
  };

  const applyBulkType = () => applyBulkUpdate({ materialType: bulkType });

  const applyBulkGroup = () => {
    selectedIds.forEach(id => {
      const m = materials.find(x => x.id === id);
      if (!m) return;
      const existing = m.materialGroupIds || [];
      const next = bulkGroupMode === 'replace'
        ? bulkGroupIds
        : Array.from(new Set([...existing, ...bulkGroupIds]));
      updateMaterial(id, { materialGroupIds: next });
    });
    setBulkPanel(null);
  };

  const applyBulkMarkup = () => applyBulkUpdate({ markupType: bulkMarkupType, markup: bulkMarkupValue });
  const applyBulkVendor = () => applyBulkUpdate({ vendorName: bulkVendor });
  const applyBulkFavorite = () => applyBulkUpdate({ isFavorite: bulkFavorite });

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
    setForm(f => {
      const removing = f.productIds.includes(prodId);
      return {
        ...f,
        productIds: removing
          ? f.productIds.filter(id => id !== prodId)
          : [...f.productIds, prodId],
        favoriteProductIds: removing
          ? f.favoriteProductIds.filter(id => id !== prodId)
          : f.favoriteProductIds.includes(prodId) ? f.favoriteProductIds : [...f.favoriteProductIds, prodId],
      };
    });
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
    if (categoryFilter.length === 0) return null;
    return materialGroups
      .filter(g => g.categoryIds.some(cid => categoryFilter.includes(cid)))
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
      const matchSize = sizeFilter.length === 0 || sizeFilter.includes(m.size || '');
      const matchGroup = groupFilter.length === 0 || (m.materialGroupIds && m.materialGroupIds.some(gid => groupFilter.includes(gid)));
      const matchCategory = !groupIdsForCategory || (m.materialGroupIds && m.materialGroupIds.some(gid => groupIdsForCategory.includes(gid)));
      const matchVendor = vendorFilter.length === 0 || vendorFilter.includes(m.vendorName || '');
      const matchFav = favFilter === 'all' || m.isFavorite;
      const matchType = typeFilter.length === 0 || typeFilter.includes(m.materialType || 'paper' as MaterialType);
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

  // Multi-select derived (depends on paginatedRows)
  const allPageSelected = paginatedRows.length > 0 && paginatedRows.every(m => selectedIds.has(m.id));
  const somePageSelected = paginatedRows.some(m => selectedIds.has(m.id)) && !allPageSelected;
  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => { const next = new Set(prev); paginatedRows.forEach(m => next.delete(m.id)); return next; });
    } else {
      setSelectedIds(prev => { const next = new Set(prev); paginatedRows.forEach(m => next.add(m.id)); return next; });
    }
  };

  // Reset to page 1 when filters / sort change
  const prevFilterKey = useRef('');
  const filterKey = `${search}|${sizeFilter.join(',')}|${groupFilter.join(',')}|${categoryFilter.join(',')}|${vendorFilter.join(',')}|${favFilter}|${typeFilter.join(',')}|${sortCol}|${sortDir}|${pageSize}`;
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
      rollPricingMode: ((m.rollCost && m.rollLength) ? 'from_roll' : 'direct') as 'direct' | 'from_roll',
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
      rollPricingMode: ((m.rollCost && m.rollLength) ? 'from_roll' : 'direct') as 'direct' | 'from_roll',
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
    if (field === 'markupType') return value === 'percent' ? 'Markup %' : value === 'multiplier' ? 'Multiplier' : value === 'profit_percent' ? 'Profit %' : String(value);
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
          <MultiSelectFilter
            label="Material Type"
            options={(['paper', 'roll_media', 'rigid_substrate', 'blanks'] as MaterialType[]).map(t => ({ value: t, label: MATERIAL_TYPE_LABELS[t] }))}
            selected={typeFilter}
            onChange={v => setTypeFilter(v as MaterialType[])}
          />
          <MultiSelectFilter
            label="Material Group"
            options={materialGroups.map(g => ({ value: g.id, label: g.name }))}
            selected={groupFilter}
            onChange={setGroupFilter}
          />
          <MultiSelectFilter
            label="Size"
            options={(sizeGroups as string[]).map(s => ({ value: s, label: s }))}
            selected={sizeFilter}
            onChange={setSizeFilter}
          />
          <MultiSelectFilter
            label="Category"
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            selected={categoryFilter}
            onChange={setCategoryFilter}
          />
          <MultiSelectFilter
            label="Vendor"
            options={vendorNames.map(v => ({ value: v, label: v }))}
            selected={vendorFilter}
            onChange={setVendorFilter}
          />
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

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (() => {
        const btnBase = 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap';
        const btnActive = 'bg-blue-600 text-white border-blue-600';
        const btnIdle = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
        return (
          <div className="mb-3">
            {/* Main bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl flex-wrap">
              <span className="text-sm font-semibold text-blue-700 mr-1">{selectedIds.size} selected</span>
              <span className="text-blue-200 text-lg leading-none">|</span>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide mr-1">Edit:</span>

              <button onClick={() => openBulkPanel('type')} className={`${btnBase} ${bulkPanel === 'type' ? btnActive : btnIdle}`}>
                <Layers className="w-3.5 h-3.5" /> Material Type
              </button>
              <button onClick={() => openBulkPanel('group')} className={`${btnBase} ${bulkPanel === 'group' ? btnActive : btnIdle}`}>
                <Package className="w-3.5 h-3.5" /> Group
              </button>
              <button onClick={() => openBulkPanel('markup')} className={`${btnBase} ${bulkPanel === 'markup' ? btnActive : btnIdle}`}>
                <ArrowUpDown className="w-3.5 h-3.5" /> Markup
              </button>
              <button onClick={() => openBulkPanel('vendor')} className={`${btnBase} ${bulkPanel === 'vendor' ? btnActive : btnIdle}`}>
                <Truck className="w-3.5 h-3.5" /> Vendor
              </button>
              <button onClick={() => openBulkPanel('favorite')} className={`${btnBase} ${bulkPanel === 'favorite' ? btnActive : btnIdle}`}>
                <Star className="w-3.5 h-3.5" /> Favorite
              </button>

              <div className="flex-1" />
              <button onClick={clearSelection} className={`${btnBase} ${btnIdle}`}>
                <X className="w-3.5 h-3.5" /> Clear
              </button>
              <button
                onClick={() => openBulkPanel('delete')}
                className={`${btnBase} ${bulkPanel === 'delete' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-300 hover:bg-red-50'}`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>

            {/* Inline panels */}
            {bulkPanel === 'type' && (
              <div className="mt-1.5 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-4 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Set Material Type to:</span>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  {(['paper', 'roll_media', 'rigid_substrate', 'blanks'] as MaterialType[]).map(t => (
                    <button key={t} type="button" onClick={() => setBulkType(t)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${bulkType === t ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                      {MATERIAL_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <button onClick={applyBulkType} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  Apply to {selectedIds.size}
                </button>
                <button onClick={() => setBulkPanel(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            )}

            {bulkPanel === 'group' && (
              <div className="mt-1.5 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-4 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Material Groups:</span>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  {(['add', 'replace'] as const).map(mode => (
                    <button key={mode} type="button" onClick={() => setBulkGroupMode(mode)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${bulkGroupMode === mode ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                      {mode === 'add' ? 'Add to' : 'Replace'}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {materialGroups.map(g => (
                    <label key={g.id} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition-colors ${bulkGroupIds.includes(g.id) ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      <input type="checkbox" className="sr-only" checked={bulkGroupIds.includes(g.id)}
                        onChange={() => setBulkGroupIds(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])} />
                      {bulkGroupIds.includes(g.id) && <Check className="w-3 h-3" />}
                      {g.name}
                    </label>
                  ))}
                  {materialGroups.length === 0 && <span className="text-xs text-gray-400">No groups defined</span>}
                </div>
                <button onClick={applyBulkGroup} disabled={bulkGroupIds.length === 0} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors">
                  Apply to {selectedIds.size}
                </button>
                <button onClick={() => setBulkPanel(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            )}

            {bulkPanel === 'markup' && (
              <div className="mt-1.5 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-4 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Markup By:</span>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  {([['percent','Markup %'],['multiplier','Multiplier'],['profit_percent','Profit %']] as const).map(([v,label]) => (
                    <button key={v} type="button" onClick={() => setBulkMarkupType(v)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${bulkMarkupType === v ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative w-28">
                  <input type="number" value={bulkMarkupValue || ''} placeholder="0"
                    onChange={e => setBulkMarkupValue(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{bulkMarkupType === 'multiplier' ? '×' : '%'}</span>
                </div>
                <button onClick={applyBulkMarkup} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  Apply to {selectedIds.size}
                </button>
                <button onClick={() => setBulkPanel(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            )}

            {bulkPanel === 'vendor' && (
              <div className="mt-1.5 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-4 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Set Vendor:</span>
                <input type="text" value={bulkVendor} onChange={e => setBulkVendor(e.target.value)}
                  placeholder="Vendor name…"
                  list="bulk-vendor-list"
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
                <datalist id="bulk-vendor-list">
                  {vendorNames.map(v => <option key={v} value={v} />)}
                </datalist>
                <button onClick={applyBulkVendor} disabled={!bulkVendor.trim()} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors">
                  Apply to {selectedIds.size}
                </button>
                <button onClick={() => setBulkPanel(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            )}

            {bulkPanel === 'favorite' && (
              <div className="mt-1.5 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-4 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Set Favorite status:</span>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  <button type="button" onClick={() => setBulkFavorite(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${bulkFavorite ? 'bg-white text-amber-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Star className={`w-3.5 h-3.5 ${bulkFavorite ? 'fill-amber-400 text-amber-400' : ''}`} /> Mark as Favorite
                  </button>
                  <button type="button" onClick={() => setBulkFavorite(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!bulkFavorite ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Star className="w-3.5 h-3.5" /> Remove Favorite
                  </button>
                </div>
                <button onClick={applyBulkFavorite} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  Apply to {selectedIds.size}
                </button>
                <button onClick={() => setBulkPanel(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            )}

            {bulkPanel === 'delete' && (
              <div className="mt-1.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl shadow-sm flex items-center gap-3 flex-wrap">
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 font-medium">Delete {selectedIds.size} material{selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.</span>
                <div className="flex-1" />
                <button onClick={() => { handleBulkDelete(); setBulkPanel(null); }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                  Yes, delete {selectedIds.size}
                </button>
                <button onClick={() => setBulkPanel(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Sortable Table */}
      <Card>
        {sorted.length > 0 && <PaginationBar />}
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={el => { if (el) el.indeterminate = somePageSelected; }}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                </th>
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
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.has(m.id) ? 'bg-blue-50/60' : ''}`}
                  onClick={() => handleStartEdit(m)}
                >
                  <td className="py-3 px-3 w-8" onClick={e => { e.stopPropagation(); toggleSelect(m.id); }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                      className="rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </td>
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
                  <td className="py-3 px-4 text-sm text-gray-500">{m.markupType === 'multiplier' ? `${m.markup}×` : m.markupType === 'profit_percent' ? `${m.markup}% margin` : `${m.markup}%`}</td>
                  <td className="py-3 px-4 text-sm font-bold text-blue-700">
                    {formatCurrency(getUnitSell(m))}<span className="text-[10px] text-gray-400 ml-0.5">{getUnitLabel(m)}</span>
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
        title={editingId ? 'Edit Material' : 'Add Material'} size="4xl" className="h-[90vh]">
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
                <div>
                  <p className="text-xs text-gray-500">{historyRecords.length} change{historyRecords.length !== 1 ? 's' : ''} recorded</p>
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

                          {/* Field changes — fixed-width columns for consistent alignment across entries */}
                          {record.changes.length > 0 && (
                            <div className="mt-2.5 border border-gray-100 rounded-lg overflow-hidden">
                              <table className="w-full text-xs table-fixed">
                                <colgroup>
                                  <col className="w-[30%]" />
                                  <col className="w-[35%]" />
                                  <col className="w-[35%]" />
                                </colgroup>
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Field</th>
                                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Previous Value</th>
                                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">New Value</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {record.changes.map((change, cIdx) => (
                                    <tr key={cIdx} className={cIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                      <td className="px-3 py-2 font-semibold text-gray-600 align-top truncate" title={change.fieldLabel}>
                                        {change.fieldLabel}
                                      </td>
                                      <td className="px-3 py-2 text-red-400 align-top break-words">
                                        <span className="line-through">{formatChangeValue(change.field, change.oldValue)}</span>
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <Tip label="Material Name" tip="The name that identifies this material in your catalog, quotes, and orders." />
                  </label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. 100lb Gloss Cover" />
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <Tip label="Material Groups" tip="Assign this material to one or more groups for organization and filtering in the material list." />
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Description" tip="Optional notes about this material such as finish, weight, coating, or best use cases." />
                </label>
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
          <div className="border-t border-gray-200" />
          {/* ── Material Type toggle ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              <Tip label="Material Type" tip="The physical form of this material — affects available cost models and dimension inputs." />
            </label>
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
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
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

          {/* ── Size + Cost row (all material types) ── */}
          <div className="flex items-end gap-3 flex-wrap">
            {/* Dimension fields — paper / rigid */}
            {(form.materialType === 'paper' || form.materialType === 'rigid_substrate') && (
              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Size" tip="The sheet dimensions in Width×Height format (e.g. 8.5x11). Used for cost calculations based on area." />
                </label>
                <Input type="text" value={form.size || ''} placeholder="8.5x11" onChange={e => setForm(f => ({ ...f, size: e.target.value }))} />
              </div>
            )}

            {/* Dimension fields — roll media */}
            {form.materialType === 'roll_media' && (
              <>
                <div className="w-20">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <Tip label="Width (in)" tip="The roll width in inches. Used together with length to calculate the total area and cost per square foot." />
                  </label>
                  <Input type="number" value={form.sizeWidth || ''}
                    onChange={e => {
                      const w = parseFloat(e.target.value) || 0;
                      setForm(f => {
                        if (f.rollPricingMode === 'from_roll' && f.rollCost > 0 && f.rollLength > 0 && w > 0) {
                          const derived = deriveRollCostPerSqft(f.rollCost, f.rollLength, w);
                          return { ...f, sizeWidth: w, costPerSqft: Math.round(derived * 10000) / 10000 };
                        }
                        return { ...f, sizeWidth: w };
                      });
                    }} />
                </div>
                {form.rollPricingMode === 'from_roll' && (
                  <>
                    <div className="w-20">
                      <Input label="Length (ft)" type="number" value={form.rollLength || ''}
                        onChange={e => {
                          const rollLength = parseFloat(e.target.value) || 0;
                          setForm(f => {
                            if (f.rollCost > 0 && rollLength > 0 && f.sizeWidth > 0) {
                              const derived = deriveRollCostPerSqft(f.rollCost, rollLength, f.sizeWidth);
                              return { ...f, rollLength, costPerSqft: Math.round(derived * 10000) / 10000 };
                            }
                            return { ...f, rollLength };
                          });
                        }} />
                    </div>
                    <div className="w-24">
                      <Input label="Roll Price" type="number" value={form.rollCost || ''} prefix="$"
                        onChange={e => {
                          const rollCost = parseFloat(e.target.value) || 0;
                          setForm(f => {
                            if (rollCost > 0 && f.rollLength > 0 && f.sizeWidth > 0) {
                              const derived = deriveRollCostPerSqft(rollCost, f.rollLength, f.sizeWidth);
                              return { ...f, rollCost, costPerSqft: Math.round(derived * 10000) / 10000 };
                            }
                            return { ...f, rollCost };
                          });
                        }} />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Cost field — non-roll types and roll direct mode */}
            {form.materialType !== 'roll_media' && (
              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Cost" tip="The base cost of this material in the selected pricing model. This is the cost before any markup is applied." />
                </label>
                {form.pricingModel === 'cost_per_m' && (
                  <Input type="number" value={form.pricePerM || ''} onChange={e => setForm(f => ({ ...f, pricePerM: parseFloat(e.target.value) || 0 }))} prefix="$" />
                )}
                {form.pricingModel === 'cost_per_unit' && (
                  <Input type="number" value={form.costPerUnit || ''} onChange={e => setForm(f => ({ ...f, costPerUnit: parseFloat(e.target.value) || 0 }))} prefix="$" />
                )}
                {form.pricingModel === 'cost_per_sqft' && (
                  <Input type="number" value={form.costPerSqft || ''} onChange={e => setForm(f => ({ ...f, costPerSqft: parseFloat(e.target.value) || 0 }))} prefix="$" />
                )}
              </div>
            )}
            {form.materialType === 'roll_media' && form.rollPricingMode === 'direct' && (
              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Cost" tip="The base cost of this material per square foot. This is the cost before any markup is applied." />
                </label>
                <Input type="number" value={form.costPerSqft || ''} onChange={e => setForm(f => ({ ...f, costPerSqft: parseFloat(e.target.value) || 0 }))} prefix="$" />
              </div>
            )}

            {/* Pricing model toggle — non-roll types */}
            {form.materialType !== 'roll_media' && (
              <div>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  {MATERIAL_TYPE_PRICING_MODELS[form.materialType].map(model => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, pricingModel: model }))}
                      className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                        form.pricingModel === model
                          ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {PRICING_MODEL_LABELS[model]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Roll pricing mode toggle */}
            {form.materialType === 'roll_media' && (
              <div>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, rollPricingMode: 'direct' as const, rollCost: 0, rollLength: 0 }))}
                    className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                      form.rollPricingMode === 'direct'
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    Cost /sq. ft.
                  </button>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, rollPricingMode: 'from_roll' as const, costPerSqft: 0 }))}
                    className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                      form.rollPricingMode === 'from_roll'
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    From Roll
                  </button>
                </div>
              </div>
            )}

            {/* Roll direct — unit hint */}
            {form.materialType === 'roll_media' && form.rollPricingMode === 'direct' && (
              <span className="pb-1.5 text-xs text-gray-500">/sq. ft.</span>
            )}

            {/* Roll from_roll — derived cost display */}
            {form.materialType === 'roll_media' && form.rollPricingMode === 'from_roll' && form.rollCost > 0 && form.rollLength > 0 && form.sizeWidth > 0 && (
              <span className="text-[10px] text-amber-600 pb-1.5 whitespace-nowrap">
                = {(form.rollLength * (form.sizeWidth / 12)).toFixed(0)} sq ft → <span className="font-semibold">{formatCurrency(deriveRollCostPerSqft(form.rollCost, form.rollLength, form.sizeWidth))}/sq. ft.</span>
              </span>
            )}
          </div>

          {/* ── Tier Cost (optional) ── */}
          <div className="max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Tip label="Tier Cost" tip="Define quantity-based price breaks. When the order quantity meets a tier's minimum, that tier's cost replaces the base cost." />
              </label>
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

          {/* ── Markup By (last — applies on top of everything) ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <Tip label="Markup By" tip="How the sell price is calculated from cost. Markup % adds a percentage on top of cost, Multiplier multiplies cost by a factor, and Profit % targets a gross margin." />
            </label>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button type="button" onClick={() => setForm(f => ({ ...f, markupType: 'percent' }))}
                  className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                    form.markupType === 'percent' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  Markup %
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, markupType: 'multiplier' }))}
                  className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                    form.markupType === 'multiplier' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  Multiplier
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, markupType: 'profit_percent' }))}
                  className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                    form.markupType === 'profit_percent' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  Profit %
                </button>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={form.markup}
                  onChange={e => setForm(f => ({ ...f, markup: parseFloat(e.target.value) || 0 }))}
                  suffix={form.markupType === 'multiplier' ? '×' : '%'}
                />
              </div>
              <div className="ml-8 w-28">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Min Charge" tip="If the calculated total is below this amount, this minimum will be charged instead. Set to 0 for no minimum." />
                </label>
                <Input type="number" value={form.minimumCharge || ''}
                  onChange={e => setForm(f => ({ ...f, minimumCharge: parseFloat(e.target.value) || 0 }))}
                  prefix="$" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {form.markupType === 'percent' && `Sell = cost + ${form.markup}%. e.g. cost $1.00 → sell ${(1 * (1 + form.markup / 100)).toFixed(2)}`}
              {form.markupType === 'multiplier' && `Sell = cost × ${form.markup}. e.g. cost $1.00 → sell $${(1 * (form.markup || 1)).toFixed(2)}`}
              {form.markupType === 'profit_percent' && `Sell = cost ÷ (1 − ${form.markup}%). e.g. cost $1.00 → sell $${(1 / (1 - Math.min(form.markup, 99.99) / 100)).toFixed(2)} (${form.markup}% margin)`}
            </p>
          </div>

          {/* ── Test Price Calculator ── */}
          {(() => {
            const { rollPricingMode: _rpm, ...formFields } = form;
            const preview = { ...formFields, materialType: form.materialType || 'paper', pricingModel: form.pricingModel || 'cost_per_m' } as PricingMaterial;
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
                        <span className="text-gray-500">+ Markup ({form.markupType === 'multiplier' ? `${form.markup}× cost` : form.markupType === 'profit_percent' ? `${form.markup}% margin` : `${form.markup}%`}):</span>
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

          <div className="border-t border-gray-200" />

          {/* ── Include in Categories ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <Tip label="Include in Categories" tip="Select which product categories this material belongs to. A material can belong to multiple categories." />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => {
                const isSelected = form.categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleFormCategory(c.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
              {categories.length === 0 && (
                <p className="text-[10px] text-gray-400">No categories available. Create categories in Settings first.</p>
              )}
            </div>
          </div>

          {/* ── Favorite on Products ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <Tip label="Favorite on Products" tip="Select products where this material should appear as a favorite option. Starred products will be prioritized when selecting materials during quoting." />
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex" style={{ minHeight: '280px' }}>

                {/* Left panel — Search & browse products */}
                <div className="w-1/2 flex flex-col border-r border-gray-200">
                  <div className="p-2.5 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={productSearchRef}
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {browseFilteredProducts.map(p => {
                      const isSelected = form.productIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleFormProduct(p.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors border-b border-gray-50 ${
                            isSelected ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <Package className="w-3 h-3 text-blue-400 flex-shrink-0" />
                          <span className={`text-xs truncate ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800 font-medium'}`}>
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                    {browseFilteredProducts.length === 0 && (
                      <div className="px-3 py-8 text-center text-xs text-gray-400">
                        {productSearch ? `No products match "${productSearch}"` : 'No products available'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right panel — Selected products */}
                <div className="w-1/2 flex flex-col">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Selected {form.productIds.length > 0 && <span className="text-blue-600">({form.productIds.length})</span>}
                    </span>
                    {form.productIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, productIds: [], favoriteProductIds: [] }))}
                        className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {form.productIds.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-400">
                        <p>No products selected</p>
                        <p className="mt-1 text-[10px]">Select products from the left panel</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {form.productIds.map(pid => {
                          const prod = products.find(p => p.id === pid);
                          if (!prod) return null;
                          return (
                            <div key={`sel-${pid}`} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50 group">
                              <button
                                type="button"
                                onClick={() => removeFormProduct(pid)}
                                className="p-0.5 flex-shrink-0 transition-colors"
                                title="Remove from favorites"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 hover:fill-amber-200 hover:text-amber-200" />
                              </button>
                              <Package className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              <span className="text-xs font-medium text-blue-700 flex-1 truncate">{prod.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>}

        {/* ── Vendor Info Tab ── */}
        {modalTab === 'vendor' && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Vendor Name" tip="The name of the supplier or vendor company that provides this material." />
                </label>
                <Input value={form.vendorName || ''} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} placeholder="e.g. Grimco Inc" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Vendor ID" tip="Your account number or customer ID with this vendor. Useful for placing orders." />
                </label>
                <Input value={form.vendorId || ''} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} placeholder="e.g. V-10042" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Vendor Material ID" tip="The vendor's SKU or part number for this specific material. Used when reordering." />
                </label>
                <Input value={form.vendorMaterialId || ''} onChange={e => setForm(f => ({ ...f, vendorMaterialId: e.target.value }))} placeholder="e.g. MAT-55810" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Primary Contact" tip="The main person you communicate with at this vendor for orders, questions, or issues." />
                </label>
                <Input value={form.vendorContactName || ''} onChange={e => setForm(f => ({ ...f, vendorContactName: e.target.value }))} placeholder="e.g. Jane Smith" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Contact Title" tip="The job title or role of your primary contact at the vendor." />
                </label>
                <Input value={form.vendorContactTitle || ''} onChange={e => setForm(f => ({ ...f, vendorContactTitle: e.target.value }))} placeholder="e.g. Account Director" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tip label="Sales Rep" tip="The sales representative or account manager assigned to your account at this vendor." />
                </label>
                <Input value={form.vendorSalesRep || ''} onChange={e => setForm(f => ({ ...f, vendorSalesRep: e.target.value }))} placeholder="e.g. John Doe" />
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
