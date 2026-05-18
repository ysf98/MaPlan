"use client";

import { useEffect, useRef, useState } from "react";
import { forwardGeocode, type GeocodeSearchResult } from "@/lib/map/geocoding";

type MapSearchBoxProps = {
  token: string;
  getMapContext: () => { center: { lng: number; lat: number } | null };
  onSelectResult: (result: GeocodeSearchResult) => void;
};

export function MapSearchBox({ token, getMapContext, onSelectResult }: MapSearchBoxProps) {
  const searchAbortRef = useRef<AbortController | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current?.abort();
    searchAbortRef.current = controller;

    const runSearch = async () => {
      try {
        setIsSearching(true);
        const mapContext = getMapContext();
        const results = await forwardGeocode(token, query, {
          center: mapContext.center,
          signal: controller.signal
        });
        setSearchResults(results);
      } catch {
        if (!controller.signal.aborted) {
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    const timeout = setTimeout(runSearch, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [getMapContext, searchQuery, token]);

  return (
    <div className="relative">
      <input
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Buscar bares, restaurantes, poblaciones..."
        value={searchQuery}
      />
      {searchQuery.trim().length >= 3 ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {isSearching ? (
            <p className="px-3 py-2 text-xs text-slate-500">Buscando...</p>
          ) : searchResults.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">No encontramos resultados cercanos. Prueba otro termino.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <button
                    className="w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      onSelectResult(result);
                      setSearchQuery(result.name);
                      setSearchResults([]);
                    }}
                    type="button"
                  >
                    <p className="text-sm font-medium text-slate-900">{result.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{result.fullAddress}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
