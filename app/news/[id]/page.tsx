"use client"

import { useState, use } from "react"
import Link from "next/link"
import { Home, ExternalLink, Clock, Globe, Bookmark } from "lucide-react" // 💡 Bookmark 아이콘 추가
import { DetailHeader } from "@/components/dukgu/detail-header"
import { DukguReaction } from "@/components/dukgu/dukgu-reaction"
import { AiDisclaimer } from "@/components/dukgu/ai-disclaimer"
import { DukguAiSummary } from "@/components/dukgu/dukgu-ai-summary"
import { NewsCommentSection } from "@/components/dukgu/news-comment-section"

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [isBookmarked, setIsBookmarked] = useState(false);

  const newsDetail = {
    category: "경제" as const,
    tags: ["#기준금리", "#한국은행", "#금융시장"],
    headline: "한국은행, 기준금리 3.0% 동결… 시장의 예상과 일치했다",
    source: "블룸버그 (Bloomberg)",
    publishedAt: "2026-02-21 14:30",
    originalUrl: "https://bloomberg.com/news/example",
    aiSummary: "안녕냥! 덕구가 이번 금리 소식을 꾹꾹이하듯 정리해왔다냥! 한국은행이 금리를 그대로 두기로 했어냥. 물가가 아직은 무서워서 털을 세우고 지켜보는 것 같다냥! 집사들 지갑 사정은 당분간 비슷할 거다냥!",
    content: `한국은행 금융통화위원회는 오늘 오전 열린 통화정책방향 결정회의에서 현재 연 3.0%인 기준금리를 유지하기로 결정했습니다.\n\n이는 지난해 11월 이후 2회 연속 동결로, 전문가들의 예상치에 부합하는 결과입니다.`,
    stats: {
      good: 1240,
      bad: 86,
      view: 45200,
      comment: 328
    }
  }

  // 북마크 토글 함수
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    if (!isBookmarked) {
      alert("간식 창고(북마크)에 저장했다냥! 🐾");
    }
  };

  return (
    <div className="min-h-dvh bg-white pb-24">
      <DetailHeader 
        title="뉴스 상세" 
        rightElement={
          <Link href="/" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <Home className="w-5 h-5 text-slate-800" />
          </Link>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
            {newsDetail.category}
          </span>
          <div className="flex items-center gap-1.5">
            {newsDetail.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-bold text-blue-400">{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-start gap-4 mb-3">
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight break-keep">{newsDetail.headline}</h2>
          
          {/* 💡 우측 버튼 영역: 원문보기 + 북마크 */}
          <div className="flex flex-col gap-2 shrink-0">
            <Link 
              href={newsDetail.originalUrl}
              target="_blank"
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-200 transition-colors"
            >
              원문보기 <ExternalLink className="w-3 h-3" />
            </Link>
            
            {/* 💡 북마크 버튼 추가 */}
            <button 
              onClick={toggleBookmark}
              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                isBookmarked 
                ? "bg-blue-500 text-white shadow-sm" 
                : "bg-white border border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              <Bookmark className={`w-3 h-3 ${isBookmarked ? "fill-white" : ""}`} />
              {isBookmarked ? "저장됨" : "저장하기"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mb-8">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {newsDetail.source}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {newsDetail.publishedAt}</span>
        </div>

        <DukguAiSummary summary={newsDetail.aiSummary} />

        <article className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium mb-8">
          {newsDetail.content}
        </article>

        <AiDisclaimer />

        <DukguReaction 
          initialGood={newsDetail.stats.good}
          initialBad={newsDetail.stats.bad}
          viewCount={newsDetail.stats.view}
          commentCount={newsDetail.stats.comment}
        />

        <NewsCommentSection newsId={id} />
      </main>
    </div>
  )
}