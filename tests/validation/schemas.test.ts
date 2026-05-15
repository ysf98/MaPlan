import { describe, expect, it } from "vitest";
import {
  createGroupSchema,
  inviteFriendToGroupSchema,
  joinGroupSchema,
  createPlaceSchema,
  respondGroupInvitationSchema,
  respondFriendRequestSchema,
  reviewJoinRequestSchema,
  sendFriendRequestSchema,
  updatePlaceLocationSchema,
  updatePlaceStatusSchema
} from "@/lib/validation/schemas";

describe("createGroupSchema", () => {
  it("accepts valid payload", () => {
    const result = createGroupSchema.safeParse({
      name: "Madrid Crew",
      description: "Planes de finde",
      placeEditPolicy: "owner_only",
      joinPolicy: "request_to_join"
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createGroupSchema.safeParse({
      name: "   ",
      description: "abc"
    });

    expect(result.success).toBe(false);
  });

  it("accepts invite_only join policy", () => {
    const result = createGroupSchema.safeParse({
      name: "Grupo privado",
      joinPolicy: "invite_only"
    });

    expect(result.success).toBe(true);
  });

  it("defaults join policy to invite_only", () => {
    const result = createGroupSchema.parse({
      name: "Grupo default"
    });

    expect(result.joinPolicy).toBe("invite_only");
  });
});

describe("reviewJoinRequestSchema", () => {
  it("accepts review payload", () => {
    const result = reviewJoinRequestSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      requestId: "22222222-2222-4222-8222-222222222222",
      decision: "approved"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid decision", () => {
    const result = reviewJoinRequestSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      requestId: "22222222-2222-4222-8222-222222222222",
      decision: "pending"
    });

    expect(result.success).toBe(false);
  });
});

describe("joinGroupSchema", () => {
  it("normalizes join code to uppercase", () => {
    const result = joinGroupSchema.parse({ joinCode: "ab12cd34" });
    expect(result.joinCode).toBe("AB12CD34");
  });

  it("rejects empty code", () => {
    const result = joinGroupSchema.safeParse({ joinCode: "" });
    expect(result.success).toBe(false);
  });
});

describe("createPlaceSchema", () => {
  it("accepts valid payload and normalizes optional fields", () => {
    const result = createPlaceSchema.parse({
      groupId: "11111111-1111-4111-8111-111111111111",
      name: "La Bicicleta",
      address: "Madrid",
      notes: "  ",
      category: "  "
    });

    expect(result.notes).toBeNull();
    expect(result.category).toBeNull();
  });

  it("rejects missing required fields", () => {
    const result = createPlaceSchema.safeParse({
      groupId: "not-a-uuid",
      name: "",
      address: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid originalUrl", () => {
    const result = createPlaceSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      name: "Lugar",
      address: "Madrid",
      originalUrl: "not-a-url"
    });

    expect(result.success).toBe(false);
  });
});

describe("updatePlaceStatusSchema", () => {
  it("accepts allowed status values", () => {
    const result = updatePlaceStatusSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      status: "visited"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updatePlaceStatusSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      status: "archived"
    });

    expect(result.success).toBe(false);
  });
});

describe("updatePlaceLocationSchema", () => {
  it("rejects invalid latitude", () => {
    const result = updatePlaceLocationSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      address: "Madrid",
      latitude: 100,
      longitude: -3.7
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid longitude", () => {
    const result = updatePlaceLocationSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      address: "Madrid",
      latitude: 40.4,
      longitude: 200
    });

    expect(result.success).toBe(false);
  });
});

describe("friend request schemas", () => {
  it("sendFriendRequestSchema rejects invalid uuid", () => {
    const result = sendFriendRequestSchema.safeParse({
      receiverId: "invalid"
    });
    expect(result.success).toBe(false);
  });

  it("respondFriendRequestSchema accepts accepted/rejected only", () => {
    expect(
      respondFriendRequestSchema.safeParse({
        requestId: "11111111-1111-4111-8111-111111111111",
        decision: "accepted"
      }).success
    ).toBe(true);

    expect(
      respondFriendRequestSchema.safeParse({
        requestId: "11111111-1111-4111-8111-111111111111",
        decision: "rejected"
      }).success
    ).toBe(true);

    expect(
      respondFriendRequestSchema.safeParse({
        requestId: "11111111-1111-4111-8111-111111111111",
        decision: "pending"
      }).success
    ).toBe(false);
  });
});

describe("group invitation schemas", () => {
  it("inviteFriendToGroupSchema validates ids", () => {
    expect(
      inviteFriendToGroupSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        friendUserId: "22222222-2222-4222-8222-222222222222"
      }).success
    ).toBe(true);
  });

  it("respondGroupInvitationSchema accepts accepted/rejected", () => {
    expect(
      respondGroupInvitationSchema.safeParse({
        invitationId: "11111111-1111-4111-8111-111111111111",
        decision: "accepted"
      }).success
    ).toBe(true);
    expect(
      respondGroupInvitationSchema.safeParse({
        invitationId: "11111111-1111-4111-8111-111111111111",
        decision: "pending"
      }).success
    ).toBe(false);
  });
});
