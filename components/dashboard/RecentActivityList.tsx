import type { GroupActivityFeedItem } from "@/lib/groupActivity";

type RecentActivityListProps = {
  activityFeed: GroupActivityFeedItem[];
};

function getInitial(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "A";
}

function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(Math.round(diffMs / 60000), 1);

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.round(hours / 24);
  return `Hace ${days} d`;
}

export function RecentActivityList({ activityFeed }: RecentActivityListProps) {
  if (activityFeed.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-rose-200 bg-white/70 px-5 py-6 text-sm font-medium text-zinc-500">
        Aun no hay actividad reciente en tus grupos.
      </div>
    );
  }

  return (
    <ul className="space-y-5">
      {activityFeed.slice(0, 5).map((event, index) => (
        <li className="flex items-center gap-3" key={event.id}>
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rose-100 text-sm font-extrabold text-[#c6283a] ring-4 ring-white">
            {getInitial(event.actorUsername)}
            <span
              className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                index % 2 === 0 ? "bg-emerald-400" : "bg-sky-400"
              }`}
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-800">
              {event.actorUsername ? event.actorUsername : "Alguien"} guardo{" "}
              <span className="text-[#c6283a]">{event.entityName || "un lugar"}</span>
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
              {formatRelativeTime(event.createdAt)} - {event.groupName}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
