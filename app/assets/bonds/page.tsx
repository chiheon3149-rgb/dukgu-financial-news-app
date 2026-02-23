"use client"

import { useState, useMemo } from "react"
import { ScrollText, Plus, Trash2 } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"

// =============================================================================
// 📜 /assets/bonds — 채권 보유현황
// =============================================================================

interface BondItem {
  id: string
  name: string
  issuer: string       // 발행기관
  faceValue: number    // 액면가 (원)
  quantity: number     // 보유 수량
  couponRate: number   // 쿠폰금리 (%)
  purchasePrice: number // 매입단가 (원)
  maturityDate: string // 만기일
  purchaseDate: string // 매입일
}

const STORAGE_KEY = "dukgu:bond-holdings"
function load(): BondItem[] {
  if (typeof window === "undefined") return []
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function save(items: BondItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

const today = new Date().toISOString().split("T")[0]

export default function BondsPage() {
  const [items, setItems] = useState<BondItem[]>(() => load())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState({
    name: "", issuer: "", faceValue: "", quantity: "",
    couponRate: "", purchasePrice: "", maturityDate: "", purchaseDate: today,
  })

  const totalInvested = useMemo(() => items.reduce((acc, i) => acc + i.purchasePrice * i.quantity, 0), [items])
  const totalFaceValue = useMemo(() => items.reduce((acc, i) => acc + i.faceValue * i.quantity, 0), [items])

  // 연간 쿠폰 수익
  const annualCoupon = useMemo(() =>
    items.reduce((acc, i) => acc + i.faceValue * i.quantity * (i.couponRate / 100), 0),
    [items]
  )

  const handleAdd = () => {
    const fv = parseFloat(form.faceValue)
    const qty = parseFloat(form.quantity)
    const rate = parseFloat(form.couponRate)
    const pp = parseFloat(form.purchasePrice)
    if (!form.name.trim() || isNaN(fv) || isNaN(qty) || isNaN(rate) || isNaN(pp) || !form.maturityDate) {
      alert("모든 필수 항목을 올바르게 입력해주세요.")
      return
    }
    const updated = [...items, {
      id: `bd-${Date.now()}`, name: form.name.trim(), issuer: form.issuer.trim(),
      faceValue: fv, quantity: qty, couponRate: rate, purchasePrice: pp,
      maturityDate: form.maturityDate, purchaseDate: form.purchaseDate,
    }]
    setItems(updated); save(updated)
    setForm({ name: "", issuer: "", faceValue: "", quantity: "", couponRate: "", purchasePrice: "", maturityDate: "", purchaseDate: today })
    setIsFormOpen(false)
  }

  const handleRemove = (id: string) => {
    const updated = items.filter((i) => i.id !== id); setItems(updated); save(updated)
  }

  const fmt = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`
  const daysLeft = (d: string) => Math.max(0, Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader showBack title={
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-indigo-500" />
          <span className="text-lg font-black text-slate-900 tracking-tight">채권 보유현황</span>
        </div>
      } />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/60 rounded-full -mr-8 -mt-8 blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">채권 총 투자금액</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{fmt(totalInvested)}</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: "총 액면가", value: fmt(totalFaceValue) },
              { label: "연간 쿠폰", value: fmt(annualCoupon), color: "text-indigo-500" },
              { label: "보유 채권", value: `${items.length}종` },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center bg-slate-50 rounded-2xl p-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                <span className={`text-[12px] font-black ${color ?? "text-slate-700"}`}>{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              보유 채권 ({items.length})
            </h3>
            <button onClick={() => setIsFormOpen((v) => !v)}
              className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-full transition-all active:scale-95">
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>

          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-indigo-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "채권명", key: "name", type: "text", placeholder: "국고채 3년물" },
                  { label: "발행기관", key: "issuer", type: "text", placeholder: "기획재정부" },
                  { label: "액면가 (원)", key: "faceValue", type: "number", placeholder: "10000" },
                  { label: "수량", key: "quantity", type: "number", placeholder: "100" },
                  { label: "쿠폰금리 (%)", key: "couponRate", type: "number", placeholder: "3.5" },
                  { label: "매입단가 (원)", key: "purchasePrice", type: "number", placeholder: "9800" },
                  { label: "매입일", key: "purchaseDate", type: "date", placeholder: "" },
                  { label: "만기일", key: "maturityDate", type: "date", placeholder: "" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
                    <input type={type} value={form[key as keyof typeof form]} placeholder={placeholder}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleAdd}
                className="w-full py-3.5 bg-indigo-500 text-white rounded-[18px] text-[13px] font-black active:scale-[0.98] transition-all">
                추가하기
              </button>
            </div>
          )}

          <div className="grid gap-3">
            {items.map((item) => {
              const coupon = item.faceValue * item.quantity * (item.couponRate / 100)
              const pnl = (item.faceValue - item.purchasePrice) * item.quantity
              const left = daysLeft(item.maturityDate)
              return (
                <div key={item.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[14px] font-black text-slate-800">{item.name}</p>
                      <p className="text-[11px] font-bold text-slate-400">{item.issuer}</p>
                    </div>
                    <button onClick={() => handleRemove(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-[9px] font-black text-slate-400">투자금액</p><p className="text-[12px] font-black text-slate-700">{fmt(item.purchasePrice * item.quantity)}</p></div>
                    <div><p className="text-[9px] font-black text-slate-400">쿠폰금리</p><p className="text-[12px] font-black text-indigo-500">{item.couponRate}%</p></div>
                    <div><p className="text-[9px] font-black text-slate-400">연간쿠폰</p><p className="text-[12px] font-black text-indigo-500">{fmt(coupon)}</p></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-300">
                    <span>만기 {item.maturityDate.replace(/-/g, ".")}</span>
                    <span className={left <= 90 ? "text-rose-400" : "text-slate-400"}>D-{left}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {items.length === 0 && (
            <div className="py-16 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
              <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">보유 채권이 없습니다</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
