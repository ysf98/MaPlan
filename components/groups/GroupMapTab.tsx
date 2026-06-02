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
    <div className="rounded-[32px] border border-zinc-400/60 bg-zinc-500/35 p-1 backdrop-blur-sm">
      <GroupMap canEdit={canEditPlaces} groupId={groupId} onSelectPlace={onSelectPlace} places={places} selectedPlaceId={selectedPlaceId} />
    </div>
  );
}
