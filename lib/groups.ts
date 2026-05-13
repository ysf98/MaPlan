import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupDetail, GroupListItem } from "@/lib/groups/types";

export async function getUserGroups(userId: string): Promise<GroupListItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data: memberships, error: membershipsError } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", userId);

  if (membershipsError || !memberships || memberships.length === 0) {
    return [];
  }

  const roleByGroupId = new Map(memberships.map((membership) => [membership.group_id, membership.role]));
  const groupIds = memberships.map((membership) => membership.group_id);

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, description, created_at")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (groupsError || !groups) {
    return [];
  }

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: group.created_at,
    role: roleByGroupId.get(group.id) ?? "member"
  }));
}

export async function getGroupDetailForUser(userId: string, groupId: string): Promise<GroupDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("role")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, description, join_code, created_at")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError || !group) {
    return null;
  }

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    joinCode: group.join_code,
    createdAt: group.created_at,
    role: membership.role
  };
}
