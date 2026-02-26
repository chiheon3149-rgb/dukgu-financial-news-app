"use client"

import { useRouter } from "next/navigation"
import { Zap, Calendar } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { BriefingLogCard } from "@/components/dukgu/briefing-log-card"
import { BriefingSearchBar } from "@/components/dukgu/briefing-search-bar"
import { useBriefingLogs } from "@/hooks/use-briefing-logs"
// 💡 [추가] 방금 만드신 예쁜 광고 배너를 불러옵니다 (경로는 실제 파일 위치에 맞게 수정해주세요!)
import { AdBanner } from "@/components/dukgu/ad-banner" 

// =============================================================================
// ⚡ BriefingPage
//
// 변경 사항:
// 1. 하드코딩된 dailyLogs 배열 + 내부 useMemo 필터 → useBriefingLogs() 훅으로 이전
// 2. page.tsx 가 데이터를 알 필요가 없어졌습니다. 조립만 합니다.
// 3. 최상단 가로 밀림 현상 방지 (w-full overflow-x-hidden)
// 4. 검색바 상단에 네이티브 애드 배너 추가
// =============================================================================

export default function BriefingPage() {
  const router = useRouter()
  const { logs, isLoading, setSearchQuery, setDateRange } = useBriefingLogs()

  const goToDetail = (id: string, mode: "US" | "KR", isReady: boolean) => {
    if (!isReady) {
      toast("아직 리포트 배포 전이라냥! 조금만 기다려달라냥. 🐾")
      return
    }
    router.push(`/briefing/${id}?mode=${mode}`)
  }

  return (
    // 🚨 [수정] w-full과 overflow-x-hidden을 추가하여 화면 밀림 원천 차단!
    <div className="min-h-screen bg-slate-50 pb-32 transition-colors w-full overflow-x-hidden">
      <DetailHeader
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">브리핑 로그</span>
          </div>
        }
      />

      {/* 💡 [수정] space-y-8을 space-y-6으로 살짝 줄여서 배너와 검색바 간격을 예쁘게 맞췄습니다 */}
      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        
        {/* 💰 [추가] 검색바 위 최상단에 광고 배너 배치 */}
        <section className="relative z-10 w-full">
          <AdBanner />
        </section>

        <section className="relative z-20">
          <BriefingSearchBar
            onSearch={setSearchQuery}
            onRangeChange={(start, end) => setDateRange({ start, end })}
          />
        </section>

        <div className="space-y-8 pt-2">
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <Zap className="w-12 h-12 mb-3 opacity-20 animate-pulse" />
              <p className="text-sm font-bold">브리핑 로그 불러오는 중...</p>
            </div>
          )}

          {!isLoading && logs.map((day) => (
            <section key={day.id} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  <h2 className="text-[14px] font-black text-slate-800">{day.date}</h2>
                </div>
                <div className="flex items-center gap-1 opacity-40">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    History
                  </span>
                </div>
              </div>

              <div className="grid gap-3.5">
                <BriefingLogCard
                  type="morning"
                  time={day.morning.time}
                  headline={day.morning.headline}
                  indices={day.morning.indices}
                  onClick={() => goToDetail(day.id, "US", day.morning.isReady)}
                />
                <BriefingLogCard
                  type="afternoon"
                  time={day.afternoon.time}
                  headline={day.afternoon.headline}
                  indices={day.afternoon.indices}
                  onClick={() => goToDetail(day.id, "KR", day.afternoon.isReady)}
                />
              </div>
            </section>
          ))}

          {!isLoading && logs.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <Zap className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-bold">검색 결과가 없다냥...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}