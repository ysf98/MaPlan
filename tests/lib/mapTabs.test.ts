import { describe, expect, it } from "vitest";
import { getPersonalMapTab } from "@/lib/map/tabs";

describe("personal map tabs", () => {
  it("defaults to lugares", () => {
    expect(getPersonalMapTab(undefined)).toBe("lugares");
    expect(getPersonalMapTab("")) .toBe("lugares");
    expect(getPersonalMapTab("invalida")).toBe("lugares");
  });

  it("accepts mapa", () => {
    expect(getPersonalMapTab("mapa")).toBe("mapa");
  });

  it("handles array values", () => {
    expect(getPersonalMapTab(["mapa", "lugares"])).toBe("mapa");
  });
});
