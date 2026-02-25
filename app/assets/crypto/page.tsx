"use client"

import { useState } from "react"
import Link from "next/link"
import { Bitcoin, TrendingUp, TrendingDown, Plus, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AddCryptoSheet } from "@/components/dukgu/add-crypto-sheet"
import { useCryptoPortfolio } from "@/hooks/use-crypto-portfolio"
import { useExchangeRate } from "@/hooks/use-exchange-rate"

const COIN_EMOJI: Record<string, string> = {
  "BTC-USD": "₿", "ETH-USD": "Ξ", "XRP-USD": "✕", "SOL-USD": "◎",
  "ADA-USD": "₳", "DOGE-USD": "Ð", "BNB-USD": "B", "AVAX-USD": "A",
}

export default function CryptoPage() {
  const usdToKrw = useExchangeRate()
  const { rows, totalValueUsd, isLoadingPrices, priceError, addHolding } = useCryptoPortfolio()
  const [isCryptoSheetOpen, setIsCryptoSheetOpen] = useState(false)
  const totalValueKrw = Math.round(totalValueUsd * usdToKrw)

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader showBack title={
        <div className="flex items-center gap-2">
          <Bitcoin className="w-5 h-5 text-amber-500" />
          <span className="text-lg font-black text-slate-900 tracking-tight">코인 포트폴리오</span>
        </div>
      } />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        {/* 총 코인 자산 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/60 rounded-full -mr-8 -mt-8 blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">코인 총 평가금액</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">
            {totalValueKrw.toLocaleString("ko-KR")}원
          </p>
          <p className="text-[12px] font-bold text-slate-400 mt-1">
            ≈ ${totalValueUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                <RefreshCw className="w-3 h-3" /> 30초마다 자동 갱신
              </span>
            )}
          </div>
        </section>

        {/* 코인 목록 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
              보유 코인 ({rows.length})
            </h2>
            <button
              onClick={() => setIsCryptoSheetOpen(true)}
              className="text-[11px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
            >
              <Plus className="w-3 h-3" /> 코인 추가
            </button>
          </div>

          <div className="grid gap-3">
            {rows.map(({ holding, quote, currentValueUsd, returnRate }) => {
              const currentPrice = quote?.currentPrice ?? 0
              const isUp = returnRate > 0
              const isDown = returnRate < 0
              const coinEmoji = COIN_EMOJI[holding.symbol] ?? "🪙"

              return (
                <Link
                  key={holding.symbol}
                  href={`/assets/crypto/${encodeURIComponent(holding.symbol)}`}
                  className="flex items-center justify-between p-5 bg-white rounded-[24px] border border-slate-100 shadow-sm hover:border-amber-200 hover:shadow-md transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black ${
                      isUp ? "bg-rose-50 text-rose-500" : isDown ? "bg-blue-50 text-blue-500" : "bg-amber-50 text-amber-500"
                    }`}>
                      {coinEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[15px] font-black text-slate-800">{holding.unit}</p>
                        <span className="text-[9px] font-bold text-slate-300 uppercase">USD</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400">{holding.name}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[14px] font-black text-slate-800">
                      {isLoadingPrices
                        ? <span className="text-slate-200 animate-pulse">----</span>
                        : `$${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </p>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md inline-block ${
                      isUp ? "text-rose-500 bg-rose-50" : isDown ? "text-blue-500 bg-blue-50" : "text-slate-400 bg-slate-50"
                    }`}>
                      {returnRate >= 0 ? "+" : ""}{returnRate.toFixed(2)}%
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          {rows.length === 0 && (
            <div className="py-16 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
              <Bitcoin className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">보유 코인이 없습니다</p>
              <p className="text-[12px] font-bold mt-1">위의 코인 추가 버튼을 눌러 시작하세요</p>
            </div>
          )}
        </section>
      </main>

      <AddCryptoSheet
        isOpen={isCryptoSheetOpen}
        onClose={() => setIsCryptoSheetOpen(false)}
        onAdd={addHolding}
      />
    </div>
  )
}
