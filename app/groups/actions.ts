"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createGroupSchema, joinGroupSchema } from "@/lib/validation/schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CreateGroupActionState = {
  error: string | null;
  success: boolean;
  groupId: string | null;
};

export type JoinGroupActionState = {
  error: string | null;
  success: boolean;
  groupId: string | null;
};

const INITIAL_STATE: CreateGroupActionState = {
  error: null,
  success: false,
  groupId: null
};

const JOIN_INITIAL_STATE: JoinGroupActionState = {
  error: null,
  success: false,
  groupId: null
};

function createJoinCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
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
    description: String(formData.get("description") || "")
  });

  if (!parsedInput.success) {
    return { error: parsedInput.error.issues[0]?.message ?? "Datos invalidos.", success: false, groupId: null };
  }

  const { name, description } = parsedInput.data;

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return {
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.",
      success: false,
      groupId: null
    };
  }
  let createdGroupId: string | null = null;
  let lastErrorMessage = "No se pudo crear el grupo. Intentalo otra vez.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const joinCode = createJoinCode();
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name,
        description,
        created_by: user.id,
        join_code: joinCode
      })
      .select("id")
      .single();

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

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: createdGroupId,
    user_id: user.id,
    role: "owner"
  });

  if (memberError) {
    await supabase.from("groups").delete().eq("id", createdGroupId);
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
      groupId: null
    };
  }
  const { joinCode } = parsedInput.data;

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return {
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.",
      success: false,
      groupId: null
    };
  }
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (groupError || !group) {
    return { error: "No existe ningun grupo con ese codigo.", success: false, groupId: null };
  }

  const { data: existingMembership, error: existingMembershipError } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembershipError) {
    return { error: existingMembershipError.message, success: false, groupId: null };
  }

  if (!existingMembership) {
    const { error: insertMembershipError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "member"
    });

    if (insertMembershipError) {
      return { error: insertMembershipError.message, success: false, groupId: null };
    }
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard");

  return { error: null, success: true, groupId: group.id };
}
