"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Plus, RefreshCw, AlertCircle, Loader2, Trash2, Briefcase, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AddTickerSheet } from "@/components/dukgu/add-ticker-sheet"
import { useStockPortfolio } from "@/hooks/use-stock-portfolio"
import { useKrStockNames, isTickerAsName } from "@/hooks/use-kr-stock-names"
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

  const { rows, isLoadingPrices, priceError, addHolding, removeHolding, refresh } = useStockPortfolio(usdToKrw, accountId)
  const krNames = useKrStockNames(rows.map((r) => r.holding.ticker))
  const getDisplayName = (ticker: string, name: string) =>
    isTickerAsName(name, ticker) ? (krNames[ticker] ?? name) : name
  const [isTickerSheetOpen, setIsTickerSheetOpen] = useState(false)

  const handleAddTicker = (base: Omit<StockHolding, "trades" | "dividends" | "accountId">) => {
    addHolding({ ...base, trades: [], dividends: [] })
  }

  const handleManualRefresh = () => {
    if (refresh) {
      refresh()
      toast.success("최신 시세를 불러왔습니다.")
    } else {
      window.location.reload()
    }
  }

  const totalValueKrw = rows.reduce((acc, row) => {
    return acc + (row.holding.currency === "KRW" ? row.currentValue : row.currentValue * usdToKrw)
  }, 0)

  const totalInvestedKrw = rows.reduce((acc, row) => {
    return acc + (row.holding.currency === "KRW" ? row.stats.totalInvested : row.stats.totalInvested * usdToKrw)
  }, 0)
  const totalPnlKrw = totalValueKrw - totalInvestedKrw
  const totalReturnRate = totalInvestedKrw > 0 ? (totalPnlKrw / totalInvestedKrw) * 100 : 0
  const isAccountUp = totalPnlKrw > 0
  const isAccountDown = totalPnlKrw < 0

  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-20">
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
        {/* 🏆 요약 카드 */}
        <div>
          <section className="bg-white rounded-[28px] shadow-[0_2px_10px_rgba(0,0,0,0.07)] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/60 rounded-full -mr-8 -mt-8 blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">계좌 총 평가금액</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter truncate">
                  {formatCurrency(totalValueKrw, "KRW")}
                </p>
                {totalInvestedKrw > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[13px] font-black ${isAccountUp ? "text-rose-500" : isAccountDown ? "text-blue-500" : "text-slate-400"}`}>
                      {totalPnlKrw >= 0 ? "+" : ""}{formatCurrency(totalPnlKrw, "KRW")}
                    </span>
                    <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${isAccountUp ? "bg-rose-50 text-rose-500" : isAccountDown ? "bg-blue-50 text-blue-500" : "bg-slate-50 text-slate-400"}`}>
                      {totalReturnRate >= 0 ? "+" : ""}{totalReturnRate.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleManualRefresh}
                disabled={isLoadingPrices}
                className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all active:scale-90 disabled:opacity-50 shrink-0"
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
          
          <p className="text-[10px] font-bold text-slate-400 px-2 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            * 환전에 따른 증감은 표시되지 않습니다.
          </p>
        </div>

        {/* 📋 종목 리스트 섹션 */}
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
            {rows.map(({ holding, quote, returnRate, stats, currentValue }) => {
              const currentPrice = quote?.currentPrice ?? 0
              const pnlAmount = currentValue - stats.totalInvested
              const isUp = returnRate > 0
              const isDown = returnRate < 0

              const isKorean = holding.ticker.endsWith(".KS") || holding.ticker.endsWith(".KQ")
              const cleanTicker = isKorean ? holding.ticker.split(".")[0] : holding.ticker
              const logoUrl = `https://static.toss.im/png-icons/securities/icn-sec-fill-${cleanTicker}.png`
              const PALETTE = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#f97316"]
              let hash = 0
              for (let i = 0; i < holding.ticker.length; i++) hash = holding.ticker.charCodeAt(i) + ((hash << 5) - hash)
              const color = PALETTE[Math.abs(hash) % PALETTE.length]
              const initial = cleanTicker.charAt(0).toUpperCase()
              const displayName = getDisplayName(holding.ticker, holding.name)

              return (
                <div key={holding.ticker} className="flex items-center p-4 bg-white rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.07)] min-w-0 group">
                  <Link
                    href={`/assets/stocks/${accountId}/${encodeURIComponent(holding.ticker)}`}
                    className="flex-1 flex items-center gap-3 min-w-0 pr-3"
                  >
                    <div className="relative w-11 h-11 shrink-0 rounded-[14px] overflow-hidden bg-slate-50 flex items-center justify-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                      <img
                        src={logoUrl}
                        alt={holding.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center text-white font-bold text-[14px] hidden"
                        style={{ backgroundColor: color }}
                      >
                        {initial}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[15px] font-semibold text-slate-800 truncate">{displayName}</p>
                        <span className="text-[9px] font-medium text-slate-400 uppercase shrink-0 px-1 bg-slate-50 rounded-md">{holding.currency}</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 truncate">{cleanTicker}</p>
                    </div>

                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      {/* 현재 주가 */}
                      <p className="text-[13px] font-semibold text-slate-800 whitespace-nowrap">
                        {isLoadingPrices ? <span className="text-slate-200 animate-pulse">----</span> : formatCurrency(currentPrice, holding.currency)}
                      </p>

                      {/* 증감 금액 */}
                      <p className={`text-[11px] font-medium tracking-tight whitespace-nowrap ${isUp ? "text-rose-500" : isDown ? "text-blue-500" : "text-slate-400"}`}>
                        {pnlAmount > 0 ? "+" : ""}{formatCurrency(pnlAmount, holding.currency)}
                      </p>

                      {/* 증감 퍼센트 */}
                      <div className={`mt-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap ${isUp ? "text-rose-500 bg-rose-50" : isDown ? "text-blue-500 bg-blue-50" : "text-slate-400 bg-slate-50"}`}>
                        {returnRate > 0 ? "+" : ""}{returnRate.toFixed(2)}%
                      </div>
                    </div>
                  </Link>

                  {/* 삭제 버튼 */}
                  <div className="shrink-0 pl-2 border-l border-slate-50">
                    <button
                      onClick={() => {
                        toast(`${displayName} 종목을 삭제하시겠습니까?`, {
                          action: { label: "삭제", onClick: () => removeHolding(holding.ticker) },
                          cancel: { label: "취소", onClick: () => {} },
                        })
                      }}
                      className="p-2 text-slate-300 hover:text-rose-400 active:scale-90 transition-all rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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