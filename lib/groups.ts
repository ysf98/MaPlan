import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupCoverImageUrl } from "@/lib/groups/covers";
import type {
  GroupDetail,
  GroupJoinRequestItem,
  GroupListItem,
  GroupMemberPreview,
  GroupMembersPreviewResult
} from "@/lib/groups/types";
import type { GroupJoinPolicy, GroupPrivacy } from "@/types/supabase";

function isGroupRole(value: string): value is "owner" | "member" {
  return value === "owner" || value === "member";
}

function isGroupJoinPolicy(value: string): value is GroupJoinPolicy {
  return value === "invite_only" || value === "open_by_code" || value === "request_to_join";
}

function isGroupPrivacy(value: string): value is GroupPrivacy {
  return value === "privado" || value === "abierto";
}

function isGroupJoinRequestStatus(value: string): value is GroupJoinRequestItem["status"] {
  return value === "pending" || value === "approved" || value === "rejected";
}

function hasTypedPolicies<T extends { privacy: string; join_policy: string }>(
  group: T
): group is T & { privacy: GroupPrivacy; join_policy: GroupJoinPolicy } {
  return isGroupPrivacy(group.privacy) && isGroupJoinPolicy(group.join_policy);
}

type GroupOwnerRecord = {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  role: "owner";
};

async function getGroupOwnerRecord(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  groupId: string
): Promise<GroupOwnerRecord | null> {
  const groupResult = await supabase.from("groups").select("created_by").eq("id", groupId).maybeSingle();
  const ownerUserId = groupResult.data?.created_by;

  if (groupResult.error || !ownerUserId) {
    return null;
  }

  const ownerProfileResult = await supabase.from("profiles").select("username, avatar_url").eq("id", ownerUserId).maybeSingle();

  return {
    userId: ownerUserId,
    username: ownerProfileResult.data?.username ?? null,
    avatarUrl: ownerProfileResult.data?.avatar_url ?? null,
    role: "owner"
  };
}

function normalizeGroupMembers(
  members: Array<{ user_id: string; username: string | null; avatar_url: string | null; role: string }>,
  ownerRecord: GroupOwnerRecord | null
): GroupMemberPreview[] {
  const normalizedMembers = members.flatMap((member) =>
    isGroupRole(member.role)
      ? [
          {
            userId: member.user_id,
            username: member.username ?? null,
            avatarUrl: member.avatar_url ?? null,
            role: member.role
          }
        ]
      : []
  );

  if (!ownerRecord || normalizedMembers.some((member) => member.userId === ownerRecord.userId)) {
    return normalizedMembers;
  }

  return [ownerRecord, ...normalizedMembers];
}

export async function getUserGroups(userId: string): Promise<GroupListItem[]> {
  const supabase = await createSupabaseServerClient();
  const [membershipsResult, createdGroupsResult] = await Promise.all([
    supabase.from("group_members").select("group_id, role").eq("user_id", userId),
    supabase
      .from("groups")
      .select("id, name, description, cover_image_url, created_at, privacy, join_policy")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
  ]);

  const memberships = membershipsResult.data || [];
  const roleEntries: Array<[string, "owner" | "member"]> = memberships.flatMap((membership) =>
    isGroupRole(membership.role) ? [[membership.group_id, membership.role]] : []
  );
  const roleByGroupId = new Map<string, "owner" | "member">(roleEntries);
  const memberGroupIds = memberships.map((membership) => membership.group_id);

  const memberGroupsResult =
    memberGroupIds.length > 0
      ? await supabase
          .from("groups")
          .select("id, name, description, cover_image_url, created_at, privacy, join_policy")
          .in("id", memberGroupIds)
      : { data: [], error: null };

  const mergedById = new Map<
    string,
    {
      id: string;
      name: string;
      description: string | null;
      cover_image_url: string | null;
      created_at: string;
      privacy: GroupListItem["privacy"];
      join_policy: GroupListItem["joinPolicy"];
    }
  >();

  (memberGroupsResult.data || []).filter(hasTypedPolicies).forEach((group) => mergedById.set(group.id, group));
  (createdGroupsResult.data || []).filter(hasTypedPolicies).forEach((group) => mergedById.set(group.id, group));

  return Array.from(mergedById.values())
    .map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      coverImageUrl: group.cover_image_url ?? null,
      createdAt: group.created_at,
      role: roleByGroupId.get(group.id) ?? "owner",
      privacy: group.privacy,
      joinPolicy: group.join_policy
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getGroupDetailForUser(userId: string, groupId: string): Promise<GroupDetail | null> {
  const supabase = await createSupabaseServerClient();
  const groupResult = await supabase
    .from("groups")
    .select("id, name, description, cover_image_url, join_code, created_at, privacy, join_policy, created_by")
    .eq("id", groupId)
    .maybeSingle();
  const { data: group, error: groupError } = groupResult;

  if (groupError || !group) {
    return null;
  }
  const membershipResult = await supabase
    .from("group_members")
    .select("role")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();
  const membership = membershipResult.data;
  const resolvedRole =
    membership && isGroupRole(membership.role) ? membership.role : group.created_by === userId ? "owner" : null;

  if (!resolvedRole || !isGroupPrivacy(group.privacy) || !isGroupJoinPolicy(group.join_policy)) {
    return null;
  }

  const canEditByRole = resolvedRole === "owner";
  const canEditByPrivacy = group.privacy === "abierto";
  const canEditPlaces = canEditByRole || canEditByPrivacy;
  const canEditGroup = canEditByRole || canEditByPrivacy;
  const canInviteMembers = canEditByRole || canEditByPrivacy;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    coverImageUrl: group.cover_image_url || getGroupCoverImageUrl(group.id),
    joinCode: group.join_code,
    createdAt: group.created_at,
    role: resolvedRole,
    privacy: group.privacy,
    joinPolicy: group.join_policy,
    canEditPlaces,
    canEditGroup,
    canInviteMembers
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
  const profilesResult = await supabase.rpc("get_profiles_by_ids", { p_ids: userIds });

  const usernameByUserId = new Map<string, string | null>();
  (profilesResult.data || []).forEach((profile) => {
    usernameByUserId.set(profile.id, profile.username);
  });

  return requestsResult.data.flatMap((request) => {
      if (!isGroupJoinRequestStatus(request.status)) {
        return [];
      }

      return [
        {
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
        }
      ];
    });
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

  const profilesResult = await supabase.rpc("get_profiles_by_ids", { p_ids: relatedUserIds });

  const usernameByUserId = new Map<string, string | null>();
  (profilesResult.data || []).forEach((profile) => {
    usernameByUserId.set(profile.id, profile.username);
  });

  return requestsResult.data.flatMap((request) => {
      if (!isGroupJoinRequestStatus(request.status)) {
        return [];
      }

      return [
        {
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
        }
      ];
    });
}

export async function getGroupMembersPreviewForUser(userId: string, groupId: string): Promise<GroupMembersPreviewResult> {
  const supabase = await createSupabaseServerClient();
  const ownerRecord = await getGroupOwnerRecord(supabase, groupId);
  const isOwnerWithoutMembership = ownerRecord?.userId === userId;
  const membershipResult = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if ((membershipResult.error || !membershipResult.data) && !isOwnerWithoutMembership) {
    return { members: [], total: 0 };
  }

  const previewRpc = await supabase.rpc("get_group_members_with_profiles", { p_group_id: groupId, p_limit: 8 });
  const countResult = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);
  const normalizedTotalBase = countResult.count ?? 0;

  if (!previewRpc.error) {
    const members = normalizeGroupMembers(previewRpc.data || [], ownerRecord);
    const total = ownerRecord && !members.some((member) => member.userId === ownerRecord.userId)
      ? normalizedTotalBase + 1
      : Math.max(normalizedTotalBase, members.length);

    return { members, total };
  }

  if (ownerRecord?.userId === userId) {
    return { members: [ownerRecord], total: Math.max(normalizedTotalBase, 1) };
  }

  const ownProfileResult = await supabase.from("profiles").select("id, username, avatar_url").eq("id", userId).maybeSingle();
  const ownProfile = ownProfileResult.data;
  return {
    members: [{ userId, username: ownProfile?.username ?? null, avatarUrl: ownProfile?.avatar_url ?? null, role: "member" }],
    total: normalizedTotalBase
  };
}

export async function getGroupMembersForUser(userId: string, groupId: string): Promise<GroupMemberPreview[]> {
  const supabase = await createSupabaseServerClient();
  const ownerRecord = await getGroupOwnerRecord(supabase, groupId);
  const isOwnerWithoutMembership = ownerRecord?.userId === userId;
  const membershipResult = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if ((membershipResult.error || !membershipResult.data) && !isOwnerWithoutMembership) {
    return [];
  }

  const membersRpc = await supabase.rpc("get_group_members_with_profiles", { p_group_id: groupId });
  if (membersRpc.error) {
    return ownerRecord?.userId === userId ? [ownerRecord] : [];
  }

  return normalizeGroupMembers(membersRpc.data || [], ownerRecord);
}
