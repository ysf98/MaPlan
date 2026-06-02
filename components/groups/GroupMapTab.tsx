import { GroupMap } from "@/components/map/GroupMap";
import { cn } from "@/lib/cn";
import type { GroupDetailTab } from "@/lib/groups/tabs";
import type { GroupPlace } from "@/lib/places/shared";

type GroupMapTabProps = {
  groupId: string;
  places: GroupPlace[];
  canEditPlaces: boolean;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  isImmersive?: boolean;
  activeTab?: GroupDetailTab;
  onTabChange?: (tab: GroupDetailTab) => void;
};

const groupMapTabs: Array<{ label: string; value: GroupDetailTab }> = [
  { label: "Lugares", value: "lugares" },
  { label: "Actividad", value: "actividad" },
  { label: "Mapa", value: "mapa" }
];

export function GroupMapTab({
  groupId,
  places,
  canEditPlaces,
  selectedPlaceId,
  onSelectPlace,
  isImmersive = false,
  activeTab,
  onTabChange
}: GroupMapTabProps) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-zinc-400/60 bg-zinc-500/35 p-1 backdrop-blur-sm",
        isImmersive && "max-sm:fixed max-sm:inset-0 max-sm:z-50 max-sm:overflow-hidden max-sm:rounded-none max-sm:border-0 max-sm:bg-zinc-950 max-sm:p-0"
      )}
    >
      <GroupMap
        activeMobileTab={activeTab}
        canEdit={canEditPlaces}
        groupId={groupId}
        mobileTabs={groupMapTabs}
        onMobileTabChange={onTabChange}
        onSelectPlace={onSelectPlace}
        places={places}
        selectedPlaceId={selectedPlaceId}
      />
    </div>
  );
}
