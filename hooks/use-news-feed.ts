"use client"

import { useState, useCallback, useEffect } from "react"
import type { NewsItem } from "@/types"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 📰 useNewsFeed 훅 — Supabase 연동 버전
// =============================================================================

const PAGE_SIZE = 10

// 모듈 레벨 캐시 — 뒤로가기 시 재fetch 없이 이전 상태 복원
let _cachedNews: NewsItem[] = []
let _cachedLastCreatedAt: string | null = null
let _cachedHasMore: boolean = true

// 💡 [추가 1] 화면에 즉시 변경을 알리기 위한 이벤트 이름
const NEWS_CACHE_UPDATED_EVENT = "NEWS_CACHE_UPDATED_EVENT"

interface UseNewsFeedReturn {
  news: NewsItem[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  fetchNextPage: () => Promise<void>
  refresh: () => Promise<void>
}

// Supabase 데이터를 NewsItem 형식으로 변환
function toNewsItem(row: any): NewsItem {
  return {
    id: row.id,
    category: row.category,
    tags: row.tags ?? [],
    headline: row.headline,
    summary: row.summary,
    timeAgo: formatTime(row.created_at ?? row.published_at),
    publishedAt: row.created_at ?? row.published_at,
    goodCount: row.good_count ?? 0,
    badCount: row.bad_count ?? 0,
    commentCount: row.comment_count ?? 0,
    source: row.source ?? null,
  }
}

// 실제 시각 표시: 오늘이면 "HH:MM", 아니면 "MM/DD HH:MM"
function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isToday) return `${h}:${min}`
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${m}/${day} ${h}:${min}`
}

// 반응 훅에서 호출 — 카드 피드 캐시 카운트 동기화
export function updateCachedReactionInFeed(newsId: string, good: number, bad: number) {
  const idx = _cachedNews.findIndex((n) => n.id === newsId)
  if (idx !== -1) {
    _cachedNews[idx] = { ..._cachedNews[idx], goodCount: good, badCount: bad }
    // 💡 변경 사항을 화면에 알림
    if (typeof window !== "undefined") window.dispatchEvent(new Event(NEWS_CACHE_UPDATED_EVENT))
  }
}

// 댓글 추가/삭제 시 호출 — 카드 피드 캐시 댓글 수 동기화
export function updateCachedCommentCountInFeed(newsId: string, count: number) {
  const idx = _cachedNews.findIndex((n) => n.id === newsId)
  if (idx !== -1) {
    _cachedNews[idx] = { ..._cachedNews[idx], commentCount: count }
    // 💡 변경 사항을 화면에 알림
    if (typeof window !== "undefined") window.dispatchEvent(new Event(NEWS_CACHE_UPDATED_EVENT))
  }
}

export function useNewsFeed(): UseNewsFeedReturn {
  const [news, setNews] = useState<NewsItem[]>(_cachedNews)
  const [isLoading, setIsLoading] = useState(_cachedNews.length === 0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(_cachedHasMore)
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(_cachedLastCreatedAt)

  // 💡 [추가 2] 캐시가 업데이트되었다는 방송(Event)을 듣고 화면(news 상태)을 강제로 다시 그리는 장치
  useEffect(() => {
    const handleCacheUpdate = () => {
      setNews([..._cachedNews]) // 새 배열로 만들어야 React가 변경을 감지하고 리렌더링함
    }
    window.addEventListener(NEWS_CACHE_UPDATED_EVENT, handleCacheUpdate)
    return () => window.removeEventListener(NEWS_CACHE_UPDATED_EVENT, handleCacheUpdate)
  }, [])

  // 최초 마운트 시 자동 로딩 (캐시 있으면 skip)
  useEffect(() => {
    if (_cachedNews.length > 0) return
    supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data, error }) => {
        if (error) { console.error("[useNewsFeed] 초기 로딩 실패:", error); return }
        const items = (data ?? []).map(toNewsItem)
        _cachedNews = items
        _cachedLastCreatedAt = items.at(-1)?.publishedAt ?? null
        _cachedHasMore = items.length === PAGE_SIZE
        setNews(items)
        setLastCreatedAt(_cachedLastCreatedAt)
        setHasMore(_cachedHasMore)
        setIsLoading(false)
      })
  }, [])

  // 새로고침
  const refresh = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)

      if (error) throw error

      const items = (data ?? []).map(toNewsItem)
      _cachedNews = items
      _cachedLastCreatedAt = items.at(-1)?.publishedAt ?? null
      _cachedHasMore = items.length === PAGE_SIZE
      setNews(items)
      setLastCreatedAt(_cachedLastCreatedAt)
      setHasMore(_cachedHasMore)
    } catch (e) {
      console.error("[useNewsFeed] 새로고침 실패:", e)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  // 다음 페이지 (무한스크롤)
  const fetchNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastCreatedAt) return
    setIsLoadingMore(true)
    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })
        .lt("created_at", lastCreatedAt)
        .limit(PAGE_SIZE)

      if (error) throw error

      const items = (data ?? []).map(toNewsItem)
      _cachedNews = [..._cachedNews, ...items]
      _cachedLastCreatedAt = items.at(-1)?.publishedAt ?? null
      _cachedHasMore = items.length === PAGE_SIZE
      setNews(_cachedNews)
      setLastCreatedAt(_cachedLastCreatedAt)
      setHasMore(_cachedHasMore)
    } catch (e) {
      console.error("[useNewsFeed] 다음 페이지 로딩 실패:", e)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, lastCreatedAt])

  return { news, isLoading, isLoadingMore, hasMore, fetchNextPage, refresh }
}