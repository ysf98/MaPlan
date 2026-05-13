"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createGroupSchema, joinGroupSchema } from "@/lib/validation/schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function isRlsError(error: { code?: string } | null | undefined) {
  return error?.code === "42501";
}

export async function createGroupAction(
  _previousState: CreateGroupActionState = INITIAL_STATE,
  formData: FormData
): Promise<CreateGroupActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const parsedInput = createGroupSchema.safeParse({
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    placeEditPolicy: String(formData.get("placeEditPolicy") || ""),
    joinPolicy: String(formData.get("joinPolicy") || "")
  });

  if (!parsedInput.success) {
    return { error: parsedInput.error.issues[0]?.message ?? "Datos invalidos.", success: false, groupId: null };
  }

  const { name, description, placeEditPolicy, joinPolicy } = parsedInput.data;

  const supabase = await createSupabaseServerClient();
  const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : null;
  let createdGroupId: string | null = null;
  let lastErrorMessage = "No se pudo crear el grupo. Intentalo otra vez.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const joinCode = createJoinCode();
    const groupInsertPayload = {
      name,
      description,
      created_by: user.id,
      join_code: joinCode,
      place_edit_policy: placeEditPolicy,
      join_policy: joinPolicy
    };
    let groupResult = await supabase.from("groups").insert(groupInsertPayload).select("id").single();
    if (isRlsError(groupResult.error) && adminClient) {
      groupResult = await adminClient.from("groups").insert(groupInsertPayload).select("id").single();
    }

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
  let memberInsertResult = await supabase.from("group_members").insert(memberInsertPayload);
  if (isRlsError(memberInsertResult.error) && adminClient) {
    memberInsertResult = await adminClient.from("group_members").insert(memberInsertPayload);
  }

  const { error: memberError } = memberInsertResult;

  if (memberError) {
    if (adminClient) {
      await adminClient.from("groups").delete().eq("id", createdGroupId);
    } else {
      await supabase.from("groups").delete().eq("id", createdGroupId);
    }
    return { error: memberError.message, success: false, groupId: null };
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  return { error: null, success: true, groupId: createdGroupId };
}

export async function joinGroupAction(
  _previousState: JoinGroupActionState = JOIN_INITIAL_STATE,
  formData: FormData
): Promise<JoinGroupActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const parsedInput = joinGroupSchema.safeParse({
    joinCode: String(formData.get("joinCode") || "")
  });

  if (!parsedInput.success) {
    return {
      error: parsedInput.error.issues[0]?.message ?? "Datos invalidos.",
      success: false,
      groupId: null,
      mode: null
    };
  }
  const { joinCode } = parsedInput.data;

  const supabase = await createSupabaseServerClient();
  const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : null;
  let groupResult = await supabase.from("groups").select("id, join_policy").eq("join_code", joinCode).maybeSingle();
  if ((groupResult.error?.code === "42501" || (!groupResult.error && !groupResult.data)) && adminClient) {
    groupResult = await adminClient.from("groups").select("id, join_policy").eq("join_code", joinCode).maybeSingle();
  }

  const { data: group, error: groupError } = groupResult;

  if (groupError || !group) {
    return { error: "No existe ningun grupo con ese codigo.", success: false, groupId: null, mode: null };
  }

  const joinPolicy = group.join_policy as GroupJoinPolicy;

  if (joinPolicy === "request_to_join") {
    const requestPayload = {
      group_id: group.id,
      user_id: user.id,
      status: "pending" as const,
      message: null,
      reviewed_by: null,
      reviewed_at: null
    };
    let requestResult = await supabase.from("group_join_requests").upsert(requestPayload, { onConflict: "group_id,user_id" });

    if (requestResult.error) {
      return { error: requestResult.error.message, success: false, groupId: null, mode: null };
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
