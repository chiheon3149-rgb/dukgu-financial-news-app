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
    accentColor:  "text-emerald-500",
    badgeBg:      "bg-emerald-50",
    badgeText:    "text-emerald-600",
    briefingType: "오전브리핑",
  },
  KR: {
    accentColor:  "text-rose-500",
    badgeBg:      "bg-rose-50",
    badgeText:    "text-rose-600",
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
    <div className="rounded-[24px] overflow-hidden bg-white shadow-sm border border-slate-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-40 bg-slate-100 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full bg-slate-100" />
      </div>
      <Skeleton className="h-4 w-full bg-slate-100 rounded-full" />
      <Skeleton className="h-4 w-4/5 bg-slate-100 rounded-full" />
      <Skeleton className="h-3 w-full bg-slate-100 rounded-full" />
      <div className="flex justify-end">
        <Skeleton className="h-8 w-24 rounded-xl bg-slate-100" />
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
    <section className="rounded-[24px] bg-white shadow-sm border border-slate-100 transition-all duration-500 overflow-hidden">
      <div className="flex flex-col gap-2 p-4">

        {/* 날짜 + 마켓 토글 */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400 truncate mr-2">
            {getDateLabel(briefing.date)}{" "}
            <span className={theme.accentColor}>{theme.briefingType}</span>
          </span>
          <div className="flex items-center bg-slate-100 rounded-full p-0.5 shrink-0">
            <button
              disabled={!morning}
              onClick={() => morning && setMarket("US")}
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                market === "US"
                  ? `bg-white shadow-sm ${THEME.US.badgeText}`
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              미국
            </button>
            <button
              disabled={!afternoon}
              onClick={() => afternoon && setMarket("KR")}
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                market === "KR"
                  ? `bg-white shadow-sm ${THEME.KR.badgeText}`
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              한국
            </button>
          </div>
        </div>

        {/* 헤드라인 + 요약 + 더보기 */}
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-extrabold tracking-tight leading-snug text-slate-900">
            {briefing.headline}
          </h2>
          {briefing.content?.summary && (
            <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-1 font-medium">
              {briefing.content.summary}
            </p>
          )}
          <div className="flex justify-end mt-1">
            <Link
              href="/briefing"
              className={`group flex items-center gap-0.5 text-[11px] font-bold ${theme.accentColor} opacity-70 hover:opacity-100 transition-opacity`}
            >
              전체 읽기
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
