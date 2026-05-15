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
import type { GroupInvitationItem } from "@/lib/groupInvitations";
import { hasValidCoordinates, type GroupPlace } from "@/lib/places/shared";

type GroupDetailViewProps = {
  group: GroupDetail;
  groupId: string;
  places: GroupPlace[];
  pendingRequests: GroupJoinRequestItem[];
  invitableFriends: Array<{ id: string; username: string | null }>;
  groupInvitations: GroupInvitationItem[];
  totalFriendsCount: number;
};

type DetailTab = "list" | "map";

export function GroupDetailView({ group, groupId, places, pendingRequests, invitableFriends, groupInvitations, totalFriendsCount }: GroupDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("list");
  const [showAddPlaceForm, setShowAddPlaceForm] = useState(false);
  const placesWithCoordinates = places.filter((place) => hasValidCoordinates(place)).length;
  const placesPendingLocation = places.length - placesWithCoordinates;

  return (
    <section className="space-y-4">
      <Card className="rounded-3xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge label={group.role === "owner" ? "Admin" : "Member"} tone="visit" />
              <CategoryBadge label="Grupo" tone="plan" />
              <CategoryBadge label={group.placeEditPolicy === "owner_only" ? "Edicion: solo owner" : "Edicion: miembros"} tone="food" />
              <CategoryBadge
                label={
                  group.joinPolicy === "invite_only"
                    ? "Acceso: solo invitacion"
                    : group.joinPolicy === "request_to_join"
                      ? "Acceso: por solicitud"
                      : "Acceso: por codigo"
                }
                tone="coffee"
              />
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{group.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{group.description || "Grupo sin descripcion"}</p>
            <p className="mt-3 text-xs text-slate-500">Codigo de invitacion: {group.joinCode}</p>
          </div>
          <GroupOwnerControls
            groupId={groupId}
            groupName={group.name}
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

