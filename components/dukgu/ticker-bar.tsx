"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 📊 TickerBar — 홈 화면 상단 실시간 지수 스크롤 바
//
// - Supabase Realtime(WebSocket)으로 market_indices 테이블 변경을 구독합니다.
// - 초기 데이터는 마운트 시 Supabase에서 직접 조회합니다.
// - INSERT / UPDATE 이벤트 발생 시 해당 지수만 부드럽게 교체됩니다.
//   → 마퀴 애니메이션이 끊기지 않고 숫자만 업데이트됩니다.
// - 언마운트 시 채널을 정리해 메모리 누수를 방지합니다.
// =============================================================================

// 지수 표시 순서 (DB에서 가져온 데이터를 이 순서로 정렬)
const SYMBOL_ORDER = ["^DJI", "^NDX", "^GSPC", "^RUT", "^KS11", "^KQ11", "KRW=X"]

interface IndexQuote {
  symbol: string
  name: string
  price: number
  change: number
  changeRate: number
  changeStatus: "up" | "down" | "same"
}

// DB 컬럼명(snake_case) → 컴포넌트 타입(camelCase) 변환
interface DbRow {
  symbol: string
  name: string
  price: number
  change: number
  change_rate: number
  change_status: "up" | "down" | "same"
}

function mapRow(row: DbRow): IndexQuote {
  return {
    symbol:       row.symbol,
    name:         row.name,
    price:        row.price,
    change:       row.change,
    changeRate:   row.change_rate,
    changeStatus: row.change_status,
  }
}

function sortByOrder(items: IndexQuote[]): IndexQuote[] {
  return [...items].sort((a, b) => {
    const ai = SYMBOL_ORDER.indexOf(a.symbol)
    const bi = SYMBOL_ORDER.indexOf(b.symbol)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

function IndexChip({ index, fresh }: { index: IndexQuote; fresh: boolean }) {
  const isUp   = index.changeStatus === "up"
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
  const [indices, setIndices]   = useState<IndexQuote[]>([])
  const [hasData, setHasData]   = useState(false)
  const [failed, setFailed]     = useState(false)
  const [fresh, setFresh]       = useState(false)
  const freshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // ── 1. 초기 데이터 로딩 ────────────────────────────────────────────────────
    supabase
      .from("market_indices")
      .select("symbol, name, price, change, change_rate, change_status")
      .then(({ data, error }) => {
        if (error) { setFailed(true); return }
        if (data?.length) {
          setIndices(sortByOrder(data.map(mapRow)))
          setHasData(true)
        }
        // 데이터가 없으면 skeleton 유지 — Realtime INSERT가 오면 채워집니다.
      })

    // ── 2. Realtime 구독 ────────────────────────────────────────────────────────
    // Edge Function이 upsert할 때 INSERT(최초) 또는 UPDATE 이벤트가 발생합니다.
    const handleChange = (payload: { new: DbRow }) => {
      const row = payload.new
      setIndices((prev) => {
        const exists = prev.some((idx) => idx.symbol === row.symbol)
        return exists
          ? prev.map((idx) => (idx.symbol === row.symbol ? mapRow(row) : idx))
          : sortByOrder([...prev, mapRow(row)])
      })
      setHasData(true)

      // 업데이트 시 brief 페이드 효과
      setFresh(true)
      if (freshTimerRef.current) clearTimeout(freshTimerRef.current)
      freshTimerRef.current = setTimeout(() => setFresh(false), 400)
    }

    const channel = supabase
      .channel("market_indices_rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "market_indices" },
        handleChange as any
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "market_indices" },
        handleChange as any
      )
      .subscribe()

    // ── 3. 클린업 ───────────────────────────────────────────────────────────────
    return () => {
      supabase.removeChannel(channel)
      if (freshTimerRef.current) clearTimeout(freshTimerRef.current)
    }
  }, [])

  if (failed) return null

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
        {/* Realtime 연결 상태 표시 — 항상 live */}
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mx-1.5 shrink-0 self-center" />
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
