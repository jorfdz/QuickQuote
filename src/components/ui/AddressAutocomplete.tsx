/**
 * AddressAutocomplete
 *
 * A drop-in address input that activates Google Places Autocomplete when a
 * googleMapsApiKey is available. When the user selects a suggestion the full
 * address (street, city, state, zip, country) is parsed and returned via the
 * onPlaceSelected callback so the parent can populate the other fields.
 *
 * Falls back to a plain <input> when no API key is provided.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

// ─── Minimal Google Maps / Places type shim ──────────────────────────────────

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: { types?: string[]; fields?: string[] }
          ) => GAutocomplete;
        };
        event: {
          clearInstanceListeners: (obj: object) => void;
        };
      };
    };
    __qqGmapsLoaded?: boolean;
    __qqGmapsLoading?: boolean;
    __qqGmapsCallbacks?: Array<() => void>;
    __qqGmapsInit?: () => void;
  }
}

interface GAutocomplete {
  addListener(event: string, handler: () => void): void;
  getPlace(): GPlace;
}
interface GPlace {
  address_components?: GAddrComponent[];
  formatted_address?: string;
}
interface GAddrComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when the user selects a Google Places suggestion. Fills all fields. */
  onPlaceSelected?: (parsed: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  /** Google Maps / Places API key. Autocomplete is disabled when absent. */
  apiKey?: string;
  disabled?: boolean;
}

// ─── Script loader ────────────────────────────────────────────────────────────

function loadGoogleMapsScript(apiKey: string, onReady: () => void) {
  if (window.__qqGmapsLoaded) { onReady(); return; }
  if (window.__qqGmapsLoading) {
    window.__qqGmapsCallbacks = window.__qqGmapsCallbacks ?? [];
    window.__qqGmapsCallbacks.push(onReady);
    return;
  }
  window.__qqGmapsLoading = true;
  window.__qqGmapsCallbacks = [onReady];
  window.__qqGmapsInit = () => {
    window.__qqGmapsLoaded = true;
    window.__qqGmapsLoading = false;
    (window.__qqGmapsCallbacks ?? []).forEach(cb => cb());
    window.__qqGmapsCallbacks = [];
  };
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__qqGmapsInit`;
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

// ─── Helper: parse address_components ────────────────────────────────────────

function parsePlace(place: GPlace): ParsedAddress {
  const get = (type: string, short = false) => {
    const c = place.address_components?.find(a => a.types.includes(type));
    return c ? (short ? c.short_name : c.long_name) : '';
  };
  const street = [get('street_number'), get('route')].filter(Boolean).join(' ');
  return {
    address: street || place.formatted_address || '',
    city:    get('locality') || get('sublocality_level_1') || get('administrative_area_level_2'),
    state:   get('administrative_area_level_1', true),
    zip:     get('postal_code'),
    country: get('country', true),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  className,
  apiKey,
  disabled,
}) => {
  const inputRef  = useRef<HTMLInputElement>(null);
  const acRef     = useRef<GAutocomplete | null>(null);
  const [ready, setReady] = useState(false);

  // Load the Maps script once when an API key is present
  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMapsScript(apiKey, () => setReady(true));
  }, [apiKey]);

  // Attach autocomplete once the script is ready
  useEffect(() => {
    if (!ready || !inputRef.current || !window.google || disabled) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address'],
    });
    acRef.current = ac;

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.address_components) return;
      const parsed = parsePlace(place);
      onChange(parsed.address);
      onPlaceSelected?.(parsed);
    });

    return () => {
      if (acRef.current && window.google) {
        try { window.google.maps.event.clearInstanceListeners(acRef.current); } catch {}
      }
      acRef.current = null;
    };
  }, [ready, disabled, onChange, onPlaceSelected]);

  const inputCls = className ?? [
    'w-full px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded-lg',
    'focus:outline-none focus:ring-2 focus:ring-[#F890E7]',
    disabled ? 'opacity-40 cursor-not-allowed' : '',
  ].join(' ');

  return (
    <div className="relative">
      {apiKey && (
        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? (apiKey ? 'Start typing to search address…' : 'Street address')}
        disabled={disabled}
        autoComplete="off"
        className={`${inputCls} ${apiKey ? 'pl-8' : ''}`}
      />
    </div>
  );
};
