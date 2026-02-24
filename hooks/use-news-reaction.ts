"use client"

import { useEffect, useReducer, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"
import { updateCachedReactionInFeed } from "@/hooks/use-news-feed"

type UserReaction = "good" | "bad" | null

interface ReactionEntry {
  good: number
  bad: number
  userReaction: UserReaction
}

// 모듈 레벨 공유 스토어 — 카드 피드와 상세 페이지가 같은 상태를 바라봄
const _store = new Map<string, ReactionEntry>()
const _listeners = new Map<string, Set<() => void>>()

function notify(newsId: string) {
  _listeners.get(newsId)?.forEach((fn) => fn())
}

function storageKey(userId: string | null, newsId: string) {
  return `news_reaction_${userId ?? "anon"}_${newsId}`
}

export function useNewsReaction(newsId: string, initialGood: number, initialBad: number) {
  const { profile } = useUser()
  const userId = profile?.id ?? null

  // 스토어 초기화 (처음 등록 시만, 이미 있으면 기존 값 유지)
  if (!_store.has(newsId)) {
    _store.set(newsId, { good: initialGood, bad: initialBad, userReaction: null })
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

  // userId 확정 후 localStorage에서 유저별 반응 복원
  useEffect(() => {
    if (typeof window === "undefined") return
    const key = storageKey(userId, newsId)
    const stored = localStorage.getItem(key) as UserReaction
    const current = _store.get(newsId)
    if (current && current.userReaction !== stored) {
      _store.set(newsId, { ...current, userReaction: stored })
      notify(newsId)
    }
  }, [newsId, userId])

  const react = useCallback(
    async (type: "good" | "bad") => {
      const current = _store.get(newsId)
      if (!current || current.userReaction === type) return

      let newGood = current.good
      let newBad = current.bad

      if (type === "good") {
        newGood += 1
        if (current.userReaction === "bad") newBad -= 1
      } else {
        newBad += 1
        if (current.userReaction === "good") newGood -= 1
      }

      // 스토어 업데이트 → 구독 중인 모든 컴포넌트 리렌더
      _store.set(newsId, { good: newGood, bad: newBad, userReaction: type })
      notify(newsId)

      // useNewsFeed 캐시도 업데이트 (뒤로가기 시 카드 피드 반영)
      updateCachedReactionInFeed(newsId, newGood, newBad)

      // localStorage 저장 (유저별 키)
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey(userId, newsId), type)
      }

      // Supabase aggregate 카운트 업데이트
      await supabase
        .from("news")
        .update({ good_count: newGood, bad_count: newBad })
        .eq("id", newsId)
    },
    [newsId, userId]
  )

  const state = _store.get(newsId) ?? { good: initialGood, bad: initialBad, userReaction: null }
  return { good: state.good, bad: state.bad, userReaction: state.userReaction, react }
}
