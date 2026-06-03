"use server";

import { revalidatePath } from "next/cache";
import { actionFailure, actionSuccess, INITIAL_ACTION_STATE, type ActionState } from "@/lib/actions/actionState";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import {
  createPersonalPlace,
  deletePersonalPlace,
  updatePersonalPlaceFavorite,
  updatePersonalPlaceName,
  updatePersonalPlaceStatus
} from "@/lib/personalPlaces";
import {
  createPersonalPlaceSchema,
  updatePersonalPlaceFavoriteSchema,
  updatePersonalPlaceStatusSchema
} from "@/lib/validation/schemas";
import type { PlaceStatus } from "@/types/supabase";

export type AddPersonalPlaceActionState = ActionState;
export type DeletePersonalPlaceActionState = ActionState;
export type UpdatePersonalPlaceNameActionState = ActionState;
export type UpdatePersonalPlaceStatusActionState = ActionState;
export type UpdatePersonalPlaceFavoriteActionState = ActionState;

export async function addPersonalPlaceAction(
  _previousState: AddPersonalPlaceActionState = INITIAL_ACTION_STATE,
  formData: FormData
): Promise<AddPersonalPlaceActionState> {
  const user = await requireAuthenticatedUser("/map");

  const parsedInput = createPersonalPlaceSchema.safeParse({
    name: String(formData.get("name") || ""),
    address: String(formData.get("address") || ""),
    city: String(formData.get("city") || ""),
    notes: String(formData.get("notes") || ""),
    category: String(formData.get("category") || ""),
    source: String(formData.get("source") || ""),
    provider: String(formData.get("provider") || ""),
    externalPlaceId: String(formData.get("externalPlaceId") || ""),
    googleMapsUrl: String(formData.get("googleMapsUrl") || ""),
    businessStatus: String(formData.get("businessStatus") || ""),
    phoneNumber: String(formData.get("phoneNumber") || ""),
    imageUrl: String(formData.get("imageUrl") || ""),
    latitude: String(formData.get("latitude") || ""),
    longitude: String(formData.get("longitude") || "")
  });

  if (!parsedInput.success) {
    return actionFailure(getValidationErrorMessage(parsedInput.error));
  }

  const result = await createPersonalPlace({
    userId: user.id,
    ...parsedInput.data
  });

  if (result.error) {
    return actionFailure(result.error);
  }

  revalidatePath("/map");
  return actionSuccess();
}

export async function deletePersonalPlaceAction(
  _previousState: DeletePersonalPlaceActionState = INITIAL_ACTION_STATE,
  formData: FormData
): Promise<DeletePersonalPlaceActionState> {
  const user = await requireAuthenticatedUser("/map");
  const placeId = String(formData.get("placeId") || "").trim();
  if (!placeId) {
    return actionFailure("Lugar invalido.");
  }

  const result = await deletePersonalPlace({
    userId: user.id,
    placeId
  });

  if (result.error) {
    return actionFailure(result.error);
  }

  revalidatePath("/map");
  return actionSuccess();
}

export async function updatePersonalPlaceNameAction(
  _previousState: UpdatePersonalPlaceNameActionState = INITIAL_ACTION_STATE,
  formData: FormData
): Promise<UpdatePersonalPlaceNameActionState> {
  const user = await requireAuthenticatedUser("/map");
  const placeId = String(formData.get("placeId") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!placeId) {
    return actionFailure("Lugar invalido.");
  }

  const result = await updatePersonalPlaceName({
    userId: user.id,
    placeId,
    name
  });

  if (result.error) {
    return actionFailure(result.error);
  }

  revalidatePath("/map");
  return actionSuccess();
}

export async function updatePersonalPlaceStatusAction(
  _previousState: UpdatePersonalPlaceStatusActionState = INITIAL_ACTION_STATE,
  formData: FormData
): Promise<UpdatePersonalPlaceStatusActionState> {
  const user = await requireAuthenticatedUser("/map");

  const parsedInput = updatePersonalPlaceStatusSchema.safeParse({
    placeId: String(formData.get("placeId") || ""),
    status: String(formData.get("status") || "")
  });

  if (!parsedInput.success) {
    return actionFailure(getValidationErrorMessage(parsedInput.error));
  }

  const result = await updatePersonalPlaceStatus({
    userId: user.id,
    placeId: parsedInput.data.placeId,
    status: parsedInput.data.status as PlaceStatus
  });

  if (result.error) {
    return actionFailure(result.error);
  }

  revalidatePath("/map");
  return actionSuccess();
}

export async function updatePersonalPlaceFavoriteAction(
  _previousState: UpdatePersonalPlaceFavoriteActionState = INITIAL_ACTION_STATE,
  formData: FormData
): Promise<UpdatePersonalPlaceFavoriteActionState> {
  const user = await requireAuthenticatedUser("/map");

  const parsedInput = updatePersonalPlaceFavoriteSchema.safeParse({
    placeId: String(formData.get("placeId") || ""),
    isFavorite: String(formData.get("isFavorite") || "")
  });

  if (!parsedInput.success) {
    return actionFailure(getValidationErrorMessage(parsedInput.error));
  }

  const result = await updatePersonalPlaceFavorite({
    userId: user.id,
    placeId: parsedInput.data.placeId,
    isFavorite: parsedInput.data.isFavorite
  });

  if (result.error) {
    return actionFailure(result.error);
  }

  revalidatePath("/map");
  return actionSuccess();
}
