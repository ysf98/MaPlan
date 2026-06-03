import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupPrivacy } from "@/types/supabase";

export type GroupMembership = {
  role: "owner" | "member";
};

function isGroupRole(value: string): value is GroupMembership["role"] {
  return value === "owner" || value === "member";
}

function isGroupPrivacy(value: string): value is GroupPrivacy {
  return value === "privado" || value === "abierto";
}

async function isGroupCreator(userId: string, groupId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .eq("created_by", userId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function isGroupMember(userId: string, groupId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("id")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (!error && data) {
    return true;
  }

  return isGroupCreator(userId, groupId);
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

  if (!error && data) {
    return true;
  }

  return isGroupCreator(userId, groupId);
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
    return (await isGroupCreator(userId, groupId)) ? { role: "owner" } : null;
  }

  if (!isGroupRole(data.role)) {
    return (await isGroupCreator(userId, groupId)) ? { role: "owner" } : null;
  }

  return { role: data.role };
}

async function getGroupPolicies(groupId: string): Promise<{
  privacy: GroupPrivacy;
} | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("groups")
    .select("privacy")
    .eq("id", groupId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (!isGroupPrivacy(data.privacy)) {
    return null;
  }

  return {
    privacy: data.privacy
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

  if (policies.privacy === "abierto") {
    return true;
  }

  return false;
}

export async function canEditGroupDetails(userId: string, groupId: string): Promise<boolean> {
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

  return policies.privacy === "abierto";
}

export async function canInviteToGroup(userId: string, groupId: string): Promise<boolean> {
  return canEditGroupDetails(userId, groupId);
}

export async function canReviewJoinRequests(userId: string, groupId: string): Promise<boolean> {
  return isGroupOwner(userId, groupId);
}

export async function canChangeGroupPrivacy(userId: string, groupId: string): Promise<boolean> {
  return isGroupOwner(userId, groupId);
}
