"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { IndexSummary } from "@/types"

interface BriefingRow {
  id: string
  type: string
  headline: string
  indices: IndexSummary[] | null
  is_ready: boolean | null
  content: { summary?: string } | null
  date: string // 💡 날짜 비교를 위해 추가
}

const THEME = {
  US: {
    theme: "from-emerald-400 to-emerald-600 shadow-emerald-500/30",
    flag: "🇺🇸",
    textColor: "text-emerald-700",
    briefingType: "오전브리핑",
  },
  KR: {
    theme: "from-rose-400 to-rose-600 shadow-rose-500/30",
    flag: "🇰🇷",
    textColor: "text-rose-700",
    briefingType: "오후브리핑",
  },
}

// 💡 데이터의 실제 날짜를 기반으로 라벨을 생성하도록 수정
function getDateLabel(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date()
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${days[date.getDay()]}요일)`
}

export function HeroBanner() {
  const [market, setMarket] = useState<"US" | "KR" | null>(null)
  const [morning, setMorning] = useState<BriefingRow | null | undefined>(undefined)
  const [afternoon, setAfternoon] = useState<BriefingRow | null | undefined>(undefined)

  useEffect(() => {
    const load = async () => {
      // 💡 [핵심] 특정 날짜를 지정하지 않고, 최신 데이터 순으로 6개를 가져와서 필터링합니다.
      const { data } = await supabase
        .from("briefings")
        .select("id, type, headline, indices, is_ready, content, date")
        .order("date", { ascending: false })
        .limit(6)

      // 타입별로 가장 최근 데이터 1개씩 추출
      const m = data?.find((r: any) => r.type === "morning") ?? null
      const a = data?.find((r: any) => r.type === "afternoon") ?? null
      
      setMorning(m)
      setAfternoon(a)

      const now = new Date()
      const currentTime = now.getHours() * 100 + now.getMinutes()
      
      // 기존 기획하신 시간대별 우선순위 로직 유지
      const preferUS = currentTime >= 700 && currentTime < 1530

      if (preferUS) {
        setMarket(m ? "US" : a ? "KR" : null)
      } else {
        setMarket(a ? "KR" : m ? "US" : null)
      }
    }
    load()
  }, [])

  if (morning === undefined || afternoon === undefined) {
    return <section className="pt-2 pb-2 h-48 animate-pulse bg-muted rounded-2xl" />
  }

  if (!morning && !afternoon) return null
  if (!market) return null

  const currentBriefing = market === "US" ? morning : afternoon
  const theme = THEME[market]
  const indices = currentBriefing?.indices ?? []

  return (
    <section className="pt-2 pb-2">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.theme} p-5 text-white shadow-xl transition-all duration-500`}
      >
        {/* 투명 국기 배경 */}
        <div className="absolute -bottom-6 -right-4 text-[130px] opacity-[0.13] pointer-events-none select-none transition-all duration-500 rotate-12">
          {theme.flag}
        </div>

        {/* 상단 광택 효과 */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">

          {/* 1. 날짜 + 라디오 버튼 */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-white/90 drop-shadow-sm truncate mr-2">
              {/* 💡 오늘 날짜가 아닌, 불러온 데이터의 실제 날짜를 표시합니다. */}
              {getDateLabel(currentBriefing?.date)} 오늘의 {theme.briefingType}
            </span>
            <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full p-0.5 shadow-inner shrink-0">
              <button
                onClick={() => morning && setMarket("US")}
                disabled={!morning}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
                  market === "US" ? `bg-white ${theme.textColor} shadow-md` : "text-white/70 hover:text-white"
                } ${!morning ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                미국
              </button>
              <button
                onClick={() => afternoon && setMarket("KR")}
                disabled={!afternoon}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
                  market === "KR" ? `bg-white ${theme.textColor} shadow-md` : "text-white/70 hover:text-white"
                } ${!afternoon ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                한국
              </button>
            </div>
          </div>

          {/* 2. 태그 영역 */}
          {indices.length > 0 && (
            <div className="flex flex-wrap gap-1.5 -mt-1">
              {indices.slice(0, 3).map(idx => (
                <span 
                  key={idx.name} 
                  className="text-[10px] px-2 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg font-bold text-white whitespace-nowrap shrink-0"
                >
                  #{idx.name}
                </span>
              ))}
            </div>
          )}

          {/* 3. 헤드라인 + AI 요약 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[16px] font-black text-left leading-tight drop-shadow-md">
              {currentBriefing?.headline}
            </h2>
            {currentBriefing?.content?.summary && (
              <p className="text-[11px] text-white/85 leading-relaxed line-clamp-2 drop-shadow-sm font-medium">
                {currentBriefing.content.summary}
              </p>
            )}
          </div>

          {/* 4. 리포트읽기 버튼 */}
          <div className="flex justify-end mt-1">
            <Link
              href="/briefing"
              className={`group flex items-center gap-1 text-[11px] font-black bg-white ${theme.textColor} px-3.5 py-2 rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-lg cursor-pointer`}
            >
              <span>리포트읽기</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}