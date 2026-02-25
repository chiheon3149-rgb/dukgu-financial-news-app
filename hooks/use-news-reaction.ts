"use client"

import { useEffect, useReducer, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"
import { updateCachedReactionInFeed } from "@/hooks/use-news-feed"
import { updateCachedReactionInSaved } from "@/hooks/use-saved-articles"
import { toast } from "sonner"

type UserReaction = "good" | "bad" | null

interface ReactionEntry {
  good: number
  bad: number
  userReaction: UserReaction
}

const _store = new Map<string, ReactionEntry>()
const _listeners = new Map<string, Set<() => void>>()
const REACTION_CACHE_KEY = "dukgu:news_reactions"

function notify(newsId: string) {
  _listeners.get(newsId)?.forEach((fn) => fn())
}

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

  if (!_store.has(newsId)) {
    _store.set(newsId, { 
      good: initialGood, 
      bad: initialBad, 
      userReaction: getCachedReaction(newsId) 
    })
  }

  const [, forceUpdate] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    if (!_listeners.has(newsId)) _listeners.set(newsId, new Set())
    _listeners.get(newsId)!.add(forceUpdate)
    return () => { _listeners.get(newsId)?.delete(forceUpdate) }
  }, [newsId])

  useEffect(() => {
    if (!userId) return
    supabase.from("article_likes")
      .select("type")
      .eq("article_id", newsId)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        const current = _store.get(newsId)
        if (!current) return
        const dbReaction = (data?.type as UserReaction) ?? null
        if (current.userReaction !== dbReaction) {
          _store.set(newsId, { ...current, userReaction: dbReaction })
          setCachedReaction(newsId, dbReaction)
          notify(newsId)
        }
      })
  }, [newsId, userId])

  const react = useCallback(
    async (type: "good" | "bad", snapshot?: any) => {
      if (!userId) {
        toast.error("로그인이 필요한 서비스입니다.", {
          description: "로그인 후 리액션을 남겨보세요! 😊",
        })
        return
      }

      const current = _store.get(newsId)
      if (!current) return

      // Toggle OFF
      if (current.userReaction === type) {
        const newGood = type === "good" ? Math.max(0, current.good - 1) : current.good
        const newBad  = type === "bad"  ? Math.max(0, current.bad - 1) : current.bad
        
        _store.set(newsId, { good: newGood, bad: newBad, userReaction: null })
        setCachedReaction(newsId, null)
        notify(newsId)
        updateCachedReactionInFeed(newsId, newGood, newBad)
        updateCachedReactionInSaved(newsId, null)

        await supabase.from("article_likes").delete().eq("article_id", newsId).eq("user_id", userId)
        return
      }

      // Toggle ON or Switch
      let newGood = current.good
      let newBad = current.bad
      if (type === "good") {
        newGood += 1
        if (current.userReaction === "bad") newBad = Math.max(0, newBad - 1)
      } else {
        newBad += 1
        if (current.userReaction === "good") newGood = Math.max(0, newGood - 1)
      }

      _store.set(newsId, { good: newGood, bad: newBad, userReaction: type })
      setCachedReaction(newsId, type)
      notify(newsId)
      updateCachedReactionInFeed(newsId, newGood, newBad)
      updateCachedReactionInSaved(newsId, type, snapshot)

      await supabase.from("article_likes").upsert({
        article_id: newsId,
        user_id: userId,
        type: type,
        snapshot: snapshot,
        created_at: new Date().toISOString()
      }, { onConflict: "article_id,user_id" })
    },
    [newsId, userId]
  )

  const state = _store.get(newsId) ?? { good: initialGood, bad: initialBad, userReaction: null }
  const finalUserReaction = userId ? state.userReaction : null

  return { good: state.good, bad: state.bad, userReaction: finalUserReaction, react }
}