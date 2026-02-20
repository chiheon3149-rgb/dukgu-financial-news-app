import Link from "next/link"
import { StickyHeader } from "@/components/dukgu/sticky-header"
import { TickerBar } from "@/components/dukgu/ticker-bar"
import { HeroBanner } from "@/components/dukgu/hero-banner"
import { AdBanner } from "@/components/dukgu/ad-banner" 
// 💡 퀴즈 배너 부품 수입!
import { TriviaBanner } from "@/components/dukgu/trivia-banner"
import { NewsFeed } from "@/components/dukgu/news-feed"
import { BottomNav } from "@/components/dukgu/bottom-nav"

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background pb-20 overflow-x-hidden"> 
      
      {/* 1. 최상단 헤더 */}
      <StickyHeader />

      {/* 2. 흐르는 티커 */}
      <TickerBar />

      <main className="w-full max-w-md mx-auto px-4">
        
        {/* 3. 조간/마감 리포트 */}
        <HeroBanner />

        {/* 4. 💡 상식 퀴즈 배너 (부품으로 교체 완료!) */}
        <div className="mt-1 mb-4">
          <TriviaBanner />
        </div>

        {/* 5. 광고 배너 */}
        <div className="my-3">
          <AdBanner />
        </div>

        {/* 6. 실시간 뉴스 타임라인 */}
        <NewsFeed />

      </main>

      {/* 7. 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}