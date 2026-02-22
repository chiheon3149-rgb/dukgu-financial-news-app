"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { MarketQuote } from "@/types"

// =============================================================================
// 📡 useMarketPrice
//
// 역할: 티커 목록을 받아서 실시간 시세를 30초마다 자동 갱신합니다.
//
// 작동 방식 (비유):
// 주식 앱을 켜두면 가격이 계속 바뀌는 것처럼, 이 훅은 30초마다 우리 서버의
// /api/market/price 에 조용히 물어보고 새 가격을 가져옵니다.
// 브라우저 탭이 백그라운드로 가면 폴링을 멈추고, 포커스가 돌아오면 즉시 재조회해
// 불필요한 네트워크 요청을 줄입니다.
//
// 사용 예시:
//   const { quotes, isLoading } = useMarketPrice(["AAPL", "NVDA", "005930.KS"])
//   const applePrice = quotes["AAPL"]?.currentPrice
// =============================================================================

const POLL_INTERVAL_MS = 30_000 // 30초

interface UseMarketPriceReturn {
  /** 티커를 키로 하는 시세 맵 */
  quotes: Record<string, MarketQuote>
  isLoading: boolean
  error: string | null
  /** 수동으로 즉시 재조회 */
  refresh: () => void
}

export function useMarketPrice(tickers: string[]): UseMarketPriceReturn {
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchQuotes = useCallback(async () => {
    if (tickers.length === 0) return
    try {
      const res = await fetch(`/api/market/price?tickers=${tickers.join(",")}`)
      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()
      const map: Record<string, MarketQuote> = {}
      for (const q of data.quotes) {
        map[q.ticker] = q
      }
      setQuotes(map)
      setError(null)
    } catch (e) {
      setError("시세를 불러오지 못했습니다")
    } finally {
      setIsLoading(false)
    }
  }, [tickers.join(",")])

  // 최초 마운트 + tickers 변경 시 즉시 조회
  useEffect(() => {
    setIsLoading(true)
    fetchQuotes()
  }, [fetchQuotes])

  // 30초 폴링: 탭이 active 상태일 때만 동작
  useEffect(() => {
    const startPolling = () => {
      intervalRef.current = setInterval(fetchQuotes, POLL_INTERVAL_MS)
    }
    const stopPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    startPolling()

    // 탭 포커스가 돌아오면 즉시 재조회 후 폴링 재시작
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        fetchQuotes()
        startPolling()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchQuotes])

  return { quotes, isLoading, error, refresh: fetchQuotes }
}
