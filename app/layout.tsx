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

// [수정 포인트] Metadata API를 사용하여 네이버 소유 확인을 추가했습니다.
export const metadata: Metadata = {
  title: 'DUKGU - 금융 뉴스 커뮤니티',
  description: '매일 아침, 당신을 위한 금융 뉴스 브리핑',
  verification: {
    other: {
      'naver-site-verification': 'b16874540c6463742d69cd200393d57d7de1cf25',
    },
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