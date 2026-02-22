"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import {
  TrendingUp, TrendingDown, Plus, Trash2,
  ChevronDown, AlertCircle, Loader2, Gift
} from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { TradeChart } from "@/components/dukgu/trade-chart"
import { AddTradeSheet } from "@/components/dukgu/add-trade-sheet"
import { useStockDetail } from "@/hooks/use-stock-detail"

// =============================================================================
// 🔍 /assets/stocks/[ticker] — 종목 상세 페이지
//
// 레이아웃 구조:
//   1. 헤더 요약 카드 (현재가, 평단가, 평가손익, 수익률)
//   2. 매매 차트 (평단가 추이 + 매수/매도 포인트 + 현재가 기준선)
//   3. 매매 내역 테이블 (추가/삭제 가능, 10개씩 더보기)
//   4. 배당 수령 내역
// =============================================================================

const PAGE_SIZE = 10

function StatBadge({ label, value, highlight }: {
  label: string
  value: string
  highlight?: "up" | "down" | "neutral"
}) {
  const colorClass =
    highlight === "up" ? "text-rose-500" :
    highlight === "down" ? "text-blue-500" :
    "text-slate-700"

  return (
    <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-3 gap-0.5">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-[13px] font-black ${colorClass}`}>{value}</span>
    </div>
  )
}

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const decodedTicker = decodeURIComponent(ticker)

  const { holding, stats, quote, chartData, isLoadingPrice, addTrade, removeTrade } =
    useStockDetail(decodedTicker)

  const [isTradeSheetOpen, setIsTradeSheetOpen] = useState(false)
  const [tradeDisplayCount, setTradeDisplayCount] = useState(PAGE_SIZE)
  const [isDividendOpen, setIsDividendOpen] = useState(false)

  // 매매 내역: 최신순 정렬 후 페이지네이션
  const sortedTrades = useMemo(
    () => [...(holding?.trades ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [holding?.trades]
  )
  const visibleTrades = sortedTrades.slice(0, tradeDisplayCount)
  const hasMoreTrades = sortedTrades.length > tradeDisplayCount

  if (!holding) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-bold text-slate-400">종목을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const { currency } = holding
  const currentPrice = quote?.currentPrice ?? 0
  const avgCost = stats?.avgCostPrice ?? 0
  const totalShares = stats?.totalShares ?? 0
  const unrealizedPnl = (currentPrice - avgCost) * totalShares
  const returnRate = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0
  const isUp = returnRate > 0
  const isDown = returnRate < 0

  const fmt = (v: number) =>
    currency === "KRW"
      ? `${Math.round(v).toLocaleString("ko-KR")}원`
      : `$${v.toFixed(2)}`

  const fmtSigned = (v: number) =>
    `${v >= 0 ? "+" : ""}${fmt(v)}`

  // 총 배당 수령액 계산
  const totalDividend = holding.dividends.reduce(
    (acc, d) => acc + d.amountPerShare * d.sharesHeld, 0
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader
        showBack
        title={
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-slate-900">{decodedTicker}</span>
            <span className="text-[11px] font-bold text-slate-400">{holding.name}</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">

        {/* ── 1. 헤더 요약 카드 ── */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl" />

          <div className="relative z-10">
            {/* 현재가 */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">현재가</p>
                {isLoadingPrice ? (
                  <p className="text-3xl font-black text-slate-200 animate-pulse">----</p>
                ) : (
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{fmt(currentPrice)}</p>
                )}
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black ${
                isUp ? "bg-rose-50 text-rose-500" : isDown ? "bg-blue-50 text-blue-500" : "bg-slate-50 text-slate-400"
              }`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                {isLoadingPrice ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  `${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(2)}%`
                )}
              </div>
            </div>

            {/* 4개 통계 그리드 */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <StatBadge label="평단가" value={fmt(avgCost)} />
              <StatBadge label="보유수량" value={`${totalShares}주`} />
              <StatBadge
                label="평가손익"
                value={fmtSigned(unrealizedPnl)}
                highlight={isUp ? "up" : isDown ? "down" : "neutral"}
              />
              <StatBadge
                label="실현손익"
                value={fmtSigned(stats?.realizedPnl ?? 0)}
                highlight={(stats?.realizedPnl ?? 0) > 0 ? "up" : (stats?.realizedPnl ?? 0) < 0 ? "down" : "neutral"}
              />
            </div>

            {/* 시세 갱신 상태 */}
            <div className="mt-3 flex items-center gap-1.5">
              {isLoadingPrice ? (
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> 시세 조회 중...
                </span>
              ) : quote ? (
                <span className="text-[9px] font-bold text-emerald-500">
                  ● Live · 30초 갱신
                </span>
              ) : (
                <span className="text-[9px] font-bold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 시세 조회 실패 — 수동 확인 필요
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. 매매 차트 ── */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 space-y-3">
          <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            평단가 추이
          </h3>
          <TradeChart
            data={chartData}
            currentPrice={currentPrice || undefined}
            currency={currency}
          />
        </section>

        {/* ── 3. 매매 내역 ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              매매 내역 ({sortedTrades.length}건)
            </h3>
            <button
              onClick={() => setIsTradeSheetOpen(true)}
              className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
            >
              <Plus className="w-3 h-3" /> 내역 추가
            </button>
          </div>

          <div className="grid gap-2.5">
            {visibleTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between px-4 py-3.5 bg-white rounded-[20px] border border-slate-100 shadow-sm group"
              >
                {/* 매수/매도 뱃지 */}
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                    trade.type === "buy"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}>
                    {trade.type === "buy" ? "▲ 매수" : "▼ 매도"}
                  </span>
                  <div>
                    <p className="text-[12px] font-black text-slate-800">
                      {fmt(trade.price)} × {trade.quantity}주
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-slate-400">
                        {trade.date.replace(/-/g, ".")}
                      </p>
                      {trade.memo && (
                        <p className="text-[9px] font-bold text-slate-300 truncate max-w-[100px]">
                          {trade.memo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 금액 + 삭제 */}
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-black text-slate-700">
                    {fmt(trade.price * trade.quantity)}
                  </p>
                  <button
                    onClick={() => removeTrade(trade.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {hasMoreTrades && (
              <button
                onClick={() => setTradeDisplayCount((n) => n + PAGE_SIZE)}
                className="w-full py-3.5 flex items-center justify-center gap-2 bg-slate-100/50 hover:bg-slate-100 text-slate-500 rounded-[18px] transition-all active:scale-95"
              >
                <span className="text-[12px] font-black">이전 내역 더 보기</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {sortedTrades.length === 0 && (
              <div className="py-12 text-center text-slate-300 bg-white rounded-[20px] border border-dashed border-slate-200">
                <p className="text-sm font-bold">매매 내역이 없습니다</p>
              </div>
            )}
          </div>
        </section>

        {/* ── 4. 배당 내역 (아코디언) ── */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setIsDividendOpen((v) => !v)}
            className="w-full flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500" />
              <span className="text-[14px] font-black text-slate-800">
                배당 내역 ({holding.dividends.length}건)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-amber-500">
                총 {fmt(totalDividend)} 수령
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDividendOpen ? "rotate-180" : ""}`} />
            </div>
          </button>

          {isDividendOpen && (
            <div className="px-5 pb-5 space-y-2 border-t border-slate-50">
              {holding.dividends.length === 0 ? (
                <p className="py-6 text-center text-[12px] font-bold text-slate-300">
                  배당 내역이 없습니다
                </p>
              ) : (
                [...holding.dividends]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((div) => (
                    <div
                      key={div.id}
                      className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <p className="text-[12px] font-black text-slate-700">
                          주당 {div.currency === "KRW"
                            ? `${div.amountPerShare.toLocaleString("ko-KR")}원`
                            : `$${div.amountPerShare.toFixed(4)}`}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {div.date.replace(/-/g, ".")} · {div.sharesHeld}주 보유
                        </p>
                      </div>
                      <p className="text-[13px] font-black text-amber-500">
                        {div.currency === "KRW"
                          ? `+${(div.amountPerShare * div.sharesHeld).toLocaleString("ko-KR")}원`
                          : `+$${(div.amountPerShare * div.sharesHeld).toFixed(2)}`}
                      </p>
                    </div>
                  ))
              )}
            </div>
          )}
        </section>

      </main>

      {/* 매매 추가 바텀 시트 */}
      <AddTradeSheet
        isOpen={isTradeSheetOpen}
        currency={currency}
        onClose={() => setIsTradeSheetOpen(false)}
        onSubmit={addTrade}
      />
    </div>
  )
}
