import { describe, expect, it } from "vitest";
import { getPlaceTypeLabel, inferCategoryFromSuggestion } from "@/lib/map/placeClassification";

describe("place classification", () => {
  it("detects restaurante label from name hints even with generic type", () => {
    expect(getPlaceTypeLabel("establishment", "McDonald's Ontinyent", "Avenida de Alicante")).toBe("Restaurante");
  });

  it("detects deporte label from sports type", () => {
    expect(getPlaceTypeLabel("sports_complex", "Club Municipal", "Carrer del Poli")).toBe("Deporte");
  });

  it("falls back to Sitio when no signals exist", () => {
    expect(getPlaceTypeLabel("establishment", "Artesania Local", "Referencia sin contexto")).toBe("Sitio");
  });

  it("maps supermarket types to Hipermercado label", () => {
    expect(getPlaceTypeLabel("supermarket", "Family Cash", "Av. del Textil, Ontinyent")).toBe("Hipermercado");
  });

  it("maps movie theater types to Cine label", () => {
    expect(getPlaceTypeLabel("movie_theater", "Cines ABC", "Valencia")).toBe("Cine");
  });

  it("maps bar type to Bar label", () => {
    expect(getPlaceTypeLabel("bar", "Taberna Central", "Madrid")).toBe("Bar");
  });

  it("maps bar to Comer category (not Fiesta)", () => {
    const category = inferCategoryFromSuggestion({
      externalPlaceId: "x",
      provider: "google_places",
      name: "Arcs Cuina Mediterrania",
      address: "Calle Donant de Sang 3",
      city: "Albaida",
      province: "Valencia",
      latitude: 0,
      longitude: 0,
      googleMapsUrl: null,
      businessStatus: "OPERATIONAL",
      primaryType: "bar"
    });
    expect(category).toBe("Comer");
  });
});
