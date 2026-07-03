import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { RouteTransition } from "@/components/layout/RouteTransition";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-vc",
  display: "swap"
});

export const metadata: Metadata = {
  title: "MaPlan",
  description: "App social de mapas para grupos",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3d7db"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${plusJakartaSans.variable} font-sans`}>
        <RouteTransition>{children}</RouteTransition>
      </body>
    </html>
  );
}
