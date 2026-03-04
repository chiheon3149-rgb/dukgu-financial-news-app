"use client"

import { useState, useMemo } from "react"
import { Building2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useLocalItems } from "@/hooks/use-local-items"
import { AssetEmptyState } from "@/components/dukgu/asset-empty-state"
import { AssetSectionHeader } from "@/components/dukgu/asset-section-header"

interface SavingsItem {
  id: string
  type: "savings" | "deposit"
  bankName: string
  productName: string
  principal: number
  annualRate: number
  startDate: string
  endDate: string
  monthlyAmount?: number
}

const today = new Date().toISOString().split("T")[0]

export default function SavingsPage() {
  const { items, addItem, removeItem } = useLocalItems<SavingsItem>("dukgu:savings-holdings")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState({
    type: "deposit" as "savings" | "deposit",
    bankName: "", productName: "", principal: "", annualRate: "",
    startDate: today, endDate: "", monthlyAmount: "",
  })

  const totalPrincipal = useMemo(() => items.reduce((acc, i) => acc + i.principal, 0), [items])

  const calcInterest = (item: SavingsItem): number => {
    const start = new Date(item.startDate)
    const end = new Date(item.endDate)
    const months = Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()))
    return Math.round(item.principal * (item.annualRate / 100) * (months / 12))
  }

  const totalExpectedInterest = useMemo(() => items.reduce((acc, i) => acc + calcInterest(i), 0), [items])

  const handleAdd = () => {
    const principal = parseFloat(form.principal)
    const rate = parseFloat(form.annualRate)
    if (!form.bankName.trim() || !form.startDate || !form.endDate || isNaN(principal) || isNaN(rate)) {
      toast.error("은행명, 원금, 이자율, 날짜를 올바르게 입력해주세요."); return
    }
    addItem({
      id: `sv-${Date.now()}`,
      type: form.type,
      bankName: form.bankName.trim(),
      productName: form.productName.trim() || (form.type === "deposit" ? "정기예금" : "정기적금"),
      principal,
      annualRate: rate,
      startDate: form.startDate,
      endDate: form.endDate,
      monthlyAmount: form.monthlyAmount ? parseFloat(form.monthlyAmount) : undefined,
    })
    setForm({ type: "deposit", bankName: "", productName: "", principal: "", annualRate: "", startDate: today, endDate: "", monthlyAmount: "" })
    setIsFormOpen(false)
  }

  const fmt = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`
  const daysLeft = (endDate: string) => Math.max(0, Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader showBack title={
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-500" />
          <span className="text-lg font-black text-slate-900 tracking-tight">예금 · 적금</span>
        </div>
      } />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/60 rounded-full -mr-8 -mt-8 blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">예·적금 총 원금</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{fmt(totalPrincipal)}</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">예상 이자</span>
              <span className="text-[14px] font-black text-blue-500">{fmt(totalExpectedInterest)}</span>
            </div>
            <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">상품 수</span>
              <span className="text-[14px] font-black text-slate-700">{items.length}개</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <AssetSectionHeader
            title="보유 상품"
            count={items.length}
            barClass="bg-blue-500"
            buttonClass="text-blue-600 bg-blue-50"
            onToggle={() => setIsFormOpen(v => !v)}
          />

          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-blue-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                {(["deposit", "savings"] as const).map((t) => (
                  <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-xl text-[12px] font-black transition-all ${
                      form.type === t ? "bg-blue-500 text-white shadow-sm" : "text-slate-400"
                    }`}>
                    {t === "deposit" ? "예금" : "적금"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "은행명", key: "bankName" as const, type: "text", placeholder: "KB국민은행" },
                  { label: "상품명 (선택)", key: "productName" as const, type: "text", placeholder: "KB정기예금" },
                  { label: "원금 (원)", key: "principal" as const, type: "number", placeholder: "10000000" },
                  { label: "연이율 (%)", key: "annualRate" as const, type: "number", placeholder: "3.5" },
                  { label: "가입일", key: "startDate" as const, type: "date", placeholder: "" },
                  { label: "만기일", key: "endDate" as const, type: "date", placeholder: "" },
                  ...(form.type === "savings" ? [{ label: "월납입액 (원)", key: "monthlyAmount" as const, type: "number", placeholder: "300000" }] : []),
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
                    <input type={type} value={form[key]} placeholder={placeholder}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleAdd}
                className="w-full py-3.5 bg-blue-500 text-white rounded-[18px] text-[13px] font-black transition-all active:scale-[0.98]">
                추가하기
              </button>
            </div>
          )}

          <div className="grid gap-3">
            {items.map((item) => {
              const interest = calcInterest(item)
              const left = daysLeft(item.endDate)
              return (
                <div key={item.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          item.type === "deposit" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {item.type === "deposit" ? "예금" : "적금"}
                        </span>
                        <p className="text-[14px] font-black text-slate-800">{item.bankName}</p>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{item.productName}</p>
                    </div>
                    <button onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-3 gap-2">
                    {[
                      { label: "원금", value: fmt(item.principal) },
                      { label: "연이율", value: `${item.annualRate}%` },
                      { label: "예상이자", value: fmt(interest), color: "text-blue-500" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center">
                        <p className="text-[9px] font-black text-slate-400">{label}</p>
                        <p className={`text-[12px] font-black ${color ?? "text-slate-700"}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-300">
                    <span>{item.startDate.replace(/-/g, ".")} ~ {item.endDate.replace(/-/g, ".")}</span>
                    <span className={left <= 30 ? "text-rose-400" : "text-slate-400"}>D-{left}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {items.length === 0 && (
            <AssetEmptyState icon={Building2} message="등록된 예·적금이 없습니다" />
          )}
        </section>
      </main>
    </div>
  )
}
