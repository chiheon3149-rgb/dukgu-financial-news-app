"use client"

import { useReducer, useCallback, useEffect } from "react"
import type { SavedArticle, ArticleReaction, ArticleReactionType, NewsCategory } from "@/types"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 🔖 useSavedArticles — 모듈 레벨 공유 스토어 버전
//
// · 모든 컴포넌트가 같은 _savedMap / _reactions 를 바라봄 (DB 쿼리 1회)
// · 로그인 유저: Supabase saved_articles / news_reactions 연동
// · 비로그인 유저: 세션 내 메모리만 유지 (새로고침 시 초기화)
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
}

// 모듈 레벨 상태
let _loadState: "idle" | "loading" | "loaded" = "idle"
let _userId: string | null = null
const _savedMap = new Map<string, SavedArticle>()
let _savedList: SavedArticle[] = []
let _reactions: ArticleReaction[] = []
const _listeners = new Set<() => void>()

function notifyAll() {
  _listeners.forEach((fn) => fn())
}

function resetStore() {
  _loadState = "idle"
  _userId = null
  _savedMap.clear()
  _savedList = []
  _reactions = []
}

async function ensureLoaded() {
  if (_loadState !== "idle") return
  _loadState = "loading"

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // [핵심 버그 수정 2] idle로 되돌려서 onAuthStateChange에서 재시도 가능하게 함
    _loadState = "idle"
    return
  }

  _userId = user.id

  const [{ data: savedData }, { data: reactionData }] = await Promise.all([
    supabase
      .from("saved_articles")
      .select("*")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase
      .from("news_reactions")
      .select("*")
      .eq("user_id", user.id)
      .order("reacted_at", { ascending: false }),
  ])

  if (savedData) {
    _savedList = savedData.map((row: any) => ({
      newsId: row.news_id,
      savedAt: row.saved_at,
      snapshot: row.snapshot,
    }))
    _savedMap.clear()
    _savedList.forEach((a) => _savedMap.set(a.newsId, a))
  }

  if (reactionData) {
    _reactions = reactionData
      .filter((row: any) => row.snapshot != null)
      .map((row: any) => ({
        newsId: row.news_id,
        type: (row.type === "good" ? "like" : "dislike") as ArticleReactionType,
        reactedAt: row.reacted_at,
        snapshot: row.snapshot,
      }))
  }

  _loadState = "loaded"
  notifyAll()
}

// use-news-reaction.ts 에서 반응 변경 시 호출 — 실시간 동기화
export function updateCachedReactionInSaved(
  newsId: string,
  reaction: "good" | "bad" | null,
  snapshot?: { headline: string; category: string; timeAgo: string }
) {
  if (reaction === null) {
    _reactions = _reactions.filter((r) => r.newsId !== newsId)
  } else {
    const type: ArticleReactionType = reaction === "good" ? "like" : "dislike"
    const newReaction: ArticleReaction = {
      newsId,
      type,
      reactedAt: new Date().toISOString(),
      snapshot: snapshot as ArticleReaction["snapshot"],
    }
    const idx = _reactions.findIndex((r) => r.newsId === newsId)
    if (idx >= 0) {
      _reactions = [
        ..._reactions.slice(0, idx),
        newReaction,
        ..._reactions.slice(idx + 1),
      ]
    } else if (snapshot) {
      _reactions = [newReaction, ..._reactions]
    }
  }
  notifyAll()
}

// [핵심 버그 수정 2] onAuthStateChange에서 모든 유저 세션 이벤트를 처리
// - SIGNED_IN: 로그인
// - INITIAL_SESSION: 새로고침 시 기존 세션 복원 (가장 중요! 기존 코드에서 누락됨)
// - TOKEN_REFRESHED: 토큰 갱신 완료 후 재시도
// 위 세 케이스 모두 유저가 있고 _loadState === "idle"이면 데이터를 로드
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      resetStore()
      notifyAll()
      return
    }

    // 유저 세션이 있는 모든 이벤트에서 데이터 로드 시도
    if (session?.user) {
      if (_loadState === "idle") {
        // 아직 로드 안 된 상태 (초기 or getUser()가 null 반환 후 재시도) → 즉시 로드
        ensureLoaded()
      } else if (_loadState === "loaded" && _userId !== session.user.id) {
        // 다른 유저로 전환된 경우 → 초기화 후 재로드
        resetStore()
        notifyAll()
        ensureLoaded()
      }
    }
  })
}

export function useSavedArticles(): UseSavedArticlesReturn {
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    _listeners.add(forceUpdate)
    // onAuthStateChange가 컴포넌트 마운트 전에 이미 로드를 완료했을 경우
    // notifyAll()이 listeners 없이 실행됐으므로 여기서 직접 렌더링 트리거
    if (_loadState === "loaded") forceUpdate()
    ensureLoaded()
    return () => {
      _listeners.delete(forceUpdate)
    }
  }, [])

  const isSaved = useCallback((newsId: string) => _savedMap.has(newsId), [])

  const getReaction = useCallback(
    (newsId: string): ArticleReactionType | null =>
      _reactions.find((r) => r.newsId === newsId)?.type ?? null,
    []
  )

  const toggleSave = useCallback((newsId: string, snapshot: ArticleSnapshot) => {
    if (_savedMap.has(newsId)) {
      _savedMap.delete(newsId)
      _savedList = _savedList.filter((a) => a.newsId !== newsId)
      if (_userId) {
        supabase
          .from("saved_articles")
          .delete()
          .eq("user_id", _userId)
          .eq("news_id", newsId)
      }
    } else {
      const newItem: SavedArticle = {
        newsId,
        savedAt: new Date().toISOString(),
        snapshot: { ...snapshot, tags: snapshot.tags ?? [] },
      }
      _savedMap.set(newsId, newItem)
      _savedList = [newItem, ..._savedList]
      if (_userId) {
        supabase.from("saved_articles").insert({
          user_id: _userId,
          news_id: newsId,
          saved_at: newItem.savedAt,
          snapshot: newItem.snapshot,
        })
      }
    }
    notifyAll()
  }, [])

  return {
    savedArticles: _savedList,
    reactions: _reactions,
    isSaved,
    getReaction,
    toggleSave,
  }
}
