"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { GroupActivityTab } from "@/components/groups/GroupActivityTab";
import { GroupDetailTabs } from "@/components/groups/GroupDetailTabs";
import { GroupMapTab } from "@/components/groups/GroupMapTab";
import { GroupOverviewHeader } from "@/components/groups/GroupOverviewHeader";
import { GroupOwnerControls } from "@/components/groups/GroupOwnerControls";
import { GroupPlacesTab } from "@/components/groups/GroupPlacesTab";
import type { GroupActivityFeedItem } from "@/lib/groupActivity";
import type { GroupDetailTab } from "@/lib/groups/tabs";
import type { GroupDetail, GroupJoinRequestItem, GroupMemberPreview } from "@/lib/groups/types";
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
  pendingJoinRequests: GroupJoinRequestItem[];
  reviewedJoinRequests: GroupJoinRequestItem[];
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
  activityEvents,
  pendingJoinRequests,
  reviewedJoinRequests
}: GroupDetailViewProps) {
  const tabs = useMemo(() => ["lugares", "actividad", "mapa"] as const, []);
  const [currentTab, setCurrentTab] = useState<GroupDetailTab>(activeTab);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffsetPct, setDragOffsetPct] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAxis, setDragAxis] = useState<"x" | "y" | null>(null);
  const [lockSwipeGesture, setLockSwipeGesture] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const tabPanelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activePanelHeight, setActivePanelHeight] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", currentTab);
    window.history.replaceState(null, "", url.toString());
  }, [currentTab]);

  function handleTouchStart(clientX: number, clientY: number, target: EventTarget | null) {
    const element = target as HTMLElement | null;
    if (element?.closest("[data-lock-swipe]")) {
      setLockSwipeGesture(true);
      return;
    }

    setLockSwipeGesture(false);
    setTouchStartX(clientX);
    setTouchStartY(clientY);
    setIsDragging(true);
    setDragAxis(null);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>, containerWidth: number) {
    if (lockSwipeGesture) return;

    const clientX = event.touches[0]?.clientX ?? 0;
    const clientY = event.touches[0]?.clientY ?? 0;
    if (touchStartX === null || touchStartY === null || containerWidth <= 0) return;

    const deltaX = touchStartX - clientX;
    const deltaY = touchStartY - clientY;

    let axis = dragAxis;
    if (!axis) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
        setDragAxis(axis);
      } else {
        return;
      }
    }

    if (axis === "y") {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const rawPct = (deltaX / containerWidth) * 100;
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
    if (lockSwipeGesture) {
      setLockSwipeGesture(false);
      return;
    }

    if (touchStartX === null) return;
    const currentIndex = tabs.indexOf(currentTab);
    const step = dragOffsetPct > 22 ? 1 : dragOffsetPct < -22 ? -1 : 0;
    const nextIndex = Math.max(0, Math.min(tabs.length - 1, currentIndex + step));
    setCurrentTab(tabs[nextIndex]);

    setTouchStartX(null);
    setTouchStartY(null);
    setDragOffsetPct(0);
    setIsDragging(false);
    setDragAxis(null);
    setLockSwipeGesture(false);
  }

  const tabIndex = tabs.indexOf(currentTab);
  useEffect(() => {
    const activePanel = tabPanelRefs.current[tabIndex];
    if (!activePanel) {
      setActivePanelHeight(null);
      return;
    }

    const updateHeight = () => {
      setActivePanelHeight(activePanel.getBoundingClientRect().height);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(activePanel);

    return () => {
      resizeObserver.disconnect();
    };
  }, [tabIndex]);

  const joinRequests =
    group.role === "owner" &&
    (group.joinPolicy === "request_to_join" || pendingJoinRequests.length > 0 || reviewedJoinRequests.length > 0)
      ? {
          groupId,
          requests: pendingJoinRequests,
          reviewedRequests: reviewedJoinRequests
        }
      : null;

  return (
    <section className="space-y-5">
      <div className="relative">
        <div className="absolute right-4 top-4 z-10">
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
          className="overflow-hidden pt-4 transition-[height] duration-220 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          onTouchEnd={() => handleTouchEnd()}
          onTouchMove={(event) => handleTouchMove(event, event.currentTarget.clientWidth)}
          onTouchStart={(event) =>
            handleTouchStart(event.touches[0]?.clientX ?? 0, event.touches[0]?.clientY ?? 0, event.target)
          }
          style={{ height: activePanelHeight === null ? undefined : activePanelHeight + 16 }}
        >
          <div
            className={`flex items-start ${isDragging ? "" : "transition-transform duration-220 ease-[cubic-bezier(0.22,0.61,0.36,1)]"}`}
            style={{ transform: `translateX(calc(${-tabIndex * 100}% - ${dragOffsetPct}%))` }}
          >
            <div className="w-full shrink-0 px-1.5" ref={(node) => { tabPanelRefs.current[0] = node; }}>
              <GroupPlacesTab
                canEditPlaces={group.canEditPlaces}
                groupId={groupId}
                onSelectPlace={setSelectedPlaceId}
                onViewInMap={(placeId) => {
                  setSelectedPlaceId(placeId);
                  setCurrentTab("mapa");
                }}
                places={places}
                selectedPlaceId={selectedPlaceId}
              />
            </div>
            <div className="w-full shrink-0 px-1.5" ref={(node) => { tabPanelRefs.current[1] = node; }}>
              <GroupActivityTab events={activityEvents} joinRequests={joinRequests} />
            </div>
            <div className="w-full shrink-0 px-1.5" ref={(node) => { tabPanelRefs.current[2] = node; }}>
              <GroupMapTab
                canEditPlaces={group.canEditPlaces}
                groupId={groupId}
                onSelectPlace={setSelectedPlaceId}
                places={places}
                selectedPlaceId={selectedPlaceId}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
