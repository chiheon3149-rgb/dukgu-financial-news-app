"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

// 지수 표시 순서
const SYMBOL_ORDER = ["^DJI", "^NDX", "^GSPC", "^RUT", "^KS11", "^KQ11", "KRW=X"]

interface IndexQuote {
  symbol: string
  name: string
  price: number
  change: number
  changeRate: number
  changeStatus: "up" | "down" | "same"
}

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
    symbol: row.symbol,
    name: row.name,
    price: row.price,
    change: row.change,
    changeRate: row.change_rate,
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
  const isUp = index.changeStatus === "up"
  const isDown = index.changeStatus === "down"

  const priceStr =
    index.symbol === "KRW=X"
      ? `${index.price.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`
      : index.symbol.startsWith("^K")
        ? index.price.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
        : index.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })

  const rateStr = `${isUp ? "▲" : isDown ? "▼" : ""}${index.changeRate.toFixed(2)}%`

  return (
    <div
      className="inline-flex items-center gap-2 px-4 whitespace-nowrap border-r border-slate-200 h-9"
      style={{ opacity: fresh ? 0.5 : 1, transition: "opacity 0.3s" }}
    >
      <span className="text-[11px] font-medium text-slate-500">{index.name}</span>
      <span className="text-[12px] font-bold text-slate-800 tracking-tight">{priceStr}</span>
      <span className={`text-[11px] font-semibold ${isUp ? "text-rose-500" : isDown ? "text-blue-500" : "text-slate-400"}`}>
        {rateStr}
      </span>
    </div>
  )
}

export function TickerBar() {
  const [indices, setIndices] = useState<IndexQuote[]>([])
  const [hasData, setHasData] = useState(false)
  const [failed, setFailed] = useState(false)
  const [fresh, setFresh] = useState(false)
  const freshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // 1. 초기 데이터 로드
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("market_indices")
        .select("symbol, name, price, change, change_rate, change_status")
      
      if (error) {
        setFailed(true)
        return
      }
      if (data && data.length > 0) {
        setIndices(sortByOrder(data.map(mapRow)))
        setHasData(true)
      }
    }

    fetchData()

    // 2. 리얼타임 구독
    const handleChange = (payload: any) => {
      const row = payload.new as DbRow
      setIndices((prev) => {
        const exists = prev.some((idx) => idx.symbol === row.symbol)
        const updated = exists
          ? prev.map((idx) => (idx.symbol === row.symbol ? mapRow(row) : idx))
          : sortByOrder([...prev, mapRow(row)])
        return updated
      })
      setHasData(true)
      setFresh(true)
      if (freshTimerRef.current) clearTimeout(freshTimerRef.current)
      freshTimerRef.current = setTimeout(() => setFresh(false), 400)
    }

    const channel = supabase
      .channel("market_indices_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "market_indices" }, handleChange)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "market_indices" }, handleChange)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (freshTimerRef.current) clearTimeout(freshTimerRef.current)
    }
  }, [])

  if (failed) return null
  if (!hasData) return <div className="h-9 bg-white border-b border-slate-200 animate-pulse w-full" />

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: inline-flex;
          animation: ticker-scroll 60s linear infinite;
          will-change: transform;
        }
        .ticker-wrap:hover .ticker-track {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-wrap bg-white border-b border-slate-200 overflow-hidden h-9 flex items-center relative w-full">
        
        {/* '시장지수' 고정 레이블 */}
        <div className="flex items-center px-3 bg-white z-20 h-full border-r border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.03)]">
          <span className="relative flex h-1.5 w-1.5 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-black text-slate-700 tracking-tighter whitespace-nowrap">On</span>
        </div>

        {/* 무한 롤링 트랙 */}
        <div className="ticker-track">
          {[...indices, ...indices, ...indices].map((idx, i) => (
            <IndexChip key={`${idx.symbol}-${i}`} index={idx} fresh={fresh} />
          ))}
        </div>
      </div>
    </>
  )
}