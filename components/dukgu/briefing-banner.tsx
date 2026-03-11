"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
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

function getDateLabel(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date()
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

function BriefingBannerSkeleton() {
  return (
    <div className="rounded-[24px] bg-white p-5 space-y-4 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-36 bg-slate-100 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-3 w-28 bg-slate-100 rounded-full" />
          <Skeleton className="h-5 w-full bg-slate-100 rounded-full" />
          <Skeleton className="h-4 w-4/5 bg-slate-100 rounded-full" />
          <Skeleton className="h-4 w-2/3 bg-slate-100 rounded-full" />
          <Skeleton className="h-4 w-24 bg-slate-100 rounded-full" />
        </div>
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

  const briefLabel = briefing.type === "morning" ? "Morning Brief" : "Afternoon Brief"

  return (
    <section className="rounded-[24px] bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">

      {/* 상단: 날짜 + 라벨 + 토글 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-gray-400">
            {getDateLabel(briefing.date)}
          </span>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: "#D1FAE5", color: "#065F46" }}
          >
            {briefLabel}
          </span>
        </div>

        {/* 미국 / 한국 토글 */}
        <div className="flex items-center bg-slate-100 rounded-full p-0.5 shrink-0">
          <button
            disabled={!morning}
            onClick={() => morning && setMarket("US")}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
              market === "US" ? "bg-white shadow-sm text-emerald-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            미국
          </button>
          <button
            disabled={!afternoon}
            onClick={() => afternoon && setMarket("KR")}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
              market === "KR" ? "bg-white shadow-sm text-rose-500" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            한국
          </button>
        </div>
      </div>

        {/* 메인: 덕구 아이콘 + 콘텐츠 */}
        <div className="flex items-start gap-3">

          {/* 덕구 캐릭터 */}
          <div className="w-12 h-12 flex items-center justify-center shrink-0 select-none">
            <img 
              src="/icon.svg" 
              alt="덕구 아이콘" 
              className="w-11 h-11 object-contain"
            />
          </div>

        {/* 콘텐츠 */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-emerald-500 leading-none">
            덕구의 오늘 시장 한입 브리핑
          </p>
          <h2 className="text-[15px] font-bold text-[#111827] leading-[1.4] line-clamp-2 whitespace-pre-wrap">
            {briefing.headline}
          </h2>
          {briefing.content?.summary && (
            <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 whitespace-pre-wrap">
              {briefing.content.summary}
            </p>
          )}
          <Link
            href="/briefing"
            className="text-[13px] font-semibold text-emerald-600 hover:opacity-75 transition-opacity mt-0.5 inline-block"
          >
            전체 브리핑 보기 →
          </Link>
        </div>
      </div>

    </section>
  )
}