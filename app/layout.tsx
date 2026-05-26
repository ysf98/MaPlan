import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { RouteTransition } from "@/components/layout/RouteTransition";

export const metadata: Metadata = {
  title: "MaPlan",
  description: "App social de mapas para grupos"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <RouteTransition>{children}</RouteTransition>
      </body>
    </html>
  );
}
