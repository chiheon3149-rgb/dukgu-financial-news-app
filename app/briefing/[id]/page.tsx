"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation" // 💡 useRouter 추가
import { Edit2, Trash2 } from "lucide-react" // 💡 관리자용 아이콘 추가
import { toast } from "sonner" // 💡 알림용
import { DetailHeader } from "@/components/dukgu/detail-header"
import { BriefingHero } from "@/components/dukgu/briefing-hero"
import { MarketSwitcher } from "@/components/dukgu/market-switcher"
import { KpiTracker } from "@/components/dukgu/kpi-tracker"
import { MarketIndexLog } from "@/components/dukgu/market-index-board"
import { DbriefingSchedule } from "@/components/dukgu/dbriefing-schedule"
import { BriefingNews } from "@/components/dukgu/briefing-news"
import { BriefingSummary } from "@/components/dukgu/briefing-summary"
import { ShareButton } from "@/components/dukgu/share-button"
import { supabase } from "@/lib/supabase"
// 💡 관리자 권한 확인 및 도구함 불러오기
import { useUser } from "@/context/user-context"
import { useBriefingAdmin } from "@/hooks/use-briefing-admin"
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
  const router = useRouter()
  const { id: dateStr } = use(params)
  const searchParams = useSearchParams()
  const initialMode = (searchParams.get("mode") as "US" | "KR") ?? "US"

  // 💡 관리자 권한 및 삭제 도구 세팅
  const { profile } = useUser()
  const isAdmin = profile?.is_admin === true
  const { clearBriefing } = useBriefingAdmin()

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
  const currentType = marketMode === "US" ? "morning" : "afternoon" // 삭제에 필요한 타입

  // 💡 관리자용 브리핑 비우기(초기화) 로직
  const handleDelete = async () => {
    if (!window.confirm("정말 이 브리핑을 초기화(삭제)하시겠습니까? 🚨")) return
    try {
      await clearBriefing(dateStr, currentType)
      toast.success("브리핑이 초기화되었다냥! 🗑️")
      router.replace("/briefing") // 💡 삭제 후 목록으로 쫓아냅니다.
    } catch (e) {
      toast.error("초기화에 실패했다냥.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-[#F9FAFB]">
        <DetailHeader title="브리핑" />
        <div className="flex items-center justify-center h-60 text-slate-400 text-sm animate-pulse">
          브리핑 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-20">
      <DetailHeader
        title={marketMode === "US" ? "Global Briefing" : "K-Market Report"}
        rightElement={
          <div className="flex items-center gap-1">
            {isAdmin && (
              <>
                <button
                  onClick={() => router.push(`/briefing/${dateStr}/edit?type=${currentType}`)}
                  className="p-1.5 hover:bg-amber-50 rounded-full transition-colors group"
                >
                  <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 hover:bg-red-50 rounded-full transition-colors group"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
              </>
            )}
            <ShareButton
              title={`[덕구의 뉴스 곳간] ${current?.headline}`}
              text="오늘의 금융 뉴스 브리핑을 확인해보세요! 🐾"
            />
          </div>
        }
      />

      <main className="container max-w-md mx-auto px-4 py-6 space-y-8">
        <MarketSwitcher mode={marketMode} setMode={setMarketMode} isKrAvailable={!!afternoon} />

        <BriefingHero
          date={formatDateLabel(dateStr, marketMode === "US" ? "morning" : "afternoon")}
          title={current?.headline ?? "브리핑 준비 중"}
          description={(current?.indices ?? []).map((i: any) => `${i.name} ${i.change}`).join("  ·  ")}
          variant={marketMode === "US" ? "morning" : "afternoon"}
          emoji={marketMode === "US" ? "🚀" : "🐯"}
        />

        {current?.content?.kpis && current.content.kpis.length > 0 && (
          <KpiTracker mode={marketMode} items={current.content.kpis} />
        )}
        
        {current?.content?.markets && current.content.markets.length > 0 && (
          <MarketIndexLog mode={marketMode} items={current.content.markets} />
        )}
        
        {current?.content?.schedule && current.content.schedule.length > 0 && (
          <DbriefingSchedule mode={marketMode} items={current.content.schedule} />
        )}
        
        {current?.content?.news && current.content.news.length > 0 && (
          <BriefingNews mode={marketMode} items={current.content.news} />
        )}

        {current?.content?.summary && (
          <BriefingSummary
            summary={current.content.summary}
            quote={current.content.quote ?? ""}
            author={current.content.quoteAuthor ?? ""}
          />
        )}
      </main>
    </div>
  )
}