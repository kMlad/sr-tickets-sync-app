import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Dev-only: allow the client `/_next/*` chunks to load when the dev server is
  // reached from a cross-origin host (ngrok tunnel, raw 127.0.0.1). Without this
  // Next 16 blocks those assets, the page never hydrates, and forms fall back to
  // a native full-page POST — so `useFormStatus` spinners never render.
  allowedDevOrigins: [
    "127.0.0.1",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
  ],
};

export default nextConfig;
