"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  addPlaceToGroupPlanAction,
  createGroupPlanAction,
  deleteGroupPlanAction,
  removeGroupPlanPlaceAction,
  updateGroupPlanDateAction,
  updateGroupPlanDetailsAction,
  voteGroupPlanAction,
  type AddPlaceToGroupPlanActionState,
  type CreateGroupPlanActionState,
  type DeleteGroupPlanActionState,
  type RemoveGroupPlanPlaceActionState,
  type UpdateGroupPlanDateActionState,
  type UpdateGroupPlanDetailsActionState,
  type VoteGroupPlanActionState
} from "@/app/groups/[groupId]/actions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import type { GroupPlanItem, GroupPlanPlaceItem } from "@/lib/groupPlans";
import {
  canPlanAcceptNewPlaces,
  formatPlanDateSpanish,
  getPlanTimeMinutes,
  getTodayPlanDatePart,
  isPlanDateOnOrAfter,
  normalizePlanDateInput
} from "@/lib/groupPlansShared";
import type { GroupPlace } from "@/lib/places/shared";

type GroupPlansTabProps = {
  groupId: string;
  groupName: string;
  initialMode?: string | null;
  initialSelectedPlanId?: string | null;
  plans: GroupPlanItem[];
  places: GroupPlace[];
  canCreatePlans: boolean;
  onNavigateToPlaces: () => void;
};

const createInitialState: CreateGroupPlanActionState = { error: null, planId: null, requestId: null, success: false };
const addPlaceInitialState: AddPlaceToGroupPlanActionState = { error: null, requestId: null, success: false };
const voteInitialState: VoteGroupPlanActionState = { error: null, success: false };
const deleteInitialState: DeleteGroupPlanActionState = { error: null, success: false };
const removePlaceInitialState: RemoveGroupPlanPlaceActionState = { error: null, success: false };
const updatePlanDateInitialState: UpdateGroupPlanDateActionState = { error: null, requestId: null, success: false };
const updatePlanDetailsInitialState: UpdateGroupPlanDetailsActionState = { error: null, requestId: null, success: false };

function extractPlanDatePart(date: string | null): string | null {
  if (!date) {
    return null;
  }

  const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPlanCalendarDate(date: string | null): Date | null {
  const datePart = extractPlanDatePart(date);
  if (!datePart) {
    return null;
  }

  return new Date(`${datePart}T00:00:00.000Z`);
}

function formatPlanDate(date: string | null): string {
  const formattedDate = formatPlanDateSpanish(date);
  if (!formattedDate) {
    return date ? "Fecha por confirmar" : "Sin fecha cerrada";
  }

  return formattedDate;
}

function formatPlanTime(date: string | null): string | null {
  if (!date) {
    return null;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const minutes = getPlanTimeMinutes(date);
  if (minutes === null) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid"
  }).format(parsed);
}

function shortDate(date: string | null): string {
  return formatPlanDateSpanish(date) ?? "Sin fecha";
}

function getPlanTimestamp(date: string | null): number | null {
  return getPlanCalendarDate(date)?.getTime() ?? null;
}

function formatDayMonth(date: string | null): string {
  const datePart = extractPlanDatePart(date);
  if (!datePart) {
    return "--";
  }

  return datePart.split("-")[2] ?? "--";
}

function formatYearShort(date: string | null): string {
  const datePart = extractPlanDatePart(date);
  if (!datePart) {
    return "TBD";
  }

  const [, month] = datePart.split("-");
  const monthIndex = Number(month) - 1;
  if (Number.isNaN(monthIndex)) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(2026, monthIndex, 1)))
    .replace(".", "")
    .toUpperCase();
}

function toDateTimeLocalValue(date: string | null): string {
  return extractPlanDatePart(date) ?? "";
}

function isOptionalPlanDateAllowed(value: string, minDatePart: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || isPlanDateOnOrAfter(trimmed, minDatePart);
}

function toPlanPlaceItem(place: GroupPlace, position = 0): GroupPlanPlaceItem {
  return {
    id: `optimistic-${place.id}`,
    placeId: place.id,
    name: place.name,
    address: place.address,
    city: place.city,
    imageUrl: place.imageUrl ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
    googleMapsUrl: place.googleMapsUrl,
    phoneNumber: place.phoneNumber,
    rating: place.rating,
    userRatingsTotal: place.userRatingsTotal,
    plannedAt: null,
    position,
    note: null,
    createdAt: new Date().toISOString()
  };
}

function planLocationLabel(plan: GroupPlanItem): string {
  const firstPlace = plan.places[0];
  if (!firstPlace) {
    return plan.description || "Lugar por confirmar";
  }

  const locationBits = [firstPlace.address, firstPlace.city].filter(Boolean);
  return locationBits.join(", ") || firstPlace.name;
}

function planAttendanceLabel(plan: GroupPlanItem): string {
  if (plan.attendingCount > 0) {
    return `${plan.attendingCount} confirmados`;
  }

  if (plan.notAttendingCount > 0) {
    return `${plan.notAttendingCount} no van`;
  }

  return "Sin respuestas";
}

function voteSummary(plan: GroupPlanItem): string {
  if (plan.attendingCount > 0) {
    return `${plan.attendingCount} confirmados`;
  }

  if (plan.maybeCount > 0) {
    return `${plan.maybeCount} quizas`;
  }

  if (plan.notAttendingCount > 0) {
    return `${plan.notAttendingCount} no van`;
  }

  return "Aun sin votos";
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21H3v-4z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CalendarSmallIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}

function RestaurantIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M8 3v8" />
      <path d="M4 3v5a4 4 0 0 0 4 4" />
      <path d="M8 12v9" />
      <path d="M16 3v18" />
      <path d="M16 8c2.2 0 4-1.8 4-4v7" />
    </svg>
  );
}

export function GroupPlansTab({
  groupId,
  initialMode = null,
  initialSelectedPlanId = null,
  plans,
  places,
  canCreatePlans,
  onNavigateToPlaces
}: GroupPlansTabProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past" | "draft">("all");
  const [displayPlans, setDisplayPlans] = useState<GroupPlanItem[]>(plans);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialSelectedPlanId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [draftRoutePlaceIds, setDraftRoutePlaceIds] = useState<string[]>([]);
  const [dismissedDraftRecommendationIds, setDismissedDraftRecommendationIds] = useState<Record<string, true>>({});
  const [minPlanDate] = useState(() => getTodayPlanDatePart());
  const [menuPlanId, setMenuPlanId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<GroupPlanItem | null>(null);
  const [planToEditDate, setPlanToEditDate] = useState<GroupPlanItem | null>(null);
  const [editedPlannedDate, setEditedPlannedDate] = useState("");
  const [planToEditDetails, setPlanToEditDetails] = useState<GroupPlanItem | null>(null);
  const [editedPlanTitle, setEditedPlanTitle] = useState("");
  const [editedPlanDetailsDate, setEditedPlanDetailsDate] = useState("");
  const [pendingPlanDateUpdate, setPendingPlanDateUpdate] = useState<{
    planId: string;
    plannedDate: string;
    requestId: string;
  } | null>(null);
  const [pendingPlanDetailsUpdate, setPendingPlanDetailsUpdate] = useState<{
    planId: string;
    plannedDate: string;
    requestId: string;
    title: string;
  } | null>(null);
  const [pendingCreatePlan, setPendingCreatePlan] = useState<{
    description: string | null;
    plannedDate: string | null;
    requestId: string;
    selectedPlaces: GroupPlace[];
    title: string;
  } | null>(null);
  const [pendingRecommendedPlace, setPendingRecommendedPlace] = useState<{
    place: GroupPlace;
    planId: string;
    requestId: string;
  } | null>(null);
  const [dismissedRecommendationIds, setDismissedRecommendationIds] = useState<Record<string, true>>({});
  const [didApplyInitialEditMode, setDidApplyInitialEditMode] = useState(false);
  const [planPlaceToDeleteId, setPlanPlaceToDeleteId] = useState<string | null>(null);
  const [createState, createAction, isCreating] = useActionState(createGroupPlanAction, createInitialState);
  const [addPlaceState, addPlaceAction, isAddingRecommendedPlace] = useActionState(addPlaceToGroupPlanAction, addPlaceInitialState);
  const [voteState, voteAction, isVoting] = useActionState(voteGroupPlanAction, voteInitialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteGroupPlanAction, deleteInitialState);
  const [removePlaceState, removePlaceAction, isRemovingPlace] = useActionState(removeGroupPlanPlaceAction, removePlaceInitialState);
  const [updatePlanDateState, updatePlanDateActionForm, isUpdatingPlanDate] = useActionState(
    updateGroupPlanDateAction,
    updatePlanDateInitialState
  );
  const [updatePlanDetailsState, updatePlanDetailsActionForm, isUpdatingPlanDetails] = useActionState(
    updateGroupPlanDetailsAction,
    updatePlanDetailsInitialState
  );

  useEffect(() => {
    setDisplayPlans(plans);
  }, [plans]);

  const sortedPlans = useMemo(
    () =>
      [...displayPlans].sort((a, b) => {
        const aTime = a.plannedDate ? new Date(a.plannedDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.plannedDate ? new Date(b.plannedDate).getTime() : Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) {
          return aTime - bTime;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [displayPlans]
  );

  const selectedPlan = useMemo(
    () => sortedPlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [selectedPlanId, sortedPlans]
  );
  const recommendedPlaces = useMemo(() => {
    if (!selectedPlan) {
      return [];
    }

    const placeIdsInPlan = new Set(selectedPlan.places.map((place) => place.placeId));
    return places
      .filter((place) => !placeIdsInPlan.has(place.id) && !dismissedRecommendationIds[`${selectedPlan.id}:${place.id}`])
      .slice(0, 6);
  }, [dismissedRecommendationIds, places, selectedPlan]);
  const draftRoutePlaces = useMemo(
    () => draftRoutePlaceIds.map((placeId) => places.find((place) => place.id === placeId)).filter((place): place is GroupPlace => Boolean(place)),
    [draftRoutePlaceIds, places]
  );
  const draftRecommendedPlaces = useMemo(
    () =>
      places
        .filter((place) => !draftRoutePlaceIds.includes(place.id) && !dismissedDraftRecommendationIds[place.id])
        .slice(0, 6),
    [dismissedDraftRecommendationIds, draftRoutePlaceIds, places]
  );
  const categorizedPlans = useMemo(() => {
    const upcoming = sortedPlans.filter((plan) => {
      const datePart = extractPlanDatePart(plan.plannedDate);
      return datePart !== null && datePart >= minPlanDate;
    });
    const past = sortedPlans.filter((plan) => {
      const datePart = extractPlanDatePart(plan.plannedDate);
      return datePart !== null && datePart < minPlanDate;
    });
    const drafts = sortedPlans.filter((plan) => getPlanTimestamp(plan.plannedDate) === null);

    const filtered = sortedPlans.filter((plan) => {
      if (activeFilter === "upcoming") {
        return upcoming.some((candidate) => candidate.id === plan.id);
      }
      if (activeFilter === "past") {
        return past.some((candidate) => candidate.id === plan.id);
      }
      if (activeFilter === "draft") {
        return drafts.some((candidate) => candidate.id === plan.id);
      }
      return true;
    });

    return {
      upcoming: upcoming.filter((plan) => filtered.some((candidate) => candidate.id === plan.id)),
      past: past.filter((plan) => filtered.some((candidate) => candidate.id === plan.id)),
      drafts: drafts.filter((plan) => filtered.some((candidate) => candidate.id === plan.id)),
      filtered
    };
  }, [activeFilter, minPlanDate, sortedPlans]);

  useEffect(() => {
    if (!createState.success || !pendingCreatePlan || createState.requestId !== pendingCreatePlan.requestId || !createState.planId) {
      return;
    }

    const createdPlan: GroupPlanItem = {
      id: createState.planId,
      groupId,
      createdBy: "",
      title: pendingCreatePlan.title,
      description: pendingCreatePlan.description,
      plannedDate: pendingCreatePlan.plannedDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      places: pendingCreatePlan.selectedPlaces.map((place, index) => toPlanPlaceItem(place, index)),
      votes: [],
      attendingCount: 0,
      maybeCount: 0,
      notAttendingCount: 0,
      currentUserVote: null,
      acceptsNewPlaces: canPlanAcceptNewPlaces(pendingCreatePlan.plannedDate),
      isCreator: true
    };
    setDisplayPlans((current) => [createdPlan, ...current.filter((plan) => plan.id !== createdPlan.id)]);
    setTitle("");
    setDescription("");
    setPlannedDate("");
    setDraftRoutePlaceIds([]);
    setDismissedDraftRecommendationIds({});
    setIsCreateOpen(false);
    setPendingCreatePlan(null);
    setDismissedRecommendationIds({});
    router.push(`/groups/${groupId}/plans/${createState.planId}`);
  }, [createState.planId, createState.requestId, createState.success, groupId, pendingCreatePlan, router]);

  useEffect(() => {
    if (
      !addPlaceState.success ||
      !pendingRecommendedPlace ||
      addPlaceState.requestId !== pendingRecommendedPlace.requestId
    ) {
      return;
    }

    setDisplayPlans((current) =>
      current.map((plan) =>
        plan.id === pendingRecommendedPlace.planId
          ? {
              ...plan,
              places: plan.places.some((place) => place.placeId === pendingRecommendedPlace.place.id)
                ? plan.places
                : [...plan.places, toPlanPlaceItem(pendingRecommendedPlace.place, plan.places.length)]
            }
          : plan
      )
    );
    setDismissedRecommendationIds((current) => ({
      ...current,
      [`${pendingRecommendedPlace.planId}:${pendingRecommendedPlace.place.id}`]: true
    }));
    setPendingRecommendedPlace(null);
    router.refresh();
  }, [addPlaceState.requestId, addPlaceState.success, pendingRecommendedPlace, router]);

  useEffect(() => {
    if (!deleteState.success) {
      return;
    }

    if (planToDelete) {
      setDisplayPlans((current) => current.filter((plan) => plan.id !== planToDelete.id));
    }
    setPlanToDelete(null);
    setMenuPlanId(null);
    if (selectedPlanId === planToDelete?.id) {
      setSelectedPlanId(null);
    }
  }, [deleteState.success, planToDelete?.id, selectedPlanId]);

  useEffect(() => {
    if (!removePlaceState.success) {
      return;
    }

    setPlanPlaceToDeleteId(null);
  }, [removePlaceState.success]);

  useEffect(() => {
    if (
      !updatePlanDateState.success ||
      !pendingPlanDateUpdate ||
      updatePlanDateState.requestId !== pendingPlanDateUpdate.requestId
    ) {
      return;
    }

    const normalizedDate = normalizePlanDateInput(pendingPlanDateUpdate.plannedDate);
    setDisplayPlans((current) =>
      current.map((plan) =>
        plan.id === pendingPlanDateUpdate.planId
          ? {
              ...plan,
              plannedDate: normalizedDate,
              acceptsNewPlaces: canPlanAcceptNewPlaces(normalizedDate)
            }
          : plan
      )
    );
    router.refresh();
    setPlanToEditDate(null);
    setEditedPlannedDate("");
    setMenuPlanId(null);
    setPendingPlanDateUpdate(null);
  }, [pendingPlanDateUpdate, router, updatePlanDateState.requestId, updatePlanDateState.success]);

  useEffect(() => {
    if (
      !updatePlanDetailsState.success ||
      !pendingPlanDetailsUpdate ||
      updatePlanDetailsState.requestId !== pendingPlanDetailsUpdate.requestId
    ) {
      return;
    }

    const normalizedDate = normalizePlanDateInput(pendingPlanDetailsUpdate.plannedDate);
    setDisplayPlans((current) =>
      current.map((plan) =>
        plan.id === pendingPlanDetailsUpdate.planId
          ? {
              ...plan,
              title: pendingPlanDetailsUpdate.title,
              plannedDate: normalizedDate,
              acceptsNewPlaces: canPlanAcceptNewPlaces(normalizedDate)
            }
          : plan
      )
    );
    router.refresh();
    setPlanToEditDetails(null);
    setEditedPlanTitle("");
    setEditedPlanDetailsDate("");
    setPendingPlanDetailsUpdate(null);
  }, [pendingPlanDetailsUpdate, router, updatePlanDetailsState.requestId, updatePlanDetailsState.success]);

  useEffect(() => {
    if (didApplyInitialEditMode || initialMode !== "edit" || !initialSelectedPlanId || !selectedPlan) {
      return;
    }

    openEditDetails(selectedPlan);
    setDidApplyInitialEditMode(true);
  }, [didApplyInitialEditMode, initialMode, initialSelectedPlanId, selectedPlan]);

  const planDetailError = addPlaceState.error ?? removePlaceState.error ?? deleteState.error ?? voteState.error;
  const isCreatePlanDateAllowed = isOptionalPlanDateAllowed(plannedDate, minPlanDate);
  const isEditedPlanDateAllowed = isOptionalPlanDateAllowed(editedPlannedDate, minPlanDate);
  const isEditedPlanDetailsDateAllowed = isOptionalPlanDateAllowed(editedPlanDetailsDate, minPlanDate);
  const isEditingSelectedPlan = Boolean(selectedPlan && planToEditDetails?.id === selectedPlan.id);

  function openEditDate(plan: GroupPlanItem) {
    setPlanToEditDate(plan);
    setEditedPlannedDate(toDateTimeLocalValue(plan.plannedDate));
    setMenuPlanId(null);
  }

  function openEditDetails(plan: GroupPlanItem) {
    setPlanToEditDetails(plan);
    setEditedPlanTitle(plan.title);
    setEditedPlanDetailsDate(toDateTimeLocalValue(plan.plannedDate));
    setMenuPlanId(null);
  }

  function openPlanPage(planId: string) {
    router.push(`/groups/${groupId}/plans/${planId}`);
  }

  function submitPlanDetailsUpdate(plan: GroupPlanItem) {
    const requestId = crypto.randomUUID();
    const trimmedTitle = editedPlanTitle.trim();
    const payload = new FormData();
    payload.set("groupId", groupId);
    payload.set("planId", plan.id);
    payload.set("title", trimmedTitle);
    payload.set("plannedDate", editedPlanDetailsDate);
    payload.set("requestId", requestId);
    setPendingPlanDetailsUpdate({
      planId: plan.id,
      plannedDate: editedPlanDetailsDate,
      requestId,
      title: trimmedTitle
    });
    startTransition(() => updatePlanDetailsActionForm(payload));
  }

  function submitCreatePlan() {
    const requestId = crypto.randomUUID();
    const normalizedDate = normalizePlanDateInput(plannedDate);
    const payload = new FormData();
    payload.set("groupId", groupId);
    payload.set("title", title);
    payload.set("description", description);
    payload.set("plannedDate", plannedDate);
    payload.set("requestId", requestId);
    draftRoutePlaceIds.forEach((placeId) => payload.append("initialPlaceIds", placeId));
    setPendingCreatePlan({
      description: description.trim() ? description.trim() : null,
      plannedDate: normalizedDate,
      requestId,
      selectedPlaces: draftRoutePlaces,
      title: title.trim()
    });
    startTransition(() => createAction(payload));
  }

  function addRecommendedPlaceToPlan(plan: GroupPlanItem, place: GroupPlace) {
    const requestId = crypto.randomUUID();
    const payload = new FormData();
    payload.set("groupId", groupId);
    payload.set("planId", plan.id);
    payload.set("placeId", place.id);
    payload.set("plannedAt", "");
    payload.set("note", "");
    payload.set("requestId", requestId);
    setPendingRecommendedPlace({
      place,
      planId: plan.id,
      requestId
    });
    startTransition(() => addPlaceAction(payload));
  }

  function renderPlanMenu(plan: GroupPlanItem) {
    if (!plan.isCreator) {
      return null;
    }

    return (
      <div className="relative">
        <button
          aria-label="Opciones del plan"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-rose-50 hover:text-[#c6283a]"
          onClick={(event) => {
            event.stopPropagation();
            setMenuPlanId((current) => (current === plan.id ? null : plan.id));
          }}
          type="button"
        >
          <DotsIcon />
        </button>
        {menuPlanId === plan.id ? (
          <div className="absolute right-0 top-11 z-20 w-44 rounded-2xl border border-rose-100 bg-white p-2 shadow-[0_16px_40px_rgba(181,35,48,0.14)]">
            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-rose-50 hover:text-[#c6283a]"
              onClick={(event) => {
                event.stopPropagation();
                openEditDate(plan);
              }}
              type="button"
            >
              <CalendarSmallIcon />
              Cambiar fecha
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              onClick={(event) => {
                event.stopPropagation();
                setPlanToDelete(plan);
                setMenuPlanId(null);
              }}
              type="button"
            >
              <TrashIcon />
              Eliminar plan
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (isCreateOpen) {
    return (
      <div className="-mx-1.5 min-h-[720px] bg-[#fff8f7] px-5 py-4">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-white/80 hover:text-[#c6283a]"
              onClick={() => {
                setIsCreateOpen(false);
                setDraftRoutePlaceIds([]);
                setDismissedDraftRecommendationIds({});
              }}
              type="button"
            >
              <BackIcon />
            </button>
            <div className="h-9 w-9" aria-hidden="true" />
          </div>

          <div className="mt-7 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Nombre del Plan</span>
              <Input
                className="bg-[#fdeeee]"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ruta de tapas"
                value={title}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Fecha</span>
              <Input
                className="bg-[#fff1ef]"
                min={minPlanDate}
                onChange={(event) => setPlannedDate(event.target.value)}
                type="date"
                value={plannedDate}
              />
            </label>
            {!isCreatePlanDateAllowed ? (
              <p className="text-sm text-rose-600">La fecha del plan no puede ser anterior a hoy.</p>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Descripcion</span>
              <textarea
                className="min-h-[110px] w-full rounded-[22px] border border-transparent bg-[#fff4f3] px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Por ejemplo: tapas tranquilas y luego copa"
                value={description}
              />
            </label>
            {createState.error ? <p className="text-sm text-rose-600">{createState.error}</p> : null}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[28px] font-bold text-zinc-950">La Ruta</h4>
              <span className="text-xs font-semibold text-[#c6283a]">{draftRoutePlaces.length} Paradas</span>
            </div>

            <div className="relative mt-5 pl-7">
              <div className="absolute left-2 top-2 bottom-8 w-px bg-rose-200" />

              <div className="space-y-4">
                {draftRoutePlaces.map((place, index) => (
                  <div className="relative" key={place.id}>
                    <div
                      className={`absolute left-[-1.65rem] top-7 h-4 w-4 rounded-full border-2 ${
                        index === draftRoutePlaces.length - 1 ? "border-rose-300" : "border-[#c6283a]"
                      } bg-[#fff8f7]`}
                    />
                    <div className="flex items-center gap-3 rounded-[24px] bg-white p-3 shadow-[0_12px_30px_rgba(181,35,48,0.08)]">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-rose-100">
                        {place.imageUrl ? (
                          <img alt={place.name} className="h-full w-full object-cover" src={place.imageUrl} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#c6283a]">
                            {place.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-base font-bold leading-5 text-zinc-950">{place.name}</p>
                        <div className="mt-1 flex items-start gap-1.5 text-sm text-zinc-500">
                          <LocationIcon />
                          <span className="line-clamp-2">
                            {place.address}
                            {place.city ? `, ${place.city}` : ""}
                          </span>
                        </div>
                      </div>
                      <button
                        aria-label="Quitar parada"
                        className="rounded-full p-2 text-zinc-300 transition hover:text-rose-500"
                        onClick={() => setDraftRoutePlaceIds((current) => current.filter((placeId) => placeId !== place.id))}
                        type="button"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}

                {draftRecommendedPlaces.map((place) => (
                  <div className="relative" key={place.id}>
                    <div className="absolute left-[-1.65rem] top-7 h-4 w-4 rounded-full border-2 border-dashed border-rose-200 bg-[#fff8f7]" />
                    <div className="flex items-center gap-3 rounded-[24px] border border-dashed border-rose-200 bg-[#fff8f7] p-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-rose-100">
                        {place.imageUrl ? (
                          <img alt={place.name} className="h-full w-full object-cover" src={place.imageUrl} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#c6283a]">
                            {place.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-base font-bold leading-5 text-zinc-950">{place.name}</p>
                        <div className="mt-1 flex items-start gap-1.5 text-sm text-zinc-500">
                          <LocationIcon />
                          <span className="line-clamp-2">
                            {place.address}
                            {place.city ? `, ${place.city}` : ""}
                          </span>
                        </div>
                        <span className="mt-2 inline-flex rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-[#c6283a]">
                          Recomendado
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          aria-label="Anadir lugar recomendado"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                          onClick={() => setDraftRoutePlaceIds((current) => [...current, place.id])}
                          type="button"
                        >
                          <CheckIcon />
                        </button>
                        <button
                          aria-label="Descartar recomendacion"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-500 transition hover:bg-rose-50"
                          onClick={() => setDismissedDraftRecommendationIds((current) => ({ ...current, [place.id]: true }))}
                          type="button"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {!draftRoutePlaces.length && !draftRecommendedPlaces.length ? (
                  <div className="relative">
                    <div className="absolute left-[-1.65rem] top-6 h-4 w-4 rounded-full border-2 border-rose-200 bg-[#fff8f7]" />
                    <div className="rounded-[24px] border-2 border-dashed border-rose-200 px-4 py-5 text-sm font-semibold text-zinc-500">
                      Todavia no hay lugares del grupo para recomendar.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Button
              className="h-14 rounded-[22px] text-base"
              disabled={!title.trim() || !isCreatePlanDateAllowed || isCreating}
              fullWidth
              onClick={submitCreatePlan}
              type="button"
            >
              {isCreating ? "Creando..." : "Crear Plan"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <div className="-mx-1.5 min-h-[720px] bg-[#fff8f7] px-5 py-4">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-white/80 hover:text-[#c6283a]"
              onClick={() => setSelectedPlanId(null)}
              type="button"
            >
              <BackIcon />
            </button>
            {selectedPlan.isCreator ? (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-[#c6283a] shadow-[0_8px_18px_rgba(24,24,27,0.08)] transition hover:bg-rose-50"
                onClick={() => {
                  if (isEditingSelectedPlan) {
                    setPlanToEditDetails(null);
                    return;
                  }
                  openEditDetails(selectedPlan);
                }}
                type="button"
              >
                <PencilIcon />
                {isEditingSelectedPlan ? "Cancelar" : "Editar"}
              </button>
            ) : (
              <div className="h-9 w-9" aria-hidden="true" />
            )}
          </div>

          <div className="mt-7 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Nombre del Plan</span>
              {isEditingSelectedPlan ? (
                <Input
                  className="bg-[#fdeeee]"
                  onChange={(event) => setEditedPlanTitle(event.target.value)}
                  value={editedPlanTitle}
                />
              ) : (
                <div className="flex min-h-14 items-center gap-3 rounded-[22px] bg-[#fdeeee] px-4 py-3 text-zinc-900">
                  <PencilIcon />
                  <span className="text-[15px] font-semibold leading-5">{selectedPlan.title}</span>
                </div>
              )}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Fecha</span>
              {isEditingSelectedPlan ? (
                <Input
                  className="bg-[#fff1ef]"
                  min={minPlanDate}
                  onChange={(event) => setEditedPlanDetailsDate(event.target.value)}
                  type="date"
                  value={editedPlanDetailsDate}
                />
              ) : (
                <div className="flex min-h-14 items-center gap-3 rounded-[22px] bg-[#fff1ef] px-4 py-3 text-zinc-900">
                  <CalendarIcon />
                  <span className="text-[15px] font-semibold leading-5">{formatPlanDate(selectedPlan.plannedDate)}</span>
                </div>
              )}
            </label>
            {isEditingSelectedPlan && !isEditedPlanDetailsDateAllowed ? (
              <p className="text-sm text-rose-600">La fecha del plan no puede ser anterior a hoy.</p>
            ) : null}
            {isEditingSelectedPlan && updatePlanDetailsState.error ? (
              <p className="text-sm text-rose-600">{updatePlanDetailsState.error}</p>
            ) : null}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[28px] font-bold text-zinc-950">La Ruta</h4>
              <span className="text-xs font-semibold text-[#c6283a]">{selectedPlan.places.length} Paradas</span>
            </div>

            <div className="relative mt-5 pl-7">
              <div className="absolute left-2 top-2 bottom-8 w-px bg-rose-200" />

              <div className="space-y-4">
                {selectedPlan.places.map((place, index) => (
                  <div className="relative" key={place.id}>
                    <div
                      className={`absolute left-[-1.65rem] top-7 h-4 w-4 rounded-full border-2 ${
                        index === selectedPlan.places.length - 1 ? "border-rose-300" : "border-[#c6283a]"
                      } bg-[#fff8f7]`}
                    />
                    <div className="flex items-center gap-3 rounded-[24px] bg-white p-3 shadow-[0_12px_30px_rgba(181,35,48,0.08)]">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-rose-100">
                        {place.imageUrl ? (
                          <img alt={place.name} className="h-full w-full object-cover" src={place.imageUrl} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#c6283a]">
                            {place.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold leading-5 text-zinc-950 break-words">{place.name}</p>
                        <div className="mt-1 flex items-start gap-1.5 text-sm text-zinc-500">
                          <LocationIcon />
                          <span className="line-clamp-2">
                            {place.address}
                            {place.city ? `, ${place.city}` : ""}
                          </span>
                        </div>
                        {place.plannedAt ? (
                          <span className="mt-2 inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-[#ff5a5f]">
                            {formatPlanTime(place.plannedAt)} h
                          </span>
                        ) : null}
                      </div>
                      {selectedPlan.isCreator && !place.id.startsWith("optimistic-") ? (
                        <button
                          className="rounded-full p-2 text-zinc-300 transition hover:text-rose-500"
                          onClick={() => setPlanPlaceToDeleteId(place.id)}
                          type="button"
                        >
                          <TrashIcon />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                {selectedPlan.isCreator && selectedPlan.acceptsNewPlaces && recommendedPlaces.length ? (
                  <>
                    {recommendedPlaces.map((place) => {
                      const isPendingThisPlace =
                        isAddingRecommendedPlace &&
                        pendingRecommendedPlace?.planId === selectedPlan.id &&
                        pendingRecommendedPlace.place.id === place.id;

                      return (
                        <div className="relative" key={place.id}>
                          <div className="absolute left-[-1.65rem] top-7 h-4 w-4 rounded-full border-2 border-dashed border-rose-200 bg-[#fff8f7]" />
                          <div className="flex items-center gap-3 rounded-[24px] border border-dashed border-rose-200 bg-[#fff8f7] p-3">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-rose-100">
                              {place.imageUrl ? (
                                <img alt={place.name} className="h-full w-full object-cover" src={place.imageUrl} />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#c6283a]">
                                  {place.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="break-words text-base font-bold leading-5 text-zinc-950">{place.name}</p>
                              <div className="mt-1 flex items-start gap-1.5 text-sm text-zinc-500">
                                <LocationIcon />
                                <span className="line-clamp-2">
                                  {place.address}
                                  {place.city ? `, ${place.city}` : ""}
                                </span>
                              </div>
                              <span className="mt-2 inline-flex rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-[#c6283a]">
                                Recomendado
                              </span>
                            </div>
                            <div className="flex shrink-0 flex-col gap-2">
                              <button
                                aria-label="Anadir lugar recomendado"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                disabled={isAddingRecommendedPlace}
                                onClick={() => addRecommendedPlaceToPlan(selectedPlan, place)}
                                type="button"
                              >
                                {isPendingThisPlace ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
                                ) : (
                                  <CheckIcon />
                                )}
                              </button>
                              <button
                                aria-label="Descartar recomendacion"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-500 transition hover:bg-rose-50"
                                onClick={() =>
                                  setDismissedRecommendationIds((current) => ({ ...current, [`${selectedPlan.id}:${place.id}`]: true }))
                                }
                                type="button"
                              >
                                <CloseIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : null}

                <div className="relative">
                  <div className="absolute left-[-1.65rem] top-6 h-4 w-4 rounded-full border-2 border-rose-200 bg-[#fff8f7]" />
                  <button
                    className="flex h-16 w-full items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-rose-200 bg-transparent text-sm font-semibold text-zinc-600 transition hover:border-[#ff5a5f] hover:text-[#c6283a]"
                    onClick={onNavigateToPlaces}
                    type="button"
                  >
                    <PlusIcon />
                    Anadir Lugar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-[28px] font-bold text-zinc-950">Asistencia y Votos</h4>
            <div className="mt-4 rounded-[28px] bg-[#fdf0ee] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.max(1, Math.min(selectedPlan.attendingCount, 3)) }).map((_, index) => (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#fff8f7] bg-zinc-800 text-[11px] font-bold text-white"
                      key={index}
                    >
                      {index + 1}
                    </div>
                  ))}
                  {selectedPlan.attendingCount > 3 ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#fff8f7] bg-rose-200 text-[11px] font-bold text-[#c6283a]">
                      +{selectedPlan.attendingCount - 3}
                    </div>
                  ) : null}
                </div>
                <span className="text-xs font-semibold text-emerald-700">{voteSummary(selectedPlan)}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <button
                  className={`rounded-[20px] p-3 text-center transition ${
                    selectedPlan.currentUserVote === "attending" ? "bg-emerald-100 text-emerald-700" : "bg-white/70 text-zinc-500"
                  }`}
                  disabled={isVoting}
                  onClick={() => {
                    const payload = new FormData();
                    payload.set("groupId", groupId);
                    payload.set("planId", selectedPlan.id);
                    payload.set("vote", "attending");
                    startTransition(() => voteAction(payload));
                  }}
                  type="button"
                >
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full">
                    <CheckIcon />
                  </div>
                  <p className="mt-1 text-sm font-semibold">Voy</p>
                </button>
                <button
                  className={`rounded-[20px] p-3 text-center transition ${
                    selectedPlan.currentUserVote === "maybe" ? "bg-sky-100 text-sky-700" : "bg-white/70 text-zinc-500"
                  }`}
                  disabled={isVoting}
                  onClick={() => {
                    const payload = new FormData();
                    payload.set("groupId", groupId);
                    payload.set("planId", selectedPlan.id);
                    payload.set("vote", "maybe");
                    startTransition(() => voteAction(payload));
                  }}
                  type="button"
                >
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full">
                    <QuestionIcon />
                  </div>
                  <p className="mt-1 text-sm font-semibold">Quizás</p>
                </button>
                <button
                  className={`rounded-[20px] p-3 text-center transition ${
                    selectedPlan.currentUserVote === "not_attending" ? "bg-rose-100 text-rose-600" : "bg-white/70 text-zinc-500"
                  }`}
                  disabled={isVoting}
                  onClick={() => {
                    const payload = new FormData();
                    payload.set("groupId", groupId);
                    payload.set("planId", selectedPlan.id);
                    payload.set("vote", "not_attending");
                    startTransition(() => voteAction(payload));
                  }}
                  type="button"
                >
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full">
                    <CloseIcon />
                  </div>
                  <p className="mt-1 text-sm font-semibold">No voy</p>
                </button>
              </div>
            </div>
          </div>

          {planDetailError ? <p className="mt-4 text-sm text-rose-600">{planDetailError}</p> : null}

          <div className="pt-8">
            <Button
              className="h-14 rounded-[22px] text-base"
              disabled={isEditingSelectedPlan && (!editedPlanTitle.trim() || !isEditedPlanDetailsDateAllowed || isUpdatingPlanDetails)}
              fullWidth
              onClick={() => {
                if (isEditingSelectedPlan) {
                  submitPlanDetailsUpdate(selectedPlan);
                  return;
                }
                setSelectedPlanId(null);
              }}
              type="button"
            >
              {isEditingSelectedPlan ? (isUpdatingPlanDetails ? "Guardando..." : "Guardar cambios") : selectedPlan.isCreator ? "Guardar Plan" : "Ver Plan"}
            </Button>
          </div>
        </div>

        <ConfirmDialog
          cancelLabel="Cancelar"
          confirmLabel="Eliminar plan"
          description={planToDelete ? `Se borrara "${planToDelete.title}" para todo el grupo.` : undefined}
          isPending={isDeleting}
          onCancel={() => setPlanToDelete(null)}
          onConfirm={() => {
            if (!planToDelete) {
              return;
            }

            const payload = new FormData();
            payload.set("groupId", groupId);
            payload.set("planId", planToDelete.id);
            startTransition(() => deleteAction(payload));
          }}
          open={Boolean(planToDelete)}
          title="Eliminar plan"
        />

        <ConfirmDialog
          cancelLabel="Cancelar"
          confirmLabel="Eliminar parada"
          description="Se quitara este lugar de la ruta del plan."
          isPending={isRemovingPlace}
          onCancel={() => setPlanPlaceToDeleteId(null)}
          onConfirm={() => {
            if (!planPlaceToDeleteId) {
              return;
            }

            const payload = new FormData();
            payload.set("groupId", groupId);
            payload.set("planId", selectedPlan.id);
            payload.set("planPlaceId", planPlaceToDeleteId);
            startTransition(() => removePlaceAction(payload));
          }}
          open={Boolean(planPlaceToDeleteId)}
          title="Eliminar lugar"
        />

      </div>
    );
  }

  return (
    <div className="relative space-y-6 pb-24">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { value: "all", label: "Todos" },
          { value: "upcoming", label: "Próximos" },
          { value: "past", label: "Pasados" },
          { value: "draft", label: "Borradores" }
        ].map((filter) => (
          <button
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeFilter === filter.value
                ? "bg-[#c6283a] text-white shadow-[0_8px_18px_rgba(181,35,48,0.18)]"
                : "bg-rose-100/70 text-zinc-600 hover:bg-rose-100"
            }`}
            key={filter.value}
            onClick={() => setActiveFilter(filter.value as "all" | "upcoming" | "past" | "draft")}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>
      {!canCreatePlans ? (
        <p className="text-sm text-zinc-500">Solo se pueden crear planes en grupos abiertos.</p>
      ) : null}

      {isCreateOpen ? (
        <div className="rounded-[28px] border border-rose-100 bg-white p-5 shadow-[0_12px_40px_rgba(181,35,48,0.10)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-bold text-zinc-950">Nuevo plan</h4>
              <p className="mt-1 text-sm text-zinc-600">Crea la proxima salida del grupo en unos segundos.</p>
            </div>
            <button
              aria-label="Cerrar formulario"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-zinc-500 transition hover:text-[#c6283a]"
              onClick={() => setIsCreateOpen(false)}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <Input label="Nombre del plan" onChange={(event) => setTitle(event.target.value)} value={title} />
            <Input
              label="Fecha del plan"
              min={minPlanDate}
              onChange={(event) => setPlannedDate(event.target.value)}
              type="date"
              value={plannedDate}
            />
            {!isCreatePlanDateAllowed ? (
              <p className="text-sm text-rose-600">La fecha del plan no puede ser anterior a hoy.</p>
            ) : null}
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Descripcion</span>
              <textarea
                className="min-h-[110px] w-full rounded-[20px] border border-transparent bg-[#fff4f3] px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Por ejemplo: tapas tranquilas y luego copa"
                value={description}
              />
            </label>
            {createState.error ? <p className="text-sm text-rose-600">{createState.error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsCreateOpen(false)} type="button" variant="ghost">
                Cancelar
              </Button>
              <Button
                disabled={!title.trim() || !isCreatePlanDateAllowed || isCreating}
                onClick={() => {
                  const payload = new FormData();
                  payload.set("groupId", groupId);
                  payload.set("title", title);
                  payload.set("description", description);
                  payload.set("plannedDate", plannedDate);
                  startTransition(() => createAction(payload));
                }}
                type="button"
              >
                {isCreating ? "Creando..." : "Guardar plan"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!categorizedPlans.filtered.length ? (
        <EmptyState
          description="Todavia no hay planes para este filtro. Prueba a crear una salida nueva para el grupo."
          title="Sin planes por ahora"
        />
      ) : (
        <>
          {categorizedPlans.upcoming.length ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-2xl font-bold text-zinc-950">Próximos Planes</h4>
              </div>

              <div className="space-y-4">
                {categorizedPlans.upcoming.map((plan, index) => {
                  const accent =
                    index % 2 === 0
                      ? {
                          box: "bg-rose-50 text-[#c6283a]",
                          badge: "bg-[#c6283a] text-white",
                          button: "bg-[#c6283a] text-white hover:bg-[#b32033]"
                        }
                      : {
                          box: "bg-sky-50 text-sky-700",
                          badge: "bg-rose-50 text-[#c6283a]",
                          button: "border border-rose-200 bg-white text-[#c6283a] hover:bg-rose-50"
                        };

                  const previewPlaces = plan.places.slice(0, 4);
                  const hiddenPlacesCount = Math.max(0, plan.places.length - previewPlaces.length);
                  return (
                    <div className="w-full" key={plan.id}>
                      <div className="rounded-[28px] border border-rose-100/60 bg-white p-4 shadow-[0_10px_32px_rgba(181,35,48,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(181,35,48,0.12)]">
                        <div className="flex items-start justify-between gap-3">
                          <button className="flex min-w-0 flex-1 gap-3 text-left" onClick={() => openPlanPage(plan.id)} type="button">
                            <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${accent.box}`}>
                              <span className="text-xl font-bold leading-none">{formatDayMonth(plan.plannedDate)}</span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{formatYearShort(plan.plannedDate)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[22px] font-bold leading-7 text-zinc-950">{plan.title}</p>
                              <p className="mt-1 truncate text-sm text-zinc-500">{planLocationLabel(plan)}</p>
                            </div>
                          </button>
                          {renderPlanMenu(plan)}
                        </div>

                        <button className="mt-4 block w-full text-left" onClick={() => openPlanPage(plan.id)} type="button">
                          {previewPlaces.length ? (
                            <div className="rounded-[20px] bg-[#fff4f3] p-3">
                              {previewPlaces.map((place, placeIndex) => {
                                const hasNextRow = placeIndex < previewPlaces.length - 1 || hiddenPlacesCount > 0;

                                return (
                                  <div key={place.id}>
                                    <div className="flex items-center gap-2 text-sm text-zinc-800">
                                      <span className={`h-2 w-2 rounded-full ${placeIndex === 0 ? "bg-[#c6283a]" : "bg-emerald-500"}`} />
                                      <span className="truncate">
                                        {place.name}
                                        {place.plannedAt ? ` (${formatPlanTime(place.plannedAt)})` : ""}
                                      </span>
                                    </div>
                                    {hasNextRow ? <div className="ml-[3px] mt-1 h-4 border-l border-dashed border-rose-200" /> : null}
                                  </div>
                                );
                              })}
                              {hiddenPlacesCount > 0 ? (
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#c6283a]">
                                  <span className="h-2 w-2 rounded-full bg-rose-300" />
                                  <span>+{hiddenPlacesCount} más</span>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </button>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex -space-x-2">
                            {Array.from({ length: Math.max(1, Math.min(plan.attendingCount, 2)) }).map((_, avatarIndex) => (
                              <div
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-white bg-zinc-800 text-[10px] font-bold text-white"
                                key={avatarIndex}
                              >
                                {avatarIndex + 1}
                              </div>
                            ))}
                            {plan.attendingCount > 2 ? (
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full border border-white text-[10px] font-bold ${accent.badge}`}>
                                +{plan.attendingCount - 2}
                              </div>
                            ) : null}
                          </div>
                          <button
                            className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-semibold transition ${accent.button}`}
                            onClick={() => openPlanPage(plan.id)}
                            type="button"
                          >
                            Ver plan
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {categorizedPlans.drafts.length ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-2xl font-bold text-zinc-950">Borradores</h4>
                <span className="text-xs font-semibold text-zinc-500">Sin fecha cerrada</span>
              </div>

              <div className="space-y-3">
                {categorizedPlans.drafts.map((plan) => (
                  <div className="w-full" key={plan.id}>
                    <div className="rounded-[24px] border border-rose-100/60 bg-white p-4 shadow-[0_8px_24px_rgba(181,35,48,0.06)] transition hover:-translate-y-0.5">
                      <div className="flex items-center justify-between gap-3">
                        <button className="min-w-0 flex-1 text-left" onClick={() => openPlanPage(plan.id)} type="button">
                          <p className="truncate text-lg font-bold text-zinc-950">{plan.title}</p>
                          <p className="mt-1 text-sm text-zinc-500">{plan.description || "Todavía sin descripción"}</p>
                        </button>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-[#c6283a]">
                            {plan.places.length} paradas
                          </div>
                          {renderPlanMenu(plan)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {categorizedPlans.past.length ? (
            <section className="space-y-4">
              <h4 className="text-2xl font-bold text-zinc-950">Planes Pasados</h4>
              <div className="space-y-3">
                {categorizedPlans.past.map((plan) => (
                  <div className="w-full" key={plan.id}>
                    <div className="flex items-center gap-4 rounded-[22px] bg-rose-50/70 px-4 py-3 transition hover:bg-rose-100/70">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3dfde] text-zinc-500">
                        <RestaurantIcon />
                      </div>
                      <button className="min-w-0 flex-1 text-left" onClick={() => openPlanPage(plan.id)} type="button">
                        <p className="truncate text-base font-semibold text-zinc-950">{plan.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {shortDate(plan.plannedDate)} • {planAttendanceLabel(plan)}
                        </p>
                      </button>
                      <div className="flex items-center gap-1">
                        {renderPlanMenu(plan)}
                        <button className="shrink-0 text-zinc-300" onClick={() => openPlanPage(plan.id)} type="button">
                          <ChevronRightIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {canCreatePlans ? (
        <div className="sticky bottom-24 flex justify-end pr-1">
          <button
            aria-label="Nuevo plan"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c6283a] text-white shadow-[0_14px_28px_rgba(181,35,48,0.24)] transition hover:scale-105 active:scale-95"
            onClick={() => setIsCreateOpen(true)}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" viewBox="0 0 24 24">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        cancelLabel="Cancelar"
        confirmLabel="Eliminar plan"
        description={planToDelete ? `Se borrara "${planToDelete.title}" para todo el grupo.` : undefined}
        isPending={isDeleting}
        onCancel={() => setPlanToDelete(null)}
        onConfirm={() => {
          if (!planToDelete) {
            return;
          }

          const payload = new FormData();
          payload.set("groupId", groupId);
          payload.set("planId", planToDelete.id);
          startTransition(() => deleteAction(payload));
        }}
        open={Boolean(planToDelete)}
        title="Eliminar plan"
      />

      {typeof document !== "undefined" && planToEditDate
        ? createPortal(
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/45 p-4 sm:items-center" onClick={() => setPlanToEditDate(null)}>
          <div
            className="w-full max-w-md rounded-[28px] border border-rose-100 bg-[#fff8f7] p-5 shadow-[0_18px_45px_rgba(24,24,27,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-zinc-950">Cambiar fecha</h4>
                <p className="mt-1 text-sm text-zinc-600">{planToEditDate.title}</p>
              </div>
              <button
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-500"
                onClick={() => setPlanToEditDate(null)}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Input
                label="Nueva fecha"
                min={minPlanDate}
                onChange={(event) => setEditedPlannedDate(event.target.value)}
                type="date"
                value={editedPlannedDate}
              />
              {!isEditedPlanDateAllowed ? (
                <p className="text-sm text-rose-600">La fecha del plan no puede ser anterior a hoy.</p>
              ) : null}
              {updatePlanDateState.error ? <p className="text-sm text-rose-600">{updatePlanDateState.error}</p> : null}
              <div className="flex justify-end gap-2">
                <Button onClick={() => setPlanToEditDate(null)} type="button" variant="ghost">
                  Cancelar
                </Button>
                <Button
                  disabled={!isEditedPlanDateAllowed || isUpdatingPlanDate}
                  onClick={() => {
                    const requestId = crypto.randomUUID();
                    const payload = new FormData();
                    payload.set("groupId", groupId);
                    payload.set("planId", planToEditDate.id);
                    payload.set("plannedDate", editedPlannedDate);
                    payload.set("requestId", requestId);
                    setPendingPlanDateUpdate({
                      planId: planToEditDate.id,
                      plannedDate: editedPlannedDate,
                      requestId
                    });
                    startTransition(() => updatePlanDateActionForm(payload));
                  }}
                  type="button"
                >
                  {isUpdatingPlanDate ? "Guardando..." : "Guardar fecha"}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
        : null}
    </div>
  );
}
