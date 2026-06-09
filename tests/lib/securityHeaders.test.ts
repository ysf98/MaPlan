import { describe, expect, it } from "vitest";
import { getContentSecurityPolicy, getSecurityHeaders } from "@/lib/security/securityHeaders";

describe("security headers", () => {
  it("incluye cabeceras base de endurecimiento", () => {
    const headers = getSecurityHeaders();

    expect(headers).toEqual(
      expect.arrayContaining([
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
      ])
    );
  });

  it("mantiene permisos de geolocalizacion solo para la propia app", () => {
    expect(getSecurityHeaders()).toContainEqual({
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(self)"
    });
  });

  it("permite conexiones necesarias para Supabase y Mapbox en CSP", () => {
    const csp = getContentSecurityPolicy();

    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("https://*.supabase.co");
    expect(csp).toContain("https://api.mapbox.com");
    expect(csp).toContain("worker-src 'self' blob:");
  });
});
