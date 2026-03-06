"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Banknote, Plus, Trash2, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

interface CashItem {
  id: string
  label: string
  currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY"
  amount: number
  note?: string
}

const defaultForm = { label: "", currency: "KRW" as CashItem["currency"], amount: "", note: "" }

export default function CashPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const viewUserId = searchParams.get("viewUserId")
  const isReadOnly = !!viewUserId
  const usdRate = useExchangeRate()
  const EXCHANGE_RATE = useMemo<Record<string, number>>(
    () => ({ KRW: 1, USD: usdRate, EUR: 1550, JPY: 9.8, CNY: 198 }),
    [usdRate]
  )

  const [items, setItems] = useState<CashItem[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (!user && !viewUserId) { setIsLoadingData(false); return }
    supabase.from("asset_cash").select("*").eq("user_id", viewUserId ?? user!.id).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("현금 자산을 불러오지 못했습니다.")
        else setItems((data ?? []).map(r => ({
          id: r.id, label: r.label, currency: r.currency as CashItem["currency"],
          amount: Number(r.amount), note: r.note ?? undefined,
        })))
        setIsLoadingData(false)
      })
  }, [user, viewUserId])

  const totalKrw = useMemo(() =>
    items.reduce((acc, i) => acc + i.amount * (EXCHANGE_RATE[i.currency] ?? 1), 0),
    [items, EXCHANGE_RATE])

  const handleEditClick = (item: CashItem) => {
    setEditingId(item.id)
    setForm({ label: item.label, currency: item.currency, amount: String(item.amount), note: item.note ?? "" })
    setIsFormOpen(true)
  }

  const handleCancel = () => { setEditingId(null); setForm(defaultForm); setIsFormOpen(false) }

  const handleSave = async () => {
    const amount = parseFloat(form.amount)
    if (!form.label.trim() || isNaN(amount) || amount <= 0) {
      toast.error("이름과 금액을 올바르게 입력해주세요."); return
    }
    if (!user) { toast.error("로그인이 필요합니다."); return }

    if (editingId) {
      const { data, error } = await supabase
        .from("asset_cash")
        .update({ label: form.label.trim(), currency: form.currency, amount, note: form.note || null })
        .eq("id", editingId).select().single()
      if (error) { toast.error("수정에 실패했습니다."); return }
      setItems(prev => prev.map(i => i.id === editingId
        ? { id: data.id, label: data.label, currency: data.currency, amount: Number(data.amount), note: data.note ?? undefined }
        : i))
      setEditingId(null)
    } else {
      const { data, error } = await supabase
        .from("asset_cash")
        .insert({ user_id: user.id, label: form.label.trim(), currency: form.currency, amount, note: form.note || null })
        .select().single()
      if (error) { toast.error("저장에 실패했습니다."); return }
      setItems(prev => [...prev, { id: data.id, label: data.label, currency: data.currency, amount: Number(data.amount), note: data.note ?? undefined }])
    }
    setForm(defaultForm); setIsFormOpen(false)
  }

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("asset_cash").delete().eq("id", id)
    if (error) { toast.error("삭제에 실패했습니다."); return }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const fmt = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`
  const fmtCurrency = (item: CashItem) => {
    const sym = { KRW: "₩", USD: "$", EUR: "€", JPY: "¥", CNY: "¥" }[item.currency] ?? ""
    return `${sym}${item.amount.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader showBack title={
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-emerald-500" />
          <span className="text-lg font-black text-slate-900 tracking-tight">현금 자산</span>
        </div>
      } />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/60 rounded-full -mr-8 -mt-8 blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">현금 총 자산 (원화 환산)</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{fmt(totalKrw)}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">{items.length}개 계정</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />보유 현금 ({items.length})
            </h3>
            {!isReadOnly && (
              <button onClick={() => { if (editingId) handleCancel(); else setIsFormOpen(v => !v) }}
                className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95">
                <Plus className="w-3 h-3" /> 추가
              </button>
            )}
          </div>

          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-emerald-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-black text-emerald-600">{editingId ? "현금 수정" : "현금 추가"}</span>
                <button onClick={handleCancel} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">이름 (예: 지갑, 은행통장)</label>
                  <input type="text" value={form.label} placeholder="현금 지갑"
                    onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border border-slate-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">통화</label>
                  <select value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value as CashItem["currency"] }))}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border border-slate-100 focus:outline-none focus:border-emerald-400">
                    {["KRW", "USD", "EUR", "JPY", "CNY"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">금액</label>
                  <input type="number" value={form.amount} placeholder="500000"
                    onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border border-slate-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
              <button onClick={handleSave}
                className="w-full py-3.5 bg-emerald-500 text-white rounded-[18px] text-[13px] font-black active:scale-[0.98] transition-all">
                {editingId ? "수정 완료" : "추가하기"}
              </button>
            </div>
          )}

          {isLoadingData ? (
            <div className="py-12 text-center"><p className="text-sm font-bold text-slate-300 animate-pulse">불러오는 중...</p></div>
          ) : (
            <div className="grid gap-3">
              {items.map((item) => {
                const krw = Math.round(item.amount * (EXCHANGE_RATE[item.currency] ?? 1))
                return (
                  <div key={item.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-slate-800">{item.label}</p>
                        <p className="text-[11px] font-bold text-slate-400">{fmtCurrency(item)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-[14px] font-black text-slate-800">{fmt(krw)}</p>
                        <p className="text-[9px] font-bold text-slate-300">{item.currency} 환산</p>
                      </div>
                      {!isReadOnly && (
                        <>
                          <button onClick={() => handleEditClick(item)} className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-emerald-500 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toast(`'${item.label}' 을(를) 삭제하시겠습니까?`, {
                            action: { label: "삭제", onClick: () => handleRemove(item.id) },
                            cancel: { label: "취소", onClick: () => {} },
                          })} className="p-2 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              {items.length === 0 && (
                <div className="py-16 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
                  <Banknote className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold">등록된 현금 자산이 없습니다</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
