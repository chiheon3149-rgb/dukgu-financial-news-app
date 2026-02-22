import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Yahoo Finance 이미지 도메인 허용 (향후 로고 등에 사용)
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
