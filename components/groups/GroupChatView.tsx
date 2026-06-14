"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createGroupChatMessageAction,
  deleteGroupChatMessageAction,
  type CreateGroupChatMessageActionState,
  type DeleteGroupChatMessageActionState
} from "@/app/groups/[groupId]/chat/actions";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { Button } from "@/components/ui/Button";
import type { GroupChatMessageItem } from "@/lib/groupChat";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GroupChatViewProps = {
  currentUserId: string;
  groupId: string;
  groupName: string;
  initialSelectedPlaceId?: string | null;
  initialSelectedPlanId?: string | null;
  latestMessageAt: string | null;
  messages: GroupChatMessageItem[];
};

const createInitialState: CreateGroupChatMessageActionState = { error: null, success: false };
const deleteInitialState: DeleteGroupChatMessageActionState = { error: null, success: false };

type LocalChatMessage = GroupChatMessageItem & {
  deliveryStatus?: "sending";
};

type ChatContext =
  | {
      id: string;
      kind: "place";
      subtitle: string | null;
      title: string;
    }
  | {
      id: string;
      kind: "plan";
      subtitle: string | null;
      title: string;
    };

type ChatContextResponse = {
  places?: ChatContext[];
  plans?: ChatContext[];
};

function getInitial(username: string | null): string {
  const trimmed = username?.trim() ?? "";
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

function formatMessageTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(parsed);
}

function BackIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function getContextLabel(kind: ChatContext["kind"]): string {
  return kind === "plan" ? "Plan" : "Lugar";
}

function buildMessageContext(message: GroupChatMessageItem): ChatContext | null {
  if (message.planId) {
    return {
      id: message.planId,
      kind: "plan",
      subtitle: null,
      title: message.planTitle || "Plan"
    };
  }

  if (message.placeId) {
    return {
      id: message.placeId,
      kind: "place",
      subtitle: message.placeAddress,
      title: message.placeName || "Lugar"
    };
  }

  return null;
}

function getContextHref(groupId: string, context: ChatContext): string {
  if (context.kind === "plan") {
    return `/groups/${groupId}/plans/${context.id}`;
  }

  return `/groups/${groupId}?tab=mapa&placeId=${context.id}`;
}

export function GroupChatView({
  currentUserId,
  groupId,
  groupName,
  initialSelectedPlaceId = null,
  initialSelectedPlanId = null,
  latestMessageAt,
  messages,
}: GroupChatViewProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [attachMode, setAttachMode] = useState<ChatContext["kind"] | null>(null);
  const [selectedContext, setSelectedContext] = useState<ChatContext | null>(null);
  const [planContextOptions, setPlanContextOptions] = useState<ChatContext[]>([]);
  const [placeContextOptions, setPlaceContextOptions] = useState<ChatContext[]>([]);
  const [hasLoadedContext, setHasLoadedContext] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<LocalChatMessage[]>([]);
  const [createState, createAction, isCreating] = useActionState(createGroupChatMessageAction, createInitialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteGroupChatMessageAction, deleteInitialState);
  const currentSender = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.senderId === currentUserId),
    [currentUserId, messages]
  );
  const visibleMessages = useMemo<LocalChatMessage[]>(() => [...messages, ...optimisticMessages], [messages, optimisticMessages]);
  const loadChatContext = useCallback(async () => {
    if (hasLoadedContext || isLoadingContext) {
      return;
    }

    setIsLoadingContext(true);
    setContextError(null);
    try {
      const response = await fetch(`/api/groups/${groupId}/chat-context`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("No se pudo cargar el contexto.");
      }
      const data = (await response.json()) as ChatContextResponse;
      setPlanContextOptions((data.plans || []).filter((option) => option.kind === "plan"));
      setPlaceContextOptions((data.places || []).filter((option) => option.kind === "place"));
      setHasLoadedContext(true);
    } catch {
      setContextError("No se pudieron cargar planes y lugares.");
    } finally {
      setIsLoadingContext(false);
    }
  }, [groupId, hasLoadedContext, isLoadingContext]);

  useEffect(() => {
    if ((initialSelectedPlanId || initialSelectedPlaceId) && !hasLoadedContext) {
      void loadChatContext();
      return;
    }

    if (initialSelectedPlanId) {
      const plan = planContextOptions.find((candidate) => candidate.id === initialSelectedPlanId);
      if (plan) {
        setSelectedContext(plan);
        setAttachMode(null);
        setIsAttachMenuOpen(false);
      }
      return;
    }

    if (initialSelectedPlaceId) {
      const place = placeContextOptions.find((candidate) => candidate.id === initialSelectedPlaceId);
      if (place) {
        setSelectedContext(place);
        setAttachMode(null);
        setIsAttachMenuOpen(false);
      }
    }
  }, [hasLoadedContext, initialSelectedPlaceId, initialSelectedPlanId, loadChatContext, placeContextOptions, planContextOptions]);

  useEffect(() => {
    if (!latestMessageAt) {
      return;
    }

    void fetch(`/api/groups/${groupId}/chat-read`, {
      body: JSON.stringify({ lastReadAt: latestMessageAt }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
  }, [groupId, latestMessageAt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [visibleMessages.length]);

  useEffect(() => {
    router.prefetch(`/groups/${groupId}`);
  }, [groupId, router]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `group_id=eq.${groupId}`,
          schema: "public",
          table: "group_chat_messages"
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, router]);

  useEffect(() => {
    setOptimisticMessages([]);
  }, [messages]);

  useEffect(() => {
    if (!createState.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [createState.success, router]);

  useEffect(() => {
    if (!createState.error) {
      return;
    }

    setOptimisticMessages([]);
  }, [createState.error]);

  useEffect(() => {
    if (!deleteState.success) {
      return;
    }

    router.refresh();
  }, [deleteState.success, router]);

  function handleCreateMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    if (selectedContext?.kind === "plan") {
      formData.set("kind", "plan_suggestion");
      formData.set("planId", selectedContext.id);
    }
    if (selectedContext?.kind === "place") {
      formData.set("kind", "place_comment");
      formData.set("placeId", selectedContext.id);
    }
    const optimisticMessage: LocalChatMessage = {
      content,
      createdAt: new Date().toISOString(),
      deliveryStatus: "sending",
      groupId,
      id: `pending-${crypto.randomUUID()}`,
      kind: selectedContext?.kind === "plan" ? "plan_suggestion" : selectedContext?.kind === "place" ? "place_comment" : "message",
      planId: selectedContext?.kind === "plan" ? selectedContext.id : null,
      planTitle: selectedContext?.kind === "plan" ? selectedContext.title : null,
      placeAddress: selectedContext?.kind === "place" ? selectedContext.subtitle : null,
      placeId: selectedContext?.kind === "place" ? selectedContext.id : null,
      placeImageUrl: null,
      placeName: selectedContext?.kind === "place" ? selectedContext.title : null,
      planPlaceId: null,
      senderAvatarUrl: currentSender?.senderAvatarUrl ?? null,
      senderId: currentUserId,
      senderUsername: currentSender?.senderUsername ?? null,
      updatedAt: new Date().toISOString()
    };

    setOptimisticMessages((current) => [...current, optimisticMessage]);
    setDraft("");
    setSelectedContext(null);
    setAttachMode(null);
    setIsAttachMenuOpen(false);
    startTransition(() => {
      createAction(formData);
    });
  }

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(`/groups/${groupId}`);
  }

  return (
    <div className="min-h-dvh bg-[#fff8f7] text-[#261817]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-[#fff8f7]/90 px-5 py-2 backdrop-blur-xl">
        <div className="relative mx-auto flex h-12 max-w-3xl items-center justify-between gap-3">
          <button
            aria-label="Volver atrás"
            className="grid h-10 w-10 place-items-center rounded-full text-[#c6283a] transition hover:bg-rose-50"
            onClick={goBack}
            onPointerEnter={() => router.prefetch(`/groups/${groupId}`)}
            onPointerDown={() => router.prefetch(`/groups/${groupId}`)}
            type="button"
          >
            <BackIcon />
          </button>
          <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            <MaplanMinimalIcon size="sm" />
            <span className="text-xl font-bold text-[#c6283a]">MaPlan</span>
          </div>
          <div className="h-10 w-10" />
        </div>
      </header>

      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-36 pt-20">
        <section className="mb-5 rounded-[28px] border border-rose-100 bg-white p-4 shadow-[0_12px_36px_rgba(181,35,48,0.08)]">
          <h1 className="text-2xl font-extrabold text-zinc-950">Chat de {groupName}</h1>
        </section>

        <section className="flex-1 space-y-3">
          {visibleMessages.map((message) => {
            const isMine = message.senderId === currentUserId;
            const messageContext = buildMessageContext(message);
            return (
              <article className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`} key={message.id}>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#fde2e0]">
                  {message.senderAvatarUrl ? (
                    <div
                      aria-label={message.senderUsername || "Avatar"}
                      className="h-full w-full bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url("${message.senderAvatarUrl}")` }}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-extrabold text-[#c6283a]">
                      {getInitial(message.senderUsername)}
                    </div>
                  )}
                </div>
                <div
                  className={`min-w-0 max-w-[82%] rounded-[24px] px-4 py-3 shadow-[0_10px_26px_rgba(181,35,48,0.08)] ${
                    isMine ? "bg-[#c6283a] text-white" : "bg-white text-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`truncate text-xs font-bold ${isMine ? "text-white/85" : "text-[#c6283a]"}`}>
                      @{message.senderUsername || "usuario"}
                    </p>
                    <time className={`shrink-0 text-[11px] font-semibold ${isMine ? "text-white/70" : "text-zinc-400"}`}>
                      {message.deliveryStatus === "sending" ? "Ahora" : formatMessageTime(message.createdAt)}
                    </time>
                  </div>
                  {messageContext ? (
                    <Link
                      className={`mt-3 block rounded-[18px] border px-3 py-2 transition ${
                        isMine ? "border-white/20 bg-white/12 hover:bg-white/18" : "border-rose-100 bg-[#fff4f3] hover:bg-[#fff0ef]"
                      }`}
                      href={getContextHref(groupId, messageContext)}
                    >
                      <p className={`text-[11px] font-extrabold uppercase ${isMine ? "text-white/70" : "text-[#c6283a]"}`}>
                        {getContextLabel(messageContext.kind)}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-extrabold">{messageContext.title}</p>
                      {messageContext.subtitle ? (
                        <p className={`mt-0.5 line-clamp-1 text-xs ${isMine ? "text-white/70" : "text-zinc-500"}`}>
                          {messageContext.subtitle}
                        </p>
                      ) : null}
                    </Link>
                  ) : null}
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                  {isMine && !message.deliveryStatus ? (
                    <form
                      action={deleteAction}
                      className="mt-2 text-right"
                      onSubmit={(event) => {
                        if (!window.confirm("Eliminar este mensaje?")) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input name="groupId" type="hidden" value={groupId} />
                      <input name="messageId" type="hidden" value={message.id} />
                      <button className="text-[11px] font-bold text-white/75 hover:text-white" disabled={isDeleting} type="submit">
                        Eliminar
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
          <div ref={messagesEndRef} />
        </section>
      </main>

      <form
        className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-100 bg-[#fff8f7]/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"
        onSubmit={handleCreateMessage}
        ref={formRef}
      >
        <div className="mx-auto max-w-3xl">
          <input name="groupId" type="hidden" value={groupId} />
          <input name="kind" type="hidden" value="message" />
          <label className="sr-only" htmlFor="group-chat-content">
            Mensaje
          </label>
          {selectedContext ? (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-[20px] border border-rose-100 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(181,35,48,0.10)]">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase text-[#c6283a]">{getContextLabel(selectedContext.kind)} seleccionado</p>
                <p className="truncate text-sm font-extrabold text-zinc-950">{selectedContext.title}</p>
              </div>
              <button
                aria-label="Quitar referencia"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff0ef] text-[#c6283a]"
                onClick={() => setSelectedContext(null)}
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : null}
          {isAttachMenuOpen ? (
            <div className="mb-2 rounded-[24px] border border-rose-100 bg-white p-3 shadow-[0_16px_38px_rgba(181,35,48,0.14)]">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`h-11 rounded-[18px] text-sm font-extrabold ${attachMode === "place" ? "bg-[#c6283a] text-white" : "bg-[#fff4f3] text-[#c6283a]"}`}
                  onClick={() => setAttachMode((current) => (current === "place" ? null : "place"))}
                  type="button"
                >
                  Lugar
                </button>
                <button
                  className={`h-11 rounded-[18px] text-sm font-extrabold ${attachMode === "plan" ? "bg-[#c6283a] text-white" : "bg-[#fff4f3] text-[#c6283a]"}`}
                  onClick={() => setAttachMode((current) => (current === "plan" ? null : "plan"))}
                  type="button"
                >
                  Planes
                </button>
              </div>
              {attachMode ? (
                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {isLoadingContext ? (
                    <p className="px-2 py-3 text-sm font-semibold text-zinc-500">Cargando opciones...</p>
                  ) : null}
                  {!isLoadingContext && contextError ? <p className="px-2 py-3 text-sm font-semibold text-rose-600">{contextError}</p> : null}
                  {!isLoadingContext && (attachMode === "plan" ? planContextOptions : placeContextOptions).map((option) => (
                    <button
                      className="flex w-full min-w-0 items-center justify-between gap-3 rounded-[18px] bg-[#fff8f7] px-3 py-2 text-left transition hover:bg-[#fff0ef]"
                      key={`${option.kind}:${option.id}`}
                      onClick={() => {
                        setSelectedContext(option);
                        setAttachMode(null);
                        setIsAttachMenuOpen(false);
                      }}
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-extrabold text-zinc-950">{option.title}</span>
                        {option.subtitle ? <span className="block truncate text-xs text-zinc-500">{option.subtitle}</span> : null}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-[#c6283a]">Seleccionar</span>
                    </button>
                  ))}
                  {!isLoadingContext && !contextError && (attachMode === "plan" ? planContextOptions : placeContextOptions).length === 0 ? (
                    <p className="px-2 py-3 text-sm font-semibold text-zinc-500">
                      {attachMode === "plan" ? "No hay planes en este grupo." : "No hay lugares guardados en este grupo."}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex items-end gap-2 rounded-[28px] border border-rose-100 bg-white p-2 shadow-[0_16px_42px_rgba(181,35,48,0.14)]">
            <button
              aria-expanded={isAttachMenuOpen}
              aria-label="Adjuntar referencia"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-[#fff0ef] text-[#c6283a] transition hover:bg-[#fde2e0]"
              onClick={() => {
                setIsAttachMenuOpen((current) => {
                  const next = !current;
                  if (next) {
                    void loadChatContext();
                  }
                  return next;
                });
              }}
              type="button"
            >
              <PlusIcon />
            </button>
            <textarea
              className="min-h-12 flex-1 resize-none rounded-[20px] border border-transparent bg-[#fff4f3] px-4 py-3 text-sm text-zinc-950 outline-none focus:border-[#ff5a5f]"
              id="group-chat-content"
              maxLength={1000}
              name="content"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe al grupo..."
              rows={1}
              value={draft}
            />
            <Button disabled={!draft.trim()} type="submit">
              {isCreating && !draft.trim() ? "Enviando..." : "Enviar"}
            </Button>
          </div>
          {createState.error ? <p className="mt-2 text-sm font-semibold text-rose-600">{createState.error}</p> : null}
          {deleteState.error ? <p className="mt-2 text-sm font-semibold text-rose-600">{deleteState.error}</p> : null}
        </div>
      </form>
    </div>
  );
}
