"use client"

import { useState, useEffect, use } from "react"
import { useSearchParams } from "next/navigation"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { BriefingHero } from "@/components/dukgu/briefing-hero"
import { MarketSwitcher } from "@/components/dukgu/market-switcher"
import { KpiTracker } from "@/components/dukgu/kpi-tracker"
import { MarketIndexLog } from "@/components/dukgu/market-index-board"
import { DbriefingSchedule } from "@/components/dukgu/dbriefing-schedule"
import { BriefingNews } from "@/components/dukgu/briefing-news"
import { BriefingSummary } from "@/components/dukgu/briefing-summary"
import { supabase } from "@/lib/supabase"
import type { IndexSummary } from "@/types"

export interface BriefingContent {
  kpis?: {
    label: string; value: string; change: string; status: string
    statusColor: "rose" | "blue" | "amber" | "slate"
  }[]
  markets?: { name: string; val: string; change: string; status: string }[]
  schedule?: { dDay: string; title: string; description: string; isUrgent?: boolean }[]
  news?: {
    stars: number; cat: string; color: "blue" | "emerald" | "slate"
    title: string; summary?: string; insight?: string; link: string
  }[]
  summary?: string
  quote?: string
  quoteAuthor?: string
}

interface BriefingRow {
  id: string; type: string; headline: string
  indices: IndexSummary[] | null; content: BriefingContent | null
}

function formatDateLabel(dateStr: string, type: "morning" | "afternoon"): string {
  const d = new Date(dateStr + "T00:00:00")
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]}요일) (${type === "morning" ? "오전" : "오후"})`
}

export default function BriefingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: dateStr } = use(params)
  const searchParams = useSearchParams()
  const initialMode = (searchParams.get("mode") as "US" | "KR") ?? "US"

  const [marketMode, setMarketMode] = useState<"US" | "KR">(initialMode)
  const [morning, setMorning] = useState<BriefingRow | null>(null)
  const [afternoon, setAfternoon] = useState<BriefingRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("briefings")
        .select("id, type, headline, indices, content")
        .eq("date", dateStr)
      setMorning(data?.find((r: any) => r.type === "morning") ?? null)
      setAfternoon(data?.find((r: any) => r.type === "afternoon") ?? null)
      setIsLoading(false)
    }
    load()
  }, [dateStr])

  const current = marketMode === "US" ? morning : afternoon

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <DetailHeader title="브리핑" />
        <div className="flex items-center justify-center h-60 text-slate-400 text-sm animate-pulse">
          브리핑 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-20">
      <DetailHeader title={marketMode === "US" ? "Global Briefing" : "K-Market Report"} />
      <main className="container max-w-md mx-auto px-4 py-6 space-y-8">
        <MarketSwitcher mode={marketMode} setMode={setMarketMode} isKrAvailable={!!afternoon} />

        <BriefingHero
          date={formatDateLabel(dateStr, marketMode === "US" ? "morning" : "afternoon")}
          title={current?.headline ?? "브리핑 준비 중"}
          description={(current?.indices ?? []).map(i => `${i.name} ${i.change}`).join("  ·  ")}
          variant={marketMode === "US" ? "morning" : "afternoon"}
          emoji={marketMode === "US" ? "🚀" : "🐯"}
        />

        <KpiTracker mode={marketMode} items={current?.content?.kpis} />
        <MarketIndexLog mode={marketMode} items={current?.content?.markets} />
        <DbriefingSchedule mode={marketMode} items={current?.content?.schedule} />
        <BriefingNews mode={marketMode} items={current?.content?.news} />

        <BriefingSummary
          summary={current?.content?.summary ?? ""}
          quote={current?.content?.quote ?? ""}
          author={current?.content?.quoteAuthor ?? ""}
        />
      </main>
    </div>
  )
}
