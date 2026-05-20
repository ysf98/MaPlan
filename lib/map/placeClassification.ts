import type { GooglePlaceSuggestion } from "@/lib/map/googlePlaces";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getDirectLabelFromPrimaryType(primaryType: string): string | null {
  const primary = primaryType.toLowerCase();
  if (!primary) return null;

  const directMappings: Array<{ match: string; label: string }> = [
    { match: "restaurant", label: "Restaurante" },
    { match: "meal_takeaway", label: "Restaurante" },
    { match: "meal_delivery", label: "Restaurante" },
    { match: "bar", label: "Bar" },
    { match: "cafe", label: "Cafeteria" },
    { match: "bakery", label: "Panaderia" },
    { match: "supermarket", label: "Hipermercado" },
    { match: "convenience_store", label: "Supermercado" },
    { match: "shopping_mall", label: "Centro comercial" },
    { match: "clothing_store", label: "Tienda" },
    { match: "movie_theater", label: "Cine" },
    { match: "pharmacy", label: "Farmacia" },
    { match: "hospital", label: "Hospital" },
    { match: "hotel", label: "Hotel" },
    { match: "gym", label: "Gimnasio" },
    { match: "sports_complex", label: "Deporte" },
    { match: "stadium", label: "Deporte" },
    { match: "swimming_pool", label: "Deporte" },
    { match: "park", label: "Parque" },
    { match: "museum", label: "Museo" },
    { match: "tourist_attraction", label: "Lugar turistico" },
    { match: "locality", label: "Localidad" },
    { match: "route", label: "Direccion" },
    { match: "street_address", label: "Direccion" },
    { match: "store", label: "Comercio" }
  ];

  const found = directMappings.find((item) => primary.includes(item.match));
  return found?.label ?? null;
}

export function getPlaceTypeLabel(primaryType: string | null, placeName: string, address: string): string {
  const normalizedName = normalize(placeName);
  const normalizedAddress = normalize(address);
  const primary = (primaryType || "").toLowerCase();

  const directLabel = getDirectLabelFromPrimaryType(primary);
  if (directLabel) {
    return directLabel;
  }

  const scores: Record<
    "restaurante" | "bar" | "cafeteria" | "discoteca" | "comercio" | "deporte" | "localidad" | "direccion",
    number
  > = {
    restaurante: 0,
    bar: 0,
    cafeteria: 0,
    discoteca: 0,
    comercio: 0,
    deporte: 0,
    localidad: 0,
    direccion: 0
  };

  const applyHints = (text: string, hints: string[], key: keyof typeof scores, weight: number) => {
    if (hints.some((hint) => text.includes(hint))) scores[key] += weight;
  };

  if (primary.includes("restaurant") || primary.includes("meal_takeaway") || primary.includes("meal_delivery")) scores.restaurante += 5;
  if (primary.includes("food")) scores.restaurante += 3;
  if (primary.includes("bar")) scores.bar += 5;
  if (primary.includes("night_club")) scores.discoteca += 5;
  if (primary.includes("cafe") || primary.includes("bakery")) scores.cafeteria += 5;
  if (primary.includes("store") || primary.includes("supermarket") || primary.includes("shopping_mall") || primary.includes("convenience_store"))
    scores.comercio += 5;
  if (primary.includes("gym") || primary.includes("sports_complex") || primary.includes("stadium") || primary.includes("swimming_pool") || primary.includes("sports"))
    scores.deporte += 5;
  if (primary.includes("locality")) scores.localidad += 5;
  if (primary.includes("route") || primary.includes("street_address")) scores.direccion += 5;

  applyHints(
    normalizedName,
    [
      "restaurante",
      "restaurant",
      "pizzeria",
      "pizza",
      "burger",
      "mcdonald",
      "mc donald",
      "burger king",
      "kfc",
      "telepizza",
      "domino",
      "domino's",
      "taco bell",
      "popeyes",
      "subway",
      "foster",
      "foster's",
      "kebab",
      "tapas",
      "braseria",
      "asador",
      "marisqueria",
      "hamburgueseria"
    ],
    "restaurante",
    3
  );
  applyHints(normalizedName, ["bar", "cerveceria", "taberna"], "bar", 3);
  applyHints(normalizedName, ["cafe", "cafeteria", "coffee"], "cafeteria", 3);
  applyHints(normalizedName, ["discoteca", "pub", "club"], "discoteca", 3);
  applyHints(normalizedName, ["supermercado", "market", "tienda", "store", "outlet", "centro comercial"], "comercio", 3);
  applyHints(normalizedName, ["padel", "polideportivo", "poliesportiu", "gimnasio", "gym", "fitness", "crossfit", "piscina", "tenis", "futbol", "baloncesto", "deporte"], "deporte", 3);
  applyHints(normalizedAddress, ["avenida", "av.", "calle", "carrer", "plaza"], "direccion", 1);

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] <= 0) return "Sitio";

  if (best[0] === "restaurante") return "Restaurante";
  if (best[0] === "bar") return "Bar";
  if (best[0] === "cafeteria") return "Cafeteria";
  if (best[0] === "discoteca") return "Discoteca";
  if (best[0] === "comercio") return "Comercio";
  if (best[0] === "deporte") return "Deporte";
  if (best[0] === "localidad") return "Localidad";
  if (best[0] === "direccion") return "Direccion";
  return "Sitio";
}

export function inferCategoryFromSuggestion(result: GooglePlaceSuggestion): string {
  const primaryType = (result.primaryType || "").toLowerCase();
  const name = normalize(result.name);

  if (primaryType.includes("cafe") || primaryType.includes("bakery") || name.includes("cafe")) return "Cafeteria";
  if (
    primaryType.includes("restaurant") ||
    primaryType.includes("meal_takeaway") ||
    primaryType.includes("meal_delivery") ||
    primaryType.includes("food") ||
    name.includes("restaurante") ||
    name.includes("burger") ||
    name.includes("pizza")
  ) {
    return "Comer";
  }
  if (primaryType.includes("night_club") || name.includes("discoteca") || name.includes("pub") || name.includes("cocktail")) return "Fiesta";
  if (primaryType.includes("bar")) return "Comer";
  if (primaryType.includes("store") || primaryType.includes("supermarket") || primaryType.includes("shopping_mall") || primaryType.includes("convenience_store")) {
    return "Compras";
  }
  return "Otros";
}
