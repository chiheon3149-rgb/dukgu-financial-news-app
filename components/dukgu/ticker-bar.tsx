"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
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

// ── 카드 컴포넌트 ──────────────────────────────────────────
interface IndexCardProps {
  index: IndexQuote
  fresh: boolean
  displayName: string
  onClick: (symbol: string) => void
}

function IndexCard({ index, fresh, displayName, onClick }: IndexCardProps) {
  const isUp   = index.changeStatus === "up"
  const isDown = index.changeStatus === "down"
  const displayPrice = index.symbol === "JPYKRW=X" ? index.price * 100 : index.price

  const changeColor = isUp ? "text-[#10B981]" : isDown ? "text-[#EF4444]" : "text-gray-400"
  const valueFreshColor = fresh
    ? (isUp ? "text-[#10B981]" : isDown ? "text-[#EF4444]" : "text-[#111827]")
    : "text-[#111827]"

  return (
    <button
      onClick={() => onClick(index.symbol)}
      className="w-[120px] h-[72px] rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-center px-3 gap-0.5 shrink-0 select-none cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200"
    >
      <span className="text-[11px] font-medium text-[#6B7280] leading-none truncate">{displayName}</span>
      <span className={`text-[14px] font-semibold leading-none transition-colors duration-300 ${valueFreshColor}`}>
        {index.symbol.includes("=X")
          ? `${displayPrice.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원`
          : displayPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </span>
      <span className={`text-[12px] font-medium leading-none ${changeColor}`}>
        {isUp ? "▲ +" : isDown ? "▼ " : ""}{index.changeRate.toFixed(2)}%
      </span>
    </button>
  )
}

// ── 스켈레톤 카드 ──────────────────────────────────────────
function IndexCardSkeleton() {
  return (
    <div className="w-[120px] h-[72px] rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-center px-3 gap-1.5 shrink-0">
      <div className="h-2.5 w-14 rounded bg-gray-100 shimmer" />
      <div className="h-4 w-16 rounded bg-gray-100 shimmer" />
      <div className="h-2.5 w-10 rounded bg-gray-100 shimmer" />
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────
export function TickerBar() {
  const [dbIndices, setDbIndices]       = useState<IndexQuote[]>([])
  const [customQuotes, setCustomQuotes] = useState<IndexQuote[]>([])
  const [hasData, setHasData]           = useState(false)
  const [failed, setFailed]             = useState(false)
  const [fresh, setFresh]               = useState(false)
  const [settings, setSettings]         = useState<TickerSettings>({
    customNames: {}, hiddenSymbols: [], customTickers: [],
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const router = useRouter()

  // ── 설정 로드 ──
  useEffect(() => {
    const localSettings = loadTickerSettings()
    setSettings(localSettings)
    const localHasData =
      localSettings.hiddenSymbols.length > 0 ||
      localSettings.customTickers.length > 0 ||
      Object.keys(localSettings.customNames).length > 0
    if (!localHasData) {
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

  // ── 커스텀 티커 fetch ──
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
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [settings.customTickers])

  const handleCardClick = useCallback(() => {
    router.push("/market")
  }, [router])

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

  if (failed) return null

  return (
    <>
      <div className="w-full bg-[#F9FAFB] py-3 relative">
        <div className="flex items-center gap-3 px-4 overflow-x-auto scrollbar-hide">

          {/* 카드 목록 */}
          {!hasData ? (
            Array.from({ length: 4 }).map((_, i) => <IndexCardSkeleton key={i} />)
          ) : (
            visibleIndices.map((idx) => (
              <IndexCard
                key={idx.symbol}
                index={idx}
                fresh={fresh}
                displayName={getDisplayName(idx.symbol)}
                onClick={handleCardClick}
              />
            ))
          )}

          {/* 설정 버튼 */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-[44px] h-[72px] rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0 hover:bg-gray-50 active:scale-95 transition-all"
            aria-label="지수 설정"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
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
