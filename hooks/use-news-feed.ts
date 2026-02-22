"use client"

import { useState, useCallback, useEffect } from "react"
import type { NewsItem } from "@/types"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 📰 useNewsFeed 훅 — Supabase 연동 버전
//
// Supabase의 news 테이블에서 뉴스를 가져옵니다.
// 최신순으로 정렬되며, 스크롤 시 10개씩 추가로 불러옵니다.
// =============================================================================

const PAGE_SIZE = 10

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
    timeAgo: getTimeAgo(row.published_at),
    publishedAt: row.published_at,
    goodCount: row.good_count ?? 0,
    badCount: row.bad_count ?? 0,
    commentCount: row.comment_count ?? 0,
  }
}

// "n분 전", "n시간 전" 형식으로 변환
function getTimeAgo(publishedAt: string): string {
  const diff = Date.now() - new Date(publishedAt).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}일 전`
  if (hours > 0) return `${hours}시간 전`
  if (minutes > 0) return `${minutes}분 전`
  return "방금 전"
}

export function useNewsFeed(): UseNewsFeedReturn {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null)

  // 최초 마운트 시 자동 로딩
  useEffect(() => {
    supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data, error }) => {
        if (error) { console.error("[useNewsFeed] 초기 로딩 실패:", error); return }
        const items = (data ?? []).map(toNewsItem)
        setNews(items)
        setLastPublishedAt(items.at(-1)?.publishedAt ?? null)
        setHasMore(items.length === PAGE_SIZE)
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
        .order("published_at", { ascending: false })
        .limit(PAGE_SIZE)

      if (error) throw error

      const items = (data ?? []).map(toNewsItem)
      setNews(items)
      setLastPublishedAt(items.at(-1)?.publishedAt ?? null)
      setHasMore(items.length === PAGE_SIZE)
    } catch (e) {
      console.error("[useNewsFeed] 새로고침 실패:", e)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  // 다음 페이지 (무한스크롤)
  const fetchNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastPublishedAt) return
    setIsLoadingMore(true)
    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false })
        .lt("published_at", lastPublishedAt)
        .limit(PAGE_SIZE)

      if (error) throw error

      const items = (data ?? []).map(toNewsItem)
      setNews((prev) => [...prev, ...items])
      setLastPublishedAt(items.at(-1)?.publishedAt ?? null)
      setHasMore(items.length === PAGE_SIZE)
    } catch (e) {
      console.error("[useNewsFeed] 다음 페이지 로딩 실패:", e)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, lastPublishedAt])

  return { news, isLoading, isLoadingMore, hasMore, fetchNextPage, refresh }
}
