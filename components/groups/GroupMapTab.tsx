import { GroupMap } from "@/components/map/GroupMap";
import type { GroupPlace } from "@/lib/places/shared";

type GroupMapTabProps = {
  groupId: string;
  places: GroupPlace[];
  canEditPlaces: boolean;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
};

export function GroupMapTab({ groupId, places, canEditPlaces, selectedPlaceId, onSelectPlace }: GroupMapTabProps) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-3">
      <GroupMap canEdit={canEditPlaces} groupId={groupId} onSelectPlace={onSelectPlace} places={places} selectedPlaceId={selectedPlaceId} />
    </div>
  );
}
