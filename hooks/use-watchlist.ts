"use client"

// =============================================================================
// 🔖 useWatchlist — 관심 종목 전역 훅
//
// - 전역 캐시(_cache)로 여러 컴포넌트가 동일 상태 공유
// - 로그인 사용자: Supabase DB 연동
// - 비로그인: toast 안내
// =============================================================================

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export interface WatchlistItem {
  ticker:   string
  name:     string
  added_at: string
}

let _cache:   WatchlistItem[] | null = null
let _userId:  string | null = null
const _listeners = new Set<() => void>()

function notifyAll() {
  _listeners.forEach((fn) => fn())
}

async function ensureLoaded() {
  if (_cache !== null) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { _cache = []; return }
  _userId = user.id
  const { data } = await supabase
    .from("stock_watchlist")
    .select("ticker, name, added_at")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false })
  _cache = data ?? []
  notifyAll()
}

// 로그아웃 시 캐시 초기화
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    _cache = null
    _userId = null
    notifyAll()
  }
})

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>(_cache ?? [])
  const [loading, setLoading] = useState(_cache === null)

  useEffect(() => {
    const sync = () => setItems([...(_cache ?? [])])
    _listeners.add(sync)

    if (_cache === null) {
      ensureLoaded().then(() => {
        setItems([...(_cache ?? [])])
        setLoading(false)
      })
    } else {
      setLoading(false)
    }

    return () => { _listeners.delete(sync) }
  }, [])

  const toggle = useCallback(async (ticker: string, name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("로그인이 필요합니다")
      return
    }

    await ensureLoaded()

    const already = (_cache ?? []).some((i) => i.ticker === ticker)

    if (already) {
      _cache = (_cache ?? []).filter((i) => i.ticker !== ticker)
      notifyAll()
      await supabase.from("stock_watchlist")
        .delete().eq("user_id", user.id).eq("ticker", ticker)
      toast.success("관심 종목에서 제거됐습니다")
    } else {
      const item: WatchlistItem = { ticker, name, added_at: new Date().toISOString() }
      _cache = [item, ...(_cache ?? [])]
      notifyAll()
      await supabase.from("stock_watchlist")
        .insert({ user_id: user.id, ticker, name })
      toast.success("관심 종목에 추가됐습니다")
    }
  }, [])

  const isWatched = useCallback(
    (ticker: string) => items.some((i) => i.ticker === ticker),
    [items]
  )

  return { items, loading, toggle, isWatched }
}
