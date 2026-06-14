import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GroupActivityEventType = "place_added" | "plan_created";

export type GroupActivityFeedItem = {
  id: string;
  groupId: string;
  groupName: string;
  actorUserId: string;
  actorUsername: string | null;
  actorAvatarUrl: string | null;
  eventType: GroupActivityEventType;
  entityId: string | null;
  entityName: string | null;
  createdAt: string;
  message: string;
  href: string | null;
};

export type GroupWithActivityItem = {
  groupId: string;
  groupName: string;
  latestActivityAt: string;
  recentEventsCount: number;
};

type RecordPlaceAddedInput = {
  groupId: string;
  actorUserId: string;
  placeId: string;
  placeName: string;
};

type RecordPlanCreatedInput = {
  groupId: string;
  actorUserId: string;
  planId: string;
  planTitle: string;
};

function buildActivityMessage(input: {
  actorUsername: string | null;
  eventType: GroupActivityEventType;
  entityName: string | null;
  groupName: string;
  includeGroupName?: boolean;
}): string {
  const actor = input.actorUsername ? `@${input.actorUsername}` : "Alguien";
  const groupSuffix = input.includeGroupName ? ` en "${input.groupName}"` : "";
  if (input.eventType === "place_added") {
    const place = input.entityName ? `"${input.entityName}"` : "un lugar";
    return `${actor} anadio ${place}${groupSuffix}.`;
  }

  if (input.eventType === "plan_created") {
    const plan = input.entityName ? `"${input.entityName}"` : "un plan";
    return `${actor} ha creado ${plan}${groupSuffix}.`;
  }

  return `${actor} hizo una accion${groupSuffix}.`;
}

function buildActivityHref(input: {
  eventType: GroupActivityEventType;
  groupId: string;
  entityId: string | null;
}): string | null {
  if (!input.entityId) {
    return null;
  }

  if (input.eventType === "plan_created") {
    return `/groups/${encodeURIComponent(input.groupId)}/plans/${encodeURIComponent(input.entityId)}`;
  }

  if (input.eventType !== "place_added") {
    return null;
  }

  return `/groups/${encodeURIComponent(input.groupId)}?tab=mapa&placeId=${encodeURIComponent(input.entityId)}`;
}

export async function recordPlaceAddedGroupActivity(input: RecordPlaceAddedInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.from("group_activity_events").insert({
    group_id: input.groupId,
    actor_user_id: input.actorUserId,
    event_type: "place_added",
    entity_id: input.placeId,
    entity_name: input.placeName.trim() || null,
    metadata: null
  });
}

export async function recordPlanCreatedGroupActivity(input: RecordPlanCreatedInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.from("group_activity_events").insert({
    group_id: input.groupId,
    actor_user_id: input.actorUserId,
    event_type: "plan_created",
    entity_id: input.planId,
    entity_name: input.planTitle.trim() || null,
    metadata: null
  });
}

export async function getGroupActivityFeedForUser(
  userId: string,
  limit = 20,
  options: { includeGroupName?: boolean; maxAgeDays?: number } = {}
): Promise<GroupActivityFeedItem[]> {
  const supabase = await createSupabaseServerClient();
  const membershipResult = await supabase.from("group_members").select("group_id").eq("user_id", userId);
  const groupIds = (membershipResult.data || []).map((item) => item.group_id);

  if (groupIds.length === 0) {
    return [];
  }

  let eventsQuery = supabase
    .from("group_activity_events")
    .select("id, group_id, actor_user_id, event_type, entity_id, entity_name, created_at")
    .in("group_id", groupIds)
    .order("created_at", { ascending: false });

  if (typeof options.maxAgeDays === "number") {
    const since = new Date(Date.now() - options.maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
    eventsQuery = eventsQuery.gte("created_at", since);
  }

  const eventsResult = await eventsQuery.limit(limit);

  const events = eventsResult.data || [];
  if (events.length === 0) {
    return [];
  }

  const uniqueGroupIds = Array.from(new Set(events.map((event) => event.group_id)));
  const uniqueActorIds = Array.from(new Set(events.map((event) => event.actor_user_id)));

  const [groupsResult, profilesResult] = await Promise.all([
    supabase.from("groups").select("id, name").in("id", uniqueGroupIds),
    supabase.rpc("get_profiles_by_ids", { p_ids: uniqueActorIds })
  ]);

  const groupNameById = new Map<string, string>();
  (groupsResult.data || []).forEach((group) => groupNameById.set(group.id, group.name));

  const profileById = new Map<string, { username: string | null; avatarUrl: string | null }>();
  (profilesResult.data || []).forEach((profile) =>
    profileById.set(profile.id, {
      username: profile.username ?? null,
      avatarUrl: profile.avatar_url ?? null
    })
  );

  return events.map((event) => {
    const groupName = groupNameById.get(event.group_id) || "Grupo";
    const actorProfile = profileById.get(event.actor_user_id);
    const actorUsername = actorProfile?.username ?? null;
    const eventType = event.event_type as GroupActivityEventType;

    return {
      id: event.id,
      groupId: event.group_id,
      groupName,
      actorUserId: event.actor_user_id,
      actorUsername,
      actorAvatarUrl: actorProfile?.avatarUrl ?? null,
      eventType,
      entityId: event.entity_id,
      entityName: event.entity_name,
      createdAt: event.created_at,
      href: buildActivityHref({
        eventType,
        groupId: event.group_id,
        entityId: event.entity_id
      }),
      message: buildActivityMessage({
        actorUsername,
        eventType,
        entityName: event.entity_name,
        groupName,
        includeGroupName: options.includeGroupName ?? true
      })
    };
  });
}

export async function getGroupActivityLastSeenAtForUser(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("group_activity_reads")
    .select("last_seen_at")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.last_seen_at ?? null;
}

export async function markGroupActivitySeenForUser(userId: string, lastSeenAt: string | null): Promise<void> {
  if (!lastSeenAt) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("group_activity_reads").upsert(
    {
      last_seen_at: lastSeenAt,
      user_id: userId
    },
    { onConflict: "user_id" }
  );
}

export function summarizeGroupsWithRecentActivity(events: GroupActivityFeedItem[], maxGroups = 5): GroupWithActivityItem[] {
  if (events.length === 0) {
    return [];
  }

  const summaryByGroupId = new Map<string, GroupWithActivityItem>();
  events.forEach((event) => {
    const existing = summaryByGroupId.get(event.groupId);
    if (!existing) {
      summaryByGroupId.set(event.groupId, {
        groupId: event.groupId,
        groupName: event.groupName,
        latestActivityAt: event.createdAt,
        recentEventsCount: 1
      });
      return;
    }

    existing.recentEventsCount += 1;
    if (new Date(event.createdAt).getTime() > new Date(existing.latestActivityAt).getTime()) {
      existing.latestActivityAt = event.createdAt;
    }
  });

  return Array.from(summaryByGroupId.values())
    .sort((a, b) => new Date(b.latestActivityAt).getTime() - new Date(a.latestActivityAt).getTime())
    .slice(0, maxGroups);
}
