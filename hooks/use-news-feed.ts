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
    timeAgo: formatTime(row.created_at ?? row.published_at),
    publishedAt: row.created_at ?? row.published_at,
    goodCount: row.good_count ?? 0,
    badCount: row.bad_count ?? 0,
    commentCount: row.comment_count ?? 0,
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

export function useNewsFeed(): UseNewsFeedReturn {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(null)

  // 최초 마운트 시 자동 로딩
  useEffect(() => {
    supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data, error }) => {
        if (error) { console.error("[useNewsFeed] 초기 로딩 실패:", error); return }
        const items = (data ?? []).map(toNewsItem)
        setNews(items)
        setLastCreatedAt(items.at(-1)?.publishedAt ?? null)
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
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)

      if (error) throw error

      const items = (data ?? []).map(toNewsItem)
      setNews(items)
      setLastCreatedAt(items.at(-1)?.publishedAt ?? null)
      setHasMore(items.length === PAGE_SIZE)
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
      setNews((prev) => [...prev, ...items])
      setLastCreatedAt(items.at(-1)?.publishedAt ?? null)
      setHasMore(items.length === PAGE_SIZE)
    } catch (e) {
      console.error("[useNewsFeed] 다음 페이지 로딩 실패:", e)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, lastCreatedAt])

  return { news, isLoading, isLoadingMore, hasMore, fetchNextPage, refresh }
}
