"use client"

import { StickyHeader } from "@/components/dukgu/sticky-header"
import { TickerBar } from "@/components/dukgu/ticker-bar"
import { HeroBanner } from "@/components/dukgu/hero-banner"
import { AdBanner } from "@/components/dukgu/ad-banner" 
import { NewsFeed } from "@/components/dukgu/news-feed"
import { BottomNav } from "@/components/dukgu/bottom-nav"
import { NoticeBanner } from "@/components/dukgu/notice-banner"
// 💡 1. 방금 만든 검색 바 부품을 수입해 옵니다!
import { SearchBar } from "@/components/dukgu/search-bar"

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-slate-50 pb-20 overflow-x-hidden"> 
      
      <StickyHeader />
      <TickerBar />

      <main className="w-full max-w-md mx-auto px-4 py-5 space-y-3">
        
        {/* 📢 2. 시스템 공지사항 */}
        <NoticeBanner />

        {/* 🚀 3. 조간/마감 브리핑 리포트 */}
        <HeroBanner />

        {/* 💵 4. 광고 배너 */}
        <AdBanner />

        {/* 📰 5. 실시간 뉴스 영역 */}
        <div className="pt-2">
          {/* 💡 2. 뉴스 피드 바로 위에 검색 바를 조립합니다! */}
          <SearchBar />
          
          <NewsFeed />
        </div>

      </main>

      <BottomNav />
    </div>
  )
}