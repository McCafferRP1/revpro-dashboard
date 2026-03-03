import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Served at www.revpro.io/app when proxied from main Netlify site */
  basePath: "/app",
};

export default nextConfig;
