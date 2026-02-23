"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { IndexSummary } from "@/types"

// =============================================================================
// 🏠 HeroBanner
//
// 오늘 날짜의 briefings 테이블에서 오전(morning)/오후(afternoon) 데이터를 가져와
// 미국(US) / 한국(KR) 라디오 버튼으로 전환해 보여줍니다.
//
// - morning → 미국(US) 버튼
// - afternoon → 한국(KR) 버튼
// - 오늘 데이터가 없으면 섹션 자체를 숨깁니다.
// =============================================================================

interface BriefingRow {
  id: string
  type: string
  headline: string
  indices: IndexSummary[] | null
  is_ready: boolean | null
  content: { summary?: string } | null
}

const THEME = {
  US: {
    theme: "from-red-400/80 to-red-600/80 shadow-red-500/30",
    flag: "🇺🇸",
    textColor: "text-red-700",
    briefingType: "오전브리핑",
  },
  KR: {
    theme: "from-blue-500/80 to-blue-700/80 shadow-blue-500/30",
    flag: "🇰🇷",
    textColor: "text-blue-700",
    briefingType: "오후브리핑",
  },
}

function getTodayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getDateLabel(): string {
  const now = new Date()
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일(${days[now.getDay()]}요일)`
}

export function HeroBanner() {
  const [market, setMarket] = useState<"US" | "KR" | null>(null)
  const [morning, setMorning] = useState<BriefingRow | null | undefined>(undefined)
  const [afternoon, setAfternoon] = useState<BriefingRow | null | undefined>(undefined)
  const [dateLabel] = useState(getDateLabel)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("briefings")
        .select("id, type, headline, indices, is_ready, content")
        .eq("date", getTodayStr())

      const m = data?.find((r: any) => r.type === "morning") ?? null
      const a = data?.find((r: any) => r.type === "afternoon") ?? null
      setMorning(m)
      setAfternoon(a)

      // 시간 기반 기본 선택 (7~15시 → 미국, 나머지 → 한국), 없으면 반대쪽으로 폴백
      const hour = new Date().getHours()
      const preferUS = hour >= 7 && hour < 16
      if (preferUS) {
        setMarket(m ? "US" : a ? "KR" : null)
      } else {
        setMarket(a ? "KR" : m ? "US" : null)
      }
    }
    load()
  }, [])

  // fetch 완료 전 스켈레톤
  if (morning === undefined || afternoon === undefined) {
    return <section className="pt-2 pb-2 h-48 animate-pulse bg-muted rounded-2xl" />
  }

  // 오늘 데이터 없음 → 섹션 숨김
  if (!morning && !afternoon) return null
  if (!market) return null

  const currentBriefing = market === "US" ? morning : afternoon
  const theme = THEME[market]
  const indices = currentBriefing?.indices ?? []

  return (
    <section className="pt-2 pb-2">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.theme} backdrop-blur-md border border-white/20 p-5 text-white shadow-xl transition-all duration-500`}
      >
        {/* 투명 국기 배경 */}
        <div className="absolute -bottom-6 -right-4 text-[130px] opacity-[0.15] pointer-events-none select-none transition-all duration-500 rotate-12">
          {theme.flag}
        </div>

        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">

          {/* 날짜 + 라디오 버튼 */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-white/90 drop-shadow-sm truncate mr-2">
              {dateLabel} 오늘의 {theme.briefingType}
            </span>
            <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full p-0.5 shadow-inner shrink-0">
              <button
                onClick={() => morning && setMarket("US")}
                disabled={!morning}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
                  market === "US" ? "bg-white text-red-700 shadow-md" : "text-white/70 hover:text-white"
                } ${!morning ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                미국
              </button>
              <button
                onClick={() => afternoon && setMarket("KR")}
                disabled={!afternoon}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
                  market === "KR" ? "bg-white text-blue-700 shadow-md" : "text-white/70 hover:text-white"
                } ${!afternoon ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                한국
              </button>
            </div>
          </div>

          {/* 헤드라인 + AI 요약 */}
          {currentBriefing ? (
            <div className="flex flex-col gap-2">
              {/* 제목: 한 줄, 넘치면 폰트 축소 */}
              <h2 className="text-[15px] font-extrabold text-left leading-tight drop-shadow-md truncate">
                {currentBriefing.headline}
              </h2>
              {/* AI 요약: 최대 3줄 */}
              {currentBriefing.content?.summary && (
                <p className="text-[11px] text-white/85 leading-relaxed line-clamp-3 drop-shadow-sm">
                  {currentBriefing.content.summary}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-bold text-white/70 py-2">브리핑 준비 중...</p>
          )}

          {/* #태그 3개(한 줄) + 리포트읽기 버튼 */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex gap-1.5 overflow-hidden min-w-0 flex-1">
              {indices.slice(0, 3).map(idx => (
                <span key={idx.name} className="text-[10px] px-2 py-1 bg-black/15 backdrop-blur-sm border border-white/10 rounded-md font-semibold text-white/90 whitespace-nowrap shrink-0">
                  #{idx.name}
                </span>
              ))}
            </div>

            <Link
              href="/briefing"
              className={`group flex items-center gap-1 text-xs font-bold bg-white ${theme.textColor} px-3.5 py-2 rounded-lg hover:bg-gray-100 transition-all active:scale-95 shadow-lg shrink-0 cursor-pointer`}
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
