"use client"

import { BarChart3, Activity } from "lucide-react"

interface MarketIndexLogProps {
  mode: "US" | "KR";
}

export function MarketIndexLog({ mode }: MarketIndexLogProps) {
  // 🇺🇸 미국 4대 지수 로그 (다우, 나스닥, S&P 500, 러셀 2000 추가!)
  const usIndices = [
    { name: "다우존스", val: "43,789.34", change: "+0.12%", color: "red", status: "전통 우량 기업 섹터 가동률 정상." },
    { name: "나스닥 100", val: "24,754.25", change: "-0.81%", color: "blue", status: "기술주 섹터 트래픽 과부하 및 조정." },
    { name: "S&P 500", val: "6,832.76", change: "-0.30%", color: "blue", status: "시장 전체 서버 리소스 분산 처리 중." },
    { name: "러셀 2000", val: "2,234.15", change: "+1.25%", color: "red", status: "중소형주 섹터 트래픽 급증 및 자금 유입." } // 💡 러셀 2000 추가
  ]

  // 🇰🇷 국내 주요 지수 로그
  const krIndices = [
    { name: "코스피", val: "2,652.12", change: "+0.45%", color: "red", status: "반도체 메인 프레임 트래픽 회복." },
    { name: "코스닥", val: "870.45", change: "-0.12%", color: "blue", status: "2차전지 가이던스 패치 후 하향 안정화." },
    { name: "코스피 200", val: "348.90", change: "+0.32%", color: "red", status: "대형주 중심의 지수 데이터 양호." }
  ]

  const data = mode === "US" ? usIndices : krIndices

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
            
            {/* 요약 상태 메시지 */}
            <div className="mt-3 flex items-start gap-1.5">
              <span className="text-[9px] font-black text-slate-300 mt-0.5 uppercase">요약</span>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">
                {idx.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}