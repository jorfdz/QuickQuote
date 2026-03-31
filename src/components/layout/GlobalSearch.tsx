import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { usePricingStore } from '../../store/pricingStore';
import { buildGlobalSearchIndex, groupGlobalSearchResults, normalizeSearchValue } from '../../utils/globalSearch';

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    customers,
    contacts,
    quotes,
    orders,
    invoices,
    purchaseOrders,
    vendors,
    users,
  } = useStore();
  const {
    materials,
    products,
    templates,
    equipment,
    finishing,
    labor,
    brokered,
    categories,
  } = usePricingStore();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchValue(deferredQuery);

  const searchIndex = useMemo(
    () =>
      buildGlobalSearchIndex({
        customers,
        contacts,
        quotes,
        orders,
        invoices,
        purchaseOrders,
        vendors,
        users,
        materials,
        products,
        pricingTemplates: templates,
        equipment,
        finishing,
        labor,
        brokered,
        categories,
      }),
    [
      brokered,
      categories,
      contacts,
      customers,
      equipment,
      finishing,
      invoices,
      labor,
      materials,
      orders,
      products,
      purchaseOrders,
      quotes,
      templates,
      users,
      vendors,
    ],
  );

  const groupedResults = useMemo(
    () => (normalizedQuery ? groupGlobalSearchResults(searchIndex, normalizedQuery) : []),
    [normalizedQuery, searchIndex],
  );

  const flatResults = useMemo(
    () => groupedResults.flatMap((group) => group.items),
    [groupedResults],
  );

  const autocompleteSuggestion = useMemo(() => {
    if (!normalizedQuery) return '';
    const match = flatResults.find((item) => normalizeSearchValue(item.title).startsWith(normalizedQuery));
    return match ? match.title : '';
  }, [flatResults, normalizedQuery]);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    setIsOpen(false);
    setQuery('');
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selectResult = (href: string) => {
    setIsOpen(false);
    navigate(href);
  };

  const acceptAutocomplete = () => {
    if (!autocompleteSuggestion || normalizeSearchValue(autocompleteSuggestion) === normalizedQuery) return;
    setQuery(autocompleteSuggestion);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!flatResults.length) return;
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % flatResults.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!flatResults.length) return;
      setIsOpen(true);
      setActiveIndex((current) => (current - 1 + flatResults.length) % flatResults.length);
      return;
    }

    if (event.key === 'Tab' && autocompleteSuggestion && normalizeSearchValue(autocompleteSuggestion) !== normalizedQuery) {
      event.preventDefault();
      acceptAutocomplete();
      return;
    }

    if (event.key === 'Enter') {
      if (!flatResults.length) return;
      event.preventDefault();
      selectResult(flatResults[activeIndex]?.href || flatResults[0].href);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search customers, contacts, estimates, orders, materials, products, vendors, invoices, POs..."
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#F890E7] focus:ring-2 focus:ring-[#F890E7]/20 placeholder:text-gray-400"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {!normalizedQuery ? (
            <div className="px-4 py-4 text-sm text-gray-500">
              <div className="flex items-center gap-2 text-gray-700">
                <Sparkles className="h-4 w-4 text-[#F890E7]" />
                Search across every entity
              </div>
              <p className="mt-2 text-xs text-gray-500">Type to search grouped results for customers, contacts, estimates, orders, materials, products, vendors, invoices, purchase orders, equipment, finishing, labor, brokered services, templates, and users.</p>
            </div>
          ) : flatResults.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-500">No matches for “{query}”.</div>
          ) : (
            <>
              {autocompleteSuggestion && normalizeSearchValue(autocompleteSuggestion) !== normalizedQuery && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={acceptAutocomplete}
                  className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-2.5 text-left text-xs text-gray-500 transition hover:bg-gray-50"
                >
                  <span>Autocomplete</span>
                  <span className="truncate pl-3 text-gray-700">Tab to complete: {autocompleteSuggestion}</span>
                </button>
              )}

              <div className="max-h-[70vh] overflow-y-auto py-2">
                {groupedResults.map((group) => (
                  <div key={group.entityLabel} className="px-2 pb-2">
                    <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      {group.entityLabel}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const index = flatResults.findIndex((result) => result.id === item.id && result.entity === item.entity);
                        const active = index === activeIndex;

                        return (
                          <button
                            key={`${item.entity}-${item.id}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => selectResult(item.href)}
                            className={`flex w-full items-start justify-between rounded-xl px-3 py-2.5 text-left transition ${
                              active ? 'bg-[#fff4fd] ring-1 ring-[#f3c3eb]' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-gray-900">{item.title}</div>
                              <div className="truncate text-xs text-gray-500">{item.subtitle}</div>
                            </div>
                            {item.badge && (
                              <span className="ml-3 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-600">
                                {item.badge.replace(/_/g, ' ')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
