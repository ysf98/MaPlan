import { RouteLoadingState } from "@/components/ui/RouteLoadingState";

export default function PersonalMapLoading() {
  return <RouteLoadingState description="Preparando tu mapa personal." title="Cargando mapa" variant="map" />;
}
