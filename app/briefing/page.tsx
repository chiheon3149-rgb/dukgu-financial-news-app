"use client"

import { useState } from "react" // 💡 현재 모드를 기억하는 '단기 기억 장치'
import { DetailHeader } from "@/components/dukgu/detail-header"
import { BriefingHero } from "@/components/dukgu/briefing-hero"
import { MarketSwitcher } from "@/components/dukgu/market-switcher" // 👈 리모컨 추가!
import { KpiTracker } from "@/components/dukgu/kpi-tracker"
import { MarketIndexLog } from "@/components/dukgu/market-index-board"
import { DbriefingSchedule } from "@/components/dukgu/dbriefing-schedule"
import { BriefingNews } from "@/components/dukgu/briefing-news"
import { BriefingSummary } from "@/components/dukgu/briefing-summary"

export default function BriefingPage() {
  // 💡 [뇌] 기본값은 미국("US")으로 시작합니다.
  const [marketMode, setMarketMode] = useState<"US" | "KR">("US");

  // 💡 [데이터 장부] 모드에 따라 바뀔 글자들을 모아둡니다.
  const marketContent = {
    US: {
      hero: {
        date: "2026년 2월 21일 (오전)",
        title: "오늘의 모닝 브리핑\n(미국 증시 패치 노트)",
        desc: "글로벌 마켓 트래픽과 기술주 업데이트 요약",
        variant: "morning" as const,
        emoji: "🚀"
      },
      summary: {
        text: "전일 미국 증시는 AI 수익성 의문으로 기술주 중심의 하락이 발생했습니다. 서버 부하 방어를 위한 관망세가 뚜렷합니다.",
        quote: "성공한 서비스는 사용자가 원하는 것을 미리 아는 것이다.",
        author: "스티브 잡스"
      }
    },
    KR: {
      hero: {
        date: "2026년 2월 21일 (오후)",
        title: "오늘의 클로징 리포트\n(국내 증시 리스크 점검)",
        desc: "코스피/코스닥 마감 로그 및 다음 배포 일정",
        variant: "afternoon" as const,
        emoji: "🐯"
      },
      summary: {
        text: "금일 코스피는 외인들의 트래픽 매도세로 지지선이 소폭 하락했습니다. 환율 변동에 따른 데이터 유실에 주의하세요.",
        quote: "투자의 제1원칙은 절대로 돈을 잃지 않는 것이다.",
        author: "워렌 버핏"
      }
    }
  };

  const current = marketContent[marketMode];

  return (
    <div className="min-h-dvh bg-slate-50 pb-20">
      <DetailHeader title={marketMode === "US" ? "Global Briefing" : "K-Market Report"} />

      <main className="container max-w-md mx-auto px-4 py-6 space-y-8">
        
        {/* 🔘 1. 리모컨 배치 */}
        <MarketSwitcher mode={marketMode} setMode={setMarketMode} />

        {/* 🚀 2. 기획자님의 Hero (상태에 따라 배경색과 글자가 슥슥 바뀜!) */}
        <BriefingHero 
          date={current.hero.date}
          title={current.hero.title}
          description={current.hero.desc}
          emoji={current.hero.emoji}
          variant={current.hero.variant}
        />

        {/* 🔍 3. 핵심 지표 (모드만 넘겨줍니다. 데이터는 부품 내부에서 처리하게 바꿀 거예요) */}
        <KpiTracker mode={marketMode} />

        {/* 📊 4. 증시 로그 */}
        <MarketIndexLog mode={marketMode} />

        {/* 📅 5. 배포 일정 */}
        <DbriefingSchedule mode={marketMode} />

        {/* 📰 6. 뉴스 섹션 */}
        <BriefingNews mode={marketMode} />

        {/* 📝 7. 요약 및 명언 */}
        <BriefingSummary 
          summary={current.summary.text}
          quote={current.summary.quote}
          author={current.summary.author}
        />

      </main>
    </div>
  )
}