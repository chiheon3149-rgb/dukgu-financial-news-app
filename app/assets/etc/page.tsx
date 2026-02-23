"use client"

import { useState, useMemo } from "react"
import { Package, Plus, Trash2 } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"

// =============================================================================
// 📦 /assets/etc — 기타 자산 (미술품, 시계, 자동차 등)
// =============================================================================

interface EtcItem {
  id: string
  name: string
  category: string       // 예: 미술품, 명품, 자동차
  purchasePrice: number  // 매입가 (원)
  currentPrice: number   // 현재 추정가 (원)
  purchaseDate: string
  note?: string
}

const STORAGE_KEY = "dukgu:etc-holdings"
function load(): EtcItem[] {
  if (typeof window === "undefined") return []
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function save(items: EtcItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

const today = new Date().toISOString().split("T")[0]
const PRESET_CATEGORIES = ["미술품", "명품/시계", "자동차", "골동품", "와인/위스키", "기타"]

export default function EtcPage() {
  const [items, setItems] = useState<EtcItem[]>(() => load())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState({ name: "", category: "기타", purchasePrice: "", currentPrice: "", purchaseDate: today, note: "" })

  const totalValue = useMemo(() => items.reduce((acc, i) => acc + i.currentPrice, 0), [items])
  const totalPurchase = useMemo(() => items.reduce((acc, i) => acc + i.purchasePrice, 0), [items])

  const handleAdd = () => {
    const pp = parseFloat(form.purchasePrice)
    const cp = parseFloat(form.currentPrice)
    if (!form.name.trim() || isNaN(pp) || isNaN(cp)) {
      alert("이름, 매입가, 현재가를 올바르게 입력해주세요."); return
    }
    const updated = [...items, {
      id: `etc-${Date.now()}`, name: form.name.trim(), category: form.category,
      purchasePrice: pp, currentPrice: cp, purchaseDate: form.purchaseDate, note: form.note || undefined,
    }]
    setItems(updated); save(updated)
    setForm({ name: "", category: "기타", purchasePrice: "", currentPrice: "", purchaseDate: today, note: "" })
    setIsFormOpen(false)
  }

  const handleRemove = (id: string) => {
    const updated = items.filter((i) => i.id !== id); setItems(updated); save(updated)
  }

  const fmt = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader showBack title={
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-rose-500" />
          <span className="text-lg font-black text-slate-900 tracking-tight">기타 자산</span>
        </div>
      } />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/60 rounded-full -mr-8 -mt-8 blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">기타 자산 총 추정가</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{fmt(totalValue)}</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">총 매입가</span>
              <span className="text-[13px] font-black text-slate-700">{fmt(totalPurchase)}</span>
            </div>
            <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">평가손익</span>
              <span className={`text-[13px] font-black ${totalValue - totalPurchase >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                {totalValue - totalPurchase >= 0 ? "+" : ""}{fmt(totalValue - totalPurchase)}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-rose-500 rounded-full" />
              보유 자산 ({items.length})
            </h3>
            <button onClick={() => setIsFormOpen((v) => !v)}
              className="text-[11px] font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full transition-all active:scale-95">
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>

          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-rose-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">카테고리</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, category: c }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                        form.category === c ? "bg-rose-500 text-white" : "bg-slate-50 text-slate-500 border border-slate-100"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "이름", key: "name" as const, type: "text", placeholder: "롤렉스 서브마리너" },
                  { label: "매입일", key: "purchaseDate" as const, type: "date", placeholder: "" },
                  { label: "매입가 (원)", key: "purchasePrice" as const, type: "number", placeholder: "15000000" },
                  { label: "현재 추정가 (원)", key: "currentPrice" as const, type: "number", placeholder: "18000000" },
                  { label: "메모 (선택)", key: "note" as const, type: "text", placeholder: "구매처 등" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className={`space-y-1 ${key === "note" ? "col-span-2" : ""}`}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
                    <input type={type} value={form[key]} placeholder={placeholder}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border border-slate-100 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleAdd}
                className="w-full py-3.5 bg-rose-500 text-white rounded-[18px] text-[13px] font-black active:scale-[0.98] transition-all">
                추가하기
              </button>
            </div>
          )}

          <div className="grid gap-3">
            {items.map((item) => {
              const pnl = item.currentPrice - item.purchasePrice
              return (
                <div key={item.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full">{item.category}</span>
                      </div>
                      <p className="text-[14px] font-black text-slate-800 mt-1">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-300">{item.purchaseDate.replace(/-/g, ".")} 매입</p>
                    </div>
                    <button onClick={() => handleRemove(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">현재 추정가</p>
                      <p className="text-[17px] font-black text-slate-900">{fmt(item.currentPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[13px] font-black ${pnl >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                        {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {items.length === 0 && (
            <div className="py-16 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">등록된 기타 자산이 없습니다</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
