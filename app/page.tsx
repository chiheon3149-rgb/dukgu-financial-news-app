// layout.tsx에서 이미 BottomNav를 렌더링하므로 여기선 제거합니다.
import { StickyHeader } from "@/components/dukgu/sticky-header"
import { TickerBar } from "@/components/dukgu/ticker-bar"
import { HeroBanner } from "@/components/dukgu/hero-banner"
// import { AdBanner } from "@/components/dukgu/ad-banner" // 💡 더 이상 여기서 직접 부를 필요가 없습니다.
import { NoticeBanner } from "@/components/dukgu/notice-banner"
import { NewsSection } from "@/components/dukgu/news-section"

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-slate-50 pb-20 overflow-x-hidden">
      <StickyHeader />
      <TickerBar />
      <main className="w-full max-w-md mx-auto px-4 py-5 space-y-3">
        {/* 1. 최상단 공지사항 */}
        <NoticeBanner />
        
        {/* 2. 오늘의 브리핑 히어로 (태그 위치가 위로 수정된 버전) */}
        <HeroBanner />
        
        {/* 💡 기존 <AdBanner /> 자리를 비워서 뉴스가 바로 보이도록 수정했습니다. */}
        
        {/* 3. 뉴스 섹션 (이 내부의 NewsFeed에서 8개마다 광고가 자동으로 노출됩니다) */}
        <div className="pt-2">
          <NewsSection />
        </div>
      </main>
    </div>
  )
}