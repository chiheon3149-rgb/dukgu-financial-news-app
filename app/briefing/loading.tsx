export default function BriefingLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6 space-y-8">
      {/* 1. 상단 헤더 영역 뼈대 */}
      <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse mb-8" />

      {/* 2. 검색창 및 필터 뼈대 */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-12 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      </div>

      {/* 3. 날짜 그룹별 반복 뼈대 */}
      {[1, 2].map((group) => (
        <section key={group} className="space-y-4">
          {/* 날짜 표시줄 뼈대 */}
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse ml-1" />
          
          <div className="space-y-4">
            {[1, 2].map((card) => (
              <div 
                key={card} 
                className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4"
              >
                {/* 카드 상단: 타임스탬프 뼈대 */}
                <div className="flex gap-2">
                  <div className="h-4 w-12 bg-slate-100 rounded-full animate-pulse" />
                  <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
                </div>

                {/* 카드 중간: 헤드라인 뼈대 (두 줄 느낌) */}
                <div className="space-y-2">
                  <div className="h-5 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-5 w-2/3 bg-slate-100 rounded animate-pulse" />
                </div>

                {/* 🚀 핵심: 하단 2x2 지표 그리드 뼈대 */}
                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}