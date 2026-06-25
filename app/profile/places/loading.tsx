import { RouteLoadingState } from "@/components/ui/RouteLoadingState";

export default function ProfilePlacesLoading() {
  return <RouteLoadingState description="Preparando tus favoritos, pendientes e historial." title="Cargando listas" />;
}
