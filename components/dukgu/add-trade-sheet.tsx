"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"
import type { TradeRecord, TradeType } from "@/types"

// =============================================================================
// ➕ AddTradeSheet
//
// 매매 내역을 추가하는 바텀 시트(Bottom Sheet) 형태의 폼입니다.
// 모바일에서 손엄지로 조작하기 편하도록 하단에서 올라오는 UI를 씁니다.
// =============================================================================

interface AddTradeSheetProps {
  isOpen: boolean
  currency: "KRW" | "USD"
  onClose: () => void
  onSubmit: (trade: Omit<TradeRecord, "id">) => void
}

const today = new Date().toISOString().split("T")[0]

export function AddTradeSheet({ isOpen, currency, onClose, onSubmit }: AddTradeSheetProps) {
  const [type, setType] = useState<TradeType>("buy")
  const [date, setDate] = useState(today)
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [memo, setMemo] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    const p = parseFloat(price)
    const q = parseFloat(quantity)
    if (!date || isNaN(p) || isNaN(q) || p <= 0 || q <= 0) {
      toast.error("날짜, 매매가, 수량을 올바르게 입력해 주세요.")
      return
    }
    onSubmit({ type, date, price: p, quantity: q, memo: memo || undefined })
    // 폼 초기화
    setPrice("")
    setQuantity("")
    setMemo("")
    onClose()
  }

  const estimatedTotal =
    !isNaN(parseFloat(price)) && !isNaN(parseFloat(quantity))
      ? parseFloat(price) * parseFloat(quantity)
      : null

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* 시트 본체 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl max-w-md mx-auto px-6 pt-5 pb-10 animate-in slide-in-from-bottom-4 duration-300">

        {/* 핸들 + 헤더 */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[17px] font-black text-slate-900">매매 내역 추가</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 매수 / 매도 토글 */}
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 mb-5">
          {(["buy", "sell"] as TradeType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all ${
                type === t
                  ? t === "buy"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-rose-500 text-white shadow-sm"
                  : "text-slate-400"
              }`}
            >
              {t === "buy" ? "▲ 매수" : "▼ 매도"}
            </button>
          ))}
        </div>

        {/* 폼 필드들 */}
        <div className="space-y-3">
          <FormField label="매매 일자">
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[14px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={`매매가 (${currency === "KRW" ? "원" : "USD"})`}>
              <input
                type="number"
                placeholder={currency === "KRW" ? "70,000" : "230.50"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[14px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              />
            </FormField>
            <FormField label="수량 (주)">
              <input
                type="number"
                placeholder="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[14px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              />
            </FormField>
          </div>

          {/* 실시간 예상 금액 계산 */}
          {estimatedTotal !== null && (
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-600">예상 총액</span>
              <span className="text-[14px] font-black text-emerald-700">
                {currency === "KRW"
                  ? `${Math.round(estimatedTotal).toLocaleString("ko-KR")}원`
                  : `$${estimatedTotal.toFixed(2)}`}
              </span>
            </div>
          )}

          <FormField label="메모 (선택)">
            <input
              type="text"
              placeholder="분할 매수, 배당 재투자 등"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[14px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
            />
          </FormField>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[20px] text-[14px] font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          내역 추가
        </button>
      </div>
    </>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
        {label}
      </label>
      {children}
    </div>
  )
}
