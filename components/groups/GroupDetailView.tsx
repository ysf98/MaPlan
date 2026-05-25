"use client";

import { useActionState, useState } from "react";
import { deletePlaceAction, type DeletePlaceActionState } from "@/app/groups/[groupId]/actions";
import { GroupOwnerControls } from "@/components/groups/GroupOwnerControls";
import { GroupMap } from "@/components/map/GroupMap";
import { SimplePlacesList } from "@/components/map/SimplePlacesList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GroupInvitationItem } from "@/lib/groupInvitations";
import type { GroupDetail, GroupJoinRequestItem, GroupMemberPreview } from "@/lib/groups/types";
import type { GroupPlace } from "@/lib/places/shared";

type GroupDetailViewProps = {
  group: GroupDetail;
  groupId: string;
  places: GroupPlace[];
  membersPreview: GroupMemberPreview[];
  allMembers: GroupMemberPreview[];
  totalMembersCount: number;
  pendingRequests: GroupJoinRequestItem[];
  invitableFriends: Array<{ id: string; username: string | null }>;
  groupInvitations: GroupInvitationItem[];
  totalFriendsCount: number;
};

const deleteInitialState: DeletePlaceActionState = { error: null, success: false };

function getInitial(name: string | null): string {
  const value = (name || "").trim();
  if (!value) return "?";
  return value.charAt(0).toUpperCase();
}

function getRoleLabel(role: "owner" | "member"): string {
  return role === "owner" ? "Admin" : "Miembro";
}

export function GroupDetailView({
  group,
  groupId,
  places,
  membersPreview,
  allMembers,
  totalMembersCount,
  pendingRequests,
  invitableFriends,
  groupInvitations,
  totalFriendsCount
}: GroupDetailViewProps) {
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deletePlaceAction, deleteInitialState);
  const useStackedMembers = membersPreview.length >= 4;
  const hiddenMembersCount = Math.max(0, totalMembersCount - membersPreview.length);

  return (
    <section
      className="space-y-4"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-group-place-card]")) {
          setSelectedPlaceId(null);
        }
      }}
    >
      <Card className="rounded-3xl">
        <div className="relative -m-5 overflow-hidden rounded-3xl border border-zinc-100 bg-white sm:-m-6">
          <div className="absolute right-4 top-4 z-10">
            <GroupOwnerControls
              groupId={groupId}
              groupCoverImageUrl={group.coverImageUrl}
              groupDescription={group.description}
              groupInvitations={groupInvitations}
              groupName={group.name}
              invitableFriends={invitableFriends}
              joinCode={group.joinCode}
              joinPolicy={group.joinPolicy}
              pendingRequests={pendingRequests}
              placeEditPolicy={group.placeEditPolicy}
              role={group.role}
              totalFriendsCount={totalFriendsCount}
            />
          </div>
          <div
            className="relative h-40 bg-zinc-200 bg-cover bg-center"
            style={group.coverImageUrl ? { backgroundImage: `url("${group.coverImageUrl}")` } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
            <div className="absolute inset-x-4 bottom-4 min-w-0">
              <CategoryBadge label={group.role === "owner" ? "Admin" : "Member"} tone="visit" />
              <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-white">{group.name}</h1>
              <p className="mt-1 line-clamp-2 text-sm text-white/85">{group.description || "Grupo sin descripcion"}</p>
            </div>
          </div>
          <div className="p-4">
            <div className={`flex items-center ${useStackedMembers ? "-space-x-2" : "gap-2"}`}>
              {membersPreview.map((member) => (
                <div
                  key={member.userId}
                  className="h-8 w-8 overflow-hidden rounded-full border border-rose-100 bg-rose-50"
                  title={`@${member.username || "sin-username"} · ${getRoleLabel(member.role)}`}
                >
                  {member.avatarUrl ? (
                    <img alt={member.username || "Avatar"} className="h-full w-full object-cover" src={member.avatarUrl} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#c6283a]">
                      {getInitial(member.username)}
                    </div>
                  )}
                </div>
              ))}
              {hiddenMembersCount > 0 ? (
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c6283a] bg-[#c6283a] text-[10px] font-semibold text-white"
                  onClick={() => setIsMembersModalOpen(true)}
                  title={`${hiddenMembersCount} miembro(s) mas`}
                  type="button"
                >
                  +{hiddenMembersCount}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-3xl">
        <div>
          <GroupMap
            canEdit={group.canEditPlaces}
            groupId={groupId}
            onSelectPlace={setSelectedPlaceId}
            places={places}
            selectedPlaceId={selectedPlaceId}
          />
        </div>
      </Card>

      {places.length > 0 ? (
        <Card className="rounded-3xl">
          <SimplePlacesList
            cardDataAttribute="data-group-place-card"
            onTogglePlace={(placeId) => setSelectedPlaceId((current) => (current === placeId ? null : placeId))}
            places={places}
            renderActions={(place) => (
              <>
                {place.googleMapsUrl ? (
                  <a
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-100 px-3 text-xs font-medium text-zinc-700 hover:bg-rose-50 hover:text-[#c6283a]"
                    href={place.googleMapsUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ver en Google Maps
                  </a>
                ) : null}
                {group.role === "owner" ? (
                  <form action={deleteFormAction}>
                    <input name="groupId" type="hidden" value={groupId} />
                    <input name="placeId" type="hidden" value={place.id} />
                    <button
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      disabled={isDeleting}
                      type="submit"
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </button>
                  </form>
                ) : null}
              </>
            )}
            selectedPlaceId={selectedPlaceId}
            title="Lugares guardados"
          />
          {deleteState.error ? <p className="mt-3 text-sm text-rose-600">{deleteState.error}</p> : null}
        </Card>
      ) : (
        <EmptyState
          description={
            group.canEditPlaces
              ? "Empieza agregando el primer sitio recomendado para que tu grupo pueda verlo en el mapa."
              : "Aun no hay lugares. Solo el propietario puede agregar el primer sitio en este grupo."
          }
          title="Todavia no hay lugares"
        />
      )}

      {isMembersModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/40 p-4">
          <Card className="w-full max-w-md rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">Miembros del grupo</h3>
              <Button onClick={() => setIsMembersModalOpen(false)} size="sm" type="button" variant="ghost">
                Cerrar
              </Button>
            </div>
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {allMembers.map((member) => (
                <li key={member.userId} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-rose-100 bg-rose-50">
                    {member.avatarUrl ? (
                      <img alt={member.username || "Avatar"} className="h-full w-full object-cover" src={member.avatarUrl} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#c6283a]">
                        {getInitial(member.username)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-950">@{member.username || "sin-username"}</p>
                    <p className="text-xs text-zinc-500">{getRoleLabel(member.role)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
