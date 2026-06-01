const CATEGORY_MARKER_COLORS: Record<string, string> = {
  Comer: "#f97316",
  Cafeteria: "#b45309",
  Visitar: "#2563eb",
  Fiesta: "#c026d3",
  Naturaleza: "#16a34a",
  Playa: "#0891b2",
  Compras: "#db2777",
  Otros: "#14b8a6"
};

function normalizeMarkerText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getPlaceMarkerColor(category: string | null | undefined): string {
  return CATEGORY_MARKER_COLORS[category || ""] ?? CATEGORY_MARKER_COLORS.Otros;
}

export function getPlaceMarkerColorFromPlace(place: {
  category?: string | null;
  name?: string | null;
  address?: string | null;
}): string {
  const text = `${normalizeMarkerText(place.name)} ${normalizeMarkerText(place.address)}`;

  if (/\b(cafe|cafeteria|coffee|bakery|panaderia|pasteleria)\b/.test(text)) {
    return CATEGORY_MARKER_COLORS.Cafeteria;
  }

  if (/\b(bar|restaurante|restaurant|pizzeria|pizza|burger|hamburgueseria|tapas|taberna|braseria|asador|kebab)\b/.test(text)) {
    return CATEGORY_MARKER_COLORS.Comer;
  }

  if (/\b(discoteca|pub|club|cocktail)\b/.test(text)) {
    return CATEGORY_MARKER_COLORS.Fiesta;
  }

  if (/\b(supermercado|market|tienda|store|outlet|shopping|centro comercial)\b/.test(text)) {
    return CATEGORY_MARKER_COLORS.Compras;
  }

  if (/\b(playa|beach)\b/.test(text)) {
    return CATEGORY_MARKER_COLORS.Playa;
  }

  if (/\b(parque|park|jardin|montana|mountain|sendero|ruta)\b/.test(text)) {
    return CATEGORY_MARKER_COLORS.Naturaleza;
  }

  return getPlaceMarkerColor(place.category);
}
