import { describe, expect, it } from "vitest";
import { canPlanAcceptNewPlaces } from "@/lib/groupPlans";
import { formatPlanDateSpanish, isPlanDateTodayOrFuture } from "@/lib/groupPlansShared";

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

  it("formats plan dates with Spanish numeric order", () => {
    expect(formatPlanDateSpanish("2026-07-10T00:00:00.000Z")).toBe("10/07/2026");
  });

  it("accepts Spanish numeric date input", () => {
    expect(isPlanDateTodayOrFuture("10/06/2026", new Date("2026-06-10T12:00:00.000Z"))).toBe(true);
  });

  it("accepts today's date for new plan dates", () => {
    expect(isPlanDateTodayOrFuture("2026-06-10", new Date("2026-06-10T12:00:00.000Z"))).toBe(true);
  });
});
