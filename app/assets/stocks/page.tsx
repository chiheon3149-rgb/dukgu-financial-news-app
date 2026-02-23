"use client"

import { useState } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Plus, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AddTickerSheet } from "@/components/dukgu/add-ticker-sheet"
import { useStockPortfolio } from "@/hooks/use-stock-portfolio"
import type { StockHolding } from "@/types"

export default function StocksPage() {
  const { rows, isLoadingPrices, priceError, addHolding } = useStockPortfolio()
  const [isTickerSheetOpen, setIsTickerSheetOpen] = useState(false)

  // AddTickerSheet은 ticker/name/currency만 반환 → trades, dividends를 빈 배열로 채워 전달
  const handleAddTicker = (base: Omit<StockHolding, "trades" | "dividends">) => {
    addHolding({ ...base, trades: [], dividends: [] })
  }

  const totalValueKrw = rows.reduce((acc, row) => {
    return acc + (row.holding.currency === "KRW" ? row.currentValue : row.currentValue * 1360)
  }, 0)

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader
        showBack
        title={
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">주식 포트폴리오</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        {/* 총 주식 자산 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/60 rounded-full -mr-8 -mt-8 blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">주식 총 평가금액</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">
            {Math.round(totalValueKrw).toLocaleString("ko-KR")}원
          </p>
          <div className="mt-3">
            {isLoadingPrices ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" /> 시세 불러오는 중...
              </span>
            ) : priceError ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                <AlertCircle className="w-3 h-3" /> {priceError}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                <RefreshCw className="w-3 h-3" /> 30초마다 자동 갱신
              </span>
            )}
          </div>
        </section>

        {/* 종목 리스트 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              보유 종목 ({rows.length})
            </h2>
            <button
              onClick={() => setIsTickerSheetOpen(true)}
              className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
            >
              <Plus className="w-3 h-3" /> 티커 추가
            </button>
          </div>

          <div className="grid gap-3">
            {rows.map(({ holding, quote, currentValue, unrealizedPnl, returnRate }) => {
              const currentPrice = quote?.currentPrice ?? 0
              const isUp = returnRate > 0
              const isDown = returnRate < 0

              return (
                <Link
                  key={holding.ticker}
                  href={`/assets/stocks/${encodeURIComponent(holding.ticker)}`}
                  className="flex items-center justify-between p-5 bg-white rounded-[24px] border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      isUp ? "bg-rose-50" : isDown ? "bg-blue-50" : "bg-slate-50"
                    }`}>
                      {isUp ? (
                        <TrendingUp className="w-5 h-5 text-rose-500" />
                      ) : isDown ? (
                        <TrendingDown className="w-5 h-5 text-blue-500" />
                      ) : (
                        <span className="text-lg font-black text-slate-400">−</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[15px] font-black text-slate-800">{holding.ticker}</p>
                        <span className="text-[9px] font-bold text-slate-300 uppercase">{holding.currency}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 truncate max-w-[120px]">{holding.name}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[14px] font-black text-slate-800">
                      {isLoadingPrices ? (
                        <span className="text-slate-200 animate-pulse">----</span>
                      ) : holding.currency === "KRW"
                        ? `${currentPrice.toLocaleString("ko-KR")}원`
                        : `$${currentPrice.toFixed(2)}`}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        isUp ? "text-rose-500 bg-rose-50" : isDown ? "text-blue-500 bg-blue-50" : "text-slate-400 bg-slate-50"
                      }`}>
                        {returnRate >= 0 ? "+" : ""}{returnRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {rows.length === 0 && (
            <div className="py-16 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">보유 종목이 없습니다</p>
            </div>
          )}
        </section>
      </main>

      <AddTickerSheet
        isOpen={isTickerSheetOpen}
        onClose={() => setIsTickerSheetOpen(false)}
        onAdd={handleAddTicker}
      />
    </div>
  )
}
