export const GROUP_PLACE_EDIT_POLICY_VALUES = ["owner_only", "members_can_edit"] as const;
export const GROUP_JOIN_POLICY_VALUES = ["invite_only", "open_by_code", "request_to_join"] as const;
export const GROUP_JOIN_REQUEST_STATUS_VALUES = ["pending", "approved", "rejected"] as const;

export type GroupPlaceEditPolicy = (typeof GROUP_PLACE_EDIT_POLICY_VALUES)[number];
export type GroupJoinPolicy = (typeof GROUP_JOIN_POLICY_VALUES)[number];
export type GroupJoinRequestStatus = (typeof GROUP_JOIN_REQUEST_STATUS_VALUES)[number];
