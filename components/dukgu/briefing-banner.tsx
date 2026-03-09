"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { IndexSummary } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

interface BriefingRow {
  id: string
  type: string
  headline: string
  indices: IndexSummary[] | null
  is_ready: boolean | null
  content: { summary?: string } | null
  date: string
}

const THEME = {
  US: {
    gradient:     "from-emerald-400 to-emerald-600",
    shadow:       "shadow-emerald-500/30",
    flag:         "🇺🇸",
    textColor:    "text-emerald-700",
    briefingType: "오전브리핑",
  },
  KR: {
    gradient:     "from-rose-400 to-rose-600",
    shadow:       "shadow-rose-500/30",
    flag:         "🇰🇷",
    textColor:    "text-rose-700",
    briefingType: "오후브리핑",
  },
}

function getDateLabel(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date()
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]}요일)`
}

function BriefingBannerSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 shadow-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-40 bg-slate-300/70 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full bg-slate-300/70" />
      </div>
      <Skeleton className="h-4 w-full bg-slate-300/70 rounded-full" />
      <Skeleton className="h-4 w-4/5 bg-slate-300/70 rounded-full" />
      <Skeleton className="h-3 w-full bg-slate-300/70 rounded-full" />
      <div className="flex justify-end">
        <Skeleton className="h-8 w-24 rounded-xl bg-slate-300/70" />
      </div>
    </div>
  )
}

export function BriefingBanner() {
  const [market, setMarket]       = useState<"US" | "KR" | null>(null)
  const [morning, setMorning]     = useState<BriefingRow | null | undefined>(undefined)
  const [afternoon, setAfternoon] = useState<BriefingRow | null | undefined>(undefined)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("briefings")
        .select("id, type, headline, indices, is_ready, content, date")
        .order("date", { ascending: false })
        .limit(6)

      const m = data?.find((r: BriefingRow) => r.type === "morning")   ?? null
      const a = data?.find((r: BriefingRow) => r.type === "afternoon") ?? null
      setMorning(m)
      setAfternoon(a)

      const now = new Date()
      const t = now.getHours() * 100 + now.getMinutes()
      const preferUS = t >= 700 && t < 1530
      setMarket(preferUS ? (m ? "US" : a ? "KR" : null) : (a ? "KR" : m ? "US" : null))
    }
    load()
  }, [])

  if (morning === undefined || afternoon === undefined) return <BriefingBannerSkeleton />
  if ((!morning && !afternoon) || !market) return null

  const briefing = market === "US" ? morning : afternoon
  if (!briefing) return null

  const theme = THEME[market]

  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} ${theme.shadow} shadow-xl text-white transition-all duration-500`}
    >
      {/* 국기 워터마크 */}
      <div className="absolute -bottom-6 -right-4 text-[130px] opacity-[0.13] pointer-events-none select-none rotate-12">
        {theme.flag}
      </div>
      {/* 상단 광택 */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3 p-5">
        {/* 날짜 + 마켓 토글 */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-white/90 drop-shadow-sm truncate mr-2">
            {getDateLabel(briefing.date)} 오늘의 {theme.briefingType}
          </span>
          <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full p-0.5 shadow-inner shrink-0">
            <button
              disabled={!morning}
              onClick={() => morning && setMarket("US")}
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                market === "US" ? `bg-white ${theme.textColor} shadow-md` : "text-white/70 hover:text-white"
              }`}
            >
              미국
            </button>
            <button
              disabled={!afternoon}
              onClick={() => afternoon && setMarket("KR")}
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                market === "KR" ? `bg-white ${theme.textColor} shadow-md` : "text-white/70 hover:text-white"
              }`}
            >
              한국
            </button>
          </div>
        </div>

        {/* 헤드라인 + 요약 */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[16px] font-black leading-tight drop-shadow-md">
            {briefing.headline}
          </h2>
          {briefing.content?.summary && (
            <p className="text-[11px] text-white/85 leading-relaxed line-clamp-2 drop-shadow-sm font-medium">
              {briefing.content.summary}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="flex justify-end">
          <Link
            href="/briefing"
            className={`group flex items-center gap-1 text-[11px] font-black bg-white ${theme.textColor} px-3.5 py-2 rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-lg`}
          >
            리포트읽기
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
