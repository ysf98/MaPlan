"use client";

import { useEffect, useRef, useState } from "react";
import { searchGooglePlaces, type GooglePlaceSuggestion } from "@/lib/map/googlePlaces";

type MapSearchBoxProps = {
  getMapContext: () => { center: { lng: number; lat: number } | null };
  onSelectResult: (result: GooglePlaceSuggestion) => Promise<void> | void;
};

export function MapSearchBox({ getMapContext, onSelectResult }: MapSearchBoxProps) {
  const searchAbortRef = useRef<AbortController | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GooglePlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const getTypeLabel = (primaryType: string | null): string => {
    if (!primaryType) return "Lugar";
    if (primaryType.includes("restaurant")) return "POI";
    if (primaryType.includes("bar") || primaryType.includes("night_club")) return "POI";
    if (primaryType.includes("cafe")) return "POI";
    if (primaryType.includes("store")) return "POI";
    if (primaryType.includes("locality")) return "Localidad";
    if (primaryType.includes("route") || primaryType.includes("street_address")) return "Direccion";
    return "Lugar";
  };

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
        const results = await searchGooglePlaces({
          query,
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

    const timeout = setTimeout(runSearch, 350);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [getMapContext, searchQuery]);

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
          ) : isSelecting ? (
            <p className="px-3 py-2 text-xs text-slate-500">Cargando lugar...</p>
          ) : searchResults.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">No encontramos sitios con esa búsqueda cerca de esta zona.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {searchResults.map((result) => (
                <li key={result.externalPlaceId}>
                  <button
                    className="w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                    onClick={async () => {
                      try {
                        setIsSelecting(true);
                        await onSelectResult(result);
                        setSearchQuery(result.name);
                        setSearchResults([]);
                      } finally {
                        setIsSelecting(false);
                      }
                    }}
                    disabled={isSelecting}
                    type="button"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {result.name}
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        {getTypeLabel(result.primaryType)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{result.address}</p>
                    {result.businessStatus ? <p className="mt-0.5 text-[11px] text-slate-400">{result.businessStatus}</p> : null}
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
