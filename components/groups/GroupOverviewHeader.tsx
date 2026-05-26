import type { GroupDetail, GroupMemberPreview } from "@/lib/groups/types";

function getInitial(name: string | null): string {
  const value = (name || "").trim();
  if (!value) return "?";
  return value.charAt(0).toUpperCase();
}

type GroupOverviewHeaderProps = {
  group: GroupDetail;
  membersPreview: GroupMemberPreview[];
  totalMembersCount: number;
};

export function GroupOverviewHeader({ group, membersPreview, totalMembersCount }: GroupOverviewHeaderProps) {
  const hiddenMembersCount = Math.max(0, totalMembersCount - membersPreview.length);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div
          className="relative h-52 bg-zinc-200 bg-cover bg-center"
          style={group.coverImageUrl ? { backgroundImage: `url(\"${group.coverImageUrl}\")` } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          <div className="absolute inset-x-4 bottom-3 text-white">
            <h1 className="text-[34px] font-extrabold leading-none tracking-tight">{group.name}</h1>
          </div>
        </div>
      </div>

      <p className="max-w-[34rem] text-sm leading-5 text-zinc-700">{group.description || "Sin descripcion"}</p>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-[30px] font-extrabold leading-none text-zinc-950">Miembros</h2>
          <p className="text-sm font-medium text-[#c6283a]">Ver todos</p>
        </div>
        <div className="mt-3 flex items-center -space-x-2">
          {membersPreview.map((member) => (
            <div key={member.userId} className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-rose-50 shadow-sm">
              {member.avatarUrl ? (
                <img alt={member.username || "Avatar"} className="h-full w-full object-cover" src={member.avatarUrl} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#c6283a]">{getInitial(member.username)}</div>
              )}
            </div>
          ))}
          {hiddenMembersCount > 0 ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-rose-100 text-[10px] font-bold text-[#c6283a] shadow-sm">
              +{hiddenMembersCount}
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-zinc-500">{totalMembersCount} miembros en total</p>
      </div>
    </div>
  );
}
