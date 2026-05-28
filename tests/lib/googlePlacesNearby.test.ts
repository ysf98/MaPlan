import { describe, expect, it } from "vitest";
import { getDistanceMeters, selectNearbyPlaceCandidate, type NearbySelectionInput } from "@/lib/map/googlePlacesNearby";

const CLICK_POINT = { lat: 40.4168, lng: -3.7038 };

function createCandidate(overrides: Partial<NearbySelectionInput>): NearbySelectionInput {
  return {
    placeId: overrides.placeId ?? "place-1",
    name: overrides.name ?? "Cafe Centro",
    latitude: overrides.latitude ?? CLICK_POINT.lat,
    longitude: overrides.longitude ?? CLICK_POINT.lng,
    types: overrides.types ?? [],
    photoReference: overrides.photoReference ?? null
  };
}

describe("googlePlacesNearby", () => {
  it("calculates distance in meters", () => {
    const distance = getDistanceMeters(CLICK_POINT, CLICK_POINT);
    expect(distance).toBeLessThan(0.001);
  });

  it("returns no_candidate when no results are available", () => {
    const selected = selectNearbyPlaceCandidate({
      click: CLICK_POINT,
      candidates: []
    });

    expect(selected).toEqual({
      candidate: null,
      reason: "no_candidate"
    });
  });

  it("rejects nearest candidate when it is outside the allowed distance", () => {
    const selected = selectNearbyPlaceCandidate({
      click: CLICK_POINT,
      candidates: [
        createCandidate({
          latitude: 40.4185,
          longitude: -3.7038
        })
      ],
      maxDistanceMeters: 75
    });

    expect(selected).toEqual({
      candidate: null,
      reason: "too_far"
    });
  });

  it("prefers useful place types when candidates are at same distance", () => {
    const selected = selectNearbyPlaceCandidate({
      click: CLICK_POINT,
      candidates: [
        createCandidate({
          placeId: "generic",
          types: ["point_of_interest"]
        }),
        createCandidate({
          placeId: "restaurant",
          types: ["restaurant"]
        })
      ]
    });

    expect(selected.candidate && selected.candidate.placeId).toBe("restaurant");
  });

  it("uses photo availability as final tie-breaker", () => {
    const selected = selectNearbyPlaceCandidate({
      click: CLICK_POINT,
      candidates: [
        createCandidate({
          placeId: "without-photo",
          types: ["restaurant"],
          photoReference: null
        }),
        createCandidate({
          placeId: "with-photo",
          types: ["restaurant"],
          photoReference: "photo-ref"
        })
      ]
    });

    expect(selected.candidate && selected.candidate.placeId).toBe("with-photo");
  });

  it("prioritizes candidate name similar to selected map label", () => {
    const selected = selectNearbyPlaceCandidate({
      click: CLICK_POINT,
      selectedName: "Bar Sol",
      candidates: [
        createCandidate({
          placeId: "closer-but-different",
          name: "Farmacia Centro",
          latitude: 40.41681,
          longitude: -3.7038
        }),
        createCandidate({
          placeId: "slightly-farther-name-match",
          name: "Bar Sol",
          latitude: 40.4169,
          longitude: -3.7038
        })
      ]
    });

    expect(selected.candidate && selected.candidate.placeId).toBe("slightly-farther-name-match");
  });

  it("rejects nearby candidate when selected name does not match enough", () => {
    const selected = selectNearbyPlaceCandidate({
      click: CLICK_POINT,
      selectedName: "Teatro Principal",
      candidates: [
        createCandidate({
          placeId: "close-wrong-name",
          name: "Farmacia Central",
          latitude: 40.41682,
          longitude: -3.7038
        })
      ],
      maxDistanceMeters: 120,
      minNameSimilarityScore: 0.45
    });

    expect(selected).toEqual({
      candidate: null,
      reason: "no_candidate"
    });
  });
});
