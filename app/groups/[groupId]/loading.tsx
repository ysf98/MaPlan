import { RouteLoadingState } from "@/components/ui/RouteLoadingState";

export default function GroupDetailLoading() {
  return <RouteLoadingState description="Cargando lugares, planes, miembros y actividad del grupo." title="Cargando grupo" />;
}
