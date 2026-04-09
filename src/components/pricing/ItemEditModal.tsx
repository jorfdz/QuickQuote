import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Search, X, Scissors, FoldVertical, CircleDot, Printer,
  Package, DollarSign, Grid3X3, Edit3, Check, Star, Settings2,
  Percent, Hash, Info, RefreshCw, Eye, Layers, Wrench, Hand, Lock, LockOpen,
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
  // Multi-quantity string (e.g. "1000, 2000, 5000") — persists the full input across sessions
  multiQtyString?: string;
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
  multiQtyString: '',
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
  // Restore the full multi-qty string from pricingContext if it was previously saved
  const [multiQtyInput, setMultiQtyInput] = useState(ps.multiQtyString || String(ps.quantity || 1000));
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
  // • New items: panel starts OPEN — collapses automatically the moment the user
  //   clicks anything outside the product field (trackInteraction fires).
  // • Existing items: panel starts COLLAPSED — user can re-open with the ⭐ button.
  const [templatePanelCollapsed, setTemplatePanelCollapsed] = useState(!isNew);
  const [userInteracted, setUserInteracted] = useState(false);
  // Ref attached to the template panel div so clicks inside it don't collapse it
  const templatePanelRef = React.useRef<HTMLDivElement>(null);

  // ── Price breakdown state ────────────────────────────────────────────
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});
  // ── Inline breakdown state (replaces separate dialog) ─────────────────
  const [breakdownExpanded, setBreakdownExpanded] = useState(false);
  const [bTimeInputs, setBTimeInputs] = useState<Record<string, string>>({});
  const [bQtyInputs,  setBQtyInputs]  = useState<Record<string, string>>({});
  const [bTimeErrors, setBTimeErrors] = useState<Record<string, boolean>>({});
  const [bQtyErrors,  setBQtyErrors]  = useState<Record<string, boolean>>({});
  const [bLockedIds,  setBLockedIds]  = useState<Set<string>>(new Set());
  const [bShowProfit, setBShowProfit] = useState(false);
  const [bTotalMkInput, setBTotalMkInput] = useState<string | null>(null);
  const [bTotalSellInput, setBTotalSellInput] = useState<string | null>(null);
  const [bTotalMkErr,   setBTotalMkErr]   = useState(false);
  const [bTotalSellErr, setBTotalSellErr] = useState(false);

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
  const [serviceNotes, setServiceNotes] = useState<Record<string, string>>(() => ps.serviceNotes ?? {});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

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

  useEffect(() => {
    if (JSON.stringify(serviceNotes) !== JSON.stringify(ps.serviceNotes ?? {})) {
      onUpdatePricing({ serviceNotes });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceNotes]);

  // Sync multiQtyString → pricingContext so it survives modal close/reopen
  useEffect(() => {
    if (multiQtyInput !== (ps.multiQtyString ?? '')) {
      onUpdatePricing({ multiQtyString: multiQtyInput });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiQtyInput]);

  // Sync first material entry to pricing state
  useEffect(() => {
    if (materialEntries.length > 0) {
      const first = materialEntries[0];
      if (first.materialId !== ps.materialId || first.sides !== ps.sides || first.colorMode !== ps.colorMode || (first.originals ?? 1) !== (ps.originals ?? 1)) {
        onUpdatePricing({
          materialId: first.materialId,
          sides: first.sides,
          colorMode: first.colorMode,
          originals: first.originals ?? 1,
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
  // Only reset the qty input when the quantity changes AND there's no saved multi-qty string.
  // Without this guard, external quantity updates (template load) would wipe a "1000,2000,5000" string.
  useEffect(() => {
    if (!ps.multiQtyString) setMultiQtyInput(String(ps.quantity || 1000));
  }, [ps.quantity]); // eslint-disable-line react-hooks/exhaustive-deps
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

  // Auto-collapse: hide the template panel when the user clicks anywhere outside it.
  // Applies whenever the panel is expanded (new or existing items).
  useEffect(() => {
    if (templatePanelCollapsed || matchingTemplates.length === 0) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (templatePanelRef.current && !templatePanelRef.current.contains(e.target as Node)) {
        setTemplatePanelCollapsed(true);
      }
    };
    // Use capture phase so we get the event before any React handlers consume it
    document.addEventListener('mousedown', handleMouseDown, true);
    return () => document.removeEventListener('mousedown', handleMouseDown, true);
  }, [templatePanelCollapsed, matchingTemplates.length]);

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
    // originals: each unique design/artwork requires its own full press run.
    // Total sheets = sheetsNeeded per run × number of originals.
    const originals = ps.originals ?? 1;
    if (selectedMaterial && imposition.sheetsNeeded > 0) {
      const sheetsPerRun = imposition.sheetsNeeded;
      const totalSheets = sheetsPerRun * originals;
      const costPerSheet = selectedMaterial.pricePerM / 1000;
      const totalCost = totalSheets * costPerSheet;
      const markup = selectedMaterial.markup;
      const originalsNote = originals > 1 ? ` × ${originals} originals` : '';
      lines.push({
        id: slId('material'), service: 'Material',
        description: `${selectedMaterial.name} (${selectedMaterial.size}) — ${totalSheets} sheets${originalsNote}`,
        quantity: totalSheets, unit: 'sheets', unitCost: costPerSheet,
        totalCost, markupPercent: markup, sellPrice: totalCost * (1 + markup / 100), editable: true,
      });
    }

    // PRINTING — stable id: sl_printing_0
    // Clicks also multiply by originals — each original is a separate press run.
    const effectiveSheetsNeeded = imposition.sheetsNeeded * originals;
    if (selectedEquipment) {
      if (selectedEquipment.costUnit === 'per_click') {
        const totalClicks = effectiveSheetsNeeded * (ps.sides === 'Double' ? 2 : 1);
        const costPerClick = selectedEquipment.unitCost;
        const clickCost   = totalClicks * costPerClick;
        const sellPerClick = lookupClickPrice(selectedEquipment.id, totalClicks, ps.colorMode);
        const clickSell   = totalClicks * sellPerClick;

        // ── Cost + Time equipment (e.g. "Ricoh 9200 w/ Staff Support") ──────
        // When costType === 'cost_plus_time', add operator/staff time on top of
        // the per-click cost: time = totalClicks / unitsPerHour × timeCostPerHour.
        // The time portion uses the same proportional markup as the click portion.
        const isCostPlusTime =
          selectedEquipment.costType === 'cost_plus_time' &&
          (selectedEquipment.unitsPerHour ?? 0) > 0 &&
          (selectedEquipment.timeCostPerHour ?? 0) > 0;

        let totalCost = clickCost;
        let totalSell = clickSell;
        let descSuffix = '';

        if (isCostPlusTime) {
          const hours        = totalClicks / selectedEquipment.unitsPerHour!;
          const timeCostRate = selectedEquipment.timeCostPerHour!;
          const timeCost     = hours * timeCostRate;

          // Apply the same markup ratio as the click tier to the time component
          const clickMarkupRatio = clickCost > 0 ? clickSell / clickCost : 1;
          const timeSell = timeCost * clickMarkupRatio;

          totalCost = clickCost + timeCost;
          totalSell = clickSell + timeSell;
          descSuffix = ` + ${hours.toFixed(2)}h staff @ ${fmt(timeCostRate)}/hr`;

          // Also push a separate time service line so it's visible in the breakdown
          const timeMarkupPct = timeCost > 0 ? ((timeSell - timeCost) / timeCost) * 100 : 0;
          lines.push({
            id: slId('printing_time'), service: 'Printing',
            description: `${selectedEquipment.name} — staff time: ${hours.toFixed(2)}h @ ${fmt(timeCostRate)}/hr`,
            quantity: totalClicks, unit: 'clicks', unitCost: timeCostRate / selectedEquipment.unitsPerHour!,
            totalCost: timeCost, markupPercent: timeMarkupPct, sellPrice: timeSell, editable: true,
            hourlyCost: timeCostRate, hoursActual: hours, hoursCharge: hours,
          });
        }

        const markupPct = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
        lines.push({
          id: slId('printing'), service: 'Printing',
          description: `${selectedEquipment.name} — ${totalClicks} clicks (${ps.colorMode}, ${ps.sides === 'Double' ? '2-sided' : '1-sided'}) @ ${fmt(sellPerClick)}/click${descSuffix}`,
          quantity: totalClicks, unit: 'clicks', unitCost: costPerClick,
          totalCost: clickCost, markupPercent: markupPct, sellPrice: clickSell, editable: true,
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
    if (ps.cuttingEnabled && effectiveSheetsNeeded > 0 && imposition.cutsPerSheet > 0) {
      const cutSvc = finishing.find(f => f.name === 'Cut');
      if (cutSvc) {
        const totalStacks = Math.ceil(effectiveSheetsNeeded / ps.sheetsPerStack);
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
      ps.quantity, ps.originals, ps.sides, ps.colorMode, ps.materialId, ps.equipmentId,
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
      // Exception: if the selected equipment is cost_plus_time but the saved lines don't have
      // a time entry for Printing, the saved data is stale — force a fresh recompute.
      const hasCostPlusTime = selectedEquipment?.costType === 'cost_plus_time';
      const hasPrintingTimeLine = ps.serviceLines.some(
        l => l.service === 'Printing' && l.hourlyCost != null
      );
      if (hasCostPlusTime && !hasPrintingTimeLine) {
        // Stale lines — drop the guard and recompute
        skipInitialRecompute.current = false;
      } else {
        if (!userChangedPricing.current) return;  // still on initial open — preserve saved lines
        skipInitialRecompute.current = false;       // user changed something — allow recompute from now on
      }
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
  // ── Full pricing computation for any quantity ─────────────────────────────
  // Mirrors computeServiceLines exactly, parameterized by qty so multi-qty
  // pricing uses the same logic as the main price breakdown.
  const computeCostSellForQty = useCallback((qty: number): { cost: number; sell: number } => {
    let tCost = 0;
    let tSell = 0;
    const originals = ps.originals ?? 1;

    // Compute imposition for this specific qty
    let sheetsNeeded = 0;
    let cutsPerSheet = 0;
    if (selectedMaterial && ps.finalWidth > 0 && ps.finalHeight > 0) {
      const rawImp = calculateImposition(ps.finalWidth, ps.finalHeight, selectedMaterial.sizeWidth, selectedMaterial.sizeHeight);
      const ups = rawImp.totalUps > 0 ? rawImp.totalUps : 1;
      sheetsNeeded = Math.ceil((qty * originals) / ups);
      cutsPerSheet = rawImp.upsAcross + rawImp.upsDown; // same formula as main imposition

      // MATERIAL
      const costPerSheet = selectedMaterial.pricePerM / 1000;
      tCost += sheetsNeeded * costPerSheet;
      tSell += sheetsNeeded * costPerSheet * (1 + selectedMaterial.markup / 100);
    }

    // PRINTING
    if (selectedEquipment) {
      const effectiveSheets = sheetsNeeded;
      if (selectedEquipment.costUnit === 'per_click') {
        const totalClicks = effectiveSheets * (ps.sides === 'Double' ? 2 : 1);
        const clickCost   = totalClicks * selectedEquipment.unitCost;
        const sellPerClick = lookupClickPrice(selectedEquipment.id, totalClicks, ps.colorMode);
        const clickSell   = totalClicks * sellPerClick;
        tCost += clickCost;
        tSell += clickSell;
        // Cost+Time equipment: add staff time cost proportionally
        if (selectedEquipment.costType === 'cost_plus_time' &&
            (selectedEquipment.unitsPerHour ?? 0) > 0 &&
            (selectedEquipment.timeCostPerHour ?? 0) > 0) {
          const hours    = totalClicks / selectedEquipment.unitsPerHour!;
          const timeCost = hours * selectedEquipment.timeCostPerHour!;
          const ratio    = clickCost > 0 ? clickSell / clickCost : 1;
          tCost += timeCost;
          tSell += timeCost * ratio;
        }
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

    // CUTTING
    if (ps.cuttingEnabled && sheetsNeeded > 0 && cutsPerSheet > 0) {
      const cutSvc = finishing.find(f => f.name === 'Cut');
      if (cutSvc) {
        const totalStacks = Math.ceil(sheetsNeeded / ps.sheetsPerStack);
        const totalCuts   = cutsPerSheet * totalStacks;
        const hours       = totalCuts / cutSvc.outputPerHour;
        const cost = cutSvc.pricingMode === 'fixed' ? (cutSvc.fixedChargeCost ?? 0) : hours * cutSvc.hourlyCost;
        const rcRate = lookupServiceSellRate(cutSvc, totalCuts);
        const sell = cutSvc.pricingMode === 'fixed'
          ? (cutSvc.fixedChargeAmount ?? 0)
          : rcRate !== null ? totalCuts * rcRate : cost * (1 + cutSvc.markupPercent / 100);
        tCost += cost; tSell += sell;
      }
    }

    // FOLDING
    if (ps.foldingType) {
      const fSvc = finishing.find(f => f.name.toLowerCase().replace('-', '') === ps.foldingType.toLowerCase().replace('-', ''));
      if (fSvc) {
        const hours = qty / fSvc.outputPerHour;
        const cost = fSvc.pricingMode === 'fixed' ? (fSvc.fixedChargeCost ?? 0) : hours * fSvc.hourlyCost;
        const rcRate = lookupServiceSellRate(fSvc, qty);
        const sell = fSvc.pricingMode === 'fixed'
          ? (fSvc.fixedChargeAmount ?? 0)
          : rcRate !== null ? qty * rcRate : cost * (1 + fSvc.markupPercent / 100);
        tCost += cost; tSell += sell;
      }
    }

    // DRILLING
    if (ps.drillingType) {
      const dSvc = finishing.find(f => f.name === ps.drillingType);
      if (dSvc) {
        const hours = qty / dSvc.outputPerHour;
        const cost = dSvc.pricingMode === 'fixed' ? (dSvc.fixedChargeCost ?? 0) : hours * dSvc.hourlyCost;
        const rcRate = lookupServiceSellRate(dSvc, qty);
        const sell = dSvc.pricingMode === 'fixed'
          ? (dSvc.fixedChargeAmount ?? 0)
          : rcRate !== null ? qty * rcRate : cost * (1 + dSvc.markupPercent / 100);
        tCost += cost; tSell += sell;
      }
    }

    // LABOR
    selectedLaborIds.forEach(lid => {
      const svc = pricing.labor.find(l => l.id === lid);
      if (!svc) return;
      const basis = svc.chargeBasis ?? 'per_hour';
      if (svc.pricingMode === 'fixed') {
        tCost += svc.fixedChargeCost ?? 0;
        tSell += svc.fixedChargeAmount ?? 0;
      } else {
        let q = 1;
        if (basis === 'per_hour')   q = qty > 0 && svc.outputPerHour > 0 ? qty / svc.outputPerHour : 1;
        else if (basis === 'per_sqft')   q = ps.finalWidth > 0 && ps.finalHeight > 0 ? (ps.finalWidth * ps.finalHeight * qty) / 144 : qty;
        else if (basis === 'per_unit')   q = qty;
        else if (basis === 'per_1000')   q = qty / 1000;
        const cost = svc.hourlyCost * q;
        const rcRate = lookupServiceSellRate(svc, q);
        const sell = rcRate !== null ? q * rcRate : Math.max(cost * (1 + svc.markupPercent / 100), svc.minimumCharge ?? 0);
        tCost += cost; tSell += sell;
      }
    });

    // BROKERED
    selectedBrokeredIds.forEach(bid => {
      const svc = pricing.brokered.find(b => b.id === bid);
      if (!svc) return;
      if (svc.pricingMode === 'fixed') {
        tCost += svc.unitCost;
        tSell += svc.initialSetupFee;
      } else {
        let q = 1;
        if (svc.costBasis === 'per_unit')       q = qty;
        else if (svc.costBasis === 'per_sqft')  q = ps.finalWidth > 0 && ps.finalHeight > 0 ? (ps.finalWidth * ps.finalHeight * qty) / 144 : qty;
        else if (svc.costBasis === 'per_linear_ft') q = ps.finalWidth > 0 ? ps.finalWidth * qty : qty;
        const cost = svc.unitCost * q + svc.initialSetupFee;
        const rcRate = lookupServiceSellRate(svc, q);
        const sell = rcRate !== null ? q * rcRate + svc.initialSetupFee : cost * (1 + svc.markupPercent / 100);
        tCost += cost; tSell += sell;
      }
    });

    return { cost: tCost, sell: tSell };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMaterial, selectedEquipment, imposition,
      ps.quantity, ps.originals, ps.sides, ps.colorMode,
      ps.cuttingEnabled, ps.sheetsPerStack, ps.foldingType, ps.drillingType,
      ps.finalWidth, ps.finalHeight,
      selectedLaborIds, selectedBrokeredIds,
      finishing, lookupClickPrice, pricing.labor, pricing.brokered]);

  const multiQtyPricing = useMemo(() => {
    if (!isMultiQty) return [];

    // Compute the "natural" (no-manual-override) sell for the primary quantity
    const primaryNatural = computeCostSellForQty(ps.quantity);

    // Override ratio: if user manually adjusted the primary qty's sell price,
    // apply that same proportional premium to all other quantities.
    // itemTotalSell = ps.serviceLines.reduce(...) which reflects manual overrides.
    const primaryActualSell = ps.serviceLines.length > 0
      ? ps.serviceLines.reduce((s, l) => s + l.sellPrice, 0)
      : primaryNatural.sell;
    const overrideRatio = primaryNatural.sell > 0 ? primaryActualSell / primaryNatural.sell : 1;

    return parsedQuantities.map(qty => {
      const { cost, sell: naturalSell } = computeCostSellForQty(qty);
      // Apply the same proportional override the user made on the primary quantity
      const sell = naturalSell * overrideRatio;
      return { qty, cost, sell };
    });
  }, [isMultiQty, parsedQuantities, computeCostSellForQty, ps.quantity, ps.serviceLines]);

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
      // Restore the full multi-qty string if it was saved (e.g. "1000, 2000, 5000")
      setMultiQtyInput(savedCtx.multiQtyString || String(savedCtx.quantity || product.defaultQuantity));
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
    const lines = computeServiceLines();
    onUpdatePricing({ serviceLines: lines });
    const totalCost = lines.reduce((s, l) => s + l.totalCost, 0);
    const totalSell = lines.reduce((s, l) => s + l.sellPrice, 0);
    const overallMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
    onUpdateItem({ totalCost, sellPrice: totalSell, markup: Math.round(overallMarkup) });
    // Reset inline breakdown buffers so inputs reflect new computed values
    const tInputs: Record<string, string> = {};
    const qInputs: Record<string, string> = {};
    lines.forEach(l => {
      if (l.hourlyCost != null) {
        const h = l.hoursCharge ?? l.hoursActual ?? 0;
        tInputs[l.id] = h > 0 ? `${Math.ceil(h * 60)} min` : '0 min';
      }
      if (l.quantity != null && l.unit !== 'flat') qInputs[l.id] = String(l.quantity);
    });
    setBTimeInputs(tInputs);
    setBQtyInputs(qInputs);
    setBTimeErrors({});
    setBQtyErrors({});
  };

  // ── Inline breakdown field helpers ────────────────────────────────────
  // Convert profit% → markup% for storage
  const profitToMarkupB = (p: number) => p >= 100 ? 9999 : (100 * p) / (100 - p);
  const markupToProfitB = (mk: number) => mk / (1 + mk / 100);

  // Apply a field change to ps.serviceLines and immediately sync to parent
  const bUpdateField = (id: string, field: 'unitCost' | 'totalCost' | 'markupPercent' | 'profitPercent' | 'sellPrice', raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    const updated = ps.serviceLines.map(l => {
      if (l.id !== id) return l;
      if (field === 'unitCost') {
        const qty = l.chargeQty ?? l.quantity ?? 1;
        const newCost = parseFloat((qty * val).toFixed(2));
        return { ...l, unitCost: val, totalCost: newCost, sellPrice: parseFloat((newCost * (1 + l.markupPercent / 100)).toFixed(2)) };
      }
      if (field === 'totalCost') {
        const mk = val > 0 ? ((l.sellPrice - val) / val) * 100 : l.markupPercent;
        return { ...l, totalCost: val, markupPercent: parseFloat(mk.toFixed(2)) };
      }
      if (field === 'markupPercent') {
        return { ...l, markupPercent: val, sellPrice: parseFloat((l.totalCost * (1 + val / 100)).toFixed(2)) };
      }
      if (field === 'profitPercent') {
        const mk = profitToMarkupB(val);
        return { ...l, markupPercent: parseFloat(mk.toFixed(2)), sellPrice: parseFloat((l.totalCost * (1 + mk / 100)).toFixed(2)) };
      }
      if (field === 'sellPrice') {
        const mk = l.totalCost > 0 ? ((val - l.totalCost) / l.totalCost) * 100 : 0;
        return { ...l, sellPrice: val, markupPercent: parseFloat(mk.toFixed(2)) };
      }
      return l;
    });
    const tc = updated.reduce((s, l) => s + l.totalCost, 0);
    const ts = updated.reduce((s, l) => s + l.sellPrice, 0);
    onUpdatePricing({ serviceLines: updated });
    onUpdateItem({ totalCost: tc, sellPrice: ts, markup: Math.round(tc > 0 ? ((ts - tc) / tc) * 100 : 0) });
    setManualOverrides(prev => ({ ...prev, [id]: true }));
  };

  const bCommitTime = (id: string) => {
    const raw = bTimeInputs[id] ?? '';
    // Parse "45 min", "45", "1h 30m" → decimal hours
    const trimmed = raw.trim();
    const hm = trimmed.match(/^(\d+)\s*h\s*(\d+)\s*m?$/i);
    const justMin = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:min|m)?$/i);
    let h: number | null = null;
    if (hm) h = parseInt(hm[1]) + parseInt(hm[2]) / 60;
    else if (justMin) h = parseFloat(justMin[1]) / 60;
    if (h === null || isNaN(h) || h < 0) { setBTimeErrors(e => ({ ...e, [id]: true })); return; }
    setBTimeErrors(e => ({ ...e, [id]: false }));
    const updated = ps.serviceLines.map(l => {
      if (l.id !== id || l.hourlyCost == null) return l;
      const newCost = parseFloat((h! * l.hourlyCost).toFixed(2));
      const newSell = parseFloat((newCost * (1 + l.markupPercent / 100)).toFixed(2));
      return { ...l, hoursCharge: h!, totalCost: newCost, sellPrice: newSell };
    });
    setBTimeInputs(t => ({ ...t, [id]: `${Math.ceil(h! * 60)} min` }));
    const tc = updated.reduce((s, l) => s + l.totalCost, 0);
    const ts = updated.reduce((s, l) => s + l.sellPrice, 0);
    onUpdatePricing({ serviceLines: updated });
    onUpdateItem({ totalCost: tc, sellPrice: ts, markup: Math.round(tc > 0 ? ((ts - tc) / tc) * 100 : 0) });
    setManualOverrides(prev => ({ ...prev, [id]: true }));
  };

  const bCommitQty = (id: string) => {
    const qty = parseFloat(bQtyInputs[id] ?? '');
    if (isNaN(qty) || qty <= 0) { setBQtyErrors(e => ({ ...e, [id]: true })); return; }
    setBQtyErrors(e => ({ ...e, [id]: false }));
    const updated = ps.serviceLines.map(l => {
      if (l.id !== id || l.hourlyCost != null || l.unit === 'flat' || l.quantity == null) return l;
      const newCost = parseFloat((qty * l.unitCost).toFixed(2));
      const newSell = parseFloat((newCost * (1 + l.markupPercent / 100)).toFixed(2));
      return { ...l, chargeQty: qty, totalCost: newCost, sellPrice: newSell };
    });
    setBQtyInputs(q => ({ ...q, [id]: String(qty) }));
    const tc = updated.reduce((s, l) => s + l.totalCost, 0);
    const ts = updated.reduce((s, l) => s + l.sellPrice, 0);
    onUpdatePricing({ serviceLines: updated });
    onUpdateItem({ totalCost: tc, sellPrice: ts, markup: Math.round(tc > 0 ? ((ts - tc) / tc) * 100 : 0) });
    setManualOverrides(prev => ({ ...prev, [id]: true }));
  };

  const bApplyTotalMarkup = (raw: string) => {
    let mk = parseFloat(raw);
    if (isNaN(mk)) { setBTotalMkErr(true); return; }
    if (bShowProfit) mk = profitToMarkupB(mk);
    if (isNaN(mk)) { setBTotalMkErr(true); return; }
    setBTotalMkErr(false);
    const updated = ps.serviceLines.map(l => {
      if (bLockedIds.has(l.id)) return l;
      return { ...l, markupPercent: parseFloat(mk.toFixed(2)), sellPrice: parseFloat((l.totalCost * (1 + mk / 100)).toFixed(2)) };
    });
    const tc = updated.reduce((s, l) => s + l.totalCost, 0);
    const ts = updated.reduce((s, l) => s + l.sellPrice, 0);
    onUpdatePricing({ serviceLines: updated });
    onUpdateItem({ totalCost: tc, sellPrice: ts, markup: Math.round(tc > 0 ? ((ts - tc) / tc) * 100 : 0) });
    setManualOverrides(prev => { const n = { ...prev }; updated.forEach(l => { n[l.id] = true; }); return n; });
    setBTotalMkInput(null);
  };

  const bApplyTotalSell = (raw: string) => {
    const newTotal = parseFloat(raw);
    if (isNaN(newTotal) || newTotal < 0) { setBTotalSellErr(true); return; }
    setBTotalSellErr(false);
    const lockedSell   = ps.serviceLines.filter(l => bLockedIds.has(l.id)).reduce((s, l) => s + l.sellPrice, 0);
    const unlockedSell = ps.serviceLines.filter(l => !bLockedIds.has(l.id)).reduce((s, l) => s + l.sellPrice, 0);
    const target = newTotal - lockedSell;
    if (target <= 0 || unlockedSell === 0) { setBTotalSellErr(true); return; }
    const ratio = target / unlockedSell;
    const updated = ps.serviceLines.map(l => {
      if (bLockedIds.has(l.id)) return l;
      const s = parseFloat((l.sellPrice * ratio).toFixed(2));
      const mk = l.totalCost > 0 ? ((s - l.totalCost) / l.totalCost) * 100 : 0;
      return { ...l, sellPrice: s, markupPercent: parseFloat(mk.toFixed(2)) };
    });
    const tc = updated.reduce((s, l) => s + l.totalCost, 0);
    const ts = updated.reduce((s, l) => s + l.sellPrice, 0);
    onUpdatePricing({ serviceLines: updated });
    onUpdateItem({ totalCost: tc, sellPrice: ts, markup: Math.round(tc > 0 ? ((ts - tc) / tc) * 100 : 0) });
    setManualOverrides(prev => { const n = { ...prev }; updated.forEach(l => { n[l.id] = true; }); return n; });
    setBTotalSellInput(null);
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">

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
            <div className="flex-1 space-y-4 min-w-0">

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
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Product</label>
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

              {/* ═══════════════════════════════════════════════════════ */}
              {/* Description (left half) + Specs grid (right half)      */}
              {/* ═══════════════════════════════════════════════════════ */}
              <div className="flex gap-4">

                {/* ── Left: Description textarea ───────────────────── */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={e => { setAutoDescribe(false); onUpdateItem({ description: e.target.value }); }}
                    placeholder="Item description..."
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] placeholder-gray-400 resize-none leading-snug"
                  />
                  <label className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1 cursor-pointer">
                    <input type="checkbox" checked={autoDescribe} onChange={e => { setAutoDescribe(e.target.checked); if (e.target.checked) onUpdateItem({ description: buildDescription() }); }} className="w-3 h-3 rounded border-gray-300 text-[#F890E7] focus:ring-[#F890E7]" />
                    Auto-describe
                  </label>
                </div>

                {/* ── Right: all 5 fields on ONE row — flex so they share space naturally ── */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Specs</label>
                  <div className="flex items-start gap-2">

                    {/* Quantity — widest (multi-qty strings like "1000, 2000, 5000") */}
                    <div className="flex-[2] min-w-0">
                      <label className="block text-[9px] text-gray-400 uppercase tracking-wide mb-1">Qty</label>
                      <input
                        type="text" value={multiQtyInput}
                        onChange={e => {
                          trackInteraction();
                          setMultiQtyInput(e.target.value);
                          const qParts = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
                          if (qParts.length > 0) onUpdatePricing({ quantity: qParts[0] });
                        }}
                        placeholder="1000"
                        className="w-full px-2 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]"
                      />
                      {isMultiQty && <p className="text-[9px] text-purple-500 mt-0.5">{parsedQuantities.length} qtys</p>}
                    </div>

                    {/* Originals — compact */}
                    <div className="flex-[1] min-w-0">
                      <label className="block text-[9px] text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-0.5 whitespace-nowrap">
                        Orig. <span className="cursor-help opacity-50" title="Number of unique designs — each is a separate press run.">ⓘ</span>
                      </label>
                      <input
                        type="number" min="1" step="1"
                        value={materialEntries[0]?.originals ?? 1}
                        onChange={e => {
                          trackInteraction();
                          const v = Math.max(1, parseInt(e.target.value) || 1);
                          const updated = [...materialEntries];
                          updated[0] = { ...updated[0], originals: v };
                          setMaterialEntries(updated);
                        }}
                        className="w-full px-2 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] text-center"
                      />
                      {(materialEntries[0]?.originals ?? 1) > 1 && <p className="text-[9px] text-violet-500 mt-0.5 text-center">{materialEntries[0].originals}×</p>}
                    </div>

                    {/* Size */}
                    <div className="flex-[1.5] min-w-0">
                      <label className="block text-[9px] text-gray-400 uppercase tracking-wide mb-1">Size (in)</label>
                      <input
                        type="text" value={sizeInput}
                        onChange={e => {
                          trackInteraction();
                          setSizeInput(e.target.value);
                          const match = e.target.value.match(/^(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)$/);
                          if (match) { onUpdatePricing({ finalWidth: parseFloat(match[1]), finalHeight: parseFloat(match[2]) }); setSizeError(''); }
                          else if (e.target.value && !e.target.value.match(/^[\d.]+\s*[xX×]?\s*[\d.]*$/)) { setSizeError('W×H'); }
                          else { setSizeError(''); }
                        }}
                        placeholder="3.5×2"
                        className={`w-full px-2 py-2 text-sm bg-white border ${sizeError ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7]`}
                      />
                      {sizeError && <p className="text-[9px] text-red-500 mt-0.5">{sizeError}</p>}
                    </div>

                    {/* Sides — with tooltip explaining 1/2 */}
                    <div className="flex-[1] min-w-0">
                      <label className="block text-[9px] text-gray-400 uppercase tracking-wide mb-1">Sides</label>
                      <select
                        value={materialEntries[0]?.sides || ps.sides}
                        onChange={e => { trackInteraction(); const updated = [...materialEntries]; updated[0] = { ...updated[0], sides: e.target.value as 'Single' | 'Double' }; setMaterialEntries(updated); }}
                        title="1 = Single-sided printing · 2 = Double-sided (duplex) printing"
                        className="w-full px-2 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none cursor-pointer"
                      >
                        <option value="Single" title="Single-sided — printed on one side only">1 — Single</option>
                        <option value="Double" title="Double-sided — printed on both sides">2 — Double</option>
                      </select>
                    </div>

                    {/* Color — full word */}
                    <div className="flex-[1] min-w-0">
                      <label className="block text-[9px] text-gray-400 uppercase tracking-wide mb-1">Color</label>
                      <select
                        value={materialEntries[0]?.colorMode || ps.colorMode}
                        onChange={e => { trackInteraction(); const updated = [...materialEntries]; updated[0] = { ...updated[0], colorMode: e.target.value as 'Color' | 'Black' }; setMaterialEntries(updated); }}
                        className="w-full px-2 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F890E7] appearance-none cursor-pointer"
                      >
                        <option value="Color">Color</option>
                        <option value="Black">B&W</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Material / Equipment ─────────────────────────────── */}
              <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Material</label>
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
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Equipment</label>
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
                <div className="rounded-xl border border-blue-200 overflow-hidden mt-3">
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
              <div className="space-y-3 pt-3 border-t border-gray-100">
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
                      const note = serviceNotes[id] || '';
                      if (!svc) return null;
                      return (
                        <span key={id} className="inline-flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border transition-all ${
                            note ? 'bg-purple-200 text-purple-800 border-purple-300' : 'bg-purple-100 text-purple-700 border-purple-200'
                          }`}>
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(editingNoteId === id ? null : id)}
                              title={note ? `Notes: ${note}\nClick to edit` : 'Click to add a note'}
                              className="flex items-center gap-0.5 hover:opacity-70 transition-opacity"
                            >
                              <Edit3 className="w-2 h-2 opacity-50" />
                              {svc.name}
                              {note && <span className="w-1 h-1 rounded-full bg-purple-600 ml-0.5 flex-shrink-0" />}
                            </button>
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
                                setServiceNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
                              }}
                              className="hover:text-purple-900 ml-0.5"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                          {editingNoteId === id && (
                            <input
                              autoFocus
                              type="text"
                              value={note}
                              onChange={e => setServiceNotes(prev => ({ ...prev, [id]: e.target.value }))}
                              onBlur={() => setEditingNoteId(null)}
                              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingNoteId(null); }}
                              placeholder="Add instructions..."
                              className="text-[10px] px-2 py-0.5 border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-400 bg-purple-50 text-purple-800 min-w-[150px] max-w-[220px]"
                            />
                          )}
                        </span>
                      );
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
                        const note = serviceNotes[id] || '';
                        if (!svc) return null;
                        return (
                          <span key={id} className="inline-flex flex-col gap-0.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border transition-all ${
                              note ? 'bg-blue-200 text-blue-800 border-blue-300' : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}>
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(editingNoteId === id ? null : id)}
                                title={note ? `Notes: ${note}\nClick to edit` : 'Click to add a note'}
                                className="flex items-center gap-0.5 hover:opacity-70 transition-opacity"
                              >
                                <Edit3 className="w-2 h-2 opacity-50" />
                                {svc.name}
                                {note && <span className="w-1 h-1 rounded-full bg-blue-600 ml-0.5 flex-shrink-0" />}
                              </button>
                              <button type="button" onClick={() => { setSelectedLaborIds(prev => prev.filter(x => x !== id)); setServiceNotes(prev => { const n = { ...prev }; delete n[id]; return n; }); }} className="hover:text-blue-900 ml-0.5">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                            {editingNoteId === id && (
                              <input
                                autoFocus
                                type="text"
                                value={note}
                                onChange={e => setServiceNotes(prev => ({ ...prev, [id]: e.target.value }))}
                                onBlur={() => setEditingNoteId(null)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingNoteId(null); }}
                                placeholder="Add instructions..."
                                className="text-[10px] px-2 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-blue-50 text-blue-800 min-w-[150px] max-w-[220px]"
                              />
                            )}
                          </span>
                        );
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
                        const note = serviceNotes[id] || '';
                        if (!svc) return null;
                        return (
                          <span key={id} className="inline-flex flex-col gap-0.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border transition-all ${
                              note ? 'bg-amber-200 text-amber-800 border-amber-300' : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(editingNoteId === id ? null : id)}
                                title={note ? `Notes: ${note}\nClick to edit` : 'Click to add a note'}
                                className="flex items-center gap-0.5 hover:opacity-70 transition-opacity"
                              >
                                <Edit3 className="w-2 h-2 opacity-50" />
                                {svc.name}
                                {note && <span className="w-1 h-1 rounded-full bg-amber-600 ml-0.5 flex-shrink-0" />}
                              </button>
                              <button type="button" onClick={() => { setSelectedBrokeredIds(prev => prev.filter(x => x !== id)); setServiceNotes(prev => { const n = { ...prev }; delete n[id]; return n; }); }} className="hover:text-amber-900 ml-0.5">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                            {editingNoteId === id && (
                              <input
                                autoFocus
                                type="text"
                                value={note}
                                onChange={e => setServiceNotes(prev => ({ ...prev, [id]: e.target.value }))}
                                onBlur={() => setEditingNoteId(null)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingNoteId(null); }}
                                placeholder="Add instructions..."
                                className="text-[10px] px-2 py-0.5 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 bg-amber-50 text-amber-800 min-w-[150px] max-w-[220px]"
                              />
                            )}
                          </span>
                        );
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

              {/* ═══ PRICE BREAKDOWN — inline expandable ══════════════ */}
              {ps.serviceLines.length > 0 && (() => {
                const bLines = ps.serviceLines;
                const bTotalCost = bLines.reduce((s, l) => s + l.totalCost, 0);
                const bTotalSell = bLines.reduce((s, l) => s + l.sellPrice, 0);
                const bMarkup    = bTotalCost > 0 ? ((bTotalSell - bTotalCost) / bTotalCost) * 100 : 0;
                const bMargin    = bTotalSell > 0 ? ((bTotalSell - bTotalCost) / bTotalSell) * 100 : 0;
                const bProfit    = bTotalSell - bTotalCost;
                const bMkOrPft   = (mk: number) => bShowProfit ? markupToProfitB(mk) : mk;
                const bPctSuffix = bShowProfit ? 'p' : '%';

                // Group consecutive same-service lines (e.g. Printing time + clicks)
                const bGroups: Array<{ service: string; lines: PricingServiceLine[]; isGrouped: boolean; label: string }> = [];
                let gi = 0;
                while (gi < bLines.length) {
                  const svc = bLines[gi].service;
                  let gj = gi + 1;
                  while (gj < bLines.length && bLines[gj].service === svc) gj++;
                  const grp = bLines.slice(gi, gj);
                  bGroups.push({ service: svc, lines: grp, isGrouped: grp.length > 1, label: grp[0].description.split(' — ')[0] ?? svc });
                  gi = gj;
                }

                const bSubLabel = (l: PricingServiceLine) => {
                  if (l.hourlyCost != null) return '↳ Time';
                  if (l.unit === 'clicks') return '↳ Click Charges';
                  if (l.unit === 'sqft')   return '↳ Area';
                  return '↳ Usage';
                };

                // Input style — compact, fixed width so they don't stretch
                const bInp = 'w-[72px] px-1.5 py-0.5 text-[11px] text-right num bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#F890E7] transition-colors';
                const bInpG = 'w-[72px] px-1.5 py-0.5 text-[11px] text-right num bg-emerald-50 border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-300 text-emerald-900 transition-colors';
                const bInpSky = (err: boolean) => `w-[68px] px-1.5 py-0.5 text-[11px] text-right num rounded focus:outline-none focus:ring-1 transition-colors border ${err ? 'border-red-400 text-red-600 bg-red-50' : 'border-sky-200 text-sky-700 bg-sky-50 focus:ring-sky-300'}`;
                const bInpVio = (err: boolean) => `w-[68px] px-1.5 py-0.5 text-[11px] text-right num rounded focus:outline-none focus:ring-1 transition-colors border ${err ? 'border-red-400 text-red-600 bg-red-50' : 'border-violet-200 text-violet-700 bg-violet-50 focus:ring-violet-300'}`;

                return (
                  <div className="rounded-xl border border-emerald-200 overflow-hidden">

                    {/* ── Collapsed header — always visible, shows summary stats ── */}
                    <button
                      type="button"
                      onClick={() => setBreakdownExpanded(x => !x)}
                      className="w-full text-left px-4 py-2.5 flex items-center justify-between bg-emerald-50/60 hover:bg-emerald-50 transition-colors border-b border-emerald-200/60"
                    >
                      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        Price Breakdown
                        {Object.keys(manualOverrides).length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] normal-case font-medium">
                            {Object.keys(manualOverrides).length} edited
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-3">
                        {/* Summary stats — always visible even when collapsed */}
                        <div className="flex items-center gap-2.5 text-[11px] num">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wide">Cost <span className="font-semibold text-gray-800 text-[12px]">{fmt(bTotalCost)}</span></span>
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-500 text-[10px] uppercase tracking-wide">Markup <span className={`font-semibold text-[12px] ${bMarkup > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{bMarkup.toFixed(1)}%</span></span>
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-500 text-[10px] uppercase tracking-wide">Margin <span className={`font-semibold text-[12px] ${bMargin >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{bMargin.toFixed(1)}%</span></span>
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-500 text-[10px] uppercase tracking-wide">Profit <span className="font-semibold text-[12px] text-emerald-700">{fmt(bProfit)}</span></span>
                          <span className="text-gray-300">·</span>
                          <span className="text-[10px] uppercase tracking-wide text-gray-500">Sell <span className="font-bold text-[13px] text-gray-900">{fmt(bTotalSell)}</span></span>
                        </div>
                        {breakdownExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        }
                      </div>
                    </button>

                    {/* ── Expanded inline editor ── */}
                    {breakdownExpanded && (
                      <div className="bg-white">
                        {/* Markup ↔ Profit toggle + Reset */}
                        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center gap-1 bg-gray-200/60 rounded-md p-0.5">
                            <button type="button" onClick={() => setBShowProfit(false)}
                              className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${!bShowProfit ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                              Markup %
                            </button>
                            <button type="button" onClick={() => setBShowProfit(true)}
                              className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${bShowProfit ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                              Profit %
                            </button>
                          </div>
                          <button type="button" onClick={handleRecalculate}
                            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-[#F890E7] transition-colors">
                            <RefreshCw className="w-3 h-3" /> Reset to calculated
                          </button>
                        </div>

                        {/* ── Price breakdown table ─────────────────────────────────────────── */}
                        {/* Column widths lock header↔cell alignment precisely */}
                        <table className="w-full border-collapse" style={{ tableLayout: 'fixed', fontSize: '11px' }}>
                          <colgroup>
                            <col style={{ width: '110px' }} /> {/* Service */}
                            <col />                             {/* Description — flexible, takes remainder */}
                            <col style={{ width: '68px'  }} /> {/* Actual */}
                            <col style={{ width: '82px'  }} /> {/* Unit Cost */}
                            <col style={{ width: '72px'  }} /> {/* Charge ✎ */}
                            <col style={{ width: '80px'  }} /> {/* Cost */}
                            <col style={{ width: '80px'  }} /> {/* Markup/Profit % */}
                            <col style={{ width: '82px'  }} /> {/* Sell $ */}
                            <col style={{ width: '28px'  }} /> {/* 🔒 lock — dedicated narrow col */}
                          </colgroup>

                          {/* ── Column headers ── */}
                          <thead>
                            {/* Zone band */}
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                              <th colSpan={2} className="py-1 px-3 text-left" />
                              {/* COST zone label */}
                              <th colSpan={4}
                                className="py-1 px-0 text-center text-[8px] font-bold uppercase tracking-widest text-gray-400 border-l border-gray-200">
                                Cost
                              </th>
                              {/* SELL zone label */}
                              <th colSpan={3}
                                className="py-1 px-0 text-center text-[8px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50/60 border-l-2 border-emerald-300">
                                Sell
                              </th>
                            </tr>
                            {/* Column labels — same px as cells so they register */}
                            <tr className="border-b-2 border-gray-200 bg-gray-50/80">
                              <th className="py-1.5 px-3 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wide">Service</th>
                              <th className="py-1.5 px-3 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wide">Description</th>
                              {/* COST cols */}
                              <th className="py-1.5 px-3 text-right text-[9px] font-bold text-gray-400 uppercase tracking-wide border-l border-gray-200">Actual</th>
                              <th className="py-1.5 px-3 text-right text-[9px] font-bold text-gray-400 uppercase tracking-wide">Unit Cost</th>
                              <th className="py-1.5 px-3 text-right text-[9px] font-bold text-violet-500 uppercase tracking-wide">Charge</th>
                              <th className="py-1.5 px-3 text-right text-[9px] font-bold text-gray-500 uppercase tracking-wide">Cost</th>
                              {/* SELL cols */}
                              <th className="py-1.5 px-3 text-right text-[9px] font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50/50 border-l-2 border-emerald-300">
                                <button type="button" onClick={() => setBShowProfit(p => !p)}
                                  title="Toggle Markup % / Profit %"
                                  className="flex items-center justify-end gap-0.5 w-full hover:text-emerald-700 transition-colors">
                                  {bShowProfit ? 'Profit %' : 'Markup %'}
                                  <span className="text-[7px] opacity-40">↕</span>
                                </button>
                              </th>
                              <th className="py-1.5 px-3 text-right text-[9px] font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50/50">Sell $</th>
                              <th className="py-1.5 px-1 bg-emerald-50/50" title="Lock sell price to exclude from global scaling">
                                {bLockedIds.size > 0
                                  ? <span className="flex justify-center"><Lock className="w-2.5 h-2.5 text-amber-400" /></span>
                                  : null}
                              </th>
                            </tr>
                          </thead>

                          {/* ── Body rows ── */}
                          <tbody className="divide-y divide-gray-50">
                            {bGroups.map(({ service, lines: grpLines, isGrouped, label }) => (
                              <React.Fragment key={service + grpLines[0].id}>
                                {/* Grouped parent header row */}
                                {isGrouped && (
                                  <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <td className="py-1.5 px-3 font-bold text-gray-700 text-[11px]">{service}</td>
                                    <td className="py-1.5 px-3 text-gray-400 text-[10px] overflow-hidden">
                                      <span className="block truncate" title={label}>{label}</span>
                                    </td>
                                    <td colSpan={7} />
                                  </tr>
                                )}

                                {/* Data rows */}
                                {grpLines.map(line => {
                                  const timeBased = line.hourlyCost != null && line.hoursActual != null;
                                  const qtyBased  = !timeBased && line.quantity != null && line.unit !== 'flat';
                                  const isLocked  = bLockedIds.has(line.id);
                                  const pctVal    = bMkOrPft(line.markupPercent);
                                  const chargeQty = line.chargeQty ?? line.quantity;

                                  // Actual — system-calculated (read-only)
                                  const actualDisplay = timeBased
                                    ? `${Math.ceil((line.hoursActual ?? 0) * 60)} min`
                                    : qtyBased && line.quantity != null
                                      ? line.quantity.toLocaleString()
                                      : '—';

                                  // Unit Cost — rate per unit
                                  const unitCostDisplay = timeBased && line.hourlyCost
                                    ? `${fmt(line.hourlyCost / 60)}/min`
                                    : qtyBased && line.unitCost > 0
                                      ? `${fmt(line.unitCost)}/${(line.unit ?? '').replace(/s$/, '') || 'unit'}`
                                      : '—';

                                  // Shared cell padding — same for th AND td to guarantee alignment
                                  const tdPx = 'px-3';

                                  return (
                                    <tr key={line.id} className={`transition-colors ${isLocked ? 'bg-amber-50/25 hover:bg-amber-50/35' : 'hover:bg-gray-50/70'}`}>

                                      {/* SERVICE */}
                                      <td className={`py-2 ${tdPx} ${isGrouped ? 'pl-7 text-[10px] text-gray-500' : 'text-[11px] font-semibold text-gray-800'}`}>
                                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                                          {isGrouped ? bSubLabel(line) : service}
                                          {manualOverrides[line.id] && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Manually edited" />
                                          )}
                                        </span>
                                      </td>

                                      {/* DESCRIPTION — truncated, full text on hover */}
                                      <td className={`py-2 ${tdPx} overflow-hidden`}>
                                        <span
                                          className="block truncate text-[10px] text-gray-500 cursor-help"
                                          title={line.description}
                                        >
                                          {line.description}
                                        </span>
                                      </td>

                                      {/* ACTUAL — read-only, right-aligned, muted */}
                                      <td className={`py-2 ${tdPx} text-right num text-[11px] text-gray-400 whitespace-nowrap border-l border-gray-150`}>
                                        {actualDisplay}
                                      </td>

                                      {/* UNIT COST — rate per unit, read-only */}
                                      <td className={`py-2 ${tdPx} text-right num text-[10px] text-gray-400 whitespace-nowrap`}>
                                        {unitCostDisplay}
                                      </td>

                                      {/* CHARGE ✎ — editable override, coloured inputs */}
                                      <td className={`py-1 ${tdPx}`}>
                                        {timeBased ? (
                                          <input
                                            type="text"
                                            value={bTimeInputs[line.id] ?? `${Math.ceil((line.hoursCharge ?? line.hoursActual ?? 0) * 60)} min`}
                                            onChange={e => setBTimeInputs(t => ({ ...t, [line.id]: e.target.value }))}
                                            onBlur={() => bCommitTime(line.id)}
                                            onKeyDown={e => { if (e.key === 'Enter') bCommitTime(line.id); }}
                                            className={bInpSky(bTimeErrors[line.id] ?? false)}
                                            title="Charge time in minutes — overrides actual"
                                          />
                                        ) : qtyBased ? (
                                          <input
                                            type="number" step="1" min="1"
                                            value={bQtyInputs[line.id] ?? chargeQty}
                                            onChange={e => { setBQtyInputs(q => ({ ...q, [line.id]: e.target.value })); setBQtyErrors(q => ({ ...q, [line.id]: false })); }}
                                            onBlur={() => bCommitQty(line.id)}
                                            onKeyDown={e => { if (e.key === 'Enter') bCommitQty(line.id); }}
                                            className={bInpVio(bQtyErrors[line.id] ?? false)}
                                            title="Billable quantity — overrides actual"
                                          />
                                        ) : (
                                          <span className="block text-center text-gray-300 text-[10px]">—</span>
                                        )}
                                      </td>

                                      {/* COST — editable total cost */}
                                      <td className={`py-1 ${tdPx}`}>
                                        <input
                                          type="number" step="0.01" min="0"
                                          value={parseFloat(line.totalCost.toFixed(2))}
                                          onChange={e => bUpdateField(line.id, 'totalCost', e.target.value)}
                                          className={bInp}
                                          title="Total cost for this service"
                                        />
                                      </td>

                                      {/* MARKUP / PROFIT % — emerald zone */}
                                      <td className={`py-1 ${tdPx} bg-emerald-50/40 border-l-2 border-emerald-200`}>
                                        <div className="relative">
                                          <input
                                            type="number" step="0.01"
                                            value={parseFloat(pctVal.toFixed(2))}
                                            onChange={e => bUpdateField(line.id, bShowProfit ? 'profitPercent' : 'markupPercent', e.target.value)}
                                            className={`${bInpG} pr-4 font-semibold`}
                                          />
                                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-emerald-400 pointer-events-none">{bPctSuffix}</span>
                                        </div>
                                      </td>

                                      {/* SELL $ — emerald zone */}
                                      <td className={`py-1 ${tdPx} bg-emerald-50/40`}>
                                        <input
                                          type="number" step="0.01" min="0"
                                          value={parseFloat(line.sellPrice.toFixed(2))}
                                          onChange={e => bUpdateField(line.id, 'sellPrice', e.target.value)}
                                          readOnly={isLocked}
                                          className={`${bInpG} font-bold w-full ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title={isLocked ? 'Locked — click 🔒 to unlock' : 'Sell price'}
                                        />
                                      </td>

                                      {/* LOCK — own column, just the icon, no padding stealing space */}
                                      <td className="py-1 px-1 bg-emerald-50/40 text-center">
                                        <button
                                          type="button"
                                          onClick={() => setBLockedIds(prev => { const s = new Set(prev); s.has(line.id) ? s.delete(line.id) : s.add(line.id); return s; })}
                                          title={isLocked ? 'Locked — click to unlock' : 'Lock sell price'}
                                          className={`p-0.5 rounded transition-all ${isLocked ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-gray-500'}`}
                                        >
                                          {isLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </tbody>

                          {/* ── Totals footer ── */}
                          <tfoot className="border-t-2 border-gray-300 bg-gray-50/90">
                            <tr>
                              {/* Service + Description + Actual + Unit Cost + Charge = 5 cols */}
                              <td className="py-2 px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide" colSpan={5}>
                                <span className="flex items-center gap-2">
                                  Total
                                  {bLockedIds.size > 0 && (
                                    <span className="text-[8px] text-amber-500 flex items-center gap-0.5">
                                      <Lock className="w-2.5 h-2.5" />{bLockedIds.size} locked
                                    </span>
                                  )}
                                </span>
                              </td>
                              {/* Total Cost — read-only */}
                              <td className="py-2 px-3 text-right text-[12px] num font-bold text-gray-800">{fmt(bTotalCost)}</td>
                              {/* Total Markup/Profit — click to scale all unlocked */}
                              <td className="py-1 px-3 bg-emerald-50/60 border-l-2 border-emerald-300">
                                {bTotalMkInput !== null ? (
                                  <div className="relative inline-block">
                                    <input
                                      type="number" step="0.01" autoFocus
                                      value={bTotalMkInput}
                                      onChange={e => { setBTotalMkInput(e.target.value); setBTotalMkErr(false); }}
                                      onBlur={e => bApplyTotalMarkup(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') bApplyTotalMarkup((e.target as HTMLInputElement).value); if (e.key === 'Escape') { setBTotalMkInput(null); setBTotalMkErr(false); } }}
                                      className={`w-full px-1.5 py-0.5 text-[11px] text-right num font-bold border rounded focus:outline-none focus:ring-1 pr-4 ${bTotalMkErr ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300' : 'border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-300'}`}
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-emerald-500 pointer-events-none">{bPctSuffix}</span>
                                  </div>
                                ) : (
                                  <button type="button"
                                    onClick={() => setBTotalMkInput(parseFloat(bMkOrPft(bMarkup).toFixed(2)).toString())}
                                    title={`Click to scale all ${bShowProfit ? 'profit' : 'markup'} %`}
                                    className="w-full px-1.5 py-0.5 text-right text-[11px] num font-bold rounded border border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/60 transition-colors text-emerald-700"
                                  >
                                    {bMkOrPft(bMarkup).toFixed(2)}{bPctSuffix}
                                  </button>
                                )}
                              </td>
                              {/* Total Sell $ — click to scale all unlocked */}
                              <td className="py-1 px-3 bg-emerald-50/60">
                                {bTotalSellInput !== null ? (
                                  <input
                                    type="number" step="0.01" min="0" autoFocus
                                    value={bTotalSellInput}
                                    onChange={e => { setBTotalSellInput(e.target.value); setBTotalSellErr(false); }}
                                    onBlur={e => bApplyTotalSell(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') bApplyTotalSell((e.target as HTMLInputElement).value); if (e.key === 'Escape') { setBTotalSellInput(null); setBTotalSellErr(false); } }}
                                    className={`w-full px-1.5 py-0.5 text-[12px] text-right num font-bold border rounded focus:outline-none focus:ring-1 ${bTotalSellErr ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300' : 'border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-300'}`}
                                  />
                                ) : (
                                  <button type="button"
                                    onClick={() => setBTotalSellInput(parseFloat(bTotalSell.toFixed(2)).toString())}
                                    title="Click to scale all unlocked sell prices to a new total"
                                    className="w-full px-1.5 py-0.5 text-right text-[13px] num font-bold rounded border border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/60 transition-colors text-emerald-900"
                                  >
                                    {fmt(bTotalSell)}
                                  </button>
                                )}
                              </td>
                              {/* Lock column — empty in totals row */}
                              <td className="bg-emerald-50/60" />
                            </tr>
                          </tfoot>
                        </table>

                        {/* Margin footer */}
                        <div className="px-4 py-1.5 flex items-center gap-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-500">
                          <span>Margin: <span className={`font-semibold ${bMargin >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{bMargin.toFixed(1)}%</span></span>
                          <span>Profit: <span className="font-semibold text-emerald-600">{fmt(bProfit)}</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

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
            {/* Always render the collapsed ⭐ button when templates exist so existing-item
                users can expand on demand. For new items the panel slides in automatically
                when a product is selected and collapses the moment any other field is touched. */}
            {matchingTemplates.length > 0 && (
              templatePanelCollapsed ? (
                /* Collapsed — tiny star button flush with the form */
                <div className="flex-shrink-0 pt-0.5">
                  <button
                    onClick={() => setTemplatePanelCollapsed(false)}
                    title="Show matching templates"
                    className="group flex flex-col items-center gap-1 p-2 rounded-xl border border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all duration-200"
                  >
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-semibold text-gray-400 uppercase tracking-wide group-hover:text-amber-600 writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                      {matchingTemplates.length} template{matchingTemplates.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                </div>
              ) : (
                /* Expanded — slides in from the right, 13rem wide */
                <div ref={templatePanelRef} className="w-52 flex-shrink-0 animate-[slideInRight_0.18s_ease-out]">
                  <div className="sticky top-0">
                    {/* Panel header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <h4 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                          Templates
                        </h4>
                        <span className="text-[9px] text-gray-400">({matchingTemplates.length})</span>
                      </div>
                      <button
                        onClick={() => setTemplatePanelCollapsed(true)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Collapse panel"
                      >
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    {/* Hint for new items */}
                    {isNew && (
                      <p className="text-[9px] text-gray-400 mb-2 leading-snug">
                        Select a template or fill fields manually — panel hides when you start editing.
                      </p>
                    )}
                    {/* Template list — 2-line cards with full tooltip on hover */}
                    <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-0.5">
                      {matchingTemplates.slice(0, 15).map(t => {
                        // Build a rich tooltip with all available template details
                        const tooltipLines = [
                          t.name,
                          `${t.categoryName} — ${t.quantity.toLocaleString()} pcs`,
                          t.materialName ? `Material: ${t.materialName}` : null,
                          t.equipmentName ? `Equipment: ${t.equipmentName}` : null,
                          t.folding ? `Folding: ${t.folding}` : null,
                          (t.finalWidth && t.finalHeight) ? `Size: ${t.finalWidth}×${t.finalHeight}″` : null,
                        ].filter(Boolean).join('\n');

                        const detailLine = [
                          t.materialName,
                          t.equipmentName,
                          t.folding,
                        ].filter(Boolean).join(' · ');

                        return (
                          <button
                            key={t.id}
                            onClick={() => onApplyTemplate(t.id)}
                            title={tooltipLines}
                            className="w-full text-left px-2.5 py-2 rounded-lg border border-gray-100 hover:border-[#F890E7] hover:bg-pink-50/50 hover:shadow-sm transition-all text-xs group"
                          >
                            {/* Line 1: name + star */}
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-semibold text-gray-800 group-hover:text-[#F890E7] leading-snug line-clamp-1 flex-1">
                                {t.name}
                              </span>
                              {t.isFavorite && (
                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                            {/* Line 2: category · qty */}
                            <div className="text-[9px] text-gray-500 mt-0.5 leading-snug">
                              {t.categoryName} · {t.quantity.toLocaleString()} pcs
                            </div>
                            {/* Line 3 (if available): material / equipment / folding details */}
                            {detailLine && (
                              <div className="text-[9px] text-gray-400 mt-0.5 leading-snug truncate">
                                {detailLine}
                              </div>
                            )}
                          </button>
                        );
                      })}
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
  // Returns the freshly-computed service lines so the dialog can reset in-place without closing
  onRecalculate: () => PricingServiceLine[];
  onClose: () => void;
}

// Format decimal hours → always in whole minutes, rounded UP to next minute.
// e.g. 0.067 hrs (4m) → "4 min", 1.5 hrs → "90 min", 0 → "—"
const fmtHours = (h: number) => {
  if (h <= 0) return '—';
  const mins = Math.ceil(h * 60);   // round UP to next minute
  return `${mins} min`;
};

// Parse "45", "45m", "45 min", "1h 30m" → decimal hours
const parseHoursInput = (s: string): number | null => {
  const trimmed = s.trim();
  // "1h 30m" or "1h30m"
  const hm = trimmed.match(/^(\d+)\s*h\s*(\d+)\s*m?$/i);
  if (hm) return parseInt(hm[1]) + parseInt(hm[2]) / 60;
  // "90 min" or "90m" or plain "90"
  const m = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:min|m)?$/i);
  if (m) return parseFloat(m[1]) / 60;
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
  // localLines holds all editable state — chargeQty and hoursCharge are the "billable" values
  const [localLines, setLocalLines] = useState<PricingServiceLine[]>(() =>
    lines.map(l => ({
      ...l,
      // chargeQty defaults to the system-calculated quantity
      chargeQty: l.chargeQty ?? l.quantity,
      // hoursCharge already has a default in computeServiceLines
    }))
  );

  // Per-row charge-time input buffer — always stored as "N min" string
  const [timeInputs, setTimeInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    lines.forEach(l => {
      if (l.hourlyCost != null) {
        const h = l.hoursCharge ?? l.hoursActual ?? 0;
        init[l.id] = h > 0 ? `${Math.ceil(h * 60)} min` : '0 min';
      }
    });
    return init;
  });
  const [timeErrors, setTimeErrors] = useState<Record<string, boolean>>({});

  // Per-row charge-qty input buffer
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    lines.forEach(l => { if (l.quantity != null && l.unit !== 'flat') init[l.id] = String(l.chargeQty ?? l.quantity); });
    return init;
  });
  const [qtyErrors, setQtyErrors] = useState<Record<string, boolean>>({});

  // Markup ↔ Profit % toggle — purely a display convenience, doesn't change any values
  const [showProfit, setShowProfit] = useState(false);

  // ── Row lock state — locked rows are skipped by global markup/sell scaling ──
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const toggleLock = (id: string) =>
    setLockedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // ── Totals row editing state ──────────────────────────────────────────
  const [totalMarkupInput, setTotalMarkupInput] = useState<string | null>(null);
  const [totalSellInput, setTotalSellInput]     = useState<string | null>(null);
  const [totalMarkupError, setTotalMarkupError] = useState(false);
  const [totalSellError, setTotalSellError]     = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────
  // markupPct ↔ profitPct conversions (purely for display toggle)
  const markupToProfit = (mk: number) => {
    // profit% = margin% = markup / (1 + markup/100) * 100... simplest: p = mk / (1 + mk/100) * 100
    // Actually: margin = (sell-cost)/sell = markup/(100+markup)*100
    return mk / (1 + mk / 100);
  };
  const profitToMarkup = (p: number) => {
    // markup = p / (1 - p/100) * ... margin p → markup: mk = p/(1-p/100)*100... simplified:
    // margin% m → markup% = m / (1 - m/100) which is 100*m/(100-m)
    if (p >= 100) return 9999;
    return (100 * p) / (100 - p);
  };

  // ── Per-line field update ─────────────────────────────────────────────
  const updateField = (id: string, field: 'unitCost' | 'totalCost' | 'markupPercent' | 'profitPercent' | 'sellPrice', raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    setLocalLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (field === 'unitCost') {
        // Recalculate totalCost from chargeQty × new unitCost; keep markup, recompute sell
        const effectiveQty = l.chargeQty ?? l.quantity ?? 1;
        const newCost = parseFloat((effectiveQty * val).toFixed(2));
        const newSell = parseFloat((newCost * (1 + l.markupPercent / 100)).toFixed(2));
        return { ...l, unitCost: val, totalCost: newCost, sellPrice: newSell };
      }
      if (field === 'totalCost') {
        const mk = val > 0 ? ((l.sellPrice - val) / val) * 100 : l.markupPercent;
        return { ...l, totalCost: val, markupPercent: parseFloat(mk.toFixed(2)) };
      }
      if (field === 'markupPercent') {
        return { ...l, markupPercent: val, sellPrice: parseFloat((l.totalCost * (1 + val / 100)).toFixed(2)) };
      }
      if (field === 'profitPercent') {
        const mk = profitToMarkup(val);
        return { ...l, markupPercent: parseFloat(mk.toFixed(2)), sellPrice: parseFloat((l.totalCost * (1 + mk / 100)).toFixed(2)) };
      }
      if (field === 'sellPrice') {
        const mk = l.totalCost > 0 ? ((val - l.totalCost) / l.totalCost) * 100 : 0;
        return { ...l, sellPrice: val, markupPercent: parseFloat(mk.toFixed(2)) };
      }
      return l;
    }));
  };

  // ── Charge Qty commit — recomputes cost+sell from chargeQty × unitCost ─
  const commitChargeQty = (id: string) => {
    const raw = qtyInputs[id] ?? '';
    const qty = parseFloat(raw);
    if (isNaN(qty) || qty <= 0) { setQtyErrors(e => ({ ...e, [id]: true })); return; }
    setQtyErrors(e => ({ ...e, [id]: false }));
    setLocalLines(prev => prev.map(l => {
      if (l.id !== id || l.hourlyCost != null) return l; // time-based lines handled separately
      if (l.unit === 'flat' || l.quantity == null) return l; // flat: no qty recalc
      const newCost = parseFloat((qty * l.unitCost).toFixed(2));
      const newSell = parseFloat((newCost * (1 + l.markupPercent / 100)).toFixed(2));
      return { ...l, chargeQty: qty, totalCost: newCost, sellPrice: newSell };
    }));
    setQtyInputs(q => ({ ...q, [id]: String(qty) }));
  };

  // ── Charge Time commit — recomputes cost+sell from hours × hourlyCost ─
  const commitTimeInput = (id: string) => {
    const raw = timeInputs[id] ?? '';
    const h = parseHoursInput(raw);
    if (h === null) { setTimeErrors(e => ({ ...e, [id]: true })); return; }
    setTimeErrors(e => ({ ...e, [id]: false }));
    setLocalLines(prev => prev.map(l => {
      if (l.id !== id || l.hourlyCost == null) return l;
      const newCost = parseFloat((h * l.hourlyCost).toFixed(2));
      const newSell = parseFloat((newCost * (1 + l.markupPercent / 100)).toFixed(2));
      return { ...l, hoursCharge: h, totalCost: newCost, sellPrice: newSell };
    }));
    setTimeInputs(t => ({ ...t, [id]: fmtHours(h) }));
  };

  // ── Totals-row: scale all lines proportionally by markup/profit ───────
  const applyTotalMarkup = (raw: string) => {
    let newMarkup = parseFloat(raw);
    if (isNaN(newMarkup)) { setTotalMarkupError(true); return; }
    if (showProfit) newMarkup = profitToMarkup(newMarkup);
    if (isNaN(newMarkup)) { setTotalMarkupError(true); return; }
    setTotalMarkupError(false);
    setLocalLines(prev => prev.map(l => {
      if (lockedIds.has(l.id)) return l;               // ← skip locked rows
      const newSell = parseFloat((l.totalCost * (1 + newMarkup / 100)).toFixed(2));
      return { ...l, markupPercent: parseFloat(newMarkup.toFixed(2)), sellPrice: newSell };
    }));
    setTotalMarkupInput(null);
  };

  // ── Totals-row: scale all UNLOCKED sell prices proportionally ─────────
  const applyTotalSell = (raw: string) => {
    const newTotal = parseFloat(raw);
    if (isNaN(newTotal) || newTotal < 0) { setTotalSellError(true); return; }
    setTotalSellError(false);
    // Only the unlocked portion is scaled; locked lines keep their sell price
    const lockedSell   = localLines.filter(l => lockedIds.has(l.id)).reduce((s, l) => s + l.sellPrice, 0);
    const unlockedSell = localLines.filter(l => !lockedIds.has(l.id)).reduce((s, l) => s + l.sellPrice, 0);
    const targetUnlocked = newTotal - lockedSell;
    if (targetUnlocked <= 0 || unlockedSell === 0) { setTotalSellError(true); return; }
    const ratio = targetUnlocked / unlockedSell;
    setLocalLines(prev => prev.map(l => {
      if (lockedIds.has(l.id)) return l;               // ← skip locked rows
      const newSell = parseFloat((l.sellPrice * ratio).toFixed(2));
      const mk = l.totalCost > 0 ? ((newSell - l.totalCost) / l.totalCost) * 100 : 0;
      return { ...l, sellPrice: newSell, markupPercent: parseFloat(mk.toFixed(2)) };
    }));
    setTotalSellInput(null);
  };

  const fmtNum = (n: number, dp = 2) => (n === 0 ? '0' : parseFloat(n.toFixed(dp)).toString());

  // ── Derived totals — computed from live localLines ───────────────────
  const totalCost   = localLines.reduce((s, l) => s + l.totalCost, 0);
  const totalSell   = localLines.reduce((s, l) => s + l.sellPrice, 0);
  const totalMarkup = totalCost > 0 ? ((totalSell - totalCost) / totalCost) * 100 : 0;
  const marginPct   = totalSell > 0 ? ((totalSell - totalCost) / totalSell) * 100 : 0;

  // ── Shared input styles ──────────────────────────────────────────────
  const inpBase  = 'w-full px-1.5 py-1 text-[11px] text-right num border rounded focus:outline-none focus:ring-1 transition-colors';
  const inpGray  = `${inpBase} bg-white border-gray-200 text-gray-700 focus:ring-[#F890E7]`;
  const inpSky   = (err = false) => `${inpBase} bg-sky-50/60 ${err ? 'border-red-400 text-red-700 focus:ring-red-300' : 'border-sky-200 text-sky-800 focus:ring-sky-300'}`;
  const inpVio   = (err = false) => `${inpBase} bg-violet-50/40 ${err ? 'border-red-400 text-red-700 focus:ring-red-300' : 'border-violet-200 text-violet-800 focus:ring-violet-300'}`;
  const inpGreen = (bold = false) => `${inpBase} bg-emerald-50/80 border-emerald-200 text-emerald-900 focus:ring-emerald-300${bold ? ' font-bold' : ''}`;
  const totInp   = (err: boolean) => `${inpBase} font-bold ${err ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300' : 'border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-300'}`;

  const mkOrProfit = (mk: number) => showProfit ? markupToProfit(mk) : mk;
  const pctLabel  = showProfit ? 'Profit %' : 'Markup %';
  const pctSuffix = showProfit ? 'p' : '%';

  // ── Group consecutive same-service lines so "Printing" time + clicks show as parent+children ──
  const serviceGroups: Array<{
    service: string;
    lines: PricingServiceLine[];
    isGrouped: boolean;
    groupLabel: string; // header text for grouped parent (equipment/service name)
  }> = React.useMemo(() => {
    const out: Array<{ service: string; lines: PricingServiceLine[]; isGrouped: boolean; groupLabel: string }> = [];
    let i = 0;
    while (i < localLines.length) {
      const svc = localLines[i].service;
      let j = i + 1;
      while (j < localLines.length && localLines[j].service === svc) j++;
      const grpLines = localLines.slice(i, j);
      const isGrouped = grpLines.length > 1;
      // Extract equipment/service name from first line description (text before " — ")
      const groupLabel = grpLines[0].description.split(' — ')[0] ?? svc;
      out.push({ service: svc, lines: grpLines, isGrouped, groupLabel });
      i = j;
    }
    return out;
  }, [localLines]);

  // ── Sub-row labels for grouped children ─────────────────────────────
  const subLabel = (line: PricingServiceLine) => {
    if (line.hourlyCost != null && line.hoursActual != null) return '↳ Time';
    if (line.unit === 'clicks') return '↳ Click Charges';
    if (line.unit === 'sqft')   return '↳ Area Charges';
    return '↳ Usage';
  };

  // ── DETAILS cell — editable charge qty/time or description text ──────
  const renderDetails = (line: PricingServiceLine, isChild = false) => {
    const timeBased = isTimeBased(line);
    const qtyBased  = isQtyBased(line);
    const chargeQty = line.chargeQty ?? line.quantity;

    if (timeBased) {
      const actual = line.hoursActual ?? 0;
      const charge = line.hoursCharge ?? actual;
      const changed = Math.abs(charge - actual) > 0.01;
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            type="text"
            value={timeInputs[line.id] ?? fmtHours(charge)}
            onChange={e => setTimeInputs(t => ({ ...t, [line.id]: e.target.value }))}
            onBlur={() => commitTimeInput(line.id)}
            onKeyDown={e => { if (e.key === 'Enter') commitTimeInput(line.id); }}
            placeholder="e.g. 30"
            title="Charge time in minutes"
            className={`w-20 ${inpSky(timeErrors[line.id])}`}
          />
          <span className="text-[10px] text-gray-500">@ {formatCurrency(line.hourlyCost!)}/hr</span>
          {changed && (
            <span className="text-[9px] text-amber-500 num">actual: {fmtHours(actual)}</span>
          )}
        </div>
      );
    }

    if (qtyBased && line.quantity != null) {
      const changed = chargeQty != null && chargeQty !== line.quantity;
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            type="number" step="1" min="1"
            value={qtyInputs[line.id] ?? chargeQty}
            onChange={e => { setQtyInputs(q => ({ ...q, [line.id]: e.target.value })); setQtyErrors(q => ({ ...q, [line.id]: false })); }}
            onBlur={() => commitChargeQty(line.id)}
            onKeyDown={e => { if (e.key === 'Enter') commitChargeQty(line.id); }}
            title="Billable quantity"
            className={`w-20 ${inpVio(qtyErrors[line.id])}`}
          />
          <span className="text-[10px] text-gray-500">{line.unit}</span>
          {line.unitCost > 0 && (
            <span className="text-[10px] text-gray-400">@ {formatCurrency(line.unitCost)}/{(line.unit ?? '').replace(/s$/, '') || 'unit'}</span>
          )}
          {changed && (
            <span className="text-[9px] text-amber-500 num">actual: {line.quantity.toLocaleString()}</span>
          )}
        </div>
      );
    }

    // Flat / fixed: description text (truncated, tooltip shows full)
    const shortDesc = line.description.includes(' — ')
      ? line.description.split(' — ').slice(1).join(' — ')
      : line.description;
    return (
      <span className="text-[11px] text-gray-500 truncate block" title={line.description}>
        {shortDesc || line.description}
      </span>
    );
  };

  // ── Editable Cost $ cell ─────────────────────────────────────────────
  const renderCost = (line: PricingServiceLine) => (
    <input
      type="number" step="0.01" min="0"
      value={fmtNum(line.totalCost)}
      onChange={e => updateField(line.id, 'totalCost', e.target.value)}
      className={inpGray}
    />
  );

  // ── Editable Markup/Profit % cell ────────────────────────────────────
  const renderPct = (line: PricingServiceLine) => {
    const pctVal = mkOrProfit(line.markupPercent);
    return (
      <div className="relative">
        <input
          type="number" step="0.01"
          value={fmtNum(pctVal, 2)}
          onChange={e => updateField(line.id, showProfit ? 'profitPercent' : 'markupPercent', e.target.value)}
          className={`${inpGreen(false)} pr-4 ${pctVal > 0 ? 'font-semibold' : 'text-gray-400'}`}
        />
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-emerald-400 pointer-events-none">{pctSuffix}</span>
      </div>
    );
  };

  // ── Editable Sell $ cell with lock ───────────────────────────────────
  const renderSell = (line: PricingServiceLine) => {
    const isLocked = lockedIds.has(line.id);
    return (
      <div className="flex items-center gap-1">
        <input
          type="number" step="0.01" min="0"
          value={fmtNum(line.sellPrice)}
          onChange={e => updateField(line.id, 'sellPrice', e.target.value)}
          readOnly={isLocked}
          className={`${inpGreen(true)} flex-1 ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
          title={isLocked ? 'Locked — click 🔒 to unlock' : undefined}
        />
        <button
          type="button"
          onClick={() => toggleLock(line.id)}
          title={isLocked ? 'Sell locked — click to unlock' : 'Lock this sell price'}
          className={`flex-shrink-0 p-0.5 rounded transition-all ${isLocked ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-gray-500'}`}
        >
          {isLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
        </button>
      </div>
    );
  };

  // ── Icon per service ─────────────────────────────────────────────────
  const svcIcon = (svc: string) => {
    const a = SERVICE_ACCENT[svc];
    return a ? <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${a.dot}`} /> : null;
  };

  // Shared cell padding
  const px = 'px-4';
  const th = `py-2 ${px} text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap`;
  const td = `py-2 ${px}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[1400px] flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              Edit Price Breakdown
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Edit any cell · Charge Qty/Time overrides billable amount · Totals row scales all lines
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Markup ↔ Profit % toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setShowProfit(false)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${!showProfit ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Markup %
              </button>
              <button
                type="button"
                onClick={() => setShowProfit(true)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${showProfit ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Profit %
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── 5-column table ── */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse text-[12px]" style={{ minWidth: '680px' }}>
            <colgroup>
              <col style={{ width: '160px' }} /> {/* SERVICE */}
              <col />                             {/* DETAILS — flexible */}
              <col style={{ width: '110px' }} /> {/* COST $ */}
              <col style={{ width: '110px' }} /> {/* MARKUP/PROFIT % */}
              <col style={{ width: '120px' }} /> {/* SELL $ + lock */}
            </colgroup>

            <thead className="sticky top-0 z-10 bg-white border-b-2 border-gray-200">
              <tr>
                <th className={`${th} text-left`}>Service</th>
                <th className={`${th} text-left`}>Details</th>
                <th className={`${th} text-right`}>Cost $</th>
                <th className={`${th} text-right bg-emerald-50 border-l-2 border-emerald-300`}>
                  <button
                    type="button"
                    onClick={() => setShowProfit(p => !p)}
                    title="Toggle between Markup % and Profit %"
                    className="flex items-center justify-end gap-1 w-full hover:text-emerald-700 transition-colors"
                  >
                    {pctLabel}
                    <span className="text-[7px] opacity-50">↕</span>
                  </button>
                </th>
                <th className={`${th} text-right bg-emerald-50 border-l border-emerald-200`}>
                  <span className="flex items-center justify-end gap-1">
                    Sell $
                    {lockedIds.size > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-amber-500">
                        <Lock className="w-2.5 h-2.5" />{lockedIds.size}
                      </span>
                    )}
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {serviceGroups.map(({ service, lines, isGrouped, groupLabel }) => (
                <React.Fragment key={service + lines[0].id}>
                  {isGrouped ? (
                    <>
                      {/* ── Grouped parent row — service name + equipment label ── */}
                      <tr className="bg-gray-50/60">
                        <td className={`${td} font-bold text-gray-800 flex items-center gap-1.5`}>
                          {svcIcon(service)}
                          {service}
                        </td>
                        <td className={`${td} text-gray-500`}>{groupLabel}</td>
                        {/* No cost/markup/sell on the parent — children carry the values */}
                        <td className={td} />
                        <td className={`${td} bg-emerald-50/40 border-l-2 border-emerald-200`} />
                        <td className={`${td} bg-emerald-50/40 border-l border-emerald-100`} />
                      </tr>
                      {/* ── Grouped child rows — indented ── */}
                      {lines.map(line => (
                        <tr key={line.id} className={`transition-colors ${lockedIds.has(line.id) ? 'bg-amber-50/20' : 'hover:bg-gray-50/70'}`}>
                          <td className={`${td} pl-8 text-gray-500 text-[11px]`}>{subLabel(line)}</td>
                          <td className={`${td} pr-2`}>{renderDetails(line, true)}</td>
                          <td className={td}>{renderCost(line)}</td>
                          <td className={`${td} bg-emerald-50/40 border-l-2 border-emerald-200`}>{renderPct(line)}</td>
                          <td className={`${td} bg-emerald-50/40 border-l border-emerald-100`}>{renderSell(line)}</td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    /* ── Simple single-row service ── */
                    <tr className={`transition-colors ${lockedIds.has(lines[0].id) ? 'bg-amber-50/20' : 'hover:bg-gray-50/70'}`}>
                      <td className={`${td} font-bold text-gray-800`}>
                        <div className="flex items-center gap-1.5">{svcIcon(service)}{service}</div>
                      </td>
                      <td className={`${td} pr-2`}>{renderDetails(lines[0])}</td>
                      <td className={td}>{renderCost(lines[0])}</td>
                      <td className={`${td} bg-emerald-50/40 border-l-2 border-emerald-200`}>{renderPct(lines[0])}</td>
                      <td className={`${td} bg-emerald-50/40 border-l border-emerald-100`}>{renderSell(lines[0])}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>

            {/* ── Totals row ── */}
            <tfoot className="border-t-2 border-gray-300">
              <tr className="bg-gray-50/90 font-semibold">
                <td className={`${td} text-[11px] text-gray-600 uppercase tracking-wide`} colSpan={2}>
                  <span className="flex items-center gap-2">
                    Total
                    <span className="text-[9px] font-normal text-gray-400 normal-case">— click % or $ to scale unlocked rows</span>
                    {lockedIds.size > 0 && (
                      <span className="text-[9px] font-semibold text-amber-500 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />{lockedIds.size} locked
                      </span>
                    )}
                  </span>
                </td>
                {/* Total Cost — read-only */}
                <td className={`${td} text-right num text-gray-800 font-bold`}>
                  {formatCurrency(totalCost)}
                </td>
                {/* Total Markup/Profit % — click to scale all */}
                <td className={`py-1 px-4 bg-emerald-50/80 border-l-2 border-emerald-300`}>
                  {totalMarkupInput !== null ? (
                    <div className="relative">
                      <input
                        type="number" step="0.01" autoFocus
                        value={totalMarkupInput}
                        onChange={e => { setTotalMarkupInput(e.target.value); setTotalMarkupError(false); }}
                        onBlur={e => applyTotalMarkup(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') applyTotalMarkup((e.target as HTMLInputElement).value);
                          if (e.key === 'Escape') { setTotalMarkupInput(null); setTotalMarkupError(false); }
                        }}
                        className={`${totInp(totalMarkupError)} pr-4`}
                        placeholder={showProfit ? '60' : '80'}
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-emerald-600 pointer-events-none">{pctSuffix}</span>
                    </div>
                  ) : (
                    <button type="button"
                      onClick={() => setTotalMarkupInput(fmtNum(mkOrProfit(totalMarkup)))}
                      title={`Click to set all unlocked lines to this ${pctLabel}`}
                      className="w-full px-1.5 py-1 text-right text-[11px] num font-bold rounded border border-dashed border-emerald-400 hover:border-emerald-600 hover:bg-emerald-100/60 transition-colors text-emerald-700"
                    >
                      {mkOrProfit(totalMarkup).toFixed(2)}{pctSuffix}
                    </button>
                  )}
                </td>
                {/* Total Sell $ — click to scale all */}
                <td className={`py-1 px-4 bg-emerald-50/80 border-l border-emerald-200`}>
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
                      className={totInp(totalSellError)}
                      placeholder="40.00"
                    />
                  ) : (
                    <button type="button"
                      onClick={() => setTotalSellInput(fmtNum(totalSell))}
                      title="Click to scale all unlocked sell prices to this total"
                      className="w-full px-1.5 py-1 text-right text-[13px] num font-bold rounded border border-dashed border-emerald-400 hover:border-emerald-600 hover:bg-emerald-100/60 transition-colors text-emerald-900"
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
            <span className="text-gray-500">Cost: <span className="font-semibold text-gray-800 num">{formatCurrency(totalCost)}</span></span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">Profit: <span className="font-semibold text-emerald-700 num">{formatCurrency(totalSell - totalCost)}</span></span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">Margin: <span className={`font-bold num ${marginPct >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{marginPct.toFixed(1)}%</span></span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">Sell: <span className="font-bold text-gray-900 num text-[13px]">{formatCurrency(totalSell)}</span></span>
          </div>
          <span className="text-[9px] text-gray-300 hidden lg:block">Time: <code className="bg-gray-100 px-1 rounded">45m · 1h · 1h 30m</code></span>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
          <button type="button" onClick={() => {
            const fresh = onRecalculate();
            setLocalLines(fresh.map(l => ({ ...l, chargeQty: l.chargeQty ?? l.quantity })));
            setTimeInputs(() => {
              const init: Record<string, string> = {};
              fresh.forEach(l => { if (l.hourlyCost != null) { const h = l.hoursCharge ?? l.hoursActual ?? 0; init[l.id] = h > 0 ? `${Math.ceil(h * 60)} min` : '0 min'; } });
              return init;
            });
            setQtyInputs(() => {
              const init: Record<string, string> = {};
              fresh.forEach(l => { if (l.quantity != null && l.unit !== 'flat') init[l.id] = String(l.quantity); });
              return init;
            });
            setTimeErrors({}); setQtyErrors({});
          }}
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
