"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import type { IndexQuote } from "@/app/api/market/indices/route"

// =============================================================================
// 📊 TickerBar — 홈 화면 상단 실시간 지수 스크롤 바
//
// - 30초마다 /api/market/indices 에서 지수 데이터를 자동 갱신합니다.
// - 탭이 백그라운드 상태면 폴링을 멈추고, 포커스 복귀 시 즉시 재조회합니다.
// - 최초 로딩 전에만 스켈레톤을 표시하며, 재조회 시 기존 데이터를 유지합니다.
//   → 마퀴 애니메이션이 끊기지 않고 숫자만 부드럽게 교체됩니다.
// =============================================================================

const POLL_INTERVAL_MS = 30_000

function SourceDot({ source }: { source: "live" | "mock" }) {
  if (source === "mock") return null
  return (
    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mx-1.5 shrink-0 self-center" />
  )
}

function IndexChip({ index, fresh }: { index: IndexQuote; fresh: boolean }) {
  const isUp = index.changeStatus === "up"
  const isDown = index.changeStatus === "down"

  const priceStr =
    index.symbol === "KRW=X"
      ? `${index.price.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`
      : index.symbol.startsWith("^K")
        ? index.price.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
        : index.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })

  const rateStr = `${isUp ? "+" : ""}${index.changeRate.toFixed(2)}%`

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 whitespace-nowrap"
      style={{ opacity: fresh ? 0.65 : 1, transition: "opacity 0.4s ease" }}
    >
      <span className="text-[11px] font-black text-slate-500">{index.name}</span>
      <span className="text-[11px] font-bold text-slate-700">{priceStr}</span>
      <span className={`text-[10px] font-black ${isUp ? "text-rose-500" : isDown ? "text-blue-500" : "text-slate-400"}`}>
        {rateStr}
      </span>
      <span className="text-slate-200 select-none">|</span>
    </span>
  )
}

export function TickerBar() {
  const [indices, setIndices] = useState<IndexQuote[]>([])
  const [source, setSource] = useState<"live" | "mock">("mock")
  const [hasData, setHasData] = useState(false)
  const [fresh, setFresh] = useState(false)

  // ref로 관리 → fetchIndices의 deps 없이 stable 유지
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasDataRef = useRef(false)
  const freshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchIndices = useCallback(async () => {
    try {
      const res = await fetch("/api/market/indices", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (!data.indices?.length) return

      setIndices(data.indices)
      setSource(data.source ?? "mock")

      // 갱신 시 brief 페이드인 (이미 데이터가 있을 때만)
      if (hasDataRef.current) {
        setFresh(true)
        if (freshTimerRef.current) clearTimeout(freshTimerRef.current)
        freshTimerRef.current = setTimeout(() => setFresh(false), 400)
      } else {
        hasDataRef.current = true
        setHasData(true)
      }
    } catch {
      // 실패 시 기존 데이터 유지
    }
  }, []) // deps 없음 — ref로 상태 추적하므로 stable

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    intervalRef.current = setInterval(fetchIndices, POLL_INTERVAL_MS)
  }, [fetchIndices, stopPolling])

  useEffect(() => {
    fetchIndices()
    startPolling()

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        fetchIndices()
        startPolling()
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      stopPolling()
      if (freshTimerRef.current) clearTimeout(freshTimerRef.current)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetchIndices, startPolling, stopPolling])

  if (!hasData) {
    return <div className="h-8 bg-slate-50 border-b border-slate-100 animate-pulse" />
  }

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: inline-flex;
          animation: ticker-scroll 30s linear infinite;
          will-change: transform;
        }
        .ticker-wrap:hover .ticker-track {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-wrap bg-slate-50/80 border-b border-slate-100 overflow-hidden h-8 flex items-center">
        <SourceDot source={source} />
        {/* 데이터를 2번 복제 → 이음새 없는 무한 루프 */}
        <div className="ticker-track">
          {[...indices, ...indices].map((idx, i) => (
            <IndexChip key={`${idx.symbol}-${i}`} index={idx} fresh={fresh} />
          ))}
        </div>
      </div>
    </>
  )
}
