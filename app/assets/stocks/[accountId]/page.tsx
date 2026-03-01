"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Plus, RefreshCw, AlertCircle, Loader2, Trash2, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AddTickerSheet } from "@/components/dukgu/add-ticker-sheet"
import { useStockPortfolio } from "@/hooks/use-stock-portfolio"
import type { StockHolding } from "@/types"

function getAccountName(accountId: string) {
  if (typeof window === "undefined") return "주식 계좌"
  try {
    const raw = localStorage.getItem("dukgu:stock-accounts")
    if (raw) {
      const accounts = JSON.parse(raw)
      const acc = accounts.find((a: any) => a.id === accountId)
      return acc ? acc.name : "주식 계좌"
    }
  } catch {}
  return "주식 계좌"
}

function formatCurrency(value: number, currency: "KRW" | "USD") {
  if (currency === "KRW") {
    return `${Math.round(value).toLocaleString("ko-KR")}원`
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params)
  const [accountName, setAccountName] = useState("주식 계좌")

  useEffect(() => {
    setAccountName(getAccountName(accountId))
  }, [accountId])

  const usdToKrw = useExchangeRate()
  
  // 💡 [기획 포인트] refresh 기능을 훅에서 꺼내옵니다. (훅에 refresh가 구현되어 있다고 가정)
  const { rows, isLoadingPrices, priceError, addHolding, removeHolding, refresh } = useStockPortfolio(usdToKrw, accountId)
  const [isTickerSheetOpen, setIsTickerSheetOpen] = useState(false)

  const handleAddTicker = (base: Omit<StockHolding, "trades" | "dividends" | "accountId">) => {
    addHolding({ ...base, trades: [], dividends: [] })
  }

  const handleManualRefresh = () => {
    if (refresh) {
      refresh()
      toast.success("최신 시세를 불러왔습니다.")
    } else {
      // 훅에 refresh가 없다면 페이지 전체를 가볍게 새로고침합니다.
      window.location.reload()
    }
  }

  const totalValueKrw = rows.reduce((acc, row) => {
    return acc + (row.holding.currency === "KRW" ? row.currentValue : row.currentValue * usdToKrw)
  }, 0)

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader
        showBack
        title={
          <div className="flex items-center gap-2 min-w-0">
            <Briefcase className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-lg font-black text-slate-900 tracking-tight truncate">{accountName}</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        {/* 요약 카드 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/60 rounded-full -mr-8 -mt-8 blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">계좌 총 평가금액</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter truncate">
                {formatCurrency(totalValueKrw, "KRW")}
              </p>
            </div>
            
            {/* 💡 [수정] 수동 새로고침 버튼 추가 */}
            <button 
              onClick={handleManualRefresh}
              disabled={isLoadingPrices}
              className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all active:scale-90 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingPrices ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="mt-4">
            {isLoadingPrices ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" /> 시세 실시간 동기화 중...
              </span>
            ) : priceError ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 truncate">
                <AlertCircle className="w-3 h-3 shrink-0" /> {priceError}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                <RefreshCw className="w-3 h-3 shrink-0" /> 30초마다 자동 갱신 중
              </span>
            )}
          </div>
        </section>

        {/* 종목 리스트 섹션 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              보유 종목 ({rows.length})
            </h2>
            <button
              onClick={() => setIsTickerSheetOpen(true)}
              className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3 h-3" /> 티커 추가
            </button>
          </div>

          <div className="grid gap-3">
            {rows.map(({ holding, quote, returnRate }) => {
              const currentPrice = quote?.currentPrice ?? 0
              const isUp = returnRate > 0
              const isDown = returnRate < 0

              return (
                <div key={holding.ticker} className="flex items-center gap-2 group">
                  <Link
                    href={`/assets/stocks/${accountId}/${encodeURIComponent(holding.ticker)}`}
                    className="flex-1 flex items-center justify-between p-5 bg-white rounded-[24px] border border-slate-100 shadow-sm active:scale-[0.98] min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isUp ? "bg-rose-50" : isDown ? "bg-blue-50" : "bg-slate-50"}`}>
                        {isUp ? <TrendingUp className="w-5 h-5 text-rose-500" /> : isDown ? <TrendingDown className="w-5 h-5 text-blue-500" /> : <span className="text-lg font-black text-slate-400">−</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[15px] font-black text-slate-800 truncate">{holding.ticker}</p>
                          <span className="text-[9px] font-bold text-slate-300 uppercase shrink-0">{holding.currency}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 truncate">{holding.name}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-black text-slate-800 whitespace-nowrap">
                        {isLoadingPrices ? <span className="text-slate-200 animate-pulse">----</span> : formatCurrency(currentPrice, holding.currency)}
                      </p>
                      <div className="flex justify-end mt-0.5">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap ${isUp ? "text-rose-500 bg-rose-50" : isDown ? "text-blue-500 bg-blue-50" : "text-slate-400 bg-slate-50"}`}>
                          {returnRate >= 0 ? "+" : ""}{returnRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      toast(`${holding.ticker} 종목을 삭제하시겠습니까?`, {
                        action: { label: "삭제", onClick: () => removeHolding(holding.ticker) },
                        cancel: { label: "취소", onClick: () => {} },
                      })
                    }}
                    className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-300 active:bg-rose-50 active:text-rose-400 transition-all shadow-sm shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )
            })}
          </div>

          {rows.length === 0 && (
            <div className="py-16 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">이 계좌에 보유 종목이 없습니다</p>
              <p className="text-[11px] font-bold mt-1 text-slate-400">티커 추가 버튼을 눌러 시작하세요.</p>
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