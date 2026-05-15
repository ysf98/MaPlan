"use client";

import { useState } from "react";
import { AddPlaceForm } from "@/components/places/AddPlaceForm";
import { PlacesList } from "@/components/places/PlacesList";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupOwnerControls } from "@/components/groups/GroupOwnerControls";
import { GroupMap } from "@/components/map/GroupMap";
import type { GroupDetail, GroupJoinRequestItem } from "@/lib/groups/types";
import type { GroupMemberPreview } from "@/lib/groups/types";
import type { GroupInvitationItem } from "@/lib/groupInvitations";
import { hasValidCoordinates, type GroupPlace } from "@/lib/places/shared";

type GroupDetailViewProps = {
  group: GroupDetail;
  groupId: string;
  places: GroupPlace[];
  membersPreview: GroupMemberPreview[];
  totalMembersCount: number;
  pendingRequests: GroupJoinRequestItem[];
  invitableFriends: Array<{ id: string; username: string | null }>;
  groupInvitations: GroupInvitationItem[];
  totalFriendsCount: number;
};

type DetailTab = "list" | "map";

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
  totalMembersCount,
  pendingRequests,
  invitableFriends,
  groupInvitations,
  totalFriendsCount
}: GroupDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("list");
  const [showAddPlaceForm, setShowAddPlaceForm] = useState(false);
  const placesWithCoordinates = places.filter((place) => hasValidCoordinates(place)).length;
  const placesPendingLocation = places.length - placesWithCoordinates;
  const useStackedMembers = membersPreview.length >= 4;
  const hiddenMembersCount = Math.max(0, totalMembersCount - membersPreview.length);

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
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-[10px] font-semibold text-white"
                    title={`${hiddenMembersCount} miembro(s) mas`}
                  >
                    +{hiddenMembersCount}
                  </div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              className={`h-10 rounded-lg px-4 text-sm font-medium transition ${
                activeTab === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
              onClick={() => setActiveTab("list")}
              type="button"
            >
              Lista
            </button>
            <button
              className={`h-10 rounded-lg px-4 text-sm font-medium transition ${
                activeTab === "map" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
              onClick={() => setActiveTab("map")}
              type="button"
            >
              Mapa
            </button>
          </div>

          {group.canEditPlaces ? (
            <Button onClick={() => setShowAddPlaceForm((value) => !value)} type="button">
              {showAddPlaceForm ? "Cerrar formulario" : "Anadir lugar"}
            </Button>
          ) : null}
        </div>
      </Card>

      {showAddPlaceForm && group.canEditPlaces ? <AddPlaceForm groupId={groupId} /> : null}

      {activeTab === "list" ? (
        places.length > 0 ? (
          <PlacesList canDelete={group.role === "owner"} canEdit={group.canEditPlaces} groupId={groupId} places={places} />
        ) : (
          <EmptyState
            title="Todavia no hay lugares"
            description={
              group.canEditPlaces
                ? "Empieza agregando el primer sitio recomendado para que tu grupo pueda verlo en lista."
                : "Aun no hay lugares. Solo el propietario puede agregar el primer sitio en este grupo."
            }
          />
        )
      ) : (
        <Card className="rounded-3xl">
          <h2 className="text-lg font-semibold text-slate-900">Mapa del grupo</h2>
          <p className="mt-2 text-sm text-slate-500">Visualiza lugares con coordenadas y selecciona marcadores para ver detalle.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs text-slate-500">Lugares con coordenadas</p>
              <p className="text-lg font-semibold text-slate-900">{placesWithCoordinates}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs text-slate-500">Pendientes de ubicacion</p>
              <p className="text-lg font-semibold text-slate-900">{placesPendingLocation}</p>
            </div>
          </div>
          <div className="mt-4">
            <GroupMap canEdit={group.canEditPlaces} groupId={groupId} places={places} />
          </div>
        </Card>
      )}
    </section>
  );
}

