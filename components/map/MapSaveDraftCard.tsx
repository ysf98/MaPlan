"use client";

import { useEffect, useRef, useState } from "react";
import { DraftPlacePlanDialog } from "@/components/groups/DraftPlacePlanDialog";
import { MapPlaceCard } from "@/components/map/MapPlaceCard";
import type { GroupPlanItem } from "@/lib/groupPlans";
import type { MapDraftPlace } from "@/lib/map/geocoding";

type SaveDraftActionState = {
  error: string | null;
  success: boolean;
};

type MapSaveDraftCardProps = {
  scopeIdName: string;
  scopeIdValue: string;
  draft: MapDraftPlace;
  state: SaveDraftActionState;
  isPending: boolean;
  canSave?: boolean;
  distanceLabel?: string | null;
  formAction: (payload: FormData) => void;
  onCancel: () => void;
  plans?: GroupPlanItem[];
};

export function MapSaveDraftCard({
  scopeIdName,
  scopeIdValue,
  draft,
  state,
  isPending,
  canSave = true,
  distanceLabel,
  formAction,
  onCancel,
  plans = []
}: MapSaveDraftCardProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [name, setName] = useState(draft.name);
  const [address, setAddress] = useState(draft.address);
  const [city, setCity] = useState(draft.city);
  const [mode, setMode] = useState<"confirm" | "editName">("confirm");

  useEffect(() => {
    setName(draft.name);
    setAddress(draft.address);
    setCity(draft.city);
    setMode("confirm");
  }, [draft.address, draft.city, draft.latitude, draft.longitude, draft.name]);

  const submitDraft = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <form action={formAction} className="pointer-events-auto" ref={formRef}>
      <input name={scopeIdName} type="hidden" value={scopeIdValue} />
      <input name="latitude" type="hidden" value={String(draft.latitude)} />
      <input name="longitude" type="hidden" value={String(draft.longitude)} />
      <input name="source" type="hidden" value={draft.provider === "google_places" ? "google_maps" : "manual"} />
      <input name="provider" type="hidden" value={draft.provider || "manual"} />
      <input name="externalPlaceId" type="hidden" value={draft.externalPlaceId || ""} />
      <input name="googleMapsUrl" type="hidden" value={draft.googleMapsUrl || ""} />
      <input name="businessStatus" type="hidden" value={draft.businessStatus || ""} />
      <input name="phoneNumber" type="hidden" value={draft.phoneNumber || ""} />
      <input name="rating" type="hidden" value={draft.rating ?? ""} />
      <input name="userRatingsTotal" type="hidden" value={draft.userRatingsTotal ?? ""} />
      <input name="imageUrl" type="hidden" value={draft.imageUrl || ""} />
      <input name="category" type="hidden" value={draft.category || "Otros"} />
      <input name="address" type="hidden" value={address} />
      <input name="city" type="hidden" value={city} />
      <input name="name" type="hidden" value={name} />

      <MapPlaceCard
        capabilities={{
          canCall: Boolean(draft.phoneNumber),
          canDelete: false,
          canEditName: canSave,
          canFavorite: false,
          canOpenMaps: Boolean(draft.googleMapsUrl),
          canSave
        }}
        distanceLabel={distanceLabel}
        editNameValue={name}
        error={state.error}
        isEditingPending={isPending}
        isSaving={isPending}
        mode={mode === "editName" ? "edit" : "view"}
        onClose={onCancel}
        onEditCancel={onCancel}
        onEditNameChange={setName}
        onEditSave={submitDraft}
        onEditStart={() => setMode("editName")}
        onSave={submitDraft}
        extraContent={
          canSave ? (
            <DraftPlacePlanDialog
              canManagePlans={canSave}
              draft={{
                ...draft,
                name,
                address,
                city
              }}
              groupId={scopeIdValue}
              plans={plans}
            />
          ) : null
        }
        place={{
          address,
          city,
          googleMapsUrl: draft.googleMapsUrl,
          imageUrl: draft.imageUrl,
          name,
          phoneNumber: draft.phoneNumber,
          rating: draft.rating,
          userRatingsTotal: draft.userRatingsTotal
        }}
        variant="draft"
      />
    </form>
  );
}
