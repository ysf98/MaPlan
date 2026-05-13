"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export type CreateGroupActionState = {
  error: string | null;
  success: boolean;
};

const INITIAL_STATE: CreateGroupActionState = {
  error: null,
  success: false
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

  const name = String(formData.get("name") || "").trim();
  const descriptionValue = String(formData.get("description") || "").trim();
  const description = descriptionValue.length > 0 ? descriptionValue : null;

  if (!name) {
    return { error: "El nombre del grupo es obligatorio.", success: false };
  }

  const supabase = await createSupabaseServerClient();
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
    return { error: lastErrorMessage, success: false };
  }

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: createdGroupId,
    user_id: user.id,
    role: "owner"
  });

  if (memberError) {
    await supabase.from("groups").delete().eq("id", createdGroupId);
    return { error: memberError.message, success: false };
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export { INITIAL_STATE as createGroupInitialState };
