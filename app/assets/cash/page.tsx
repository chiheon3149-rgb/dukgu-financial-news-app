"use client"

import { useState, useMemo } from "react"
import { Banknote, Plus, Trash2 } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useExchangeRate } from "@/hooks/use-exchange-rate"

// =============================================================================
// 💵 /assets/cash — 현금 자산
// =============================================================================

interface CashItem {
  id: string
  label: string    // 예: 지갑, 체크카드 통장
  currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY"
  amount: number
  note?: string
}

const STORAGE_KEY = "dukgu:cash-holdings"

function load(): CashItem[] {
  if (typeof window === "undefined") return []
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function save(items: CashItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

export default function CashPage() {
  const usdRate = useExchangeRate()
  const EXCHANGE_RATE = useMemo<Record<string, number>>(
    () => ({ KRW: 1, USD: usdRate, EUR: 1550, JPY: 9.8, CNY: 198 }),
    [usdRate]
  )

  const [items, setItems] = useState<CashItem[]>(() => load())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState({ label: "", currency: "KRW" as CashItem["currency"], amount: "", note: "" })

  const totalKrw = useMemo(() =>
    items.reduce((acc, i) => acc + i.amount * (EXCHANGE_RATE[i.currency] ?? 1), 0),
    [items, EXCHANGE_RATE]
  )

  const handleAdd = () => {
    const amount = parseFloat(form.amount)
    if (!form.label.trim() || isNaN(amount) || amount <= 0) {
      alert("이름과 금액을 올바르게 입력해주세요.")
      return
    }
    const updated = [...items, { id: `cash-${Date.now()}`, label: form.label.trim(), currency: form.currency, amount, note: form.note || undefined }]
    setItems(updated); save(updated)
    setForm({ label: "", currency: "KRW", amount: "", note: "" })
    setIsFormOpen(false)
  }

  const handleRemove = (id: string) => {
    const updated = items.filter((i) => i.id !== id); setItems(updated); save(updated)
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
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              보유 현금 ({items.length})
            </h3>
            <button onClick={() => setIsFormOpen((v) => !v)}
              className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95">
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>

          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-emerald-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">이름 (예: 지갑, 은행통장)</label>
                  <input type="text" value={form.label} placeholder="현금 지갑"
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border border-slate-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">통화</label>
                  <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as CashItem["currency"] }))}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border border-slate-100 focus:outline-none focus:border-emerald-400">
                    {["KRW", "USD", "EUR", "JPY", "CNY"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">금액</label>
                  <input type="number" value={form.amount} placeholder="500000"
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border border-slate-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
              <button onClick={handleAdd}
                className="w-full py-3.5 bg-emerald-500 text-white rounded-[18px] text-[13px] font-black active:scale-[0.98] transition-all">
                추가하기
              </button>
            </div>
          )}

          <div className="grid gap-3">
            {items.map((item) => {
              const krw = Math.round(item.amount * (EXCHANGE_RATE[item.currency] ?? 1))
              return (
                <div key={item.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[14px] font-black text-slate-800">{item.label}</p>
                      <p className="text-[11px] font-bold text-slate-400">{fmtCurrency(item)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[14px] font-black text-slate-800">{fmt(krw)}</p>
                      <p className="text-[9px] font-bold text-slate-300">{item.currency} 환산</p>
                    </div>
                    <button onClick={() => handleRemove(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {items.length === 0 && (
            <div className="py-16 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
              <Banknote className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">등록된 현금 자산이 없습니다</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
