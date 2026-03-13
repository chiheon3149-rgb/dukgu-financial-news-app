"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { MOCK_HOLDINGS } from "@/lib/mock/market"

interface HoldingsTabProps { searchQuery: string }

export function HoldingsTab({ searchQuery }: HoldingsTabProps) {
  const filtered = MOCK_HOLDINGS.filter(
    (s) => s.name.includes(searchQuery) || s.ticker.toUpperCase().includes(searchQuery.toUpperCase())
  )

  const totalInvested = MOCK_HOLDINGS.reduce((acc, s) => acc + s.avgPrice * s.quantity * (s.currency === "USD" ? 1350 : 1), 0)
  const totalCurrent  = MOCK_HOLDINGS.reduce((acc, s) => acc + s.currentPrice * s.quantity * (s.currency === "USD" ? 1350 : 1), 0)
  const totalPnl      = totalCurrent - totalInvested
  const totalPnlRate  = (totalPnl / totalInvested) * 100
  const isProfit      = totalPnl >= 0

  return (
    <div className="space-y-3">

      {/* 총 수익률 요약 */}
      <div className={`rounded-2xl p-5 border ${isProfit ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
        <p className="text-[11px] font-bold text-slate-500 mb-1">총 평가 수익</p>
        <p className={`text-[22px] font-black ${isProfit ? "text-emerald-600" : "text-rose-500"}`}>
          {isProfit ? "+" : "-"}{Math.abs(Math.round(totalPnl)).toLocaleString()}원
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${isProfit ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
            {isProfit ? "▲" : "▼"} {Math.abs(totalPnlRate).toFixed(2)}%
          </span>
          <span className="text-[11px] font-bold text-slate-400">투자원금 {Math.round(totalInvested / 10000).toLocaleString()}만원</span>
        </div>
      </div>

      {/* 보유 종목 리스트 */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="text-[13px] font-bold text-slate-400">검색 결과가 없어요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((stock) => {
            const pnlRate      = ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100
            const isUp         = pnlRate >= 0
            const priceDisplay = stock.currency === "USD" ? `$${stock.currentPrice.toFixed(2)}` : `${stock.currentPrice.toLocaleString()}원`

            return (
              <Link
                key={stock.ticker}
                href={`/assets/stock/${stock.ticker}`}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white font-black text-[13px] shrink-0"
                  style={{ backgroundColor: stock.color }}
                >
                  {stock.initial}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-black text-slate-900 truncate">{stock.name}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 shrink-0">{stock.market}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                    {stock.quantity}주 · 평균 {stock.currency === "USD" ? `$${stock.avgPrice}` : `${stock.avgPrice.toLocaleString()}원`}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="text-[14px] font-black text-slate-900">{priceDisplay}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isUp ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"}`}>
                    {isUp ? "▲" : "▼"} {Math.abs(pnlRate).toFixed(2)}%
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-emerald-400 transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
