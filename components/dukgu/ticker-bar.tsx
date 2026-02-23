"use client"

import { useEffect, useState, useRef } from "react"
import type { IndexQuote } from "@/app/api/market/indices/route"

// =============================================================================
// 📊 TickerBar — 홈 화면 상단 실시간 지수 스크롤 바
//
// - 60초마다 /api/market/indices 에서 지수 데이터를 자동 갱신합니다.
// - 가로 무한 스크롤(marquee) 애니메이션으로 모든 지수를 순환 표시합니다.
// - 나중에 지수 추가 시 API의 SYMBOLS 배열만 수정하면 자동 반영됩니다.
// =============================================================================

const POLL_INTERVAL_MS = 60_000 // 60초

function IndexChip({ index }: { index: IndexQuote }) {
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
    <span className="inline-flex items-center gap-1.5 px-3 whitespace-nowrap">
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
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchIndices = async () => {
    try {
      const res = await fetch("/api/market/indices")
      if (!res.ok) return
      const data = await res.json()
      setIndices(data.indices ?? [])
    } catch {
      // 조용히 실패 (기존 데이터 유지)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIndices()
    intervalRef.current = setInterval(fetchIndices, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (isLoading || indices.length === 0) {
    return (
      <div className="h-8 bg-slate-50 border-b border-slate-100 animate-pulse" />
    )
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
        {/* 데이터를 2번 복제해서 이음새 없는 무한 루프 구현 */}
        <div className="ticker-track">
          {[...indices, ...indices].map((idx, i) => (
            <IndexChip key={`${idx.symbol}-${i}`} index={idx} />
          ))}
        </div>
      </div>
    </>
  )
}
