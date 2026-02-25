"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface MarketIndexLogProps {
  mode: "US" | "KR"
  items?: { name: string; val: string; change: string; status: string }[]
}

const US_SYMBOLS = ["^DJI", "^NDX", "^GSPC", "^RUT"]
const KR_SYMBOLS = ["^KS11", "^KQ11"]

function fmtPrice(symbol: string, price: number): string {
  if (symbol.startsWith("^K")) return price.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtChange(changeRate: number, changeStatus: string): string {
  const prefix = changeStatus === "up" ? "+" : ""
  return `${prefix}${changeRate.toFixed(2)}%`
}

export function MarketIndexLog({ mode, items }: MarketIndexLogProps) {
  const [liveItems, setLiveItems] = useState<{ name: string; val: string; change: string; status: string }[]>([])

  useEffect(() => {
    if (items) return
    const symbols = mode === "US" ? US_SYMBOLS : KR_SYMBOLS
    supabase
      .from("market_indices")
      .select("symbol, name, price, change_rate, change_status")
      .in("symbol", symbols)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const ordered = symbols
          .map((sym) => data.find((r) => r.symbol === sym))
          .filter(Boolean) as typeof data
        setLiveItems(
          ordered.map((r) => ({
            name: r.name,
            val: fmtPrice(r.symbol, r.price),
            change: fmtChange(r.change_rate, r.change_status),
            status: "",
          }))
        )
      })
  }, [mode, items])

  const data = items ?? liveItems

  if (data.length === 0) {
    return (
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-5 h-5 text-emerald-500" />
          <h3 className="font-black text-lg text-slate-800">
            {mode === "US" ? "미국 마켓 지표 로그" : "국내 마켓 지표 로그"}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3, 4].slice(0, mode === "US" ? 4 : 2).map((i) => (
            <div key={i} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 h-14 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-2 font-black text-lg text-slate-800">
          <Activity className="w-5 h-5 text-emerald-500" />
          {mode === "US" ? "미국 마켓 지표 로그" : "국내 마켓 지표 로그"}
        </h3>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-wider">
          Live Status
        </span>
      </div>

      {/* 지수 리스트 */}
      <div className="grid grid-cols-1 gap-3">
        {data.map((idx) => (
          <div key={idx.name} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group hover:border-emerald-100 transition-colors">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[13px] text-slate-600">{idx.name}</span>
              <div className="flex flex-col items-end">
                <span className={`font-black text-sm ${idx.change.startsWith('+') ? 'text-rose-500' : 'text-blue-500'}`}>
                  {idx.val}
                </span>
                <span className={`text-[10px] font-bold ${idx.change.startsWith('+') ? 'text-rose-400' : 'text-blue-400'}`}>
                  {idx.change}
                </span>
              </div>
            </div>

            {/* 요약 상태 메시지 (briefing content에서 올 때만 표시) */}
            {idx.status && (
              <div className="mt-3 flex items-start gap-1.5">
                <span className="text-[9px] font-black text-slate-300 mt-0.5 uppercase">요약</span>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">
                  {idx.status}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
