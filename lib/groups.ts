import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupDetail, GroupListItem } from "@/lib/groups/types";

export async function getUserGroups(userId: string): Promise<GroupListItem[]> {
  const supabase = await createSupabaseServerClient();
  const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : null;

  let membershipsResult = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", userId);

  if (membershipsResult.error?.code === "42501" && adminClient) {
    membershipsResult = await adminClient.from("group_members").select("group_id, role").eq("user_id", userId);
  }
  const { data: memberships, error: membershipsError } = membershipsResult;

  if (membershipsError || !memberships || memberships.length === 0) {
    return [];
  }

  const roleByGroupId = new Map(memberships.map((membership) => [membership.group_id, membership.role]));
  const groupIds = memberships.map((membership) => membership.group_id);

  let groupsResult = await supabase
    .from("groups")
    .select("id, name, description, created_at")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (groupsResult.error?.code === "42501" && adminClient) {
    groupsResult = await adminClient
      .from("groups")
      .select("id, name, description, created_at")
      .in("id", groupIds)
      .order("created_at", { ascending: false });
  }
  const { data: groups, error: groupsError } = groupsResult;

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
  const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : null;

  let membershipResult = await supabase
    .from("group_members")
    .select("role")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (membershipResult.error?.code === "42501" && adminClient) {
    membershipResult = await adminClient
      .from("group_members")
      .select("role")
      .eq("user_id", userId)
      .eq("group_id", groupId)
      .maybeSingle();
  }
  const { data: membership, error: membershipError } = membershipResult;

  if (membershipError || !membership) {
    return null;
  }

  let groupResult = await supabase
    .from("groups")
    .select("id, name, description, join_code, created_at")
    .eq("id", groupId)
    .maybeSingle();

  if (groupResult.error?.code === "42501" && adminClient) {
    groupResult = await adminClient
      .from("groups")
      .select("id, name, description, join_code, created_at")
      .eq("id", groupId)
      .maybeSingle();
  }
  const { data: group, error: groupError } = groupResult;

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
