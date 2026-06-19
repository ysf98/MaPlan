import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserMock = vi.fn();
const getPendingNotificationsCountForUserMock = vi.fn();
const checkRateLimitMock = vi.fn();

vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/notifications", () => ({
  getPendingNotificationsCountForUser: getPendingNotificationsCountForUserMock
}));

vi.mock("@/lib/security/rateLimit", () => ({
  checkRateLimit: checkRateLimitMock,
  rateLimitExceededResponse: vi.fn()
}));

describe("GET /api/notifications/count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue({ allowed: true });
  });

  it("requires authentication", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/notifications/count/route");

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "No autenticado." });
    expect(getPendingNotificationsCountForUserMock).not.toHaveBeenCalled();
  });

  it("returns the server notification count", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    getPendingNotificationsCountForUserMock.mockResolvedValue(4);
    const { GET } = await import("@/app/api/notifications/count/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ count: 4 });
    expect(getPendingNotificationsCountForUserMock).toHaveBeenCalledWith("user-1");
  });
});
