import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ported JSX components; tighten types incrementally
    ignoreBuildErrors: true,
  },
  redirects: async () => [
    {
      source: "/vet-advertise",
      destination: "/partners?type=vet-clinics",
      permanent: true,
    },
  ],
};

export default nextConfig;
