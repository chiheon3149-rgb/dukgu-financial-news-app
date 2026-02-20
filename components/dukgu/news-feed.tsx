"use client"

import { NewsCard } from "./news-card"
import { Clock } from "lucide-react"

const newsData = [
  {
    category: "경제" as const,
    headline: "한국은행, 기준금리 동결… '추가 인하 여지 남겨'",
    summary: "한국은행이 기준금리를 3.0%로 동결하며 향후 경기 흐름을 지켜보겠다고 밝혔다.",
    timeAgo: "1시간 전",
    goodCount: 128,
    badCount: 15,
    commentCount: 34,
  },
  {
    category: "국제" as const,
    headline: "미 연준 의사록 공개… 금리 인하 시그널 강화",
    summary: "연방준비제도가 올해 하반기 금리 인하 가능성을 시사하며 글로벌 시장이 반색했다.",
    timeAgo: "2시간 전",
    goodCount: 256,
    badCount: 22,
    commentCount: 67,
  },
  {
    category: "기업" as const,
    headline: "삼성전자, AI 반도체 수주 2조원 돌파",
    summary: "삼성전자가 글로벌 AI 기업들로부터 HBM 반도체 대규모 수주에 성공했다.",
    timeAgo: "3시간 전",
    goodCount: 512,
    badCount: 8,
    commentCount: 89,
  },
  {
    category: "정치" as const,
    headline: "정부, 하반기 추경 편성 검토 착수",
    summary: "경기 둔화에 대응해 정부가 하반기 추가경정예산 편성을 공식 검토하기 시작했다.",
    timeAgo: "4시간 전",
    goodCount: 87,
    badCount: 45,
    commentCount: 123,
  },
  {
    category: "부동산" as const,
    headline: "서울 아파트 매매가, 3주 연속 상승세 이어가",
    summary: "강남 3구를 중심으로 서울 아파트 매매가가 3주 연속 오름세를 기록했다.",
    timeAgo: "5시간 전",
    goodCount: 64,
    badCount: 98,
    commentCount: 201,
  },
  {
    category: "사회" as const,
    headline: "MZ세대 '커피값 투자' 트렌드 확산",
    summary: "월 커피 지출 대신 소액 투자를 시작하는 20-30대가 급증하고 있다.",
    timeAgo: "6시간 전",
    goodCount: 342,
    badCount: 12,
    commentCount: 156,
  },
]

export function NewsFeed() {
  return (
    <section className="px-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-3 mt-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground">실시간 뉴스</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-3">
        {newsData.map((news, index) => (
          <NewsCard key={index} {...news} />
        ))}
      </div>
    </section>
  )
}
