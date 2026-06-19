"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getGroupRealtimeFilter, GROUP_REALTIME_TABLES } from "@/lib/groupRealtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GroupRealtimeSyncProps = {
  currentUserId: string;
  groupId: string;
};

export function GroupRealtimeSync({ currentUserId, groupId }: GroupRealtimeSyncProps) {
  const router = useRouter();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      router.refresh();
    }, 300);
  }, [router]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel = supabase.channel(`group-sync-${groupId}-${currentUserId}`);

    for (const table of GROUP_REALTIME_TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          filter: getGroupRealtimeFilter(groupId),
          schema: "public",
          table
        },
        scheduleRefresh
      );
    }

    channel.subscribe();

    const handleFocus = () => scheduleRefresh();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleRefresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, groupId, scheduleRefresh]);

  return null;
}
