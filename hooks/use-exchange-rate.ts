"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 💱 useExchangeRate — USD→KRW 실시간 환율
//
// market_indices 테이블의 KRW=X 심볼에서 환율을 읽습니다.
// TickerBar와 같은 테이블을 구독하므로 항상 최신값이 유지됩니다.
// DB 조회 실패 시 폴백(1430)을 반환합니다.
// =============================================================================

const FALLBACK_RATE = 1430

export function useExchangeRate(): number {
  const [rate, setRate] = useState(FALLBACK_RATE)

  useEffect(() => {
    supabase
      .from("market_indices")
      .select("price")
      .eq("symbol", "KRW=X")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.price && data.price > 0) setRate(Math.round(data.price))
      })

    const channel = supabase
      .channel("exchange_rate_krwx")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_indices", filter: "symbol=eq.KRW=X" },
        (payload) => {
          const price = (payload.new as { price?: number })?.price
          if (price && price > 0) setRate(Math.round(price))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return rate
}
