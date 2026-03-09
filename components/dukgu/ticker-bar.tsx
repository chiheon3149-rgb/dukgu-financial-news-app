"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  TickerSettingsSheet,
  loadTickerSettings,
  loadTickerSettingsFromDb,
  type TickerSettings,
  TICKER_SETTINGS_CHANGED,
  DEFAULT_TICKER_NAMES,
} from "./ticker-settings-sheet"

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

function sortByOrder(items: IndexQuote[], orderList: string[]): IndexQuote[] {
  return [...items].sort((a, b) => {
    const ai = orderList.indexOf(a.symbol)
    const bi = orderList.indexOf(b.symbol)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

// -------------------------------------------------------
// 단일 칩
// -------------------------------------------------------
interface IndexChipProps {
  index: IndexQuote
  fresh: boolean
  displayName: string
  onClick: (symbol: string) => void
  isDragging: boolean
}

function IndexChip({ index, fresh, displayName, onClick, isDragging }: IndexChipProps) {
  const isUp   = index.changeStatus === "up"
  const isDown = index.changeStatus === "down"
  const displayPrice =
    index.symbol === "JPYKRW=X" ? index.price * 100 : index.price

  const handleClick = () => {
    if (isDragging) return
    onClick(index.symbol)
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 whitespace-nowrap border-r border-slate-200 h-9 shrink-0 select-none cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
    >
      <span className="text-[11px] font-medium text-slate-500">{displayName}</span>
      <span
        className={`text-[12px] font-bold transition-all duration-500 ${
          fresh
            ? isUp
              ? "text-emerald-400 scale-110"
              : isDown
              ? "text-rose-400 scale-110"
              : "text-blue-400"
            : "text-slate-800"
        }`}
      >
        {index.symbol.includes("=X")
          ? `${displayPrice.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원`
          : displayPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </span>
      <span
        className={`text-[11px] font-semibold ${
          isUp ? "text-emerald-500" : isDown ? "text-rose-500" : "text-slate-400"
        }`}
      >
        {isUp ? "▲" : isDown ? "▼" : ""}
        {index.changeRate.toFixed(2)}%
      </span>
    </button>
  )
}

// -------------------------------------------------------
// 메인 컴포넌트
// -------------------------------------------------------
export function TickerBar() {
  const [dbIndices, setDbIndices]     = useState<IndexQuote[]>([])
  const [customQuotes, setCustomQuotes] = useState<IndexQuote[]>([])
  const [hasData, setHasData]         = useState(false)
  const [failed, setFailed]           = useState(false)
  const [fresh, setFresh]             = useState(false)

  const [settings, setSettings]       = useState<TickerSettings>({
    customNames: {}, hiddenSymbols: [], customTickers: [],
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const router = useRouter()

  const scrollRef    = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const scrollPosRef = useRef(0)
  const [isInteracting, setIsInteracting] = useState(false)
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0, moved: false })

  // ── 설정 로드 (localStorage 즉시 → DB는 localStorage가 비어있을 때만 덮어쓰기) ──
  useEffect(() => {
    const localSettings = loadTickerSettings()
    setSettings(localSettings)
    const localHasData =
      localSettings.hiddenSymbols.length > 0 ||
      localSettings.customTickers.length > 0 ||
      Object.keys(localSettings.customNames).length > 0
    if (!localHasData) {
      // localStorage에 데이터 없음(새 기기) → DB에서 로드
      loadTickerSettingsFromDb().then((dbSettings) => {
        if (dbSettings) {
          setSettings(dbSettings)
          localStorage.setItem("dukgu_ticker_v1", JSON.stringify(dbSettings))
        }
      })
    }
    const handler = () => setSettings(loadTickerSettings())
    window.addEventListener(TICKER_SETTINGS_CHANGED, handler)
    return () => window.removeEventListener(TICKER_SETTINGS_CHANGED, handler)
  }, [])

  // ── DB 데이터 로드 + 리얼타임 구독 ──
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("market_indices").select("*")
      if (error) { setFailed(true); return }
      if (data) { setDbIndices(sortByOrder(data.map(mapRow), SYMBOL_ORDER)); setHasData(true) }
    }
    fetchData()

    const channel = supabase
      .channel("market_indices_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "market_indices" }, (payload) => {
        setDbIndices((prev) =>
          prev.map((idx) =>
            idx.symbol === (payload.new as DbRow).symbol ? mapRow(payload.new as DbRow) : idx
          )
        )
        setFresh(true)
        setTimeout(() => setFresh(false), 700)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── 커스텀 티커 fetch (설정 변경 시) ──
  useEffect(() => {
    const tickers = settings.customTickers ?? []
    if (tickers.length === 0) { setCustomQuotes([]); return }

    const load = async () => {
      try {
        const res = await fetch(`/api/market/quotes?tickers=${tickers.join(",")}`)
        if (!res.ok) return
        const data: Array<{
          ticker: string; name?: string; currentPrice: number
          change?: number; changePercent: number
        }> = await res.json()

        const quotes: IndexQuote[] = data.map((q) => ({
          symbol:       q.ticker,
          name:         q.name ?? q.ticker,
          price:        q.currentPrice,
          change:       q.change ?? 0,
          changeRate:   q.changePercent,
          changeStatus: q.changePercent > 0 ? "up" : q.changePercent < 0 ? "down" : "same",
        }))
        setCustomQuotes(quotes)
      } catch { /* 조용히 실패 */ }
    }
    load()
  }, [settings.customTickers])

  // ── 자동 흐르기 ──
  useEffect(() => {
    if (!hasData || isInteracting) return
    const scroll = () => {
      if (scrollRef.current) {
        scrollPosRef.current += 0.8
        scrollRef.current.scrollLeft = scrollPosRef.current
        if (scrollPosRef.current >= scrollRef.current.scrollWidth / 2) {
          scrollPosRef.current = 0
          scrollRef.current.scrollLeft = 0
        }
      }
      animationRef.current = requestAnimationFrame(scroll)
    }
    animationRef.current = requestAnimationFrame(scroll)
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [hasData, isInteracting, dbIndices, customQuotes])

  // ── 드래그 핸들러 ──
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsInteracting(true)
    dragState.current = { isDragging: true, startX: e.pageX, scrollLeft: scrollRef.current?.scrollLeft ?? 0, moved: false }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.isDragging || !scrollRef.current) return
    if (e.cancelable) e.preventDefault()
    const dx = Math.abs(e.pageX - dragState.current.startX)
    if (dx > 5) dragState.current.moved = true

    const walk      = (dragState.current.startX - e.pageX) * 1.5
    let nextScroll  = dragState.current.scrollLeft + walk
    const halfWidth = scrollRef.current.scrollWidth / 2

    if (nextScroll >= halfWidth) {
      nextScroll -= halfWidth; dragState.current.startX = e.pageX; dragState.current.scrollLeft = nextScroll
    } else if (nextScroll <= 0) {
      nextScroll += halfWidth; dragState.current.startX = e.pageX; dragState.current.scrollLeft = nextScroll
    }
    scrollRef.current.scrollLeft = nextScroll
    scrollPosRef.current = nextScroll
  }

  const handlePointerUpOrLeave = () => {
    setIsInteracting(false)
    dragState.current.isDragging = false
  }

  // ── 칩 클릭 → 주요 지수 페이지 이동 ──
  const handleChipClick = useCallback((symbol: string) => {
    if (dragState.current.moved) return
    router.push("/market")
  }, [router])

  // ── 렌더 데이터 (DB + 커스텀, 숨김 필터 적용) ──
  const allIndices = useMemo(
    () => [...dbIndices, ...customQuotes],
    [dbIndices, customQuotes]
  )

  const visibleIndices = useMemo(
    () => allIndices.filter((i) => !(settings.hiddenSymbols ?? []).includes(i.symbol)),
    [allIndices, settings.hiddenSymbols]
  )

  const getDisplayName = (symbol: string) =>
    settings.customNames[symbol] ?? DEFAULT_TICKER_NAMES[symbol] ?? symbol

  const tickerItems = useMemo(
    () => visibleIndices.length > 1 ? [...visibleIndices, ...visibleIndices] : visibleIndices,
    [visibleIndices]
  )

  if (failed) return null
  if (!hasData || dbIndices.length === 0)
    return <div className="h-9 bg-white border-b border-slate-200 w-full" />

  return (
    <>
      <div className="bg-white border-b border-slate-200 h-9 flex items-center relative w-full overflow-hidden">
        
        {/* 'On' 레이블 및 아이콘 삭제됨 -> 바로 스크롤 영역 시작 */}
        
        {/* 스크롤 영역 */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-hidden h-full flex items-center scrollbar-hide"
          style={{ scrollBehavior: "auto", cursor: isInteracting ? "grabbing" : "grab", touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrLeave}
          onPointerLeave={handlePointerUpOrLeave}
          onPointerCancel={handlePointerUpOrLeave}
        >
          <div className="flex items-center">
            {tickerItems.map((idx, i) => (
              <IndexChip
                key={`${idx.symbol}-${i}`}
                index={idx}
                fresh={fresh}
                displayName={getDisplayName(idx.symbol)}
                onClick={handleChipClick}
                isDragging={dragState.current.moved}
              />
            ))}
          </div>
        </div>

        {/* 설정 버튼 (우측 고정) */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center justify-center w-9 h-9 bg-white z-20 border-l border-slate-200 shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          title="지수 설정"
          aria-label="지수 설정"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      <TickerSettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        symbols={SYMBOL_ORDER}
        settings={settings}
        onSave={setSettings}
      />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}