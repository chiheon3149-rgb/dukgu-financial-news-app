"use client"

import React, { useEffect, useRef } from "react"
import Link from "next/link"
import { NewsCard } from "./news-card"
import { Loader2 } from "lucide-react"
import { AdBanner } from "./ad-banner"
import type { SortOption } from "./news-section"
import type { MarketTab } from "@/hooks/use-news-feed" // ✅ Import 경로 수정 완료

const SCROLL_KEY = "newsListScrollY"

// 한국 증시 관련 태그 키워드
const KR_KEYWORDS = ["코스피", "코스닥", "삼성", "현대", "LG", "SK", "카카오", "네이버", "한국", "국내", "코스", "원화", "KRW"]
// 미국 증시 관련 태그 키워드
const US_KEYWORDS = ["나스닥", "S&P", "다우", "테슬라", "NVIDIA", "애플", "구글", "메타", "마이크로소프트", "미국", "월가", "연준", "Fed", "달러", "TSLA", "AAPL", "NVDA"]

function matchesMarket(item: any, tab: MarketTab): boolean {
  if (tab === "all") return true
  // market 필드가 명시된 경우 우선 적용
  const m = item.market as string | null | undefined
  if (m === "common") return true
  if (m === "kr") return tab === "kr"
  if (m === "us") return tab === "us"
  // market 필드 없는 구데이터: 키워드 기반 fallback
  const keywords = tab === "kr" ? KR_KEYWORDS : US_KEYWORDS
  const searchText = [
    item.headline ?? "",
    item.summary ?? "",
    ...(item.tags ?? []),
  ].join(" ").toLowerCase()
  return keywords.some((kw) => searchText.includes(kw.toLowerCase()))
}

interface NewsFeedProps {
  news: any[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  fetchNextPage: () => void
  searchKeyword?: string
  sortBy: SortOption
  marketTab?: MarketTab
}

export function NewsFeed({
  news,
  isLoading,
  isLoadingMore,
  hasMore,
  fetchNextPage,
  searchKeyword = "",
  sortBy,
  marketTab = "all",
}: NewsFeedProps) {

  const keyword = searchKeyword.trim().toLowerCase()
  const filteredNews = news
    .filter((item) => matchesMarket(item, marketTab))
    .filter((item) => {
      if (!keyword) return true
      const inHeadline = item.headline.toLowerCase().includes(keyword)
      const inSummary  = item.summary.toLowerCase().includes(keyword)
      const inTags     = item.tags.some((tag: string) => tag.toLowerCase().includes(keyword))
      return inHeadline || inSummary || inTags
    })

  const observerTarget = useRef<HTMLDivElement>(null)
  const scrollRestored = useRef(false)

  // 1. 스크롤 복구 로직
  useEffect(() => {
    if (isLoading || news.length === 0 || scrollRestored.current) return
    scrollRestored.current = true
    const savedY = sessionStorage.getItem(SCROLL_KEY)
    if (savedY) {
      sessionStorage.removeItem(SCROLL_KEY)
      requestAnimationFrame(() => {
        window.scrollTo({ top: parseInt(savedY, 10), behavior: "instant" })
      })
    }
  }, [isLoading, news.length])

  // 2. 무한 스크롤 로직
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          fetchNextPage()
        }
      },
      { threshold: 1.0 }
    )
    const target = observerTarget.current
    if (target) observer.observe(target)
    return () => observer.disconnect()
  }, [isLoadingMore, hasMore, fetchNextPage])

  // 3. 로딩 처리
  if (isLoading && news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
        <p className="text-sm font-bold tracking-tighter text-slate-900">최신 정보를 가져오고 있다냥... 🐾</p>
      </div>
    )
  }

  return (
    <section className="px-0 pb-24 max-w-lg mx-auto">
      <div className="flex flex-col gap-3">
        {filteredNews.map((item, index) => (
          <React.Fragment key={item.id}>
            <Link
              href={`/news/${item.id}`}
              className="block"
              onClick={() => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))}
            >
              <NewsCard {...item} />
            </Link>

            {/* 업그레이드된 수익형 광고 로직! 7개마다 띄우고, 데이터가 7개 미만이면 맨 마지막에 띄움 */}
            {(() => {
              const isLastItem = index === filteredNews.length - 1;
              const isEverySeventh = (index + 1) % 7 === 0;

              if (filteredNews.length >= 7) {
                if (isEverySeventh) {
                  return <div className="py-1"><AdBanner /></div>;
                }
              } else if (isLastItem && !isLoadingMore) {
                // 검색 등으로 결과가 7개 미만일 때 마지막에 노출
                return <div className="py-1"><AdBanner /></div>;
              }
              return null;
            })()}
          </React.Fragment>
        ))}

        {keyword && filteredNews.length === 0 && !isLoading && (
          <p className="text-center text-sm text-slate-400 font-medium py-10">
            &quot;{searchKeyword}&quot; 검색 결과가 없습니다
          </p>
        )}
      </div>

      {/* 무한 스크롤 트리거 */}
      <div ref={observerTarget} className="w-full py-8 flex justify-center items-center">
        {isLoadingMore ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            <span className="text-[10px] font-bold">더 많은 뉴스 읽어오는 중...</span>
          </div>
        ) : hasMore ? (
          <div className="h-10 opacity-0" aria-hidden="true" />
        ) : (
          <p className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">End of Briefing</p>
        )}
      </div>
    </section>
  )
}