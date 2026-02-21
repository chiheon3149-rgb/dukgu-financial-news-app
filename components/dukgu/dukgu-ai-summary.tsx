"use client"

// 💡 덕구만의 시그니처 요약 박스를 부품으로 만듭니다.
export function DukguAiSummary({ summary }: { summary: string }) {
  return (
    <div className="bg-blue-50/50 rounded-2xl p-5 mb-8 border border-blue-100/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <span className="text-4xl">🐱</span>
      </div>
      <p className="text-xs font-black text-blue-600 mb-2 flex items-center gap-1.5">
         덕구의 3줄 요약냥!
      </p>
      <p className="text-[13px] text-slate-700 leading-relaxed font-bold break-keep">
        {summary}
      </p>
    </div>
  )
}