import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFriends } from "@/lib/friends";

export type GroupInvitationItem = {
  id: string;
  groupId: string;
  groupName: string | null;
  invitedBy: string;
  invitedByUsername: string | null;
  invitedUserId: string;
  invitedUsername?: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
};

function isGroupInvitationStatus(value: string): value is GroupInvitationItem["status"] {
  return value === "pending" || value === "accepted" || value === "rejected";
}

export async function getGroupInvitationsForUser(userId: string): Promise<GroupInvitationItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data: invitations, error } = await supabase
    .from("group_invitations")
    .select("id, group_id, invited_by, invited_user_id, status, created_at, updated_at")
    .eq("invited_user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !invitations || invitations.length === 0) {
    return [];
  }

  const groupIds = invitations.map((item) => item.group_id);
  const inviterIds = invitations.map((item) => item.invited_by);

  const [{ data: groups }, { data: profiles }] = await Promise.all([
    supabase.from("groups").select("id, name").in("id", groupIds),
    supabase.rpc("get_profiles_by_ids", { p_ids: inviterIds })
  ]);

  const groupNameById = new Map((groups || []).map((group) => [group.id, group.name]));
  const inviterNameById = new Map((profiles || []).map((profile) => [profile.id, profile.username]));

  return invitations.flatMap((invitation) => {
      if (!isGroupInvitationStatus(invitation.status)) {
        return [];
      }

      return [
        {
          id: invitation.id,
          groupId: invitation.group_id,
          groupName: groupNameById.get(invitation.group_id) ?? null,
          invitedBy: invitation.invited_by,
          invitedByUsername: inviterNameById.get(invitation.invited_by) ?? null,
          invitedUserId: invitation.invited_user_id,
          invitedUsername: undefined,
          status: invitation.status,
          createdAt: invitation.created_at,
          updatedAt: invitation.updated_at
        }
      ];
    });
}

export async function getGroupInvitationsForGroup(ownerId: string, groupId: string): Promise<GroupInvitationItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data: ownerMembership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", ownerId)
    .eq("role", "owner")
    .maybeSingle();

  if (!ownerMembership) {
    return [];
  }

  const { data: invitations, error } = await supabase
    .from("group_invitations")
    .select("id, group_id, invited_by, invited_user_id, status, created_at, updated_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error || !invitations || invitations.length === 0) {
    return [];
  }

  const invitedIds = invitations.map((item) => item.invited_user_id);
  const { data: profiles } = await supabase.rpc("get_profiles_by_ids", { p_ids: invitedIds });
  const invitedNameById = new Map((profiles || []).map((profile) => [profile.id, profile.username]));

  return invitations.flatMap((invitation) => {
      if (!isGroupInvitationStatus(invitation.status)) {
        return [];
      }

      return [
        {
          id: invitation.id,
          groupId: invitation.group_id,
          groupName: null,
          invitedBy: invitation.invited_by,
          invitedByUsername: null,
          invitedUserId: invitation.invited_user_id,
          invitedUsername: invitedNameById.get(invitation.invited_user_id) ?? null,
          status: invitation.status,
          createdAt: invitation.created_at,
          updatedAt: invitation.updated_at
        }
      ];
    });
}

export async function getInvitableFriendsForGroup(ownerId: string, groupId: string): Promise<Array<{ id: string; username: string | null }>> {
  const supabase = await createSupabaseServerClient();
  const { data: ownerMembership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", ownerId)
    .eq("role", "owner")
    .maybeSingle();

  if (!ownerMembership) {
    return [];
  }

  const friends = await getFriends(ownerId);
  if (friends.length === 0) {
    return [];
  }

  const friendIds = friends.map((friend) => friend.userId);
  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase.from("group_members").select("user_id").eq("group_id", groupId).in("user_id", friendIds),
    supabase
      .from("group_invitations")
      .select("invited_user_id")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .in("invited_user_id", friendIds)
  ]);

  const blockedIds = new Set<string>([...(members || []).map((m) => m.user_id), ...(invitations || []).map((i) => i.invited_user_id)]);
  return friends.filter((friend) => !blockedIds.has(friend.userId)).map((friend) => ({ id: friend.userId, username: friend.username }));
}

export async function inviteFriendToGroup(ownerId: string, groupId: string, friendUserId: string): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: ownerMembership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", ownerId)
    .eq("role", "owner")
    .maybeSingle();

  if (!ownerMembership) {
    return { error: "Solo el owner puede invitar amigos." };
  }

  const { data: alreadyMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", friendUserId)
    .maybeSingle();
  if (alreadyMember) {
    return { error: "Ese usuario ya es miembro del grupo." };
  }

  const { data: existingInvitation } = await supabase
    .from("group_invitations")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("invited_user_id", friendUserId)
    .maybeSingle();

  if (existingInvitation?.status === "pending") {
    return { error: "Ya existe una invitacion pendiente para este usuario." };
  }

  if (existingInvitation) {
    const { error: updateError } = await supabase
      .from("group_invitations")
      .update({ status: "pending", invited_by: ownerId })
      .eq("id", existingInvitation.id);
    return { error: updateError ? updateError.message : null };
  }

  const { error } = await supabase.from("group_invitations").insert({
    group_id: groupId,
    invited_by: ownerId,
    invited_user_id: friendUserId,
    status: "pending"
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function respondGroupInvitation(
  userId: string,
  invitationId: string,
  decision: "accepted" | "rejected"
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  if (decision === "accepted") {
    const { error } = await supabase.rpc("accept_group_invitation", { invitation_id: invitationId });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("group_invitations")
    .select("id, invited_user_id, status")
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError || !invitation) {
    return { error: "Invitacion no encontrada." };
  }

  if (invitation.invited_user_id !== userId) {
    return { error: "No tienes permisos para responder esta invitacion." };
  }

  if (invitation.status !== "pending") {
    return { error: "Esta invitacion ya fue respondida." };
  }

  const { error: updateError } = await supabase.from("group_invitations").update({ status: "rejected" }).eq("id", invitationId);
  if (updateError) {
    return { error: updateError.message };
  }

  return { error: null };
}
