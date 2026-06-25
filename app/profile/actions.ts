"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { updatePersonalPlaceFavorite, updatePersonalPlaceStatus } from "@/lib/personalPlaces";
import { updatePlaceFavorite, updatePlaceStatus } from "@/lib/places";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  deleteAccountSchema,
  updatePersonalPlaceFavoriteSchema,
  updatePersonalPlaceStatusSchema,
  updatePlaceFavoriteSchema,
  updatePlaceStatusSchema,
  updateProfileSchema
} from "@/lib/validation/schemas";
import type { PlaceStatus } from "@/types/supabase";
import { ROUTES } from "@/utils/constants";

export type UpdateProfileActionState = {
  error: string | null;
  success: boolean;
};

export type DeleteAccountActionState = {
  error: string | null;
  success: boolean;
};

export type UpdateProfilePlaceActionState = {
  error: string | null;
  success: boolean;
};

type AccountDeletionTable =
  | "friend_requests"
  | "friendships"
  | "group_activity_events"
  | "group_invitations"
  | "group_join_requests"
  | "group_members"
  | "group_place_user_states"
  | "groups"
  | "personal_places"
  | "places"
  | "profiles";

type DbMutationResult = {
  error: { message: string } | null;
};

function getDeletionErrorMessage(table: AccountDeletionTable, message: string) {
  return `No se pudo eliminar la cuenta por datos pendientes en ${table}: ${message}`;
}

function revalidateProfilePlaces() {
  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.profilePlaces);
}

function getProfilePlaceSource(formData: FormData): "group" | "personal" | null {
  const source = String(formData.get("source") || "");
  if (source === "group" || source === "personal") {
    return source;
  }
  return null;
}

async function deleteRowsByColumn(
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>,
  table: AccountDeletionTable,
  column: string,
  userId: string
) {
  const result = (await adminSupabase.from(table).delete().eq(column, userId)) as DbMutationResult;
  if (result.error) {
    return getDeletionErrorMessage(table, result.error.message);
  }
  return null;
}

async function deleteRowsByFilter(
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>,
  table: AccountDeletionTable,
  filter: string
) {
  const result = (await adminSupabase.from(table).delete().or(filter)) as DbMutationResult;
  if (result.error) {
    return getDeletionErrorMessage(table, result.error.message);
  }
  return null;
}

async function deleteAccountData(adminSupabase: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const cleanupSteps: Array<() => Promise<string | null>> = [
    () => deleteRowsByColumn(adminSupabase, "groups", "created_by", userId),
    () => deleteRowsByColumn(adminSupabase, "places", "created_by", userId),
    () => deleteRowsByColumn(adminSupabase, "personal_places", "user_id", userId),
    () => deleteRowsByColumn(adminSupabase, "group_place_user_states", "user_id", userId),
    () => deleteRowsByColumn(adminSupabase, "group_activity_events", "actor_user_id", userId),
    () => deleteRowsByColumn(adminSupabase, "group_members", "user_id", userId),
    () => deleteRowsByColumn(adminSupabase, "group_join_requests", "user_id", userId),
    () => deleteRowsByFilter(adminSupabase, "group_invitations", `invited_by.eq.${userId},invited_user_id.eq.${userId}`),
    () => deleteRowsByFilter(adminSupabase, "friend_requests", `sender_id.eq.${userId},receiver_id.eq.${userId}`),
    () => deleteRowsByFilter(adminSupabase, "friendships", `user_a_id.eq.${userId},user_b_id.eq.${userId}`)
  ];

  for (const step of cleanupSteps) {
    const error = await step();
    if (error) {
      return error;
    }
  }

  return null;
}

export async function updateProfileAction(
  _previousState: UpdateProfileActionState,
  formData: FormData
): Promise<UpdateProfileActionState> {
  const user = await requireAuthenticatedUser(ROUTES.profile);
  const parsed = updateProfileSchema.safeParse({
    fullName: String(formData.get("fullName") || ""),
    username: String(formData.get("username") || ""),
    avatarUrl: String(formData.get("avatarUrl") || "")
  });

  if (!parsed.success) {
    return { error: getValidationErrorMessage(parsed.error), success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      username: parsed.data.username.toLowerCase(),
      avatar_url: parsed.data.avatarUrl
    })
    .eq("id", user.id);

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "Ese @usuario ya está en uso. Elige otro distinto.", success: false };
    }
    return { error: error.message, success: false };
  }

  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.dashboard);
  return { error: null, success: true };
}

export async function updateProfilePlaceStatusAction(
  _previousState: UpdateProfilePlaceActionState,
  formData: FormData
): Promise<UpdateProfilePlaceActionState> {
  const user = await requireAuthenticatedUser(ROUTES.profilePlaces);
  const source = getProfilePlaceSource(formData);

  if (!source) {
    return { error: "Tipo de lugar inválido.", success: false };
  }

  if (source === "personal") {
    const parsedInput = updatePersonalPlaceStatusSchema.safeParse({
      placeId: String(formData.get("placeId") || ""),
      status: String(formData.get("status") || "")
    });

    if (!parsedInput.success) {
      return { error: getValidationErrorMessage(parsedInput.error), success: false };
    }

    const result = await updatePersonalPlaceStatus({
      userId: user.id,
      placeId: parsedInput.data.placeId,
      status: parsedInput.data.status as PlaceStatus
    });

    if (result.error) {
      return { error: result.error, success: false };
    }
  } else {
    const parsedInput = updatePlaceStatusSchema.safeParse({
      groupId: String(formData.get("groupId") || ""),
      placeId: String(formData.get("placeId") || ""),
      status: String(formData.get("status") || "")
    });

    if (!parsedInput.success) {
      return { error: getValidationErrorMessage(parsedInput.error), success: false };
    }

    const result = await updatePlaceStatus({
      userId: user.id,
      groupId: parsedInput.data.groupId,
      placeId: parsedInput.data.placeId,
      status: parsedInput.data.status as PlaceStatus
    });

    if (result.error) {
      return { error: result.error, success: false };
    }
  }

  revalidateProfilePlaces();
  return { error: null, success: true };
}

export async function updateProfilePlaceFavoriteAction(
  _previousState: UpdateProfilePlaceActionState,
  formData: FormData
): Promise<UpdateProfilePlaceActionState> {
  const user = await requireAuthenticatedUser(ROUTES.profilePlaces);
  const source = getProfilePlaceSource(formData);

  if (!source) {
    return { error: "Tipo de lugar inválido.", success: false };
  }

  if (source === "personal") {
    const parsedInput = updatePersonalPlaceFavoriteSchema.safeParse({
      placeId: String(formData.get("placeId") || ""),
      isFavorite: String(formData.get("isFavorite") || "")
    });

    if (!parsedInput.success) {
      return { error: getValidationErrorMessage(parsedInput.error), success: false };
    }

    const result = await updatePersonalPlaceFavorite({
      userId: user.id,
      placeId: parsedInput.data.placeId,
      isFavorite: parsedInput.data.isFavorite
    });

    if (result.error) {
      return { error: result.error, success: false };
    }
  } else {
    const parsedInput = updatePlaceFavoriteSchema.safeParse({
      groupId: String(formData.get("groupId") || ""),
      placeId: String(formData.get("placeId") || ""),
      isFavorite: String(formData.get("isFavorite") || "")
    });

    if (!parsedInput.success) {
      return { error: getValidationErrorMessage(parsedInput.error), success: false };
    }

    const result = await updatePlaceFavorite({
      userId: user.id,
      groupId: parsedInput.data.groupId,
      placeId: parsedInput.data.placeId,
      isFavorite: parsedInput.data.isFavorite
    });

    if (result.error) {
      return { error: result.error, success: false };
    }
  }

  revalidateProfilePlaces();
  return { error: null, success: true };
}

export async function deleteAccountAction(
  _previousState: DeleteAccountActionState,
  formData: FormData
): Promise<DeleteAccountActionState> {
  const user = await requireAuthenticatedUser(ROUTES.profile);
  const parsed = deleteAccountSchema.safeParse({
    confirmation: String(formData.get("confirmation") || "")
  });

  if (!parsed.success) {
    return { error: getValidationErrorMessage(parsed.error), success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingProfile, error: profileLookupError } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();

  if (profileLookupError) {
    return { error: profileLookupError.message, success: false };
  }

  if (!existingProfile) {
    return { error: "No se encontro el perfil.", success: false };
  }

  let adminSupabase: ReturnType<typeof createSupabaseAdminClient>;

  try {
    adminSupabase = createSupabaseAdminClient();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo preparar el borrado de la cuenta.", success: false };
  }

  const deletedUsername = `deleted_${user.id.replace(/-/g, "").slice(0, 24)}`;
  const { data, error } = await supabase
    .from("profiles")
    .update({
      avatar_url: null,
      deleted_at: new Date().toISOString(),
      full_name: "Usuario eliminado",
      username: deletedUsername
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message, success: false };
  }

  if (!data) {
    return { error: "No se encontro el perfil.", success: false };
  }

  const cleanupError = await deleteAccountData(adminSupabase, user.id);
  if (cleanupError) {
    return { error: cleanupError, success: false };
  }

  const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(user.id, false);
  if (deleteUserError) {
    return { error: `No se pudo eliminar el usuario de autenticacion: ${deleteUserError.message}`, success: false };
  }

  const profileDeleteResult = (await adminSupabase.from("profiles").delete().eq("id", user.id)) as DbMutationResult;
  if (profileDeleteResult.error) {
    return { error: getDeletionErrorMessage("profiles", profileDeleteResult.error.message), success: false };
  }

  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.dashboard);
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}
