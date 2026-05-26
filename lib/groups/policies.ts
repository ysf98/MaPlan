export const GROUP_JOIN_POLICY_VALUES = ["invite_only", "open_by_code", "request_to_join"] as const;
export const GROUP_JOIN_REQUEST_STATUS_VALUES = ["pending", "approved", "rejected"] as const;
export const GROUP_PRIVACY_VALUES = ["privado", "abierto"] as const;

export type GroupJoinPolicy = (typeof GROUP_JOIN_POLICY_VALUES)[number];
export type GroupJoinRequestStatus = (typeof GROUP_JOIN_REQUEST_STATUS_VALUES)[number];
export type GroupPrivacy = (typeof GROUP_PRIVACY_VALUES)[number];
