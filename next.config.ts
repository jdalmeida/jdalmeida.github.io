import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Credential photos are uploaded through a server action (/admin/credenciais), already shrunk to ~960px in the browser.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
