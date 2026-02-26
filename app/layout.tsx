import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'
import { BottomNav } from "@/components/dukgu/bottom-nav"
import { UserProvider } from "@/context/user-context"
import Script from 'next/script' // 💡 Next.js 최적화 스크립트 컴포넌트

// 폰트 설정: 최대한 다양한 두께를 가져와서 디자인의 유연성을 높였습니다.
const notoSansKR = Noto_Sans_KR({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: '--font-noto', // CSS 변수로 활용 가능하게 설정
});

export const metadata: Metadata = {
  title: 'DUKGU - 금융 뉴스 커뮤니티',
  description: '매일 아침, 당신을 위한 금융 뉴스 브리핑',
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 모바일에서 줌 방지 (앱 같은 느낌을 줌)
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 💰 구글 애드센스 광고 엔진 스크립트 적용 */}
        {/* 기획자님의 게시자 ID(ca-pub-4762124054224861)가 정상 반영되었습니다. */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4762124054224861"
          crossOrigin="anonymous"
          strategy="afterInteractive" // 페이지 상호작용 후 로드하여 성능 최적화
        />
      </head>
      <body 
        className={`${notoSansKR.className} antialiased selection:bg-blue-100 selection:text-blue-900`} 
        suppressHydrationWarning
      >
        {/* UserProvider: 앱 전체에서 유저 로그인 상태를 공유 */}
        <UserProvider>
          <main className="min-h-screen pb-20"> {/* BottomNav 공간 확보 */}
            {children}
          </main>
          
          <BottomNav />
          <Analytics />

          {/* Toaster: 토스/뉴닉 스타일로 커스텀 설정 */}
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
                fontFamily: 'inherit', // body에 설정된 폰트 계승
              },
            }}
          />
        </UserProvider>
      </body>
    </html>
  )
}