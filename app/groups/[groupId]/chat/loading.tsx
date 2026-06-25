import { RouteLoadingState } from "@/components/ui/RouteLoadingState";

export default function GroupChatLoading() {
  return <RouteLoadingState description="Abriendo la conversación del grupo." title="Cargando chat" variant="chat" />;
}
