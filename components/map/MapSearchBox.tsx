"use client";

import { useEffect, useRef, useState } from "react";
import { searchGooglePlaces, type GooglePlaceSuggestion } from "@/lib/map/googlePlaces";
import { getPlaceTypeLabel } from "@/lib/map/placeClassification";
import { extractSearchQueryFromLink } from "@/lib/map/linkSearch";

type MapSearchBoxProps = {
  getMapContext: () => { center: { lng: number; lat: number } | null };
  onSelectResult: (result: GooglePlaceSuggestion) => Promise<void> | void;
  onManualCreate: (payload: { name: string; address: string; city: string }) => void;
  closeSignal?: number;
};

export function MapSearchBox({ getMapContext, onSelectResult, onManualCreate, closeSignal = 0 }: MapSearchBoxProps) {
  const searchAbortRef = useRef<AbortController | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GooglePlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualCity, setManualCity] = useState("");

  const getBusinessStatusLabel = (businessStatus: string | null): string | null => {
    if (!businessStatus) return null;
    if (businessStatus === "OPERATIONAL") return "Abierto";
    if (businessStatus === "CLOSED_TEMPORARILY") return "Cerrado temporalmente";
    if (businessStatus === "CLOSED_PERMANENTLY") return "Cerrado permanentemente";
    return businessStatus;
  };

  useEffect(() => {
    const query = extractSearchQueryFromLink(searchQuery);
    if (!isResultsOpen || query.length < 3) {
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
  }, [getMapContext, isResultsOpen, searchQuery]);

  useEffect(() => {
    setIsResultsOpen(false);
    setSearchResults([]);
    setIsManualFormOpen(false);
  }, [closeSignal]);

  return (
    <div className="relative">
      <div className="flex h-12 items-center gap-2 rounded-full border border-rose-100/80 bg-white/90 px-4 shadow-[0_10px_28px_rgba(181,35,48,0.14)] backdrop-blur-xl transition focus-within:border-rose-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-100">
        <svg className="h-4 w-4 shrink-0 text-[#8e706f]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-0"
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setIsResultsOpen(true);
          }}
          onFocus={() => {
            if (extractSearchQueryFromLink(searchQuery).length >= 3) {
              setIsResultsOpen(true);
            }
          }}
          placeholder="Buscar lugares cercanos o pegar un enlace de sitio"
          value={searchQuery}
        />
      </div>
      {isResultsOpen && extractSearchQueryFromLink(searchQuery).length >= 3 ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[24px] border border-rose-100 bg-white/95 shadow-[0_16px_36px_rgba(181,35,48,0.16)] backdrop-blur-xl">
          {isSearching ? (
            <p className="px-3 py-2 text-xs text-zinc-500">Buscando...</p>
          ) : isSelecting ? (
            <p className="px-3 py-2 text-xs text-zinc-500">Cargando lugar...</p>
          ) : searchResults.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">No encontramos sitios con esa busqueda cerca de esta zona.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {searchResults.map((result) => (
                <li key={result.externalPlaceId}>
                  <button
                    className="w-full border-b border-zinc-100 px-3 py-2 text-left hover:bg-rose-50"
                    disabled={isSelecting}
                    onClick={async () => {
                      try {
                        setIsSelecting(true);
                        await onSelectResult(result);
                        setSearchQuery(result.name);
                        setSearchResults([]);
                        setIsResultsOpen(false);
                      } finally {
                        setIsSelecting(false);
                      }
                    }}
                    type="button"
                  >
                    {(() => {
                      const city = (result.city || "").trim();
                      const province = (result.province || "").trim();
                      const address = (result.address || "").trim();
                      const normalizedAddress = address.toLowerCase();
                      const addressHasCity = city ? normalizedAddress.includes(city.toLowerCase()) : false;
                      const addressHasProvince = province ? normalizedAddress.includes(province.toLowerCase()) : false;
                      const locationParts: string[] = [];
                      if (city && !addressHasCity) locationParts.push(city);
                      if (province && !addressHasProvince) locationParts.push(province);
                      const locationLabel = locationParts.join(", ");
                      const displayAddress = locationLabel ? `${address}, ${locationLabel}` : address;
                      const statusLabel = getBusinessStatusLabel(result.businessStatus);
                      return (
                        <>
                          <p className="text-sm font-medium text-zinc-950">
                            {result.name}
                            <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#c6283a]">
                              {getPlaceTypeLabel(result.primaryType, result.name, result.address)}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">{displayAddress}</p>
                          {statusLabel ? <p className="mt-0.5 text-[11px] text-zinc-500">{statusLabel}</p> : null}
                        </>
                      );
                    })()}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-zinc-100 px-3 py-2">
            <button
              className="text-xs font-medium text-[#c6283a] hover:text-[#a91f31]"
              onClick={() => {
                setIsManualFormOpen((value) => !value);
                setManualName(searchQuery.trim());
              }}
              type="button"
            >
              ¿No aparece? Añadir manualmente
            </button>
            {isManualFormOpen ? (
              <form
                className="mt-2 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  onManualCreate({
                    name: manualName.trim(),
                    address: manualAddress.trim(),
                    city: manualCity.trim()
                  });
                  setIsManualFormOpen(false);
                  setIsResultsOpen(false);
                  setSearchResults([]);
                }}
              >
                <input
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-xs text-zinc-950"
                  onChange={(event) => setManualName(event.target.value)}
                  placeholder="Nombre"
                  required
                  value={manualName}
                />
                <input
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-xs text-zinc-950"
                  onChange={(event) => setManualAddress(event.target.value)}
                  placeholder="Direccion"
                  required
                  value={manualAddress}
                />
                <input
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-xs text-zinc-950"
                  onChange={(event) => setManualCity(event.target.value)}
                  placeholder="Poblacion"
                  value={manualCity}
                />
                <button className="h-8 rounded-lg bg-[#c6283a] px-3 text-xs font-semibold text-white hover:bg-[#a91f31]" type="submit">
                  Crear borrador manual
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
