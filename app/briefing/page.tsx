"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Zap, Calendar } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { BriefingLogCard } from "@/components/dukgu/briefing-log-card"
import { BriefingSearchBar } from "@/components/dukgu/briefing-search-bar"

export default function BriefingPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })

  const [dailyLogs] = useState([
    {
      id: "2026-02-21",
      date: "2026년 2월 21일(토요일)",
      morning: { 
        time: "08:30", 
        headline: "엔비디아發 훈풍, 나스닥 신고가 경신",
        indices: [
          { name: "다우", change: "+0.12%" }, 
          { name: "나스닥", change: "+1.24%" }, 
          { name: "S&P500", change: "+0.85%" },
          { name: "러셀", change: "+1.50%" }
        ],
        isReady: true
      },
      afternoon: { 
        time: "16:30", 
        headline: "코스피 상승 출발, 밸류업 정책 기대감",
        indices: [
          { name: "코스피", change: "+0.45%" }, 
          { name: "코스닥", change: "-0.12%" },
          { name: "코스피200", change: "+0.32%" }
        ],
        isReady: true
      }
    },
    {
      id: "2026-02-20",
      date: "2026년 2월 20일(금요일)",
      morning: { 
        time: "08:25", 
        headline: "금리 인하 신중론에 국채 금리 반등",
        indices: [
          { name: "다우", change: "-0.22%" }, 
          { name: "나스닥", change: "-0.55%" }, 
          { name: "S&P500", change: "-0.40%" },
          { name: "러셀", change: "-1.10%" }
        ],
        isReady: true
      },
      afternoon: { 
        time: "16:40", 
        headline: "외인 매도세에 코스닥 800선 하회",
        indices: [
          { name: "코스피", change: "-0.32%" }, 
          { name: "코스닥", change: "-1.02%" },
          { name: "코스피200", change: "-0.28%" }
        ],
        isReady: true
      }
    }
  ]);

  const filteredLogs = useMemo(() => {
    return dailyLogs.filter((log) => {
      const isWithinRange = (!dateRange.start || log.id >= dateRange.start) && (!dateRange.end || log.id <= dateRange.end);
      const matchesSearch = log.morning.headline.includes(searchQuery) || log.afternoon.headline.includes(searchQuery);
      return isWithinRange && matchesSearch;
    });
  }, [dailyLogs, dateRange, searchQuery]);

  const goToDetail = (id: string, mode: "US" | "KR", isReady: boolean) => {
    if (!isReady) {
      alert("아직 리포트 배포 전이라냥! 조금만 기다려달라냥. 🐾");
      return;
    }
    router.push(`/briefing/${id}?mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 transition-colors">
      {/* 🚀 1. 헤더 수정: Root 페이지이므로 showBack={false} 적용 */}
      <DetailHeader 
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">브리핑 로그</span>
          </div>
        } 
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-8">
        {/* 🚀 2. 검색 바 영역: 여백 조정 */}
        <section className="relative z-20">
          <BriefingSearchBar 
            onSearch={setSearchQuery} 
            onRangeChange={(start, end) => setDateRange({ start, end })} 
          />
        </section>
        
        {/* 🚀 3. 로그 리스트 섹션: 자산 페이지와 통일된 헤더 스타일 */}
        <div className="space-y-8">
          {filteredLogs.map((day) => (
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

          {/* 검색 결과가 없을 때의 피드백 (기획 디테일) */}
          {filteredLogs.length === 0 && (
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