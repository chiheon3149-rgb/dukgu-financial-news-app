"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
    tagBg:        "bg-emerald-50",
    tagText:      "text-emerald-600",
    tagLabel:     "미국",
    ctaColor:     "text-emerald-600",
    toggleActive: "text-emerald-600",
  },
  KR: {
    tagBg:        "bg-rose-50",
    tagText:      "text-rose-600",
    tagLabel:     "한국",
    ctaColor:     "text-emerald-600",
    toggleActive: "text-rose-600",
  },
}

function getDateLabel(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date()
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

function BriefingBannerSkeleton() {
  return (
    <div className="mt-3 rounded-[20px] bg-white border border-[#E5E7EB] p-4 space-y-3 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-36 bg-slate-200 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-md bg-slate-200" />
      </div>
      <Skeleton className="h-5 w-full bg-slate-200 rounded-full" />
      <Skeleton className="h-5 w-4/5 bg-slate-200 rounded-full" />
      <Skeleton className="h-4 w-full bg-slate-200 rounded-full" />
      <Skeleton className="h-4 w-2/3 bg-slate-200 rounded-full" />
      <Skeleton className="h-4 w-28 bg-slate-200 rounded-full" />
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
    <section className="mt-3 rounded-[20px] bg-white border border-[#E5E7EB] p-4 transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">

      {/* 상단: 날짜 + 마켓 태그 + 토글 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-gray-500">
            {getDateLabel(briefing.date)}
          </span>
          <span className={`${theme.tagBg} ${theme.tagText} text-[11px] font-semibold px-2 py-0.5 rounded-md`}>
            {theme.tagLabel}
          </span>
        </div>

        {/* 마켓 토글 */}
        <div className="flex items-center bg-slate-100 rounded-full p-0.5 shrink-0">
          <button
            disabled={!morning}
            onClick={() => morning && setMarket("US")}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
              market === "US" ? `bg-white shadow-sm ${THEME.US.toggleActive}` : "text-slate-400 hover:text-slate-600"
            }`}
          >
            미국
          </button>
          <button
            disabled={!afternoon}
            onClick={() => afternoon && setMarket("KR")}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
              market === "KR" ? `bg-white shadow-sm ${THEME.KR.toggleActive}` : "text-slate-400 hover:text-slate-600"
            }`}
          >
            한국
          </button>
        </div>
      </div>

      {/* 헤드라인 */}
      <h2 className="text-[17px] font-bold text-slate-900 leading-[1.4] line-clamp-2 mb-2">
        {briefing.headline}
      </h2>

      {/* 요약 */}
      {briefing.content?.summary && (
        <p className="text-[14px] text-gray-600 leading-relaxed line-clamp-2 mb-3">
          {briefing.content.summary}
        </p>
      )}

      {/* CTA */}
      <Link
        href="/briefing"
        className={`text-[14px] font-medium ${theme.ctaColor} hover:opacity-80 transition-opacity`}
      >
        전체 브리핑 보기 →
      </Link>
    </section>
  )
}
