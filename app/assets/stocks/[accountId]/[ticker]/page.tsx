"use client"

import { useState, useMemo, use } from "react"
import {
  TrendingUp, TrendingDown, Plus, Trash2, Pencil, Check, X,
  ChevronDown, AlertCircle, Loader2, Gift, BarChart2
} from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { TradeChart } from "@/components/dukgu/trade-chart"
import { AddTradeSheet } from "@/components/dukgu/add-trade-sheet"
import { useStockDetail } from "@/hooks/use-stock-detail"
import { toast } from "sonner"
import type { DividendTaxType } from "@/types"

const PAGE_SIZE = 10
type PeriodKey = "1W" | "1M" | "ALL"
type TabKey = "trades" | "dividends"

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1W", label: "1주" },
  { key: "1M", label: "1달" },
  { key: "ALL", label: "전체" },
]

const TAX_TYPE_LABELS: Record<DividendTaxType, string> = {
  gross: "세전",
  withholding: "세후(15.4%)",
  exempt: "비과세",
}

function StatBadge({ label, value, highlight }: { label: string; value: string; highlight?: "up" | "down" | "neutral" }) {
  const colorClass = highlight === "up" ? "text-rose-500" : highlight === "down" ? "text-blue-500" : "text-slate-700"
  return (
    <div className="flex justify-between items-center bg-slate-50 rounded-2xl p-4 w-full">
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-[15px] font-black whitespace-nowrap ${colorClass}`}>{value}</span>
    </div>
  )
}

export default function StockDetailPage({ params }: { params: Promise<{ accountId: string, ticker: string }> }) {
  const { accountId, ticker } = use(params)
  const decodedTicker = decodeURIComponent(ticker)

  const { holding, stats, quote, chartData, isLoadingPrice, addTrade, removeTrade, updateTrade, addDividend, updateDividend, removeDividend } =
    useStockDetail(accountId, decodedTicker)

  const [isTradeSheetOpen, setIsTradeSheetOpen] = useState(false)
  const [tradeDisplayCount, setTradeDisplayCount] = useState(PAGE_SIZE)
  const [activeTab, setActiveTab] = useState<TabKey>("trades")
  const [period, setPeriod] = useState<PeriodKey>("ALL")

  // 매매내역 수정 상태
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null)
  const [editTradeForm, setEditTradeForm] = useState({
    date: "",
    type: "buy" as "buy" | "sell",
    price: "",
    quantity: "",
    memo: "",
  })

  // 배당 입력 폼 상태
  const [showDivForm, setShowDivForm] = useState(false)
  const [divForm, setDivForm] = useState({
    date: new Date().toISOString().split("T")[0],
    sharesHeld: "",
    totalAmount: "",
    taxType: "gross" as DividendTaxType,
  })

  // 배당 수정 상태
  const [editingDivId, setEditingDivId] = useState<string | null>(null)
  const [editDivForm, setEditDivForm] = useState({
    date: "",
    sharesHeld: "",
    totalAmount: "",
    taxType: "gross" as DividendTaxType,
  })

  const periodFilteredChartData = useMemo(() => {
    if (period === "ALL") return chartData
    const now = new Date()
    const cutoff = new Date(now)
    if (period === "1W") cutoff.setDate(cutoff.getDate() - 7)
    else if (period === "1M") cutoff.setMonth(cutoff.getMonth() - 1)
    return chartData.filter((d) => new Date(d.date) >= cutoff)
  }, [chartData, period])

  const sortedTrades = useMemo(() => [...(holding?.trades ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [holding?.trades])
  const sortedDividends = useMemo(() => [...(holding?.dividends ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [holding?.dividends])

  const currency = holding?.currency || "KRW"
  const currentPrice = quote?.currentPrice ?? 0
  const avgCost = stats?.avgCostPrice ?? 0
  const totalShares = stats?.totalShares ?? 0
  const unrealizedPnl = (currentPrice - avgCost) * totalShares
  const returnRate = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0
  const isUp = returnRate > 0
  const isDown = returnRate < 0

  const fmt = (v: number) => currency === "KRW"
    ? `${Math.round(v).toLocaleString("ko-KR")}원`
    : `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtSigned = (v: number) => `${v >= 0 ? "+" : ""}${fmt(v)}`

  const totalDividend = holding?.dividends.reduce((acc, d) => acc + (d.amountPerShare * d.sharesHeld), 0) || 0

  if (!holding && !isLoadingPrice) {
    return (
      <div className="min-h-dvh bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-400">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  }

  // ── 매매내역 수정 핸들러 ──────────────────────────────────────────
  const openTradeEdit = (trade: { id: string; date: string; type: "buy" | "sell"; price: number; quantity: number; memo?: string }) => {
    setEditingTradeId(trade.id)
    setEditTradeForm({
      date: trade.date,
      type: trade.type,
      price: String(trade.price),
      quantity: String(trade.quantity),
      memo: trade.memo || "",
    })
  }

  const handleUpdateTrade = async (tradeId: string) => {
    const price = parseFloat(editTradeForm.price)
    const quantity = parseFloat(editTradeForm.quantity)
    if (!editTradeForm.date || isNaN(price) || isNaN(quantity) || price <= 0 || quantity <= 0) {
      toast.error("날짜, 단가, 수량을 올바르게 입력해주세요.")
      return
    }
    await updateTrade(tradeId, {
      date: editTradeForm.date,
      type: editTradeForm.type,
      price,
      quantity,
      memo: editTradeForm.memo || undefined,
    })
    setEditingTradeId(null)
    toast.success("매매 내역이 수정되었습니다.")
  }

  // ── 배당내역 추가 핸들러 ──────────────────────────────────────────
  const handleAddDividend = () => {
    const shares = parseFloat(divForm.sharesHeld)
    const total = parseFloat(divForm.totalAmount)
    if (!divForm.date || isNaN(shares) || isNaN(total) || shares <= 0 || total <= 0) {
      toast.error("모든 항목을 올바르게 입력해주세요.")
      return
    }
    const amountPerShare = total / shares
    addDividend({ date: divForm.date, sharesHeld: shares, amountPerShare, currency, taxType: divForm.taxType })
    setShowDivForm(false)
    setDivForm({ date: new Date().toISOString().split("T")[0], sharesHeld: "", totalAmount: "", taxType: "gross" })
    toast.success("배당금이 등록되었습니다.")
  }

  // ── 배당내역 수정 핸들러 ──────────────────────────────────────────
  const openDivEdit = (div: { id: string; date: string; sharesHeld: number; amountPerShare: number; taxType?: DividendTaxType }) => {
    setEditingDivId(div.id)
    setEditDivForm({
      date: div.date,
      sharesHeld: String(div.sharesHeld),
      totalAmount: String(Math.round(div.amountPerShare * div.sharesHeld * 100) / 100),
      taxType: div.taxType || "gross",
    })
  }

  const handleUpdateDividend = async (divId: string) => {
    const shares = parseFloat(editDivForm.sharesHeld)
    const total = parseFloat(editDivForm.totalAmount)
    if (!editDivForm.date || isNaN(shares) || isNaN(total) || shares <= 0 || total <= 0) {
      toast.error("날짜, 보유수량, 총 배당금을 올바르게 입력해주세요.")
      return
    }
    const amountPerShare = total / shares
    await updateDividend(divId, {
      date: editDivForm.date,
      sharesHeld: shares,
      amountPerShare,
      currency,
      taxType: editDivForm.taxType,
    })
    setEditingDivId(null)
    toast.success("배당 내역이 수정되었습니다.")
  }

  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-20">
      <DetailHeader
        showBack
        title={
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-lg font-black text-slate-900 shrink-0">{decodedTicker}</span>
            <span className="text-[11px] font-bold text-slate-400 truncate">{holding?.name}</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        {/* 🏆 요약 카드 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 pr-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">현재가</p>
                {isLoadingPrice ? (
                  <p className="text-3xl font-black text-slate-200 animate-pulse truncate">----</p>
                ) : (
                  <p className="text-3xl font-black text-slate-900 tracking-tighter truncate">{fmt(currentPrice)}</p>
                )}
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black shrink-0 whitespace-nowrap ${isUp ? "bg-rose-50 text-rose-500" : isDown ? "bg-blue-50 text-blue-500" : "bg-slate-50 text-slate-400"}`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                {isLoadingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : `${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(2)}%`}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <StatBadge label="평단가" value={fmt(avgCost)} />
              <StatBadge label="보유수량" value={`${totalShares}주`} />
              <StatBadge label="평가손익" value={fmtSigned(unrealizedPnl)} highlight={isUp ? "up" : isDown ? "down" : "neutral"} />
              <StatBadge label="평가금액" value={fmt(currentPrice * totalShares)} />
              <StatBadge label="실현손익" value={fmtSigned(stats?.realizedPnl ?? 0)} highlight={(stats?.realizedPnl ?? 0) > 0 ? "up" : (stats?.realizedPnl ?? 0) < 0 ? "down" : "neutral"} />
              <StatBadge label="받은 배당금" value={`+${fmt(totalDividend)}`} highlight="neutral" />
            </div>
          </div>
        </section>

        {/* 📈 차트 영역 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2"><span className="w-1.5 h-4 bg-emerald-500 rounded-full" />평단가 추이</h3>
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100 shrink-0">
              {PERIODS.map(({ key, label }) => (
                <button key={key} onClick={() => setPeriod(key)} className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all ${period === key ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{label}</button>
              ))}
            </div>
          </div>
          <TradeChart data={periodFilteredChartData} currentPrice={currentPrice || undefined} currency={currency} />
        </section>

        {/* 📋 내역 탭 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100">
              <button onClick={() => { setActiveTab("trades"); setShowDivForm(false); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-black transition-all ${activeTab === "trades" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}>
                <BarChart2 className="w-3.5 h-3.5" /> 매매내역
              </button>
              <button onClick={() => setActiveTab("dividends")} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-black transition-all ${activeTab === "dividends" ? "bg-white text-amber-500 shadow-sm" : "text-slate-400"}`}>
                <Gift className="w-3.5 h-3.5" /> 배당내역
              </button>
            </div>

            {activeTab === "trades" && (
              <button onClick={() => setIsTradeSheetOpen(true)} className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full active:scale-95 transition-all">
                <Plus className="w-3 h-3" /> 매수/매도
              </button>
            )}
            {activeTab === "dividends" && (
              <button onClick={() => { setShowDivForm(!showDivForm); setEditingDivId(null); }} className="text-[11px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full active:scale-95 transition-all">
                {showDivForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showDivForm ? "닫기" : "배당 입력"}
              </button>
            )}
          </div>

          {/* 💵 매매내역 탭 컨텐츠 */}
          {activeTab === "trades" && (
            <div className="grid gap-3">
              {sortedTrades.map((trade) => (
                <div key={trade.id} className="relative p-4 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3">

                  {editingTradeId === trade.id ? (
                    /* ── 수정 폼 ── */
                    <div className="space-y-3 animate-in zoom-in-95 duration-150">
                      {/* 매수/매도 타입 토글 */}
                      <div className="flex gap-2">
                        {(["buy", "sell"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setEditTradeForm(f => ({ ...f, type: t }))}
                            className={`flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all ${
                              editTradeForm.type === t
                                ? t === "buy" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                : "bg-slate-50 text-slate-400 border border-slate-100"
                            }`}
                          >
                            {t === "buy" ? "▲ 매수" : "▼ 매도"}
                          </button>
                        ))}
                      </div>

                      {/* 날짜 */}
                      <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                        <span className="text-[11px] font-bold text-slate-500 w-14">날짜</span>
                        <input
                          type="date"
                          value={editTradeForm.date}
                          onChange={e => setEditTradeForm(f => ({ ...f, date: e.target.value }))}
                          className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none"
                        />
                      </div>

                      {/* 단가 */}
                      <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                        <span className="text-[11px] font-bold text-slate-500 w-14">단가</span>
                        <input
                          type="number"
                          value={editTradeForm.price}
                          onChange={e => setEditTradeForm(f => ({ ...f, price: e.target.value }))}
                          className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none"
                          placeholder="0"
                        />
                        <span className="text-[11px] font-bold text-slate-400">{currency}</span>
                      </div>

                      {/* 수량 */}
                      <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                        <span className="text-[11px] font-bold text-slate-500 w-14">수량</span>
                        <input
                          type="number"
                          value={editTradeForm.quantity}
                          onChange={e => setEditTradeForm(f => ({ ...f, quantity: e.target.value }))}
                          className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none"
                          placeholder="0"
                        />
                        <span className="text-[11px] font-bold text-slate-400">주</span>
                      </div>

                      {/* 메모 */}
                      <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                        <span className="text-[11px] font-bold text-slate-500 w-14">메모</span>
                        <input
                          type="text"
                          value={editTradeForm.memo}
                          onChange={e => setEditTradeForm(f => ({ ...f, memo: e.target.value }))}
                          className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none"
                          placeholder="메모 (선택)"
                        />
                      </div>

                      {/* 확인/취소 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateTrade(trade.id)}
                          className="flex-1 py-3 bg-emerald-500 text-white rounded-[16px] text-[12px] font-black active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> 저장
                        </button>
                        <button
                          onClick={() => setEditingTradeId(null)}
                          className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-[16px] text-[12px] font-black active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> 취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── 카드 뷰 ── */
                    <>
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${trade.type === "buy" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                            {trade.type === "buy" ? "▲ 매수" : "▼ 매도"}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400 shrink-0">{trade.date.replace(/-/g, ".")}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openTradeEdit(trade)} className="p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:text-emerald-500 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toast(`${trade.date} ${trade.type === "buy" ? "매수" : "매도"} 내역을 삭제하시겠습니까?`, {
                              action: { label: "삭제", onClick: () => removeTrade(trade.id) },
                              cancel: { label: "취소", onClick: () => {} },
                            })}
                            className="p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:text-rose-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 w-full bg-slate-50 rounded-xl p-3">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[11px] font-bold text-slate-500">단가 × 수량</span>
                          <span className="text-[13px] font-black text-slate-800 whitespace-nowrap">{fmt(trade.price)} × {trade.quantity}주</span>
                        </div>
                        <div className="w-full h-px bg-slate-200/50 my-1" />
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[11px] font-black text-slate-500">총 금액</span>
                          <span className="text-[14px] font-black text-emerald-600 whitespace-nowrap">{fmt(trade.price * trade.quantity)}</span>
                        </div>
                      </div>

                      {trade.memo && (
                        <p className="text-[11px] font-bold text-slate-400 bg-slate-50/50 px-3 py-2 rounded-xl break-all">
                          📝 {trade.memo}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}

              {sortedTrades.length === 0 && (
                <div className="py-12 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
                  <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-bold">매매 내역이 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 🎁 배당내역 탭 컨텐츠 */}
          {activeTab === "dividends" && (
            <div className="grid gap-3 animate-in fade-in duration-200">

              {/* 배당 입력 폼 */}
              {showDivForm && (
                <div className="p-5 bg-white rounded-[24px] border border-amber-100 shadow-sm space-y-4 mb-2">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-500" />
                    <span className="text-[13px] font-black text-slate-800">배당금 입력</span>
                  </div>

                  {/* 세금 유형 */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">세금 유형</p>
                    <div className="flex gap-2">
                      {(["gross", "withholding", "exempt"] as DividendTaxType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setDivForm(f => ({ ...f, taxType: t }))}
                          className={`flex-1 py-2 rounded-xl text-[11px] font-black transition-all ${
                            divForm.taxType === t
                              ? "bg-amber-500 text-white"
                              : "bg-slate-50 text-slate-400 border border-slate-100"
                          }`}
                        >
                          {TAX_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                      <span className="text-[11px] font-bold text-slate-500 w-16">날짜</span>
                      <input type="date" value={divForm.date} onChange={e => setDivForm({ ...divForm, date: e.target.value })} className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none" />
                    </div>
                    <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                      <span className="text-[11px] font-bold text-slate-500 w-16">보유수량</span>
                      <input type="number" placeholder="예: 100" value={divForm.sharesHeld} onChange={e => setDivForm({ ...divForm, sharesHeld: e.target.value })} className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none" />
                      <span className="text-[11px] font-bold text-slate-400">주</span>
                    </div>
                    <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                      <span className="text-[11px] font-bold text-slate-500 w-16">총 배당금</span>
                      <input type="number" placeholder="입력" value={divForm.totalAmount} onChange={e => setDivForm({ ...divForm, totalAmount: e.target.value })} className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none" />
                      <span className="text-[11px] font-bold text-slate-400">{currency}</span>
                    </div>
                  </div>

                  <button onClick={handleAddDividend} className="w-full py-3.5 bg-amber-500 text-white rounded-[18px] text-[13px] font-black active:scale-95 transition-all">
                    등록 완료
                  </button>
                </div>
              )}

              {/* 배당금 리스트 */}
              {sortedDividends.map((div) => (
                <div key={div.id} className="p-4 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3">

                  {editingDivId === div.id ? (
                    /* ── 배당 수정 폼 ── */
                    <div className="space-y-3 animate-in zoom-in-95 duration-150">
                      {/* 세금 유형 */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">세금 유형</p>
                        <div className="flex gap-2">
                          {(["gross", "withholding", "exempt"] as DividendTaxType[]).map((t) => (
                            <button
                              key={t}
                              onClick={() => setEditDivForm(f => ({ ...f, taxType: t }))}
                              className={`flex-1 py-2 rounded-xl text-[11px] font-black transition-all ${
                                editDivForm.taxType === t
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-50 text-slate-400 border border-slate-100"
                              }`}
                            >
                              {TAX_TYPE_LABELS[t]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                        <span className="text-[11px] font-bold text-slate-500 w-16">날짜</span>
                        <input type="date" value={editDivForm.date} onChange={e => setEditDivForm(f => ({ ...f, date: e.target.value }))} className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none" />
                      </div>
                      <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                        <span className="text-[11px] font-bold text-slate-500 w-16">보유수량</span>
                        <input type="number" value={editDivForm.sharesHeld} onChange={e => setEditDivForm(f => ({ ...f, sharesHeld: e.target.value }))} className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none" />
                        <span className="text-[11px] font-bold text-slate-400">주</span>
                      </div>
                      <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                        <span className="text-[11px] font-bold text-slate-500 w-16">총 배당금</span>
                        <input type="number" value={editDivForm.totalAmount} onChange={e => setEditDivForm(f => ({ ...f, totalAmount: e.target.value }))} className="flex-1 bg-transparent text-[13px] font-bold text-slate-900 outline-none" />
                        <span className="text-[11px] font-bold text-slate-400">{currency}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateDividend(div.id)}
                          className="flex-1 py-3 bg-amber-500 text-white rounded-[16px] text-[12px] font-black active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> 저장
                        </button>
                        <button
                          onClick={() => setEditingDivId(null)}
                          className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-[16px] text-[12px] font-black active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> 취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── 배당 카드 뷰 ── */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px] font-bold text-slate-400">{div.date.replace(/-/g, ".")}</p>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              div.taxType === "exempt" ? "bg-emerald-50 text-emerald-600"
                              : div.taxType === "withholding" ? "bg-blue-50 text-blue-500"
                              : "bg-slate-100 text-slate-500"
                            }`}>
                              {TAX_TYPE_LABELS[div.taxType || "gross"]}
                            </span>
                          </div>
                          <p className="text-[13px] font-black text-slate-800">{div.sharesHeld}주 보유</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-[14px] font-black text-amber-600">+{fmt(div.amountPerShare * div.sharesHeld)}</p>
                          <p className="text-[10px] font-bold text-slate-400">주당 {fmt(div.amountPerShare)}</p>
                        </div>
                        <button onClick={() => openDivEdit(div)} className="p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:text-amber-500 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toast("배당 내역을 삭제하시겠습니까?", {
                            action: { label: "삭제", onClick: () => removeDividend(div.id) },
                            cancel: { label: "취소", onClick: () => {} },
                          })}
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {sortedDividends.length === 0 && !showDivForm && (
                <div className="py-12 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
                  <Gift className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-bold">등록된 배당 내역이 없습니다</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <AddTradeSheet isOpen={isTradeSheetOpen} currency={currency} onClose={() => setIsTradeSheetOpen(false)} onSubmit={addTrade} />
    </div>
  )
}
