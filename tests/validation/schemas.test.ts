import { describe, expect, it } from "vitest";
import {
  createGroupSchema,
  joinGroupSchema,
  createPlaceSchema,
  reviewJoinRequestSchema,
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
});

describe("reviewJoinRequestSchema", () => {
  it("accepts review payload", () => {
    const result = reviewJoinRequestSchema.safeParse({
      groupId: "group-1",
      requestId: "request-1",
      decision: "approved"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid decision", () => {
    const result = reviewJoinRequestSchema.safeParse({
      groupId: "group-1",
      requestId: "request-1",
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
      groupId: "group-1",
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
      groupId: "",
      name: "",
      address: ""
    });

    expect(result.success).toBe(false);
  });
});

describe("updatePlaceStatusSchema", () => {
  it("accepts allowed status values", () => {
    const result = updatePlaceStatusSchema.safeParse({
      groupId: "group-1",
      placeId: "place-1",
      status: "visited"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updatePlaceStatusSchema.safeParse({
      groupId: "group-1",
      placeId: "place-1",
      status: "archived"
    });

    expect(result.success).toBe(false);
  });
});
