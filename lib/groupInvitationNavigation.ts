type InvitationResponse = {
  decision: "accepted" | "rejected" | null;
  groupId: string | null;
  success: boolean;
};

export function getAcceptedGroupHref(response: InvitationResponse): string | null {
  if (!response.success || response.decision !== "accepted" || !response.groupId) {
    return null;
  }

  return `/groups/${response.groupId}`;
}
