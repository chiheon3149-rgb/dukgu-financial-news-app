"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { supabase } from "@/lib/supabase"

const SYMBOL_ORDER = ["^DJI", "^NDX", "^GSPC", "^RUT", "^KS11", "^KQ11", "KRW=X", "JPYKRW=X"]

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

  const displayPrice = index.symbol === "JPYKRW=X" ? index.price * 100 : index.price;
  const displayName = index.symbol === "JPYKRW=X" ? "엔/원(100엔)" : index.name;

  const priceStr =
    index.symbol.includes("=X")
      ? `${displayPrice.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원`
      : index.symbol.startsWith("^K")
        ? displayPrice.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
        : displayPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })

  const rateStr = `${isUp ? "▲" : isDown ? "▼" : ""}${index.changeRate.toFixed(2)}%`

  return (
    <div
      className="inline-flex items-center gap-2 px-4 whitespace-nowrap border-r border-slate-200 h-9 shrink-0 select-none"
      style={{ opacity: fresh ? 0.5 : 1, transition: "opacity 0.3s" }}
    >
      <span className="text-[11px] font-medium text-slate-500">{displayName}</span>
      <span className="text-[12px] font-bold text-slate-800 tracking-tight">{priceStr}</span>
      {/* 💡 [수정] 상승은 민트(emerald), 하락은 장미빛(rose)으로 변경하여 가독성 강화 */}
      <span className={`text-[11px] font-semibold ${isUp ? "text-emerald-500" : isDown ? "text-rose-500" : "text-slate-400"}`}>
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
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const isHovered = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  useEffect(() => {
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

  useEffect(() => {
    let animationId: number;
    const scroll = () => {
      if (scrollRef.current && !isDragging && !isHovered.current) {
        scrollRef.current.scrollLeft += 0.8; // 속도를 살짝 늦춰서 가독성 확보
        
        if (scrollRef.current.scrollLeft >= scrollRef.current.scrollWidth / 2) {
          scrollRef.current.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scroll);
    }
    
    if (hasData) {
      animationId = requestAnimationFrame(scroll);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isDragging, hasData]);

  const handleDragStart = (pageX: number) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    startX.current = pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
  }
  
  const handleDragMove = (pageX: number) => {
    if (!isDragging || !scrollRef.current) return
    const x = pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5 
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  const handleDragEnd = () => setIsDragging(false)

  const tickerItems = useMemo(() => [...indices, ...indices], [indices])

  if (failed) return null
  if (!hasData) return <div className="h-9 bg-white border-b border-slate-200 animate-pulse w-full" />

  return (
    <>
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="bg-white border-b border-slate-200 h-9 flex items-center relative w-full overflow-hidden">
        {/* 'On' 고정 레이블 (민트 포인트) */}
        <div className="flex items-center px-3 bg-white z-20 h-full border-r border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.03)] shrink-0">
          <span className="relative flex h-1.5 w-1.5 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-black text-slate-700 tracking-tighter whitespace-nowrap uppercase">On</span>
        </div>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto hide-scrollbar h-full cursor-grab active:cursor-grabbing w-full"
          onMouseEnter={() => isHovered.current = true}
          onMouseLeave={() => { isHovered.current = false; handleDragEnd(); }}
          onMouseDown={(e) => handleDragStart(e.pageX)}
          onMouseMove={(e) => { e.preventDefault(); handleDragMove(e.pageX); }}
          onMouseUp={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].pageX)}
          onTouchMove={(e) => handleDragMove(e.touches[0].pageX)}
          onTouchEnd={handleDragEnd}
        >
          {tickerItems.map((idx, i) => (
            <IndexChip key={`${idx.symbol}-${i}`} index={idx} fresh={fresh} />
          ))}
        </div>
      </div>
    </>
  )
}