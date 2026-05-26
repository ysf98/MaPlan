"use client";

import { useEffect, useMemo, useState } from "react";
import { GroupActivityTab } from "@/components/groups/GroupActivityTab";
import { GroupDetailTabs } from "@/components/groups/GroupDetailTabs";
import { GroupMapTab } from "@/components/groups/GroupMapTab";
import { GroupOverviewHeader } from "@/components/groups/GroupOverviewHeader";
import { GroupOwnerControls } from "@/components/groups/GroupOwnerControls";
import { GroupPlacesTab } from "@/components/groups/GroupPlacesTab";
import type { GroupActivityFeedItem } from "@/lib/groupActivity";
import type { GroupDetailTab } from "@/lib/groups/tabs";
import type { GroupDetail, GroupMemberPreview } from "@/lib/groups/types";
import type { GroupPlace } from "@/lib/places/shared";

type GroupDetailViewProps = {
  group: GroupDetail;
  groupId: string;
  places: GroupPlace[];
  membersPreview: GroupMemberPreview[];
  totalMembersCount: number;
  invitableFriends: Array<{ id: string; username: string | null }>;
  totalFriendsCount: number;
  activeTab: GroupDetailTab;
  activityEvents: GroupActivityFeedItem[];
};

export function GroupDetailView({
  group,
  groupId,
  places,
  membersPreview,
  totalMembersCount,
  invitableFriends,
  totalFriendsCount,
  activeTab,
  activityEvents
}: GroupDetailViewProps) {
  const tabs = useMemo(() => ["lugares", "actividad", "mapa"] as const, []);
  const [currentTab, setCurrentTab] = useState<GroupDetailTab>(activeTab);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffsetPct, setDragOffsetPct] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", currentTab);
    window.history.replaceState(null, "", url.toString());
  }, [currentTab]);

  function handleTouchStart(clientX: number) {
    setTouchStartX(clientX);
    setIsDragging(true);
  }

  function handleTouchMove(clientX: number, containerWidth: number) {
    if (touchStartX === null || containerWidth <= 0) return;
    const deltaPx = touchStartX - clientX;
    const rawPct = (deltaPx / containerWidth) * 100;
    const currentIndex = tabs.indexOf(currentTab);
    const draggingLeft = rawPct < 0;
    const draggingRight = rawPct > 0;
    const atFirst = currentIndex === 0;
    const atLast = currentIndex === tabs.length - 1;
    const isOverscrolling = (atFirst && draggingLeft) || (atLast && draggingRight);
    const withResistance = isOverscrolling ? rawPct * 0.35 : rawPct;
    const clampedPct = Math.max(-100, Math.min(100, withResistance));
    setDragOffsetPct(clampedPct);
  }

  function handleTouchEnd() {
    if (touchStartX === null) return;
    const currentIndex = tabs.indexOf(currentTab);
    const projected = Math.round(currentIndex + dragOffsetPct / 100);
    const nextIndex = Math.max(0, Math.min(tabs.length - 1, projected));
    setCurrentTab(tabs[nextIndex]);

    setTouchStartX(null);
    setDragOffsetPct(0);
    setIsDragging(false);
  }

  const tabIndex = tabs.indexOf(currentTab);

  return (
    <section className="space-y-5">
      <div className="relative">
        <div className="absolute right-4 top-4 z-20">
          <GroupOwnerControls
            canEditGroup={group.canEditGroup}
            canInviteMembers={group.canInviteMembers}
            groupCoverImageUrl={group.coverImageUrl}
            groupDescription={group.description}
            groupId={groupId}
            groupName={group.name}
            invitableFriends={invitableFriends}
            joinCode={group.joinCode}
            joinPolicy={group.joinPolicy}
            privacy={group.privacy}
            role={group.role}
            totalFriendsCount={totalFriendsCount}
          />
        </div>
        <GroupOverviewHeader group={group} membersPreview={membersPreview} totalMembersCount={totalMembersCount} />
      </div>

      <div>
        <GroupDetailTabs activeTab={currentTab} onTabChange={setCurrentTab} />
        <div
          className="overflow-hidden pt-4"
          onTouchEnd={() => handleTouchEnd()}
          onTouchMove={(event) => handleTouchMove(event.touches[0]?.clientX ?? 0, event.currentTarget.clientWidth)}
          onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
        >
          <div
            className={`flex ${isDragging ? "" : "transition-transform duration-300 ease-out"}`}
            style={{ transform: `translateX(calc(${-tabIndex * 100}% - ${dragOffsetPct}%))` }}
          >
            <div className="w-full shrink-0">
              <GroupPlacesTab canEditPlaces={group.canEditPlaces} groupId={groupId} places={places} />
            </div>
            <div className="w-full shrink-0">
              <GroupActivityTab events={activityEvents} />
            </div>
            <div className="w-full shrink-0">
              <GroupMapTab canEditPlaces={group.canEditPlaces} groupId={groupId} places={places} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

