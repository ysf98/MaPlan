"use client";

import { useState } from "react";
import { PlaceCard } from "@/components/places/PlaceCard";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupOwnerControls } from "@/components/groups/GroupOwnerControls";
import { GroupMap } from "@/components/map/GroupMap";
import type { GroupDetail, GroupJoinRequestItem } from "@/lib/groups/types";
import type { GroupMemberPreview } from "@/lib/groups/types";
import type { GroupInvitationItem } from "@/lib/groupInvitations";
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
  const useStackedMembers = membersPreview.length >= 4;
  const hiddenMembersCount = Math.max(0, totalMembersCount - membersPreview.length);
  const selectedPlace = places.find((place) => place.id === selectedPlaceId) ?? null;

  return (
    <section className="space-y-4">
      <Card className="rounded-3xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge label={group.role === "owner" ? "Admin" : "Member"} tone="visit" />
              <div className={`flex items-center ${useStackedMembers ? "-space-x-2" : "gap-2"}`}>
                {membersPreview.map((member) => (
                  <div
                    key={member.userId}
                    className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100"
                    title={`@${member.username || "sin-username"} · ${getRoleLabel(member.role)}`}
                  >
                    {member.avatarUrl ? (
                      <img alt={member.username || "Avatar"} className="h-full w-full object-cover" src={member.avatarUrl} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-700">
                        {getInitial(member.username)}
                      </div>
                    )}
                  </div>
                ))}
                {hiddenMembersCount > 0 ? (
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-[10px] font-semibold text-white"
                    onClick={() => setIsMembersModalOpen(true)}
                    title={`${hiddenMembersCount} miembro(s) mas`}
                    type="button"
                  >
                    +{hiddenMembersCount}
                  </button>
                ) : null}
              </div>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{group.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{group.description || "Grupo sin descripcion"}</p>
          </div>
          <GroupOwnerControls
            groupId={groupId}
            groupName={group.name}
            joinCode={group.joinCode}
            joinPolicy={group.joinPolicy}
            pendingRequests={pendingRequests}
            placeEditPolicy={group.placeEditPolicy}
            role={group.role}
            invitableFriends={invitableFriends}
            groupInvitations={groupInvitations}
            totalFriendsCount={totalFriendsCount}
          />
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
          <h3 className="text-sm font-semibold text-slate-900">Lugares guardados</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {places.map((place) => (
              <li key={place.id}>
                <button
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedPlaceId === place.id
                      ? "border-teal-300 bg-teal-50 text-teal-900"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                  onClick={() => setSelectedPlaceId(place.id)}
                  type="button"
                >
                  {place.name}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState
          title="Todavia no hay lugares"
          description={
            group.canEditPlaces
              ? "Empieza agregando el primer sitio recomendado para que tu grupo pueda verlo en el mapa."
              : "Aun no hay lugares. Solo el propietario puede agregar el primer sitio en este grupo."
          }
        />
      )}

      {selectedPlace ? (
        <PlaceCard canDelete={group.role === "owner"} canEdit={group.canEditPlaces} groupId={groupId} place={selectedPlace} />
      ) : null}

      {isMembersModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <Card className="w-full max-w-md rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Miembros del grupo</h3>
              <Button onClick={() => setIsMembersModalOpen(false)} size="sm" type="button" variant="ghost">
                Cerrar
              </Button>
            </div>
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {allMembers.map((member) => (
                <li key={member.userId} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {member.avatarUrl ? (
                      <img alt={member.username || "Avatar"} className="h-full w-full object-cover" src={member.avatarUrl} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-700">
                        {getInitial(member.username)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">@{member.username || "sin-username"}</p>
                    <p className="text-xs text-slate-500">{getRoleLabel(member.role)}</p>
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

