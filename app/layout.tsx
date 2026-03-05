import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'
import { BottomNav } from "@/components/dukgu/bottom-nav"
import { UserProvider } from "@/context/user-context"
import Script from 'next/script'

// 폰트 설정
const notoSansKR = Noto_Sans_KR({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: '--font-noto',
});

// [Metadata] SEO 및 소셜 공유, 파비콘 설정을 관리합니다.
export const metadata: Metadata = {
  title: 'DUKGU - 금융 뉴스 커뮤니티',
  description: '매일 아침, 당신을 위한 금융 뉴스 브리핑',
  
  // 💡 [수정] 직접 만드신 favicon.ico를 가장 먼저 인식하도록 순서를 조정했습니다.
  icons: {
    icon: '/favicon.ico',          // 브라우저 탭 및 검색 결과용 표준 아이콘
    shortcut: '/favicon.ico',      // 즐겨찾기 아이콘
    apple: '/apple-icon.png',      // 아이폰 홈화면용 (이미지가 더 고해상도라 그대로 둠)
  },

  verification: {
    other: {
      'naver-site-verification': 'b16874540c6463742d69cd200393d57d7de1cf25',
    },
  },

  // 오픈 그래프: 카카오톡/페이스북 공유 시 보이는 카드 정보
  openGraph: {
    title: 'DUKGU - 금융 뉴스 커뮤니티',
    description: '매일 아침, 당신을 위한 금융 뉴스 브리핑',
    url: 'https://dukgu.kr',
    siteName: 'DUKGU',
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