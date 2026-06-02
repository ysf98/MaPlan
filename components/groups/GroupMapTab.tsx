import { GroupMap } from "@/components/map/GroupMap";
import { cn } from "@/lib/cn";
import type { GroupPlace } from "@/lib/places/shared";

type GroupMapTabProps = {
  groupId: string;
  places: GroupPlace[];
  canEditPlaces: boolean;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  isImmersive?: boolean;
};

export function GroupMapTab({
  groupId,
  places,
  canEditPlaces,
  selectedPlaceId,
  onSelectPlace,
  isImmersive = false
}: GroupMapTabProps) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-zinc-400/60 bg-zinc-500/35 p-1 backdrop-blur-sm",
        isImmersive && "max-sm:fixed max-sm:inset-0 max-sm:z-50 max-sm:overflow-hidden max-sm:rounded-none max-sm:border-0 max-sm:bg-zinc-950 max-sm:p-0"
      )}
    >
      <GroupMap canEdit={canEditPlaces} groupId={groupId} onSelectPlace={onSelectPlace} places={places} selectedPlaceId={selectedPlaceId} />
    </div>
  );
}
