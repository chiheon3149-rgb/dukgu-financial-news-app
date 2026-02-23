"use client"

import { useState, useMemo, use } from "react"
import { TrendingUp, TrendingDown, Plus, Trash2, ChevronDown, AlertCircle, Loader2, BarChart2, Coins } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useCryptoPortfolio } from "@/hooks/use-crypto-portfolio"

// =============================================================================
// 🪙 /assets/crypto/[symbol] — 코인 상세 페이지
//
// 1. 요약 카드
// 2. 탭: 매매내역 | 수익 내역
// 3. 매매 추가 인라인 폼
// =============================================================================

const PAGE_SIZE = 10

type TabKey = "trades" | "summary"

const COIN_EMOJI: Record<string, string> = {
  "BTC-USD":  "₿",
  "ETH-USD":  "Ξ",
  "XRP-USD":  "✕",
  "SOL-USD":  "◎",
  "ADA-USD":  "₳",
  "DOGE-USD": "Ð",
  "BNB-USD":  "B",
  "AVAX-USD": "A",
}

function StatBadge({ label, value, highlight }: {
  label: string; value: string; highlight?: "up" | "down" | "neutral"
}) {
  const colorClass = highlight === "up" ? "text-rose-500" : highlight === "down" ? "text-blue-500" : "text-slate-700"
  return (
    <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-3 gap-0.5">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-[13px] font-black ${colorClass}`}>{value}</span>
    </div>
  )
}

export default function CryptoDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: encodedSymbol } = use(params)
  const symbol = decodeURIComponent(encodedSymbol)

  const { rows, isLoadingPrices, addTrade, removeTrade } = useCryptoPortfolio()
  const row = rows.find((r) => r.holding.symbol === symbol)

  const [activeTab, setActiveTab] = useState<TabKey>("trades")
  const [tradeDisplayCount, setTradeDisplayCount] = useState(PAGE_SIZE)
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [tradeForm, setTradeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "buy" as "buy" | "sell",
    price: "",
    quantity: "",
    memo: "",
  })

  if (!row) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-bold text-slate-400">코인을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const { holding, stats, quote, returnRate } = row
  const currentPrice = quote?.currentPrice ?? 0
  const isUp = returnRate > 0
  const isDown = returnRate < 0
  const coinEmoji = COIN_EMOJI[symbol] ?? "🪙"
  const unit = holding.unit ?? symbol.split("-")[0]

  const fmtUsd = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtSigned = (v: number) => `${v >= 0 ? "+" : ""}${fmtUsd(v)}`
  const fmtQty = (v: number) => `${v.toFixed(8).replace(/\.?0+$/, "")} ${unit}`

  const sortedTrades = useMemo(
    () => [...(row?.holding.trades ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [row?.holding.trades]
  )
  const visibleTrades = sortedTrades.slice(0, tradeDisplayCount)

  const handleAddTrade = () => {
    const price = parseFloat(tradeForm.price)
    const quantity = parseFloat(tradeForm.quantity)
    if (!price || !quantity || price <= 0 || quantity <= 0) return
    addTrade(symbol, {
      date: tradeForm.date,
      type: tradeForm.type,
      price,
      quantity,
      memo: tradeForm.memo || undefined,
    })
    setShowAddTrade(false)
    setTradeForm({ date: new Date().toISOString().split("T")[0], type: "buy", price: "", quantity: "", memo: "" })
  }

  // 매수/매도 통계
  const buyTrades = sortedTrades.filter((t) => t.type === "buy")
  const sellTrades = sortedTrades.filter((t) => t.type === "sell")
  const totalBuyAmount = buyTrades.reduce((acc, t) => acc + t.price * t.quantity, 0)
  const totalSellAmount = sellTrades.reduce((acc, t) => acc + t.price * t.quantity, 0)

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader
        showBack
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl">{coinEmoji}</span>
            <span className="text-lg font-black text-slate-900">{unit}</span>
            <span className="text-[11px] font-bold text-slate-400">{holding.name}</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">

        {/* ── 1. 요약 카드 ── */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50/50 rounded-full -mr-10 -mt-10 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">현재가</p>
                {isLoadingPrices ? (
                  <p className="text-3xl font-black text-slate-200 animate-pulse">----</p>
                ) : (
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{fmtUsd(currentPrice)}</p>
                )}
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black ${
                isUp ? "bg-rose-50 text-rose-500" : isDown ? "bg-blue-50 text-blue-500" : "bg-slate-50 text-slate-400"
              }`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                {isLoadingPrices ? <Loader2 className="w-3 h-3 animate-spin" /> : `${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(2)}%`}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              <StatBadge label="평균단가" value={fmtUsd(stats.avgCostPrice)} />
              <StatBadge label="보유수량" value={fmtQty(stats.totalQuantity)} />
              <StatBadge label="평가손익" value={fmtSigned((currentPrice - stats.avgCostPrice) * stats.totalQuantity)} highlight={isUp ? "up" : isDown ? "down" : "neutral"} />
              <StatBadge label="실현손익" value={fmtSigned(stats.realizedPnl)} highlight={stats.realizedPnl > 0 ? "up" : stats.realizedPnl < 0 ? "down" : "neutral"} />
            </div>

            <div className="mt-3">
              {isLoadingPrices ? (
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 시세 조회 중...</span>
              ) : quote ? (
                <span className="text-[9px] font-bold text-amber-500">● Live · 30초 갱신</span>
              ) : (
                <span className="text-[9px] font-bold text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 시세 조회 실패</span>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. 탭: 매매내역 | 수익내역 ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100">
              <button
                onClick={() => setActiveTab("trades")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-black transition-all ${
                  activeTab === "trades" ? "bg-white text-amber-500 shadow-sm" : "text-slate-400"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                매매내역 <span className="text-[10px]">({sortedTrades.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("summary")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-black transition-all ${
                  activeTab === "summary" ? "bg-white text-amber-500 shadow-sm" : "text-slate-400"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                수익내역
              </button>
            </div>

            {activeTab === "trades" && (
              <button
                onClick={() => setShowAddTrade((v) => !v)}
                className="text-[11px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
              >
                <Plus className="w-3 h-3" /> 내역 추가
              </button>
            )}
          </div>

          {/* 매매 추가 폼 */}
          {activeTab === "trades" && showAddTrade && (
            <div className="bg-white rounded-[24px] border border-amber-100 shadow-sm p-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                {(["buy", "sell"] as const).map((t) => (
                  <button key={t} onClick={() => setTradeForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-xl text-[12px] font-black transition-all ${
                      tradeForm.type === t ? (t === "buy" ? "bg-emerald-500 text-white shadow-sm" : "bg-rose-500 text-white shadow-sm") : "text-slate-400"
                    }`}>
                    {t === "buy" ? "▲ 매수" : "▼ 매도"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "날짜", key: "date" as const, type: "date", placeholder: "" },
                  { label: `단가 (USD)`, key: "price" as const, type: "number", placeholder: "65000" },
                  { label: `수량 (${unit})`, key: "quantity" as const, type: "number", placeholder: "0.01" },
                  { label: "메모 (선택)", key: "memo" as const, type: "text", placeholder: "거래소명 등" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">{label}</label>
                    <input type={type} value={tradeForm[key]} placeholder={placeholder}
                      onChange={(e) => setTradeForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                    />
                  </div>
                ))}
              </div>
              {tradeForm.price && tradeForm.quantity && (
                <div className="px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[11px] font-bold text-amber-600">
                    예상 총액: {fmtUsd(parseFloat(tradeForm.price) * parseFloat(tradeForm.quantity))}
                  </p>
                </div>
              )}
              <button onClick={handleAddTrade}
                className="w-full py-3 bg-amber-500 text-white rounded-xl text-[13px] font-black transition-all active:scale-95">
                추가하기
              </button>
            </div>
          )}

          {/* 매매 내역 목록 */}
          {activeTab === "trades" && (
            <div className="grid gap-2.5">
              {visibleTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between px-4 py-3.5 bg-white rounded-[20px] border border-slate-100 shadow-sm group">
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${trade.type === "buy" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {trade.type === "buy" ? "▲ 매수" : "▼ 매도"}
                    </span>
                    <div>
                      <p className="text-[12px] font-black text-slate-800">{fmtUsd(trade.price)} × {trade.quantity}{unit}</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {trade.date.replace(/-/g, ".")}
                        {trade.memo && <span className="ml-2 text-slate-300">{trade.memo}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-black text-slate-700">{fmtUsd(trade.price * trade.quantity)}</p>
                    <button onClick={() => removeTrade(symbol, trade.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {sortedTrades.length > tradeDisplayCount && (
                <button onClick={() => setTradeDisplayCount((n) => n + PAGE_SIZE)}
                  className="w-full py-3.5 flex items-center justify-center gap-2 bg-slate-100/50 hover:bg-slate-100 text-slate-500 rounded-[18px] transition-all active:scale-95">
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

          {/* 수익 내역 탭 */}
          {activeTab === "summary" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-[20px] p-4 border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">총 매수금액</p>
                  <p className="text-[15px] font-black text-emerald-700">{fmtUsd(totalBuyAmount)}</p>
                  <p className="text-[9px] font-bold text-emerald-400 mt-0.5">{buyTrades.length}회 매수</p>
                </div>
                <div className="bg-rose-50 rounded-[20px] p-4 border border-rose-100">
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">총 매도금액</p>
                  <p className="text-[15px] font-black text-rose-700">{fmtUsd(totalSellAmount)}</p>
                  <p className="text-[9px] font-bold text-rose-400 mt-0.5">{sellTrades.length}회 매도</p>
                </div>
              </div>
              <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm space-y-3">
                {[
                  { label: "현재 평가금액", value: fmtUsd(currentPrice * stats.totalQuantity), color: "" },
                  { label: "평가손익", value: fmtSigned((currentPrice - stats.avgCostPrice) * stats.totalQuantity), color: isUp ? "text-rose-500" : isDown ? "text-blue-500" : "" },
                  { label: "실현손익", value: fmtSigned(stats.realizedPnl), color: stats.realizedPnl > 0 ? "text-rose-500" : stats.realizedPnl < 0 ? "text-blue-500" : "" },
                  { label: "수익률", value: `${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(2)}%`, color: isUp ? "text-rose-500" : isDown ? "text-blue-500" : "" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="text-[12px] font-bold text-slate-400">{label}</span>
                    <span className={`text-[13px] font-black ${color || "text-slate-700"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
