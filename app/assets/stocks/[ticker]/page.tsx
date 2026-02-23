"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import {
  TrendingUp, TrendingDown, Plus, Trash2,
  ChevronDown, AlertCircle, Loader2, Gift, BarChart2
} from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { TradeChart } from "@/components/dukgu/trade-chart"
import { AddTradeSheet } from "@/components/dukgu/add-trade-sheet"
import { useStockDetail } from "@/hooks/use-stock-detail"

// =============================================================================
// 🔍 /assets/stocks/[ticker] — 종목 상세 페이지
//
// 1. 요약 카드 (현재가, 평단가, 수익률)
// 2. 평단가 추이 차트 + 기간 선택 (1주/1달/전체)
// 3. 탭: 매매내역 | 배당내역
// 4. 배당내역 탭에서 직접 배당금 입력 가능
// =============================================================================

const PAGE_SIZE = 10

type PeriodKey = "1W" | "1M" | "ALL"
type TabKey = "trades" | "dividends"

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1W", label: "1주" },
  { key: "1M", label: "1달" },
  { key: "ALL", label: "전체" },
]

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

  const { holding, stats, quote, chartData, isLoadingPrice, addTrade, removeTrade, addDividend, removeDividend } =
    useStockDetail(decodedTicker)

  const [isTradeSheetOpen, setIsTradeSheetOpen] = useState(false)
  const [tradeDisplayCount, setTradeDisplayCount] = useState(PAGE_SIZE)
  const [activeTab, setActiveTab] = useState<TabKey>("trades")
  const [period, setPeriod] = useState<PeriodKey>("ALL")

  // 배당 입력 폼 상태
  const [showDivForm, setShowDivForm] = useState(false)
  const [divForm, setDivForm] = useState({
    date: new Date().toISOString().split("T")[0],
    sharesHeld: "",
    totalAmount: "",
  })

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

  const fmtSigned = (v: number) => `${v >= 0 ? "+" : ""}${fmt(v)}`

  // --- 기간 필터링 ---
  const periodFilteredChartData = useMemo(() => {
    if (period === "ALL") return chartData
    const now = new Date()
    const cutoff = new Date(now)
    if (period === "1W") cutoff.setDate(cutoff.getDate() - 7)
    else if (period === "1M") cutoff.setMonth(cutoff.getMonth() - 1)
    return chartData.filter((d) => new Date(d.date) >= cutoff)
  }, [chartData, period])

  // --- 매매 내역 ---
  const sortedTrades = useMemo(
    () => [...(holding?.trades ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [holding?.trades]
  )
  const visibleTrades = sortedTrades.slice(0, tradeDisplayCount)

  // --- 배당 내역 ---
  const sortedDividends = useMemo(
    () => [...(holding?.dividends ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [holding?.dividends]
  )

  // 총 배당 수령액
  const totalDividend = holding.dividends.reduce(
    (acc, d) => acc + d.amountPerShare * d.sharesHeld, 0
  )

  // 월 분배율 계산 (최근 12개월 배당금 합산 / 평균 투자금 * 100 / 12)
  const monthlyYield = useMemo(() => {
    if (holding.dividends.length === 0 || stats?.totalInvested === 0) return 0
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 1)
    const recent12MonthsTotal = holding.dividends
      .filter((d) => new Date(d.date) >= cutoff)
      .reduce((acc, d) => acc + d.amountPerShare * d.sharesHeld, 0)
    const invested = stats?.totalInvested ?? 0
    if (invested === 0) return 0
    return (recent12MonthsTotal / invested) * 100 / 12
  }, [holding.dividends, stats])

  // 배당 추가 처리
  const handleAddDividend = () => {
    const shares = parseFloat(divForm.sharesHeld)
    const total = parseFloat(divForm.totalAmount)
    if (!divForm.date || isNaN(shares) || isNaN(total) || shares <= 0 || total <= 0) return
    const amountPerShare = total / shares
    addDividend({
      date: divForm.date,
      sharesHeld: shares,
      amountPerShare,
      currency,
    })
    setShowDivForm(false)
    setDivForm({ date: new Date().toISOString().split("T")[0], sharesHeld: "", totalAmount: "" })
  }

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

        {/* ── 1. 요약 카드 ── */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl" />

          <div className="relative z-10">
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
                {isLoadingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : `${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(2)}%`}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              <StatBadge label="평단가" value={fmt(avgCost)} />
              <StatBadge label="보유수량" value={`${totalShares}주`} />
              <StatBadge label="평가손익" value={fmtSigned(unrealizedPnl)} highlight={isUp ? "up" : isDown ? "down" : "neutral"} />
              <StatBadge label="실현손익" value={fmtSigned(stats?.realizedPnl ?? 0)} highlight={(stats?.realizedPnl ?? 0) > 0 ? "up" : (stats?.realizedPnl ?? 0) < 0 ? "down" : "neutral"} />
            </div>

            <div className="mt-3">
              {isLoadingPrice ? (
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> 시세 조회 중...
                </span>
              ) : quote ? (
                <span className="text-[9px] font-bold text-emerald-500">● Live · 30초 갱신</span>
              ) : (
                <span className="text-[9px] font-bold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 시세 조회 실패
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. 평단가 추이 차트 + 기간 선택 ── */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              평단가 추이
            </h3>
            {/* 기간 선택 버튼 */}
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100">
              {PERIODS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all ${
                    period === key
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <TradeChart
            data={periodFilteredChartData}
            currentPrice={currentPrice || undefined}
            currency={currency}
          />
        </section>

        {/* ── 3. 탭: 매매내역 | 배당내역 ── */}
        <section className="space-y-4">
          {/* 탭 헤더 */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100">
              <button
                onClick={() => setActiveTab("trades")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-black transition-all ${
                  activeTab === "trades"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                매매내역 <span className="text-[10px]">({sortedTrades.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("dividends")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-black transition-all ${
                  activeTab === "dividends"
                    ? "bg-white text-amber-500 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                배당내역 <span className="text-[10px]">({sortedDividends.length})</span>
              </button>
            </div>

            {/* 내역 추가 버튼 */}
            {activeTab === "trades" && (
              <button
                onClick={() => setIsTradeSheetOpen(true)}
                className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
              >
                <Plus className="w-3 h-3" /> 매수/매도
              </button>
            )}
            {activeTab === "dividends" && (
              <button
                onClick={() => setShowDivForm((v) => !v)}
                className="text-[11px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
              >
                <Plus className="w-3 h-3" /> 배당 입력
              </button>
            )}
          </div>

          {/* 매매 내역 탭 */}
          {activeTab === "trades" && (
            <div className="grid gap-2.5">
              {visibleTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between px-4 py-3.5 bg-white rounded-[20px] border border-slate-100 shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                      trade.type === "buy" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}>
                      {trade.type === "buy" ? "▲ 매수" : "▼ 매도"}
                    </span>
                    <div>
                      <p className="text-[12px] font-black text-slate-800">
                        {fmt(trade.price)} × {trade.quantity}주
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-slate-400">{trade.date.replace(/-/g, ".")}</p>
                        {trade.memo && (
                          <p className="text-[9px] font-bold text-slate-300 truncate max-w-[100px]">{trade.memo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-black text-slate-700">{fmt(trade.price * trade.quantity)}</p>
                    <button
                      onClick={() => removeTrade(trade.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {sortedTrades.length > tradeDisplayCount && (
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
          )}

          {/* 배당 내역 탭 */}
          {activeTab === "dividends" && (
            <div className="space-y-3">
              {/* 배당 통계 요약 */}
              {holding.dividends.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-amber-50 rounded-[20px] p-4 border border-amber-100">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">총 배당 수령</p>
                    <p className="text-[16px] font-black text-amber-700">{fmt(totalDividend)}</p>
                  </div>
                  <div className="bg-amber-50 rounded-[20px] p-4 border border-amber-100">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">월 분배율 (12개월)</p>
                    <p className="text-[16px] font-black text-amber-700">{monthlyYield.toFixed(3)}%</p>
                  </div>
                </div>
              )}

              {/* 배당 입력 폼 */}
              {showDivForm && (
                <div className="bg-white rounded-[24px] border border-amber-100 shadow-sm p-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "배당 수령일", key: "date" as const, type: "date", placeholder: "" },
                      { label: "보유 주수", key: "sharesHeld" as const, type: "number", placeholder: "100" },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">{label}</label>
                        <input
                          type={type}
                          value={divForm[key]}
                          placeholder={placeholder}
                          onChange={(e) => setDivForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                      총 배당금 합계 ({currency})
                    </label>
                    <input
                      type="number"
                      value={divForm.totalAmount}
                      placeholder={currency === "KRW" ? "예: 36100" : "예: 12.50"}
                      onChange={(e) => setDivForm((f) => ({ ...f, totalAmount: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                    />
                  </div>
                  {divForm.sharesHeld && divForm.totalAmount && (
                    <div className="px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-[11px] font-bold text-amber-600">
                        주당 {fmt(parseFloat(divForm.totalAmount) / parseFloat(divForm.sharesHeld))}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleAddDividend}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl text-[13px] font-black transition-all active:scale-95"
                  >
                    배당 추가
                  </button>
                </div>
              )}

              {/* 배당 내역 리스트 */}
              <div className="grid gap-2.5">
                {sortedDividends.map((div) => (
                  <div
                    key={div.id}
                    className="flex items-center justify-between px-4 py-3.5 bg-white rounded-[20px] border border-slate-100 shadow-sm group"
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
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-black text-amber-500">
                        {div.currency === "KRW"
                          ? `+${(div.amountPerShare * div.sharesHeld).toLocaleString("ko-KR")}원`
                          : `+$${(div.amountPerShare * div.sharesHeld).toFixed(2)}`}
                      </p>
                      <button
                        onClick={() => removeDividend(div.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {sortedDividends.length === 0 && (
                  <div className="py-12 text-center text-slate-300 bg-white rounded-[20px] border border-dashed border-slate-200">
                    <p className="text-sm font-bold">배당 내역이 없습니다</p>
                    <p className="text-[11px] font-bold mt-1">위에서 배당 입력 버튼을 눌러 추가하세요.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

      </main>

      <AddTradeSheet
        isOpen={isTradeSheetOpen}
        currency={currency}
        onClose={() => setIsTradeSheetOpen(false)}
        onSubmit={addTrade}
      />
    </div>
  )
}
