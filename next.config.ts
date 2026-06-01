import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ported JSX components; tighten types incrementally
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
