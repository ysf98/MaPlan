"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { inviteFriendToGroup } from "@/lib/groupInvitations";
import { createGroupSchema, joinGroupSchema } from "@/lib/validation/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupJoinPolicy } from "@/types/supabase";

export type CreateGroupActionState = {
  error: string | null;
  success: boolean;
  groupId: string | null;
};

export type JoinGroupActionState = {
  error: string | null;
  success: boolean;
  groupId: string | null;
  mode: "joined" | "requested" | null;
};

const INITIAL_STATE: CreateGroupActionState = {
  error: null,
  success: false,
  groupId: null
};

const JOIN_INITIAL_STATE: JoinGroupActionState = {
  error: null,
  success: false,
  groupId: null,
  mode: null
};

function createJoinCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const values = randomBytes(8);
  let code = "";
  for (const value of values) {
    code += alphabet[value % alphabet.length];
  }
  return code;
}

export async function createGroupAction(
  _previousState: CreateGroupActionState = INITIAL_STATE,
  formData: FormData
): Promise<CreateGroupActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = createGroupSchema.safeParse({
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    coverImageUrl: String(formData.get("coverImageUrl") || ""),
    privacy: String(formData.get("privacy") || ""),
    joinPolicy: String(formData.get("joinPolicy") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false, groupId: null };
  }

  const { name, description, coverImageUrl, privacy, joinPolicy } = parsedInput.data;
  const selectedFriendIds = Array.from(
    new Set(
      formData
        .getAll("selectedFriendIds")
        .map((value) => String(value))
        .filter((value) => /^[0-9a-f-]{36}$/i.test(value))
    )
  );

  const supabase = await createSupabaseServerClient();
  let createdGroupId: string | null = null;
  let lastErrorMessage = "No se pudo crear el grupo. Intentalo otra vez.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const joinCode = createJoinCode();
    const groupInsertPayload = {
      name,
      description,
      cover_image_url: coverImageUrl,
      created_by: user.id,
      join_code: joinCode,
      privacy,
      join_policy: joinPolicy || "invite_only"
    };
    const groupResult = await supabase.from("groups").insert(groupInsertPayload).select("id").single();

    const { data: group, error: groupError } = groupResult;

    if (groupError || !group) {
      if (groupError?.message) {
        lastErrorMessage = groupError.message;
      }
      continue;
    }

    createdGroupId = group.id;
    break;
  }

  if (!createdGroupId) {
    return { error: lastErrorMessage, success: false, groupId: null };
  }

  const memberInsertPayload = {
    group_id: createdGroupId,
    user_id: user.id,
    role: "owner" as const
  };
  const memberInsertResult = await supabase.from("group_members").insert(memberInsertPayload);

  const { error: memberError } = memberInsertResult;

  if (memberError) {
    await supabase.from("groups").delete().eq("id", createdGroupId);
    return { error: memberError.message, success: false, groupId: null };
  }

  if (selectedFriendIds.length > 0) {
    const inviteResults = await Promise.all(
      selectedFriendIds.map((friendUserId) => inviteFriendToGroup(user.id, createdGroupId, friendUserId))
    );
    const firstInviteError = inviteResults.find((result) => result.error)?.error;
    if (firstInviteError) {
      return {
        error: `Grupo creado, pero falló al invitar amigos: ${firstInviteError}`,
        success: false,
        groupId: createdGroupId
      };
    }
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  revalidatePath("/invitations");
  return { error: null, success: true, groupId: createdGroupId };
}

export async function joinGroupAction(
  _previousState: JoinGroupActionState = JOIN_INITIAL_STATE,
  formData: FormData
): Promise<JoinGroupActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = joinGroupSchema.safeParse({
    joinCode: String(formData.get("joinCode") || "")
  });

  if (!parsedInput.success) {
    return {
      error: getValidationErrorMessage(parsedInput.error),
      success: false,
      groupId: null,
      mode: null
    };
  }
  const { joinCode } = parsedInput.data;

  const supabase = await createSupabaseServerClient();
  const groupResult = await supabase.from("groups").select("id, join_policy").eq("join_code", joinCode).maybeSingle();

  const { data: group, error: groupError } = groupResult;

  if (groupError || !group) {
    return { error: "No existe ningun grupo con ese codigo.", success: false, groupId: null, mode: null };
  }

  const joinPolicy = group.join_policy as GroupJoinPolicy;

  if (joinPolicy === "invite_only") {
    return { error: "Este grupo solo permite acceso por invitacion.", success: false, groupId: null, mode: null };
  }

  if (joinPolicy === "request_to_join") {
    const existingRequestResult = await supabase
      .from("group_join_requests")
      .select("id, status")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRequestResult.error) {
      return { error: existingRequestResult.error.message, success: false, groupId: null, mode: null };
    }

    if (!existingRequestResult.data) {
      const insertPayload = {
        group_id: group.id,
        user_id: user.id,
        status: "pending" as const,
        message: null,
        reviewed_by: null,
        reviewed_at: null
      };
      const insertResult = await supabase.from("group_join_requests").insert(insertPayload);
      if (insertResult.error) {
        return { error: insertResult.error.message, success: false, groupId: null, mode: null };
      }
    } else if (existingRequestResult.data.status !== "pending") {
      const updatePayload = {
        status: "pending" as const,
        reviewed_by: null,
        reviewed_at: null
      };
      const updateResult = await supabase
        .from("group_join_requests")
        .update(updatePayload)
        .eq("id", existingRequestResult.data.id);
      if (updateResult.error) {
        return { error: updateResult.error.message, success: false, groupId: null, mode: null };
      }
    }

    revalidatePath("/groups");
    return { error: null, success: true, groupId: group.id, mode: "requested" };
  }

  let existingMembershipResult = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: existingMembership, error: existingMembershipError } = existingMembershipResult;

  if (existingMembershipError) {
    return { error: existingMembershipError.message, success: false, groupId: null, mode: null };
  }

  if (!existingMembership) {
    const insertPayload = {
      group_id: group.id,
      user_id: user.id,
      role: "member" as const
    };
    let insertMembershipResult = await supabase.from("group_members").insert(insertPayload);

    const { error: insertMembershipError } = insertMembershipResult;

    if (insertMembershipError) {
      return { error: insertMembershipError.message, success: false, groupId: null, mode: null };
    }
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard");

  return { error: null, success: true, groupId: group.id, mode: "joined" };
}
