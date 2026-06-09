function getSupabaseOrigin() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    return "";
  }

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

export function getContentSecurityPolicy() {
  const supabaseOrigin = getSupabaseOrigin();
  const scriptSrc = process.env.NODE_ENV === "production" ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  const upgradeInsecureRequests = process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin} https://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://*.mapbox.com`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    upgradeInsecureRequests
  ]
    .filter(Boolean)
    .join("; ");
}

export function getSecurityHeaders() {
  const headers = [
    { key: "Content-Security-Policy", value: getContentSecurityPolicy() },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" }
  ];

  if (process.env.NODE_ENV === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload"
    });
  }

  return headers;
}
