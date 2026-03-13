"use client"

import { useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Download } from "lucide-react"
import { useStockPortfolio } from "@/hooks/use-stock-portfolio"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { useKrStockNames, isTickerAsName } from "@/hooks/use-kr-stock-names"
import { useUser } from "@/context/user-context"

interface HoldingsTabProps { searchQuery: string }

const PALETTE = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#f97316"]

function tickerToColor(ticker: string): string {
  let h = 0
  for (let i = 0; i < ticker.length; i++) h = ticker.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

export function HoldingsTab({ searchQuery }: HoldingsTabProps) {
  const { user } = useUser()
  const usdToKrw = useExchangeRate()
  const { rows, isLoadingPrices } = useStockPortfolio(usdToKrw)
  const krNames = useKrStockNames(rows.map((r) => r.holding.ticker))

  const getDisplayName = (ticker: string, name: string) =>
    isTickerAsName(name, ticker) ? (krNames[ticker] ?? name) : name

  const filtered = rows.filter(({ holding }) =>
    getDisplayName(holding.ticker, holding.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    holding.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const { totalValueKrw, totalInvestedKrw } = useMemo(() => {
    let val = 0, inv = 0
    rows.forEach(({ holding, currentValue, stats }) => {
      const rate = holding.currency === "USD" ? usdToKrw : 1
      val += currentValue * rate
      inv += stats.totalInvested * rate
    })
    return { totalValueKrw: val, totalInvestedKrw: inv }
  }, [rows, usdToKrw])

  const totalPnl     = totalValueKrw - totalInvestedKrw
  const totalPnlRate = totalInvestedKrw > 0 ? (totalPnl / totalInvestedKrw) * 100 : 0
  const isProfit     = totalPnl >= 0

  // ─── 빈 상태 ──────────────────────────────────────────────────────────────
  if (!isLoadingPrices && rows.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center gap-4">
        <Image src="/place-holder.png" alt="보유 종목 없음" width={80} height={80} className="opacity-40" />
        <div className="text-center space-y-1">
          <p className="text-[14px] font-black text-slate-400">보유 종목이 없어요</p>
          <p className="text-[12px] font-bold text-slate-300">포트폴리오에서 종목을 추가해보세요</p>
        </div>
        <Link
          href={user ? "/assets/stocks" : "/login"}
          className="flex items-center gap-1.5 text-[12px] font-black text-white bg-emerald-500 px-5 py-2.5 rounded-full active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> 내 종목 불러오기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* ─── 총 평가 수익 요약 카드 ─────────────────────────────────────────── */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-5">
          <p className="text-[11px] font-medium text-slate-400 mb-3">나의 총 평가 수익</p>

          <p className={`text-[26px] font-black tracking-tight ${isProfit ? "text-emerald-600" : "text-rose-500"}`}>
            {isProfit ? "+" : "-"}{Math.abs(Math.round(totalPnl)).toLocaleString()}원
          </p>

          <div className="flex items-center gap-2 mt-1.5 mb-4">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isProfit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
            }`}>
              {isProfit ? "▲" : "▼"} {Math.abs(totalPnlRate).toFixed(2)}%
            </span>
          </div>

          <div className="border-t border-slate-50 pt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-medium text-slate-400">투자금</p>
              <p className="text-[14px] font-bold text-slate-700 mt-0.5">
                {Math.round(totalInvestedKrw / 10000).toLocaleString()}만원
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400">총 평가금</p>
              <p className="text-[14px] font-bold text-slate-700 mt-0.5">
                {Math.round(totalValueKrw / 10000).toLocaleString()}만원
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 포트폴리오 불러오기 버튼 */}
      <Link
        href={user ? "/assets/stocks" : "/login"}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white border border-emerald-200 text-emerald-600 rounded-2xl text-[12px] font-semibold active:scale-[0.98] transition-all shadow-sm"
      >
        <Download className="w-3.5 h-3.5" /> 포트폴리오 등록하고 불러오기
      </Link>

      {/* 검색 결과 없음 */}
      {filtered.length === 0 && rows.length > 0 ? (
        <div className="py-8 text-center">
          <p className="text-[13px] font-medium text-slate-400">검색 결과가 없어요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ holding, quote, returnRate, stats }) => {
            const isKorean    = holding.ticker.endsWith(".KS") || holding.ticker.endsWith(".KQ")
            const cleanTicker = isKorean ? holding.ticker.split(".")[0] : holding.ticker
            const logoUrl     = `https://static.toss.im/png-icons/securities/icn-sec-fill-${cleanTicker}.png`
            const initial     = cleanTicker.charAt(0).toUpperCase()
            const color       = tickerToColor(holding.ticker)
            const isUp        = returnRate > 0
            const currentPrice = quote?.currentPrice ?? 0
            const displayName = getDisplayName(holding.ticker, holding.name)

            const priceDisplay = holding.currency === "KRW"
              ? `${Math.round(currentPrice).toLocaleString()}원`
              : `$${currentPrice.toFixed(2)}`

            return (
              <Link
                key={holding.ticker}
                href={`/assets/stock/${encodeURIComponent(holding.ticker)}`}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-all group"
              >
                {/* 로고 */}
                <div className="relative w-10 h-10 shrink-0 rounded-[12px] overflow-hidden bg-slate-50 flex items-center justify-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                  <img
                    src={logoUrl}
                    alt={displayName}
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

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    {stats.totalShares}주 · 평균{" "}
                    {holding.currency === "KRW"
                      ? `${Math.round(stats.avgCostPrice).toLocaleString()}원`
                      : `$${stats.avgCostPrice.toFixed(2)}`}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="text-[14px] font-semibold text-slate-900">
                    {isLoadingPrices
                      ? <span className="text-slate-300 animate-pulse text-[13px]">---</span>
                      : priceDisplay}
                  </p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                  }`}>
                    {isUp ? "▲" : "▼"} {Math.abs(returnRate).toFixed(2)}%
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
