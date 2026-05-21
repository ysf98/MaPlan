import Link from "next/link";
import type { DashboardGroupSummary } from "@/lib/dashboard";
import { ROUTES } from "@/utils/constants";

type GroupPreviewCardProps = {
  group: DashboardGroupSummary;
};

function getInitial(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "M";
}

export function GroupPreviewCard({ group }: GroupPreviewCardProps) {
  const visibleMembers = group.members.slice(0, 3);
  const hiddenMembers = Math.max(group.memberCount - visibleMembers.length, 0);

  return (
    <Link
      className="group block w-[235px] shrink-0 overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:w-full"
      href={`${ROUTES.groups}/${group.id}`}
    >
      <div
        className="relative h-32 bg-zinc-200 bg-cover bg-center"
        style={{ backgroundImage: `url("${group.coverImageUrl}")` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        <h3 className="absolute bottom-4 left-4 right-4 truncate text-lg font-extrabold text-white">{group.name}</h3>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <svg aria-hidden="true" className="h-4 w-4 text-[#c6283a]" fill="none" viewBox="0 0 24 24">
              <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="M3.5 19c.5-3 2.2-5 4.5-5s4 2 4.5 5M11.5 19c.5-3 2.2-5 4.5-5s4 2 4.5 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
            </svg>
            {group.memberCount} amigos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg aria-hidden="true" className="h-4 w-4 text-[#c6283a]" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 21s7-5.2 7-12A7 7 0 0 0 5 9c0 6.8 7 12 7 12Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
              <path d="M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            {group.placeCount} lugares
          </span>
        </div>
        <div className="flex items-center">
          {visibleMembers.map((member) => (
            <span
              className="-ml-1 grid h-8 w-8 first:ml-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-rose-100 text-xs font-extrabold text-[#c6283a]"
              key={member.userId}
              title={member.username || "Usuario"}
            >
              {member.avatarUrl ? <img alt="" className="h-full w-full object-cover" src={member.avatarUrl} /> : getInitial(member.username)}
            </span>
          ))}
          {hiddenMembers > 0 ? (
            <span className="-ml-1 grid h-8 min-w-8 place-items-center rounded-full border-2 border-white bg-[#ff5b69] px-2 text-xs font-extrabold text-white">
              +{hiddenMembers}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
