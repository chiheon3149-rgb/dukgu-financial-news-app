"use client"

import React, { useEffect, useRef } from "react"
import Link from "next/link"
import { NewsCard } from "./news-card"
import { Loader2 } from "lucide-react"
import { AdBanner } from "./ad-banner"
import { SortOption } from "./news-section"

const SCROLL_KEY = "newsListScrollY"

interface NewsFeedProps {
  news: any[]          
  isLoading: boolean   
  isLoadingMore: boolean
  hasMore: boolean
  fetchNextPage: () => void
  searchKeyword?: string
  sortBy: SortOption   
}

export function NewsFeed({ 
  news, 
  isLoading, 
  isLoadingMore, 
  hasMore, 
  fetchNextPage, 
  searchKeyword = "",
  sortBy               
}: NewsFeedProps) {
  
  const keyword = searchKeyword.trim().toLowerCase()
  const filteredNews = keyword
    ? news.filter((item) => {
        const inHeadline = item.headline.toLowerCase().includes(keyword)
        const inSummary = item.summary.toLowerCase().includes(keyword)
        const inTags = item.tags.some((tag: string) => tag.toLowerCase().includes(keyword))
        return inHeadline || inSummary || inTags
      })
    : news

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

            {/* 💡 업그레이드된 수익형 광고 로직! 7개마다 띄우고, 데이터가 7개 미만이면 맨 마지막에 띄움 */}
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