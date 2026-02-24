// layout.tsx에서 이미 BottomNav를 렌더링하므로 여기선 제거합니다.
import { StickyHeader } from "@/components/dukgu/sticky-header"
import { TickerBar } from "@/components/dukgu/ticker-bar"
import { HeroBanner } from "@/components/dukgu/hero-banner"
import { AdBanner } from "@/components/dukgu/ad-banner"
import { NoticeBanner } from "@/components/dukgu/notice-banner"
import { NewsSection } from "@/components/dukgu/news-section"

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-slate-50 pb-20 overflow-x-hidden">
      <StickyHeader />
      <TickerBar />
      <main className="w-full max-w-md mx-auto px-4 py-5 space-y-3">
        <NoticeBanner />
        <HeroBanner />
        <AdBanner />
        <NewsSection />
      </main>
    </div>
  )
}
