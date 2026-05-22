import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupMembersPreviewForUser } from "@/lib/groups";
import { getGroupCoverImageUrl } from "@/lib/groups/covers";
import type { GroupListItem, GroupMemberPreview } from "@/lib/groups/types";

export type DashboardGroupSummary = GroupListItem & {
  coverImageUrl: string;
  memberCount: number;
  members: GroupMemberPreview[];
  placeCount: number;
};

export type DashboardPlaceStats = {
  pendingPlaceCount: number;
  totalPlaceCount: number;
};

type DashboardPlaceStatusRow = {
  status: string | null;
};

type DashboardGroupIdRow = {
  group_id: string;
};

export async function getDashboardPlaceStats(groupIds: string[]): Promise<DashboardPlaceStats> {
  if (groupIds.length === 0) {
    return { pendingPlaceCount: 0, totalPlaceCount: 0 };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("places").select("status").in("group_id", groupIds);

  if (error || !data) {
    return { pendingPlaceCount: 0, totalPlaceCount: 0 };
  }

  const places = data as DashboardPlaceStatusRow[];

  return {
    pendingPlaceCount: places.filter((place) => place.status === "pending").length,
    totalPlaceCount: places.length
  };
}

export async function getDashboardGroupSummaries(
  userId: string,
  groups: GroupListItem[],
  limit = 4
): Promise<DashboardGroupSummary[]> {
  const visibleGroups = groups.slice(0, limit);
  const groupIds = visibleGroups.map((group) => group.id);

  if (groupIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [placesResult, membersResult, previews] = await Promise.all([
    supabase.from("places").select("group_id").in("group_id", groupIds),
    supabase.from("group_members").select("group_id").in("group_id", groupIds),
    Promise.all(groupIds.map((groupId) => getGroupMembersPreviewForUser(userId, groupId)))
  ]);

  const placeCountByGroupId = new Map<string, number>();
  const places = (placesResult.data || []) as DashboardGroupIdRow[];
  const members = (membersResult.data || []) as DashboardGroupIdRow[];

  places.forEach((place) => {
    placeCountByGroupId.set(place.group_id, (placeCountByGroupId.get(place.group_id) || 0) + 1);
  });

  const memberCountByGroupId = new Map<string, number>();
  members.forEach((member) => {
    memberCountByGroupId.set(member.group_id, (memberCountByGroupId.get(member.group_id) || 0) + 1);
  });

  return visibleGroups.map((group, index) => ({
    ...group,
    coverImageUrl: group.coverImageUrl || getGroupCoverImageUrl(group.id),
    memberCount: previews[index]?.total || memberCountByGroupId.get(group.id) || 1,
    members: previews[index]?.members || [],
    placeCount: placeCountByGroupId.get(group.id) || 0
  }));
}
