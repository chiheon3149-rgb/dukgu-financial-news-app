"use client"

import React, { useEffect, useRef } from "react" // 💡 React.Fragment 사용을 위해 React 추가
import Link from "next/link"
import { NewsCard } from "./news-card"
import { Clock, RefreshCw, Loader2 } from "lucide-react"
import { useNewsFeed } from "@/hooks/use-news-feed"
import { AdBanner } from "./ad-banner" // 💡 AdBanner 임포트 추가

const SCROLL_KEY = "newsListScrollY"

interface NewsFeedProps {
  searchKeyword?: string
}

export function NewsFeed({ searchKeyword = "" }: NewsFeedProps) {
  const { news, isLoading, isLoadingMore, hasMore, fetchNextPage, refresh } = useNewsFeed()

  const keyword = searchKeyword.trim().toLowerCase()
  const filteredNews = keyword
    ? news.filter((item) => {
        const inHeadline = item.headline.toLowerCase().includes(keyword)
        const inSummary = item.summary.toLowerCase().includes(keyword)
        const inTags = item.tags.some((tag) => tag.toLowerCase().includes(keyword))
        return inHeadline || inSummary || inTags
      })
    : news

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

  return (
    <section className="px-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5 mt-4 px-1">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-800" />
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            실시간 뉴스
          </h2>
        </div>

        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors active:opacity-70 disabled:opacity-50"
        >
          <span>업데이트</span>
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {filteredNews.map((item, index) => (
          <React.Fragment key={item.id}>
            {/* 1. 기본 뉴스 카드 */}
            <Link
              href={`/news/${item.id}`}
              className="block"
              onClick={() => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))}
            >
              <NewsCard {...item} />
            </Link>

            {/* 💡 2. 8번째 뉴스마다 광고 배너 삽입 (index는 0부터 시작하므로 +1) */}
            {(index + 1) % 8 === 0 && (
              <div className="py-2">
                <AdBanner />
              </div>
            )}
          </React.Fragment>
        ))}

        {keyword && filteredNews.length === 0 && !isLoading && (
          <p className="text-center text-sm text-slate-400 font-medium py-10">
            &quot;{searchKeyword}&quot; 검색 결과가 없습니다
          </p>
        )}
      </div>

      <div ref={observerTarget} className="w-full py-8 flex justify-center items-center">
        {isLoadingMore ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs font-medium">뉴스 불러오는 중...</span>
          </div>
        ) : hasMore ? (
          <div className="h-10 opacity-0" aria-hidden="true" />
        ) : (
          <p className="text-xs font-bold text-slate-300">모든 뉴스를 불러왔습니다</p>
        )}
      </div>
    </section>
  )
}