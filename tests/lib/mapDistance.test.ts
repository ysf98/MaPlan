import { describe, expect, it } from "vitest";
import { formatDistance, getDistanceInMeters } from "@/lib/map/distance";

describe("map distance helpers", () => {
  it("calculates distance in meters between coordinates", () => {
    const meters = getDistanceInMeters(
      { latitude: 40.4168, longitude: -3.7038 },
      { latitude: 40.4178, longitude: -3.7038 }
    );

    expect(Math.round(meters)).toBeGreaterThan(100);
    expect(Math.round(meters)).toBeLessThan(130);
  });

  it("formats meters and kilometers", () => {
    expect(formatDistance(482)).toBe("482 m");
    expect(formatDistance(1530)).toBe("1.5 km");
  });
});
