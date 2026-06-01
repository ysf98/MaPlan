import { describe, expect, it } from "vitest";
import {
  createGroupSchema,
  friendSearchQuerySchema,
  googlePlaceDetailsSchema,
  googlePlacesNearbySchema,
  googlePlacesSearchSchema,
  inviteFriendToGroupSchema,
  joinGroupSchema,
  createPlaceSchema,
  createPersonalPlaceSchema,
  respondGroupInvitationSchema,
  respondFriendRequestSchema,
  reviewJoinRequestSchema,
  sendFriendRequestSchema,
  updatePlaceLocationSchema,
  updatePlaceFavoriteSchema,
  updatePlaceStatusSchema
} from "@/lib/validation/schemas";

describe("createGroupSchema", () => {
  it("accepts valid payload", () => {
    const result = createGroupSchema.safeParse({
      name: "Madrid Crew",
      description: "Planes de finde",
      privacy: "privado",
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

  it("accepts privacy values", () => {
    const result = createGroupSchema.safeParse({
      name: "Grupo privado",
      privacy: "abierto"
    });

    expect(result.success).toBe(true);
  });

  it("defaults privacy to abierto", () => {
    const result = createGroupSchema.parse({
      name: "Grupo default"
    });

    expect(result.privacy).toBe("abierto");
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

describe("createPersonalPlaceSchema", () => {
  it("accepts valid personal place payload", () => {
    const result = createPersonalPlaceSchema.safeParse({
      name: "Mi cafe",
      address: "Madrid",
      latitude: 40.4,
      longitude: -3.7,
      provider: "manual"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid coordinates", () => {
    const result = createPersonalPlaceSchema.safeParse({
      name: "Mi cafe",
      address: "Madrid",
      latitude: 100,
      longitude: -3.7
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

  it("rejects favorite as status because favorite is independent", () => {
    const result = updatePlaceStatusSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      status: "favorite"
    });

    expect(result.success).toBe(false);
  });
});

describe("updatePlaceFavoriteSchema", () => {
  it("accepts boolean-like favorite values", () => {
    const result = updatePlaceFavoriteSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      isFavorite: "true"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFavorite).toBe(true);
    }
  });

  it("rejects invalid favorite values", () => {
    const result = updatePlaceFavoriteSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      isFavorite: "yes"
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

describe("api schemas", () => {
  it("friendSearchQuerySchema trims and enforces length", () => {
    expect(friendSearchQuerySchema.parse({ q: "  ana " }).q).toBe("ana");
    expect(friendSearchQuerySchema.safeParse({ q: "a" }).success).toBe(false);
    expect(friendSearchQuerySchema.safeParse({ q: "a".repeat(81) }).success).toBe(false);
  });

  it("googlePlacesSearchSchema validates query and center", () => {
    expect(
      googlePlacesSearchSchema.safeParse({
        query: "cafeterias madrid",
        center: { lat: 40.4168, lng: -3.7038 }
      }).success
    ).toBe(true);
    expect(googlePlacesSearchSchema.safeParse({ query: "ca" }).success).toBe(false);
    expect(
      googlePlacesSearchSchema.safeParse({
        query: "cafeterias madrid",
        center: { lat: 120, lng: -3.7038 }
      }).success
    ).toBe(false);
  });

  it("googlePlaceDetailsSchema validates external place id", () => {
    expect(googlePlaceDetailsSchema.parse({ externalPlaceId: "  ChIJ123 " }).externalPlaceId).toBe("ChIJ123");
    expect(googlePlaceDetailsSchema.safeParse({ externalPlaceId: "" }).success).toBe(false);
    expect(googlePlaceDetailsSchema.safeParse({ externalPlaceId: "a".repeat(256) }).success).toBe(false);
  });

  it("googlePlacesNearbySchema validates latitude and longitude", () => {
    expect(
      googlePlacesNearbySchema.safeParse({
        lat: 40.4168,
        lng: -3.7038,
        selectedName: "Bar Sol"
      }).success
    ).toBe(true);

    expect(
      googlePlacesNearbySchema.safeParse({
        lat: 140.4168,
        lng: -3.7038
      }).success
    ).toBe(false);
  });
});
