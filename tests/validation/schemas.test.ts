import { describe, expect, it } from "vitest";
import {
  addPlaceToGroupPlanSchema,
  createGroupPlanSchema,
  createGroupSchema,
  deleteAccountSchema,
  createGroupChatMessageSchema,
  deleteGroupPlanSchema,
  deleteGroupChatMessageSchema,
  friendSearchQuerySchema,
  googlePlaceDetailsSchema,
  googlePlacesNearbyRecommendationsSchema,
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
  voteGroupPlanSchema,
  updatePersonalPlaceFavoriteSchema,
  updatePersonalPlaceStatusSchema,
  updateGroupPlanDateSchema,
  updateGroupPlanDetailsSchema,
  updateGroupPlanPlaceTimeSchema,
  reorderGroupPlanPlacesSchema,
  removeGroupPlanPlaceSchema,
  updatePlaceLocationSchema,
  updatePlaceFavoriteSchema,
  updatePlaceStatusSchema
} from "@/lib/validation/schemas";

describe("deleteAccountSchema", () => {
  it("exige confirmacion literal", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: "ELIMINAR" }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirmation: "eliminar" }).success).toBe(false);
  });
});

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

describe("group plan schemas", () => {
  it("createGroupPlanSchema accepts optional initial place fields", () => {
    const result = createGroupPlanSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      title: "Cena del viernes",
      description: "Tapas",
      plannedDate: "2099-06-20",
      initialPlaceId: "22222222-2222-4222-8222-222222222222",
      initialPlacePlannedAt: "2099-06-20T21:30",
      initialPlaceNote: "Reservar terraza"
    });

    expect(result.success).toBe(true);
  });

  it("createGroupPlanSchema accepts Spanish plan dates", () => {
    const result = createGroupPlanSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      title: "Cena del viernes",
      plannedDate: "20/06/2099"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid planned dates in plans", () => {
    const result = createGroupPlanSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      title: "Plan raro",
      plannedDate: "no-fecha"
    });

    expect(result.success).toBe(false);
  });

  it("rejects impossible Spanish planned dates in plans", () => {
    const result = createGroupPlanSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      title: "Plan raro",
      plannedDate: "31/02/2099"
    });

    expect(result.success).toBe(false);
  });

  it("rejects past planned dates in plans", () => {
    const result = createGroupPlanSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      title: "Plan pasado",
      plannedDate: "2000-01-01"
    });

    expect(result.success).toBe(false);
  });

  it("addPlaceToGroupPlanSchema validates ids and note", () => {
    const result = addPlaceToGroupPlanSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      planId: "22222222-2222-4222-8222-222222222222",
      placeId: "33333333-3333-4333-8333-333333333333",
      plannedAt: "2099-06-21T18:30",
      note: "Quedar primero aqui"
    });

    expect(result.success).toBe(true);
  });

  it("voteGroupPlanSchema accepts only supported votes", () => {
    expect(
      voteGroupPlanSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        vote: "attending"
      }).success
    ).toBe(true);

    expect(
      voteGroupPlanSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        vote: "maybe"
      }).success
    ).toBe(true);

    expect(
      voteGroupPlanSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        vote: "unknown"
      }).success
    ).toBe(false);
  });

  it("deleteGroupPlanSchema validates ids", () => {
    expect(
      deleteGroupPlanSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222"
      }).success
    ).toBe(true);
  });

  it("updateGroupPlanDateSchema validates plan date changes", () => {
    expect(
      updateGroupPlanDateSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        plannedDate: "2099-07-10"
      }).success
    ).toBe(true);
  });

  it("updateGroupPlanDateSchema rejects past plan dates", () => {
    expect(
      updateGroupPlanDateSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        plannedDate: "2000-01-01"
      }).success
    ).toBe(false);
  });

  it("updateGroupPlanDetailsSchema validates title and date", () => {
    expect(
      updateGroupPlanDetailsSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        title: "Sabado",
        plannedDate: "2099-07-10"
      }).success
    ).toBe(true);

    expect(
      updateGroupPlanDetailsSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        title: "   ",
        plannedDate: "2099-07-10"
      }).success
    ).toBe(false);
  });

  it("removeGroupPlanPlaceSchema validates plan stop ids", () => {
    expect(
      removeGroupPlanPlaceSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        planPlaceId: "33333333-3333-4333-8333-333333333333"
      }).success
    ).toBe(true);
  });

  it("updateGroupPlanPlaceTimeSchema accepts optional planned time", () => {
    expect(
      updateGroupPlanPlaceTimeSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        planPlaceId: "33333333-3333-4333-8333-333333333333",
        plannedAt: "2099-07-10T21:15"
      }).success
    ).toBe(true);

    expect(
      updateGroupPlanPlaceTimeSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        planPlaceId: "33333333-3333-4333-8333-333333333333",
        plannedAt: ""
      }).success
    ).toBe(true);
  });

  it("reorderGroupPlanPlacesSchema validates ordered stop ids", () => {
    expect(
      reorderGroupPlanPlacesSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        orderedPlanPlaceIds: ["33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444"]
      }).success
    ).toBe(true);

    expect(
      reorderGroupPlanPlacesSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        orderedPlanPlaceIds: []
      }).success
    ).toBe(false);
  });
});

describe("group chat schemas", () => {
  it("createGroupChatMessageSchema accepts normal messages", () => {
    const result = createGroupChatMessageSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      content: "Quedamos a las 21?",
      kind: "message",
      planId: "",
      placeId: "",
      planPlaceId: ""
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.planId).toBeNull();
    }
  });

  it("createGroupChatMessageSchema accepts plan suggestions with context", () => {
    expect(
      createGroupChatMessageSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        content: "Podriamos meter este sitio en la ruta.",
        kind: "plan_suggestion",
        planId: "22222222-2222-4222-8222-222222222222",
        placeId: "33333333-3333-4333-8333-333333333333",
        planPlaceId: ""
      }).success
    ).toBe(true);
  });

  it("createGroupChatMessageSchema rejects empty messages and invalid kind", () => {
    expect(
      createGroupChatMessageSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        content: "   ",
        kind: "message"
      }).success
    ).toBe(false);

    expect(
      createGroupChatMessageSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        content: "Hola",
        kind: "system"
      }).success
    ).toBe(false);
  });

  it("deleteGroupChatMessageSchema validates ids", () => {
    expect(
      deleteGroupChatMessageSchema.safeParse({
        groupId: "11111111-1111-4111-8111-111111111111",
        messageId: "22222222-2222-4222-8222-222222222222"
      }).success
    ).toBe(true);
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

  it("does not accept favorite during creation", () => {
    const result = createPlaceSchema.parse({
      groupId: "11111111-1111-4111-8111-111111111111",
      name: "La Bicicleta",
      address: "Madrid",
      isFavorite: "true"
    });

    expect("isFavorite" in result).toBe(false);
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

  it("accepts Google rating metadata", () => {
    const result = createPlaceSchema.parse({
      groupId: "11111111-1111-4111-8111-111111111111",
      name: "Lugar",
      address: "Madrid",
      rating: "4.6",
      userRatingsTotal: "128"
    });

    expect(result.rating).toBe(4.6);
    expect(result.userRatingsTotal).toBe(128);
  });

  it("rejects invalid Google rating metadata", () => {
    const result = createPlaceSchema.safeParse({
      groupId: "11111111-1111-4111-8111-111111111111",
      name: "Lugar",
      address: "Madrid",
      rating: "6",
      userRatingsTotal: "-1"
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

  it("accepts Google rating metadata for personal places", () => {
    const result = createPersonalPlaceSchema.parse({
      name: "Mi cafe",
      address: "Madrid",
      latitude: 40.4,
      longitude: -3.7,
      rating: "4.2",
      userRatingsTotal: "54"
    });

    expect(result.rating).toBe(4.2);
    expect(result.userRatingsTotal).toBe(54);
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

describe("updatePersonalPlaceStatusSchema", () => {
  it("accepts allowed personal status values", () => {
    const result = updatePersonalPlaceStatusSchema.safeParse({
      placeId: "22222222-2222-4222-8222-222222222222",
      status: "visited"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid personal status", () => {
    const result = updatePersonalPlaceStatusSchema.safeParse({
      placeId: "22222222-2222-4222-8222-222222222222",
      status: "favorite"
    });

    expect(result.success).toBe(false);
  });
});

describe("updatePersonalPlaceFavoriteSchema", () => {
  it("accepts boolean-like personal favorite values", () => {
    const result = updatePersonalPlaceFavoriteSchema.safeParse({
      placeId: "22222222-2222-4222-8222-222222222222",
      isFavorite: "true"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFavorite).toBe(true);
    }
  });

  it("rejects invalid personal favorite values", () => {
    const result = updatePersonalPlaceFavoriteSchema.safeParse({
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

  it("googlePlacesNearbyRecommendationsSchema validates category and radius", () => {
    expect(
      googlePlacesNearbyRecommendationsSchema.parse({
        lat: 40.4168,
        lng: -3.7038,
        category: "sports",
        radius: 1800
      })
    ).toEqual({
      lat: 40.4168,
      lng: -3.7038,
      category: "sports",
      radius: 1800
    });

    expect(
      googlePlacesNearbyRecommendationsSchema.parse({
        lat: 40.4168,
        lng: -3.7038
      }).category
    ).toBe("popular");

    expect(
      googlePlacesNearbyRecommendationsSchema.safeParse({
        lat: 40.4168,
        lng: -3.7038,
        category: "invalid"
      }).success
    ).toBe(false);
  });
});
