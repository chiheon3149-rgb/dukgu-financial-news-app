"use client"

import { useState, useCallback, useEffect } from "react"
import type { NewsItem } from "@/types"
import { supabase } from "@/lib/supabase"

// 뉴스 섹션에서 사용하는 타입 정의
type SortOption = "latest" | "views"

const PAGE_SIZE = 10

// =============================================================================
// 💡 전역 캐시 (이 파일 안에서 데이터를 공유합니다)
// =============================================================================
let _cachedNews: NewsItem[] = []
let _cachedLastValue: any = null 
let _cachedHasMore: boolean = true

const NEWS_CACHE_UPDATED_EVENT = "NEWS_CACHE_UPDATED_EVENT"

interface UseNewsFeedReturn {
  news: NewsItem[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  fetchNextPage: () => Promise<void>
  refresh: () => Promise<void>
}

/** 데이터 변환 함수 */
function toNewsItem(row: any): NewsItem {
  return {
    id: row.id,
    category: row.category,
    tags: row.tags ?? [],
    headline: row.headline,
    summary: row.summary,
    timeAgo: formatTime(row.created_at),
    publishedAt: row.created_at,
    goodCount: row.good_count ?? 0,
    badCount: row.bad_count ?? 0,
    commentCount: row.comment_count ?? 0,
    source: row.source ?? null,
    viewCount: row.view_count ?? 0,
  }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  if (isToday) return `${h}:${min}`
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${h}:${min}`
}

// =============================================================================
// 🚀 [에러 해결!] 다른 파일에서 찾는 "동기화 일꾼"들을 여기서 내보냅니다.
// =============================================================================

export function updateCachedReactionInFeed(newsId: string, good: number, bad: number) {
  const idx = _cachedNews.findIndex((n) => n.id === newsId)
  if (idx !== -1) {
    _cachedNews[idx] = { ..._cachedNews[idx], goodCount: good, badCount: bad }
    if (typeof window !== "undefined") window.dispatchEvent(new Event(NEWS_CACHE_UPDATED_EVENT))
  }
}

export function updateCachedCommentCountInFeed(newsId: string, count: number) {
  const idx = _cachedNews.findIndex((n) => n.id === newsId)
  if (idx !== -1) {
    _cachedNews[idx] = { ..._cachedNews[idx], commentCount: count }
    if (typeof window !== "undefined") window.dispatchEvent(new Event(NEWS_CACHE_UPDATED_EVENT))
  }
}

// =============================================================================
// 📰 메인 훅
// =============================================================================
export function useNewsFeed(sortBy: SortOption = "latest"): UseNewsFeedReturn {
  const [news, setNews] = useState<NewsItem[]>(_cachedNews)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(_cachedHasMore)
  const [lastValue, setLastValue] = useState<any>(_cachedLastValue)

  // 💡 화면 동기화 리스너
  useEffect(() => {
    const handleCacheUpdate = () => {
      setNews([..._cachedNews])
    }
    window.addEventListener(NEWS_CACHE_UPDATED_EVENT, handleCacheUpdate)
    return () => window.removeEventListener(NEWS_CACHE_UPDATED_EVENT, handleCacheUpdate)
  }, [])

  // 정렬 기준 변경 시 초기화
  useEffect(() => {
    _cachedNews = []
    _cachedLastValue = null
    _cachedHasMore = true
    setNews([])
    setHasMore(true)
    setLastValue(null)
    fetchInitialData()
  }, [sortBy])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("news").select("*").limit(PAGE_SIZE)

      if (sortBy === "latest") {
        query = query.order("created_at", { ascending: false })
      } else {
        query = query.order("view_count", { ascending: false }).order("created_at", { ascending: false })
      }

      const { data, error } = await query
      if (error) throw error

      const items = (data ?? []).map(toNewsItem)
      
      // 💡 여기서 전역 캐시를 완벽히 새로운 배열로 덮어씁니다.
      _cachedNews = [...items]
      _cachedLastValue = sortBy === "latest" ? items.at(-1)?.publishedAt : items.at(-1)?.viewCount
      _cachedHasMore = items.length === PAGE_SIZE

      // 💡 상태를 업데이트하고 동기화 이벤트를 날려 모든 UI가 강제로 깨어나게 합니다.
      setNews([...items])
      setLastValue(_cachedLastValue)
      setHasMore(_cachedHasMore)

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(NEWS_CACHE_UPDATED_EVENT))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMore || lastValue === null) return
    setIsLoadingMore(true)

    try {
      let query = supabase.from("news").select("*").limit(PAGE_SIZE)

      if (sortBy === "latest") {
        query = query.order("created_at", { ascending: false }).lt("created_at", lastValue)
      } else {
        query = query.order("view_count", { ascending: false }).lt("view_count", lastValue)
      }

      const { data, error } = await query
      if (error) throw error

      const items = (data ?? []).map(toNewsItem)
      _cachedNews = [..._cachedNews, ...items]
      _cachedLastValue = sortBy === "latest" ? items.at(-1)?.publishedAt : items.at(-1)?.viewCount
      _cachedHasMore = items.length === PAGE_SIZE

      setNews([..._cachedNews]) // 💡 여기도 강제 복사로 수정
      setLastValue(_cachedLastValue)
      setHasMore(_cachedHasMore)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, lastValue, sortBy])

  // 💡 대망의 refresh 함수! 강제 초기화 후 데이터 재요청
  const refresh = async () => {
    setIsLoading(true)
    setNews([]) // 💡 화면에 잠깐 로딩 뼈대(스켈레톤)를 띄워 "진짜로 바뀌고 있다"는 시각적 피드백 제공
    await fetchInitialData()
  }

  return { news, isLoading, isLoadingMore, hasMore, fetchNextPage, refresh }
}