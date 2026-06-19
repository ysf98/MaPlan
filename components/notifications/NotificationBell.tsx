"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { NOTIFICATIONS_CHANGED_EVENT, NOTIFICATIONS_SYNC_EVENT } from "@/lib/notificationsRealtime";
import { ROUTES } from "@/utils/constants";

type NotificationBellProps = {
  currentUserId: string;
  initialCount: number;
};

type NotificationEventSource = "manual" | "realtime";

export function NotificationBell({ currentUserId, initialCount }: NotificationBellProps) {
  const [count, setCount] = useState(initialCount);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const refreshCount = useCallback(async (source: NotificationEventSource) => {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    try {
      const response = await fetch("/api/notifications/count", {
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { count?: unknown };
      if (typeof payload.count !== "number") {
        return;
      }

      setCount(payload.count);
      if (source === "realtime") {
        window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("[MaPlan notifications] No se pudo actualizar el contador.", error);
      }
    }
  }, []);

  const scheduleRefresh = useCallback(
    (source: NotificationEventSource) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        void refreshCount(source);
      }, 250);
    },
    [refreshCount]
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const handleRealtimeChange = (payload: { new: Record<string, unknown> }) => {
      const actorId = payload.new.actor_user_id;
      const senderId = payload.new.sender_id;
      const requesterId = payload.new.user_id;
      if (actorId === currentUserId || senderId === currentUserId || requesterId === currentUserId) {
        return;
      }
      scheduleRefresh("realtime");
    };

    const channel = supabase
      .channel(`notifications-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `receiver_id=eq.${currentUserId}`,
          schema: "public",
          table: "friend_requests"
        },
        () => scheduleRefresh("realtime")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `invited_user_id=eq.${currentUserId}`,
          schema: "public",
          table: "group_invitations"
        },
        () => scheduleRefresh("realtime")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_activity_events" },
        handleRealtimeChange
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_chat_messages" },
        handleRealtimeChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_join_requests" },
        handleRealtimeChange
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          scheduleRefresh("manual");
        }
      });

    const handleFocus = () => scheduleRefresh("manual");
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleRefresh("manual");
      }
    };
    const handleSyncRequest = () => scheduleRefresh("manual");

    window.addEventListener("focus", handleFocus);
    window.addEventListener(NOTIFICATIONS_SYNC_EVENT, handleSyncRequest);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      activeRequestRef.current?.abort();
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(NOTIFICATIONS_SYNC_EVENT, handleSyncRequest);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, scheduleRefresh]);

  return (
    <Link
      aria-label={count > 0 ? `Notificaciones, ${count} pendientes` : "Notificaciones"}
      className="relative grid h-10 w-10 place-items-center rounded-full text-[rgb(var(--primary-strong))] transition hover:bg-[rgb(var(--ring))]"
      href={ROUTES.notifications}
      prefetch={false}
    >
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 5a5 5 0 0 0-5 5v2.8c0 .6-.2 1.2-.5 1.7L5.6 16c-.4.8.1 1.7 1 1.7h10.8c.9 0 1.4-.9 1-1.7l-.9-1.5c-.3-.5-.5-1.1-.5-1.7V10a5 5 0 0 0-5-5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path d="M10 19a2.2 2.2 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
      {count > 0 ? (
        <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[rgb(var(--primary-strong))] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
