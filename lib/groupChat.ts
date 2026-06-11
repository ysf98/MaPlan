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
  place_id: string | null;
  plan_place_id: string | null;
  created_at: string;
  updated_at: string;
};

type CreateGroupChatMessageInput = {
  userId: string;
  groupId: string;
  content: string;
  kind?: GroupChatMessageKind;
  planId?: string | null;
  placeId?: string | null;
  planPlaceId?: string | null;
};

type DeleteGroupChatMessageInput = {
  userId: string;
  groupId: string;
  messageId: string;
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
  placeId: string | null;
  planPlaceId: string | null;
  createdAt: string;
  updatedAt: string;
};

function isGroupChatMessageKind(value: string): value is GroupChatMessageKind {
  return value === "message" || value === "plan_suggestion" || value === "place_comment";
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
    .select("id, group_id, sender_id, content, kind, plan_id, place_id, plan_place_id, created_at, updated_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error || !data) {
    return [];
  }

  const rows = data as GroupChatMessageRow[];
  const profileById = await getProfileMap(rows.map((row) => row.sender_id));

  return rows.flatMap((row) => {
    if (!isGroupChatMessageKind(row.kind)) {
      return [];
    }

    const profile = profileById.get(row.sender_id);
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
        placeId: row.place_id,
        planPlaceId: row.plan_place_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    ];
  });
}

export async function createGroupChatMessage(input: CreateGroupChatMessageInput): Promise<{ error: string | null }> {
  const hasAccess = await isGroupMember(input.userId, input.groupId);
  if (!hasAccess) {
    return { error: "No tienes permisos para escribir en este grupo." };
  }

  const content = input.content.trim();
  if (!content) {
    return { error: "Escribe un mensaje." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("group_chat_messages").insert({
    group_id: input.groupId,
    sender_id: input.userId,
    content,
    kind: input.kind ?? "message",
    plan_id: input.planId ?? null,
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
