import { GroupMap } from "@/components/map/GroupMap";
import type { GroupPlace } from "@/lib/places/shared";

type GroupMapTabProps = {
  groupId: string;
  places: GroupPlace[];
  canEditPlaces: boolean;
};

export function GroupMapTab({ groupId, places, canEditPlaces }: GroupMapTabProps) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-3" data-lock-swipe>
      <GroupMap canEdit={canEditPlaces} groupId={groupId} places={places} />
    </div>
  );
}
