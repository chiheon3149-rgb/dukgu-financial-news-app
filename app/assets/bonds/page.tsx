"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ScrollText, Trash2, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AssetEmptyState } from "@/components/dukgu/asset-empty-state"
import { AssetSectionHeader } from "@/components/dukgu/asset-section-header"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

interface BondItem {
  id: string
  name: string
  issuer: string
  faceValue: number
  quantity: number
  couponRate: number
  purchasePrice: number
  maturityDate: string
  purchaseDate: string
}

const today = new Date().toISOString().split("T")[0]
const defaultForm = {
  name: "", issuer: "", faceValue: "", quantity: "",
  couponRate: "", purchasePrice: "", maturityDate: "", purchaseDate: today,
}

function rowToItem(row: Record<string, unknown>): BondItem {
  return {
    id: row.id as string, name: row.name as string, issuer: (row.issuer as string) ?? "",
    faceValue: Number(row.face_value), quantity: Number(row.quantity),
    couponRate: Number(row.coupon_rate), purchasePrice: Number(row.purchase_price),
    maturityDate: row.maturity_date as string, purchaseDate: row.purchase_date as string,
  }
}

export default function BondsPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const viewUserId = searchParams.get("viewUserId")
  const isReadOnly = !!viewUserId
  const [items, setItems] = useState<BondItem[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (!user && !viewUserId) { setIsLoadingData(false); return }
    supabase.from("asset_bonds").select("*").eq("user_id", viewUserId ?? user!.id).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("채권 정보를 불러오지 못했습니다.")
        else setItems((data ?? []).map(rowToItem))
        setIsLoadingData(false)
      })
  }, [user, viewUserId])

  const totalInvested = useMemo(() => items.reduce((acc, i) => acc + i.purchasePrice * i.quantity, 0), [items])
  const totalFaceValue = useMemo(() => items.reduce((acc, i) => acc + i.faceValue * i.quantity, 0), [items])
  const annualCoupon = useMemo(() => items.reduce((acc, i) => acc + i.faceValue * i.quantity * (i.couponRate / 100), 0), [items])

  const handleEditClick = (item: BondItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name, issuer: item.issuer,
      faceValue: String(item.faceValue), quantity: String(item.quantity),
      couponRate: String(item.couponRate), purchasePrice: String(item.purchasePrice),
      maturityDate: item.maturityDate, purchaseDate: item.purchaseDate,
    })
    setIsFormOpen(true)
  }

  const handleCancel = () => { setEditingId(null); setForm(defaultForm); setIsFormOpen(false) }

  const handleSave = async () => {
    const fv = parseFloat(form.faceValue), qty = parseFloat(form.quantity)
    const rate = parseFloat(form.couponRate), pp = parseFloat(form.purchasePrice)
    if (!form.name.trim() || isNaN(fv) || isNaN(qty) || isNaN(rate) || isNaN(pp) || !form.maturityDate) {
      toast.error("모든 필수 항목을 올바르게 입력해주세요."); return
    }
    if (!user) { toast.error("로그인이 필요합니다."); return }

    const payload = {
      name: form.name.trim(), issuer: form.issuer.trim(),
      face_value: fv, quantity: qty, coupon_rate: rate, purchase_price: pp,
      maturity_date: form.maturityDate, purchase_date: form.purchaseDate,
    }

    if (editingId) {
      const { data, error } = await supabase.from("asset_bonds").update(payload).eq("id", editingId).select().single()
      if (error) { toast.error("수정에 실패했습니다."); return }
      setItems(prev => prev.map(i => i.id === editingId ? rowToItem(data) : i))
      setEditingId(null)
    } else {
      const { data, error } = await supabase.from("asset_bonds").insert({ user_id: user.id, ...payload }).select().single()
      if (error) { toast.error("저장에 실패했습니다."); return }
      setItems(prev => [...prev, rowToItem(data)])
    }
    setForm(defaultForm); setIsFormOpen(false)
  }

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("asset_bonds").delete().eq("id", id)
    if (error) { toast.error("삭제에 실패했습니다."); return }
    setItems(prev => prev.filter(i => i.id !== id))
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
          {isReadOnly ? (
            <div className="flex items-center px-1">
              <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />보유 채권 ({items.length})
              </h3>
            </div>
          ) : (
            <AssetSectionHeader
              title="보유 채권" count={items.length} barClass="bg-indigo-500"
              buttonClass="text-indigo-600 bg-indigo-50"
              onToggle={() => { if (editingId) handleCancel(); else setIsFormOpen(v => !v) }}
            />
          )}

          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-indigo-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-black text-indigo-600">{editingId ? "채권 수정" : "채권 추가"}</span>
                <button onClick={handleCancel} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
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
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSave}
                className="w-full py-3.5 bg-indigo-500 text-white rounded-[18px] text-[13px] font-black active:scale-[0.98] transition-all">
                {editingId ? "수정 완료" : "추가하기"}
              </button>
            </div>
          )}

          {isLoadingData ? (
            <div className="py-12 text-center"><p className="text-sm font-bold text-slate-300 animate-pulse">불러오는 중...</p></div>
          ) : (
            <div className="grid gap-3">
              {items.map((item) => {
                const coupon = item.faceValue * item.quantity * (item.couponRate / 100)
                const left = daysLeft(item.maturityDate)
                return (
                  <div key={item.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[14px] font-black text-slate-800">{item.name}</p>
                        <p className="text-[11px] font-bold text-slate-400">{item.issuer}</p>
                      </div>
                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleEditClick(item)} className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-500 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toast(`'${item.name}' 을(를) 삭제하시겠습니까?`, {
                            action: { label: "삭제", onClick: () => handleRemove(item.id) },
                            cancel: { label: "취소", onClick: () => {} },
                          })} className="p-2 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
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
          )}

          {!isLoadingData && items.length === 0 && <AssetEmptyState icon={ScrollText} message="보유 채권이 없습니다" />}
        </section>
      </main>
    </div>
  )
}
