"use client"

import { useState, useCallback, useEffect } from "react"
import type { SavedArticle, ArticleReaction, ArticleReactionType, NewsCategory } from "@/types"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 🔖 useSavedArticles — Supabase 연동 버전
//
// 북마크된 기사와 좋아요/싫어요 반응을 Supabase에서 가져옵니다.
// 새로고침해도 데이터가 유지됩니다 ✅
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
  const [savedArticles, setSaved] = useState<SavedArticle[]>([])
  const [reactions, setReactions] = useState<ArticleReaction[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // 로그인 유저 확인 + 데이터 불러오기
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // 북마크 불러오기
      const { data: savedData } = await supabase
        .from("saved_articles")
        .select("*")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false })

      if (savedData) {
        setSaved(savedData.map((row: any) => ({
          newsId: row.news_id,
          savedAt: row.saved_at,
          snapshot: row.snapshot,
        })))
      }

      // 반응 불러오기
      const { data: reactionData } = await supabase
        .from("news_reactions")
        .select("*")
        .eq("user_id", user.id)
        .order("reacted_at", { ascending: false })

      if (reactionData) {
        setReactions(reactionData.map((row: any) => ({
          newsId: row.news_id,
          type: row.type,
          reactedAt: row.reacted_at,
          snapshot: row.snapshot,
        })))
      }
    }

    load()
  }, [])

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

        if (exists) {
          // 북마크 삭제
          if (userId) {
            supabase
              .from("saved_articles")
              .delete()
              .eq("user_id", userId)
              .eq("news_id", newsId)
          }
          return prev.filter((a) => a.newsId !== newsId)
        } else {
          // 북마크 추가
          const newItem: SavedArticle = {
            newsId,
            savedAt: new Date().toISOString(),
            snapshot: { ...snapshot, tags: snapshot.tags ?? [] },
          }
          if (userId) {
            supabase.from("saved_articles").insert({
              user_id: userId,
              news_id: newsId,
              saved_at: newItem.savedAt,
              snapshot: newItem.snapshot,
            })
          }
          return [newItem, ...prev]
        }
      })
    },
    [userId]
  )

  const setReaction = useCallback(
    (newsId: string, type: ArticleReactionType, snapshot: Omit<ArticleSnapshot, "tags">) => {
      setReactions((prev) => {
        const filtered = prev.filter((r) => r.newsId !== newsId)
        const newReaction: ArticleReaction = {
          newsId,
          type,
          reactedAt: new Date().toISOString(),
          snapshot,
        }
        if (userId) {
          supabase.from("news_reactions").upsert({
            user_id: userId,
            news_id: newsId,
            type,
            reacted_at: newReaction.reactedAt,
            snapshot,
          }, { onConflict: "user_id,news_id" })
        }
        return [newReaction, ...filtered]
      })
    },
    [userId]
  )

  const clearReaction = useCallback((newsId: string) => {
    setReactions((prev) => prev.filter((r) => r.newsId !== newsId))
    if (userId) {
      supabase
        .from("news_reactions")
        .delete()
        .eq("user_id", userId)
        .eq("news_id", newsId)
    }
  }, [userId])

  return { savedArticles, reactions, isSaved, getReaction, toggleSave, setReaction, clearReaction }
}
