"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import type { CryptoHolding } from "@/types"

// =============================================================================
// 🪙 AddCryptoSheet — 코인 추가 바텀시트
// =============================================================================

interface AddCryptoSheetProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (holding: CryptoHolding) => void
}

const POPULAR_COINS: Omit<CryptoHolding, "trades">[] = [
  { symbol: "BTC-USD", name: "비트코인", unit: "BTC" },
  { symbol: "ETH-USD", name: "이더리움", unit: "ETH" },
  { symbol: "XRP-USD", name: "리플", unit: "XRP" },
  { symbol: "SOL-USD", name: "솔라나", unit: "SOL" },
  { symbol: "ADA-USD", name: "에이다", unit: "ADA" },
  { symbol: "DOGE-USD", name: "도지코인", unit: "DOGE" },
  { symbol: "BNB-USD", name: "바이낸스코인", unit: "BNB" },
  { symbol: "AVAX-USD", name: "아발란체", unit: "AVAX" },
  { symbol: "DOT-USD", name: "폴카닷", unit: "DOT" },
  { symbol: "LINK-USD", name: "체인링크", unit: "LINK" },
]

const COIN_EMOJI: Record<string, string> = {
  "BTC-USD": "₿", "ETH-USD": "Ξ", "XRP-USD": "✕", "SOL-USD": "◎",
  "ADA-USD": "₳", "DOGE-USD": "Ð", "BNB-USD": "B", "AVAX-USD": "A",
  "DOT-USD": "◆", "LINK-USD": "⬡",
}

export function AddCryptoSheet({ isOpen, onClose, onAdd }: AddCryptoSheetProps) {
  const [customSymbol, setCustomSymbol] = useState("")
  const [customName, setCustomName] = useState("")
  const [customUnit, setCustomUnit] = useState("")
  const [showCustom, setShowCustom] = useState(false)

  if (!isOpen) return null

  const handleAddPopular = (coin: Omit<CryptoHolding, "trades">) => {
    onAdd({ ...coin, trades: [] })
    onClose()
  }

  const handleAddCustom = () => {
    if (!customSymbol.trim() || !customUnit.trim()) return
    const symbol = customSymbol.trim().toUpperCase()
    const unit = customUnit.trim().toUpperCase()
    const name = customName.trim() || symbol
    onAdd({ symbol: symbol.includes("-") ? symbol : `${symbol}-USD`, name, unit, trades: [] })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div
        className="fixed bottom-[60px] left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300 flex flex-col"
        style={{ height: "72dvh" }}
      >
        <div className="px-6 pt-5 pb-4 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-black text-slate-900">코인 추가</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-3">
          {/* 인기 코인 목록 */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">인기 코인</p>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_COINS.map((coin) => (
              <button
                key={coin.symbol}
                onClick={() => handleAddPopular(coin)}
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50 transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-black text-amber-600">
                  {COIN_EMOJI[coin.symbol] ?? coin.unit[0]}
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-black text-slate-800">{coin.unit}</p>
                  <p className="text-[10px] font-bold text-slate-400">{coin.name}</p>
                </div>
                <Plus className="w-4 h-4 text-slate-300 group-hover:text-amber-500 ml-auto transition-colors" />
              </button>
            ))}
          </div>

          {/* 직접 입력 */}
          <button
            onClick={() => setShowCustom((v) => !v)}
            className="w-full py-3 text-[12px] font-black text-slate-400 hover:text-amber-500 transition-colors"
          >
            {showCustom ? "▲ 직접 입력 닫기" : "+ 다른 코인 직접 입력"}
          </button>

          {showCustom && (
            <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              {[
                { label: "심볼 (예: BTC-USD)", key: "customSymbol" as const, value: customSymbol, setter: setCustomSymbol },
                { label: "코인 이름 (예: 비트코인)", key: "customName" as const, value: customName, setter: setCustomName },
                { label: "단위 (예: BTC)", key: "customUnit" as const, value: customUnit, setter: setCustomUnit },
              ].map(({ label, key, value, setter }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl text-[13px] font-bold border border-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              ))}
              <button
                onClick={handleAddCustom}
                className="w-full py-3 bg-amber-500 text-white rounded-xl text-[13px] font-black active:scale-95 transition-all"
              >
                추가하기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
