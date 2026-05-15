import type { GroupJoinPolicy, GroupPlaceEditPolicy } from "@/lib/groups/policies";

export type GroupListItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  role: "owner" | "member";
  placeEditPolicy: GroupPlaceEditPolicy;
  joinPolicy: GroupJoinPolicy;
};

export type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  createdAt: string;
  role: "owner" | "member";
  placeEditPolicy: GroupPlaceEditPolicy;
  joinPolicy: GroupJoinPolicy;
  canEditPlaces: boolean;
};

export type GroupJoinRequestItem = {
  id: string;
  groupId: string;
  userId: string;
  username: string | null;
  userEmail: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  reviewedByUsername: string | null;
};

export type GroupMemberPreview = {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  role: "owner" | "member";
};

export type GroupMembersPreviewResult = {
  members: GroupMemberPreview[];
  allMembers: GroupMemberPreview[];
  total: number;
};
