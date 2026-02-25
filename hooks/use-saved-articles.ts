"use client"

import { useReducer, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"
import type { SavedArticle, ArticleReaction, ArticleReactionType, NewsCategory } from "@/types"
import { toast } from "sonner" // 👈 토스트 임포트

interface ArticleSnapshot {
  headline: string
  category: NewsCategory
  timeAgo: string
  tags?: string[]
}

let _loadState: "idle" | "loading" | "loaded" = "idle"
let _currentUserId: string | null = null
const _savedMap = new Map<string, SavedArticle>()
let _savedList: SavedArticle[] = []
let _reactions: ArticleReaction[] = []
const _listeners = new Set<() => void>()

function notifyAll() { _listeners.forEach((fn) => fn()) }

async function ensureLoaded(userId: string | null) {
  if (!userId) {
    _savedList = []; _savedMap.clear(); _reactions = []; _loadState = "loaded"; _currentUserId = null;
    notifyAll(); return;
  }
  if (_loadState === "loading") return;
  if (_loadState === "loaded" && _currentUserId === userId) return;
  _loadState = "loading"; _currentUserId = userId;

  const [{ data: savedData }, { data: reactionData }] = await Promise.all([
    supabase.from("article_bookmarks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("article_likes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  if (savedData) {
    _savedList = savedData.map((row: any) => ({ newsId: row.article_id, savedAt: row.created_at, snapshot: row.snapshot }));
    _savedMap.clear(); _savedList.forEach((a) => _savedMap.set(a.newsId, a));
  }
  if (reactionData) {
    _reactions = reactionData.filter((row: any) => row.snapshot != null).map((row: any) => ({
        newsId: row.article_id,
        type: (row.type === "good" ? "like" : "dislike") as ArticleReactionType,
        reactedAt: row.created_at,
        snapshot: row.snapshot,
      }));
  }
  _loadState = "loaded"; notifyAll();
}

export function updateCachedReactionInSaved(newsId: string, reaction: "good" | "bad" | null, snapshot?: any) {
  if (reaction === null) { _reactions = _reactions.filter((r) => r.newsId !== newsId) } 
  else {
    const type: ArticleReactionType = reaction === "good" ? "like" : "dislike"
    const newReaction: ArticleReaction = { newsId, type, reactedAt: new Date().toISOString(), snapshot: snapshot }
    const idx = _reactions.findIndex((r) => r.newsId === newsId)
    if (idx >= 0) { _reactions = [..._reactions.slice(0, idx), newReaction, ..._reactions.slice(idx + 1)] } 
    else if (snapshot) { _reactions = [newReaction, ..._reactions] }
  }
  notifyAll()
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange(() => { _loadState = "idle" })
}

export function useSavedArticles() {
  const { profile } = useUser()
  const userId = profile?.id ?? null
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    _listeners.add(forceUpdate)
    ensureLoaded(userId)
    return () => { _listeners.delete(forceUpdate) }
  }, [userId])

  const isSaved = useCallback((newsId: string) => _savedMap.has(newsId), [])

  const toggleSave = useCallback(async (newsId: string, snapshot: ArticleSnapshot) => {
    // [토스트 팝업 적용]
    if (!userId) {
      toast.error("로그인이 필요한 서비스입니다.", {
        description: "즐겨찾는 기사를 보관하려면 로그인해 주세요! 🔖",
      })
      return
    }

    if (_savedMap.has(newsId)) {
      _savedMap.delete(newsId)
      _savedList = _savedList.filter((a) => a.newsId !== newsId)
      await supabase.from("article_bookmarks").delete().eq("user_id", userId).eq("article_id", newsId)
      toast.success("북마크가 해제되었습니다.")
    } else {
      const newItem: SavedArticle = {
        newsId,
        savedAt: new Date().toISOString(),
        snapshot: { ...snapshot, tags: snapshot.tags ?? [] },
      }
      _savedMap.set(newsId, newItem)
      _savedList = [newItem, ..._savedList]
      await supabase.from("article_bookmarks").insert({
        user_id: userId,
        article_id: newsId,
        snapshot: newItem.snapshot,
      })
      toast.success("북마크에 저장되었습니다!")
    }
    notifyAll()
  }, [userId])

  return {
    savedArticles: _savedList,
    reactions: _reactions,
    isSaved,
    getReaction: (newsId: string) => _reactions.find((r) => r.newsId === newsId)?.type ?? null,
    toggleSave,
  }
}