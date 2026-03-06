"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Trash2, ChevronDown, RefreshCw, TrendingUp, TrendingDown, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import type { GoldHolding, TradeType } from "@/types"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

interface GoldQuote {
  pricePerGramKrw: number
  pricePerGramUsd: number
  usdToKrwRate: number
  changeRate: number
  changeStatus: "up" | "down" | "same"
  fetchedAt: string
}

const PAGE_SIZE = 10
const today = new Date().toISOString().split("T")[0]

function rowToHolding(row: Record<string, unknown>): GoldHolding {
  return {
    id: row.id as string,
    date: row.trade_date as string,
    pricePerGram: Number(row.price_per_gram),
    grams: Number(row.grams),
    type: row.trade_type as TradeType,
    memo: (row.memo as string) ?? undefined,
  }
}

function GoldPageInner() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const viewUserId = searchParams.get("viewUserId")
  const isReadOnly = !!viewUserId
  const [holdings, setHoldings] = useState<GoldHolding[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [quote, setQuote] = useState<GoldQuote | null>(null)
  const [isLoadingPrice, setIsLoadingPrice] = useState(true)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formType, setFormType] = useState<TradeType>("buy")
  const [formDate, setFormDate] = useState(today)
  const [formPrice, setFormPrice] = useState("")
  const [formGrams, setFormGrams] = useState("")
  const [formMemo, setFormMemo] = useState("")

  useEffect(() => {
    if (!user && !viewUserId) { setIsLoadingData(false); return }
    const fetchData = async () => {
      setIsLoadingData(true)
      const { data, error } = await supabase
        .from("asset_gold").select("*").eq("user_id", viewUserId ?? user!.id).order("trade_date", { ascending: false })
      if (error) toast.error("금 내역을 불러오지 못했습니다.")
      else setHoldings((data ?? []).map(rowToHolding))
      setIsLoadingData(false)
    }
    fetchData()
  }, [user, viewUserId])

  const fetchGoldPrice = async () => {
    setIsLoadingPrice(true); setPriceError(null)
    try {
      const res = await fetch("/api/market/gold")
      if (!res.ok) throw new Error()
      setQuote(await res.json())
    } catch { setPriceError("금 시세를 불러오지 못했습니다") }
    finally { setIsLoadingPrice(false) }
  }
  useEffect(() => { fetchGoldPrice() }, [])

  const stats = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let totalGrams = 0, totalCost = 0, realizedPnl = 0
    for (const h of sorted) {
      if (h.type === "buy") { totalCost += h.pricePerGram * h.grams; totalGrams += h.grams }
      else {
        const avg = totalGrams > 0 ? totalCost / totalGrams : 0
        realizedPnl += (h.pricePerGram - avg) * h.grams
        totalCost -= avg * h.grams; totalGrams -= h.grams
      }
    }
    return { totalGrams, avgCostPerGram: totalGrams > 0 ? totalCost / totalGrams : 0, totalInvested: totalCost, realizedPnl }
  }, [holdings])

  const currentValue = quote ? stats.totalGrams * quote.pricePerGramKrw : 0
  const unrealizedPnl = currentValue - stats.totalInvested
  const returnRate = stats.totalInvested > 0 ? (unrealizedPnl / stats.totalInvested) * 100 : 0
  const isUp = returnRate > 0; const isDown = returnRate < 0
  const sortedHoldings = [...holdings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const visibleHoldings = sortedHoldings.slice(0, displayCount)

  const resetForm = () => {
    setFormType("buy"); setFormDate(today); setFormPrice(""); setFormGrams(""); setFormMemo("")
  }

  const handleEditClick = (h: GoldHolding) => {
    setEditingId(h.id); setFormType(h.type); setFormDate(h.date)
    setFormPrice(String(h.pricePerGram)); setFormGrams(String(h.grams)); setFormMemo(h.memo ?? "")
    setIsFormOpen(true)
  }

  const handleCancelEdit = () => { setEditingId(null); resetForm(); setIsFormOpen(false) }

  const handleSave = async () => {
    const p = parseFloat(formPrice), g = parseFloat(formGrams)
    if (!formDate || isNaN(p) || isNaN(g) || p <= 0 || g <= 0) {
      toast.error("날짜, 가격, 수량을 올바르게 입력해 주세요."); return
    }
    if (!user) { toast.error("로그인이 필요합니다."); return }

    if (editingId) {
      const { data, error } = await supabase
        .from("asset_gold")
        .update({ trade_date: formDate, price_per_gram: p, grams: g, trade_type: formType, memo: formMemo || null })
        .eq("id", editingId).select().single()
      if (error) { toast.error("수정에 실패했습니다."); return }
      setHoldings(prev => prev.map(x => x.id === editingId ? rowToHolding(data) : x))
      setEditingId(null)
    } else {
      const { data, error } = await supabase
        .from("asset_gold")
        .insert({ user_id: user.id, trade_date: formDate, price_per_gram: p, grams: g, trade_type: formType, memo: formMemo || null })
        .select().single()
      if (error) { toast.error("저장에 실패했습니다."); return }
      setHoldings(prev => [...prev, rowToHolding(data)])
    }
    resetForm(); setIsFormOpen(false)
  }

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("asset_gold").delete().eq("id", id)
    if (error) { toast.error("삭제에 실패했습니다."); return }
    setHoldings(prev => prev.filter(x => x.id !== id))
  }

  const fmt = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`
  const fmtSigned = (n: number) => `${n >= 0 ? "+" : ""}${fmt(n)}`

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader showBack title={
        <div className="flex items-center gap-2">
          <span className="text-xl">🥇</span>
          <span className="text-lg font-black text-slate-900 tracking-tight">금 보유현황</span>
        </div>
      } />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        {/* 요약 카드 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50/60 rounded-full -mr-8 -mt-8 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">현재 평가금액</p>
                {isLoadingPrice
                  ? <p className="text-3xl font-black text-slate-200 animate-pulse">----</p>
                  : <p className="text-3xl font-black text-slate-900 tracking-tighter">{fmt(currentValue)}</p>}
              </div>
              <button onClick={fetchGoldPrice} className="p-2 rounded-full hover:bg-amber-50 transition-colors">
                <RefreshCw className={`w-4 h-4 text-amber-500 ${isLoadingPrice ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: "보유량", value: `${stats.totalGrams.toFixed(1)}g` },
                { label: "평균 매입가", value: quote ? `${Math.round(stats.avgCostPerGram).toLocaleString()}원/g` : "-" },
                { label: "평가손익", value: isLoadingPrice ? "-" : fmtSigned(unrealizedPnl), color: isUp ? "text-rose-500" : isDown ? "text-blue-500" : "text-slate-700" },
                { label: "수익률", value: isLoadingPrice ? "-" : `${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(2)}%`, color: isUp ? "text-rose-500" : isDown ? "text-blue-500" : "text-slate-700" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center bg-slate-50 rounded-2xl p-2.5 gap-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
                  <span className={`text-[11px] font-black ${color ?? "text-slate-700"}`}>{value}</span>
                </div>
              ))}
            </div>
            {quote && (
              <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400">현재 금시세: <span className="text-amber-500 font-black">{quote.pricePerGramKrw.toLocaleString()}원/g</span></span>
                <span className={`flex items-center gap-0.5 ${quote.changeRate > 0 ? "text-rose-500" : "text-blue-500"}`}>
                  {quote.changeRate > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {quote.changeRate > 0 ? "+" : ""}{quote.changeRate.toFixed(2)}%
                </span>
              </div>
            )}
            {priceError && <p className="text-[10px] font-bold text-rose-400 mt-2">{priceError}</p>}
          </div>
        </section>

        {/* 매매 내역 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full" />매매 내역
            </h3>
            {!isReadOnly && (
              <button onClick={() => { if (editingId) handleCancelEdit(); else setIsFormOpen(v => !v) }}
                className="text-[11px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full transition-all active:scale-95">
                <Plus className="w-3 h-3" /> 내역 추가
              </button>
            )}
          </div>

          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-amber-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-black text-amber-600">{editingId ? "내역 수정" : "내역 추가"}</span>
                <button onClick={handleCancelEdit} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                {(["buy", "sell"] as TradeType[]).map((t) => (
                  <button key={t} onClick={() => setFormType(t)}
                    className={`flex-1 py-2 rounded-xl text-[12px] font-black transition-all ${formType === t ? (t === "buy" ? "bg-emerald-500 text-white shadow-sm" : "bg-rose-500 text-white shadow-sm") : "text-slate-400"}`}>
                    {t === "buy" ? "▲ 매수" : "▼ 매도"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "날짜", value: formDate, setter: setFormDate, type: "date", placeholder: "" },
                  { label: "1g 가격 (원)", value: formPrice, setter: setFormPrice, type: "number", placeholder: "100,000" },
                  { label: "수량 (g)", value: formGrams, setter: setFormGrams, type: "number", placeholder: "10.5" },
                  { label: "메모 (선택)", value: formMemo, setter: setFormMemo, type: "text", placeholder: "순금 24K" },
                ].map(({ label, value, setter, type, placeholder }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">{label}</label>
                    <input type={type} value={value} placeholder={placeholder} max={type === "date" ? today : undefined}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                    />
                  </div>
                ))}
              </div>
              {formPrice && formGrams && !isNaN(parseFloat(formPrice)) && !isNaN(parseFloat(formGrams)) && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-600">예상 총액</span>
                  <span className="text-[13px] font-black text-amber-700">{fmt(parseFloat(formPrice) * parseFloat(formGrams))}</span>
                </div>
              )}
              <button onClick={handleSave}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-[18px] text-[13px] font-black transition-all active:scale-[0.98]">
                {editingId ? "수정 완료" : "내역 추가"}
              </button>
            </div>
          )}

          {isLoadingData ? (
            <div className="py-12 text-center"><p className="text-sm font-bold text-slate-300 animate-pulse">불러오는 중...</p></div>
          ) : (
            <div className="grid gap-2.5">
              {visibleHoldings.map((h) => (
                <div key={h.id} className="flex items-center justify-between px-4 py-3.5 bg-white rounded-[20px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${h.type === "buy" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {h.type === "buy" ? "▲ 매수" : "▼ 매도"}
                    </span>
                    <div>
                      <p className="text-[12px] font-black text-slate-800">{h.pricePerGram.toLocaleString()}원/g × {h.grams}g</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-slate-400">{h.date.replace(/-/g, ".")}</p>
                        {h.memo && <p className="text-[9px] font-bold text-slate-300">{h.memo}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-black text-slate-700">{fmt(h.pricePerGram * h.grams)}</p>
                    {!isReadOnly && (
                      <>
                        <button onClick={() => handleEditClick(h)} className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-amber-500 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toast(`${h.date.replace(/-/g, ".")} 내역을 삭제하시겠습니까?`, {
                          action: { label: "삭제", onClick: () => handleRemove(h.id) },
                          cancel: { label: "취소", onClick: () => {} },
                        })} className="p-2 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {sortedHoldings.length > displayCount && (
                <button onClick={() => setDisplayCount(n => n + PAGE_SIZE)}
                  className="w-full py-3.5 flex items-center justify-center gap-2 bg-slate-100/50 hover:bg-slate-100 text-slate-500 rounded-[18px] transition-all active:scale-95">
                  <span className="text-[12px] font-black">이전 내역 더 보기</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default function GoldPage() {
  return <Suspense fallback={null}><GoldPageInner /></Suspense>
}
