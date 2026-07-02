import { isGroupMember } from "@/lib/groupPermissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupChatMessageKind } from "@/types/supabase";

type GroupChatMessageRow = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  kind: string;
  plan_id: string | null;
  poll_id: string | null;
  place_id: string | null;
  plan_place_id: string | null;
  created_at: string;
  updated_at: string;
};

type ChatPlanContextRow = {
  id: string;
  planned_date: string | null;
  title: string;
};

type ChatPlanPlacePreviewRow = {
  place_address: string | null;
  place_city: string | null;
  place_image_url: string | null;
  place_name: string | null;
  plan_id: string;
  position: number;
};

type ChatPollContextRow = {
  id: string;
  title: string;
};

type ChatPlaceContextRow = {
  address: string | null;
  id: string;
  image_url: string | null;
  name: string;
  rating: number | null;
  user_ratings_total: number | null;
};

type CreateGroupChatMessageInput = {
  userId: string;
  groupId: string;
  content: string;
  kind?: GroupChatMessageKind;
  planId?: string | null;
  pollId?: string | null;
  placeId?: string | null;
  planPlaceId?: string | null;
};

type DeleteGroupChatMessageInput = {
  userId: string;
  groupId: string;
  messageId: string;
};

type MarkGroupChatReadInput = {
  userId: string;
  groupId: string;
  lastReadAt: string | null;
};

export type GroupChatMessageItem = {
  id: string;
  groupId: string;
  senderId: string;
  senderUsername: string | null;
  senderAvatarUrl: string | null;
  content: string;
  kind: GroupChatMessageKind;
  planId: string | null;
  planPlaces: GroupChatPlanPlacePreview[];
  planPlannedDate: string | null;
  planTitle: string | null;
  pollId: string | null;
  pollTitle: string | null;
  placeId: string | null;
  placeAddress: string | null;
  placeImageUrl: string | null;
  placeName: string | null;
  placeRating: number | null;
  placeUserRatingsTotal: number | null;
  planPlaceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroupChatPlanPlacePreview = {
  address: string | null;
  city: string | null;
  imageUrl: string | null;
  name: string;
};

export type GroupChatUnreadSummary = {
  groupId: string;
  groupName: string;
  latestMessageAt: string;
  unreadCount: number;
};

function isGroupChatMessageKind(value: string): value is GroupChatMessageKind {
  return value === "message" || value === "plan_suggestion" || value === "place_comment" || value === "poll";
}

async function getProfileMap(ids: string[]): Promise<Map<string, { avatarUrl: string | null; username: string | null }>> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_profiles_by_ids", { p_ids: uniqueIds });
  return new Map(
    (data || []).map((profile) => [
      profile.id,
      {
        avatarUrl: profile.avatar_url ?? null,
        username: profile.username ?? null
      }
    ])
  );
}

export async function getGroupChatMessagesForUser(userId: string, groupId: string): Promise<GroupChatMessageItem[]> {
  const hasAccess = await isGroupMember(userId, groupId);
  if (!hasAccess) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_chat_messages")
    .select("id, group_id, sender_id, content, kind, plan_id, poll_id, place_id, plan_place_id, created_at, updated_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  const rows = [...(data as GroupChatMessageRow[])].reverse();
  const profileById = await getProfileMap(rows.map((row) => row.sender_id));
  const planIds = Array.from(new Set(rows.map((row) => row.plan_id).filter(Boolean) as string[]));
  const pollIds = Array.from(new Set(rows.map((row) => row.poll_id).filter(Boolean) as string[]));
  const placeIds = Array.from(new Set(rows.map((row) => row.place_id).filter(Boolean) as string[]));
  const [plansResult, pollsResult, placesResult] = await Promise.all([
    planIds.length
      ? supabase.from("group_plans").select("id, title, planned_date").eq("group_id", groupId).in("id", planIds)
      : Promise.resolve({ data: [] as ChatPlanContextRow[] }),
    pollIds.length
      ? supabase.from("group_polls").select("id, title").eq("group_id", groupId).in("id", pollIds)
      : Promise.resolve({ data: [] as ChatPollContextRow[] }),
    placeIds.length
      ? supabase.from("places").select("id, name, address, image_url, rating, user_ratings_total").eq("group_id", groupId).in("id", placeIds)
      : Promise.resolve({ data: [] as ChatPlaceContextRow[] })
  ]);
  const planById = new Map(((plansResult.data || []) as ChatPlanContextRow[]).map((plan) => [plan.id, plan]));
  const pollById = new Map(((pollsResult.data || []) as ChatPollContextRow[]).map((poll) => [poll.id, poll]));
  const placeById = new Map(((placesResult.data || []) as ChatPlaceContextRow[]).map((place) => [place.id, place]));
  const planPlacesByPlanId = new Map<string, GroupChatPlanPlacePreview[]>();

  if (planIds.length) {
    const { data: planPlaces } = await supabase
      .from("group_plan_places")
      .select("plan_id, place_name, place_address, place_city, place_image_url, position")
      .in("plan_id", planIds)
      .order("position", { ascending: true });

    ((planPlaces || []) as ChatPlanPlacePreviewRow[]).forEach((place) => {
      if (!place.place_name) {
        return;
      }

      const current = planPlacesByPlanId.get(place.plan_id) || [];
      current.push({
        address: place.place_address,
        city: place.place_city,
        imageUrl: place.place_image_url,
        name: place.place_name
      });
      planPlacesByPlanId.set(place.plan_id, current);
    });
  }

  return rows.flatMap((row) => {
    if (!isGroupChatMessageKind(row.kind)) {
      return [];
    }

    const profile = profileById.get(row.sender_id);
    const plan = row.plan_id ? planById.get(row.plan_id) : null;
    const poll = row.poll_id ? pollById.get(row.poll_id) : null;
    const place = row.place_id ? placeById.get(row.place_id) : null;
    return [
      {
        id: row.id,
        groupId: row.group_id,
        senderId: row.sender_id,
        senderUsername: profile?.username ?? null,
        senderAvatarUrl: profile?.avatarUrl ?? null,
        content: row.content,
        kind: row.kind,
        planId: row.plan_id,
        planPlaces: row.plan_id ? (planPlacesByPlanId.get(row.plan_id) || []) : [],
        planPlannedDate: plan?.planned_date ?? null,
        planTitle: plan?.title ?? null,
        pollId: row.poll_id,
        pollTitle: poll?.title ?? null,
        placeId: row.place_id,
        placeAddress: place?.address ?? null,
        placeImageUrl: place?.image_url ?? null,
        placeName: place?.name ?? null,
        placeRating: place?.rating ?? null,
        placeUserRatingsTotal: place?.user_ratings_total ?? null,
        planPlaceId: row.plan_place_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    ];
  });
}

export async function getGroupChatUnreadCountForUser(userId: string, groupId: string): Promise<number> {
  const hasAccess = await isGroupMember(userId, groupId);
  if (!hasAccess) {
    return 0;
  }

  const supabase = await createSupabaseServerClient();
  const { data: readState } = await supabase
    .from("group_chat_reads")
    .select("last_read_at")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  let query = supabase
    .from("group_chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .neq("sender_id", userId);

  if (readState?.last_read_at) {
    query = query.gt("created_at", readState.last_read_at);
  }

  const { count, error } = await query;
  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getGroupChatUnreadSummariesForUser(userId: string): Promise<GroupChatUnreadSummary[]> {
  const supabase = await createSupabaseServerClient();
  const membershipResult = await supabase.from("group_members").select("group_id").eq("user_id", userId);
  const groupIds = (membershipResult.data || []).map((item) => item.group_id);

  if (groupIds.length === 0) {
    return [];
  }

  const [readsResult, messagesResult, groupsResult] = await Promise.all([
    supabase.from("group_chat_reads").select("group_id, last_read_at").eq("user_id", userId).in("group_id", groupIds),
    supabase
      .from("group_chat_messages")
      .select("group_id, sender_id, created_at")
      .in("group_id", groupIds)
      .neq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("groups").select("id, name").in("id", groupIds)
  ]);

  const lastReadAtByGroupId = new Map((readsResult.data || []).map((row) => [row.group_id, row.last_read_at]));
  const groupNameById = new Map((groupsResult.data || []).map((group) => [group.id, group.name]));
  const summaryByGroupId = new Map<string, GroupChatUnreadSummary>();

  (messagesResult.data || []).forEach((message) => {
    const lastReadAt = lastReadAtByGroupId.get(message.group_id);
    if (lastReadAt && new Date(message.created_at).getTime() <= new Date(lastReadAt).getTime()) {
      return;
    }

    const existing = summaryByGroupId.get(message.group_id);
    if (!existing) {
      summaryByGroupId.set(message.group_id, {
        groupId: message.group_id,
        groupName: groupNameById.get(message.group_id) || "Grupo",
        latestMessageAt: message.created_at,
        unreadCount: 1
      });
      return;
    }

    existing.unreadCount += 1;
    if (new Date(message.created_at).getTime() > new Date(existing.latestMessageAt).getTime()) {
      existing.latestMessageAt = message.created_at;
    }
  });

  return Array.from(summaryByGroupId.values()).sort(
    (a, b) => new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime()
  );
}

export async function markGroupChatAsReadForUser(input: MarkGroupChatReadInput): Promise<{ error: string | null }> {
  if (!input.lastReadAt) {
    return { error: null };
  }

  const hasAccess = await isGroupMember(input.userId, input.groupId);
  if (!hasAccess) {
    return { error: "No tienes permisos para leer este chat." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("group_chat_reads")
    .upsert(
      {
        group_id: input.groupId,
        user_id: input.userId,
        last_read_at: input.lastReadAt
      },
      { onConflict: "group_id,user_id" }
    );

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function createGroupChatMessage(input: CreateGroupChatMessageInput): Promise<{ error: string | null }> {
  const hasAccess = await isGroupMember(input.userId, input.groupId);
  if (!hasAccess) {
    return { error: "No tienes permisos para escribir en este grupo." };
  }

  const content = input.content.trim();
  const kind = input.kind ?? "message";
  const hasContext =
    (kind === "plan_suggestion" && Boolean(input.planId)) ||
    (kind === "place_comment" && Boolean(input.placeId)) ||
    (kind === "poll" && Boolean(input.pollId));
  if (!content && !hasContext) {
    return { error: "Escribe un mensaje o adjunta un lugar, plan o encuesta." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("group_chat_messages").insert({
    group_id: input.groupId,
    sender_id: input.userId,
    content,
    kind,
    plan_id: input.planId ?? null,
    poll_id: input.pollId ?? null,
    place_id: input.placeId ?? null,
    plan_place_id: input.planPlaceId ?? null
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function deleteGroupChatMessage(input: DeleteGroupChatMessageInput): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: message, error: messageError } = await supabase
    .from("group_chat_messages")
    .select("id, group_id, sender_id")
    .eq("id", input.messageId)
    .eq("group_id", input.groupId)
    .maybeSingle();

  if (messageError || !message) {
    return { error: "No se encontro el mensaje." };
  }

  if (message.sender_id !== input.userId) {
    return { error: "Solo puedes eliminar tus mensajes." };
  }

  const { error } = await supabase.from("group_chat_messages").delete().eq("id", input.messageId).eq("sender_id", input.userId);
  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
