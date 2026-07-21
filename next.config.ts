import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // CV's en scans van handgeschreven formulieren gaan als File-argument mee met
      // een Server Action — de default van 1MB is te krap daarvoor.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
