import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["yahoo-finance2"],
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.yimg.com",
      },
    ],
  },
}

export default nextConfig