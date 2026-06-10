import { describe, expect, it } from "vitest";
import { canPlanAcceptNewPlaces } from "@/lib/groupPlans";

describe("group plan domain helpers", () => {
  it("accepts plans without date", () => {
    expect(canPlanAcceptNewPlaces(null, new Date("2026-06-10T12:00:00.000Z"))).toBe(true);
  });

  it("accepts plans whose date is still in the future", () => {
    expect(canPlanAcceptNewPlaces("2026-06-11T12:00:00.000Z", new Date("2026-06-10T12:00:00.000Z"))).toBe(true);
  });

  it("rejects plans whose date has already passed", () => {
    expect(canPlanAcceptNewPlaces("2026-06-09T12:00:00.000Z", new Date("2026-06-10T12:00:00.000Z"))).toBe(false);
  });

  it("rejects invalid date values", () => {
    expect(canPlanAcceptNewPlaces("not-a-date", new Date("2026-06-10T12:00:00.000Z"))).toBe(false);
  });
});
