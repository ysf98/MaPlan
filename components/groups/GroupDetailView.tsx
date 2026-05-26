"use client";

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
        <GroupDetailTabs activeTab={activeTab} groupId={groupId} />
        <div className="pt-4">
          {activeTab === "lugares" ? <GroupPlacesTab canEditPlaces={group.canEditPlaces} groupId={groupId} places={places} /> : null}
          {activeTab === "actividad" ? <GroupActivityTab events={activityEvents} /> : null}
          {activeTab === "mapa" ? <GroupMapTab canEditPlaces={group.canEditPlaces} groupId={groupId} places={places} /> : null}
        </div>
      </div>
    </section>
  );
}
