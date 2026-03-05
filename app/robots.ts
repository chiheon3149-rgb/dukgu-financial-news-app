import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // 💡 모든 검색엔진 로봇(구글, 네이버 등)에게 적용
      allow: '/',     // 💡 기본적으로 모든 페이지 접근 허용
      disallow: [
        // 🚫 로봇이 굳이 들어올 필요가 없거나, 개인정보가 있는 '출입 금지 구역'
        '/api/',       // 백엔드 데이터 통신 경로
        '/auth/',      // 로그인 인증 처리 경로
        '/assets/',    // 🔒 개인 자산 관리 (주식, 금, 채권 등) - 여긴 봇이 오면 안 됨!
        '/login',      // 로그인 페이지
        '/onboarding', // 온보딩 페이지
      ],
    },
    // 💡 로봇이 우리 사이트에 오자마자 "도면(Sitemap) 여깄습니다" 하고 쥐여주는 역할
    sitemap: 'https://dukgu.kr/sitemap.xml',
  }
}