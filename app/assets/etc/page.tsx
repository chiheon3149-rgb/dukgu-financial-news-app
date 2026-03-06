"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Package, Trash2, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AssetEmptyState } from "@/components/dukgu/asset-empty-state"
import { AssetSectionHeader } from "@/components/dukgu/asset-section-header"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

// =============================================================================
// 📦 /assets/etc — 기타 자산 (미술품, 시계, 자동차 등)
// =============================================================================

interface EtcItem {
  id: string
  name: string
  category: string
  purchasePrice: number
  currentPrice: number
  purchaseDate: string
  note?: string
}

const today = new Date().toISOString().split("T")[0]
const PRESET_CATEGORIES = ["미술품", "명품/시계", "자동차", "골동품", "와인/위스키", "기타"]
const defaultForm = { name: "", category: "기타", purchasePrice: "", currentPrice: "", purchaseDate: today, note: "" }

function rowToItem(row: Record<string, unknown>): EtcItem {
  return {
    id: row.id as string, name: row.name as string, category: row.category as string,
    purchasePrice: Number(row.purchase_price), currentPrice: Number(row.current_price),
    purchaseDate: row.purchase_date as string, note: (row.note as string) ?? undefined,
  }
}

export default function EtcPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const viewUserId = searchParams.get("viewUserId")
  const isReadOnly = !!viewUserId
  const [items, setItems] = useState<EtcItem[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (!user && !viewUserId) { setIsLoadingData(false); return }
    supabase.from("asset_etc").select("*").eq("user_id", viewUserId ?? user!.id).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("기타 자산을 불러오지 못했습니다.")
        else setItems((data ?? []).map(rowToItem))
        setIsLoadingData(false)
      })
  }, [user, viewUserId])

  const totalValue = useMemo(() => items.reduce((acc, i) => acc + i.currentPrice, 0), [items])
  const totalPurchase = useMemo(() => items.reduce((acc, i) => acc + i.purchasePrice, 0), [items])

  const handleEditClick = (item: EtcItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name, category: item.category,
      purchasePrice: String(item.purchasePrice), currentPrice: String(item.currentPrice),
      purchaseDate: item.purchaseDate, note: item.note ?? "",
    })
    setIsFormOpen(true)
  }

  const handleCancel = () => { setEditingId(null); setForm(defaultForm); setIsFormOpen(false) }

  const handleSave = async () => {
    const pp = parseFloat(form.purchasePrice), cp = parseFloat(form.currentPrice)
    if (!form.name.trim() || isNaN(pp) || isNaN(cp)) {
      toast.error("이름, 매입가, 현재가를 올바르게 입력해주세요."); return
    }
    if (!user) { toast.error("로그인이 필요합니다."); return }

    const payload = {
      name: form.name.trim(), category: form.category,
      purchase_price: pp, current_price: cp,
      purchase_date: form.purchaseDate, note: form.note || null,
    }

    if (editingId) {
      const { data, error } = await supabase.from("asset_etc").update(payload).eq("id", editingId).select().single()
      if (error) { toast.error("수정에 실패했습니다."); return }
      setItems(prev => prev.map(i => i.id === editingId ? rowToItem(data) : i))
      setEditingId(null)
    } else {
      const { data, error } = await supabase.from("asset_etc").insert({ user_id: user.id, ...payload }).select().single()
      if (error) { toast.error("저장에 실패했습니다."); return }
      setItems(prev => [...prev, rowToItem(data)])
    }
    setForm(defaultForm); setIsFormOpen(false)
  }

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("asset_etc").delete().eq("id", id)
    if (error) { toast.error("삭제에 실패했습니다."); return }
    setItems(prev => prev.filter(i => i.id !== id))
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
          {isReadOnly ? (
            <div className="flex items-center px-1">
              <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-rose-500 rounded-full" />보유 자산 ({items.length})
              </h3>
            </div>
          ) : (
            <AssetSectionHeader
              title="보유 자산" count={items.length} barClass="bg-rose-500"
              buttonClass="text-rose-600 bg-rose-50"
              onToggle={() => { if (editingId) handleCancel(); else setIsFormOpen(v => !v) }}
            />
          )}

          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-rose-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-black text-rose-600">{editingId ? "자산 수정" : "자산 추가"}</span>
                <button onClick={handleCancel} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">카테고리</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${form.category === c ? "bg-rose-500 text-white" : "bg-slate-50 text-slate-500 border border-slate-100"}`}>
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
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-bold border border-slate-100 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSave}
                className="w-full py-3.5 bg-rose-500 text-white rounded-[18px] text-[13px] font-black active:scale-[0.98] transition-all">
                {editingId ? "수정 완료" : "추가하기"}
              </button>
            </div>
          )}

          {isLoadingData ? (
            <div className="py-12 text-center"><p className="text-sm font-bold text-slate-300 animate-pulse">불러오는 중...</p></div>
          ) : (
            <div className="grid gap-3">
              {items.map((item) => {
                const pnl = item.currentPrice - item.purchasePrice
                return (
                  <div key={item.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full">{item.category}</span>
                        </div>
                        <p className="text-[14px] font-black text-slate-800 mt-1">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-300">{item.purchaseDate.replace(/-/g, ".")} 매입</p>
                      </div>
                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleEditClick(item)} className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-rose-500 transition-colors">
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
          )}

          {!isLoadingData && items.length === 0 && <AssetEmptyState icon={Package} message="등록된 기타 자산이 없습니다" />}
        </section>
      </main>
    </div>
  )
}
