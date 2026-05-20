"use server";

import { revalidatePath } from "next/cache";
import { actionFailure, actionSuccess, INITIAL_ACTION_STATE, type ActionState } from "@/lib/actions/actionState";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { createPersonalPlace, deletePersonalPlace } from "@/lib/personalPlaces";
import { createPersonalPlaceSchema } from "@/lib/validation/schemas";

export type AddPersonalPlaceActionState = ActionState;
export type DeletePersonalPlaceActionState = ActionState;

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
