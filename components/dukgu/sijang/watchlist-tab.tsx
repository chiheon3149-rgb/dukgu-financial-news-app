"use client"

// =============================================================================
// ❤️ [관심] 탭 - 찜한 주식
//
// 💡 이 컴포넌트는 사용자가 ❤️ 눌러 찜해둔 종목 목록이에요.
//    좋아하는 가수를 팔로우하듯 관심 있는 주식을 한곳에서 볼 수 있어요!
// =============================================================================

import { useState } from "react"
import Link from "next/link"
import { Heart, ChevronRight } from "lucide-react"
import { MOCK_WATCHLIST } from "@/lib/mock/market"

interface WatchlistTabProps {
  searchQuery: string
}

export function WatchlistTab({ searchQuery }: WatchlistTabProps) {
  // 💡 liked: 하트가 켜진 종목 목록 (Set은 중복 없는 목록이에요)
  const [liked, setLiked] = useState<Set<string>>(
    new Set(MOCK_WATCHLIST.map((s) => s.ticker))
  )

  const toggleLike = (ticker: string) => {
    setLiked((prev) => {
      const next = new Set(prev)
      if (next.has(ticker)) next.delete(ticker)
      else next.add(ticker)
      return next
    })
  }

  const filtered = MOCK_WATCHLIST.filter(
    (s) =>
      s.name.includes(searchQuery) ||
      s.ticker.toUpperCase().includes(searchQuery.toUpperCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-5xl">🤍</p>
        <p className="text-[14px] font-black text-slate-500">아직 관심 종목이 없어요</p>
        <p className="text-[12px] font-bold text-slate-400">발견 탭에서 마음에 드는 주식에 ❤️ 눌러보세요!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {filtered.map((stock) => {
        const isUp      = stock.changeRate >= 0
        const isLiked   = liked.has(stock.ticker)
        const priceDisplay = stock.currency === "USD"
          ? `$${stock.currentPrice.toFixed(2)}`
          : `${stock.currentPrice.toLocaleString()}원`

        return (
          <div
            key={stock.ticker}
            className="flex items-center gap-4 bg-white rounded-[20px] px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
          >
            {/* 로고 배지 */}
            <Link href={`/assets/stock/${stock.ticker}`} className="flex items-center gap-4 flex-1 min-w-0 active:scale-[0.98]">
              <div
                className="w-12 h-12 rounded-[16px] flex items-center justify-center text-white font-black text-[14px] shrink-0"
                style={{ backgroundColor: stock.color }}
              >
                {stock.initial}
              </div>

              {/* 종목 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[15px] font-black text-slate-900 truncate">{stock.name}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                    {stock.market}
                  </span>
                </div>
                <p className="text-[12px] font-bold text-slate-400 mt-0.5">{stock.ticker}</p>
              </div>

              {/* 가격 & 등락률 */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p className="text-[15px] font-black text-slate-900">{priceDisplay}</p>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                  isUp ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
                }`}>
                  {isUp ? "▲" : "▼"} {Math.abs(stock.changeRate).toFixed(2)}%
                </span>
              </div>
            </Link>

            {/* 하트 버튼 (클릭해도 페이지 이동 안 함) */}
            <button
              type="button"
              onClick={() => toggleLike(stock.ticker)}
              className="shrink-0 p-1.5 rounded-full transition-all active:scale-90"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isLiked ? "fill-rose-400 text-rose-400" : "text-slate-200"
                }`}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
