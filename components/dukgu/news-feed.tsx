"use client"

import React, { useEffect, useRef } from "react"
import Link from "next/link"
import { NewsCard } from "./news-card"
import { AdBanner } from "./ad-banner"
import type { SortOption } from "./news-section"
import type { MarketTab } from "@/hooks/use-news-feed"

const SCROLL_KEY = "newsListScrollY"

const KR_KEYWORDS = ["코스피", "코스닥", "삼성", "현대", "LG", "SK", "카카오", "네이버", "한국", "국내", "코스", "원화", "KRW"]
const US_KEYWORDS = ["나스닥", "S&P", "다우", "테슬라", "NVIDIA", "애플", "구글", "메타", "마이크로소프트", "미국", "월가", "연준", "Fed", "달러", "TSLA", "AAPL", "NVDA"]

function matchesMarket(item: any, tab: MarketTab): boolean {
  if (tab === "all") return true
  const m = item.market as string | null | undefined
  if (m === "common") return true
  if (m === "kr") return tab === "kr"
  if (m === "us") return tab === "us"
  const keywords = tab === "kr" ? KR_KEYWORDS : US_KEYWORDS
  const searchText = [item.headline ?? "", item.summary ?? "", ...(item.tags ?? [])].join(" ").toLowerCase()
  return keywords.some((kw) => searchText.includes(kw.toLowerCase()))
}

// ─── 스켈레톤 카드 ───────────────────────────────────────────
function NewsCardSkeleton() {
  return (
    <div className="p-[14px] border-b border-[#F1F5F9] flex flex-col gap-2.5">
      {/* 카테고리 태그 */}
      <div className="h-5 w-12 rounded-md bg-gray-200 shimmer" />
      {/* 헤드라인 — 2줄 */}
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-full rounded-md bg-gray-200 shimmer" />
        <div className="h-4 w-4/5 rounded-md bg-gray-200 shimmer" />
      </div>
      {/* 태그 */}
      <div className="h-3 w-32 rounded-md bg-gray-200 shimmer" />
      {/* 메타 행 */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-10 rounded-md bg-gray-200 shimmer" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-8 rounded-md bg-gray-200 shimmer" />
          <div className="h-3 w-8 rounded-md bg-gray-200 shimmer" />
          <div className="h-4 w-4 rounded-md bg-gray-200 shimmer" />
        </div>
      </div>
    </div>
  )
}

function NewsSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  )
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

  // 초기 로딩 — 스켈레톤 카드
  if (isLoading && news.length === 0) {
    return (
      <section className="pb-24 -mx-4 bg-white rounded-t-2xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)] pt-2">
        <NewsSkeletonList count={5} />
      </section>
    )
  }

  return (
    <section className="pb-24 -mx-4 bg-white rounded-t-2xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)] pt-2">
      <div className="flex flex-col px-4">
        {filteredNews.map((item, index) => (
          <React.Fragment key={item.id}>
            <Link
              href={`/news/${item.id}`}
              className="block"
              onClick={() => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))}
            >
              <NewsCard {...item} />
            </Link>

            {(() => {
              const isLastItem = index === filteredNews.length - 1
              const isEverySeventh = (index + 1) % 7 === 0
              if (filteredNews.length >= 7) {
                if (isEverySeventh) return <div className="py-1"><AdBanner /></div>
              } else if (isLastItem && !isLoadingMore) {
                return <div className="py-1"><AdBanner /></div>
              }
              return null
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
      <div ref={observerTarget} className="w-full px-4">
        {isLoadingMore ? (
          <NewsSkeletonList count={3} />
        ) : hasMore ? (
          <div className="h-10 opacity-0" aria-hidden="true" />
        ) : (
          <p className="text-center text-[11px] font-medium text-[#DDDDDD] tracking-widest py-8">— 이상 —</p>
        )}
      </div>
    </section>
  )
}
