import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PricingCategory, PricingProduct, PricingEquipment,
  PricingFinishing, PricingMaterial, ProductPricingTemplate,
<<<<<<< HEAD
  EquipmentPricingTier, MaterialGroup, FinishingGroup, PricingLabor, PricingBrokered,
=======
  EquipmentPricingTier, MaterialGroup, MaintenanceRecord,PricingLabor, PricingBrokered,
>>>>>>> 643d6dd583b1af20b2f832a0dbde9080601c5303
} from '../types/pricing';
import {
  defaultCategories, defaultProducts, defaultPricingEquipment,
  defaultFinishing, defaultPricingMaterials, defaultPricingTemplates,
  defaultMaterialGroups, defaultFinishingGroups, defaultLabor, defaultBrokered,
} from '../data/pricingData';

// ─── HELPER: Generate IDs ──────────────────────────────────────────────────

let _counter = Date.now();
const uid = () => `p${_counter++}`;

// ─── STORE INTERFACE ────────────────────────────────────────────────────────

interface PricingStore {
  // Data
  categories: PricingCategory[];
  products: PricingProduct[];
  equipment: PricingEquipment[];
  finishing: PricingFinishing[];
  labor: PricingLabor[];
  brokered: PricingBrokered[];
  materials: PricingMaterial[];
  templates: ProductPricingTemplate[];
  materialGroups: MaterialGroup[];
  finishingGroups: FinishingGroup[];

  // Categories CRUD
  addCategory: (c: Omit<PricingCategory, 'id' | 'createdAt'>) => PricingCategory;
  updateCategory: (id: string, c: Partial<PricingCategory>) => void;
  deleteCategory: (id: string) => void;

  // Products CRUD
  addProduct: (p: Omit<PricingProduct, 'id' | 'createdAt'>) => PricingProduct;
  updateProduct: (id: string, p: Partial<PricingProduct>) => void;
  deleteProduct: (id: string) => void;

  // Equipment CRUD
  addEquipment: (e: Omit<PricingEquipment, 'id' | 'createdAt' | 'maintenanceHistory'>) => PricingEquipment;
  updateEquipment: (id: string, e: Partial<PricingEquipment>) => void;
  deleteEquipment: (id: string) => void;

  // Equipment Maintenance
  addMaintenanceRecord: (equipmentId: string, record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'equipmentId'>) => MaintenanceRecord;
  updateMaintenanceRecord: (equipmentId: string, recordId: string, data: Partial<MaintenanceRecord>) => void;
  deleteMaintenanceRecord: (equipmentId: string, recordId: string) => void;

  // Finishing CRUD
  addFinishing: (f: Omit<PricingFinishing, 'id' | 'createdAt'>) => PricingFinishing;
  updateFinishing: (id: string, f: Partial<PricingFinishing>) => void;
  deleteFinishing: (id: string) => void;

  // Labor CRUD
  addLabor: (l: Omit<PricingLabor, 'id' | 'createdAt'>) => PricingLabor;
  updateLabor: (id: string, l: Partial<PricingLabor>) => void;
  deleteLabor: (id: string) => void;

  // Brokered CRUD
  addBrokered: (b: Omit<PricingBrokered, 'id' | 'createdAt'>) => PricingBrokered;
  updateBrokered: (id: string, b: Partial<PricingBrokered>) => void;
  deleteBrokered: (id: string) => void;

  // Materials CRUD
  addMaterial: (m: Omit<PricingMaterial, 'id' | 'createdAt'>) => PricingMaterial;
  updateMaterial: (id: string, m: Partial<PricingMaterial>) => void;
  deleteMaterial: (id: string) => void;

  // Material Groups CRUD
  addMaterialGroup: (g: Omit<MaterialGroup, 'id' | 'createdAt'>) => MaterialGroup;
  updateMaterialGroup: (id: string, g: Partial<MaterialGroup>) => void;
  deleteMaterialGroup: (id: string) => void;

  // Finishing Groups CRUD
  addFinishingGroup: (g: Omit<FinishingGroup, 'id' | 'createdAt'>) => FinishingGroup;
  updateFinishingGroup: (id: string, g: Partial<FinishingGroup>) => void;
  deleteFinishingGroup: (id: string) => void;

  // Templates CRUD
  addTemplate: (t: Omit<ProductPricingTemplate, 'id' | 'createdAt' | 'usageCount'>) => ProductPricingTemplate;
  updateTemplate: (id: string, t: Partial<ProductPricingTemplate>) => void;
  deleteTemplate: (id: string) => void;
  incrementTemplateUsage: (id: string) => void;

  // Toggle helpers
  toggleMaterialFavorite: (id: string) => void;
  toggleProductTemplate: (id: string) => void;

  // Search helpers
  findProductByNameOrAlias: (query: string) => PricingProduct | undefined;
  searchProducts: (query: string) => PricingProduct[];
  getEquipmentForCategory: (categoryName: string) => PricingEquipment[];
  getMaterialsBySize: (minWidth: number, minHeight: number) => PricingMaterial[];
  getMaterialsForCategory: (categoryName: string) => PricingMaterial[];
  getFinishingForCategory: (categoryName: string) => PricingFinishing[];

  // Pricing calculations
  lookupClickPrice: (equipmentId: string, totalClicks: number, colorMode: 'Color' | 'Black') => number;
  calculateImposition: (
    finalW: number, finalH: number, sheetW: number, sheetH: number
  ) => { upsAcross: number; upsDown: number; totalUps: number };
}

// ─── STORE IMPLEMENTATION ───────────────────────────────────────────────────

export const usePricingStore = create<PricingStore>()(
  persist(
    (set, get) => ({
      categories: defaultCategories,
      products: defaultProducts,
      equipment: defaultPricingEquipment,
      finishing: defaultFinishing,
      labor: defaultLabor,
      brokered: defaultBrokered,
      materials: defaultPricingMaterials,
      templates: defaultPricingTemplates,
      materialGroups: defaultMaterialGroups,
      finishingGroups: defaultFinishingGroups,

      // ── Categories ──────────────────────────────────────────────────────
      addCategory: (c) => {
        const item: PricingCategory = { ...c, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ categories: [...s.categories, item] }));
        return item;
      },
      updateCategory: (id, c) => set((s) => ({
        categories: s.categories.map((x) => (x.id === id ? { ...x, ...c } : x)),
      })),
      deleteCategory: (id) => set((s) => ({
        categories: s.categories.filter((x) => x.id !== id),
      })),

      // ── Products ────────────────────────────────────────────────────────
      addProduct: (p) => {
        const item: PricingProduct = { ...p, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ products: [...s.products, item] }));
        return item;
      },
      updateProduct: (id, p) => set((s) => ({
        products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)),
      })),
      deleteProduct: (id) => set((s) => ({
        products: s.products.filter((x) => x.id !== id),
      })),

      // ── Equipment ───────────────────────────────────────────────────────
      addEquipment: (e) => {
        const item: PricingEquipment = { ...e, id: uid(), maintenanceHistory: [], createdAt: new Date().toISOString() };
        set((s) => ({ equipment: [...s.equipment, item] }));
        return item;
      },
      updateEquipment: (id, e) => set((s) => ({
        equipment: s.equipment.map((x) => (x.id === id ? { ...x, ...e } : x)),
      })),
      deleteEquipment: (id) => set((s) => ({
        equipment: s.equipment.filter((x) => x.id !== id),
      })),

      // ── Equipment Maintenance ─────────────────────────────────────────
      addMaintenanceRecord: (equipmentId, record) => {
        const item: MaintenanceRecord = {
          ...record,
          id: uid(),
          equipmentId,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          equipment: s.equipment.map((eq) =>
            eq.id === equipmentId
              ? { ...eq, maintenanceHistory: [...(eq.maintenanceHistory || []), item] }
              : eq
          ),
        }));
        return item;
      },
      updateMaintenanceRecord: (equipmentId, recordId, data) => set((s) => ({
        equipment: s.equipment.map((eq) =>
          eq.id === equipmentId
            ? {
                ...eq,
                maintenanceHistory: (eq.maintenanceHistory || []).map((r) =>
                  r.id === recordId ? { ...r, ...data } : r
                ),
              }
            : eq
        ),
      })),
      deleteMaintenanceRecord: (equipmentId, recordId) => set((s) => ({
        equipment: s.equipment.map((eq) =>
          eq.id === equipmentId
            ? { ...eq, maintenanceHistory: (eq.maintenanceHistory || []).filter((r) => r.id !== recordId) }
            : eq
        ),
      })),

      // ── Finishing ───────────────────────────────────────────────────────
      addFinishing: (f) => {
        const item: PricingFinishing = { ...f, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ finishing: [...s.finishing, item] }));
        return item;
      },
      updateFinishing: (id, f) => set((s) => ({
        finishing: s.finishing.map((x) => (x.id === id ? { ...x, ...f } : x)),
      })),
      deleteFinishing: (id) => set((s) => ({
        finishing: s.finishing.filter((x) => x.id !== id),
      })),

      // ── Labor ─────────────────────────────────────────────────────────
      addLabor: (l) => {
        const item: PricingLabor = { ...l, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ labor: [...s.labor, item] }));
        return item;
      },
      updateLabor: (id, l) => set((s) => ({
        labor: s.labor.map((x) => (x.id === id ? { ...x, ...l } : x)),
      })),
      deleteLabor: (id) => set((s) => ({
        labor: s.labor.filter((x) => x.id !== id),
      })),

      // ── Brokered ───────────────────────────────────────────────────────
      addBrokered: (b) => {
        const item: PricingBrokered = { ...b, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ brokered: [...s.brokered, item] }));
        return item;
      },
      updateBrokered: (id, b) => set((s) => ({
        brokered: s.brokered.map((x) => (x.id === id ? { ...x, ...b } : x)),
      })),
      deleteBrokered: (id) => set((s) => ({
        brokered: s.brokered.filter((x) => x.id !== id),
      })),

      // ── Materials ───────────────────────────────────────────────────────
      addMaterial: (m) => {
        const item: PricingMaterial = { ...m, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ materials: [...s.materials, item] }));
        return item;
      },
      updateMaterial: (id, m) => set((s) => ({
        materials: s.materials.map((x) => (x.id === id ? { ...x, ...m } : x)),
      })),
      deleteMaterial: (id) => set((s) => ({
        materials: s.materials.filter((x) => x.id !== id),
      })),

      // ── Material Groups ──────────────────────────────────────────────────
      addMaterialGroup: (g) => {
        const item: MaterialGroup = { ...g, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ materialGroups: [...s.materialGroups, item] }));
        return item;
      },
      updateMaterialGroup: (id, g) => set((s) => ({
        materialGroups: s.materialGroups.map((x) => (x.id === id ? { ...x, ...g } : x)),
      })),
      deleteMaterialGroup: (id) => set((s) => ({
        materialGroups: s.materialGroups.filter((x) => x.id !== id),
      })),

      // ── Finishing Groups ────────────────────────────────────────────────
      addFinishingGroup: (g) => {
        const item: FinishingGroup = { ...g, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ finishingGroups: [...s.finishingGroups, item] }));
        return item;
      },
      updateFinishingGroup: (id, g) => set((s) => ({
        finishingGroups: s.finishingGroups.map((x) => (x.id === id ? { ...x, ...g } : x)),
      })),
      deleteFinishingGroup: (id) => set((s) => ({
        finishingGroups: s.finishingGroups.filter((x) => x.id !== id),
      })),

      // ── Toggle helpers ─────────────────────────────────────────────────
      toggleMaterialFavorite: (id) => set((s) => ({
        materials: s.materials.map((x) =>
          x.id === id ? { ...x, isFavorite: !x.isFavorite } : x
        ),
      })),
      toggleProductTemplate: (id) => set((s) => ({
        products: s.products.map((x) =>
          x.id === id ? { ...x, isTemplate: !x.isTemplate } : x
        ),
      })),

      // ── Templates ──────────────────────────────────────────────────────
      addTemplate: (t) => {
        const item: ProductPricingTemplate = { ...t, id: uid(), usageCount: 0, createdAt: new Date().toISOString() };
        set((s) => ({ templates: [...s.templates, item] }));
        return item;
      },
      updateTemplate: (id, t) => set((s) => ({
        templates: s.templates.map((x) => (x.id === id ? { ...x, ...t } : x)),
      })),
      deleteTemplate: (id) => set((s) => ({
        templates: s.templates.filter((x) => x.id !== id),
      })),
      incrementTemplateUsage: (id) => set((s) => ({
        templates: s.templates.map((x) =>
          x.id === id ? { ...x, usageCount: x.usageCount + 1 } : x
        ),
      })),

      // ── Search helpers ─────────────────────────────────────────────────

      findProductByNameOrAlias: (query: string) => {
        const q = query.toLowerCase().trim();
        if (!q) return undefined;
        const { products } = get();
        // Exact match on name
        const exact = products.find((p) => p.name.toLowerCase() === q);
        if (exact) return exact;
        // Exact match on alias
        const aliasExact = products.find((p) =>
          p.aliases.some((a) => a.toLowerCase().trim() === q)
        );
        if (aliasExact) return aliasExact;
        // Partial match on name
        const partial = products.find((p) => p.name.toLowerCase().includes(q));
        if (partial) return partial;
        // Partial match on alias
        return products.find((p) =>
          p.aliases.some((a) => a.toLowerCase().includes(q))
        );
      },

      searchProducts: (query: string) => {
        const q = query.toLowerCase().trim();
        if (!q) return get().products;
        return get().products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.aliases.some((a) => a.toLowerCase().includes(q))
        );
      },

      getEquipmentForCategory: (categoryName: string) => {
        return get().equipment.filter(
          (e) => e.categoryApplies.toLowerCase() === categoryName.toLowerCase()
        );
      },

      getMaterialsBySize: (minWidth: number, minHeight: number) => {
        return get().materials.filter(
          (m) =>
            (m.sizeWidth >= minWidth && m.sizeHeight >= minHeight) ||
            (m.sizeHeight >= minWidth && m.sizeWidth >= minHeight)
        );
      },

      getMaterialsForCategory: (categoryName: string) => {
        const { categories, materialGroups, materials } = get();
        // Find the category by name
        const category = categories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (!category) return [];
        // Find material groups that include this category
        const matchingGroupIds = materialGroups
          .filter((g) => g.categoryIds.includes(category.id))
          .map((g) => g.id);
        // Return materials in those groups
        return materials.filter(
          (m) => m.materialGroupId && matchingGroupIds.includes(m.materialGroupId)
        );
      },

      getFinishingForCategory: (categoryName: string) => {
        const { categories, finishing } = get();
        // Find the category by name
        const category = categories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (!category) return [];
        // Return finishing services that include this category in their categoryIds
        return finishing.filter(
          (f) => f.categoryIds.includes(category.id)
        );
      },

      // ── Pricing calculations ───────────────────────────────────────────

      lookupClickPrice: (equipmentId: string, totalClicks: number, colorMode: 'Color' | 'Black') => {
        const eq = get().equipment.find((e) => e.id === equipmentId);
        if (!eq) return 0;

        const tiers: EquipmentPricingTier[] =
          colorMode === 'Black' ? (eq.blackTiers || []) : (eq.colorTiers || []);

        if (tiers.length === 0) {
          // Fallback: use multiplier or flat cost
          if (eq.markupMultiplier) return eq.unitCost * eq.markupMultiplier;
          return eq.unitCost;
        }

        // Find the tier: largest minQty that is <= totalClicks
        let price = tiers[0].pricePerUnit;
        for (const tier of tiers) {
          if (totalClicks >= tier.minQty) price = tier.pricePerUnit;
        }
        return price;
      },

      calculateImposition: (finalW, finalH, sheetW, sheetH) => {
        // Try both orientations and pick the best
        const layout1across = Math.floor(sheetW / finalW);
        const layout1down = Math.floor(sheetH / finalH);
        const total1 = layout1across * layout1down;

        const layout2across = Math.floor(sheetW / finalH);
        const layout2down = Math.floor(sheetH / finalW);
        const total2 = layout2across * layout2down;

        if (total2 > total1) {
          return { upsAcross: layout2across, upsDown: layout2down, totalUps: total2 };
        }
        return { upsAcross: layout1across, upsDown: layout1down, totalUps: total1 };
      },
    }),
    {
      name: 'quikquote-pricing-storage',
      version: 6,
      migrate: () => {
        // Version bump: overhauled finishing system — added finishing groups, new PricingFinishing shape
        return {
          categories: defaultCategories,
          products: defaultProducts,
          equipment: defaultPricingEquipment,
          finishing: defaultFinishing,
          labor: defaultLabor,
          brokered: defaultBrokered,
          materials: defaultPricingMaterials,
          templates: defaultPricingTemplates,
          materialGroups: defaultMaterialGroups,
          finishingGroups: defaultFinishingGroups,
        };
      },
    }
  )
);
