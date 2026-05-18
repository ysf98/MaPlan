import { describe, expect, it } from "vitest";
import {
  extractCityFromFormattedAddress,
  extractProvinceFromFormattedAddress,
  pickCityFromComponents,
  pickStreetFromComponents,
  stripPostalCodes
} from "@/lib/map/addressParsing";

describe("address parsing", () => {
  it("extracts city from postal locality segment", () => {
    expect(extractCityFromFormattedAddress("Calle X, 10, 46800 Xativa, Valencia, Espana")).toBe("Xativa");
  });

  it("extracts province before country", () => {
    expect(extractProvinceFromFormattedAddress("Calle X, 10, 46800 Xativa, Valencia, Espana")).toBe("Valencia");
  });

  it("strips postal code from text", () => {
    expect(stripPostalCodes("28013 Madrid")).toBe("Madrid");
  });

  it("picks city from address components hierarchy", () => {
    expect(
      pickCityFromComponents([
        { long_name: "Comunidad Valenciana", types: ["administrative_area_level_1"] },
        { long_name: "Ontinyent", types: ["locality"] }
      ])
    ).toBe("Ontinyent");
  });

  it("builds street from route and number", () => {
    expect(
      pickStreetFromComponents(
        [
          { long_name: "Calle Mayor", types: ["route"] },
          { long_name: "12", types: ["street_number"] }
        ],
        "Fallback Street"
      )
    ).toBe("Calle Mayor 12");
  });
});
