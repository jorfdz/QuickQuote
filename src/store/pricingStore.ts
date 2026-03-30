import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PricingCategory, PricingProduct, PricingEquipment,
  PricingFinishing, PricingMaterial, ProductPricingTemplate,
  EquipmentPricingTier,
} from '../types/pricing';
import {
  defaultCategories, defaultProducts, defaultPricingEquipment,
  defaultFinishing, defaultPricingMaterials, defaultPricingTemplates,
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
  materials: PricingMaterial[];
  templates: ProductPricingTemplate[];

  // Categories CRUD
  addCategory: (c: Omit<PricingCategory, 'id' | 'createdAt'>) => PricingCategory;
  updateCategory: (id: string, c: Partial<PricingCategory>) => void;
  deleteCategory: (id: string) => void;

  // Products CRUD
  addProduct: (p: Omit<PricingProduct, 'id' | 'createdAt'>) => PricingProduct;
  updateProduct: (id: string, p: Partial<PricingProduct>) => void;
  deleteProduct: (id: string) => void;

  // Equipment CRUD
  addEquipment: (e: Omit<PricingEquipment, 'id' | 'createdAt'>) => PricingEquipment;
  updateEquipment: (id: string, e: Partial<PricingEquipment>) => void;
  deleteEquipment: (id: string) => void;

  // Finishing CRUD
  addFinishing: (f: Omit<PricingFinishing, 'id' | 'createdAt'>) => PricingFinishing;
  updateFinishing: (id: string, f: Partial<PricingFinishing>) => void;
  deleteFinishing: (id: string) => void;

  // Materials CRUD
  addMaterial: (m: Omit<PricingMaterial, 'id' | 'createdAt'>) => PricingMaterial;
  updateMaterial: (id: string, m: Partial<PricingMaterial>) => void;
  deleteMaterial: (id: string) => void;

  // Templates CRUD
  addTemplate: (t: Omit<ProductPricingTemplate, 'id' | 'createdAt' | 'usageCount'>) => ProductPricingTemplate;
  updateTemplate: (id: string, t: Partial<ProductPricingTemplate>) => void;
  deleteTemplate: (id: string) => void;
  incrementTemplateUsage: (id: string) => void;

  // Search helpers
  findProductByNameOrAlias: (query: string) => PricingProduct | undefined;
  searchProducts: (query: string) => PricingProduct[];
  getEquipmentForCategory: (categoryName: string) => PricingEquipment[];
  getMaterialsBySize: (minWidth: number, minHeight: number) => PricingMaterial[];

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
      materials: defaultPricingMaterials,
      templates: defaultPricingTemplates,

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
        const item: PricingEquipment = { ...e, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ equipment: [...s.equipment, item] }));
        return item;
      },
      updateEquipment: (id, e) => set((s) => ({
        equipment: s.equipment.map((x) => (x.id === id ? { ...x, ...e } : x)),
      })),
      deleteEquipment: (id) => set((s) => ({
        equipment: s.equipment.filter((x) => x.id !== id),
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
      version: 2,
      migrate: () => {
        // Version bump: reset to fresh defaults so all Excel data is loaded
        return {
          categories: defaultCategories,
          products: defaultProducts,
          equipment: defaultPricingEquipment,
          finishing: defaultFinishing,
          materials: defaultPricingMaterials,
          templates: defaultPricingTemplates,
        };
      },
    }
  )
);
