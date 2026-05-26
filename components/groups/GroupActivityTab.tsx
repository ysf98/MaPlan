import { EmptyState } from "@/components/ui/EmptyState";
import type { GroupActivityFeedItem } from "@/lib/groupActivity";

type GroupActivityTabProps = {
  events: GroupActivityFeedItem[];
};

function formatDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function GroupActivityTab({ events }: GroupActivityTabProps) {
  if (events.length === 0) {
    return <EmptyState description="Cuando alguien anada lugares, aparecera aqui." title="Sin actividad" />;
  }

  return (
    <div>
      <h3 className="text-base font-bold text-zinc-950">Actividad reciente</h3>
      <ul className="mt-3 space-y-2">
        {events.map((event) => (
          <li className="rounded-2xl border border-zinc-100 bg-white px-3 py-2" key={event.id}>
            <p className="text-sm font-medium text-zinc-900">{event.message}</p>
            <p className="mt-1 text-xs text-zinc-500">{formatDate(event.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
