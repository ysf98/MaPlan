import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  GroupDetail,
  GroupJoinRequestItem,
  GroupListItem,
  GroupMemberPreview,
  GroupMembersPreviewResult
} from "@/lib/groups/types";

export async function getUserGroups(userId: string): Promise<GroupListItem[]> {
  const supabase = await createSupabaseServerClient();
  const [membershipsResult, createdGroupsResult] = await Promise.all([
    supabase.from("group_members").select("group_id, role").eq("user_id", userId),
    supabase
      .from("groups")
      .select("id, name, description, created_at, place_edit_policy, join_policy")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
  ]);

  const memberships = membershipsResult.data || [];
  const roleByGroupId = new Map(memberships.map((membership) => [membership.group_id, membership.role]));
  const memberGroupIds = memberships.map((membership) => membership.group_id);

  const memberGroupsResult =
    memberGroupIds.length > 0
      ? await supabase
          .from("groups")
          .select("id, name, description, created_at, place_edit_policy, join_policy")
          .in("id", memberGroupIds)
      : { data: [], error: null };

  const mergedById = new Map<
    string,
    {
      id: string;
      name: string;
      description: string | null;
      created_at: string;
      place_edit_policy: GroupListItem["placeEditPolicy"];
      join_policy: GroupListItem["joinPolicy"];
    }
  >();

  (memberGroupsResult.data || []).forEach((group) => mergedById.set(group.id, group));
  (createdGroupsResult.data || []).forEach((group) => mergedById.set(group.id, group));

  return Array.from(mergedById.values())
    .map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.created_at,
      role: roleByGroupId.get(group.id) ?? "owner",
      placeEditPolicy: group.place_edit_policy,
      joinPolicy: group.join_policy
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getGroupDetailForUser(userId: string, groupId: string): Promise<GroupDetail | null> {
  const supabase = await createSupabaseServerClient();
  const membershipResult = await supabase
    .from("group_members")
    .select("role")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();
  const { data: membership, error: membershipError } = membershipResult;

  if (membershipError || !membership) {
    return null;
  }

  const groupResult = await supabase
    .from("groups")
    .select("id, name, description, join_code, created_at, place_edit_policy, join_policy")
    .eq("id", groupId)
    .maybeSingle();
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
    role: membership.role,
    placeEditPolicy: group.place_edit_policy,
    joinPolicy: group.join_policy,
    canEditPlaces: membership.role === "owner" || group.place_edit_policy === "members_can_edit"
  };
}

export async function getPendingJoinRequestsForOwner(userId: string, groupId: string): Promise<GroupJoinRequestItem[]> {
  const supabase = await createSupabaseServerClient();
  const ownerMembershipResult = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle();

  if (ownerMembershipResult.error || !ownerMembershipResult.data) {
    return [];
  }

  const requestsResult = await supabase
    .from("group_join_requests")
    .select("id, group_id, user_id, message, status, created_at, updated_at, reviewed_at, reviewed_by")
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });


  if (requestsResult.error || !requestsResult.data || requestsResult.data.length === 0) {
    return [];
  }

  const userIds = requestsResult.data.map((request) => request.user_id);
  const profilesResult = await supabase.from("profiles").select("id, username").in("id", userIds);

  const usernameByUserId = new Map<string, string | null>();
  (profilesResult.data || []).forEach((profile) => {
    usernameByUserId.set(profile.id, profile.username);
  });

  return requestsResult.data.map((request) => ({
    id: request.id,
    groupId: request.group_id,
    userId: request.user_id,
    username: usernameByUserId.get(request.user_id) ?? null,
    userEmail: null,
    message: request.message,
    status: request.status,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    reviewedAt: request.reviewed_at,
    reviewedByUserId: request.reviewed_by,
    reviewedByUsername: null
  }));
}

export async function getReviewedJoinRequestsForOwner(userId: string, groupId: string): Promise<GroupJoinRequestItem[]> {
  const supabase = await createSupabaseServerClient();
  const ownerMembershipResult = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle();


  if (ownerMembershipResult.error || !ownerMembershipResult.data) {
    return [];
  }

  const requestsResult = await supabase
    .from("group_join_requests")
    .select("id, group_id, user_id, message, status, created_at, updated_at, reviewed_at, reviewed_by")
    .eq("group_id", groupId)
    .in("status", ["approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(8);


  if (requestsResult.error || !requestsResult.data || requestsResult.data.length === 0) {
    return [];
  }

  const relatedUserIds = Array.from(
    new Set(
      requestsResult.data
        .flatMap((request) => [request.user_id, request.reviewed_by].filter((value): value is string => Boolean(value)))
    )
  );

  const profilesResult = await supabase.from("profiles").select("id, username").in("id", relatedUserIds);

  const usernameByUserId = new Map<string, string | null>();
  (profilesResult.data || []).forEach((profile) => {
    usernameByUserId.set(profile.id, profile.username);
  });

  return requestsResult.data.map((request) => ({
    id: request.id,
    groupId: request.group_id,
    userId: request.user_id,
    username: usernameByUserId.get(request.user_id) ?? null,
    userEmail: null,
    message: request.message,
    status: request.status,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    reviewedAt: request.reviewed_at,
    reviewedByUserId: request.reviewed_by,
    reviewedByUsername: request.reviewed_by ? (usernameByUserId.get(request.reviewed_by) ?? null) : null
  }));
}

export async function getGroupMembersPreviewForUser(userId: string, groupId: string): Promise<GroupMembersPreviewResult> {
  const supabase = await createSupabaseServerClient();
  const membershipResult = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipResult.error || !membershipResult.data) {
    return { members: [], allMembers: [], total: 0 };
  }

  const previewRpc = await supabase.rpc("get_group_members_with_profiles", { p_group_id: groupId, p_limit: 8 });
  const allRpc = await supabase.rpc("get_group_members_with_profiles", { p_group_id: groupId, p_limit: null });

  if (!previewRpc.error && !allRpc.error) {
    const members =
      (previewRpc.data || []).map((member) => ({
        userId: member.user_id,
        username: member.username ?? null,
        avatarUrl: member.avatar_url ?? null,
        role: member.role as "owner" | "member"
      })) || [];

    const allMembers =
      (allRpc.data || []).map((member) => ({
        userId: member.user_id,
        username: member.username ?? null,
        avatarUrl: member.avatar_url ?? null,
        role: member.role as "owner" | "member"
      })) || [];

    return { members, allMembers, total: allMembers.length };
  }

  const countResult = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);
  const total = countResult.count ?? 0;
  const ownMemberResult = await supabase
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (ownMemberResult.error || !ownMemberResult.data) {
    return { members: [], allMembers: [], total };
  }

  const ownProfilesResult = await supabase.rpc("get_profiles_by_ids", { p_ids: [userId] });
  const ownProfile = (ownProfilesResult.data || [])[0];
  const ownMember = {
    userId,
    username: ownProfile?.username ?? null,
    avatarUrl: ownProfile?.avatar_url ?? null,
    role: ownMemberResult.data.role
  };
  return { members: [ownMember], allMembers: [ownMember], total };
}
