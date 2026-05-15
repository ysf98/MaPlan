import { describe, expect, it } from "vitest";
import {
  splitAddressParts,
  parseReverseGeocodePayload,
  pickFirstNonEmpty,
  buildDraftFromRenderedFeature
} from "@/lib/map/geocoding";

describe("geocoding helpers", () => {
  it("splitAddressParts separates street and city", () => {
    expect(splitAddressParts("Gran Via 10, Madrid, Espana")).toEqual({
      street: "Gran Via 10",
      city: "Madrid"
    });
  });

  it("pickFirstNonEmpty returns first trimmed non-empty value", () => {
    expect(pickFirstNonEmpty("   ", undefined, "  Hola ")).toBe("Hola");
  });

  it("parseReverseGeocodePayload maps poi + address + city", () => {
    const result = parseReverseGeocodePayload({
      features: [
        {
          properties: {
            feature_type: "poi",
            name: "Bar Centro"
          }
        },
        {
          properties: {
            feature_type: "address",
            address: "Calle Mayor 2"
          }
        },
        {
          properties: {
            feature_type: "place",
            place: "Madrid"
          }
        }
      ]
    });

    expect(result).toEqual({
      name: "Bar Centro",
      address: "Calle Mayor 2",
      city: "Madrid"
    });
  });

  it("buildDraftFromRenderedFeature creates safe fallback draft", () => {
    const draft = buildDraftFromRenderedFeature(
      {
        properties: {
          name: "Cafe Sol",
          full_address: "Calle del Sol 1, Sevilla"
        }
      },
      37.38,
      -5.99
    );

    expect(draft.name).toBe("Cafe Sol");
    expect(draft.address).toBe("Calle del Sol 1");
    expect(draft.city).toBe("Sevilla");
    expect(draft.latitude).toBe(37.38);
    expect(draft.longitude).toBe(-5.99);
  });
});
