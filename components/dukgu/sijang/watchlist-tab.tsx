"use client"

// =============================================================================
// 🔖 [관심] 탭 — 관심 종목 목록
//
// - useWatchlist 훅으로 Supabase DB 연동
// - /api/market/quotes 로 실시간 가격 fetch
// - discover-tab과 동일한 카드 UI
// =============================================================================

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bookmark } from "lucide-react"
import { useWatchlist } from "@/hooks/use-watchlist"

interface WatchlistTabProps { searchQuery: string }

interface Quote {
  ticker:        string
  currentPrice:  number
  changePercent: number
  currency:      string
}

const PALETTE = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#f97316"]

function tickerToColor(ticker: string): string {
  let hash = 0
  for (let i = 0; i < ticker.length; i++) hash = ticker.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function WatchlistTab({ searchQuery }: WatchlistTabProps) {
  const { items, loading, toggle, isWatched } = useWatchlist()

  const [quotes, setQuotes]       = useState<Record<string, Quote>>({})
  const [quotesLoading, setQuotesLoading] = useState(false)

  // 관심 종목 변경 시 실시간 가격 fetch
  useEffect(() => {
    if (items.length === 0) { setQuotes({}); return }
    setQuotesLoading(true)
    const tickers = items.map((i) => i.ticker).join(",")
    fetch(`/api/market/quotes?tickers=${encodeURIComponent(tickers)}`)
      .then((r) => r.json())
      .then((data: Quote[]) => {
        const map: Record<string, Quote> = {}
        data.forEach((q) => { map[q.ticker] = q })
        setQuotes(map)
      })
      .catch(() => {/* 조용히 실패 */})
      .finally(() => setQuotesLoading(false))
  }, [items.length])

  const filtered = items.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─── 로딩 스켈레톤 ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] animate-pulse">
            <div className="w-10 h-10 bg-slate-100 rounded-[12px] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
            <div className="space-y-1.5 flex flex-col items-end">
              <div className="h-3.5 bg-slate-100 rounded w-16" />
              <div className="h-3 bg-slate-100 rounded w-10" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ─── 빈 상태 ──────────────────────────────────────────────────────────────

  if (filtered.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center gap-4">
        <Image src="/place-holder.png" alt="관심 종목 없음" width={80} height={80} className="opacity-40" />
        <div className="text-center space-y-1">
          <p className="text-[14px] font-black text-slate-400">
            {searchQuery ? "검색 결과가 없어요" : "아직 관심 종목이 없어요"}
          </p>
          <p className="text-[12px] font-bold text-slate-300">
            발견 탭에서 종목을 북마크해보세요!
          </p>
        </div>
      </div>
    )
  }

  // ─── 종목 목록 ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {filtered.map((stock) => {
        const q       = quotes[stock.ticker]
        const isKorean = stock.ticker.endsWith(".KS") || stock.ticker.endsWith(".KQ")
        const cleanTicker = isKorean ? stock.ticker.split(".")[0] : stock.ticker
        const logoUrl = `https://static.toss.im/png-icons/securities/icn-sec-fill-${cleanTicker}.png`
        const initial = cleanTicker.charAt(0).toUpperCase()
        const color   = tickerToColor(stock.ticker)

        const price      = q?.currentPrice ?? 0
        const changeRate = q?.changePercent ?? 0
        const currency   = q?.currency ?? (isKorean ? "KRW" : "USD")
        const isUp       = changeRate >= 0

        const priceDisplay = currency === "KRW"
          ? `${Math.round(price).toLocaleString()}원`
          : `$${price.toFixed(2)}`

        return (
          <div
            key={stock.ticker}
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
          >
            <Link
              href={`/assets/stock/${encodeURIComponent(stock.ticker)}`}
              className="flex items-center gap-3 flex-1 min-w-0 active:scale-[0.98]"
            >
              {/* 로고 */}
              <div className="relative w-10 h-10 shrink-0 rounded-[12px] overflow-hidden bg-slate-50 flex items-center justify-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                <img
                  src={logoUrl}
                  alt={stock.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                    e.currentTarget.nextElementSibling?.classList.remove("hidden")
                  }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center text-white font-black text-[14px] hidden"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
              </div>

              {/* 이름 + 티커 */}
              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[14px] font-semibold text-slate-900 truncate">{stock.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isKorean ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {isKorean ? "KR" : "US"}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">{cleanTicker}</p>
              </div>

              {/* 가격 + 등락률 */}
              <div className="flex flex-col items-end shrink-0">
                {quotesLoading && price === 0 ? (
                  <>
                    <div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse mb-1" />
                    <div className="h-3 w-10 bg-slate-100 rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <span className={`text-[14px] font-black ${isUp ? "text-rose-500" : "text-blue-500"}`}>
                      {isUp ? "▲" : "▼"} {Math.abs(changeRate).toFixed(2)}%
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">{priceDisplay}</span>
                  </>
                )}
              </div>
            </Link>

            {/* 북마크 버튼 */}
            <button
              type="button"
              onClick={() => toggle(stock.ticker, stock.name)}
              className="shrink-0 p-1.5 rounded-full transition-all active:scale-90"
            >
              <Bookmark
                className={`w-4 h-4 transition-colors ${
                  isWatched(stock.ticker)
                    ? "fill-emerald-500 text-emerald-500"
                    : "text-slate-200"
                }`}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
