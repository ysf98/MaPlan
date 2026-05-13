"use client";

import { useState } from "react";
import { AddPlaceForm } from "@/components/places/AddPlaceForm";
import { PlacesList } from "@/components/places/PlacesList";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { OwnerJoinRequestsPanel } from "@/components/groups/OwnerJoinRequestsPanel";
import type { GroupDetail, GroupJoinRequestItem } from "@/lib/groups/types";
import type { GroupPlace } from "@/lib/places/shared";

type GroupDetailViewProps = {
  group: GroupDetail;
  groupId: string;
  places: GroupPlace[];
  pendingRequests: GroupJoinRequestItem[];
  reviewedRequests: GroupJoinRequestItem[];
};

type DetailTab = "list" | "map";

export function GroupDetailView({ group, groupId, places, pendingRequests, reviewedRequests }: GroupDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("list");
  const [showAddPlaceForm, setShowAddPlaceForm] = useState(places.length === 0 && group.canEditPlaces);

  return (
    <section className="space-y-4">
      <Card className="rounded-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge label={group.role === "owner" ? "Admin" : "Member"} tone="visit" />
          <CategoryBadge label="Grupo" tone="plan" />
          <CategoryBadge label={group.placeEditPolicy === "owner_only" ? "Edicion: solo owner" : "Edicion: miembros"} tone="food" />
          <CategoryBadge label={group.joinPolicy === "request_to_join" ? "Acceso: por solicitud" : "Acceso: por codigo"} tone="coffee" />
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{group.name}</h1>
        <p className="mt-2 text-sm text-slate-500">{group.description || "Grupo sin descripcion"}</p>
        <p className="mt-3 text-xs text-slate-500">Codigo de invitacion: {group.joinCode}</p>
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

      {group.role === "owner" ? (
        <OwnerJoinRequestsPanel groupId={groupId} requests={pendingRequests} reviewedRequests={reviewedRequests} />
      ) : null}

      {activeTab === "list" ? (
        places.length > 0 ? (
          <PlacesList canEdit={group.canEditPlaces} groupId={groupId} places={places} />
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
          <p className="mt-2 text-sm text-slate-500">
            Vista de mapa en preparacion. Aqui mostraremos marcadores, filtros y navegacion geografica del grupo.
          </p>
          <div className="mt-4 flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
            <p className="px-4 text-center text-sm text-slate-500">Placeholder de mapa para integracion futura.</p>
          </div>
        </Card>
      )}
    </section>
  );
}

