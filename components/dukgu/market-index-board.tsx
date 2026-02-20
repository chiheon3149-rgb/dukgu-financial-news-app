"use client"

import { BarChart3 } from "lucide-react"

// 💡 입구 선언
interface MarketIndexLogProps {
  mode: "US" | "KR";
}

export function MarketIndexLog({ mode }: MarketIndexLogProps) {
  const usIndices = [
    { name: "나스닥 100", val: "24,754.25", change: "-0.81%", color: "blue", status: "기술주 트래픽 감소." },
    { name: "S&P 500", val: "6,832.76", change: "-0.30%", color: "slate", status: "전체 서버 점검 모드." }
  ]

  const krIndices = [
    { name: "코스피", val: "2,652.12", change: "+0.45%", color: "red", status: "반도체 섹터 트래픽 회복." },
    { name: "코스닥", val: "870.45", change: "-0.12%", color: "blue", status: "2차전지 가이던스 하향." }
  ]

  const data = mode === "US" ? usIndices : krIndices

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 mb-4 border-b pb-2">
        <BarChart3 className="w-5 h-5 text-indigo-500" /> {mode === "US" ? "미국 증시 로그" : "국내 증시 로그"}
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {data.map((idx) => (
          <div key={idx.name} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-slate-700">{idx.name}</span>
              <span className={`font-black text-sm ${idx.change.startsWith('+') ? 'text-rose-600' : 'text-blue-600'}`}>
                {idx.val} ({idx.change})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">[Status] {idx.status}</p>
          </div>
        ))}
      </div>
    </section>
  )
}