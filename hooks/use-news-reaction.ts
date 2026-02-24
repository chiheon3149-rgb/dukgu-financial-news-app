"use client"

import { useEffect, useReducer, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"
import { updateCachedReactionInFeed } from "@/hooks/use-news-feed"
import { updateCachedReactionInSaved } from "@/hooks/use-saved-articles"

// =============================================================================
// 👍 useNewsReaction — DB 트리거 기반 좋아요/싫어요 훅
//
// · news_reactions 테이블에 upsert → 트리거가 news.good_count/bad_count 원자적 갱신
// · 로그인 유저: profile.id를 user_key로 사용
// · 익명 유저: localStorage에 영구 저장된 device UUID를 user_key로 사용
// · 모듈 레벨 스토어로 낙관적 UI 업데이트 (여러 컴포넌트 동기화)
// =============================================================================

type UserReaction = "good" | "bad" | null

interface ReactionEntry {
  good: number
  bad: number
  userReaction: UserReaction
}

// 모듈 레벨 공유 스토어 — 카드 피드와 상세 페이지가 같은 상태를 바라봄
const _store = new Map<string, ReactionEntry>()
const _listeners = new Map<string, Set<() => void>>()
// 유저가 직접 반응한 newsId 추적 — DB 조회가 낙관적 업데이트를 덮어쓰지 않도록
const _interacted = new Set<string>()

function notify(newsId: string) {
  _listeners.get(newsId)?.forEach((fn) => fn())
}

// 익명 유저용 디바이스 키 (localStorage에 영구 저장)
const DEVICE_KEY_STORAGE = "dukgu_device_id"

function generateId(): string {
  // crypto.randomUUID()는 HTTPS 또는 localhost에서만 동작
  // HTTP + IP 접속(로컬 네트워크 테스트) 시 폴백
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getOrCreateDeviceKey(): string {
  if (typeof window === "undefined") return "ssr"
  let key = localStorage.getItem(DEVICE_KEY_STORAGE)
  if (!key) {
    key = generateId()
    localStorage.setItem(DEVICE_KEY_STORAGE, key)
  }
  return key
}

// 뉴스 반응 localStorage 캐시 — 새로고침 시 즉시 복원
const REACTION_CACHE_KEY = "dukgu:news_reactions"

function getCachedReaction(newsId: string): UserReaction {
  if (typeof window === "undefined") return null
  try {
    const map = JSON.parse(localStorage.getItem(REACTION_CACHE_KEY) ?? "{}")
    return (map[newsId] as UserReaction) ?? null
  } catch { return null }
}

function setCachedReaction(newsId: string, reaction: UserReaction) {
  if (typeof window === "undefined") return
  try {
    const map = JSON.parse(localStorage.getItem(REACTION_CACHE_KEY) ?? "{}")
    if (reaction === null) delete map[newsId]
    else map[newsId] = reaction
    localStorage.setItem(REACTION_CACHE_KEY, JSON.stringify(map))
  } catch {}
}

export function useNewsReaction(newsId: string, initialGood: number, initialBad: number) {
  const { profile } = useUser()
  const userId = profile?.id ?? null

  // 스토어 초기화 (처음 등록 시만, 이미 있으면 기존 값 유지)
  // 새로고침 후에도 localStorage 캐시로 즉시 반응 상태 복원
  if (!_store.has(newsId)) {
    _store.set(newsId, { good: initialGood, bad: initialBad, userReaction: getCachedReaction(newsId) })
  }

  const [, forceUpdate] = useReducer((n: number) => n + 1, 0)

  // 구독 등록/해제
  useEffect(() => {
    if (!_listeners.has(newsId)) _listeners.set(newsId, new Set())
    _listeners.get(newsId)!.add(forceUpdate)
    return () => {
      _listeners.get(newsId)?.delete(forceUpdate)
    }
  }, [newsId])

  // DB에서 유저 반응 조회 (userId가 바뀔 때마다 재조회)
  const lastFetchedUserKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const userKey = userId ?? getOrCreateDeviceKey()
    if (lastFetchedUserKeyRef.current === userKey) return
    lastFetchedUserKeyRef.current = userKey

    supabase
      .from("news_reactions")
      .select("reaction")
      .eq("news_id", newsId)
      .eq("user_key", userKey)
      .maybeSingle()
      .then(({ data }) => {
        // 유저가 이미 직접 반응했으면 DB 조회 결과로 덮어쓰지 않음
        if (_interacted.has(newsId)) return
        const current = _store.get(newsId)
        if (!current) return
        const dbReaction = (data?.reaction as UserReaction) ?? null
        // DB가 null을 반환해도 localStorage 캐시를 유지 (RLS/upsert 실패 대비)
        // DB에 실제 반응이 있으면 DB를 우선
        const reaction = dbReaction !== null ? dbReaction : getCachedReaction(newsId)
        if (current.userReaction !== reaction) {
          _store.set(newsId, { ...current, userReaction: reaction })
          notify(newsId)
        }
      })
  }, [newsId, userId])

  const react = useCallback(
    async (
      type: "good" | "bad",
      snapshot?: { headline: string; category: string; timeAgo: string }
    ) => {
      const current = _store.get(newsId)
      if (!current) return

      const userKey = userId ?? getOrCreateDeviceKey()
      _interacted.add(newsId) // 이후 DB 조회가 낙관적 업데이트를 덮어쓰지 않도록 마킹

      // Toggle OFF: 같은 반응을 다시 누르면 취소
      if (current.userReaction === type) {
        const newGood = type === "good" ? Math.max(0, current.good - 1) : current.good
        const newBad  = type === "bad"  ? Math.max(0, current.bad  - 1) : current.bad
        _store.set(newsId, { good: newGood, bad: newBad, userReaction: null })
        setCachedReaction(newsId, null)
        notify(newsId)
        updateCachedReactionInFeed(newsId, newGood, newBad)
        updateCachedReactionInSaved(newsId, null)
        await supabase.from("news_reactions").delete()
          .eq("news_id", newsId).eq("user_key", userKey)
        return
      }

      // 새 반응 or 전환 (good ↔ bad)
      const prevReaction = current.userReaction
      let newGood = current.good
      let newBad  = current.bad

      if (type === "good") {
        newGood += 1
        if (prevReaction === "bad") newBad = Math.max(0, newBad - 1)
      } else {
        newBad += 1
        if (prevReaction === "good") newGood = Math.max(0, newGood - 1)
      }

      _store.set(newsId, { good: newGood, bad: newBad, userReaction: type })
      setCachedReaction(newsId, type)
      notify(newsId)
      updateCachedReactionInFeed(newsId, newGood, newBad)
      updateCachedReactionInSaved(newsId, type, snapshot)

      await supabase
        .from("news_reactions")
        .upsert(
          {
            news_id:    newsId,
            user_key:   userKey,
            reaction:   type,
            user_id:    userId ?? null,
            snapshot:   snapshot ?? null,
            reacted_at: new Date().toISOString(),
          },
          { onConflict: "news_id,user_key" }
        )
    },
    [newsId, userId]
  )

  const state = _store.get(newsId) ?? { good: initialGood, bad: initialBad, userReaction: null }
  return { good: state.good, bad: state.bad, userReaction: state.userReaction, react }
}
