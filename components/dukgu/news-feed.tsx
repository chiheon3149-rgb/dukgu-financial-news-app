"use client"

import React, { useEffect, useRef } from "react"
import Link from "next/link"
import { NewsCard } from "./news-card"
import { Loader2 } from "lucide-react"
import { useNewsFeed } from "@/hooks/use-news-feed"
import { AdBanner } from "./ad-banner"
import { SortOption } from "./news-section" // 💡 SortOption 타입 임포트

const SCROLL_KEY = "newsListScrollY"

interface NewsFeedProps {
  searchKeyword?: string
  sortBy: SortOption // 💡 이제 sortBy 택배를 받을 수 있도록 입구를 만들었습니다!
}

export function NewsFeed({ searchKeyword = "", sortBy }: NewsFeedProps) {
  // 💡 훅에 sortBy를 전달하여 서버에서 정렬된 데이터를 가져오게 합니다.
  const { news, isLoading, isLoadingMore, hasMore, fetchNextPage } = useNewsFeed(sortBy)

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

  // 스크롤 복구 로직 (기존 유지)
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

  // 무한 스크롤 로직 (기존 유지)
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
    <section className="px-1 pb-24 max-w-lg mx-auto">
      {/* 💡 [수정] 중복되던 "실시간 뉴스" 헤더를 제거했습니다. 
          부모인 NewsSection에서 이미 예쁘게 그려주고 있기 때문에 훨씬 깔끔해집니다! */}

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

            {/* 8번째 뉴스마다 광고 배너 */}
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

      {/* 무한 스크롤 로딩 표시 */}
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