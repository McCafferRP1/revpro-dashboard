import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Use /app only when that env is set (for www.revpro.io/app proxy). On Netlify direct URL we serve at root. */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
