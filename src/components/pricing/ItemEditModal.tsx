import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Search, X, Scissors, FoldVertical, CircleDot, Printer,
  Package, DollarSign, Grid3X3, Edit3, Check, Star, Settings2,
  Percent, Hash, Info, RefreshCw, Eye, Layers, Wrench, Hand,
} from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Badge, ConfirmDialog } from '../../components/ui';
import type { QuoteLineItem } from '../../types';
import type { PricingProduct, PricingServiceLine, ProductPricingTemplate } from '../../types/pricing';
import { formatCurrency } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = (n: number) => formatCurrency(n);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
// Stable deterministic IDs — must not change between renders so edit mode survives re-renders
export const slId = (service: string, index = 0) => `sl_${service.toLowerCase().replace(/\s+/g, '_')}_${index}`;

// ─── PER-LINE-ITEM PRICING STATE ────────────────────────────────────────────

export interface LineItemPricingState {
  productId: string;
  productName: string;
  categoryName: string;
  quantity: number;
  originals: number;               // number of unique designs (default 1). Each original multiplies qty for sheet/click calc.
  finalWidth: number;
  finalHeight: number;
  materialId: string;
  equipmentId: string;
  colorMode: 'Color' | 'Black';
  sides: 'Single' | 'Double';
  foldingType: string;
  drillingType: string;
  cuttingEnabled: boolean;
  sheetsPerStack: number;
  serviceLines: PricingServiceLine[];
  // Persisted service selections — so Labor and Brokered survive navigation
  selectedLaborIds: string[];
  selectedBrokeredIds: string[];
  // Per-service custom notes (keyed by service selection ID)
  serviceNotes: Record<string, string>;
}

export const DEFAULT_PRICING_STATE = (): LineItemPricingState => ({
  productId: '', productName: '', categoryName: '',
  quantity: 1000, originals: 1, finalWidth: 0, finalHeight: 0,
  materialId: '', equipmentId: '',
  colorMode: 'Color', sides: 'Double',
  foldingType: '', drillingType: '',
  cuttingEnabled: true, sheetsPerStack: 500,
  serviceLines: [],
  selectedLaborIds: [],
  selectedBrokeredIds: [],
  serviceNotes: {},
});

// ─── PART SNAPSHOT ──────────────────────────────────────────────────────────

interface PartSnapshot {
  id: string;
  partName: string;
  partDescription: string;
  // Full form state snapshot for this part
  pricingState: LineItemPricingState;
  productQuery: string;
  sizeInput: string;
  multiQtyInput: string;
  totalCost: number;
  totalSell: number;
  serviceLines: PricingServiceLine[];
}

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT EDIT MODAL — full pricing engine in a modal dialog
// ═════════════════════════════════════════════════════════════════════════════

interface ProductEditModalProps {
  item: QuoteLineItem;
  pricingState: LineItemPricingState;
  isNew: boolean;
  onUpdateItem: (u: Partial<QuoteLineItem>) => void;
  onUpdatePricing: (u: Partial<LineItemPricingState>) => void;
  onClose: () => void;
  onRemove: () => void;
  matchingTemplates: ProductPricingTemplate[];
  onApplyTemplate: (tmplId: string) => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  item, pricingState: ps, isNew,
  onUpdateItem, onUpdatePricing, onClose, onRemove,
  matchingTemplates, onApplyTemplate,
}) => {
  const pricing = usePricingStore();
  const { categories, products, equipment, finishing, materials, finishingGroups,
    searchProducts, getEquipmentForCategory, calculateImposition, lookupClickPrice } = pricing;

  // ── Local UI state ────────────────────────────────────────────────────
  const [productQuery, setProductQuery] = useState(ps.productName || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Global product search for multi-part item name
  const [showGlobalSuggestions, setShowGlobalSuggestions] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PricingServiceLine>>({});
  // Track whether any pricing change has been made since the modal opened.
  // On first render, the recompute effect must NOT overwrite existing item fields
  // (e.g. materialName from savedItem) with stale computed values.
  const userChangedPricing = React.useRef(false);

  // Guard: if the item already has computed service lines stored in pricingContext,
  // skip the initial recompute that fires on mount — it would overwrite manual edits
  // that were previously made in the breakdown dialog. This ref resets to false the
  // first time the user changes a fundamental field (material, equipment, quantity, etc.),
  // at which point a fresh recompute is appropriate.
  const skipInitialRecompute = React.useRef(ps.serviceLines != null && ps.serviceLines.length > 0);
  const [savedAsTemplate, setSavedAsTemplate] = useState(false);
  const [multiQtyInput, setMultiQtyInput] = useState(String(ps.quantity || 1000));
  // Auto-describe is ON only for brand-new items (no existing description).
  // If the item already has a description written by the user, default to OFF
  // so we never overwrite what they typed.
  const [autoDescribe, setAutoDescribe] = useState(() => !item.description);
  const [sizeInput, setSizeInput] = useState(
    ps.finalWidth > 0 && ps.finalHeight > 0 ? `${ps.finalWidth}x${ps.finalHeight}` : ''
  );
  const [sizeError, setSizeError] = useState('');

  // ── Imposition calculator state ──────────────────────────────────────
  const [showImpositionCalc, setShowImpositionCalc] = useState(false);
  const [impositionBleed, setImpositionBleed] = useState(0.125);
  const [impositionGutter, setImpositionGutter] = useState(0);
  const [impositionOrientation, setImpositionOrientation] = useState<'auto' | 'A' | 'B'>('auto');
  const [runSizeInput, setRunSizeInput] = useState('');
  const [customRunWidth, setCustomRunWidth] = useState(0);
  const [customRunHeight, setCustomRunHeight] = useState(0);

  // ── Template panel state ─────────────────────────────────────────────
  const [templatePanelCollapsed, setTemplatePanelCollapsed] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // ── Price breakdown state ────────────────────────────────────────────
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});
  const [showBreakdownDialog, setShowBreakdownDialog] = useState(false);

  // ── Multi-part state — restore from item if it was previously saved as multi-part ──
  const [isMultiPart, setIsMultiPart] = useState(() => !!(item as any).isMultiPart);
  const [globalProduct, setGlobalProduct] = useState(() => (item as any).multiPartName || '');
  const [globalDescription, setGlobalDescription] = useState(() => (item as any).multiPartDescription || '');
  const [showDeletePartConfirm, setShowDeletePartConfirm] = useState<number | null>(null);
  const [parts, setParts] = useState<PartSnapshot[]>(() => {
    const savedParts = (item as any).parts as Array<{ id: string; partName: string; partDescription: string; totalCost: number; totalSell: number }> | undefined;
    if (savedParts && savedParts.length > 0) {
      // Rebuild snapshots from saved lightweight parts — pricing state starts blank (user re-edits to reprice)
      return savedParts.map(p => ({
        id: p.id,
        partName: p.partName,
        partDescription: p.partDescription,
        pricingState: DEFAULT_PRICING_STATE(),
        productQuery: '',
        sizeInput: '',
        multiQtyInput: '1000',
        totalCost: p.totalCost,
        totalSell: p.totalSell,
        serviceLines: [],
      }));
    }
    return [];
  });
  const [activePartIdx, setActivePartIdx] = useState(0);
  // Show overview tab by default when re-opening an existing multi-part item
  const [showMainTab, setShowMainTab] = useState(() => !!(item as any).isMultiPart && !!((item as any).parts?.length));

  // ── Multi-material entries ────────────────────────────────────────────
  const [materialEntries, setMaterialEntries] = useState<Array<{
    materialId: string;
    sides: 'Single' | 'Double';
    colorMode: 'Color' | 'Black';
    originals: number;
  }>>([{
    materialId: ps.materialId || '',
    sides: ps.sides,
    colorMode: ps.colorMode,
    originals: 1,
  }]);

  // ── Services selection state ──────────────────────────────────────────
  const [selectedFinishingIds, setSelectedFinishingIds] = useState<string[]>(() => {
    const ids: string[] = [];
    if (ps.cuttingEnabled) {
      const cutSvc = finishing.find(f => f.name === 'Cut');
      if (cutSvc) ids.push(cutSvc.id);
    }
    if (ps.foldingType) {
      const fSvc = finishing.find(f => f.name.toLowerCase().replace('-', '') === ps.foldingType.toLowerCase().replace('-', ''));
      if (fSvc) ids.push(fSvc.id);
    }
    if (ps.drillingType) {
      const dSvc = finishing.find(f => f.name === ps.drillingType);
      if (dSvc) ids.push(dSvc.id);
    }
    return ids;
  });
  // Restore from pricingContext (ps) if available — this is what survives navigation
  const [selectedLaborIds, setSelectedLaborIds] = useState<string[]>(() => ps.selectedLaborIds ?? []);
  const [selectedBrokeredIds, setSelectedBrokeredIds] = useState<string[]>(() => ps.selectedBrokeredIds ?? []);

  // Sync labor/brokered selections into pricing state so they persist in pricingContext
  useEffect(() => {
    if (JSON.stringify(selectedLaborIds) !== JSON.stringify(ps.selectedLaborIds ?? [])) {
      onUpdatePricing({ selectedLaborIds });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLaborIds]);

  useEffect(() => {
    if (JSON.stringify(selectedBrokeredIds) !== JSON.stringify(ps.selectedBrokeredIds ?? [])) {
      onUpdatePricing({ selectedBrokeredIds });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrokeredIds]);

  // Sync first material entry to pricing state
  useEffect(() => {
    if (materialEntries.length > 0) {
      const first = materialEntries[0];
      if (first.materialId !== ps.materialId || first.sides !== ps.sides || first.colorMode !== ps.colorMode) {
        onUpdatePricing({
          materialId: first.materialId,
          sides: first.sides,
          colorMode: first.colorMode,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialEntries]);

  // Sync material entries from pricing state when externally changed (template load, product select).
  // Skip the FIRST render — materialEntries is already initialized from ps, so there's nothing to sync.
  // Firing on mount creates a new array reference which triggers Effect 1 unnecessarily.
  const materialSyncMounted = React.useRef(false);
  useEffect(() => {
    if (!materialSyncMounted.current) { materialSyncMounted.current = true; return; }
    setMaterialEntries(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[0] = { ...updated[0], materialId: ps.materialId || '', sides: ps.sides, colorMode: ps.colorMode };
      }
      return updated;
    });
  }, [ps.materialId, ps.sides, ps.colorMode]);

  // Sync product query when pricing state changes externally (e.g. template load)
  useEffect(() => { setProductQuery(ps.productName || ''); }, [ps.productName]);
  useEffect(() => { setMultiQtyInput(String(ps.quantity || 1000)); }, [ps.quantity]);
  useEffect(() => {
    if (ps.finalWidth > 0 && ps.finalHeight > 0) {
      setSizeInput(`${ps.finalWidth}x${ps.finalHeight}`);
    }
  }, [ps.finalWidth, ps.finalHeight]);

  // ── Auto-describe helper ──────────────────────────────────────────────
  // Build a description string from current part/item specs
  const buildDescription = useCallback(() => {
    const materialName = materials.find(m => m.id === ps.materialId)?.name;
    let desc = ps.productName || '';
    if (materialName) desc += ' - ' + materialName;
    if (ps.finalWidth && ps.finalHeight) desc += ', ' + ps.finalWidth + 'x' + ps.finalHeight;
    // Only append color/sides after a material has been selected — not from bare defaults
    if (materialName && !isMultiPart) {
      if (ps.colorMode) desc += ', ' + ps.colorMode;
      if (ps.sides) desc += ', ' + ps.sides + '-Sided';
    }
    return desc;
  }, [ps.productName, ps.materialId, ps.finalWidth, ps.finalHeight, ps.colorMode, ps.sides, materials, isMultiPart]);

  useEffect(() => {
    if (!autoDescribe || !ps.productName) return;
    const desc = buildDescription();
    if (isMultiPart) {
      // For multi-part: auto-describe writes to the active PART's description, not the global item
      if (parts.length > 0 && !showMainTab) {
        setParts(prev => prev.map((p, i) =>
          i === activePartIdx ? { ...p, partDescription: desc } : p
        ));
      }
      // Leave the global item description (item.description) untouched
    } else {
      onUpdateItem({ description: desc });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDescribe, buildDescription, isMultiPart]);

  // Auto-collapse template panel when user starts filling fields
  useEffect(() => {
    if (userInteracted && matchingTemplates.length > 0 && !templatePanelCollapsed) {
      setTemplatePanelCollapsed(true);
    }
  }, [userInteracted]);

  // ── Derived data ──────────────────────────────────────────────────────
  const selectedMaterial = useMemo(() => materials.find(m => m.id === ps.materialId), [materials, ps.materialId]);
  const selectedEquipment = useMemo(() => equipment.find(e => e.id === ps.equipmentId), [equipment, ps.equipmentId]);

  // Initialize run size input from selected material
  useEffect(() => {
    if (selectedMaterial) {
      setRunSizeInput(`${selectedMaterial.sizeWidth}x${selectedMaterial.sizeHeight}`);
    }
  }, [selectedMaterial]);

  const availableEquipment = useMemo(() => {
    if (!ps.categoryName) return equipment;
    const catEq = getEquipmentForCategory(ps.categoryName);
    return catEq.length > 0 ? catEq : equipment;
  }, [ps.categoryName, equipment, getEquipmentForCategory]);

  const availableMaterials = useMemo(() => {
    if (ps.finalWidth <= 0 || ps.finalHeight <= 0) return materials;
    return materials.filter(m => {
      return (m.sizeWidth >= ps.finalWidth && m.sizeHeight >= ps.finalHeight) ||
        (m.sizeHeight >= ps.finalWidth && m.sizeWidth >= ps.finalHeight);
    });
  }, [materials, ps.finalWidth, ps.finalHeight]);

  const suggestions = useMemo(() => {
    if (!productQuery.trim() || productQuery.length < 1) return [];
    return searchProducts(productQuery).slice(0, 6);
  }, [productQuery, searchProducts]);

  // ── Multiple quantities parsing ───────────────────────────────────────
  const parsedQuantities = useMemo(() => {
    const qtys = multiQtyInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    return qtys.length > 0 ? qtys : [ps.quantity || 1000];
  }, [multiQtyInput, ps.quantity]);

  const isMultiQty = parsedQuantities.length > 1;

  // ── Imposition ────────────────────────────────────────────────────────
  const imposition = useMemo(() => {
    if (!selectedMaterial || ps.finalWidth <= 0 || ps.finalHeight <= 0)
      return { upsAcross: 0, upsDown: 0, totalUps: 0, sheetsNeeded: 0, cutsPerSheet: 0 };
    const r = calculateImposition(ps.finalWidth, ps.finalHeight, selectedMaterial.sizeWidth, selectedMaterial.sizeHeight);
    const sheetsNeeded = r.totalUps > 0 ? Math.ceil(ps.quantity / r.totalUps) : 0;
    const cutsPerSheet = r.upsAcross + r.upsDown;
    return { ...r, sheetsNeeded, cutsPerSheet };
  }, [selectedMaterial, ps.finalWidth, ps.finalHeight, ps.quantity, calculateImposition]);

  // ── Enhanced imposition with bleed/gutter/orientation ────────────────
  const enhancedImposition = useMemo(() => {
    if (!selectedMaterial || ps.finalWidth <= 0 || ps.finalHeight <= 0)
      return { ...imposition, runWidth: 0, runHeight: 0, waste: 0, orientationA: imposition, orientationB: { upsAcross: 0, upsDown: 0, totalUps: 0 }, bestOrientation: 'A' as const };

    const bleed2 = impositionBleed * 2;
    const runW = ps.finalWidth + bleed2;
    const runH = ps.finalHeight + bleed2;
    const sheetW = customRunWidth > 0 ? customRunWidth : selectedMaterial.sizeWidth;
    const sheetH = customRunHeight > 0 ? customRunHeight : selectedMaterial.sizeHeight;
    const gutter = impositionGutter;

    // Orientation A: finalW along sheetW
    const aAcross = Math.floor((sheetW + gutter) / (runW + gutter));
    const aDown = Math.floor((sheetH + gutter) / (runH + gutter));
    const aTotal = aAcross * aDown;

    // Orientation B: finalH along sheetW (rotated)
    const bAcross = Math.floor((sheetW + gutter) / (runH + gutter));
    const bDown = Math.floor((sheetH + gutter) / (runW + gutter));
    const bTotal = bAcross * bDown;

    const orientationA = { upsAcross: aAcross, upsDown: aDown, totalUps: aTotal };
    const orientationB = { upsAcross: bAcross, upsDown: bDown, totalUps: bTotal };

    let chosen = impositionOrientation === 'A' ? orientationA :
                 impositionOrientation === 'B' ? orientationB :
                 aTotal >= bTotal ? orientationA : orientationB;
    const bestOrientation = impositionOrientation !== 'auto' ? impositionOrientation : (aTotal >= bTotal ? 'A' : 'B');

    const sheetsNeeded = chosen.totalUps > 0 ? Math.ceil(ps.quantity / chosen.totalUps) : 0;
    const cutsPerSheet = chosen.upsAcross > 0 && chosen.upsDown > 0 ? (chosen.upsAcross - 1) + (chosen.upsDown - 1) + 2 : 0;
    const usedArea = chosen.totalUps * runW * runH;
    const sheetArea = sheetW * sheetH;
    const waste = sheetArea > 0 ? ((sheetArea - usedArea) / sheetArea) * 100 : 0;

    return {
      ...chosen, sheetsNeeded, cutsPerSheet,
      runWidth: runW, runHeight: runH,
      waste: Math.max(0, waste),
      orientationA, orientationB, bestOrientation
    };
  }, [selectedMaterial, ps.finalWidth, ps.finalHeight, ps.quantity, impositionBleed, impositionGutter, impositionOrientation, customRunWidth, customRunHeight]);

  // ── Sell-rate helpers ─────────────────────────────────────────────────
  // Look up the effective sell price per unit for a service with Rate Card pricing.
  // If tiers are defined, use the matching tier; otherwise fall back to the flat sellRate.
  // Returns null if no rate_card data is configured (caller falls back to cost+markup).
  const lookupServiceSellRate = (svc: { pricingMode?: string; sellRate?: number; sellRateTiers?: Array<{ fromQty: number; toQty: number | null; sellRate: number }> }, qty: number): number | null => {
    if (svc.pricingMode !== 'rate_card') return null;
    if (svc.sellRateTiers && svc.sellRateTiers.length > 0) {
      const tier = svc.sellRateTiers.find(t => t.fromQty <= qty && (t.toQty === null || qty <= t.toQty));
      if (tier) return tier.sellRate;
    }
    if (svc.sellRate && svc.sellRate > 0) return svc.sellRate;
    return null;
  };

  // ── Price Calculation ─────────────────────────────────────────────────
  const computeServiceLines = useCallback((): PricingServiceLine[] => {
    const lines: PricingServiceLine[] = [];

    // MATERIAL — stable id: sl_material_0
    if (selectedMaterial && imposition.sheetsNeeded > 0) {
      const costPerSheet = selectedMaterial.pricePerM / 1000;
      const totalCost = imposition.sheetsNeeded * costPerSheet;
      const markup = selectedMaterial.markup;
      lines.push({
        id: slId('material'), service: 'Material',
        description: `${selectedMaterial.name} (${selectedMaterial.size}) — ${imposition.sheetsNeeded} sheets`,
        quantity: imposition.sheetsNeeded, unit: 'sheets', unitCost: costPerSheet,
        totalCost, markupPercent: markup, sellPrice: totalCost * (1 + markup / 100), editable: true,
      });
    }

    // PRINTING — stable id: sl_printing_0
    if (selectedEquipment) {
      if (selectedEquipment.costUnit === 'per_click') {
        const totalClicks = imposition.sheetsNeeded * (ps.sides === 'Double' ? 2 : 1);
        const costPerClick = selectedEquipment.unitCost;
        const totalCost = totalClicks * costPerClick;
        const sellPerClick = lookupClickPrice(selectedEquipment.id, totalClicks, ps.colorMode);
        const totalSell = totalClicks * sellPerClick;
        const markupPct = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId('printing'), service: 'Printing',
          description: `${selectedEquipment.name} — ${totalClicks} clicks (${ps.colorMode}, ${ps.sides === 'Double' ? '2-sided' : '1-sided'}) @ ${fmt(sellPerClick)}/click`,
          quantity: totalClicks, unit: 'clicks', unitCost: costPerClick,
          totalCost, markupPercent: markupPct, sellPrice: totalSell, editable: true,
        });
      } else if (selectedEquipment.costUnit === 'per_sqft') {
        const sqft = (ps.finalWidth * ps.finalHeight * ps.quantity) / 144;
        const costPerSqft = selectedEquipment.unitCost;
        const totalCost = sqft * costPerSqft;
        const mult = selectedEquipment.markupMultiplier || 1;
        const totalSell = sqft * costPerSqft * mult;
        const markupPct = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId('printing'), service: 'Printing',
          description: `${selectedEquipment.name} — ${sqft.toFixed(1)} sqft @ ${fmt(costPerSqft * mult)}/sqft`,
          quantity: parseFloat(sqft.toFixed(1)), unit: 'sqft', unitCost: costPerSqft,
          totalCost, markupPercent: markupPct, sellPrice: totalSell, editable: true,
        });
      }
      if (selectedEquipment.initialSetupFee > 0) {
        lines.push({
          id: slId('setup'), service: 'Setup',
          description: `${selectedEquipment.name} — Setup fee`,
          quantity: 1, unit: 'flat', unitCost: selectedEquipment.initialSetupFee,
          totalCost: selectedEquipment.initialSetupFee, markupPercent: 0,
          sellPrice: selectedEquipment.initialSetupFee, editable: true,
        });
      }
    }

    // CUTTING — stable id: sl_cutting_0
    if (ps.cuttingEnabled && imposition.sheetsNeeded > 0 && imposition.cutsPerSheet > 0) {
      const cutSvc = finishing.find(f => f.name === 'Cut');
      if (cutSvc) {
        const totalStacks = Math.ceil(imposition.sheetsNeeded / ps.sheetsPerStack);
        const totalCuts = imposition.cutsPerSheet * totalStacks;
        const hours = totalCuts / cutSvc.outputPerHour;
        const totalCost = cutSvc.pricingMode === 'fixed'
          ? (cutSvc.fixedChargeCost ?? 0)
          : hours * cutSvc.hourlyCost;
        const rcRate = lookupServiceSellRate(cutSvc, totalCuts);
        const sellPrice = cutSvc.pricingMode === 'fixed'
          ? (cutSvc.fixedChargeAmount ?? 0)
          : rcRate !== null
            ? totalCuts * rcRate
            : totalCost * (1 + cutSvc.markupPercent / 100);
        const markupPct = totalCost > 0 ? ((sellPrice - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId('cutting'), service: 'Cutting',
          description: `${totalCuts} cuts (${imposition.cutsPerSheet}/sheet × ${totalStacks} stacks)`,
          quantity: totalCuts, unit: 'cuts', unitCost: cutSvc.hourlyCost / cutSvc.outputPerHour,
          totalCost, markupPercent: markupPct, sellPrice, editable: true,
          hourlyCost: cutSvc.hourlyCost, hoursActual: hours, hoursCharge: hours,
        });
      }
    }

    // FOLDING — stable id: sl_folding_0
    if (ps.foldingType) {
      const fSvc = finishing.find(f => f.name.toLowerCase().replace('-', '') === ps.foldingType.toLowerCase().replace('-', ''));
      if (fSvc) {
        const hours = ps.quantity / fSvc.outputPerHour;
        const totalCost = fSvc.pricingMode === 'fixed'
          ? (fSvc.fixedChargeCost ?? 0)
          : hours * fSvc.hourlyCost;
        const rcRate = lookupServiceSellRate(fSvc, ps.quantity);
        const sellPrice = fSvc.pricingMode === 'fixed'
          ? (fSvc.fixedChargeAmount ?? 0)
          : rcRate !== null
            ? ps.quantity * rcRate
            : totalCost * (1 + fSvc.markupPercent / 100);
        const markupPct = totalCost > 0 ? ((sellPrice - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId('folding'), service: 'Folding',
          description: `${ps.foldingType} — ${ps.quantity.toLocaleString()} pcs @ ${fSvc.outputPerHour.toLocaleString()}/hr`,
          quantity: ps.quantity, unit: 'pcs', unitCost: fSvc.hourlyCost / fSvc.outputPerHour,
          totalCost, markupPercent: markupPct, sellPrice, editable: true,
          hourlyCost: fSvc.hourlyCost, hoursActual: hours, hoursCharge: hours,
        });
      }
    }

    // DRILLING — stable id: sl_drilling_0
    if (ps.drillingType) {
      const dSvc = finishing.find(f => f.name === ps.drillingType);
      if (dSvc) {
        const hours = ps.quantity / dSvc.outputPerHour;
        const totalCost = dSvc.pricingMode === 'fixed'
          ? (dSvc.fixedChargeCost ?? 0)
          : hours * dSvc.hourlyCost;
        const rcRate = lookupServiceSellRate(dSvc, ps.quantity);
        const sellPrice = dSvc.pricingMode === 'fixed'
          ? (dSvc.fixedChargeAmount ?? 0)
          : rcRate !== null
            ? ps.quantity * rcRate
            : totalCost * (1 + dSvc.markupPercent / 100);
        const markupPct = totalCost > 0 ? ((sellPrice - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId('drilling'), service: 'Drilling',
          description: `${ps.drillingType} — ${ps.quantity.toLocaleString()} pcs @ ${dSvc.outputPerHour.toLocaleString()}/hr`,
          quantity: ps.quantity, unit: 'pcs', unitCost: dSvc.hourlyCost / dSvc.outputPerHour,
          totalCost, markupPercent: markupPct, sellPrice, editable: true,
          hourlyCost: dSvc.hourlyCost, hoursActual: hours, hoursCharge: hours,
        });
      }
    }

    // LABOR — one line per selected labor service
    selectedLaborIds.forEach((lid, idx) => {
      const svc = pricing.labor.find(l => l.id === lid);
      if (!svc) return;
      const basis = svc.chargeBasis ?? 'per_hour';

      if (svc.pricingMode === 'fixed') {
        const totalCost = svc.fixedChargeCost ?? 0;
        const sellPrice = svc.fixedChargeAmount ?? 0;
        const markupPct = totalCost > 0 ? ((sellPrice - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId(`labor_${lid}`, idx), service: 'Labor',
          description: `${svc.name}${svc.description ? ' — ' + svc.description : ''} (fixed)`,
          quantity: 1, unit: 'flat', unitCost: totalCost,
          totalCost, markupPercent: markupPct, sellPrice, editable: true,
        });
      } else {
        // Determine quantity & unit label based on chargeBasis
        let qty = 1;
        let unit = 'hr';
        if (basis === 'per_hour') { qty = ps.quantity > 0 && svc.outputPerHour > 0 ? ps.quantity / svc.outputPerHour : 1; unit = 'hr'; }
        else if (basis === 'per_sqft') { qty = ps.finalWidth > 0 && ps.finalHeight > 0 ? (ps.finalWidth * ps.finalHeight * ps.quantity) / 144 : ps.quantity; unit = 'sqft'; }
        else if (basis === 'per_unit') { qty = ps.quantity; unit = 'ea'; }
        else if (basis === 'per_1000') { qty = ps.quantity / 1000; unit = 'M'; }
        else if (basis === 'flat') { qty = 1; unit = 'flat'; }

        const costPer = svc.hourlyCost;
        const totalCost = costPer * qty;
        const rcRate = lookupServiceSellRate(svc, qty);
        const sellPrice = rcRate !== null
          ? qty * rcRate
          : Math.max(totalCost * (1 + svc.markupPercent / 100), svc.minimumCharge ?? 0);
        const markupPct = totalCost > 0 ? ((sellPrice - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId(`labor_${lid}`, idx), service: 'Labor',
          description: `${svc.name} — ${qty.toFixed(basis === 'per_hour' ? 2 : 0)} ${unit}`,
          quantity: qty, unit, unitCost: costPer,
          totalCost, markupPercent: markupPct, sellPrice, editable: true,
          ...(basis === 'per_hour' ? { hourlyCost: svc.hourlyCost, hoursActual: qty, hoursCharge: qty } : {}),
        });
      }
    });

    // BROKERED — one line per selected brokered service
    selectedBrokeredIds.forEach((bid, idx) => {
      const svc = pricing.brokered.find(b => b.id === bid);
      if (!svc) return;

      if (svc.pricingMode === 'fixed') {
        // Fixed: unitCost = cost, initialSetupFee = sell (reusing the field from the fixed modal)
        const totalCost = svc.unitCost;
        const sellPrice = svc.initialSetupFee;
        const markupPct = totalCost > 0 ? ((sellPrice - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId(`brokered_${bid}`, idx), service: 'Brokered',
          description: `${svc.name} (fixed charge)`,
          quantity: 1, unit: 'flat', unitCost: totalCost,
          totalCost, markupPercent: markupPct, sellPrice, editable: true,
        });
      } else {
        let qty = 1;
        let unit = 'ea';
        if (svc.costBasis === 'per_unit') { qty = ps.quantity; unit = 'ea'; }
        else if (svc.costBasis === 'per_sqft') { qty = ps.finalWidth > 0 && ps.finalHeight > 0 ? (ps.finalWidth * ps.finalHeight * ps.quantity) / 144 : ps.quantity; unit = 'sqft'; }
        else if (svc.costBasis === 'per_linear_ft') { qty = ps.finalWidth > 0 ? ps.finalWidth * ps.quantity : ps.quantity; unit = 'lin ft'; }
        else if (svc.costBasis === 'flat') { qty = 1; unit = 'flat'; }

        const costPer = svc.unitCost;
        const totalCost = costPer * qty + svc.initialSetupFee;
        const rcRate = lookupServiceSellRate(svc, qty);
        const sellPrice = rcRate !== null
          ? qty * rcRate + svc.initialSetupFee
          : totalCost * (1 + svc.markupPercent / 100);
        const markupPct = totalCost > 0 ? ((sellPrice - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId(`brokered_${bid}`, idx), service: 'Brokered',
          description: `${svc.name} — ${qty.toFixed(svc.costBasis === 'flat' ? 0 : 1)} ${unit}`,
          quantity: qty, unit, unitCost: costPer,
          totalCost, markupPercent: markupPct, sellPrice, editable: true,
        });
      }
    });

    return lines;
  // Depend only on the specific ps fields that actually affect calculations — NOT ps.serviceLines
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMaterial, selectedEquipment, imposition,
      ps.quantity, ps.sides, ps.colorMode, ps.materialId, ps.equipmentId,
      ps.cuttingEnabled, ps.sheetsPerStack, ps.foldingType, ps.drillingType,
      ps.finalWidth, ps.finalHeight,
      selectedLaborIds, selectedBrokeredIds,
      finishing, lookupClickPrice, pricing.labor, pricing.brokered]);

  // Recompute and sync to parent
  useEffect(() => {
    // Never recompute while a row is being edited (would wipe the edit inputs)
    if (editingLineId !== null) return;
    // Never recompute if there are saved manual overrides (user manually edited lines in this session)
    if (Object.keys(manualOverrides).length > 0) return;
    // Never recompute on first mount when service lines were already loaded from pricingContext
    // (that would wipe manual edits saved in a previous session).
    // Once the user changes a fundamental (material, equipment, quantity etc.) this guard drops.
    if (skipInitialRecompute.current) {
      if (!userChangedPricing.current) return;  // still on initial open — preserve saved lines
      skipInitialRecompute.current = false;       // user changed something — allow recompute from now on
    }

    const lines = computeServiceLines();
    onUpdatePricing({ serviceLines: lines });

    const totalCost = lines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = lines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;

    // Map to QuoteLineItem fields.
    // CRITICAL: Only overwrite materialId/equipmentId/etc. when the user has actually
    // made a pricing change in this session. On first open of an existing item,
    // userChangedPricing.current is false, so we preserve the saved values from the
    // item (which were correctly stored when the user last saved) rather than
    // overwriting them with potentially incomplete computed values.
    const matLine = lines.find(l => l.service === 'Material');
    const printLine = lines.find(l => l.service === 'Printing');
    const setupLine = lines.find(l => l.service === 'Setup');
    const finishingCost = lines
      .filter(l => ['Cutting', 'Folding', 'Drilling'].includes(l.service))
      .reduce((s, l) => s + l.totalCost, 0);

    if (userChangedPricing.current) {
      // User has interacted — write ALL fields including identifiers AND pricing config
      // Writing colorMode, sides, foldingType etc. as top-level item fields ensures they
      // survive even if pricingContext fails to load (belt-and-suspenders persistence)
      onUpdateItem({
        description: autoDescribe ? buildDescription() : item.description,
        quantity: ps.quantity || item.quantity,
        width: ps.finalWidth || undefined,
        height: ps.finalHeight || undefined,
        materialId: ps.materialId || undefined,
        materialName: selectedMaterial?.name,
        materialCost: matLine?.totalCost || 0,
        equipmentId: ps.equipmentId || undefined,
        equipmentName: selectedEquipment?.name,
        equipmentCost: printLine?.totalCost || 0,
        laborCost: finishingCost,
        setupCost: setupLine?.totalCost || 0,
        totalCost,
        markup: Math.round(overallMarkup),
        sellPrice: totalSell,
        upsPerSheet: imposition.totalUps || undefined,
        sheetSize: selectedMaterial?.size,
        colorMode: ps.colorMode,
        sides: ps.sides,
        foldingType: ps.foldingType || undefined,
        drillingType: ps.drillingType || undefined,
        cuttingEnabled: ps.cuttingEnabled,
        sheetsPerStack: ps.sheetsPerStack,
        productId: ps.productId || undefined,
        productName: ps.productName || undefined,
        categoryName: ps.categoryName || undefined,
        pricingContext: { ...ps },
      } as any);

      // ── Auto-sync to template ──────────────────────────────────────────
      // If this item is linked to a template (starred), keep the template
      // up to date automatically whenever the user changes anything.
      const linkedTemplateId = (item as any).templateId as string | undefined;
      if (linkedTemplateId && ps.productName) {
        pricing.updateTemplate(linkedTemplateId, {
          name: item.description || ps.productName,
          categoryId: categories.find(c => c.name === ps.categoryName)?.id || '',
          categoryName: ps.categoryName,
          productId: ps.productId,
          productName: ps.productName,
          quantity: ps.quantity,
          finalWidth: ps.finalWidth,
          finalHeight: ps.finalHeight,
          materialId: ps.materialId || undefined,
          materialName: selectedMaterial?.name,
          equipmentId: ps.equipmentId || undefined,
          equipmentName: selectedEquipment?.name,
          color: ps.colorMode,
          sides: ps.sides,
          folding: ps.foldingType || undefined,
        });
      }
    } else if (totalCost > 0 || totalSell > 0) {
      // Only update costs/prices, NOT identifiers (materialId, equipmentId, etc.)
      // This keeps the display accurate without wiping saved references
      onUpdateItem({
        totalCost,
        markup: Math.round(overallMarkup),
        sellPrice: totalSell,
        laborCost: finishingCost,
        setupCost: setupLine?.totalCost || 0,
        materialCost: matLine?.totalCost || 0,
        equipmentCost: printLine?.totalCost || 0,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeServiceLines]);

  // ── Multi-quantity pricing computation ────────────────────────────────
  const multiQtyPricing = useMemo(() => {
    if (!isMultiQty) return [];
    return parsedQuantities.map(qty => {
      // Recompute cost/sell for this qty
      let tCost = 0;
      let tSell = 0;

      if (selectedMaterial && ps.finalWidth > 0 && ps.finalHeight > 0) {
        const imp = calculateImposition(ps.finalWidth, ps.finalHeight, selectedMaterial.sizeWidth, selectedMaterial.sizeHeight);
        const sheets = imp.totalUps > 0 ? Math.ceil(qty / imp.totalUps) : 0;
        const costPerSheet = selectedMaterial.pricePerM / 1000;
        const matCost = sheets * costPerSheet;
        tCost += matCost;
        tSell += matCost * (1 + selectedMaterial.markup / 100);

        if (selectedEquipment) {
          if (selectedEquipment.costUnit === 'per_click') {
            const clicks = sheets * (ps.sides === 'Double' ? 2 : 1);
            const clickCost = clicks * selectedEquipment.unitCost;
            const sellPerClick = lookupClickPrice(selectedEquipment.id, clicks, ps.colorMode);
            tCost += clickCost;
            tSell += clicks * sellPerClick;
            if (selectedEquipment.initialSetupFee > 0) {
              tCost += selectedEquipment.initialSetupFee;
              tSell += selectedEquipment.initialSetupFee;
            }
          } else if (selectedEquipment.costUnit === 'per_sqft') {
            const sqft = (ps.finalWidth * ps.finalHeight * qty) / 144;
            const cost = sqft * selectedEquipment.unitCost;
            const mult = selectedEquipment.markupMultiplier || 1;
            tCost += cost;
            tSell += sqft * selectedEquipment.unitCost * mult;
          }
        }
      }

      return { qty, cost: tCost, sell: tSell };
    });
  }, [isMultiQty, parsedQuantities, selectedMaterial, selectedEquipment, ps, calculateImposition, lookupClickPrice]);

  // ── Select product from search ────────────────────────────────────────
  const selectProduct = (product: PricingProduct) => {
    userChangedPricing.current = true;
    setProductQuery(product.name);
    setShowSuggestions(false);
    const cat = categories.find(c => product.categoryIds.includes(c.id));

    // If the catalog product has a full saved pricing context (from previous edits in the catalog),
    // restore ALL of it — labor, brokered, service lines, overrides, etc.
    const savedCtx = product.defaultPricingContext as Partial<LineItemPricingState> | undefined;

    if (savedCtx) {
      // Full restore: merge saved context over defaults, then patch productId/name/category
      const restored: Partial<LineItemPricingState> = {
        ...DEFAULT_PRICING_STATE(),
        ...savedCtx,
        productId: product.id,
        productName: product.name,
        categoryName: cat?.name || savedCtx.categoryName || '',
      };
      onUpdatePricing(restored);
      // Restore local selection state from context
      if (savedCtx.selectedLaborIds)    setSelectedLaborIds(savedCtx.selectedLaborIds);
      if (savedCtx.selectedBrokeredIds) setSelectedBrokeredIds(savedCtx.selectedBrokeredIds);
      // Guard: prevent the recompute effect from overwriting the restored service lines.
      // skipInitialRecompute blocks recompute until the user changes a fundamental field.
      // CRITICAL: also reset userChangedPricing to false here — selectProduct set it true
      // at the top of this function, but that would immediately drop the guard on the next
      // render cycle. By resetting it, the guard holds until the user actually edits something.
      skipInitialRecompute.current = !!(savedCtx.serviceLines && savedCtx.serviceLines.length > 0);
      userChangedPricing.current = false;
      onUpdateItem({ description: product.name, quantity: savedCtx.quantity || product.defaultQuantity });
      setMultiQtyInput(String(savedCtx.quantity || product.defaultQuantity));
      if (savedCtx.finalWidth && savedCtx.finalHeight) {
        setSizeInput(`${savedCtx.finalWidth}x${savedCtx.finalHeight}`);
      }
    } else {
      // No saved context — fall back to basic product defaults
      const matMatch = materials.find(m =>
        m.name.toLowerCase().includes((product.defaultMaterialName || '').toLowerCase().split(' ').slice(-2).join(' '))
      );
      onUpdatePricing({
        productId: product.id,
        productName: product.name,
        categoryName: cat?.name || '',
        quantity: product.defaultQuantity,
        finalWidth: product.defaultFinalWidth,
        finalHeight: product.defaultFinalHeight,
        materialId: matMatch?.id || product.defaultMaterialId || '',
        equipmentId: product.defaultEquipmentId || '',
        colorMode: product.defaultColor === 'Black' ? 'Black' : 'Color',
        sides: product.defaultSides,
        foldingType: product.defaultFolding || '',
        drillingType: '',
        cuttingEnabled: true,
        sheetsPerStack: 500,
      });
      onUpdateItem({ description: product.name, quantity: product.defaultQuantity });
      setMultiQtyInput(String(product.defaultQuantity));
    }
  };

  // ── Inline edit service line ──────────────────────────────────────────
  const applyEditLine = () => {
    if (!editingLineId) return;
    const updatedLines = ps.serviceLines.map(l => {
      if (l.id !== editingLineId) return l;
      const cost = editValues.totalCost ?? l.totalCost;
      const markup = editValues.markupPercent ?? l.markupPercent;
      // If user directly edited sell price, use that; otherwise compute from cost + markup
      const sell = editValues.sellPrice != null
        ? editValues.sellPrice
        : cost * (1 + markup / 100);
      return { ...l, totalCost: cost, markupPercent: markup, sellPrice: sell };
    });
    onUpdatePricing({ serviceLines: updatedLines });

    const totalCost = updatedLines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = updatedLines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
    onUpdateItem({ totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });

    setEditingLineId(null);
    setEditValues({});
  };

  // ── Recalculate (reset manual overrides) ─────────────────────────────
  const handleRecalculate = () => {
    setManualOverrides({});
    setEditingLineId(null);
    setEditValues({});
    // Force fresh recompute now that overrides are cleared
    const lines = computeServiceLines();
    onUpdatePricing({ serviceLines: lines });
    const totalCost = lines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = lines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
    onUpdateItem({ totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });
  };

  // ── Save / update as template ─────────────────────────────────────────
  // Helper that builds the template fields snapshot from current pricing state
  const buildTemplateFields = () => ({
    name: item.description || ps.productName,
    categoryId: categories.find(c => c.name === ps.categoryName)?.id || '',
    categoryName: ps.categoryName,
    productId: ps.productId,
    productName: ps.productName,
    quantity: ps.quantity,
    finalWidth: ps.finalWidth,
    finalHeight: ps.finalHeight,
    materialId: ps.materialId || undefined,
    materialName: selectedMaterial?.name,
    equipmentId: ps.equipmentId || undefined,
    equipmentName: selectedEquipment?.name,
    color: ps.colorMode,
    sides: ps.sides,
    folding: ps.foldingType || undefined,
    isFavorite: false,
  });

  const handleSaveAsTemplate = () => {
    if (!ps.productName) return;

    const existingTemplateId = (item as any).templateId as string | undefined;

    if (existingTemplateId) {
      // Already linked → just update the existing template with latest values
      pricing.updateTemplate(existingTemplateId, buildTemplateFields());
    } else {
      // No link yet → create a new template and link it back to the item
      const created = pricing.addTemplate(buildTemplateFields());
      onUpdateItem({ templateId: created.id } as any);
    }

    setSavedAsTemplate(true);
    setTimeout(() => setSavedAsTemplate(false), 2000);
  };

  // Finishing options from pricing store
  const foldingOptions = finishing.filter(f => f.finishingGroupIds?.includes('fg2')).map(f => f.name);
  const drillingOptions = finishing.filter(f => f.finishingGroupIds?.includes('fg3')).map(f => f.name);

  // Grouped finishing services for dynamic finishing UI
  const groupedFinishing = useMemo(() => {
    // Filter finishing by current category if we have one
    const catId = categories.find(c => c.name === ps.categoryName)?.id;
    const relevantFinishing = catId
      ? finishing.filter(f => f.categoryIds.length === 0 || f.categoryIds.includes(catId))
      : finishing;

    const groups: Array<{ group: { id: string; name: string }; services: typeof finishing }> = [];
    const assignedIds = new Set<string>();

    for (const fg of finishingGroups) {
      const services = relevantFinishing.filter(f => f.finishingGroupIds?.includes(fg.id));
      if (services.length > 0) {
        groups.push({ group: fg, services });
        services.forEach(s => assignedIds.add(s.id));
      }
    }

    // Also add any finishing services not assigned to a group
    const ungrouped = relevantFinishing.filter(f => !assignedIds.has(f.id));
    if (ungrouped.length > 0) {
      groups.push({ group: { id: '_other', name: 'Other' }, services: ungrouped });
    }

    return groups;
  }, [finishing, finishingGroups, categories, ps.categoryName]);

  // ── Cost/Markup/Margin summary ────────────────────────────────────────
  // Always derive totals from ps.serviceLines (same source as the individual row display)
  // so they stay in sync immediately after breakdown-dialog edits — no need to wait for
  // item.totalCost / item.sellPrice to round-trip through the store.
  const itemTotalCost = ps.serviceLines.length > 0
    ? ps.serviceLines.reduce((s, l) => s + l.totalCost, 0)
    : (item.totalCost || 0);
  const itemTotalSell = ps.serviceLines.length > 0
    ? ps.serviceLines.reduce((s, l) => s + l.sellPrice, 0)
    : (item.sellPrice || 0);
  const itemMarkupAmt = itemTotalSell - itemTotalCost;
  const itemMarginPct = itemTotalSell > 0 ? ((itemTotalSell - itemTotalCost) / itemTotalSell) * 100 : 0;

  // ═══ RENDER MODAL ═════════════════════════════════════════════════════

  const orientA = enhancedImposition.orientationA;
  const orientB = enhancedImposition.orientationB;
  const activeOrientation = enhancedImposition.bestOrientation as string;

  // Proportional diagram sizes for imposition orientation
  const maxDiagramSize = 80;
  const sheetRatio = selectedMaterial ? selectedMaterial.sizeWidth / selectedMaterial.sizeHeight : 1;
  const diagWidth = sheetRatio >= 1 ? maxDiagramSize : Math.round(maxDiagramSize * sheetRatio);
  const diagHeight = sheetRatio >= 1 ? Math.round(maxDiagramSize / sheetRatio) : maxDiagramSize;

  // Helper: mark userInteracted (template panel collapse) AND userChangedPricing (recompute guard)
  const trackInteraction = () => {
    if (!userInteracted) setUserInteracted(true);
    userChangedPricing.current = true;
  };

  // ── Multi-part helpers ────────────────────────────────────────────────

  // Snapshot current form state into parts[activePartIdx]
  const snapshotCurrentPart = (targetParts: PartSnapshot[], idx: number): PartSnapshot[] => {
    const updated = [...targetParts];
    if (idx >= 0 && idx < updated.length) {
      updated[idx] = {
        ...updated[idx],
        pricingState: { ...ps },
        productQuery,
        sizeInput,
        multiQtyInput,
        totalCost: item.totalCost,
        totalSell: item.sellPrice,
        serviceLines: ps.serviceLines,
      };
    }
    return updated;
  };

  // Load a part's state into the form
  const loadPartIntoForm = (part: PartSnapshot) => {
    onUpdatePricing({ ...part.pricingState });
    setProductQuery(part.productQuery);
    setSizeInput(part.sizeInput);
    setMultiQtyInput(part.multiQtyInput);
  };

  // Switch to a different part (snapshot current, load new)
  const switchToPart = (newIdx: number) => {
    const snapped = snapshotCurrentPart(parts, activePartIdx);
    setParts(snapped);
    setActivePartIdx(newIdx);
    setShowMainTab(false);
    loadPartIntoForm(snapped[newIdx]);
  };

  // Show the main overview tab (snapshot current part first)
  const goToMainTab = () => {
    const snapped = snapshotCurrentPart(parts, activePartIdx);
    setParts(snapped);
    setShowMainTab(true);
  };

  // Add a new part
  const addNewPart = () => {
    const snapped = snapshotCurrentPart(parts, activePartIdx);
    const newPart: PartSnapshot = {
      id: nanoid(),
      partName: `Part ${snapped.length + 1}`,
      partDescription: '',
      pricingState: DEFAULT_PRICING_STATE(),
      productQuery: '',
      sizeInput: '',
      multiQtyInput: '1000',
      totalCost: 0,
      totalSell: 0,
      serviceLines: [],
    };
    const newParts = [...snapped, newPart];
    setParts(newParts);
    setActivePartIdx(newParts.length - 1);
    setShowMainTab(false);
    loadPartIntoForm(newPart);
  };

  // Remove a part
  const removePart = (idx: number) => {
    if (parts.length <= 1) return;
    const part = parts[idx];
    const hasWork = !!(part.productQuery || part.pricingState.materialId || part.pricingState.equipmentId || part.totalSell > 0);
    if (hasWork) {
      setShowDeletePartConfirm(idx);
    } else {
      doRemovePart(idx);
    }
  };

  const doRemovePart = (idx: number) => {
    if (parts.length <= 1) return;
    const newParts = parts.filter((_, i) => i !== idx);
    const newIdx = Math.min(idx, newParts.length - 1);
    setParts(newParts);
    setActivePartIdx(newIdx);
    setShowDeletePartConfirm(null);
    loadPartIntoForm(newParts[newIdx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">

        {/* ═══ Modal Header ═══════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{isNew ? 'Add Item' : 'Edit Item'}</h2>
            {ps.productName && (() => {
              const isLinked = !!(item as any).templateId;
              const isActive = isLinked || savedAsTemplate;
              return (
                <>
                  <button
                    onClick={handleSaveAsTemplate}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-amber-50 text-amber-500'
                        : 'hover:bg-gray-100 text-gray-400 hover:text-amber-500'
                    }`}
                    title={isLinked ? 'Saved as Template — click to update' : 'Save as Item Template'}
                  >
                    <Star className={`w-4 h-4 ${isActive ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  {isLinked && !savedAsTemplate && (
                    <span className="text-[10px] text-amber-500 font-medium">Template</span>
                  )}
                  {savedAsTemplate && (
                    <span className="text-xs text-amber-600 font-semibold animate-pulse">
                      {(item as any).templateId ? 'Template updated ✓' : 'Added as Template ✓'}
                    </span>
                  )}
                </>
              );
            })()}
            {/* Multi-Part Toggle */}
            <button
              type="button"
              onClick={() => {
                const checked = !isMultiPart;
                setIsMultiPart(checked);
                if (checked && parts.length === 0) {
                  setGlobalProduct(ps.productName || '');
                  setGlobalDescription(''); // start blank — user enters a fresh multi-part description
                  // Clear the line item description — it'll be set when "Save All Parts" is called
                  onUpdateItem({ description: '' });
                  const firstPart: PartSnapshot = {
                    id: nanoid(),
                    partName: 'Part 1',
                    partDescription: item.description || '',
                    pricingState: { ...ps },
                    productQuery,
                    sizeInput,
                    multiQtyInput,
                    totalCost: item.totalCost,
                    totalSell: item.sellPrice,
                    serviceLines: ps.serviceLines,
                  };
                  setParts([firstPart]);
                  setActivePartIdx(0);
                }
              }}
              className={`ml-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                isMultiPart
                  ? 'bg-[#F890E7]/10 text-[#F890E7] border-[#F890E7]/30'
                  : 'text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              <Layers className="w-3 h-3" />
              Multi-Part {isMultiPart && `(${parts.length})`}
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* ═══ Modal Body ═════════════════════════════════════════════════ */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="flex gap-4">
            {/* ── Main Form Column ──────────────────────────────────────── */}
            <div className={`flex-1 space-y-4 min-w-0 ${matchingTemplates.length > 0 && !templatePanelCollapsed ? '' : ''}`}>

              {/* ── Multi-Part Banner ─────────────────────────────────── */}
              {isMultiPart && (
                <div className="mb-4 rounded-xl border border-[#F890E7]/25 overflow-hidden shadow-sm">

                  {/* ── Row 1: Multi-Part Item name + description ─────── */}
                  <div className="px-4 py-3 bg-gradient-to-r from-[#F890E7]/8 to-white border-b border-[#F890E7]/15">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Layers className="w-3.5 h-3.5 text-[#F890E7]" />
                        <span className="text-[10px] font-bold text-[#F890E7] uppercase tracking-widest whitespace-nowrap">Multi-Part Item</span>
                      </div>
                      <div className="w-px h-4 bg-[#F890E7]/20 flex-shrink-0" />
                      {/* Item name with product search — fixed narrower width */}
                      <div className="relative" style={{ width: '28%', minWidth: 140 }}>
                        <input
                          value={globalProduct}
                          onChange={e => {
                            setGlobalProduct(e.target.value);
                            setShowGlobalSuggestions(true);
                          }}
                          onFocus={() => globalProduct && setShowGlobalSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowGlobalSuggestions(false), 150)}
                          placeholder="Item name (e.g. Booklet...)"
                          className="w-full text-sm font-semibold bg-transparent border-0 focus:outline-none text-gray-800 placeholder-gray-400"
                        />
                        {/* Product suggestions dropdown */}
                        {showGlobalSuggestions && globalProduct.trim().length >= 1 && (() => {
                          const globalSuggs = searchProducts(globalProduct).slice(0, 6);
                          return globalSuggs.length > 0 ? (
                            <div className="absolute z-30 top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                              {globalSuggs.map(p => {
                                const cat = categories.find(c => p.categoryIds.includes(c.id));
                                return (
                                  <button key={p.id} type="button"
                                    onMouseDown={() => {
                                      setGlobalProduct(p.name);
                                      setGlobalDescription((prev: string) => prev || p.name);
                                      setShowGlobalSuggestions(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#F890E7]/5 transition-colors border-b border-gray-50 last:border-0">
                                    <span className="text-xs font-medium text-gray-900">{p.name}</span>
                                    {cat && <span className="text-[10px] text-gray-400 ml-2">{cat.name}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                      {/* Item description — remaining space */}
                      <input
                        value={globalDescription}
                        onChange={e => setGlobalDescription(e.target.value)}
                        placeholder="Overall item description..."
                        className="flex-1 text-sm bg-transparent border-0 focus:outline-none text-gray-500 placeholder-gray-400 min-w-0"
                      />
                    </div>
                  </div>

                  {/* ── Row 2: Tab strip — Overview | Part 1 | Part 2 … ── */}
                  <div className="flex items-center overflow-x-auto bg-gray-50 border-b border-gray-100 px-3 py-0 gap-0">
                    {/* Overview tab */}
                    <button
                      onClick={goToMainTab}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium transition-all border-b-2 ${
                        showMainTab
                          ? 'border-gray-700 text-gray-800 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      Overview
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />

                    {/* Part tabs */}
                    {parts.map((part, idx) => (
                      <div key={part.id} className="flex-shrink-0 flex items-center group">
                        <button
                          onClick={() => switchToPart(idx)}
                          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium transition-all border-b-2 ${
                            !showMainTab && activePartIdx === idx
                              ? 'border-[#F890E7] text-[#F890E7] bg-white'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                            !showMainTab && activePartIdx === idx
                              ? 'bg-[#F890E7] text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}>{idx + 1}</span>
                          {part.partName || `Part ${idx + 1}`}
                          {(idx === activePartIdx && !showMainTab ? item.sellPrice : part.totalSell) > 0 && (
                            <span className="text-[9px] text-gray-300 num">
                              {formatCurrency(idx === activePartIdx && !showMainTab ? item.sellPrice : part.totalSell)}
                            </span>
                          )}
                        </button>
                        {parts.length > 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); removePart(idx); }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded text-gray-300 hover:text-red-400 transition-all -ml-1 mr-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={addNewPart}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-medium text-gray-400 hover:text-[#F890E7] transition-colors ml-1"
                    >
                      <Plus className="w-3 h-3" /> Add Part
                    </button>
                  </div>

                  {/* ── MAIN OVERVIEW TAB content ───────────────────────── */}
                  {showMainTab && (
                    <div className="p-4 space-y-3">
                      {/* Parts table */}
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-7">#</th>
                            <th className="text-left py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Part</th>
                            <th className="text-left py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                            <th className="text-right py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Cost</th>
                            <th className="text-right py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Margin</th>
                            <th className="text-right py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Sell</th>
                            <th className="w-6"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {parts.map((part, idx) => {
                            const sell = idx === activePartIdx ? item.sellPrice : part.totalSell;
                            const cost = idx === activePartIdx ? item.totalCost : part.totalCost;
                            const margin = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
                            return (
                              <tr
                                key={part.id}
                                className="hover:bg-[#F890E7]/5 cursor-pointer transition-colors group"
                                onClick={() => switchToPart(idx)}
                              >
                                <td className="py-2.5 pr-2">
                                  <span className="w-5 h-5 rounded-full bg-[#F890E7]/15 text-[#F890E7] text-[9px] font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-3">
                                  <span className="font-semibold text-gray-800 group-hover:text-[#F890E7] transition-colors">
                                    {part.partName || `Part ${idx + 1}`}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-3 max-w-[180px]">
                                  <span className="text-gray-400 truncate block">{part.partDescription || '—'}</span>
                                </td>
                                <td className="py-2.5 pr-3 text-right num text-gray-600">{cost > 0 ? formatCurrency(cost) : '—'}</td>
                                <td className="py-2.5 pr-3 text-right num">
                                  {sell > 0 ? (
                                    <span className={margin >= 30 ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                                      {margin.toFixed(1)}%
                                    </span>
                                  ) : '—'}
                                </td>
                                <td className="py-2.5 text-right num font-semibold text-gray-900">{sell > 0 ? formatCurrency(sell) : '—'}</td>
                                <td className="py-2.5 pl-2">
                                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#F890E7] transition-colors" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200">
                            <td colSpan={3} className="py-2.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                              Total · {parts.length} part{parts.length !== 1 ? 's' : ''}
                            </td>
                            <td className="py-2.5 text-right num font-semibold text-gray-700">
                              {formatCurrency(parts.reduce((s, p, i) => s + (i === activePartIdx ? item.totalCost : p.totalCost), 0))}
                            </td>
                            <td className="py-2.5 text-right num">
                              {(() => {
                                const tSell = parts.reduce((s, p, i) => s + (i === activePartIdx ? item.sellPrice : p.totalSell), 0);
                                const tCost = parts.reduce((s, p, i) => s + (i === activePartIdx ? item.totalCost : p.totalCost), 0);
                                const m = tSell > 0 ? ((tSell - tCost) / tSell) * 100 : 0;
                                return tSell > 0 ? (
                                  <span className={m >= 30 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{m.toFixed(1)}%</span>
                                ) : '—';
                              })()}
                            </td>
                            <td className="py-2.5 text-right num font-bold text-gray-900 text-sm">
                              {formatCurrency(parts.reduce((s, p, i) => s + (i === activePartIdx ? item.sellPrice : p.totalSell), 0))}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>

                      <p className="text-[10px] text-gray-400 text-center pt-1">Click a part row to edit its specs and pricing →</p>
                    </div>
                  )}

                  {/* Active part name/description (shown only when NOT on main tab) */}
                  {!showMainTab && parts[activePartIdx] && (
                    <div className="px-4 py-2.5 flex items-center gap-3 bg-white border-b border-gray-50">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="w-5 h-5 rounded-full bg-[#F890E7] text-white text-[9px] font-bold flex items-center justify-center">
                          {activePartIdx + 1}
                        </span>
                      </div>
                      <input
                        value={parts[activePartIdx].partName}
                        onChange={e => {
                          const updated = [...parts];
                          updated[activePartIdx] = { ...updated[activePartIdx], partName: e.target.value };
                          setParts(updated);
                        }}
                        className="text-sm font-semibold bg-transparent border-0 focus:outline-none text-gray-800 placeholder-gray-400 w-40 border-b border-dashed border-gray-200 focus:border-[#F890E7] pb-0.5 transition-colors"
                        placeholder="Part name..."
                      />
                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                      <input
                        value={parts[activePartIdx].partDescription}
                        onChange={e => {
                          const updated = [...parts];
                          updated[activePartIdx] = { ...updated[activePartIdx], partDescription: e.target.value };
                          setParts(updated);
                        }}
                        placeholder="Part description (optional)..."
                        className="flex-1 text-xs bg-transparent border-0 focus:outline-none text-gray-500 placeholder-gray-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────── */}
              {/* Hide the full pricing form when the Main overview tab is active */}
              {(!isMultiPart || !showMainTab) && (<>

              {/* ── Product Search Row ────────────────────────────────── */}
              {/* Lock-and-prompt logic: only for brand-new items that haven't had a product chosen yet.
                  Existing items being re-edited are NEVER locked — isNew=false means skip all gating. */}
              {(() => {
                const needsProduct = isNew && !ps.productId && !ps.productName;
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Product</label>
                      {/* Only show the prompt badge on brand-new items with no product yet */}
                      {needsProduct && (
                        <span className="text-[9px] font-semibold text-[var(--brand)] bg-[var(--brand-light)] px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Select a product to begin
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text" value={productQuery}
                        onChange={e => { setProductQuery(e.target.value); setShowSuggestions(true); if (!e.target.value.trim()) onUpdatePricing({ productId: '', productName: '' }); }}
                        onFocus={() => { setShowSuggestions(true); }}
                        placeholder="Type product name (Business Cards, Postcards, Trifold, Brochures...)"
                        className={`w-full pl-9 pr-8 py-2.5 text-sm rounded-lg focus:outline-none placeholder-gray-400 transition-all ${
                          needsProduct
                            ? 'bg-[var(--brand-light)] border-2 border-[var(--brand)]/40 focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]'
                            : 'bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-[#F890E7]'
                        }`}
                      />
                      {productQuery && (
                        <button onClick={() => { setProductQuery(''); onUpdatePricing({ productId: '', productName: '', categoryName: '' }); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full">
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      )}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
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
                );
              })()}

              {/* Lock the form only for brand-new items before a product is chosen */}
              <div className={(isNew && !ps.productId && !ps.productName) ? 'opacity-40 pointer-events-none select-none' : ''}>
              {(isNew && !ps.productId && !ps.productName) && (
                <div className="text-center py-4 text-sm text-gray-400">
                  Search and select a product above to configure specs and pricing
                </div>
              )}

              {/* ── Description + Auto-describe ──────────────────────── */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={e => { setAutoDescribe(false); onUpdateItem({ description: e.target.value }); }}
                  placeholder="Item description..."
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400"
                />
                <label className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1 cursor-pointer">
                  <input type="checkbox" checked={autoDescribe} onChange={e => { setAutoDescribe(e.target.checked); if (e.target.checked) onUpdateItem({ description: buildDescription() }); }} className="w-3 h-3 rounded border-gray-300 text-[#F890E7] focus:ring-[#F890E7]" />
                  Auto-describe
                </label>
              </div>


              {/* ── Quantity / Size / Sides / Color (4-col row) ────── */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Quantity</label>
                  <input type="text" value={multiQtyInput}
                    onChange={e => {
                      trackInteraction();
                      setMultiQtyInput(e.target.value);
                      const qParts = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
                      if (qParts.length > 0) onUpdatePricing({ quantity: qParts[0] });
                    }}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]" />
                  {isMultiQty && <p className="text-[10px] text-purple-500 mt-0.5">{parsedQuantities.length} quantities</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Size (L x H, in)</label>
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={e => {
                      trackInteraction();
                      setSizeInput(e.target.value);
                      const match = e.target.value.match(/^(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)$/);
                      if (match) {
                        onUpdatePricing({ finalWidth: parseFloat(match[1]), finalHeight: parseFloat(match[2]) });
                        setSizeError('');
                      } else if (e.target.value && !e.target.value.match(/^[\d.]+\s*[xX×]?\s*[\d.]*$/)) {
                        setSizeError('Use format: LxH (e.g., 3.5x2)');
                      } else {
                        setSizeError('');
                      }
                    }}
                    placeholder="e.g., 3.5x2"
                    className={`w-full px-3 py-2 text-sm bg-white border ${sizeError ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]`}
                  />
                  {sizeError && <p className="text-[9px] text-red-500 mt-0.5">{sizeError}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Sides</label>
                  <select value={materialEntries[0]?.sides || ps.sides}
                    onChange={e => {
                      trackInteraction();
                      const updated = [...materialEntries];
                      updated[0] = { ...updated[0], sides: e.target.value as 'Single' | 'Double' };
                      setMaterialEntries(updated);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Color</label>
                  <select value={materialEntries[0]?.colorMode || ps.colorMode}
                    onChange={e => {
                      trackInteraction();
                      const updated = [...materialEntries];
                      updated[0] = { ...updated[0], colorMode: e.target.value as 'Color' | 'Black' };
                      setMaterialEntries(updated);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="Color">Color</option>
                    <option value="Black">B&W</option>
                  </select>
                </div>
              </div>

              {/* ── Material / Equipment (2-col equal width) ──────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Material</label>
                  <select value={materialEntries[0]?.materialId || ps.materialId}
                    onChange={e => {
                      trackInteraction();
                      const updated = [...materialEntries];
                      updated[0] = { ...updated[0], materialId: e.target.value };
                      setMaterialEntries(updated);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="">-- Select material --</option>
                    {availableMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.size}) -- {fmt(m.pricePerM)}/M</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Equipment</label>
                  <select value={ps.equipmentId}
                    onChange={e => { trackInteraction(); onUpdatePricing({ equipmentId: e.target.value }); }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none">
                    <option value="">-- Select --</option>
                    {availableEquipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>

              {/* ═══ IMPOSITION (collapsible) ═════════════════════════ */}
              {selectedMaterial && imposition.totalUps > 0 && (
                <div className="rounded-xl border border-blue-200 overflow-hidden">
                  <button
                    onClick={() => setShowImpositionCalc(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50/60 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Imposition</span>
                      {!showImpositionCalc && (
                        <span className="text-[10px] text-gray-500 ml-2 font-normal normal-case">
                          {selectedMaterial.size} | {enhancedImposition.totalUps} ups | {enhancedImposition.sheetsNeeded.toLocaleString()} sheets | {enhancedImposition.waste.toFixed(1)}% waste
                        </span>
                      )}
                    </div>
                    {showImpositionCalc ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </button>

                  {showImpositionCalc && (
                    <div className="px-4 py-3 bg-blue-50/30">
                      <div className="flex gap-4">
                        {/* LEFT: 3x3 grid of values */}
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                            <p className="text-[10px] text-blue-600 font-medium">Parent</p>
                            <p className="text-sm font-bold text-blue-900">{selectedMaterial.size}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                            <p className="text-[10px] text-blue-600 font-medium">Run Size</p>
                            <input
                              type="text"
                              value={runSizeInput}
                              onChange={e => {
                                setRunSizeInput(e.target.value);
                                const match = e.target.value.match(/^(\d+\.?\d*)\s*[xX\u00D7]\s*(\d+\.?\d*)$/);
                                if (match) {
                                  setCustomRunWidth(parseFloat(match[1]));
                                  setCustomRunHeight(parseFloat(match[2]));
                                }
                              }}
                              placeholder="LxH"
                              className="w-full text-center text-xs font-bold bg-blue-50 border border-blue-200 rounded px-1 py-0.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-[#F890E7]"
                            />
                            <p className="text-[8px] text-gray-400 mt-0.5">Default = Parent</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 font-medium">Finish Size</p>
                            <p className="text-sm font-bold text-emerald-900">{ps.finalWidth}x{ps.finalHeight}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 font-medium">Ups</p>
                            <p className="text-sm font-bold text-emerald-900">{enhancedImposition.totalUps}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
                            <p className="text-[10px] text-amber-600 font-medium">Sheets</p>
                            <p className="text-sm font-bold text-amber-900">{enhancedImposition.sheetsNeeded.toLocaleString()}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                            <p className="text-[10px] text-gray-500 font-medium">Cuts/Sheet</p>
                            <p className="text-sm font-bold text-gray-900">{enhancedImposition.cutsPerSheet}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                            <p className="text-[10px] text-blue-600 font-medium">Bleed</p>
                            <input type="number" step="0.0625" value={impositionBleed} min={0}
                              onChange={e => setImpositionBleed(parseFloat(e.target.value) || 0)}
                              className="w-full text-center text-xs font-bold bg-blue-50 border border-blue-200 rounded px-1 py-0.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-[#F890E7]" />
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-purple-100">
                            <p className="text-[10px] text-purple-600 font-medium">Gutter</p>
                            <input type="number" step="0.0625" value={impositionGutter} min={0}
                              onChange={e => setImpositionGutter(parseFloat(e.target.value) || 0)}
                              className="w-full text-center text-xs font-bold bg-purple-50 border border-purple-200 rounded px-1 py-0.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-[#F890E7]" />
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-red-100">
                            <p className="text-[10px] text-red-500 font-medium">Waste</p>
                            <p className="text-sm font-bold text-red-700">{enhancedImposition.waste.toFixed(1)}%</p>
                          </div>
                        </div>

                        {/* RIGHT: Orientation diagrams A & B */}
                        <div className="flex flex-col gap-2 w-[200px] flex-shrink-0">
                          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Orientation</p>
                          <div className="flex gap-3">
                            {/* Orientation A */}
                            <button
                              onClick={() => setImpositionOrientation('A')}
                              className={`flex-1 rounded-lg p-2 border-2 transition-all flex flex-col items-center gap-1 ${
                                activeOrientation === 'A' ? 'border-[#F890E7] bg-pink-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className={`text-[10px] font-bold ${activeOrientation === 'A' ? 'text-[#F890E7]' : 'text-gray-500'}`}>A</span>
                              <div className="grid gap-px bg-gray-300 p-px" style={{
                                gridTemplateColumns: `repeat(${orientA.upsAcross || 1}, 1fr)`,
                                gridTemplateRows: `repeat(${orientA.upsDown || 1}, 1fr)`,
                                width: diagWidth, height: diagHeight
                              }}>
                                {Array.from({ length: orientA.totalUps || 0 }).map((_, i) => (
                                  <div key={i} className={activeOrientation === 'A' ? 'bg-pink-100' : 'bg-gray-100'} />
                                ))}
                              </div>
                              <span className="text-[9px] text-gray-500">{orientA.upsAcross}x{orientA.upsDown} = {orientA.totalUps}</span>
                            </button>
                            {/* Orientation B */}
                            <button
                              onClick={() => setImpositionOrientation('B')}
                              className={`flex-1 rounded-lg p-2 border-2 transition-all flex flex-col items-center gap-1 ${
                                activeOrientation === 'B' ? 'border-[#F890E7] bg-pink-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className={`text-[10px] font-bold ${activeOrientation === 'B' ? 'text-[#F890E7]' : 'text-gray-500'}`}>B</span>
                              <div className="grid gap-px bg-gray-300 p-px" style={{
                                gridTemplateColumns: `repeat(${orientB.upsAcross || 1}, 1fr)`,
                                gridTemplateRows: `repeat(${orientB.upsDown || 1}, 1fr)`,
                                width: diagWidth, height: diagHeight
                              }}>
                                {Array.from({ length: orientB.totalUps || 0 }).map((_, i) => (
                                  <div key={i} className={activeOrientation === 'B' ? 'bg-pink-100' : 'bg-gray-100'} />
                                ))}
                              </div>
                              <span className="text-[9px] text-gray-500">{orientB.upsAcross}x{orientB.upsDown} = {orientB.totalUps}</span>
                            </button>
                          </div>
                          <button
                            onClick={() => setImpositionOrientation('auto')}
                            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                              impositionOrientation === 'auto'
                                ? 'bg-[#F890E7]/10 text-[#F890E7] font-semibold'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            Auto (best fit)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ SERVICES ═════════════════════════════════════════ */}
              <div className="space-y-3 pt-1">
                {/* Section label */}
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Services</span>
                </div>

                {/* ── FINISHING ─────────────────────────────────────────── */}
                <div className="space-y-1.5">
                  {/* Label row + selected pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Scissors className="w-3 h-3 text-purple-500" />
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Finishing</span>
                    </div>
                    {selectedFinishingIds.map(id => {
                      const svc = finishing.find(f => f.id === id);
                      return svc ? (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                          {svc.name}
                          <button
                            type="button"
                            onClick={() => {
                              const nextIds = selectedFinishingIds.filter(x => x !== id);
                              setSelectedFinishingIds(nextIds);
                              const sel = finishing.filter(f => nextIds.includes(f.id));
                              onUpdatePricing({
                                cuttingEnabled: sel.some(f => f.name === 'Cut'),
                                foldingType: sel.find(f => f.finishingGroupIds?.includes('fg2'))?.name || '',
                                drillingType: sel.find(f => f.finishingGroupIds?.includes('fg3'))?.name || '',
                              });
                            }}
                            className="hover:text-purple-900 ml-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* One dropdown per finishing group — side by side */}
                  {groupedFinishing.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {groupedFinishing.map(({ group, services }) => {
                        const available = services.filter(s => !selectedFinishingIds.includes(s.id));
                        return (
                          <div key={group.id} className="relative min-w-[140px] max-w-[200px] flex-1">
                            <select
                              value=""
                              onChange={e => {
                                if (!e.target.value) return;
                                trackInteraction();
                                const nextIds = [...selectedFinishingIds, e.target.value];
                                setSelectedFinishingIds(nextIds);
                                const sel = finishing.filter(f => nextIds.includes(f.id));
                                onUpdatePricing({
                                  cuttingEnabled: sel.some(f => f.name === 'Cut'),
                                  foldingType: sel.find(f => f.finishingGroupIds?.includes('fg2'))?.name || '',
                                  drillingType: sel.find(f => f.finishingGroupIds?.includes('fg3'))?.name || '',
                                });
                              }}
                              disabled={available.length === 0}
                              className="w-full pl-2 pr-7 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300 appearance-none text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-purple-300 transition-colors cursor-pointer"
                            >
                              <option value="">{group.name}</option>
                              {available.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── LABOR ─────────────────────────────────────────────── */}
                {pricing.labor.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Wrench className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Labor</span>
                      </div>
                      {selectedLaborIds.map(id => {
                        const svc = pricing.labor.find(l => l.id === id);
                        return svc ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            {svc.name}
                            <button type="button" onClick={() => setSelectedLaborIds(prev => prev.filter(x => x !== id))} className="hover:text-blue-900 ml-0.5">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>

                    {/* One dropdown per labor group */}
                    {pricing.laborGroups.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pricing.laborGroups.map(lg => {
                          const available = pricing.labor.filter(l => l.laborGroupIds?.includes(lg.id) && !selectedLaborIds.includes(l.id));
                          return (
                            <div key={lg.id} className="relative min-w-[140px] max-w-[200px] flex-1">
                              <select
                                value=""
                                onChange={e => { if (e.target.value) { trackInteraction(); setSelectedLaborIds(prev => [...prev, e.target.value]); } }}
                                disabled={available.length === 0}
                                className="w-full pl-2 pr-7 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 appearance-none text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-300 transition-colors cursor-pointer"
                              >
                                <option value="">{lg.name}</option>
                                {available.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── BROKERED ──────────────────────────────────────────── */}
                {pricing.brokered.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Package className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Brokered</span>
                      </div>
                      {selectedBrokeredIds.map(id => {
                        const svc = pricing.brokered.find(b => b.id === id);
                        return svc ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            {svc.name}
                            <button type="button" onClick={() => setSelectedBrokeredIds(prev => prev.filter(x => x !== id))} className="hover:text-amber-900 ml-0.5">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>

                    {/* One dropdown per brokered group */}
                    {pricing.brokeredGroups.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pricing.brokeredGroups.map(bg => {
                          const available = pricing.brokered.filter(b => b.brokeredGroupIds?.includes(bg.id) && !selectedBrokeredIds.includes(b.id));
                          return (
                            <div key={bg.id} className="relative min-w-[140px] max-w-[200px] flex-1">
                              <select
                                value=""
                                onChange={e => { if (e.target.value) { trackInteraction(); setSelectedBrokeredIds(prev => [...prev, e.target.value]); } }}
                                disabled={available.length === 0}
                                className="w-full pl-2 pr-7 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300 appearance-none text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-300 transition-colors cursor-pointer"
                              >
                                <option value="">{bg.name}</option>
                                {available.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Multi-Quantity Price Table ────────────────────────── */}
              {isMultiQty && multiQtyPricing.length > 0 && (
                <div className="bg-purple-50/50 rounded-xl p-4">
                  <h4 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-purple-500" /> Multi-Quantity Pricing
                  </h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-200/60">
                        <th className="text-left py-1.5 px-3 font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                        <th className="text-right py-1.5 px-3 font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                        <th className="text-right py-1.5 px-3 font-semibold text-gray-500 uppercase tracking-wide">Sell Price</th>
                        <th className="text-right py-1.5 px-3 font-semibold text-gray-500 uppercase tracking-wide">Per Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100/60">
                      {multiQtyPricing.map((row, idx) => (
                        <tr key={idx} className={idx === 0 ? 'bg-purple-100/30 font-semibold' : ''}>
                          <td className="py-1.5 px-3 text-gray-900">{row.qty.toLocaleString()}{idx === 0 && <span className="text-[10px] text-purple-500 ml-1">(primary)</span>}</td>
                          <td className="py-1.5 px-3 text-right num text-gray-600">{fmt(row.cost)}</td>
                          <td className="py-1.5 px-3 text-right num text-gray-900">{fmt(row.sell)}</td>
                          <td className="py-1.5 px-3 text-right num text-gray-500">{row.qty > 0 ? fmt(row.sell / row.qty) : '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ═══ PRICE BREAKDOWN ══════════════════════════════════ */}
              {ps.serviceLines.length > 0 && (() => {
                // Helper: derive a human-readable quantity cell from a service line
                const lineQty = (line: PricingServiceLine): React.ReactNode => {
                  // Time-based services — show time in mins or h:mm
                  if (line.hourlyCost != null && line.hoursActual != null) {
                    const h = line.hoursCharge ?? line.hoursActual;
                    if (h <= 0) return <span className="text-gray-300">—</span>;
                    const totalMin = Math.round(h * 60);
                    const hrs  = Math.floor(totalMin / 60);
                    const mins = totalMin % 60;
                    const label = hrs === 0 ? `${mins} min` : mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
                    return <span className="text-sky-600 font-medium num">{label}</span>;
                  }
                  // Qty-based services
                  if (line.quantity != null && line.unit && line.unit !== 'flat') {
                    return (
                      <span className="text-gray-600 num">
                        {line.quantity.toLocaleString()}
                        <span className="text-[9px] text-gray-400 ml-0.5">{line.unit}</span>
                      </span>
                    );
                  }
                  // Flat / setup — show "flat"
                  if (line.unit === 'flat' || line.quantity === 1) {
                    return <span className="text-gray-400 text-[9px]">flat</span>;
                  }
                  return <span className="text-gray-300">—</span>;
                };

                return (
                <div className="rounded-xl border border-emerald-200 overflow-hidden">
                  {/* Header */}
                  <button
                    type="button"
                    onClick={() => setShowBreakdownDialog(true)}
                    className="w-full text-left px-4 py-2.5 flex items-center justify-between bg-emerald-50/60 hover:bg-emerald-50 transition-colors border-b border-emerald-200/60"
                  >
                    <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Price Breakdown
                      {Object.keys(manualOverrides).length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px]">
                          {Object.keys(manualOverrides).length} override{Object.keys(manualOverrides).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-[#F890E7] font-medium flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit Pricing
                    </span>
                  </button>

                  {/* Read-only summary table */}
                  <div
                    className="bg-white cursor-pointer hover:bg-gray-50/60 transition-colors"
                    onClick={() => setShowBreakdownDialog(true)}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {/* Service — no label needed, icon+name is self-explanatory */}
                          <th className="py-1.5 px-4 text-left" />
                          {/* Description — flexible */}
                          <th className="py-1.5 px-3 text-left text-[9px] font-semibold text-gray-400 uppercase tracking-wide" />
                          {/* Qty */}
                          <th className="py-1.5 px-3 text-right text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Qty</th>
                          {/* Cost */}
                          <th className="py-1.5 px-3 text-right text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Cost</th>
                          {/* Markup */}
                          <th className="py-1.5 px-3 text-right text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Markup</th>
                          {/* Sell */}
                          <th className="py-1.5 px-4 text-right text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Sell</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ps.serviceLines.map(line => (
                          <tr key={line.id} className="hover:bg-emerald-50/20 transition-colors">
                            {/* Service name + icon */}
                            <td className="py-2 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {line.service === 'Material' && <Package    className="w-3 h-3 text-amber-400 flex-shrink-0"  />}
                                {line.service === 'Printing' && <Printer    className="w-3 h-3 text-blue-400 flex-shrink-0"   />}
                                {line.service === 'Setup'    && <Settings2  className="w-3 h-3 text-gray-400 flex-shrink-0"   />}
                                {line.service === 'Cutting'  && <Scissors   className="w-3 h-3 text-purple-400 flex-shrink-0" />}
                                {line.service === 'Folding'  && <FoldVertical className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                                {line.service === 'Drilling' && <CircleDot  className="w-3 h-3 text-orange-400 flex-shrink-0" />}
                                {line.service === 'Labor'    && <Hand       className="w-3 h-3 text-blue-500 flex-shrink-0"   />}
                                {line.service === 'Brokered' && <Package    className="w-3 h-3 text-violet-400 flex-shrink-0" />}
                                <span className="text-gray-700 font-medium">{line.service}</span>
                                {manualOverrides[line.id] && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Manually overridden" />
                                )}
                              </div>
                            </td>
                            {/* Description */}
                            <td className="py-2 px-3 text-gray-400 text-[10px] truncate max-w-[180px]">
                              {line.description}
                            </td>
                            {/* Qty */}
                            <td className="py-2 px-3 text-right text-xs">
                              {lineQty(line)}
                            </td>
                            {/* Cost */}
                            <td className="py-2 px-3 text-right num text-gray-500">{fmt(line.totalCost)}</td>
                            {/* Markup % */}
                            <td className="py-2 px-3 text-right num">
                              <span className={line.markupPercent > 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                                {fmtPct(line.markupPercent)}
                              </span>
                            </td>
                            {/* Sell Price */}
                            <td className="py-2 px-4 text-right num font-semibold text-gray-900">{fmt(line.sellPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50">
                          <td className="py-2 px-4 text-[10px] font-bold text-gray-600 uppercase tracking-wide" colSpan={2}>Total</td>
                          {/* Qty — blank in totals */}
                          <td className="py-2 px-3" />
                          {/* Total Cost */}
                          <td className="py-2 px-3 text-right num text-gray-700 font-semibold text-[11px]">{fmt(itemTotalCost)}</td>
                          {/* Avg Markup */}
                          <td className="py-2 px-3 text-right num text-[11px]">
                            <span className={itemTotalCost > 0 ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                              {itemTotalCost > 0 ? fmtPct(((itemTotalSell - itemTotalCost) / itemTotalCost) * 100) : '—'}
                            </span>
                          </td>
                          {/* Total Sell */}
                          <td className="py-2 px-4 text-right num font-bold text-gray-900 text-sm">{fmt(itemTotalSell)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    <div className="px-4 py-1.5 flex items-center justify-between bg-gray-50 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">
                        Margin: <span className={`font-semibold ${itemMarginPct >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{fmtPct(itemMarginPct)}</span>
                      </span>
                      <span className="text-[10px] text-gray-400">Click anywhere to edit →</span>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* ═══ PRICE BREAKDOWN EDIT DIALOG ══════════════════════ */}
              {showBreakdownDialog && (
                <PriceBreakdownDialog
                  lines={ps.serviceLines}
                  onSave={(updatedLines) => {
                    onUpdatePricing({ serviceLines: updatedLines });
                    const totalCost = updatedLines.reduce((s, l) => s + l.totalCost, 0);
                    const totalSell = updatedLines.reduce((s, l) => s + l.sellPrice, 0);
                    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
                    onUpdateItem({ totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });
                    // Mark all lines with changes as overridden
                    const newOverrides: Record<string, boolean> = {};
                    updatedLines.forEach((l, i) => {
                      const orig = ps.serviceLines[i];
                      if (orig && (l.totalCost !== orig.totalCost || l.markupPercent !== orig.markupPercent)) {
                        newOverrides[l.id] = true;
                      }
                    });
                    setManualOverrides(prev => ({ ...prev, ...newOverrides }));
                    setShowBreakdownDialog(false);
                  }}
                  onRecalculate={() => {
                    handleRecalculate();
                    setShowBreakdownDialog(false);
                  }}
                  onClose={() => setShowBreakdownDialog(false)}
                />
              )}

              {/* ── Notes ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Customer Notes</label>
                  <textarea
                    value={item.notes || ''}
                    onChange={e => onUpdateItem({ notes: e.target.value })}
                    placeholder="Notes visible to the customer..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Internal Notes</label>
                  <textarea
                    value={(item as any).internalNotes || ''}
                    onChange={e => onUpdateItem({ internalNotes: e.target.value } as any)}
                    placeholder="Internal notes (not shown to customer)..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400 resize-none"
                  />
                </div>
              </div>

              </div>
              {/* End of conditional pricing form — hidden when Main overview tab is active */}
              </>)}
            </div>

            {/* ── Right panel: Templates ──────────────────────────────── */}
            {matchingTemplates.length > 0 && (
              templatePanelCollapsed ? (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setTemplatePanelCollapsed(false)}
                    className="p-2 rounded-lg border border-gray-200 hover:border-[#F890E7] hover:bg-pink-50/50 transition-all"
                    title="Show templates"
                  >
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </button>
                </div>
              ) : (
                <div className="w-52 flex-shrink-0 transition-all duration-300">
                  <div className="sticky top-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Templates</h4>
                      <button onClick={() => setTemplatePanelCollapsed(true)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors" title="Collapse">
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                      {matchingTemplates.slice(0, 12).map(t => (
                        <button key={t.id} onClick={() => onApplyTemplate(t.id)}
                          className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:border-[#F890E7] hover:bg-pink-50/50 transition-all text-xs group">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 group-hover:text-[#F890E7] truncate">{t.name}</span>
                            {t.isFavorite && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {t.categoryName} · {t.quantity.toLocaleString()} pcs
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ═══ Modal Footer ═══════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" onClick={onRemove} icon={<Trash2 className="w-3.5 h-3.5" />}>
              Remove Item
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {isMultiPart ? (
              <Button variant="success" onClick={() => {
                // Snapshot the current part's live pricing into the parts array
                const snapped = snapshotCurrentPart(parts, activePartIdx);
                // Update current part's totals from live item state
                const finalParts = snapped.map((p, i) =>
                  i === activePartIdx
                    ? { ...p, totalCost: item.totalCost, totalSell: item.sellPrice, serviceLines: ps.serviceLines }
                    : p
                );
                const totalCost = finalParts.reduce((s, p) => s + p.totalCost, 0);
                const totalSell = finalParts.reduce((s, p) => s + p.totalSell, 0);
                const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
                // Use the global product name as the item description
                const desc = globalProduct || globalDescription || item.description || 'Multi-Part Item';
                // Persist parts onto the line item so they survive re-opens and show in list view
                onUpdateItem({
                  description: desc,
                  totalCost,
                  sellPrice: totalSell,
                  markup: Math.round(overallMarkup),
                  isMultiPart: true,
                  multiPartName: globalProduct,
                  multiPartDescription: globalDescription,
                  parts: finalParts.map(p => ({
                    id: p.id,
                    partName: p.partName,
                    partDescription: p.partDescription,
                    totalCost: p.totalCost,
                    totalSell: p.totalSell,
                  })),
                } as any);
                onClose();
              }}>
                Save All Parts ({parts.length})
              </Button>
            ) : (
              <Button variant="primary" onClick={onClose}>Done</Button>
            )}
          </div>
        </div>

        <ConfirmDialog
          isOpen={showDeletePartConfirm !== null}
          onClose={() => setShowDeletePartConfirm(null)}
          onConfirm={() => { if (showDeletePartConfirm !== null) doRemovePart(showDeletePartConfirm); }}
          title="Delete Part?"
          message="This part has content configured. Are you sure you want to delete it? This cannot be undone."
          confirmLabel="Delete Part"
        />
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// PRICE BREAKDOWN DIALOG — fully isolated from the parent, owns its own state
// ═════════════════════════════════════════════════════════════════════════════

interface PriceBreakdownDialogProps {
  lines: PricingServiceLine[];
  onSave: (updatedLines: PricingServiceLine[]) => void;
  onRecalculate: () => void;
  onClose: () => void;
}

// Format decimal hours → "1h 30m" or "45m"
const fmtHours = (h: number) => {
  if (h <= 0) return '—';
  const totalMin = Math.round(h * 60);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hrs === 0) return `${mins}m`;
  return mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
};

// Parse "1h 30m", "45m", "1.5" (decimal hours) → decimal hours
const parseHoursInput = (s: string): number | null => {
  const trimmed = s.trim();
  // "1h 30m" or "1h30m"
  const hm = trimmed.match(/^(\d+)h\s*(\d+)m?$/i);
  if (hm) return parseInt(hm[1]) + parseInt(hm[2]) / 60;
  // "45m"
  const m = trimmed.match(/^(\d+)m?$/i);
  if (m) return parseInt(m[1]) / 60;
  // decimal hours "1.5"
  const n = parseFloat(trimmed);
  if (!isNaN(n) && n >= 0) return n;
  return null;
};

const isTimeBased = (line: PricingServiceLine) => line.hourlyCost != null && line.hoursActual != null;
const isQtyBased  = (line: PricingServiceLine) => !isTimeBased(line) && line.quantity != null && line.unit !== 'flat';

const SERVICE_ACCENT: Record<string, { icon: React.ReactNode; dot: string }> = {
  Material: { icon: <Package  className="w-3.5 h-3.5 text-amber-500"  />, dot: 'bg-amber-400'  },
  Printing: { icon: <Printer  className="w-3.5 h-3.5 text-blue-500"   />, dot: 'bg-blue-400'   },
  Setup:    { icon: <Settings2 className="w-3.5 h-3.5 text-gray-400"  />, dot: 'bg-gray-300'   },
  Cutting:  { icon: <Scissors  className="w-3.5 h-3.5 text-purple-500"/>, dot: 'bg-purple-400' },
  Folding:  { icon: <FoldVertical className="w-3.5 h-3.5 text-emerald-500" />, dot: 'bg-emerald-400' },
  Drilling: { icon: <CircleDot className="w-3.5 h-3.5 text-orange-500"/>, dot: 'bg-orange-400' },
  Labor:    { icon: <Hand      className="w-3.5 h-3.5 text-blue-500"  />, dot: 'bg-blue-400'   },
  Brokered: { icon: <Package  className="w-3.5 h-3.5 text-violet-500" />, dot: 'bg-violet-400' },
};

export const PriceBreakdownDialog: React.FC<PriceBreakdownDialogProps> = ({ lines, onSave, onRecalculate, onClose }) => {
  const [localLines, setLocalLines] = useState<PricingServiceLine[]>(() =>
    lines.map(l => ({ ...l }))
  );
  // Per-row time input buffer (what the user is typing before parse)
  const [timeInputs, setTimeInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    lines.forEach(l => { if (l.hoursCharge != null) init[l.id] = fmtHours(l.hoursCharge); });
    return init;
  });
  const [timeErrors, setTimeErrors] = useState<Record<string, boolean>>({});

  // ── Totals row editing state ──────────────────────────────────────────
  const [totalMarkupInput, setTotalMarkupInput] = useState<string | null>(null);
  const [totalSellInput, setTotalSellInput]     = useState<string | null>(null);
  const [totalMarkupError, setTotalMarkupError] = useState(false);
  const [totalSellError, setTotalSellError]     = useState(false);

  // Derived totals — always computed from live localLines
  const totalCost   = localLines.reduce((s, l) => s + l.totalCost, 0);
  const totalSell   = localLines.reduce((s, l) => s + l.sellPrice, 0);
  const totalMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
  const marginPct   = totalSell > 0 ? ((totalSell - totalCost) / totalSell) * 100 : 0;

  // ── Per-line field update ─────────────────────────────────────────────
  const updateField = (id: string, field: 'totalCost' | 'markupPercent' | 'sellPrice', raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    setLocalLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (field === 'totalCost') {
        const mk = val > 0 ? ((l.sellPrice - val) / val) * 100 : l.markupPercent;
        return { ...l, totalCost: val, markupPercent: parseFloat(mk.toFixed(2)) };
      }
      if (field === 'markupPercent') {
        return { ...l, markupPercent: val, sellPrice: parseFloat((l.totalCost * (1 + val / 100)).toFixed(2)) };
      }
      if (field === 'sellPrice') {
        const mk = l.totalCost > 0 ? ((val - l.totalCost) / l.totalCost) * 100 : 0;
        return { ...l, sellPrice: val, markupPercent: parseFloat(mk.toFixed(2)) };
      }
      return l;
    }));
  };

  // ── Totals-row: scale all lines proportionally by markup ──────────────
  const applyTotalMarkup = (raw: string) => {
    const newMarkup = parseFloat(raw);
    if (isNaN(newMarkup)) { setTotalMarkupError(true); return; }
    setTotalMarkupError(false);
    setLocalLines(prev => prev.map(l => {
      const newSell = parseFloat((l.totalCost * (1 + newMarkup / 100)).toFixed(2));
      return { ...l, markupPercent: parseFloat(newMarkup.toFixed(2)), sellPrice: newSell };
    }));
    setTotalMarkupInput(null);
  };

  // ── Totals-row: scale all sell prices proportionally to reach new total ─
  const applyTotalSell = (raw: string) => {
    const newTotal = parseFloat(raw);
    if (isNaN(newTotal) || newTotal < 0) { setTotalSellError(true); return; }
    setTotalSellError(false);
    const currentTotal = localLines.reduce((s, l) => s + l.sellPrice, 0);
    if (currentTotal === 0) return;
    const ratio = newTotal / currentTotal;
    setLocalLines(prev => prev.map(l => {
      const newSell = parseFloat((l.sellPrice * ratio).toFixed(2));
      const mk = l.totalCost > 0 ? ((newSell - l.totalCost) / l.totalCost) * 100 : 0;
      return { ...l, sellPrice: newSell, markupPercent: parseFloat(mk.toFixed(2)) };
    }));
    setTotalSellInput(null);
  };

  const commitTimeInput = (id: string) => {
    const raw = timeInputs[id] ?? '';
    const h = parseHoursInput(raw);
    if (h === null) { setTimeErrors(e => ({ ...e, [id]: true })); return; }
    setTimeErrors(e => ({ ...e, [id]: false }));
    setLocalLines(prev => prev.map(l => {
      if (l.id !== id || l.hourlyCost == null) return l;
      const newCost = h * l.hourlyCost;
      const newSell = newCost * (1 + l.markupPercent / 100);
      return { ...l, hoursCharge: h, totalCost: parseFloat(newCost.toFixed(2)), sellPrice: parseFloat(newSell.toFixed(2)) };
    }));
    setTimeInputs(t => ({ ...t, [id]: fmtHours(h) }));
  };

  // Format a number for input display — always 2 decimal places for currency, 2 for %
  const fmtNum = (n: number, dp = 2) => {
    if (n === 0) return '0';
    return parseFloat(n.toFixed(dp)).toString();
  };

  // All inputs and text in the breakdown table use [11px] — slightly smaller than xs (12px)
  // to pack more content without crowding.
  const inp = (extra = '') =>
    `w-full px-1 py-1 text-[11px] text-right num bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent transition-colors ${extra}`;

  const totInp = (hasError: boolean, extra = '') =>
    `w-full px-1 py-1 text-[11px] text-right num border rounded focus:outline-none focus:ring-1 transition-colors font-bold ${
      hasError
        ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300'
        : 'border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-300'
    } ${extra}`;

  const thCls    = 'py-1 px-1.5 text-[8px] font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap';
  const thSell   = 'py-1 px-1.5 text-[8px] font-bold uppercase tracking-wider text-right whitespace-nowrap text-emerald-600 bg-emerald-50';
  const tdCls    = 'py-1.5 px-1.5';
  const tdSell   = 'py-1.5 px-1.5 bg-emerald-50/60';   // sell-side body cells
  const numCls   = 'text-[11px] num';
  const dimCls   = 'text-gray-300 text-right block text-[11px]';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[1350px] flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              Edit Price Breakdown
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Click any cell to edit · Click totals row markup % or sell $ to scale all lines</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full border-collapse" style={{ minWidth: '1020px', fontSize: '11px' }}>

            {/* Column widths — scaled ~25% wider overall; sell cols get extra room */}
            <colgroup>
              <col style={{ width: '100px' }} /> {/* Service */}
              <col />                             {/* Description — flexible, absorbs remaining */}
              {/* TIME */}
              <col style={{ width: '76px'  }} />
              <col style={{ width: '64px'  }} />
              <col style={{ width: '86px'  }} />
              <col style={{ width: '76px'  }} />
              {/* COST */}
              <col style={{ width: '92px'  }} />
              <col style={{ width: '76px'  }} />
              <col style={{ width: '96px'  }} />
              {/* SELL — extra wide so numbers + % symbol never clip */}
              <col style={{ width: '108px' }} />
              <col style={{ width: '116px' }} />
            </colgroup>

            <thead className="sticky top-0 z-10 bg-white">
              {/* Group band — TIME | COST (violet) | SELL (emerald) */}
              <tr className="border-b border-gray-100">
                <th className="px-3 pt-2 pb-0" colSpan={2} />
                {/* TIME group */}
                <th className="px-1 pt-2 pb-0 text-center text-[8px] font-bold uppercase tracking-widest text-sky-500 bg-sky-50 border-l border-sky-200" colSpan={4}>
                  Time
                </th>
                {/* COST group */}
                <th className="px-1 pt-2 pb-0 text-center text-[8px] font-bold uppercase tracking-widest text-violet-500 bg-violet-50 border-l border-violet-200" colSpan={3}>
                  Cost
                </th>
                {/* SELL group — distinct emerald band with thick left divider */}
                <th className="px-1 pt-2 pb-0 text-center text-[8px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border-l-2 border-emerald-400" colSpan={2}>
                  Sell
                </th>
              </tr>
              {/* Column labels */}
              <tr className="border-b-2 border-gray-200">
                <th className="py-1 pl-3 pr-1.5 text-[8px] font-bold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap">Service</th>
                <th className="py-1 pl-2 pr-1.5 text-[8px] font-bold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap">Description</th>
                {/* TIME cols */}
                <th className={`${thCls} bg-sky-50 border-l border-sky-200`}>$/hr</th>
                <th className={`${thCls} bg-sky-50`}>Calc</th>
                <th className={`${thCls} bg-sky-50`}>Charge</th>
                <th className={`${thCls} bg-sky-50`}>Time $</th>
                {/* COST cols */}
                <th className={`${thCls} bg-violet-50 border-l border-violet-200`}>Qty</th>
                <th className={`${thCls} bg-violet-50`}>Unit $</th>
                <th className={`${thCls} bg-violet-50`}>Cost $</th>
                {/* SELL cols — thick emerald left border as visual divider */}
                <th className={`${thSell} border-l-2 border-emerald-400`}>Markup %</th>
                <th className={`${thSell} pr-3`}>Sell $</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {localLines.map(line => {
                const accent = SERVICE_ACCENT[line.service] ?? { dot: 'bg-gray-300' };
                const timeBased = isTimeBased(line);
                const qtyBased  = isQtyBased(line);
                const timeErr   = timeErrors[line.id];

                return (
                  <tr key={line.id} className="hover:bg-gray-50/70 transition-colors">

                    {/* Service */}
                    <td className={`${tdCls} pl-3`}>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-sm flex-shrink-0 ${accent.dot}`} />
                        <span className={`font-semibold text-gray-800 truncate ${numCls}`}>{line.service}</span>
                      </div>
                    </td>

                    {/* Description — full width, tooltip on hover for clipped text */}
                    <td className={`${tdCls} pl-2`} style={{ maxWidth: 0 }}>
                      <span className="text-gray-500 block truncate" title={line.description}>{line.description}</span>
                    </td>

                    {/* ── TIME ── */}
                    <td className={`${tdCls} bg-sky-50/40 border-l border-sky-100 text-right`}>
                      {timeBased ? <span className={`text-sky-700 font-medium ${numCls}`}>{formatCurrency(line.hourlyCost!)}</span> : <span className={dimCls}>—</span>}
                    </td>
                    <td className={`${tdCls} bg-sky-50/40 text-right`}>
                      {timeBased ? <span className={`text-gray-500 ${numCls}`}>{fmtHours(line.hoursActual!)}</span> : <span className={dimCls}>—</span>}
                    </td>
                    <td className={`${tdCls} bg-sky-50/40`}>
                      {timeBased ? (
                        <input
                          type="text"
                          value={timeInputs[line.id] ?? fmtHours(line.hoursCharge ?? line.hoursActual ?? 0)}
                          onChange={e => setTimeInputs(t => ({ ...t, [line.id]: e.target.value }))}
                          onBlur={() => commitTimeInput(line.id)}
                          onKeyDown={e => { if (e.key === 'Enter') commitTimeInput(line.id); }}
                          placeholder="45m"
                          className={`${inp(timeErr ? 'border-red-400' : 'border-sky-300')} text-sky-800`}
                          title="45m · 1h · 1h 30m"
                        />
                      ) : <span className={dimCls}>—</span>}
                    </td>
                    <td className={`${tdCls} bg-sky-50/40 text-right`}>
                      {timeBased ? <span className={`text-sky-800 font-medium ${numCls}`}>{formatCurrency(line.totalCost)}</span> : <span className={dimCls}>—</span>}
                    </td>

                    {/* ── PRICING ── */}
                    <td className={`${tdCls} bg-violet-50/30 border-l border-violet-100 text-right`}>
                      {qtyBased && line.quantity != null ? (
                        <span className={`text-gray-600 ${numCls}`}>{line.quantity.toLocaleString()}<span className="text-[9px] text-gray-400 ml-0.5">{line.unit}</span></span>
                      ) : <span className={dimCls}>—</span>}
                    </td>
                    <td className={`${tdCls} bg-violet-50/30 text-right`}>
                      {(qtyBased || line.service === 'Setup') && line.unitCost > 0 ? (
                        <span className={`text-gray-600 ${numCls}`}>{formatCurrency(line.unitCost)}</span>
                      ) : <span className={dimCls}>—</span>}
                    </td>

                    {/* Cost $ — editable */}
                    <td className={`${tdCls} bg-violet-50/30`}>
                      <input
                        type="number" step="0.01" min="0"
                        value={fmtNum(line.totalCost)}
                        onChange={e => updateField(line.id, 'totalCost', e.target.value)}
                        className={inp('text-gray-700')}
                      />
                    </td>

                    {/* Markup % — SELL SIDE — thick left border divides cost from sell */}
                    <td className={`${tdSell} border-l-2 border-emerald-400`}>
                      <div className="relative">
                        <input
                          type="number" step="0.1"
                          value={fmtNum(line.markupPercent)}
                          onChange={e => updateField(line.id, 'markupPercent', e.target.value)}
                          className={`${inp('border-emerald-200 focus:ring-emerald-300')} pr-3 ${line.markupPercent > 0 ? 'text-emerald-700 font-semibold bg-emerald-50/80' : 'text-gray-400'}`}
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-emerald-400 pointer-events-none">%</span>
                      </div>
                    </td>

                    {/* Sell Price — SELL SIDE */}
                    <td className={`${tdSell} pr-3`}>
                      <input
                        type="number" step="0.01" min="0"
                        value={fmtNum(line.sellPrice)}
                        onChange={e => updateField(line.id, 'sellPrice', e.target.value)}
                        className={inp('font-bold text-emerald-900 bg-emerald-50/80 border-emerald-200 focus:ring-emerald-300')}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ── Totals row — click markup % or sell $ to scale all lines ── */}
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                {/* Label */}
                <td className="py-1.5 pl-3 pr-1" colSpan={2}>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Total</span>
                    <span className="text-[8px] text-gray-400 normal-case">— click % or $ to scale all</span>
                  </div>
                </td>
                {/* TIME totals */}
                <td className="py-1.5 px-1 bg-sky-50/60 border-l border-sky-200" colSpan={2} />
                <td className={`py-1.5 px-1 bg-sky-50/60 text-right ${numCls} text-sky-600`}>
                  {fmtHours(localLines.reduce((s, l) => s + (l.hoursCharge ?? l.hoursActual ?? 0), 0))}
                </td>
                <td className={`py-1.5 px-1 bg-sky-50/60 text-right ${numCls} text-sky-700 font-semibold`}>
                  {formatCurrency(localLines.filter(isTimeBased).reduce((s, l) => s + l.totalCost, 0))}
                </td>
                {/* PRICING totals */}
                <td className="py-1.5 px-1 bg-violet-50/60 border-l border-violet-200" colSpan={2} />
                {/* Total Cost — read-only */}
                <td className={`py-1.5 px-1 bg-violet-50/60 text-right ${numCls} font-bold text-gray-800`}>
                  {formatCurrency(totalCost)}
                </td>
                {/* Total Markup % — SELL SIDE — editable, scales all lines */}
                <td className="py-1 px-1 bg-emerald-50/80 border-l-2 border-emerald-400">
                  {totalMarkupInput !== null ? (
                    <div className="relative">
                      <input
                        type="number" step="0.1" autoFocus
                        value={totalMarkupInput}
                        onChange={e => { setTotalMarkupInput(e.target.value); setTotalMarkupError(false); }}
                        onBlur={e => applyTotalMarkup(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') applyTotalMarkup((e.target as HTMLInputElement).value);
                          if (e.key === 'Escape') { setTotalMarkupInput(null); setTotalMarkupError(false); }
                        }}
                        className={`${totInp(totalMarkupError)} pr-3`}
                        placeholder="80"
                      />
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-emerald-600 pointer-events-none">%</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTotalMarkupInput(fmtNum(totalMarkup))}
                      title="Click to scale all line markups to this %"
                      className={`w-full px-1 py-1 text-right ${numCls} font-bold rounded border border-dashed border-emerald-400 hover:border-emerald-600 hover:bg-emerald-100/60 transition-colors text-emerald-700`}
                    >
                      {totalMarkup.toFixed(1)}%
                    </button>
                  )}
                </td>
                {/* Total Sell Price — SELL SIDE — editable, scales all lines */}
                <td className="py-1 px-1 pr-3 bg-emerald-50/80">
                  {totalSellInput !== null ? (
                    <input
                      type="number" step="0.01" min="0" autoFocus
                      value={totalSellInput}
                      onChange={e => { setTotalSellInput(e.target.value); setTotalSellError(false); }}
                      onBlur={e => applyTotalSell(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') applyTotalSell((e.target as HTMLInputElement).value);
                        if (e.key === 'Escape') { setTotalSellInput(null); setTotalSellError(false); }
                      }}
                      className={totInp(totalSellError, 'text-[12px]')}
                      placeholder="40.00"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTotalSellInput(fmtNum(totalSell))}
                      title="Click to scale all sell prices to this total"
                      className={`w-full px-1 py-1 text-right ${numCls} text-[12px] font-bold rounded border border-dashed border-emerald-400 hover:border-emerald-600 hover:bg-emerald-100/60 transition-colors text-emerald-900`}
                    >
                      {formatCurrency(totalSell)}
                    </button>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Summary bar ── */}
        <div className="px-5 py-2 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-gray-500">
              Cost: <span className="font-semibold text-gray-800 num">{formatCurrency(totalCost)}</span>
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">
              Profit: <span className="font-semibold text-emerald-700 num">{formatCurrency(totalSell - totalCost)}</span>
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">
              Margin: <span className={`font-bold num ${marginPct >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{marginPct.toFixed(1)}%</span>
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">
              Sell: <span className="font-bold text-gray-900 num text-[13px]">{formatCurrency(totalSell)}</span>
            </span>
          </div>
          <span className="text-[9px] text-gray-300 hidden lg:block">Time: <code className="bg-gray-100 px-1 rounded">45m · 1h · 1h 30m</code></span>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onRecalculate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-[#F890E7] hover:bg-pink-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset to calculated values
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="success" onClick={() => onSave(localLines)}>Apply Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
