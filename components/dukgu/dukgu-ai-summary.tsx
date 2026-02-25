"use client"

import { Sparkles } from "lucide-react"

// 💡 덕구만의 시그니처 민트 요약 박스!
export function DukguAiSummary({ summary }: { summary: string }) {
  return (
    <div className="bg-emerald-50/40 rounded-2xl p-5 mb-8 border border-emerald-100/60 relative overflow-hidden group">
      {/* 배경 장식: 덕구 아이콘을 살짝 더 귀엽게 배치 */}
      <div className="absolute -top-1 -right-1 p-2 opacity-10 transition-transform group-hover:scale-110 duration-500">
        <span className="text-5xl">🐱</span>
      </div>

      {/* 헤더: 민트색 포인트와 반짝이 아이콘 */}
      <p className="text-[11px] font-black text-emerald-600 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 fill-emerald-500" />
        덕구의 3줄 요약냥!
      </p>

      {/* 요약 본문: 가독성을 위해 텍스트 색상을 깊은 민트그레이로 조정 */}
      <p className="text-[14px] text-slate-800 leading-[1.7] font-bold break-keep relative z-10">
        {summary}
      </p>

      {/* 하단 장식선 (디자인 디테일) */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-200/0 via-emerald-200/50 to-emerald-200/0" />
    </div>
  )
}