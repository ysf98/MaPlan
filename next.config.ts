import type { NextConfig } from "next";
import { getSecurityHeaders } from "./lib/security/securityHeaders";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders()
      }
    ];
  }
};

export default nextConfig;
