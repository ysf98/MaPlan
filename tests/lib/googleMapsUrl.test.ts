import { describe, expect, it } from "vitest";
import { buildGoogleMapsUrl, normalizeGoogleMapsUrl } from "@/lib/map/googleMapsUrl";

function parseGoogleMapsUrl(value: string | null): URL {
  expect(value).not.toBeNull();
  return new URL(value ?? "");
}

describe("googleMapsUrl", () => {
  it("builds a mobile-compatible Google Maps URL with place id and query", () => {
    const url = parseGoogleMapsUrl(
      buildGoogleMapsUrl({
        placeId: "ChIJ123",
        name: "Cafe Centro",
        address: "Calle Mayor 2",
        city: "Madrid"
      })
    );

    expect(url.toString().startsWith("https://www.google.com/maps/search/?")).toBe(true);
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("Cafe Centro, Calle Mayor 2, Madrid");
    expect(url.searchParams.get("query_place_id")).toBe("ChIJ123");
  });

  it("encodes spaces and accented characters with URLSearchParams", () => {
    const url = buildGoogleMapsUrl({
      placeId: "ChIJ con espacios",
      name: "Cafeteria Ático",
      address: "Carrer de l'Eixample 10",
      city: "Barcelona"
    });

    expect(url).toContain("api=1");
    expect(url).toContain("query=Cafeteria+%C3%81tico%2C+Carrer+de+l%27Eixample+10%2C+Barcelona");
    expect(url).toContain("query_place_id=ChIJ+con+espacios");
  });

  it("falls back to a query-only URL without place id", () => {
    const url = parseGoogleMapsUrl(
      buildGoogleMapsUrl({
        name: "Bar Sol",
        address: "Plaza del Sol 1"
      })
    );

    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("Bar Sol, Plaza del Sol 1");
    expect(url.searchParams.has("query_place_id")).toBe(false);
  });

  it("normalizes legacy q=place_id URLs when place data is available", () => {
    const url = parseGoogleMapsUrl(
      normalizeGoogleMapsUrl("https://www.google.com/maps/place/?q=place_id:ChIJ123", {
        placeId: "ChIJ123",
        name: "Cafe Centro",
        address: "Calle Mayor 2",
        city: "Madrid"
      })
    );

    expect(url.pathname).toBe("/maps/search/");
    expect(url.searchParams.get("query")).toBe("Cafe Centro, Calle Mayor 2, Madrid");
    expect(url.searchParams.get("query_place_id")).toBe("ChIJ123");
  });
});
