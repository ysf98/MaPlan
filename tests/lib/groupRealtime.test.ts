import { describe, expect, it } from "vitest";
import { getGroupRealtimeFilter, GROUP_REALTIME_TABLES } from "@/lib/groupRealtime";

describe("group realtime configuration", () => {
  it("uses one group filter for places and plans", () => {
    expect(GROUP_REALTIME_TABLES).toEqual(["places", "group_plans"]);
    expect(getGroupRealtimeFilter("group-1")).toBe("group_id=eq.group-1");
  });
});
