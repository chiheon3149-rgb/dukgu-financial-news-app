"use client"

import { StickyHeader } from "@/components/dukgu/sticky-header"
import { TickerBar } from "@/components/dukgu/ticker-bar"
import { HeroBanner } from "@/components/dukgu/hero-banner"
import { NoticeBanner } from "@/components/dukgu/notice-banner"
import { NewsSection } from "@/components/dukgu/news-section"

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-slate-50 pb-20 overflow-x-hidden">
      {/* 고정 헤더 */}
      <StickyHeader />
      
      {/* 실시간 티커 - 헤더 바로 아래 밀착 */}
      <TickerBar />
      
      {/* 메인 컨텐츠 - py-5에서 py-3으로 높이 압축 */}
      <main className="w-full max-w-md mx-auto px-4 py-3 space-y-3">
        {/* 1. 최상단 공지사항 */}
        <NoticeBanner />
        
        {/* 2. 오늘의 브리핑 히어로 */}
        <HeroBanner />
        
        {/* 3. 뉴스 섹션 - 상단 여백 최소화 */}
        <div className="pt-1">
          <NewsSection />
        </div>
      </main>
    </div>
  )
}