import { describe, expect, it } from "vitest";
import { getGroupDetailTab } from "@/lib/groups/tabs";

describe("group detail tabs", () => {
  it("returns lugares by default", () => {
    expect(getGroupDetailTab(undefined)).toBe("lugares");
    expect(getGroupDetailTab("")) .toBe("lugares");
    expect(getGroupDetailTab("desconocido")).toBe("lugares");
  });

  it("accepts valid tabs", () => {
    expect(getGroupDetailTab("lugares")).toBe("lugares");
    expect(getGroupDetailTab("actividad")).toBe("actividad");
    expect(getGroupDetailTab("mapa")).toBe("mapa");
    expect(getGroupDetailTab("planes")).toBe("planes");
  });

  it("handles array values safely", () => {
    expect(getGroupDetailTab(["actividad", "mapa"])).toBe("actividad");
  });
});
