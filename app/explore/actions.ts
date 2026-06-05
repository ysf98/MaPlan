"use server";

import { revalidatePath } from "next/cache";
import { actionFailure, actionSuccess, INITIAL_ACTION_STATE, type ActionState } from "@/lib/actions/actionState";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { createPersonalPlace } from "@/lib/personalPlaces";
import { createPlace } from "@/lib/places";
import { saveExploredPlaceSchema } from "@/lib/validation/schemas";
import { ROUTES } from "@/utils/constants";

export type SaveExploredPlaceActionState = ActionState;

export async function saveExploredPlaceAction(
  _previousState: SaveExploredPlaceActionState = INITIAL_ACTION_STATE,
  formData: FormData
): Promise<SaveExploredPlaceActionState> {
  const user = await requireAuthenticatedUser(ROUTES.explore);

  const parsedInput = saveExploredPlaceSchema.safeParse({
    destinationType: String(formData.get("destinationType") || ""),
    destinationId: String(formData.get("destinationId") || ""),
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

  const {
    destinationId,
    destinationType,
    name,
    address,
    city,
    notes,
    category,
    source,
    provider,
    externalPlaceId,
    googleMapsUrl,
    businessStatus,
    phoneNumber,
    imageUrl,
    latitude,
    longitude
  } = parsedInput.data;

  if (destinationType === "personal") {
    if (destinationId !== "personal") {
      return actionFailure("Destino invalido.");
    }

    const result = await createPersonalPlace({
      userId: user.id,
      name,
      address,
      city,
      notes,
      category,
      source,
      provider,
      externalPlaceId,
      googleMapsUrl,
      businessStatus,
      phoneNumber,
      imageUrl,
      latitude,
      longitude
    });

    if (result.error) {
      return actionFailure(result.error);
    }

    revalidatePath(ROUTES.map);
    revalidatePath(ROUTES.profile);
    revalidatePath(ROUTES.profilePlaces);
    return actionSuccess();
  }

  const result = await createPlace({
    userId: user.id,
    groupId: destinationId,
    name,
    address,
    city,
    notes,
    category,
    source,
    provider,
    externalPlaceId,
    googleMapsUrl,
    businessStatus,
    phoneNumber,
    imageUrl,
    latitude,
    longitude
  });

  if (result.error) {
    return actionFailure(result.error);
  }

  revalidatePath(`/groups/${destinationId}`);
  revalidatePath(ROUTES.groups);
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.profilePlaces);
  return actionSuccess();
}
