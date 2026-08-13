import type { Metadata, Viewport } from "next";

import "./globals.css";

/**
 * The commit this build came from, baked in at build time. Render sets
 * RENDER_GIT_COMMIT automatically; locally there's no such thing, hence "dev".
 *
 * It's here so "is the deploy actually live?" is answerable with one request
 * instead of hunting for a visible feature that changed — which is exactly the
 * question that was hard to answer while auto-deploy was silently broken.
 */
const BUILD_COMMIT = process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? "dev";

export const metadata: Metadata = {
  title: "Stefo — DPT Rotation Schedule",
  description:
    "DPT clinical rotation schedule for USC Verdugo Hills Hospital, Physical Medicine & Rehabilitation.",
  other: { "stefo-build": BUILD_COMMIT },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
