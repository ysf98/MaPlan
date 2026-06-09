import { describe, expect, it } from "vitest";
import { getSafeInternalPath } from "@/lib/navigation/safeRedirect";

describe("getSafeInternalPath", () => {
  it("acepta rutas internas con query y hash", () => {
    expect(getSafeInternalPath("/profile/places?filter=favorites#top")).toBe("/profile/places?filter=favorites#top");
  });

  it("rechaza redirects absolutos o protocol-relative", () => {
    expect(getSafeInternalPath("https://evil.example")).toBe("/dashboard");
    expect(getSafeInternalPath("//evil.example/path")).toBe("/dashboard");
  });

  it("rechaza rutas vacias o con backslash inicial", () => {
    expect(getSafeInternalPath("")).toBe("/dashboard");
    expect(getSafeInternalPath("/\\evil.example")).toBe("/dashboard");
  });

  it("permite fallback explicito", () => {
    expect(getSafeInternalPath("https://evil.example", "/login")).toBe("/login");
  });
});
