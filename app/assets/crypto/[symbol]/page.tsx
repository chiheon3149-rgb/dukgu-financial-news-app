"use client"

import { useState, useMemo, use } from "react"
import { TrendingUp, TrendingDown, Plus, Trash2, ChevronDown, AlertCircle, Loader2 } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useCryptoPortfolio } from "@/hooks/use-crypto-portfolio"

// =============================================================================
// 🪙 /assets/crypto/[symbol] — 코인 상세 페이지
// =============================================================================

const PAGE_SIZE = 10

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

export default function CryptoDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: encodedSymbol } = use(params)
  const symbol = decodeURIComponent(encodedSymbol)

  const { rows, isLoadingPrices, addTrade, removeTrade } = useCryptoPortfolio()
  const row = rows.find((r) => r.holding.symbol === symbol)

  const [tradeDisplayCount, setTradeDisplayCount] = useState(PAGE_SIZE)
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [tradeForm, setTradeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "buy" as "buy" | "sell",
    price: "",
    quantity: "",
    memo: "",
  })

  const sortedTrades = useMemo(
    () => [...(row?.holding.trades ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [row?.holding.trades]
  )
  const visibleTrades = sortedTrades.slice(0, tradeDisplayCount)
  const hasMoreTrades = sortedTrades.length > tradeDisplayCount

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
                {isLoadingPrices ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : `${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(2)}%`}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              <StatBadge label="평균단가" value={fmtUsd(stats.avgCostPrice)} />
              <StatBadge label="보유수량" value={fmtQty(stats.totalQuantity)} />
              <StatBadge
                label="평가손익"
                value={fmtSigned((currentPrice - stats.avgCostPrice) * stats.totalQuantity)}
                highlight={isUp ? "up" : isDown ? "down" : "neutral"}
              />
              <StatBadge
                label="실현손익"
                value={fmtSigned(stats.realizedPnl)}
                highlight={stats.realizedPnl > 0 ? "up" : stats.realizedPnl < 0 ? "down" : "neutral"}
              />
            </div>

            <div className="mt-3">
              {isLoadingPrices ? (
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> 시세 조회 중...
                </span>
              ) : quote ? (
                <span className="text-[9px] font-bold text-amber-500">● Live · 30초 갱신</span>
              ) : (
                <span className="text-[9px] font-bold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 시세 조회 실패
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. 매매 내역 ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
              매매 내역 ({sortedTrades.length}건)
            </h3>
            <button
              onClick={() => setShowAddTrade((v) => !v)}
              className="text-[11px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
            >
              <Plus className="w-3 h-3" /> 내역 추가
            </button>
          </div>

          {/* 내역 추가 폼 */}
          {showAddTrade && (
            <div className="bg-white rounded-[24px] border border-amber-100 shadow-sm p-5 space-y-3">
              <div className="flex gap-2">
                {(["buy", "sell"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTradeForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-xl text-[12px] font-black transition-all ${
                      tradeForm.type === t
                        ? t === "buy" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {t === "buy" ? "▲ 매수" : "▼ 매도"}
                  </button>
                ))}
              </div>
              <input type="date" value={tradeForm.date} onChange={(e) => setTradeForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border-0 outline-none" />
              <input type="number" placeholder="매수/매도 단가 (USD)" value={tradeForm.price}
                onChange={(e) => setTradeForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border-0 outline-none" />
              <input type="number" placeholder={`수량 (${unit})`} value={tradeForm.quantity}
                onChange={(e) => setTradeForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border-0 outline-none" />
              <input type="text" placeholder="메모 (선택)" value={tradeForm.memo}
                onChange={(e) => setTradeForm((f) => ({ ...f, memo: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border-0 outline-none" />
              <button onClick={handleAddTrade}
                className="w-full py-3 bg-amber-500 text-white rounded-xl text-[13px] font-black transition-all active:scale-95">
                추가하기
              </button>
            </div>
          )}

          <div className="grid gap-2.5">
            {visibleTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between px-4 py-3.5 bg-white rounded-[20px] border border-slate-100 shadow-sm group">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                    trade.type === "buy" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}>
                    {trade.type === "buy" ? "▲ 매수" : "▼ 매도"}
                  </span>
                  <div>
                    <p className="text-[12px] font-black text-slate-800">
                      {fmtUsd(trade.price)} × {trade.quantity}{unit}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      {trade.date.replace(/-/g, ".")}
                      {trade.memo && <span className="ml-2 text-slate-300">{trade.memo}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-black text-slate-700">{fmtUsd(trade.price * trade.quantity)}</p>
                  <button
                    onClick={() => removeTrade(symbol, trade.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {hasMoreTrades && (
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
        </section>
      </main>
    </div>
  )
}
