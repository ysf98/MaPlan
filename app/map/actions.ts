"use server";

import { revalidatePath } from "next/cache";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { createPersonalPlace, deletePersonalPlace } from "@/lib/personalPlaces";
import { createPersonalPlaceSchema } from "@/lib/validation/schemas";

export type AddPersonalPlaceActionState = {
  error: string | null;
  success: boolean;
};

export type DeletePersonalPlaceActionState = {
  error: string | null;
  success: boolean;
};

const ADD_PERSONAL_PLACE_INITIAL_STATE: AddPersonalPlaceActionState = {
  error: null,
  success: false
};

const DELETE_PERSONAL_PLACE_INITIAL_STATE: DeletePersonalPlaceActionState = {
  error: null,
  success: false
};

export async function addPersonalPlaceAction(
  _previousState: AddPersonalPlaceActionState = ADD_PERSONAL_PLACE_INITIAL_STATE,
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
    return {
      error: getValidationErrorMessage(parsedInput.error),
      success: false
    };
  }

  const result = await createPersonalPlace({
    userId: user.id,
    ...parsedInput.data
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath("/map");
  return { error: null, success: true };
}

export async function deletePersonalPlaceAction(
  _previousState: DeletePersonalPlaceActionState = DELETE_PERSONAL_PLACE_INITIAL_STATE,
  formData: FormData
): Promise<DeletePersonalPlaceActionState> {
  const user = await requireAuthenticatedUser("/map");
  const placeId = String(formData.get("placeId") || "").trim();
  if (!placeId) {
    return { error: "Lugar invalido.", success: false };
  }

  const result = await deletePersonalPlace({
    userId: user.id,
    placeId
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath("/map");
  return { error: null, success: true };
}
