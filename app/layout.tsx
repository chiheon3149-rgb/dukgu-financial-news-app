import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { BottomNav } from "@/components/dukgu/bottom-nav"
import { UserProvider } from "@/context/user-context"

const notoSansKR = Noto_Sans_KR({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

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
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKR.className} antialiased`} suppressHydrationWarning>
        {/* UserProvider로 감싸면 앱 전체가 하나의 유저 정보를 공유합니다 */}
        <UserProvider>
          {children}
          <BottomNav />
          <Analytics />
        </UserProvider>
      </body>
    </html>
  )
}
