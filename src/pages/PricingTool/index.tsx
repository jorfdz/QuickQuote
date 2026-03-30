import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Plus, Star, Trash2, Save, RotateCcw, ChevronDown, ChevronUp,
  Scissors, FoldVertical, CircleDot, Printer, Package, DollarSign,
  Grid3X3, FileText, Settings2, Copy, X, Edit3, Check
} from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Card, Button, Badge, Modal, Input, Select, PageHeader } from '../../components/ui';
import type {
  PricingProduct, PricingEquipment, PricingMaterial,
  PricingFinishing, PricingServiceLine, PricingCategory, ProductPricingTemplate
} from '../../types/pricing';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const uid = () => `sl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function parseSize(s: string): { w: number; h: number } {
  const parts = s.toLowerCase().replace(/\s/g, '').split('x');
  return { w: parseFloat(parts[0]) || 0, h: parseFloat(parts[1]) || 0 };
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

export const PricingTool: React.FC = () => {
  const store = usePricingStore();
  const {
    categories, products, equipment, finishing, materials, templates,
    findProductByNameOrAlias, searchProducts, getEquipmentForCategory,
    calculateImposition, lookupClickPrice,
    addCategory, addProduct, addEquipment: addPricingEquipment,
    addFinishing, addMaterial: addPricingMaterial, addTemplate,
    updateTemplate, deleteTemplate, incrementTemplateUsage,
  } = store;

  // ── Product Search State ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PricingProduct | null>(null);

  // ── Job Configuration ─────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1000);
  const [finalWidth, setFinalWidth] = useState(3.5);
  const [finalHeight, setFinalHeight] = useState(2);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [colorMode, setColorMode] = useState<'Color' | 'Black'>('Color');
  const [sides, setSides] = useState<'Single' | 'Double'>('Double');
  const [foldingType, setFoldingType] = useState('');
  const [drillingType, setDrillingType] = useState('');
  const [cuttingEnabled, setCuttingEnabled] = useState(true);
  const [sheetsPerCutStack, setSheetsPerCutStack] = useState(500);

  // ── Computed pricing lines ────────────────────────────────────────────
  const [serviceLines, setServiceLines] = useState<PricingServiceLine[]>([]);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PricingServiceLine>>({});

  // ── UI state ──────────────────────────────────────────────────────────
  const [showImposition, setShowImposition] = useState(true);
  const [showFinishing, setShowFinishing] = useState(true);
  const [templateSearch, setTemplateSearch] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddFinishingModal, setShowAddFinishingModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'categories' | 'products' | 'equipment' | 'finishing' | 'materials'>('categories');

  // ── New item form states ──────────────────────────────────────────────
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newProduct, setNewProduct] = useState({
    categoryId: '', name: '', aliases: '',
    defaultQuantity: 1000, defaultFinalSize: '', defaultColor: 'Color' as const,
    defaultSides: 'Double' as const, defaultEquipmentId: '', defaultFolding: '',
  });
  const [newEquipment, setNewEquipment] = useState({
    name: '', categoryApplies: '', colorCapability: 'Color and Black' as const,
    costUnit: 'per_click' as const, costType: 'cost_only' as const,
    unitCost: 0, markupMultiplier: 0, initialSetupFee: 0,
  });
  const [newFinishing, setNewFinishing] = useState({
    service: '', subservice: '', outputPerHour: 0, hourlyCost: 40, timeCostMarkup: 0,
  });
  const [newMaterial, setNewMaterial] = useState({
    name: '', size: '', pricePerM: 0, markup: 70,
  });

  // ── Derived values ────────────────────────────────────────────────────

  const selectedMaterial = useMemo(() =>
    materials.find((m) => m.id === selectedMaterialId),
    [materials, selectedMaterialId]
  );

  const selectedEquipment = useMemo(() =>
    equipment.find((e) => e.id === selectedEquipmentId),
    [equipment, selectedEquipmentId]
  );

  const categoryName = useMemo(() => {
    if (!selectedProduct) return '';
    return categories.find((c) => c.id === selectedProduct.categoryId)?.name || '';
  }, [selectedProduct, categories]);

  const availableEquipment = useMemo(() => {
    if (!categoryName) return equipment;
    const catEquip = getEquipmentForCategory(categoryName);
    return catEquip.length > 0 ? catEquip : equipment;
  }, [categoryName, equipment, getEquipmentForCategory]);

  const availableMaterials = useMemo(() => {
    if (finalWidth <= 0 || finalHeight <= 0) return materials;
    // Show materials whose parent sheet can fit at least 1 up
    return materials.filter((m) => {
      const fits1 = m.sizeWidth >= finalWidth && m.sizeHeight >= finalHeight;
      const fits2 = m.sizeHeight >= finalWidth && m.sizeWidth >= finalHeight;
      return fits1 || fits2;
    });
  }, [materials, finalWidth, finalHeight]);

  // ── Imposition ────────────────────────────────────────────────────────

  const imposition = useMemo(() => {
    if (!selectedMaterial || finalWidth <= 0 || finalHeight <= 0) {
      return { upsAcross: 0, upsDown: 0, totalUps: 0, sheetsNeeded: 0, cutsPerSheet: 0 };
    }
    const result = calculateImposition(
      finalWidth, finalHeight,
      selectedMaterial.sizeWidth, selectedMaterial.sizeHeight
    );
    const sheetsNeeded = result.totalUps > 0 ? Math.ceil(quantity / result.totalUps) : 0;
    const cutsPerSheet = result.upsAcross + result.upsDown; // guillotine cuts per sheet
    return { ...result, sheetsNeeded, cutsPerSheet };
  }, [selectedMaterial, finalWidth, finalHeight, quantity, calculateImposition]);

  // ── Price Calculation Engine ──────────────────────────────────────────

  const recalculatePricing = useCallback(() => {
    const lines: PricingServiceLine[] = [];

    // 1) MATERIAL COST
    if (selectedMaterial && imposition.sheetsNeeded > 0) {
      const costPerSheet = selectedMaterial.pricePerM / 1000;
      const totalMaterialCost = imposition.sheetsNeeded * costPerSheet;
      const markup = selectedMaterial.markup;
      const sellPrice = totalMaterialCost * (1 + markup / 100);
      lines.push({
        id: uid(),
        service: 'Material',
        description: `${selectedMaterial.name} (${selectedMaterial.size}) — ${imposition.sheetsNeeded} sheets`,
        quantity: imposition.sheetsNeeded,
        unit: 'sheets',
        unitCost: costPerSheet,
        totalCost: totalMaterialCost,
        markupPercent: markup,
        sellPrice,
        editable: true,
      });
    }

    // 2) PRINTING / EQUIPMENT COST
    if (selectedEquipment) {
      if (selectedEquipment.costUnit === 'per_click') {
        // Per-click (digital press)
        const totalClicks = imposition.sheetsNeeded * (sides === 'Double' ? 2 : 1);
        const costPerClick = selectedEquipment.unitCost;
        const totalPrintCost = totalClicks * costPerClick;
        const sellPerClick = lookupClickPrice(selectedEquipment.id, totalClicks, colorMode);
        const totalSellPrice = totalClicks * sellPerClick;
        const markupPct = totalPrintCost > 0
          ? ((totalSellPrice - totalPrintCost) / totalPrintCost) * 100
          : 0;
        lines.push({
          id: uid(),
          service: 'Printing',
          description: `${selectedEquipment.name} — ${totalClicks} clicks (${colorMode}, ${sides === 'Double' ? '2-sided' : '1-sided'}) @ ${fmt(sellPerClick)}/click`,
          quantity: totalClicks,
          unit: 'clicks',
          unitCost: costPerClick,
          totalCost: totalPrintCost,
          markupPercent: markupPct,
          sellPrice: totalSellPrice,
          editable: true,
        });
      } else if (selectedEquipment.costUnit === 'per_sqft') {
        // Per sq ft (wide format)
        const sqft = (finalWidth * finalHeight * quantity) / 144;
        const costPerSqft = selectedEquipment.unitCost;
        const totalCost = sqft * costPerSqft;
        const multiplier = selectedEquipment.markupMultiplier || 1;
        const sellPerSqft = costPerSqft * multiplier;
        const totalSell = sqft * sellPerSqft;
        const markupPct = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: uid(),
          service: 'Printing',
          description: `${selectedEquipment.name} — ${sqft.toFixed(1)} sq ft @ ${fmt(sellPerSqft)}/sqft`,
          quantity: parseFloat(sqft.toFixed(1)),
          unit: 'sqft',
          unitCost: costPerSqft,
          totalCost,
          markupPercent: markupPct,
          sellPrice: totalSell,
          editable: true,
        });
      }

      // Setup fee
      if (selectedEquipment.initialSetupFee > 0) {
        lines.push({
          id: uid(),
          service: 'Setup',
          description: `${selectedEquipment.name} — Initial setup fee`,
          quantity: 1,
          unit: 'flat',
          unitCost: selectedEquipment.initialSetupFee,
          totalCost: selectedEquipment.initialSetupFee,
          markupPercent: 0,
          sellPrice: selectedEquipment.initialSetupFee,
          editable: true,
        });
      }
    }

    // 3) CUTTING
    if (cuttingEnabled && imposition.sheetsNeeded > 0 && imposition.cutsPerSheet > 0) {
      const cutService = finishing.find((f) => f.service === 'Cut');
      if (cutService) {
        const totalStacks = Math.ceil(imposition.sheetsNeeded / sheetsPerCutStack);
        const totalCuts = imposition.cutsPerSheet * totalStacks;
        const hoursNeeded = totalCuts / cutService.outputPerHour;
        const totalCost = hoursNeeded * cutService.hourlyCost;
        const markup = cutService.timeCostMarkup;
        const sellPrice = totalCost * (1 + markup / 100);
        lines.push({
          id: uid(),
          service: 'Cutting',
          description: `${totalCuts} cuts (${imposition.cutsPerSheet} cuts/sheet × ${totalStacks} stacks of ${sheetsPerCutStack}) — ${(hoursNeeded * 60).toFixed(0)} min`,
          quantity: totalCuts,
          unit: 'cuts',
          unitCost: cutService.hourlyCost / cutService.outputPerHour,
          totalCost,
          markupPercent: markup,
          sellPrice,
          editable: true,
        });
      }
    }

    // 4) FOLDING
    if (foldingType) {
      const foldService = finishing.find(
        (f) => f.service === 'Fold' && f.subservice?.toLowerCase().replace('-', '') === foldingType.toLowerCase().replace('-', '')
      );
      if (foldService) {
        const hoursNeeded = quantity / foldService.outputPerHour;
        const totalCost = hoursNeeded * foldService.hourlyCost;
        const markup = foldService.timeCostMarkup;
        const sellPrice = totalCost * (1 + markup / 100);
        lines.push({
          id: uid(),
          service: 'Folding',
          description: `${foldingType} — ${quantity} pcs @ ${foldService.outputPerHour}/hr`,
          quantity,
          unit: 'pcs',
          unitCost: foldService.hourlyCost / foldService.outputPerHour,
          totalCost,
          markupPercent: markup,
          sellPrice,
          editable: true,
        });
      }
    }

    // 5) DRILLING
    if (drillingType) {
      const drillService = finishing.find(
        (f) => f.service === 'Drill' && f.subservice === drillingType
      );
      if (drillService) {
        const hoursNeeded = quantity / drillService.outputPerHour;
        const totalCost = hoursNeeded * drillService.hourlyCost;
        const markup = drillService.timeCostMarkup;
        const sellPrice = totalCost * (1 + markup / 100);
        lines.push({
          id: uid(),
          service: 'Drilling',
          description: `${drillingType} — ${quantity} pcs @ ${drillService.outputPerHour}/hr`,
          quantity,
          unit: 'pcs',
          unitCost: drillService.hourlyCost / drillService.outputPerHour,
          totalCost,
          markupPercent: markup,
          sellPrice,
          editable: true,
        });
      }
    }

    setServiceLines(lines);
  }, [
    selectedMaterial, selectedEquipment, imposition, quantity, sides, colorMode,
    cuttingEnabled, sheetsPerCutStack, foldingType, drillingType, finishing,
    lookupClickPrice,
  ]);

  // Recalculate whenever inputs change
  useEffect(() => {
    recalculatePricing();
  }, [recalculatePricing]);

  // ── Product suggestions ───────────────────────────────────────────────

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 1) return [];
    return searchProducts(searchQuery).slice(0, 8);
  }, [searchQuery, searchProducts]);

  // ── Select product → fill defaults ────────────────────────────────────

  const selectProduct = useCallback((product: PricingProduct) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setShowSuggestions(false);
    setQuantity(product.defaultQuantity);
    setFinalWidth(product.defaultFinalWidth);
    setFinalHeight(product.defaultFinalHeight);
    setColorMode(product.defaultColor === 'Black' ? 'Black' : 'Color');
    setSides(product.defaultSides);
    setFoldingType(product.defaultFolding || '');
    setDrillingType('');
    setCuttingEnabled(true);
    setSheetsPerCutStack(500);

    // Find matching material
    if (product.defaultMaterialName) {
      const mat = materials.find((m) =>
        m.name.toLowerCase().includes(product.defaultMaterialName!.toLowerCase().split(' ').slice(-2).join(' '))
      );
      if (mat) setSelectedMaterialId(mat.id);
    }

    // Set equipment
    if (product.defaultEquipmentId) {
      setSelectedEquipmentId(product.defaultEquipmentId);
    }
  }, [materials]);

  // ── Load from template ────────────────────────────────────────────────

  const loadTemplate = useCallback((tmpl: ProductPricingTemplate) => {
    incrementTemplateUsage(tmpl.id);
    setSearchQuery(tmpl.productName);
    const prod = products.find((p) => p.id === tmpl.productId);
    setSelectedProduct(prod || null);
    setQuantity(tmpl.quantity);
    setFinalWidth(tmpl.finalWidth);
    setFinalHeight(tmpl.finalHeight);
    setColorMode(tmpl.color === 'Black' ? 'Black' : 'Color');
    setSides(tmpl.sides);
    setFoldingType(tmpl.folding || '');
    setCuttingEnabled(true);

    if (tmpl.materialId) setSelectedMaterialId(tmpl.materialId);
    else if (tmpl.materialName) {
      const mat = materials.find((m) => m.name === tmpl.materialName);
      if (mat) setSelectedMaterialId(mat.id);
    }
    if (tmpl.equipmentId) setSelectedEquipmentId(tmpl.equipmentId);
  }, [products, materials, incrementTemplateUsage]);

  // ── Save as template ──────────────────────────────────────────────────

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const cat = selectedProduct
      ? categories.find((c) => c.id === selectedProduct.categoryId)
      : null;
    addTemplate({
      name: templateName,
      categoryId: cat?.id || '',
      categoryName: cat?.name || '',
      productId: selectedProduct?.id,
      productName: selectedProduct?.name || searchQuery,
      quantity,
      finalWidth,
      finalHeight,
      materialId: selectedMaterialId || undefined,
      materialName: selectedMaterial?.name,
      equipmentId: selectedEquipmentId || undefined,
      equipmentName: selectedEquipment?.name,
      color: colorMode,
      sides,
      folding: foldingType || undefined,
      isFavorite: false,
    });
    setShowSaveTemplate(false);
    setTemplateName('');
  };

  // ── Clear all ─────────────────────────────────────────────────────────

  const handleClear = () => {
    setSearchQuery('');
    setSelectedProduct(null);
    setQuantity(1000);
    setFinalWidth(0);
    setFinalHeight(0);
    setSelectedMaterialId('');
    setSelectedEquipmentId('');
    setColorMode('Color');
    setSides('Double');
    setFoldingType('');
    setDrillingType('');
    setCuttingEnabled(true);
    setSheetsPerCutStack(500);
    setServiceLines([]);
  };

  // ── Inline edit service line ──────────────────────────────────────────

  const startEditLine = (line: PricingServiceLine) => {
    setEditingLineId(line.id);
    setEditValues({
      totalCost: line.totalCost,
      markupPercent: line.markupPercent,
      sellPrice: line.sellPrice,
    });
  };

  const applyEditLine = () => {
    if (!editingLineId) return;
    setServiceLines((prev) =>
      prev.map((l) => {
        if (l.id !== editingLineId) return l;
        const cost = editValues.totalCost ?? l.totalCost;
        const markup = editValues.markupPercent ?? l.markupPercent;
        const sell = cost * (1 + markup / 100);
        return { ...l, totalCost: cost, markupPercent: markup, sellPrice: sell };
      })
    );
    setEditingLineId(null);
    setEditValues({});
  };

  const cancelEditLine = () => {
    setEditingLineId(null);
    setEditValues({});
  };

  // ── Totals ────────────────────────────────────────────────────────────

  const totalCost = serviceLines.reduce((s, l) => s + l.totalCost, 0);
  const totalSellPrice = serviceLines.reduce((s, l) => s + l.sellPrice, 0);
  const overallMargin = totalSellPrice > 0 ? ((totalSellPrice - totalCost) / totalSellPrice) * 100 : 0;
  const perUnitSell = quantity > 0 ? totalSellPrice / quantity : 0;

  // ── Filtered templates ────────────────────────────────────────────────

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.toLowerCase();
    return templates
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.productName.toLowerCase().includes(q))
      .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || b.usageCount - a.usageCount);
  }, [templates, templateSearch]);

  // Folding options from finishing data
  const foldingOptions = finishing.filter((f) => f.service === 'Fold').map((f) => f.subservice || '');
  const drillingOptions = finishing.filter((f) => f.service === 'Drill').map((f) => f.subservice || '');

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="flex gap-6 min-h-[calc(100vh-5rem)]">
      {/* ── LEFT: Main pricing area ────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Pricing Tool"
          subtitle="Calculate costs and sell prices for print products"
          actions={
            <div className="flex items-center gap-2">
              <Button size="sm" icon={<Settings2 className="w-4 h-4" />} onClick={() => setShowSettingsPanel(true)}>
                Manage Data
              </Button>
              <Button size="sm" variant="ghost" icon={<RotateCcw className="w-4 h-4" />} onClick={handleClear}>
                Clear
              </Button>
            </div>
          }
        />

        {/* ── PRODUCT SEARCH ─────────────────────────────────────────── */}
        <Card className="p-5 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <Search className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Product</h3>
            {selectedProduct && (
              <Badge color="blue">{categoryName}</Badge>
            )}
          </div>
          <div className="relative mt-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                if (!e.target.value.trim()) setSelectedProduct(null);
              }}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              placeholder="Type a product name (e.g. Business Cards, Postcards, Brochures, Trifold...)"
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
            {searchQuery && !selectedProduct && (
              <button onClick={() => { setSearchQuery(''); setSelectedProduct(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && !selectedProduct && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">{p.name}</span>
                        {p.aliases.length > 0 && (
                          <span className="text-xs text-gray-400 ml-2">
                            aka {p.aliases.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>
                      <Badge color="gray">{cat?.name || 'Uncategorized'}</Badge>
                    </button>
                  );
                })}
              </div>
            )}

            {showSuggestions && searchQuery.trim().length > 0 && suggestions.length === 0 && !selectedProduct && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">No products match "{searchQuery}"</p>
                <Button size="sm" icon={<Plus className="w-3 h-3" />} onClick={() => {
                  setNewProduct((p) => ({ ...p, name: searchQuery }));
                  setShowAddProductModal(true);
                  setShowSuggestions(false);
                }}>
                  Create "{searchQuery}" as new product
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* ── CONFIGURATION ──────────────────────────────────────────── */}
        {(selectedProduct || searchQuery) && (
          <Card className="p-5 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" /> Configuration
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Quantity</label>
                <input type="number" value={quantity} min={1}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Final Width (in)</label>
                <input type="number" step="0.125" value={finalWidth} min={0}
                  onChange={(e) => setFinalWidth(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Final Height (in)</label>
                <input type="number" step="0.125" value={finalHeight} min={0}
                  onChange={(e) => setFinalHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color</label>
                <select value={colorMode} onChange={(e) => setColorMode(e.target.value as 'Color' | 'Black')}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                  <option value="Color">Color</option>
                  <option value="Black">Black & White</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sides</label>
                <select value={sides} onChange={(e) => setSides(e.target.value as 'Single' | 'Double')}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                  <option value="Single">Single Sided</option>
                  <option value="Double">Double Sided</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Equipment</label>
                <select value={selectedEquipmentId} onChange={(e) => setSelectedEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                  <option value="">— Select —</option>
                  {availableEquipment.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Material</label>
                <select value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                  <option value="">— Select material —</option>
                  {availableMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.size}) — {fmt(m.pricePerM)}/M
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* ── IMPOSITION PREVIEW ─────────────────────────────────────── */}
        {selectedMaterial && imposition.totalUps > 0 && (
          <Card className="p-5 mb-4">
            <button
              onClick={() => setShowImposition(!showImposition)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-gray-400" /> Imposition Layout
              </h3>
              {showImposition ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showImposition && (
              <div className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600 font-medium">Parent Sheet</p>
                    <p className="text-lg font-bold text-blue-900">{selectedMaterial.size}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-emerald-600 font-medium">Ups Per Sheet</p>
                    <p className="text-lg font-bold text-emerald-900">{imposition.totalUps}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-purple-600 font-medium">Layout</p>
                    <p className="text-lg font-bold text-purple-900">{imposition.upsAcross} × {imposition.upsDown}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-amber-600 font-medium">Sheets Needed</p>
                    <p className="text-lg font-bold text-amber-900">{imposition.sheetsNeeded.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 font-medium">Cuts / Sheet</p>
                    <p className="text-lg font-bold text-gray-900">{imposition.cutsPerSheet}</p>
                  </div>
                </div>

                {/* Visual grid */}
                <div className="flex justify-center">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded relative bg-white"
                    style={{
                      width: Math.min(400, selectedMaterial.sizeWidth * 18),
                      height: Math.min(300, selectedMaterial.sizeHeight * 18),
                    }}
                  >
                    <div className="absolute inset-0 p-1 flex flex-wrap content-start gap-[1px]">
                      {Array.from({ length: Math.min(imposition.totalUps, 100) }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-blue-100 border border-blue-300 rounded-sm flex items-center justify-center"
                          style={{
                            width: Math.max(8, (finalWidth / selectedMaterial.sizeWidth) * Math.min(396, selectedMaterial.sizeWidth * 18 - 8)),
                            height: Math.max(8, (finalHeight / selectedMaterial.sizeHeight) * Math.min(296, selectedMaterial.sizeHeight * 18 - 8)),
                          }}
                        >
                          <span className="text-[7px] text-blue-500 font-bold">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400">
                      {selectedMaterial.sizeWidth}" × {selectedMaterial.sizeHeight}"
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── FINISHING OPTIONS ───────────────────────────────────────── */}
        {(selectedProduct || selectedMaterial) && (
          <Card className="p-5 mb-4">
            <button
              onClick={() => setShowFinishing(!showFinishing)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-gray-400" /> Finishing
              </h3>
              {showFinishing ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showFinishing && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cutting */}
                <div className={`rounded-xl border-2 p-4 transition-all ${cuttingEnabled ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input type="checkbox" checked={cuttingEnabled} onChange={(e) => setCuttingEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <Scissors className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Cutting</span>
                  </label>
                  {cuttingEnabled && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sheets per cut stack</label>
                      <input type="number" value={sheetsPerCutStack} min={1}
                        onChange={(e) => setSheetsPerCutStack(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Folding */}
                <div className={`rounded-xl border-2 p-4 transition-all ${foldingType ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <FoldVertical className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Folding</span>
                  </div>
                  <select value={foldingType} onChange={(e) => setFoldingType(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="">None</option>
                    {foldingOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Drilling */}
                <div className={`rounded-xl border-2 p-4 transition-all ${drillingType ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CircleDot className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Drilling</span>
                  </div>
                  <select value={drillingType} onChange={(e) => setDrillingType(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="">None</option>
                    {drillingOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── PRICE BREAKDOWN TABLE ──────────────────────────────────── */}
        {serviceLines.length > 0 && (
          <Card className="mb-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" /> Price Breakdown
              </h3>
              <span className="text-xs text-gray-400">Click a row to edit costs & markup</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Markup</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sell Price</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {serviceLines.map((line) => {
                    const isEditing = editingLineId === line.id;
                    return (
                      <tr
                        key={line.id}
                        className={`transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                        onClick={() => !isEditing && startEditLine(line)}
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            {line.service === 'Material' && <Package className="w-3.5 h-3.5 text-amber-500" />}
                            {line.service === 'Printing' && <Printer className="w-3.5 h-3.5 text-blue-500" />}
                            {line.service === 'Setup' && <Settings2 className="w-3.5 h-3.5 text-gray-400" />}
                            {line.service === 'Cutting' && <Scissors className="w-3.5 h-3.5 text-purple-500" />}
                            {line.service === 'Folding' && <FoldVertical className="w-3.5 h-3.5 text-emerald-500" />}
                            {line.service === 'Drilling' && <CircleDot className="w-3.5 h-3.5 text-orange-500" />}
                            <span className="font-medium text-gray-900">{line.service}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-gray-600 text-xs max-w-[300px]">
                          {line.description}
                        </td>
                        <td className="py-3 px-5 text-right font-mono">
                          {isEditing ? (
                            <input
                              type="number" step="0.01"
                              value={editValues.totalCost ?? line.totalCost}
                              onChange={(e) => setEditValues((v) => ({ ...v, totalCost: parseFloat(e.target.value) || 0 }))}
                              onClick={(e) => e.stopPropagation()}
                              className="w-24 px-2 py-1 text-right text-sm border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-gray-700">{fmt(line.totalCost)}</span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right font-mono">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number" step="0.1"
                                value={editValues.markupPercent ?? line.markupPercent}
                                onChange={(e) => setEditValues((v) => ({ ...v, markupPercent: parseFloat(e.target.value) || 0 }))}
                                onClick={(e) => e.stopPropagation()}
                                className="w-20 px-2 py-1 text-right text-sm border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                          ) : (
                            <span className={`${line.markupPercent > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {fmtPct(line.markupPercent)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right font-mono font-semibold text-gray-900">
                          {isEditing ? (
                            fmt((editValues.totalCost ?? line.totalCost) * (1 + (editValues.markupPercent ?? line.markupPercent) / 100))
                          ) : (
                            fmt(line.sellPrice)
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); applyEditLine(); }}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); cancelEditLine(); }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <Edit3 className="w-3.5 h-3.5 text-gray-300" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Cost</p>
                  <p className="text-lg font-bold text-gray-700">{fmt(totalCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Sell Price</p>
                  <p className="text-lg font-bold text-blue-700">{fmt(totalSellPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Gross Margin</p>
                  <p className={`text-lg font-bold ${overallMargin >= 30 ? 'text-emerald-600' : overallMargin >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                    {fmtPct(overallMargin)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Price Per Unit</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(perUnitSell)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
              <Button size="sm" variant="primary" icon={<Save className="w-3.5 h-3.5" />}
                onClick={() => { setTemplateName(selectedProduct?.name ? `${selectedProduct.name} — ${quantity} ${colorMode}` : ''); setShowSaveTemplate(true); }}>
                Save as Template
              </Button>
              <Button size="sm" icon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  const text = serviceLines.map((l) => `${l.service}\t${l.description}\t${fmt(l.totalCost)}\t${fmtPct(l.markupPercent)}\t${fmt(l.sellPrice)}`).join('\n');
                  navigator.clipboard.writeText(`Service\tDescription\tCost\tMarkup\tSell Price\n${text}\n\nTotal Cost: ${fmt(totalCost)}\tTotal Sell: ${fmt(totalSellPrice)}`);
                }}>
                Copy to Clipboard
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* ── RIGHT: Templates sidebar ─────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 hidden lg:block">
        <div className="sticky top-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" /> Templates
              </h3>
              <span className="text-xs text-gray-400">{templates.length}</span>
            </div>
            <div className="px-3 py-2 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text" value={templateSearch} onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto divide-y divide-gray-50">
              {filteredTemplates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => loadTemplate(tmpl)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50/50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">{tmpl.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {tmpl.categoryName} · {tmpl.quantity.toLocaleString()} pcs
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {tmpl.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTemplate(tmpl.id, { isFavorite: !tmpl.isFavorite });
                        }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-amber-500 text-gray-300"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(tmpl.id); }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500 text-gray-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
              {filteredTemplates.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-gray-400">No templates yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ═══ MODALS ════════════════════════════════════════════════════ */}

      {/* Save Template Modal */}
      <Modal isOpen={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} title="Save as Template" size="sm">
        <div className="space-y-4">
          <Input label="Template Name" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Business Cards — 1000 Color 2-Sided" />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowSaveTemplate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveTemplate} disabled={!templateName.trim()}>Save Template</Button>
          </div>
        </div>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={showAddCategoryModal} onClose={() => setShowAddCategoryModal(false)} title="Add Category" size="sm">
        <div className="space-y-4">
          <Input label="Category Name" value={newCategory.name}
            onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Wide Format, Apparel" />
          <Input label="Description (optional)" value={newCategory.description}
            onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddCategoryModal(false)}>Cancel</Button>
            <Button variant="primary" disabled={!newCategory.name.trim()} onClick={() => {
              addCategory({ name: newCategory.name, description: newCategory.description, sortOrder: categories.length + 1 });
              setNewCategory({ name: '', description: '' });
              setShowAddCategoryModal(false);
            }}>Add Category</Button>
          </div>
        </div>
      </Modal>

      {/* Add Product Modal */}
      <Modal isOpen={showAddProductModal} onClose={() => setShowAddProductModal(false)} title="Add Product" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
              <select value={newProduct.categoryId} onChange={(e) => setNewProduct((p) => ({ ...p, categoryId: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="">— Select —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Product Name" value={newProduct.name}
              onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Yard Signs" />
          </div>
          <Input label="Aliases (comma separated)" value={newProduct.aliases}
            onChange={(e) => setNewProduct((p) => ({ ...p, aliases: e.target.value }))}
            placeholder="e.g. Lawn Signs, Political Signs" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Default Quantity" type="number" value={String(newProduct.defaultQuantity)}
              onChange={(e) => setNewProduct((p) => ({ ...p, defaultQuantity: parseInt(e.target.value) || 0 }))} />
            <Input label="Default Final Size" value={newProduct.defaultFinalSize}
              onChange={(e) => setNewProduct((p) => ({ ...p, defaultFinalSize: e.target.value }))}
              placeholder="e.g. 18x24" />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Equipment</label>
              <select value={newProduct.defaultEquipmentId} onChange={(e) => setNewProduct((p) => ({ ...p, defaultEquipmentId: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="">— Select —</option>
                {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color</label>
              <select value={newProduct.defaultColor} onChange={(e) => setNewProduct((p) => ({ ...p, defaultColor: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="Color">Color</option>
                <option value="Black">Black</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sides</label>
              <select value={newProduct.defaultSides} onChange={(e) => setNewProduct((p) => ({ ...p, defaultSides: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="Single">Single</option>
                <option value="Double">Double</option>
              </select>
            </div>
            <Input label="Default Folding" value={newProduct.defaultFolding}
              onChange={(e) => setNewProduct((p) => ({ ...p, defaultFolding: e.target.value }))}
              placeholder="e.g. Tri-Fold" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddProductModal(false)}>Cancel</Button>
            <Button variant="primary" disabled={!newProduct.name.trim() || !newProduct.categoryId} onClick={() => {
              const sz = parseSize(newProduct.defaultFinalSize);
              const eq = equipment.find((e) => e.id === newProduct.defaultEquipmentId);
              addProduct({
                categoryId: newProduct.categoryId,
                name: newProduct.name,
                aliases: newProduct.aliases.split(',').map((a) => a.trim()).filter(Boolean),
                defaultQuantity: newProduct.defaultQuantity,
                defaultFinalSize: newProduct.defaultFinalSize,
                defaultFinalWidth: sz.w, defaultFinalHeight: sz.h,
                defaultEquipmentId: newProduct.defaultEquipmentId || undefined,
                defaultEquipmentName: eq?.name,
                defaultColor: newProduct.defaultColor,
                defaultSides: newProduct.defaultSides,
                defaultFolding: newProduct.defaultFolding || undefined,
              });
              setNewProduct({ categoryId: '', name: '', aliases: '', defaultQuantity: 1000, defaultFinalSize: '', defaultColor: 'Color', defaultSides: 'Double', defaultEquipmentId: '', defaultFolding: '' });
              setShowAddProductModal(false);
            }}>Add Product</Button>
          </div>
        </div>
      </Modal>

      {/* Add Equipment Modal */}
      <Modal isOpen={showAddEquipmentModal} onClose={() => setShowAddEquipmentModal(false)} title="Add Equipment" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Equipment Name" value={newEquipment.name}
              onChange={(e) => setNewEquipment((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Xerox C70" />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Applies to Category</label>
              <select value={newEquipment.categoryApplies} onChange={(e) => setNewEquipment((p) => ({ ...p, categoryApplies: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="">— Select —</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cost Unit</label>
              <select value={newEquipment.costUnit} onChange={(e) => setNewEquipment((p) => ({ ...p, costUnit: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="per_click">Per Click</option>
                <option value="per_sqft">Per Sq Ft</option>
              </select>
            </div>
            <Input label="Unit Cost ($)" type="number" step="0.001" value={String(newEquipment.unitCost)}
              onChange={(e) => setNewEquipment((p) => ({ ...p, unitCost: parseFloat(e.target.value) || 0 }))} />
            <Input label="Markup Multiplier" type="number" step="0.1" value={String(newEquipment.markupMultiplier)}
              onChange={(e) => setNewEquipment((p) => ({ ...p, markupMultiplier: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g. 7" />
          </div>
          <Input label="Initial Setup Fee ($)" type="number" step="1" value={String(newEquipment.initialSetupFee)}
            onChange={(e) => setNewEquipment((p) => ({ ...p, initialSetupFee: parseFloat(e.target.value) || 0 }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddEquipmentModal(false)}>Cancel</Button>
            <Button variant="primary" disabled={!newEquipment.name.trim()} onClick={() => {
              addPricingEquipment({
                name: newEquipment.name,
                categoryApplies: newEquipment.categoryApplies,
                colorCapability: newEquipment.colorCapability,
                costUnit: newEquipment.costUnit,
                costType: newEquipment.costType,
                unitCost: newEquipment.unitCost,
                markupMultiplier: newEquipment.markupMultiplier || undefined,
                initialSetupFee: newEquipment.initialSetupFee,
              });
              setNewEquipment({ name: '', categoryApplies: '', colorCapability: 'Color and Black', costUnit: 'per_click', costType: 'cost_only', unitCost: 0, markupMultiplier: 0, initialSetupFee: 0 });
              setShowAddEquipmentModal(false);
            }}>Add Equipment</Button>
          </div>
        </div>
      </Modal>

      {/* Add Finishing Modal */}
      <Modal isOpen={showAddFinishingModal} onClose={() => setShowAddFinishingModal(false)} title="Add Finishing Service" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Service" value={newFinishing.service}
              onChange={(e) => setNewFinishing((p) => ({ ...p, service: e.target.value }))}
              placeholder="e.g. Laminate, Staple" />
            <Input label="Subservice (optional)" value={newFinishing.subservice}
              onChange={(e) => setNewFinishing((p) => ({ ...p, subservice: e.target.value }))}
              placeholder="e.g. Gloss, Matte" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Output Per Hour" type="number" value={String(newFinishing.outputPerHour)}
              onChange={(e) => setNewFinishing((p) => ({ ...p, outputPerHour: parseInt(e.target.value) || 0 }))} />
            <Input label="Hourly Cost ($)" type="number" step="1" value={String(newFinishing.hourlyCost)}
              onChange={(e) => setNewFinishing((p) => ({ ...p, hourlyCost: parseFloat(e.target.value) || 0 }))} />
            <Input label="Markup (%)" type="number" step="1" value={String(newFinishing.timeCostMarkup)}
              onChange={(e) => setNewFinishing((p) => ({ ...p, timeCostMarkup: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddFinishingModal(false)}>Cancel</Button>
            <Button variant="primary" disabled={!newFinishing.service.trim()} onClick={() => {
              addFinishing({
                service: newFinishing.service,
                subservice: newFinishing.subservice || undefined,
                costType: 'time_only',
                outputPerHour: newFinishing.outputPerHour,
                hourlyCost: newFinishing.hourlyCost,
                timeCostMarkup: newFinishing.timeCostMarkup,
              });
              setNewFinishing({ service: '', subservice: '', outputPerHour: 0, hourlyCost: 40, timeCostMarkup: 0 });
              setShowAddFinishingModal(false);
            }}>Add Finishing</Button>
          </div>
        </div>
      </Modal>

      {/* Add Material Modal */}
      <Modal isOpen={showAddMaterialModal} onClose={() => setShowAddMaterialModal(false)} title="Add Material" size="md">
        <div className="space-y-4">
          <Input label="Material Name" value={newMaterial.name}
            onChange={(e) => setNewMaterial((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. 100# Gloss Cover" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Sheet Size" value={newMaterial.size}
              onChange={(e) => setNewMaterial((p) => ({ ...p, size: e.target.value }))}
              placeholder="e.g. 12x18" />
            <Input label="Price per 1,000" type="number" step="0.01" value={String(newMaterial.pricePerM)}
              onChange={(e) => setNewMaterial((p) => ({ ...p, pricePerM: parseFloat(e.target.value) || 0 }))} />
            <Input label="Markup (%)" type="number" step="1" value={String(newMaterial.markup)}
              onChange={(e) => setNewMaterial((p) => ({ ...p, markup: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddMaterialModal(false)}>Cancel</Button>
            <Button variant="primary" disabled={!newMaterial.name.trim() || !newMaterial.size.trim()} onClick={() => {
              const sz = parseSize(newMaterial.size);
              addPricingMaterial({
                name: newMaterial.name,
                size: newMaterial.size,
                sizeWidth: sz.w, sizeHeight: sz.h,
                pricePerM: newMaterial.pricePerM,
                markup: newMaterial.markup,
              });
              setNewMaterial({ name: '', size: '', pricePerM: 0, markup: 70 });
              setShowAddMaterialModal(false);
            }}>Add Material</Button>
          </div>
        </div>
      </Modal>

      {/* ═══ MANAGE DATA SETTINGS PANEL ══════════════════════════════ */}
      <Modal isOpen={showSettingsPanel} onClose={() => setShowSettingsPanel(false)} title="Manage Pricing Data" size="2xl">
        <div className="flex gap-1 border-b border-gray-100 mb-4 -mt-2">
          {(['categories', 'products', 'equipment', 'finishing', 'materials'] as const).map((tab) => (
            <button key={tab} onClick={() => setSettingsTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px capitalize ${settingsTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Categories Tab */}
        {settingsTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-500">{categories.length} categories</p>
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setShowSettingsPanel(false); setShowAddCategoryModal(true); }}>
                Add Category
              </Button>
            </div>
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
                  </div>
                  <span className="text-xs text-gray-400">{products.filter((p) => p.categoryId === c.id).length} products</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {settingsTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-500">{products.length} products</p>
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setShowSettingsPanel(false); setShowAddProductModal(true); }}>
                Add Product
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Aliases</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Size</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Equipment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-900">{p.name}</td>
                      <td className="py-2 px-3"><Badge color="blue">{categories.find((c) => c.id === p.categoryId)?.name || '—'}</Badge></td>
                      <td className="py-2 px-3 text-xs text-gray-500">{p.aliases.join(', ') || '—'}</td>
                      <td className="py-2 px-3 text-gray-700">{p.defaultFinalSize}</td>
                      <td className="py-2 px-3 text-gray-700">{p.defaultQuantity.toLocaleString()}</td>
                      <td className="py-2 px-3 text-gray-700">{p.defaultEquipmentName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {settingsTab === 'equipment' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-500">{equipment.length} equipment</p>
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setShowSettingsPanel(false); setShowAddEquipmentModal(true); }}>
                Add Equipment
              </Button>
            </div>
            <div className="space-y-2">
              {equipment.map((e) => (
                <div key={e.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{e.name}</span>
                      <Badge color="gray" className="ml-2">{e.categoryApplies}</Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {e.costUnit === 'per_click' ? `${fmt(e.unitCost)}/click` : `${fmt(e.unitCost)}/sqft`}
                      {e.markupMultiplier ? ` × ${e.markupMultiplier}x` : ''}
                    </div>
                  </div>
                  {e.colorTiers && e.colorTiers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {e.colorTiers.map((t, i) => (
                        <span key={i} className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">
                          {t.minQty}+: {fmt(t.pricePerUnit)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Finishing Tab */}
        {settingsTab === 'finishing' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-500">{finishing.length} finishing services</p>
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setShowSettingsPanel(false); setShowAddFinishingModal(true); }}>
                Add Finishing
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Service</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Sub-service</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Output/Hr</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">$/Hr</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Markup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {finishing.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-900">{f.service}</td>
                      <td className="py-2 px-3 text-gray-700">{f.subservice || '—'}</td>
                      <td className="py-2 px-3 text-gray-700">{f.outputPerHour.toLocaleString()}</td>
                      <td className="py-2 px-3 text-gray-700">{fmt(f.hourlyCost)}</td>
                      <td className="py-2 px-3 text-gray-700">{f.timeCostMarkup}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {settingsTab === 'materials' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-500">{materials.length} materials</p>
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setShowSettingsPanel(false); setShowAddMaterialModal(true); }}>
                Add Material
              </Button>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Material</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Size</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">$/M</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Markup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {materials.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-900 text-xs">{m.name}</td>
                      <td className="py-2 px-3 text-gray-700">{m.size}</td>
                      <td className="py-2 px-3 text-right text-gray-700">{fmt(m.pricePerM)}</td>
                      <td className="py-2 px-3 text-right text-gray-700">{m.markup}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
