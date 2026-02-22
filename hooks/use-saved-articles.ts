"use client"

import { useState, useCallback } from "react"
import type { SavedArticle, ArticleReaction, ArticleReactionType, NewsCategory } from "@/types"
import { MOCK_SAVED_ARTICLES, MOCK_ARTICLE_REACTIONS } from "@/lib/mock/user"

// =============================================================================
// 🔖 useSavedArticles
//
// 역할: 북마크된 기사와 좋아요/싫어요 반응을 전역에서 관리합니다.
//
// 설계 포인트:
// 현재 NewsInteractionBar는 각자의 로컬 useState로만 동작해서
// 마이페이지에서 "내가 북마크한 기사"를 모아볼 수 없습니다.
// 이 훅을 Context로 감싸면 전체 앱에서 공유 상태가 됩니다.
// (Context 연결은 향후 _providers.tsx에서 처리)
//
// 🔄 Supabase 전환 시:
//   - 초기 데이터: supabase.from('saved_articles').select('*').eq('user_id', uid)
//   - toggleSave: upsert / delete
//   - setReaction: upsert into article_reactions
// =============================================================================

interface ArticleSnapshot {
  headline: string
  category: NewsCategory
  timeAgo: string
  tags?: string[]
}

interface UseSavedArticlesReturn {
  savedArticles: SavedArticle[]
  reactions: ArticleReaction[]
  isSaved: (newsId: string) => boolean
  getReaction: (newsId: string) => ArticleReactionType | null
  toggleSave: (newsId: string, snapshot: ArticleSnapshot) => void
  setReaction: (newsId: string, type: ArticleReactionType, snapshot: Omit<ArticleSnapshot, "tags">) => void
  clearReaction: (newsId: string) => void
}

export function useSavedArticles(): UseSavedArticlesReturn {
  const [savedArticles, setSaved] = useState<SavedArticle[]>(MOCK_SAVED_ARTICLES)
  const [reactions, setReactions] = useState<ArticleReaction[]>(MOCK_ARTICLE_REACTIONS)

  const isSaved = useCallback(
    (newsId: string) => savedArticles.some((a) => a.newsId === newsId),
    [savedArticles]
  )

  const getReaction = useCallback(
    (newsId: string): ArticleReactionType | null =>
      reactions.find((r) => r.newsId === newsId)?.type ?? null,
    [reactions]
  )

  const toggleSave = useCallback(
    (newsId: string, snapshot: ArticleSnapshot) => {
      setSaved((prev) => {
        const exists = prev.some((a) => a.newsId === newsId)
        if (exists) return prev.filter((a) => a.newsId !== newsId)
        return [
          { newsId, savedAt: new Date().toISOString(), snapshot: { ...snapshot, tags: snapshot.tags ?? [] } },
          ...prev,
        ]
      })
    },
    []
  )

  const setReaction = useCallback(
    (newsId: string, type: ArticleReactionType, snapshot: Omit<ArticleSnapshot, "tags">) => {
      setReactions((prev) => {
        const filtered = prev.filter((r) => r.newsId !== newsId)
        return [{ newsId, type, reactedAt: new Date().toISOString(), snapshot }, ...filtered]
      })
    },
    []
  )

  const clearReaction = useCallback((newsId: string) => {
    setReactions((prev) => prev.filter((r) => r.newsId !== newsId))
  }, [])

  return { savedArticles, reactions, isSaved, getReaction, toggleSave, setReaction, clearReaction }
}
