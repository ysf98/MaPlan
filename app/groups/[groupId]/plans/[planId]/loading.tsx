import { RouteLoadingState } from "@/components/ui/RouteLoadingState";

export default function GroupPlanLoading() {
  return <RouteLoadingState description="Preparando el mapa y el itinerario del plan." title="Cargando plan" variant="plan" />;
}
