import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GroupActivityEventType = "place_added";

export type GroupActivityFeedItem = {
  id: string;
  groupId: string;
  groupName: string;
  actorUserId: string;
  actorUsername: string | null;
  eventType: GroupActivityEventType;
  entityId: string | null;
  entityName: string | null;
  createdAt: string;
  message: string;
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

function buildActivityMessage(input: {
  actorUsername: string | null;
  eventType: GroupActivityEventType;
  entityName: string | null;
  groupName: string;
}): string {
  const actor = input.actorUsername ? `@${input.actorUsername}` : "Alguien";
  if (input.eventType === "place_added") {
    const place = input.entityName ? `"${input.entityName}"` : "un lugar";
    return `${actor} anadio ${place} en "${input.groupName}".`;
  }

  return `${actor} hizo una accion en "${input.groupName}".`;
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

export async function getGroupActivityFeedForUser(userId: string, limit = 20): Promise<GroupActivityFeedItem[]> {
  const supabase = await createSupabaseServerClient();
  const membershipResult = await supabase.from("group_members").select("group_id").eq("user_id", userId);
  const groupIds = (membershipResult.data || []).map((item) => item.group_id);

  if (groupIds.length === 0) {
    return [];
  }

  const eventsResult = await supabase
    .from("group_activity_events")
    .select("id, group_id, actor_user_id, event_type, entity_id, entity_name, created_at")
    .in("group_id", groupIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  const events = eventsResult.data || [];
  if (events.length === 0) {
    return [];
  }

  const uniqueGroupIds = Array.from(new Set(events.map((event) => event.group_id)));
  const uniqueActorIds = Array.from(new Set(events.map((event) => event.actor_user_id)));

  const [groupsResult, profilesResult] = await Promise.all([
    supabase.from("groups").select("id, name").in("id", uniqueGroupIds),
    supabase.from("profiles").select("id, username").in("id", uniqueActorIds)
  ]);

  const groupNameById = new Map<string, string>();
  (groupsResult.data || []).forEach((group) => groupNameById.set(group.id, group.name));

  const usernameById = new Map<string, string | null>();
  (profilesResult.data || []).forEach((profile) => usernameById.set(profile.id, profile.username));

  return events.map((event) => {
    const groupName = groupNameById.get(event.group_id) || "Grupo";
    const actorUsername = usernameById.get(event.actor_user_id) ?? null;
    const eventType = event.event_type as GroupActivityEventType;

    return {
      id: event.id,
      groupId: event.group_id,
      groupName,
      actorUserId: event.actor_user_id,
      actorUsername,
      eventType,
      entityId: event.entity_id,
      entityName: event.entity_name,
      createdAt: event.created_at,
      message: buildActivityMessage({
        actorUsername,
        eventType,
        entityName: event.entity_name,
        groupName
      })
    };
  });
}

export async function getGroupsWithRecentActivityForUser(userId: string, maxGroups = 5): Promise<GroupWithActivityItem[]> {
  const events = await getGroupActivityFeedForUser(userId, 100);

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
