"use client"

import { useState } from "react" // 💡 로컬 상태 관리를 위해 추가
import { useRouter } from "next/navigation"
import { Zap, Calendar } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { BriefingLogCard } from "@/components/dukgu/briefing-log-card"
import { SearchBar } from "@/components/dukgu/search-bar" // 👈 공통 서치바 임포트
import { useBriefingLogs } from "@/hooks/use-briefing-logs"
import { AdBanner } from "@/components/dukgu/ad-banner" 

export default function BriefingPage() {
  const router = useRouter()
  const { logs, isLoading, setSearchQuery, setDateRange } = useBriefingLogs()
  
  // 💡 입력 중인 텍스트를 담을 로컬 상태
  const [query, setQuery] = useState("")

  const handleSearch = (val: string) => {
    setQuery(val)
    setSearchQuery(val) // 훅에 전달하여 필터링 로직 실행
  }

  const goToDetail = (id: string, mode: "US" | "KR", isReady: boolean) => {
    if (!isReady) {
      toast("아직 리포트 배포 전이라냥! 조금만 기다려달라냥. 🐾")
      return
    }
    router.push(`/briefing/${id}?mode=${mode}`)
  }

  return (
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

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        <section className="relative z-10 w-full">
          <AdBanner />
        </section>

        {/* 🛠️ [교체] 기존 BriefingSearchBar 대신 공통 SearchBar 적용 */}
        <section className="relative z-20">
          <SearchBar 
            value={query} 
            onChange={handleSearch} 
          />
          {/* 💡 기획자님 참고: 기간 검색(DateRange) 기능이 필요하다면 
              서치바 바로 옆이나 아래에 작은 달력 아이콘 버튼을 추가하는 기획을 추천드려요! */}
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">History</span>
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