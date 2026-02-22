"use client"

import { useState, useCallback } from "react"
import type { NewsItem } from "@/types"
import { MOCK_NEWS } from "@/lib/mock/news"

// =============================================================================
// 📰 useNewsFeed 훅
//
// 역할: 뉴스 피드 데이터의 로딩, 페이지네이션, 새로고침을 담당합니다.
// 컴포넌트는 이 훅이 데이터를 어디서 가져오는지 알 필요가 없습니다.
//
// 🔄 Supabase 전환 시: fetchNextPage, refresh 내부의 Mock 로직만
//    Supabase client 호출로 교체하면 됩니다. 컴포넌트 코드는 변경 불필요.
// =============================================================================

const PAGE_SIZE = 10
const MAX_MOCK_ITEMS = 50

interface UseNewsFeedReturn {
  news: NewsItem[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  fetchNextPage: () => Promise<void>
  refresh: () => Promise<void>
}

export function useNewsFeed(): UseNewsFeedReturn {
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS.slice(0, PAGE_SIZE))
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const refresh = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      // 🔄 TODO: await supabase.from('news').select('*').order('published_at', { ascending: false }).limit(PAGE_SIZE)
      await new Promise((r) => setTimeout(r, 800)) // 네트워크 시뮬레이션
      setNews(MOCK_NEWS.slice(0, PAGE_SIZE))
      setHasMore(true)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  const fetchNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      // 🔄 TODO: cursor 기반 pagination으로 교체
      // await supabase.from('news').select('*').lt('published_at', lastItem.publishedAt).limit(PAGE_SIZE)
      await new Promise((r) => setTimeout(r, 1200))

      const categories = ["정치", "경제", "사회", "문화"] as const

      // ✅ 버그 수정: setNews의 함수형 업데이트로 항상 최신 prev를 참조
      setNews((prev) => {
        const moreNews: NewsItem[] = Array.from({ length: PAGE_SIZE }, (_, i) => ({
          id: `news-extra-${prev.length + i + 1}`,
          category: categories[Math.floor(Math.random() * categories.length)],
          tags: ["#속보"],
          headline: `[속보] 실시간 업데이트 뉴스 ${prev.length + i + 1}보`,
          summary: "서버에서 새롭게 도착한 뉴스입니다.",
          timeAgo: `${prev.length + i + 1}시간 전`,
          publishedAt: new Date().toISOString(),
          goodCount: Math.floor(Math.random() * 500),
          badCount: Math.floor(Math.random() * 50),
          commentCount: Math.floor(Math.random() * 200),
        }))

        const next = [...prev, ...moreNews]

        // ✅ 버그 수정: prev 기준으로 판단해서 항상 정확한 값 참조
        if (next.length >= MAX_MOCK_ITEMS) setHasMore(false)

        return next
      })
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore])

  return { news, isLoading, isLoadingMore, hasMore, fetchNextPage, refresh }
}
