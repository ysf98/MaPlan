export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export function getDistanceInMeters(first: MapCoordinate, second: MapCoordinate): number {
  const earthRadiusInMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(second.latitude - first.latitude);
  const deltaLng = toRadians(second.longitude - first.longitude);
  const firstLat = toRadians(first.latitude);
  const secondLat = toRadians(second.latitude);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusInMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return "";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}
