"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  removeGroupPlanPlaceAction,
  updateGroupPlanDetailsAction,
  updateGroupPlanPlaceTimeAction,
  voteGroupPlanAction,
  type RemoveGroupPlanPlaceActionState,
  type UpdateGroupPlanDetailsActionState,
  type UpdateGroupPlanPlaceTimeActionState,
  type VoteGroupPlanActionState
} from "@/app/groups/[groupId]/actions";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { BottomDockNav } from "@/components/navigation/BottomDockNav";
import { Input } from "@/components/ui/Input";
import type { GroupPlanItem, GroupPlanPlaceItem } from "@/lib/groupPlans";
import type { GroupPlanVote } from "@/types/supabase";

type GroupPlanDetailViewProps = {
  groupId: string;
  groupName: string;
  mapboxToken?: string;
  plan: GroupPlanItem;
};

type MarkerPoint = {
  place: GroupPlanPlaceItem;
  x: number;
  y: number;
};

const updateDetailsInitialState: UpdateGroupPlanDetailsActionState = { error: null, requestId: null, success: false };
const updateTimeInitialState: UpdateGroupPlanPlaceTimeActionState = { error: null, planPlaceId: null, requestId: null, success: false };
const removePlaceInitialState: RemoveGroupPlanPlaceActionState = { error: null, planPlaceId: null, requestId: null, success: false };
const voteInitialState: VoteGroupPlanActionState = { error: null, success: false };
const PLAN_TIME_ZONE = "Europe/Madrid";

function extractPlanDatePart(date: string | null): string | null {
  if (!date) return null;
  const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

function formatPlanDate(date: string | null): string {
  const datePart = extractPlanDatePart(date);
  if (!datePart) return "Fecha por confirmar";

  const parsed = new Date(`${datePart}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "long"
  }).format(parsed);
}

function formatPlanTime(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PLAN_TIME_ZONE
  }).format(parsed);
}

function toDateInputValue(date: string | null): string {
  return extractPlanDatePart(date) ?? "";
}

function toTimeInputValue(date: string | null): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: PLAN_TIME_ZONE
  }).format(parsed);
}

function getTimeZoneOffsetMinutes(timestamp: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(new Date(timestamp));
  const getPart = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const zonedTimestamp = Date.UTC(getPart("year"), getPart("month") - 1, getPart("day"), getPart("hour"), getPart("minute"), getPart("second"));
  return (zonedTimestamp - timestamp) / 60_000;
}

function buildPlannedAt(date: string, time: string): string {
  if (!date || !time) return "";
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return "";

  const localTimestamp = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = getTimeZoneOffsetMinutes(localTimestamp, PLAN_TIME_ZONE);
  const utcTimestamp = localTimestamp - firstOffset * 60_000;
  const finalOffset = getTimeZoneOffsetMinutes(utcTimestamp, PLAN_TIME_ZONE);
  return new Date(localTimestamp - finalOffset * 60_000).toISOString();
}

function getSortableTime(place: GroupPlanPlaceItem): number {
  if (!place.plannedAt) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(place.plannedAt);
  if (Number.isNaN(parsed.getTime())) return Number.MAX_SAFE_INTEGER;
  return parsed.getHours() * 60 + parsed.getMinutes();
}

function sortPlanPlaces(places: GroupPlanPlaceItem[]): GroupPlanPlaceItem[] {
  return [...places].sort((a, b) => {
    const aTime = getSortableTime(a);
    const bTime = getSortableTime(b);
    if (aTime !== bTime) return aTime - bTime;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function getInitials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function buildMapboxStaticUrl(places: GroupPlanPlaceItem[], token?: string): string | null {
  if (!token) return null;

  const locatedPlaces = places.filter((place) => typeof place.longitude === "number" && typeof place.latitude === "number");
  if (!locatedPlaces.length) return null;

  const centerLongitude = locatedPlaces.reduce((sum, place) => sum + (place.longitude ?? 0), 0) / locatedPlaces.length;
  const centerLatitude = locatedPlaces.reduce((sum, place) => sum + (place.latitude ?? 0), 0) / locatedPlaces.length;
  const encodedToken = encodeURIComponent(token);

  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${centerLongitude},${centerLatitude},12.8,0,0/900x620@2x?access_token=${encodedToken}`;
}

function getMarkerPoints(places: GroupPlanPlaceItem[]): MarkerPoint[] {
  const locatedPlaces = places.filter((place) => typeof place.longitude === "number" && typeof place.latitude === "number");
  if (!locatedPlaces.length) return [];

  const longitudes = locatedPlaces.map((place) => place.longitude ?? 0);
  const latitudes = locatedPlaces.map((place) => place.latitude ?? 0);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const longitudeRange = Math.max(maxLongitude - minLongitude, 0.001);
  const latitudeRange = Math.max(maxLatitude - minLatitude, 0.001);

  return locatedPlaces.map((place) => ({
    place,
    x: 18 + (((place.longitude ?? 0) - minLongitude) / longitudeRange) * 64,
    y: 18 + ((maxLatitude - (place.latitude ?? 0)) / latitudeRange) * 64
  }));
}

function BackIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21H3v-4z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 11a3 3 0 1 0 0-6" />
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5M14.5 14.5c2.6.4 4.2 1.9 4.9 4.5" />
    </svg>
  );
}

export function GroupPlanDetailView({ groupId, groupName, mapboxToken, plan }: GroupPlanDetailViewProps) {
  const router = useRouter();
  const [localPlan, setLocalPlan] = useState(plan);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(plan.title);
  const [editedDate, setEditedDate] = useState(toDateInputValue(plan.plannedDate));
  const [editedTimes, setEditedTimes] = useState<Record<string, string>>(() =>
    Object.fromEntries(plan.places.map((place) => [place.id, toTimeInputValue(place.plannedAt)]))
  );
  const [pendingDetailsRequestId, setPendingDetailsRequestId] = useState<string | null>(null);
  const [pendingTimeRequestIds, setPendingTimeRequestIds] = useState<Record<string, string>>({});
  const [pendingRemovedPlaceIds, setPendingRemovedPlaceIds] = useState<Record<string, true>>({});
  const [pendingVote, setPendingVote] = useState<GroupPlanVote | null>(null);
  const [detailsState, updateDetailsAction, isSavingDetails] = useActionState(updateGroupPlanDetailsAction, updateDetailsInitialState);
  const [timeState, updateTimeAction, isSavingTime] = useActionState(updateGroupPlanPlaceTimeAction, updateTimeInitialState);
  const [removeState, removePlaceAction, isRemovingPlace] = useActionState(removeGroupPlanPlaceAction, removePlaceInitialState);
  const [voteState, voteAction, isVoting] = useActionState(voteGroupPlanAction, voteInitialState);
  const sortedPlaces = useMemo(() => sortPlanPlaces(localPlan.places), [localPlan.places]);
  const mapUrl = buildMapboxStaticUrl(sortedPlaces, mapboxToken);
  const markerPoints = getMarkerPoints(sortedPlaces);
  const backHref = `/groups/${groupId}?tab=planes`;
  const canEditPlan = localPlan.isCreator;

  useEffect(() => {
    setLocalPlan(plan);
    setEditedTitle(plan.title);
    setEditedDate(toDateInputValue(plan.plannedDate));
    setEditedTimes(Object.fromEntries(plan.places.map((place) => [place.id, toTimeInputValue(place.plannedAt)])));
  }, [plan]);

  useEffect(() => {
    if (!detailsState.success || !pendingDetailsRequestId || detailsState.requestId !== pendingDetailsRequestId) {
      return;
    }

    setPendingDetailsRequestId(null);
    if (Object.keys(pendingTimeRequestIds).length > 0) {
      return;
    }
    router.refresh();
  }, [detailsState.requestId, detailsState.success, pendingDetailsRequestId, pendingTimeRequestIds, router]);

  useEffect(() => {
    if (!timeState.success || !timeState.planPlaceId || !timeState.requestId) {
      return;
    }

    setPendingTimeRequestIds((current) => {
      if (current[timeState.planPlaceId ?? ""] !== timeState.requestId) {
        return current;
      }
      const next = { ...current };
      delete next[timeState.planPlaceId ?? ""];
      return next;
    });
    router.refresh();
  }, [router, timeState.planPlaceId, timeState.requestId, timeState.success]);

  useEffect(() => {
    if (!removeState.success || !removeState.planPlaceId) {
      return;
    }

    setPendingRemovedPlaceIds((current) => {
      const next = { ...current };
      delete next[removeState.planPlaceId ?? ""];
      return next;
    });
    router.refresh();
  }, [removeState.planPlaceId, removeState.success, router]);

  useEffect(() => {
    if (!voteState.success) {
      return;
    }

    setPendingVote(null);
    router.refresh();
  }, [router, voteState.success]);

  function saveChanges() {
    const detailsRequestId = crypto.randomUUID();
    const detailsPayload = new FormData();
    detailsPayload.set("groupId", groupId);
    detailsPayload.set("planId", localPlan.id);
    detailsPayload.set("title", editedTitle);
    detailsPayload.set("plannedDate", editedDate);
    detailsPayload.set("requestId", detailsRequestId);

    const normalizedDate = editedDate ? `${editedDate}T00:00:00.000Z` : null;
    setLocalPlan((current) => ({
      ...current,
      title: editedTitle.trim() || current.title,
      plannedDate: normalizedDate
    }));
    setPendingDetailsRequestId(detailsRequestId);
    startTransition(() => updateDetailsAction(detailsPayload));

    sortedPlaces.forEach((place) => {
      const previousTime = toTimeInputValue(place.plannedAt);
      const nextTime = editedTimes[place.id] ?? "";
      if (previousTime === nextTime) {
        return;
      }

      const plannedAt = buildPlannedAt(editedDate, nextTime);
      const requestId = crypto.randomUUID();
      const payload = new FormData();
      payload.set("groupId", groupId);
      payload.set("planId", localPlan.id);
      payload.set("planPlaceId", place.id);
      payload.set("plannedAt", plannedAt);
      payload.set("requestId", requestId);

      setLocalPlan((current) => ({
        ...current,
        places: current.places.map((candidate) => (candidate.id === place.id ? { ...candidate, plannedAt: plannedAt || null } : candidate))
      }));
      setPendingTimeRequestIds((current) => ({ ...current, [place.id]: requestId }));
      startTransition(() => updateTimeAction(payload));
    });

    setIsEditing(false);
  }

  function removePlace(place: GroupPlanPlaceItem) {
    const confirmed = window.confirm(`Quitar "${place.name}" del plan?`);
    if (!confirmed) return;

    const requestId = crypto.randomUUID();
    const payload = new FormData();
    payload.set("groupId", groupId);
    payload.set("planId", localPlan.id);
    payload.set("planPlaceId", place.id);
    payload.set("requestId", requestId);

    setLocalPlan((current) => ({ ...current, places: current.places.filter((candidate) => candidate.id !== place.id) }));
    setPendingRemovedPlaceIds((current) => ({ ...current, [place.id]: true }));
    startTransition(() => removePlaceAction(payload));
  }

  function applyLocalVote(nextVote: GroupPlanVote) {
    setLocalPlan((current) => {
      const previousVote = current.currentUserVote;
      return {
        ...current,
        attendingCount: current.attendingCount + (nextVote === "attending" ? 1 : 0) - (previousVote === "attending" ? 1 : 0),
        maybeCount: current.maybeCount + (nextVote === "maybe" ? 1 : 0) - (previousVote === "maybe" ? 1 : 0),
        notAttendingCount: current.notAttendingCount + (nextVote === "not_attending" ? 1 : 0) - (previousVote === "not_attending" ? 1 : 0),
        currentUserVote: nextVote
      };
    });
  }

  function submitVote(nextVote: GroupPlanVote) {
    const payload = new FormData();
    payload.set("groupId", groupId);
    payload.set("planId", localPlan.id);
    payload.set("vote", nextVote);
    setPendingVote(nextVote);
    applyLocalVote(nextVote);
    startTransition(() => voteAction(payload));
  }

  return (
    <div className="min-h-screen bg-[#fff8f7] pb-44 text-[#261817]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/50 bg-[#fff8f7]/85 px-5 py-2 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link aria-label="Volver a planes" className="grid h-10 w-10 place-items-center rounded-full text-[#c6283a] transition hover:bg-rose-50" href={backHref}>
              <BackIcon />
            </Link>
            <MaplanMinimalIcon size="sm" />
            <span className="text-xl font-bold text-[#c6283a]">MaPlan</span>
          </div>
          <div className="flex items-center gap-1 text-[#c6283a]">
            {canEditPlan ? (
              <button
                aria-label={isEditing ? "Cancelar edicion" : "Editar plan"}
                className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-rose-50"
                onClick={() => setIsEditing((current) => !current)}
                type="button"
              >
                <EditIcon />
              </button>
            ) : null}
            <button aria-label="Compartir plan" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-rose-50" type="button">
              <ShareIcon />
            </button>
            <button aria-label="Notificaciones" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-rose-50" type="button">
              <BellIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl pt-16">
        <section className="relative h-[42vh] min-h-[310px] overflow-hidden bg-[#86a99b]">
          {mapUrl ? (
            <img alt={`Mapa de ${localPlan.title}`} className="h-full w-full object-cover opacity-90" src={mapUrl} />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#88a99d_0%,#e7eee7_52%,#fff0ef_100%)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(38,24,23,0.08)_0%,rgba(255,248,247,0)_48%,#fff8f7_100%)]" />
          {markerPoints.map((point, index) => (
            <div
              className="absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_12px_28px_rgba(38,24,23,0.22)]"
              key={point.place.id}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold text-white ${index === 0 ? "bg-[#c6283a]" : "bg-emerald-700"}`}>
                {index + 1}
              </span>
            </div>
          ))}
        </section>

        <section className="relative z-10 -mt-12 px-5">
          <div className="rounded-[32px] bg-white p-6 shadow-[0_18px_48px_rgba(181,35,48,0.12)]">
            <div className="text-xs font-extrabold uppercase text-[#c6283a]">{groupName}</div>
            {isEditing ? (
              <div className="mt-3 space-y-3">
                <Input
                  className="bg-[#fff4f3] font-bold"
                  label="Nombre del plan"
                  onChange={(event) => setEditedTitle(event.target.value)}
                  value={editedTitle}
                />
                <Input
                  className="bg-[#fff4f3] font-bold"
                  label="Fecha"
                  onChange={(event) => setEditedDate(event.target.value)}
                  type="date"
                  value={editedDate}
                />
              </div>
            ) : (
              <>
                <h1 className="mt-2 text-2xl font-extrabold leading-8 text-zinc-950">{localPlan.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-600">
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon />
                    {formatPlanDate(localPlan.plannedDate)}
                  </span>
                  <span className="text-rose-200">-</span>
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon />
                    {localPlan.attendingCount} confirmados
                  </span>
                </div>
              </>
            )}
            {detailsState.error ? <p className="mt-3 text-sm font-semibold text-rose-600">{detailsState.error}</p> : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="inline-flex h-12 items-center justify-center rounded-full bg-[#c6283a] text-sm font-bold text-white shadow-[0_12px_24px_rgba(181,35,48,0.22)]" type="button">
                Chat
              </button>
              <button className="inline-flex h-12 items-center justify-center rounded-full bg-[#fde2e0] text-sm font-bold text-[#261817]" type="button">
                Calendario
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 px-5">
          <h2 className="px-1 text-2xl font-extrabold text-zinc-950">Itinerario</h2>
          {timeState.error ? <p className="mt-2 px-1 text-sm font-semibold text-rose-600">{timeState.error}</p> : null}
          {removeState.error ? <p className="mt-2 px-1 text-sm font-semibold text-rose-600">{removeState.error}</p> : null}
          <div className="relative mt-5 space-y-6">
            <div className="absolute bottom-8 left-5 top-5 w-px bg-rose-200" />
            {sortedPlaces.length ? (
              sortedPlaces.map((place, index) => {
                const time = formatPlanTime(place.plannedAt);
                const isPendingTime = Boolean(pendingTimeRequestIds[place.id]);
                const isPendingRemove = Boolean(pendingRemovedPlaceIds[place.id]);
                return (
                  <article className="relative flex gap-4" key={place.id}>
                    <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#c6283a] text-white ring-4 ring-white shadow-[0_10px_22px_rgba(181,35,48,0.22)]">
                      {index + 1}
                    </div>
                    <div className="relative min-w-0 flex-1 overflow-hidden rounded-[26px] border border-rose-100 bg-white shadow-[0_14px_36px_rgba(181,35,48,0.10)]">
                      {isEditing ? (
                        <button
                          aria-label={`Quitar ${place.name} del plan`}
                          className="absolute right-3 top-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-[#c6283a] text-white shadow-[0_12px_24px_rgba(181,35,48,0.28)] transition hover:bg-[#b32033] disabled:opacity-60"
                          disabled={isPendingRemove || isRemovingPlace}
                          onClick={() => removePlace(place)}
                          type="button"
                        >
                          {isPendingRemove ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/45 border-t-white" />
                          ) : (
                            <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          )}
                        </button>
                      ) : null}
                      <div className="h-36 bg-rose-100">
                        {place.imageUrl ? (
                          <img alt={place.name} className="h-full w-full object-cover" src={place.imageUrl} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#fde2e0] text-3xl font-extrabold text-[#c6283a]">
                            {getInitials(place.name)}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-extrabold leading-6 text-zinc-950">{place.name}</h3>
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                              {place.address}
                              {place.city ? `, ${place.city}` : ""}
                            </p>
                          </div>
                          {time ? (
                            <span className="shrink-0 rounded-full bg-[#ff5a5f] px-3 py-1 text-xs font-bold text-white">
                              {time}
                            </span>
                          ) : null}
                        </div>
                        {isEditing ? (
                          <div className="mt-4 grid gap-3">
                            <Input
                              className="bg-[#fff4f3]"
                              disabled={!editedDate || isPendingTime}
                              label="Hora"
                              onChange={(event) => setEditedTimes((current) => ({ ...current, [place.id]: event.target.value }))}
                              type="time"
                              value={editedTimes[place.id] ?? ""}
                            />
                            {!editedDate ? (
                              <p className="text-xs font-semibold text-rose-600">Define una fecha para poder guardar horas.</p>
                            ) : null}
                          </div>
                        ) : null}
                        {place.note ? <p className="mt-3 rounded-2xl bg-[#fff4f3] px-3 py-2 text-sm text-zinc-600">{place.note}</p> : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[26px] border border-dashed border-rose-200 bg-white p-5 text-sm font-semibold text-zinc-500">
                Este plan todavia no tiene paradas guardadas.
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 px-5">
          <div className="rounded-[32px] bg-[#fff0ef] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-zinc-950">Asistentes</h2>
              <span className="text-xs font-bold text-[#c6283a]">Ver todos</span>
            </div>
            {voteState.error ? <p className="mt-3 text-sm font-semibold text-rose-600">{voteState.error}</p> : null}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Ire", value: "attending", active: "bg-emerald-100 text-emerald-700", idle: "bg-white/80 text-zinc-600" },
                { label: "Quizas", value: "maybe", active: "bg-sky-100 text-sky-700", idle: "bg-white/80 text-zinc-600" },
                { label: "No", value: "not_attending", active: "bg-rose-100 text-rose-600", idle: "bg-white/80 text-zinc-600" }
              ].map((option) => {
                const isActive = localPlan.currentUserVote === option.value;
                const isPending = pendingVote === option.value && isVoting;
                return (
                  <button
                    className={`h-12 rounded-[18px] text-sm font-extrabold transition ${isActive ? option.active : option.idle}`}
                    disabled={isVoting}
                    key={option.value}
                    onClick={() => submitVote(option.value as GroupPlanVote)}
                    type="button"
                  >
                    {isPending ? "Guardando..." : option.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-3">
                {Array.from({ length: Math.max(1, Math.min(localPlan.attendingCount, 3)) }).map((_, index) => (
                  <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-zinc-900 text-xs font-bold text-white" key={index}>
                    {index + 1}
                  </div>
                ))}
                {localPlan.attendingCount > 3 ? (
                  <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-[#ffdad8] text-xs font-bold text-[#c6283a]">
                    +{localPlan.attendingCount - 3}
                  </div>
                ) : null}
              </div>
              <span className="text-sm font-semibold text-zinc-600">
                {localPlan.attendingCount} confirmados · {localPlan.maybeCount} quizas · {localPlan.notAttendingCount} no
              </span>
            </div>
          </div>
        </section>
      </main>

      {canEditPlan ? (
        <button
          className="fixed inset-x-8 bottom-24 z-40 mx-auto flex h-14 max-w-xs items-center justify-center rounded-full bg-[#c6283a] text-sm font-extrabold text-white shadow-[0_18px_36px_rgba(181,35,48,0.28)] disabled:opacity-60"
          disabled={isSavingDetails || isSavingTime || !editedTitle.trim()}
          onClick={() => {
            if (isEditing) {
              saveChanges();
              return;
            }
            setIsEditing(true);
          }}
          type="button"
        >
          {isEditing ? (isSavingDetails || isSavingTime ? "Guardando..." : "Guardar cambios") : "Editar plan"}
        </button>
      ) : null}
      <BottomDockNav />
    </div>
  );
}
