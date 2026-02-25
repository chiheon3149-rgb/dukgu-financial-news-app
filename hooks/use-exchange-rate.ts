"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const FALLBACK_RATE = 1432

/** KRW=X (USD→KRW) 환율을 market_indices에서 실시간으로 가져옵니다. 실패 시 1432 반환 */
export function useExchangeRate(): number {
  const [rate, setRate] = useState<number>(FALLBACK_RATE)

  useEffect(() => {
    supabase
      .from("market_indices")
      .select("price")
      .eq("symbol", "KRW=X")
      .single()
      .then(({ data }) => {
        if (data?.price && data.price > 0) {
          setRate(Math.round(data.price))
        }
      })
  }, [])

  return rate
}
