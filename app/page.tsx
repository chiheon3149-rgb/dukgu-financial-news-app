"use client"

import { StickyHeader } from "@/components/dukgu/sticky-header"
import { TickerBar } from "@/components/dukgu/ticker-bar"
import { HeroBanner } from "@/components/dukgu/hero-banner"
import { NoticeBanner } from "@/components/dukgu/notice-banner"
import { NewsSection } from "@/components/dukgu/news-section"

// 💡 [추가] 관리자 버튼을 위해 필요한 도구들
import { useUser } from "@/context/user-context"
import Link from "next/link"
import { PenTool } from "lucide-react"

export default function HomePage() {
  // 💡 [핵심] 현재 접속한 유저 정보를 가져와서 관리자인지 확인합니다.
  const { profile } = useUser()
  const isAdmin = profile?.is_admin === true

  return (
    <div className="min-h-dvh bg-slate-50 pb-20 overflow-x-hidden relative">
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

      {/* 💡 [핵심] 관리자 전용 '비밀 엘리베이터' (플로팅 버튼) */}
      {isAdmin && (
        <div className="fixed bottom-24 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <Link
            href="/news/new"
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all font-bold text-[13px]"
          >
            <PenTool className="w-4 h-4" />
            뉴스 발행
          </Link>
        </div>
      )}
    </div>
  )
}