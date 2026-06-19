import { describe, expect, it } from "vitest";
import { getAcceptedGroupHref } from "@/lib/groupInvitationNavigation";

describe("group invitation navigation", () => {
  it("returns the group route after accepting an invitation", () => {
    expect(
      getAcceptedGroupHref({
        decision: "accepted",
        groupId: "11111111-1111-4111-8111-111111111111",
        success: true
      })
    ).toBe("/groups/11111111-1111-4111-8111-111111111111");
  });

  it("does not redirect after rejecting an invitation", () => {
    expect(
      getAcceptedGroupHref({
        decision: "rejected",
        groupId: "11111111-1111-4111-8111-111111111111",
        success: true
      })
    ).toBeNull();
  });
});
