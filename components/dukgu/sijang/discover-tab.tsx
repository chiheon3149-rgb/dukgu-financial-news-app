"use client"

// =============================================================================
// 🌍 [발견] 탭 - 시장 둘러보기 (리빌드)
// =============================================================================

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bookmark, ChevronRight, Settings } from "lucide-react"
import { MarketTreemap } from "./market-treemap"
import { ThemeCards } from "./theme-cards"
import { useWatchlist } from "@/hooks/use-watchlist"

import { 
  TickerSettingsSheet, 
  loadTickerSettings, 
  type TickerSettings 
} from "../ticker-settings-sheet"

// ─── 타입 정의 ───────────────────────────────────────────────────────────────

interface IndexQuote {
  symbol: string
  name: string
  price: number
  change: number
  changeRate: number
  changeStatus: "up" | "down" | "same"
}

interface TopStock {
  ticker: string
  displayTicker: string
  name: string
  changeRate: number
  price: number
  currency: "KRW" | "USD"
  volume: number
  tradingValue: number // volume × price
}

// ─── 유틸: 티커 → 배지 색상 ──────────────────────────────────────────────────

const PALETTE = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#f97316"]

function tickerToColor(ticker: string): string {
  let hash = 0
  for (let i = 0; i < ticker.length; i++) hash = ticker.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

// ─── 지수 심볼 표시명 매핑 ───────────────────────────────────────────────────

const INDEX_DISPLAY: Record<string, string> = {
  "^KS11":    "코스피",
  "^KQ11":    "코스닥",
  "^DJI":     "다우존스",
  "^NDX":     "나스닥100",
  "^GSPC":    "S&P500",
  "KRW=X":    "달러/원",
  "JPYKRW=X": "엔/원",
  "^RUT":     "러셀2000",
}

// 1~3위 메달 색상
const RANK_COLORS: Record<number, string> = {
  1: "#F59E0B",
  2: "#94A3B8",
  3: "#CD7C2F",
}

// ─── 정렬 탭 정의 ─────────────────────────────────────────────────────────────

type MarketFilter = "all" | "kr" | "us"
type SortKey = "popular" | "trading" | "volume" | "gainers" | "losers"

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: "popular",  label: "인기"     },
  { key: "trading",  label: "거래대금" },
  { key: "volume",   label: "거래량"   },
  { key: "gainers",  label: "상승"     },
  { key: "losers",   label: "하락"     },
]

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export function DiscoverTab() {
  // ─── 상태 ─────────────────────────────────────────────────────────────────
  const [indices, setIndices]               = useState<IndexQuote[]>([])
  const [indicesLoading, setIndicesLoading] = useState(true)

  const [topStocks, setTopStocks]           = useState<{ kr: TopStock[]; us: TopStock[] }>({ kr: [], us: [] })
  const [stocksLoading, setStocksLoading]   = useState(true)
  const [stocksError, setStocksError]       = useState(false)
  const [fetchedAt, setFetchedAt]           = useState<Date | null>(null)

  const [marketFilter, setMarketFilter]     = useState<MarketFilter>(() => {
    // KST(UTC+9) 기준 08:30~18:00 → 한국, 그 외 → 미국 자동 선택
    const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const h = nowKST.getUTCHours()
    const m = nowKST.getUTCMinutes()
    const total = h * 60 + m
    return total >= 8 * 60 + 30 && total < 18 * 60 ? "kr" : "us"
  })
  const [sortKey, setSortKey]               = useState<SortKey>("popular")

  const [marqueeIdx, setMarqueeIdx]         = useState(0)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [tickerSettings, setTickerSettings] = useState<TickerSettings>({
    customNames: {},
    hiddenSymbols: [],
    customTickers: [],
  })

  const router = useRouter()
  const { toggle: toggleWatchlist, isWatched } = useWatchlist()

  // ─── 데이터 페치 및 초기 설정 로드 ──────────────────────────────────────────

  useEffect(() => {
    setTickerSettings(loadTickerSettings())

    fetch("/api/market/indices")
      .then((r) => r.json())
      .then((data: { indices: IndexQuote[] }) => {
        setIndices(data.indices ?? [])
      })
      .catch(() => setIndices([]))
      .finally(() => setIndicesLoading(false))
  }, [])

  const fetchTopStocks = () => {
    fetch("/api/market/top-stocks")
      .then((r) => r.json())
      .then((data: { kr: TopStock[]; us: TopStock[]; fetchedAt?: string; error?: boolean }) => {
        if (data.error) {
          setStocksError(true)
        } else {
          setTopStocks({ kr: data.kr ?? [], us: data.us ?? [] })
          setFetchedAt(data.fetchedAt ? new Date(data.fetchedAt) : new Date())
          setStocksError(false)
        }
      })
      .catch(() => setStocksError(true))
      .finally(() => setStocksLoading(false))
  }

  useEffect(() => {
    fetchTopStocks()
    const interval = setInterval(fetchTopStocks, 15 * 60 * 1000) // 15분마다 갱신
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── 마키 배너 ────────────────────────────────────────

  // 마키: 현재 마켓 필터에 맞는 종목 표시
  const marqueeItems = marketFilter === "us"
    ? topStocks.us.slice(0, 10)
    : topStocks.kr.slice(0, 10)

  useEffect(() => {
    if (marqueeItems.length === 0) return
    const timer = setInterval(() => {
      setMarqueeIdx((prev) => (prev + 1) % marqueeItems.length)
    }, 1500)
    return () => clearInterval(timer)
  }, [marqueeItems.length])

  // ─── TOP 주식 정렬 로직 ───────────────────────────────────────────────────

  function getSortedStocks(): TopStock[] {
    let pool: TopStock[] = []
    if (marketFilter === "all")    pool = [...topStocks.kr, ...topStocks.us]
    else if (marketFilter === "kr") pool = [...topStocks.kr]
    else                            pool = [...topStocks.us]

    switch (sortKey) {
      case "popular":
        // "전체" 선택 시 KR/US 교차 배치 (KR 1위, US 1위, KR 2위, US 2위...)
        if (marketFilter === "all") {
          const kr = topStocks.kr.slice(0, 5)
          const us = topStocks.us.slice(0, 5)
          return kr.flatMap((k, i) => (us[i] ? [k, us[i]] : [k])).slice(0, 10)
        }
        return pool.slice(0, 10)
      case "trading":
        return [...pool].sort((a, b) => b.tradingValue - a.tradingValue).slice(0, 10)
      case "volume":
        return [...pool].sort((a, b) => b.volume - a.volume).slice(0, 10)
      case "gainers":
        return [...pool].sort((a, b) => b.changeRate - a.changeRate).slice(0, 10)
      case "losers":
        return [...pool].sort((a, b) => a.changeRate - b.changeRate).slice(0, 10)
      default:
        return pool.slice(0, 10)
    }
  }

  const sortedStocks = getSortedStocks()

  // ==========================================================================
  // 렌더
  // ==========================================================================

  return (
    <div className="space-y-4 pb-6">

      {/* ─── 섹션 1: 인기종목 마키 배너 ────────────────────────────────────── */}
      <section>
        <button
          onClick={() => router.push("/assets/search")}
          className="w-full bg-white rounded-[14px] px-4 py-3 flex items-center gap-3 border border-emerald-200 shadow-[0_4px_16px_rgba(16,185,129,0.10)] active:scale-[0.98] transition-all text-left"
        >
          <span className="shrink-0 text-[10px] font-black bg-emerald-500 text-white rounded-full px-2 py-0.5">
            인기종목
          </span>

          <div className="flex-1 min-w-0 overflow-hidden">
            {stocksLoading || marqueeItems.length === 0 ? (
              <span className="text-[13px] font-bold text-slate-300">인기종목 로딩 중...</span>
            ) : (() => {
              const item = marqueeItems[marqueeIdx]
              const rank = marqueeIdx + 1
              const isUp = item.changeRate >= 0
              return (
                <span key={marqueeIdx} className="text-[13px] font-black truncate block animate-in slide-in-from-bottom-2 duration-150">
                  <span className="text-slate-400 mr-1">{rank}.</span>
                  <span className="text-slate-900 mr-2">{item.name}</span>
                  <span className={isUp ? "text-rose-500" : "text-blue-500"}>
                    {isUp ? "▲" : "▼"}{Math.abs(item.changeRate).toFixed(2)}%
                  </span>
                </span>
              )
            })()}
          </div>

          <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
        </button>
      </section>

      {/* ─── 섹션 2: 글로벌 지수 카드 (3×2 가로 스크롤) ───────────────────── */}
      <section>
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 pb-3">
          <div
            className="grid gap-2.5"
            style={{
              gridTemplateRows: "repeat(2, auto)",
              gridAutoFlow: "column",
              gridAutoColumns: "calc((100vw - 72px) / 3)",
            }}
          >
            {indicesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[72px] bg-slate-100 rounded-2xl animate-pulse" />
                ))
              : indices
                  .filter((idx) => !tickerSettings.hiddenSymbols?.includes(idx.symbol))
                  .map((idx) => {
                    const isUp = idx.changeStatus === "up"
                    const displayName = tickerSettings.customNames?.[idx.symbol] ?? INDEX_DISPLAY[idx.symbol] ?? idx.name
                    
                    const displayPrice = idx.symbol === "JPYKRW=X" ? idx.price * 100 : idx.price

                    return (
                      // 💡 변경됨: div에서 Link로 교체하여 클릭 시 /market 페이지로 이동
                      <Link
                        key={idx.symbol}
                        href="/market"
                        className="h-[72px] bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] px-3 flex flex-col justify-center gap-0.5 hover:bg-slate-50 transition-colors active:scale-[0.98] text-left block"
                      >
                        <p className="text-[11px] text-slate-500 truncate">{displayName}</p>
                        <p className="text-[14px] font-black text-slate-900 leading-tight">
                          {displayPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-[11px] font-bold ${
                          isUp ? "text-rose-500" : idx.changeStatus === "down" ? "text-blue-500" : "text-slate-400"
                        }`}>
                          {isUp ? "▲" : idx.changeStatus === "down" ? "▼" : ""}
                          {Math.abs(idx.changeRate).toFixed(2)}%
                        </p>
                      </Link>
                    )
                  })
            }

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="h-[154px] w-[calc((100vw-72px)/6)] min-w-[50px] bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-[0.98]"
              style={{ gridRow: "span 2" }}
            >
              <Settings className="w-5 h-5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-400 leading-tight text-center">지수<br/>설정</span>
            </button>

          </div>
        </div>
      </section>

      {/* ─── 섹션 3: TOP 주식 ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.05)] px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[15px] font-black text-slate-900">실시간 TOP 10</h3>
            {fetchedAt && (
              <p className="text-[10px] font-medium text-slate-400">
                {(() => {
                  const diffMin = Math.floor((Date.now() - fetchedAt.getTime()) / 60000)
                  return diffMin < 1 ? "방금 업데이트" : `${diffMin}분 전 업데이트 · 15분마다 갱신`
                })()}
              </p>
            )}
          </div>
          <div className="bg-slate-100 rounded-[10px] p-0.5 flex gap-0.5">
            {(["all", "kr", "us"] as MarketFilter[]).map((m) => (
              <button
                key={m}
                onClick={() => setMarketFilter(m)}
                className={`text-[11px] font-black px-2.5 py-1 rounded-[8px] transition-colors ${
                  marketFilter === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                {m === "all" ? "전체" : m === "kr" ? "한국" : "미국"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 mb-2">
          <div className="flex gap-4 w-max border-b border-slate-100 pb-0">
            {SORT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSortKey(tab.key)}
                className={`text-[13px] pb-2 shrink-0 transition-colors border-b-2 ${
                  sortKey === tab.key
                    ? "font-black text-slate-900 border-slate-900"
                    : "font-bold text-slate-400 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {stocksLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-4 bg-slate-100 rounded" />
                <div className="w-10 h-10 bg-slate-100 rounded-[12px]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
                <div className="space-y-1.5 items-end flex flex-col">
                  <div className="h-3.5 bg-slate-100 rounded w-14" />
                  <div className="h-3 bg-slate-100 rounded w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : stocksError || sortedStocks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] font-bold text-slate-400">잠시 후 다시 시도해 주세요</p>
          </div>
        ) : (
          <div>
            {sortedStocks.map((stock, idx) => {
              const rank = idx + 1
              const rankColor = RANK_COLORS[rank] ?? "#94A3B8"
              const isUp = stock.changeRate >= 0
              const initial = (stock.displayTicker || stock.ticker).charAt(0).toUpperCase()

              const isKorean = stock.ticker.endsWith(".KS") || stock.ticker.endsWith(".KQ")
              const cleanTicker = isKorean ? stock.ticker.split(".")[0] : stock.ticker
              const logoUrl = `https://static.toss.im/png-icons/securities/icn-sec-fill-${cleanTicker}.png`

              return (
                <Link
                  key={stock.ticker}
                  href={`/assets/stock/${stock.ticker}`}
                  className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 active:bg-slate-50/50 transition-colors"
                >
                  <span
                    className="w-5 text-[13px] font-black text-center shrink-0"
                    style={{ color: rankColor }}
                  >
                    {rank}
                  </span>

                  <div className="relative w-10 h-10 shrink-0 rounded-[12px] overflow-hidden bg-slate-50 flex items-center justify-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                    <img
                      src={logoUrl}
                      alt={stock.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white font-black text-[14px] hidden"
                      style={{ backgroundColor: tickerToColor(stock.ticker) }}
                    >
                      {initial}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pl-1">
                    <p className="text-[14px] font-semibold text-slate-900 truncate">{stock.name}</p>
                    <p className="text-[11px] font-medium text-slate-400">{stock.displayTicker}</p>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-[14px] font-black ${isUp ? "text-rose-500" : "text-blue-500"}`}>
                      {isUp ? "▲" : "▼"} {Math.abs(stock.changeRate).toFixed(2)}%
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {sortKey === "trading"
                        ? stock.currency === "KRW"
                          ? `${Math.round(stock.tradingValue / 1_0000_0000).toLocaleString()}억원`
                          : `$${(stock.tradingValue / 1_000_000).toFixed(0)}M`
                        : sortKey === "volume"
                        ? stock.currency === "KRW"
                          ? `${Math.round(stock.volume / 10000).toLocaleString()}만주`
                          : `${(stock.volume / 1_000_000).toFixed(1)}M주`
                        : stock.currency === "KRW"
                        ? `${Math.round(stock.price).toLocaleString()}원`
                        : `$${stock.price.toFixed(2)}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); toggleWatchlist(stock.ticker, stock.name) }}
                    className="shrink-0 p-0.5 active:scale-90 transition-all"
                  >
                    <Bookmark className={`w-4 h-4 transition-colors ${
                      isWatched(stock.ticker) ? "fill-emerald-500 text-emerald-500" : "text-slate-200"
                    }`} />
                  </button>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ─── 섹션 4: 한 눈에 보기 Treemap ───────────────────────────────────── */}
      <MarketTreemap krStocks={topStocks.kr} usStocks={topStocks.us} />

      {/* ─── 섹션 5: 주제따라 탐색하기 ──────────────────────────────────────── */}
      <ThemeCards />

      {/* 💡 설정 바텀 시트 연동 */}
      <TickerSettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        symbols={Object.keys(INDEX_DISPLAY)}
        settings={tickerSettings}
        onSave={(newSettings) => {
          setTickerSettings(newSettings)
        }}
      />
    </div>
  )
}