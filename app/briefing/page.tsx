"use client"

import { useState } from "react" 
import { useRouter } from "next/navigation"
import { Zap, Calendar, PenTool } from "lucide-react" // 💡 [추가] PenTool 아이콘
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { BriefingLogCard } from "@/components/dukgu/briefing-log-card"
import { SearchBar } from "@/components/dukgu/search-bar" 
import { useBriefingLogs } from "@/hooks/use-briefing-logs"
import { AdBanner } from "@/components/dukgu/ad-banner" 
// 💡 [추가] 관리자 권한 확인을 위한 유저 도구함
import { useUser } from "@/context/user-context"
import Link from "next/link"

export default function BriefingPage() {
  const router = useRouter()
  const { logs, isLoading, setSearchQuery, setDateRange } = useBriefingLogs()
  
  // 💡 [추가] 관리자인지 확인
  const { profile } = useUser()
  const isAdmin = profile?.is_admin === true
  
  const [query, setQuery] = useState("")

  const handleSearch = (val: string) => {
    setQuery(val)
    setSearchQuery(val) 
  }

  const goToDetail = (id: string, mode: "US" | "KR", isReady: boolean) => {
    if (!isReady) {
      toast("아직 리포트 배포 전이라냥! 조금만 기다려달라냥. 🐾")
      return
    }
    router.push(`/briefing/${id}?mode=${mode}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 transition-colors w-full overflow-x-hidden relative">
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

        <section className="relative z-20">
          <SearchBar 
            value={query} 
            onChange={handleSearch} 
          />
        </section>

        <div className="space-y-8 pt-2">
          {isLoading && (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  {/* 날짜 헤더 */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-slate-200 rounded-full animate-pulse" />
                      <div className="h-3.5 w-28 bg-slate-200 rounded-full animate-pulse" />
                    </div>
                    <div className="h-3 w-16 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  {/* 오전/오후 카드 2장 */}
                  <div className="grid gap-3.5">
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="h-3 w-20 bg-slate-100 rounded-full animate-pulse" />
                          <div className="h-3 w-10 bg-slate-100 rounded-full animate-pulse" />
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full animate-pulse" />
                        <div className="h-4 w-4/5 bg-slate-100 rounded-full animate-pulse" />
                        <div className="flex gap-2 pt-1">
                          {[...Array(3)].map((_, k) => (
                            <div key={k} className="h-5 w-16 bg-slate-100 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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

      {/* 💡 [추가] 관리자 전용 '브리핑 작성' 플로팅 버튼 */}
      {isAdmin && (
        <div className="fixed bottom-24 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <Link
            href="/briefing/new"
            className="flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-3 rounded-full shadow-lg shadow-amber-200 hover:bg-amber-600 hover:scale-105 transition-all font-bold text-[13px]"
          >
            <PenTool className="w-4 h-4" />
            브리핑 발행
          </Link>
        </div>
      )}
    </div>
  )
}