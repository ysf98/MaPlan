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
      <input
        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
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
      {isResultsOpen && extractSearchQueryFromLink(searchQuery).length >= 3 ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-lg">
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
