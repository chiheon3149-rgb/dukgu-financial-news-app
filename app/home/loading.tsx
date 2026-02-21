export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6 space-y-8">
      {/* 1. 상단 헤더 & 프로필 영역 뼈대 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
      </div>

      {/* 2. 메인 자산 카드 뼈대 (우리가 다듬은 미니멀 카드 스타일) */}
      <div className="h-32 w-full bg-white rounded-[28px] border border-slate-100 p-6 space-y-4 shadow-sm">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-6 w-12 bg-slate-100 rounded-full animate-pulse" />
        </div>
        <div className="h-10 w-48 bg-slate-100 rounded animate-pulse" />
      </div>

      {/* 3. 오늘 세 줄 브리핑 섹션 뼈대 */}
      <section className="space-y-4">
        <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="h-24 w-full bg-white rounded-[24px] border border-slate-100 p-5 flex gap-4 items-center shadow-sm"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 하단 탭 바 영역 (공간만 차지하도록) */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 px-8 flex justify-between items-center">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-8 h-8 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}