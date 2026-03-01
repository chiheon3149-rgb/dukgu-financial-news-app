"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { MarketQuote } from "@/types"

// =============================================================================
// 📡 useMarketPrice
//
// 역할: 티커 목록을 받아서 실시간 시세를 30초마다 자동 갱신합니다.
// =============================================================================

const POLL_INTERVAL_MS = 30_000 // 30초 국룰 세팅

interface UseMarketPriceReturn {
  quotes: Record<string, MarketQuote>
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useMarketPrice(tickers: string[]): UseMarketPriceReturn {
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchQuotes = useCallback(async () => {
    // 💡 조회할 티커가 없으면 굳이 서버에 물어보지 않습니다.
    if (tickers.length === 0) {
      setQuotes({})
      setIsLoading(false)
      return
    }

    try {
      // 💡 [수정] 우리가 만든 진짜 API 경로(/quotes)로 수정했습니다.
      const res = await fetch(`/api/market/quotes?tickers=${tickers.join(",")}`)
      if (!res.ok) throw new Error("시세 데이터 배달 실패")

      const data = await res.json()
      
      // 💡 [수정] API가 주는 배열 데이터를 티커를 '키'로 하는 지도(Map)로 변환합니다.
      const map: Record<string, MarketQuote> = {}
      data.forEach((q: MarketQuote) => {
        map[q.ticker] = q
      })
      
      setQuotes(map)
      setError(null)
    } catch (e) {
      console.error("Market Data Fetch Error:", e)
      setError("시세를 불러오지 못했습니다")
    } finally {
      setIsLoading(false)
    }
  }, [tickers.join(",")]) // 💡 티커 목록이 변할 때만 함수를 새로 만듭니다.

  // 1️⃣ 최초 실행: 화면이 열리거나 티커가 바뀌면 즉시 한 번 조회
  useEffect(() => {
    setIsLoading(true)
    fetchQuotes()
  }, [fetchQuotes])

  // 2️⃣ 폴링 시스템: 30초마다 반복 & 탭이 안 보이면 일시 정지 (배터리 절약!)
  useEffect(() => {
    const startPolling = () => {
      stopPolling() // 기존 타이머가 있다면 확실히 지우고 시작
      intervalRef.current = setInterval(fetchQuotes, POLL_INTERVAL_MS)
    }
    
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    startPolling()

    // 💡 기획자님의 핵심 아이디어: 브라우저 탭을 가리면 데이터 수신을 멈춥니다.
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        // 다시 돌아오면 즉시 최신 가격부터 한 번 보여주고 폴링 재시작!
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

  // 💡 refresh 기능을 밖으로 내보내서 '새로고침 버튼'에서 쓸 수 있게 합니다.
  return { quotes, isLoading, error, refresh: fetchQuotes }
}