import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupJoinPolicy, GroupPlaceEditPolicy } from "@/types/supabase";

export type GroupMembership = {
  role: "owner" | "member";
};

export async function isGroupMember(userId: string, groupId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("id")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function isGroupOwner(userId: string, groupId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("id")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("role", "owner")
    .maybeSingle();

  return !error && Boolean(data);
}

export async function getGroupMembership(userId: string, groupId: string): Promise<GroupMembership | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("role")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { role: data.role };
}

async function getGroupPolicies(groupId: string): Promise<{
  placeEditPolicy: GroupPlaceEditPolicy;
  joinPolicy: GroupJoinPolicy;
} | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("groups")
    .select("place_edit_policy, join_policy")
    .eq("id", groupId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    placeEditPolicy: data.place_edit_policy,
    joinPolicy: data.join_policy
  };
}

export async function canEditPlaces(userId: string, groupId: string): Promise<boolean> {
  const membership = await getGroupMembership(userId, groupId);
  if (!membership) {
    return false;
  }

  if (membership.role === "owner") {
    return true;
  }

  const policies = await getGroupPolicies(groupId);
  if (!policies) {
    return false;
  }

  return policies.placeEditPolicy === "members_can_edit";
}

export async function canReviewJoinRequests(userId: string, groupId: string): Promise<boolean> {
  return isGroupOwner(userId, groupId);
}
