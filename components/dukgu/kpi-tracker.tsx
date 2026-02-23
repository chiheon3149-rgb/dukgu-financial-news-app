"use client"

import { Search } from "lucide-react"
import { ICON_MAPPER } from "@/lib/constants/icons"

// 💡 1. 'mode'를 받을 수 있게 입구(Interface)를 만듭니다.
interface KpiTrackerProps {
  mode: "US" | "KR"
  items?: KpiItemProps[]
}

interface KpiItemProps {
  label: string;
  value: string;
  change: string;
  status: string;
  statusColor: "rose" | "blue" | "amber" | "slate";
}

function KpiItem({ label, value, change, status, statusColor }: KpiItemProps) {
  const colorMap = {
    rose: "text-rose-600 bg-rose-50",
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
    slate: "text-slate-500 bg-slate-50",
  }

  const getIcon = (text: string) => {
    if (text.includes("달러")) return ICON_MAPPER["달러"]
    if (text.includes("엔")) return ICON_MAPPER["엔화"]
    if (text.includes("위안")) return ICON_MAPPER["위안"]
    if (text.includes("원유")) return ICON_MAPPER["원유"]
    if (text.includes("VIX")) return ICON_MAPPER["변동성"]
    if (text.includes("Fear")) return ICON_MAPPER["심리"]
    return "💰"
  }

  return (
    <div className="flex justify-between items-center py-1 group">
      <div className="flex gap-3 items-start">
        <div className="text-xl mt-0.5 grayscale group-hover:grayscale-0 transition-all">
          {getIcon(label)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 text-sm">{label}</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${colorMap[statusColor]}`}>
              {change}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{status}</p>
        </div>
      </div>
      <span className="font-black text-slate-800 text-lg">{value}</span>
    </div>
  )
}

// 💡 2. 'mode'를 받아와서 데이터 장부를 선택합니다.
export function KpiTracker({ mode, items }: KpiTrackerProps) {
  const usKpi: KpiItemProps[] = [
    { label: "VIX (변동성 지수)", value: "19.80", change: "+1.2%", status: "⚠️ 주의: 옵션 시장 헤지 증가", statusColor: "rose" },
    { label: "원/달러 환율", value: "1,405.50", change: "+3.0원", status: "🟡 관망: 환차익 인프라 유지", statusColor: "rose" },
    { label: "WTI 원유 (유가)", value: "$80.45", change: "+2.1%", status: "🚨 공급망 리스크 주의", statusColor: "rose" }
  ]

  const krKpi: KpiItemProps[] = [
    { label: "원/엔 환율", value: "980.50", change: "-1.5원", status: "🔵 양호: 엔저 현상 지속", statusColor: "blue" },
    { label: "CD금리(91일)", value: "3.52%", change: "+0.01%", status: "⚪ 중립: 시장 유동성 보합", statusColor: "slate" },
    { label: "Fear & Greed", value: "45/100", change: "Neutral", status: "⚪ 중립: 투자 심리 안정화", statusColor: "slate" }
  ]

  const data = items ?? (mode === "US" ? usKpi : krKpi)

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 mb-4 border-b pb-2">
        <Search className="w-5 h-5 text-blue-500" /> {mode === "US" ? "Global 지표" : "K-Market 지표"}
      </h3>
      <div className="space-y-4 divide-y divide-slate-50">
        {data.map((item, idx) => (
          <div key={idx} className={idx === 0 ? "" : "pt-4"}>
            <KpiItem {...item} />
          </div>
        ))}
      </div>
    </section>
  )
}