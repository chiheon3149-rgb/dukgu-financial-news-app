import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
// 💡 네비게이션 부품만 불러옵니다.
import { BottomNav } from "@/components/dukgu/bottom-nav" 

const notoSansKR = Noto_Sans_KR({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'DUKGU - 금융 뉴스 커뮤니티',
  description: '매일 아침, 당신을 위한 금융 뉴스 브리핑',
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
    <html lang="ko">
      <body className={`${notoSansKR.className} antialiased`}>
        {/* 💡 울타리(div) 없이 바로 children을 뿌려줍니다. 
            이렇게 해야 전광판이 화면 끝까지 시원하게 나갑니다. */}
        {children}

        {/* 💡 네비게이션은 여기에 한 번만 두면 끝! */}
        <BottomNav />
        
        <Analytics />
      </body>
    </html>
  )
}