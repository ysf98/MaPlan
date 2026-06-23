"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  closeGroupPollAction,
  convertGroupPollToPlanAction,
  createGroupPollAction,
  voteGroupPollAction,
  type GroupDecisionActionState
} from "@/app/groups/[groupId]/decisions/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { GroupPollItem, GroupPollOptionItem } from "@/lib/groupPolls";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PlaceOption = { address: string | null; id: string; imageUrl: string | null; name: string };

type GroupDecisionsViewProps = {
  canCreate: boolean;
  currentUserId: string;
  groupId: string;
  groupName: string;
  initialCreateOpen: boolean;
  places: PlaceOption[];
  polls: GroupPollItem[];
};

type DraftPlaceOption = {
  id: string;
  placeId: string;
};

const actionInitialState: GroupDecisionActionState = { error: null, success: false };
const realtimeTables = ["group_polls", "group_poll_options", "group_poll_votes"] as const;

function createDraftPlaceOption(): DraftPlaceOption {
  return { id: crypto.randomUUID(), placeId: "" };
}

function getPlaceSubtitle(option: GroupPollOptionItem): string | null {
  return option.placeAddress || option.placeCity || null;
}

function PollPlaceOptionCard({
  groupId,
  option,
  poll
}: {
  groupId: string;
  option: GroupPollOptionItem;
  poll: GroupPollItem;
}) {
  const router = useRouter();
  const [state, voteAction, isVoting] = useActionState(voteGroupPollAction, actionInitialState);
  const title = option.placeName || option.label;
  const subtitle = getPlaceSubtitle(option);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <div
      className={`rounded-[20px] border p-3 ${
        option.isWinner && poll.status === "closed" ? "border-emerald-300 bg-emerald-50/70" : "border-rose-100 bg-[#fff8f7]"
      }`}
    >
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#fde2e0]">
          {option.placeImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="h-full w-full object-cover" src={option.placeImageUrl} />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg font-extrabold text-[#c6283a]">
              {title.trim()[0]?.toUpperCase() || "L"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-extrabold text-zinc-950">{title}</p>
              {subtitle ? <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{subtitle}</p> : null}
            </div>
            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-extrabold text-[#c6283a]">
              {option.voteCount}
            </span>
          </div>

          {poll.status === "open" ? (
            <form action={voteAction} className="mt-3">
              <input name="groupId" type="hidden" value={groupId} />
              <input name="pollId" type="hidden" value={poll.id} />
              <input name="optionId" type="hidden" value={option.id} />
              <button
                className={`h-10 w-full rounded-2xl text-sm font-bold ${
                  option.isCurrentUserVote ? "bg-[#c6283a] text-white" : "border border-rose-200 bg-white text-[#c6283a]"
                }`}
                disabled={isVoting}
                type="submit"
              >
                {option.isCurrentUserVote ? "Tu voto" : "Votar"}
              </button>
            </form>
          ) : null}
          {state.error ? <p className="mt-2 text-xs font-bold text-rose-600">{state.error}</p> : null}
          {option.isWinner && poll.status === "closed" ? (
            <p className="mt-2 text-xs font-extrabold text-emerald-700">{poll.hasTie ? "Empatado" : "Ganador"}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CreateDecisionPanel({
  groupId,
  onClose,
  places
}: {
  groupId: string;
  onClose: () => void;
  places: PlaceOption[];
}) {
  const router = useRouter();
  const [options, setOptions] = useState<DraftPlaceOption[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [state, action, isPending] = useActionState(createGroupPollAction, actionInitialState);
  const selectedPlaceIds = useMemo(() => new Set(options.map((option) => option.placeId)), [options]);
  const availablePlaces = useMemo(() => places.filter((place) => !selectedPlaceIds.has(place.id)), [places, selectedPlaceIds]);
  const canAddMore = availablePlaces.length > 0 && options.length < 12;

  useEffect(() => {
    if (!state.success) return;
    onClose();
    router.refresh();
  }, [onClose, router, state.success]);

  function addPlace(placeId: string) {
    if (!placeId || selectedPlaceIds.has(placeId) || options.length >= 12) {
      return;
    }

    setOptions((current) => [...current, { ...createDraftPlaceOption(), placeId }]);
    setSelectedPlaceId("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const normalizedOptions = options.flatMap((option) => {
      const place = places.find((candidate) => candidate.id === option.placeId);
      return place ? [{ label: place.name, placeId: place.id }] : [];
    });
    formData.set("kind", "poll");
    formData.set("pollType", "place");
    formData.set("options", JSON.stringify(normalizedOptions));
    startTransition(() => action(formData));
  }

  return (
    <section className="rounded-[24px] border border-rose-200 bg-white p-4 shadow-[0_18px_45px_rgba(181,35,48,0.12)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-950">Nueva encuesta</h2>
          <p className="mt-1 text-sm text-zinc-500">Elegid entre los lugares guardados del grupo.</p>
        </div>
        <button
          aria-label="Cerrar formulario"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-100 text-[#c6283a]"
          onClick={onClose}
          type="button"
        >
          <span aria-hidden="true" className="text-xl">×</span>
        </button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <input name="groupId" type="hidden" value={groupId} />
        <input name="kind" type="hidden" value="poll" />
        <input name="pollType" type="hidden" value="place" />
        <Input label="Pregunta" maxLength={140} name="title" placeholder="¿Dónde cenamos?" required />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-zinc-950">Lugares de la encuesta</h3>
            <span className="text-xs font-semibold text-zinc-400">{options.length}/12</span>
          </div>

          {options.length > 0 ? (
            <div className="space-y-2">
              {options.map((option) => {
                const place = places.find((candidate) => candidate.id === option.placeId);
                if (!place) return null;
                return (
                  <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[#fff8f7] px-3 py-2" key={option.id}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-zinc-950">{place.name}</p>
                      {place.address ? <p className="truncate text-xs text-zinc-500">{place.address}</p> : null}
                    </div>
                    <button
                      className="shrink-0 text-xs font-bold text-[#c6283a]"
                      onClick={() => setOptions((current) => current.filter((item) => item.id !== option.id))}
                      type="button"
                    >
                      Quitar
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-[18px] bg-[#fff8f7] px-4 py-3 text-sm font-semibold text-zinc-500">
              Añade al menos dos lugares para crear la encuesta.
            </p>
          )}

          {places.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-rose-200 bg-[#fff8f7] px-4 py-4">
              <p className="text-sm font-semibold text-zinc-600">Este grupo todavía no tiene lugares guardados.</p>
              <Link className="mt-2 inline-flex text-sm font-extrabold text-[#c6283a]" href={`/groups/${groupId}?tab=lugares`}>
                Ir a lugares
              </Link>
            </div>
          ) : (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-600">Añadir + lugar</span>
              <select
                className="h-12 w-full rounded-2xl border border-rose-100 bg-white px-3 text-sm outline-none focus:border-[#ff5a5f]"
                disabled={!canAddMore}
                onChange={(event) => {
                  addPlace(event.target.value);
                }}
                value={selectedPlaceId}
              >
                <option value="">{canAddMore ? "Selecciona un lugar" : "No quedan lugares disponibles"}</option>
                {availablePlaces.map((place) => (
                  <option key={place.id} value={place.id}>{place.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {state.error ? <p className="text-sm font-semibold text-rose-600">{state.error}</p> : null}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onClose} type="button" variant="secondary">Cancelar</Button>
          <Button className="flex-1" disabled={isPending || options.length < 2} type="submit">
            {isPending ? "Creando..." : "Crear"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PollCard({ groupId, poll }: { groupId: string; poll: GroupPollItem }) {
  const router = useRouter();
  const [closeState, closeAction, isClosing] = useActionState(closeGroupPollAction, actionInitialState);
  const [convertState, convertAction, isConverting] = useActionState(convertGroupPollToPlanAction, actionInitialState);
  const error = closeState.error || convertState.error;

  useEffect(() => {
    if (convertState.success && convertState.planId) {
      router.push(`/groups/${groupId}/plans/${convertState.planId}`);
    }
  }, [convertState.planId, convertState.success, groupId, router]);

  return (
    <article className="rounded-[24px] border border-rose-100 bg-white p-4 shadow-[0_12px_34px_rgba(181,35,48,0.08)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fff0ef] px-3 py-1 text-[11px] font-extrabold uppercase text-[#c6283a]">
              Encuesta de lugares
            </span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${poll.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
              {poll.status === "open" ? "Abierta" : "Cerrada"}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-extrabold leading-tight text-zinc-950">{poll.title}</h2>
          <p className="mt-1 text-xs font-semibold text-zinc-400">{poll.totalResponses} votos</p>
        </div>
        {poll.convertedPlanId ? (
          <Link className="shrink-0 text-sm font-bold text-[#c6283a]" href={`/groups/${groupId}/plans/${poll.convertedPlanId}`}>Ver plan</Link>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {poll.options.map((option) => (
          <PollPlaceOptionCard groupId={groupId} key={option.id} option={option} poll={poll} />
        ))}
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {poll.canClose ? (
          <form action={closeAction}>
            <input name="groupId" type="hidden" value={groupId} />
            <input name="pollId" type="hidden" value={poll.id} />
            <Button disabled={isClosing} size="sm" type="submit" variant="secondary">{isClosing ? "Cerrando..." : "Cerrar encuesta"}</Button>
          </form>
        ) : null}
        {poll.canConvert ? (
          <form action={convertAction} className="flex min-w-0 flex-1 gap-2">
            <input name="groupId" type="hidden" value={groupId} />
            <input name="pollId" type="hidden" value={poll.id} />
            <input
              aria-label="Nombre del nuevo plan"
              className="h-10 min-w-0 flex-1 rounded-2xl border border-rose-200 px-3 text-sm"
              defaultValue={poll.title.replace(/^¿|\?$/g, "")}
              maxLength={100}
              name="title"
              required
            />
            <Button disabled={isConverting} size="sm" type="submit">{isConverting ? "Creando..." : "Crear plan"}</Button>
          </form>
        ) : null}
      </div>
    </article>
  );
}

export function GroupDecisionsView({
  canCreate,
  currentUserId,
  groupId,
  groupName,
  initialCreateOpen,
  places,
  polls
}: GroupDecisionsViewProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(initialCreateOpen);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openPolls = useMemo(() => polls.filter((poll) => poll.status === "open"), [polls]);
  const closedPolls = useMemo(() => polls.filter((poll) => poll.status === "closed"), [polls]);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => router.refresh(), 250);
  }, [router]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel = supabase.channel(`group-decisions-${groupId}-${currentUserId}`);
    realtimeTables.forEach((table) => {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(table === "group_polls" ? { filter: `group_id=eq.${groupId}` } : {})
        },
        scheduleRefresh
      );
    });
    channel.subscribe();
    const onFocus = () => scheduleRefresh();
    window.addEventListener("focus", onFocus);
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, groupId, scheduleRefresh]);

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#c6283a]">{groupName}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-zinc-950">Decisiones</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">Votad entre lugares guardados y elegid la mejor opción.</p>
        </div>
        {canCreate && !isCreateOpen ? <Button onClick={() => setIsCreateOpen(true)}>Crear</Button> : null}
      </div>

      {isCreateOpen && canCreate ? (
        <CreateDecisionPanel groupId={groupId} onClose={() => setIsCreateOpen(false)} places={places} />
      ) : null}

      {polls.length === 0 && !isCreateOpen ? (
        <div className="rounded-[24px] border border-dashed border-rose-200 bg-white px-5 py-10 text-center">
          <h2 className="text-lg font-extrabold text-zinc-950">Todavía no hay encuestas</h2>
          <p className="mt-2 text-sm text-zinc-500">Cread una encuesta para elegir entre los lugares del grupo.</p>
        </div>
      ) : null}

      {openPolls.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-zinc-950">Abiertas</h2>
          {openPolls.map((poll) => <PollCard groupId={groupId} key={poll.id} poll={poll} />)}
        </div>
      ) : null}
      {closedPolls.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-zinc-950">Cerradas</h2>
          {closedPolls.map((poll) => <PollCard groupId={groupId} key={poll.id} poll={poll} />)}
        </div>
      ) : null}
    </section>
  );
}
