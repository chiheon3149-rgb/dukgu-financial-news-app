"use client"

import { useState, useMemo } from "react"
import { Landmark, Plus, Trash2, Pencil } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import type { RealEstateHolding } from "@/types"

// =============================================================================
// 🏠 /assets/realestate — 부동산 보유현황
// =============================================================================

const STORAGE_KEY = "dukgu:realestate-holdings"

function loadHoldings(): RealEstateHolding[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHoldings(items: RealEstateHolding[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

const today = new Date().toISOString().split("T")[0]

export default function RealEstatePage() {
  const [holdings, setHoldings] = useState<RealEstateHolding[]>(() => loadHoldings())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    address: "",
    acquisitionPrice: "",
    acquisitionDate: today,
    currentEstimatedPrice: "",
  })

  const totalValue = useMemo(() =>
    holdings.reduce((acc, h) => acc + (h.currentEstimatedPrice ?? h.acquisitionPrice), 0),
    [holdings]
  )

  const totalAcquisition = useMemo(() =>
    holdings.reduce((acc, h) => acc + h.acquisitionPrice, 0),
    [holdings]
  )

  const totalPnl = totalValue - totalAcquisition

  const handleAdd = () => {
    const acq = parseFloat(form.acquisitionPrice)
    const est = form.currentEstimatedPrice ? parseFloat(form.currentEstimatedPrice) : null
    if (!form.name.trim() || !form.acquisitionDate || isNaN(acq) || acq <= 0) {
      alert("이름, 취득일, 취득가액을 올바르게 입력해 주세요.")
      return
    }
    const newItem: RealEstateHolding = {
      id: `re-${Date.now()}`,
      name: form.name.trim(),
      address: form.address.trim(),
      acquisitionPrice: acq,
      acquisitionDate: form.acquisitionDate,
      currentEstimatedPrice: est,
      priceUpdatedAt: est ? today : null,
    }
    const updated = [...holdings, newItem]
    setHoldings(updated)
    saveHoldings(updated)
    setForm({ name: "", address: "", acquisitionPrice: "", acquisitionDate: today, currentEstimatedPrice: "" })
    setIsFormOpen(false)
  }

  const handleRemove = (id: string) => {
    const updated = holdings.filter((h) => h.id !== id)
    setHoldings(updated)
    saveHoldings(updated)
  }

  const fmt = (n: number) => `${Math.round(n / 10000).toLocaleString("ko-KR")}만원`
  const fmtFull = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader showBack title={
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-indigo-500" />
          <span className="text-lg font-black text-slate-900 tracking-tight">부동산 보유현황</span>
        </div>
      } />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        {/* 총 요약 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/60 rounded-full -mr-8 -mt-8 blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">부동산 총 평가금액</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{fmt(totalValue)}</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: "총 취득가액", value: fmt(totalAcquisition) },
              { label: "평가손익", value: `${totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)}`, color: totalPnl > 0 ? "text-rose-500" : totalPnl < 0 ? "text-blue-500" : "text-slate-700" },
              { label: "보유 건수", value: `${holdings.length}건` },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center bg-slate-50 rounded-2xl p-2.5 gap-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
                <span className={`text-[12px] font-black ${color ?? "text-slate-700"}`}>{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 부동산 목록 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              보유 부동산 ({holdings.length}건)
            </h3>
            <button
              onClick={() => setIsFormOpen((v) => !v)}
              className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
            >
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>

          {/* 추가 폼 */}
          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-indigo-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {[
                { label: "부동산 이름 (예: 서울 아파트)", key: "name" as const, type: "text", placeholder: "강남 아파트" },
                { label: "주소 (선택)", key: "address" as const, type: "text", placeholder: "서울시 강남구..." },
                { label: "취득 일자", key: "acquisitionDate" as const, type: "date", placeholder: "" },
                { label: "취득 가액 (원)", key: "acquisitionPrice" as const, type: "number", placeholder: "500000000" },
                { label: "현재 시세 (원, 선택)", key: "currentEstimatedPrice" as const, type: "number", placeholder: "650000000" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
                  <input type={type} value={form[key]} placeholder={placeholder}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                  />
                </div>
              ))}
              <button onClick={handleAdd}
                className="w-full py-3.5 bg-indigo-500 text-white rounded-[18px] text-[13px] font-black transition-all active:scale-[0.98]">
                추가하기
              </button>
            </div>
          )}

          {/* 부동산 카드 목록 */}
          <div className="grid gap-3">
            {holdings.map((h) => {
              const current = h.currentEstimatedPrice ?? h.acquisitionPrice
              const pnl = current - h.acquisitionPrice
              const rate = h.acquisitionPrice > 0 ? (pnl / h.acquisitionPrice) * 100 : 0
              return (
                <div key={h.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-indigo-500 shrink-0" />
                        <h4 className="text-[15px] font-black text-slate-800 truncate">{h.name}</h4>
                      </div>
                      {h.address && <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate">{h.address}</p>}
                      <p className="text-[10px] font-bold text-slate-300 mt-1">취득일 {h.acquisitionDate.replace(/-/g, ".")}</p>
                    </div>
                    <button onClick={() => handleRemove(h.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400">현재 시세</p>
                      <p className="text-[18px] font-black text-slate-900">{fmt(current)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[13px] font-black ${pnl >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                        {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                      </p>
                      <p className={`text-[10px] font-bold ${pnl >= 0 ? "text-rose-400" : "text-blue-400"}`}>
                        {rate >= 0 ? "+" : ""}{rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {!h.currentEstimatedPrice && (
                    <p className="text-[10px] font-bold text-slate-300 mt-2 flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> 현재 시세를 직접 입력하면 손익이 계산됩니다
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {holdings.length === 0 && (
            <div className="py-16 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
              <Landmark className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">보유 부동산이 없습니다</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
