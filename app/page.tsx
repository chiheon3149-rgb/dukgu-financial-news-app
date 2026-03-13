"use client"

import { StickyHeader } from "@/components/dukgu/sticky-header"
import { BriefingBanner } from "@/components/dukgu/briefing-banner"
import { MarketSentimentCard } from "@/components/dukgu/market-sentiment-card"
import { NewsSection } from "@/components/dukgu/news-section"
import { useUser } from "@/context/user-context"
import Link from "next/link"
import { PenTool } from "lucide-react"

export default function HomePage() {
  const { profile } = useUser()
  const isAdmin = profile?.is_admin === true

  return (
    <div className="min-h-dvh pb-20 relative">
      <StickyHeader />


      <main className="w-full px-4 pt-3 pb-5 space-y-4">
        <BriefingBanner />
        <MarketSentimentCard />
        <NewsSection />
      </main>

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
