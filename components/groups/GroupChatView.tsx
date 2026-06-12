"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
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
  messages: GroupChatMessageItem[];
};

const createInitialState: CreateGroupChatMessageActionState = { error: null, success: false };
const deleteInitialState: DeleteGroupChatMessageActionState = { error: null, success: false };

type LocalChatMessage = GroupChatMessageItem & {
  deliveryStatus?: "sending";
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

export function GroupChatView({ currentUserId, groupId, groupName, messages }: GroupChatViewProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [visibleMessages.length]);

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
    const optimisticMessage: LocalChatMessage = {
      content,
      createdAt: new Date().toISOString(),
      deliveryStatus: "sending",
      groupId,
      id: `pending-${crypto.randomUUID()}`,
      kind: "message",
      planId: null,
      placeId: null,
      planPlaceId: null,
      senderAvatarUrl: currentSender?.senderAvatarUrl ?? null,
      senderId: currentUserId,
      senderUsername: currentSender?.senderUsername ?? null,
      updatedAt: new Date().toISOString()
    };

    setOptimisticMessages((current) => [...current, optimisticMessage]);
    setDraft("");
    startTransition(() => {
      createAction(formData);
    });
  }

  return (
    <div className="min-h-dvh bg-[#fff8f7] text-[#261817]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-[#fff8f7]/90 px-5 py-2 backdrop-blur-xl">
        <div className="relative mx-auto flex h-12 max-w-3xl items-center justify-between gap-3">
          <Link
            aria-label="Volver al grupo"
            className="grid h-10 w-10 place-items-center rounded-full text-[#c6283a] transition hover:bg-rose-50"
            href={`/groups/${groupId}`}
          >
            <BackIcon />
          </Link>
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
          <div className="flex items-end gap-2 rounded-[28px] border border-rose-100 bg-white p-2 shadow-[0_16px_42px_rgba(181,35,48,0.14)]">
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
