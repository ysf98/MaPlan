export type NearbyFallbackReason = "no_candidate" | "too_far" | "google_error";

export type NearbySelectionInput = {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  types: string[];
  photoReference: string | null;
};

export type NearbySelectionResult =
  | {
      candidate: NearbySelectionInput;
      distanceMeters: number;
    }
  | {
      candidate: null;
      reason: Exclude<NearbyFallbackReason, "google_error">;
    };

const EARTH_RADIUS_METERS = 6_371_000;

const PREFERRED_TYPE_ORDER = [
  "restaurant",
  "bar",
  "cafe",
  "store",
  "tourist_attraction",
  "bakery",
  "lodging",
  "museum",
  "park",
  "shopping_mall"
] as const;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function getDistanceMeters(
  pointA: { lat: number; lng: number },
  pointB: { lat: number; lng: number }
): number {
  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);
  const deltaLat = toRadians(pointB.lat - pointA.lat);
  const deltaLng = toRadians(pointB.lng - pointA.lng);

  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_METERS * arc;
}

function getTypePriority(types: string[]): number {
  const normalized = types.map((value) => value.toLowerCase());
  for (let index = 0; index < PREFERRED_TYPE_ORDER.length; index += 1) {
    if (normalized.includes(PREFERRED_TYPE_ORDER[index])) {
      return PREFERRED_TYPE_ORDER.length - index;
    }
  }
  return 0;
}

function normalizeForComparison(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string): Set<string> {
  const normalized = normalizeForComparison(value);
  if (!normalized) {
    return new Set();
  }
  return new Set(normalized.split(" ").filter(Boolean));
}

function getNameSimilarityScore(selectedName: string | null | undefined, candidateName: string): number {
  const selected = normalizeForComparison(selectedName || "");
  const candidate = normalizeForComparison(candidateName);
  if (!selected || !candidate) {
    return 0;
  }

  if (selected === candidate) {
    return 1;
  }

  if ((candidate.includes(selected) || selected.includes(candidate)) && Math.min(selected.length, candidate.length) >= 4) {
    return 0.92;
  }

  const selectedTokens = tokenSet(selected);
  const candidateTokens = tokenSet(candidate);
  if (selectedTokens.size === 0 || candidateTokens.size === 0) {
    return 0;
  }

  const intersectionCount = [...selectedTokens].filter((token) => candidateTokens.has(token)).length;
  if (intersectionCount === 0) {
    return 0;
  }

  const unionCount = new Set([...selectedTokens, ...candidateTokens]).size;
  const jaccard = intersectionCount / unionCount;
  const selectedCoverage = intersectionCount / selectedTokens.size;
  return Math.min(1, jaccard * 0.6 + selectedCoverage * 0.4);
}

function getDistanceScore(distanceMeters: number, maxDistanceMeters: number): number {
  if (distanceMeters <= 0) {
    return 1;
  }
  return Math.max(0, 1 - distanceMeters / maxDistanceMeters);
}

export function selectNearbyPlaceCandidate(params: {
  click: { lat: number; lng: number };
  candidates: NearbySelectionInput[];
  selectedName?: string | null;
  maxDistanceMeters?: number;
  minNameSimilarityScore?: number;
}): NearbySelectionResult {
  const {
    click,
    candidates,
    selectedName = null,
    maxDistanceMeters = 75,
    minNameSimilarityScore = 0.35
  } = params;
  if (candidates.length === 0) {
    return { candidate: null, reason: "no_candidate" };
  }
  const hasSelectedName = Boolean((selectedName || "").trim());

  const scored = candidates
    .map((candidate) => ({
      candidate,
      distanceMeters: getDistanceMeters(click, { lat: candidate.latitude, lng: candidate.longitude }),
      typePriority: getTypePriority(candidate.types),
      hasPhoto: Boolean(candidate.photoReference),
      nameSimilarityScore: getNameSimilarityScore(selectedName, candidate.name)
    }))
    .filter((item) => Number.isFinite(item.distanceMeters))
    .map((item) => {
      const distanceScore = getDistanceScore(item.distanceMeters, maxDistanceMeters);
      const normalizedTypeScore = item.typePriority / PREFERRED_TYPE_ORDER.length;
      const photoScore = item.hasPhoto ? 1 : 0;
      const rankingScore = hasSelectedName
        ? item.nameSimilarityScore * 0.55 + distanceScore * 0.3 + normalizedTypeScore * 0.1 + photoScore * 0.05
        : distanceScore * 0.7 + normalizedTypeScore * 0.2 + photoScore * 0.1;
      return {
        ...item,
        rankingScore
      };
    })
    .sort((a, b) => {
      if (a.rankingScore !== b.rankingScore) {
        return b.rankingScore - a.rankingScore;
      }
      if (a.distanceMeters !== b.distanceMeters) {
        return a.distanceMeters - b.distanceMeters;
      }
      return 0;
    });

  if (scored.length === 0) {
    return { candidate: null, reason: "no_candidate" };
  }

  const selected = scored[0];
  if (selected.distanceMeters > maxDistanceMeters) {
    return { candidate: null, reason: "too_far" };
  }
  if (hasSelectedName && selected.nameSimilarityScore < minNameSimilarityScore) {
    return { candidate: null, reason: "no_candidate" };
  }

  return {
    candidate: selected.candidate,
    distanceMeters: selected.distanceMeters
  };
}
