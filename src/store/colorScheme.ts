// ─── Color Scheme definitions ──────────────────────────────────────────────

export interface ColorScheme {
  id: string;
  name: string;
  brand: string;        // main brand color (buttons, active states, accents)
  brandHover: string;   // slightly darker for hover
  brandLight: string;   // very light tint for backgrounds
  brandRing: string;    // focus ring color
  description: string;  // short tagline
}

export const PRESET_SCHEMES: ColorScheme[] = [
  {
    id: 'blossom',
    name: 'Blossom',
    brand: '#F890E7',
    brandHover: '#e57dd6',
    brandLight: 'rgba(248,144,231,0.10)',
    brandRing: 'rgba(248,144,231,0.50)',
    description: 'The default QuikQuote pink — vibrant and playful',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    brand: '#0EA5E9',
    brandHover: '#0284c7',
    brandLight: 'rgba(14,165,233,0.10)',
    brandRing: 'rgba(14,165,233,0.50)',
    description: 'Cool sky blue — calm and professional',
  },
  {
    id: 'forest',
    name: 'Forest',
    brand: '#10B981',
    brandHover: '#059669',
    brandLight: 'rgba(16,185,129,0.10)',
    brandRing: 'rgba(16,185,129,0.50)',
    description: 'Fresh emerald green — growth and clarity',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    brand: '#F97316',
    brandHover: '#ea6c0a',
    brandLight: 'rgba(249,115,22,0.10)',
    brandRing: 'rgba(249,115,22,0.50)',
    description: 'Warm amber orange — energetic and bold',
  },
  {
    id: 'violet',
    name: 'Violet',
    brand: '#8B5CF6',
    brandHover: '#7c3aed',
    brandLight: 'rgba(139,92,246,0.10)',
    brandRing: 'rgba(139,92,246,0.50)',
    description: 'Deep purple — sophisticated and creative',
  },
];

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Darken a hex color by a given percentage (0-100)
export function darkenHex(hex: string, percent: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * percent / 100));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * percent / 100));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * percent / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function applyColorScheme(scheme: ColorScheme) {
  const root = document.documentElement;
  root.style.setProperty('--brand', scheme.brand);
  root.style.setProperty('--brand-hover', scheme.brandHover);
  root.style.setProperty('--brand-light', scheme.brandLight);
  root.style.setProperty('--brand-ring', scheme.brandRing);
}

export function buildSchemeFromColor(brandColor: string): ColorScheme {
  return {
    id: 'custom',
    name: 'Custom',
    brand: brandColor,
    brandHover: darkenHex(brandColor, 8),
    brandLight: hexToRgba(brandColor, 0.10),
    brandRing: hexToRgba(brandColor, 0.50),
    description: 'Your custom color',
  };
}

// Persist chosen scheme
const STORAGE_KEY = 'quikquote-color-scheme';

export function loadSavedScheme(): ColorScheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed as ColorScheme;
    }
  } catch {}
  return PRESET_SCHEMES[0]; // default: Blossom
}

export function saveScheme(scheme: ColorScheme) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scheme));
}
