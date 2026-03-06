import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'
import { BottomNav } from "@/components/dukgu/bottom-nav"
import { UserProvider } from "@/context/user-context"
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'

// 폰트 설정
const notoSansKR = Noto_Sans_KR({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: '--font-noto',
});

// [Metadata] 브랜딩을 '덕구의 뉴스곳간'으로 변경하고 SEO를 강화했습니다.
export const metadata: Metadata = {
  // 💡 한글 이름을 앞세워 검색 노출 확률을 높였습니다.
  title: '덕구의 뉴스곳간 | 금융 뉴스 브리핑',
  description: '매일 아침 AI가 요약해주는 쉽고 빠른 금융 뉴스 브리핑과 투자 커뮤니티, 덕구의 뉴스곳간에서 자산 관리의 시작을 함께하세요.',
  
  // 💡 대표 URL을 설정하여 네이버/구글 로봇의 리다이렉트 혼란을 방지합니다.
  alternates: {
    canonical: 'https://dukgu.kr',
  },

  // 파비콘 설정
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },

  verification: {
    other: {
      'naver-site-verification': 'b16874540c6463742d69cd200393d57d7de1cf25',
    },
  },

  // 오픈 그래프 (카톡, 소셜 공유용)
  openGraph: {
    title: '덕구의 뉴스곳간 - 매일 아침 금융 뉴스 브리핑',
    description: '어려운 경제 뉴스도 덕구가 쉽고 빠르게 요약해드린다냥! 🐾',
    url: 'https://dukgu.kr',
    siteName: '덕구의 뉴스곳간',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: 'https://dukgu.kr/og-image.png',
        width: 1200,
        height: 630,
        alt: '덕구의 뉴스곳간 메인 이미지',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <GoogleTagManager gtmId="GTM-WMV8P3DM" />
      <head>
        {/* 구글 애드센스 광고 엔진 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4762124054224861"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body 
        className={`${notoSansKR.className} antialiased selection:bg-blue-100 selection:text-blue-900`} 
        suppressHydrationWarning
      >
        <UserProvider>
          <main className="min-h-screen pb-20">
            {children}
          </main>
          
          <BottomNav />
          <Analytics />

          <Toaster 
            position="bottom-center" 
            richColors 
            closeButton
            expand={false}
            toastOptions={{
              style: {
                borderRadius: '24px',
                padding: '16px 20px',
                fontSize: '14px',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                fontFamily: 'inherit',
              },
            }}
          />
        </UserProvider>
      </body>
    </html>
  )
}