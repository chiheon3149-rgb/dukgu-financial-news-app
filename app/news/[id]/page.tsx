"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Home, ExternalLink, Clock, Globe, Bookmark } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { DukguReaction } from "@/components/dukgu/dukgu-reaction"
import { AiDisclaimer } from "@/components/dukgu/ai-disclaimer"
import { DukguAiSummary } from "@/components/dukgu/dukgu-ai-summary"
import { NewsCommentSection } from "@/components/dukgu/news-comment-section"
import { supabase } from "@/lib/supabase"

interface NewsDetail {
  id: string
  category: string
  tags: string[]
  headline: string
  summary: string
  source: string | null
  original_url: string | null
  content: string | null
  ai_summary: string | null
  published_at: string
  good_count: number
  bad_count: number
  comment_count: number
  view_count: number
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${day} ${h}:${min}`
}

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [news, setNews] = useState<NewsDetail | null | undefined>(undefined)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [liveViewCount, setLiveViewCount] = useState(0)
  const [liveCommentCount, setLiveCommentCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("news")
        .select("id, category, tags, headline, summary, source, original_url, content, ai_summary, published_at, good_count, bad_count, comment_count, view_count")
        .eq("id", id)
        .single()
      setNews(data ?? null)
      if (data) {
        // 조회수 증가 후 +1 반영
        setLiveViewCount((data.view_count ?? 0) + 1)
        setLiveCommentCount(data.comment_count ?? 0)
        await supabase.rpc("increment_news_view_count", { target_news_id: id })
      }
    }
    load()
  }, [id])

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    if (!isBookmarked) alert("간식 창고(북마크)에 저장했다냥! 🐾")
  }

  if (news === undefined) {
    return (
      <div className="min-h-dvh bg-white">
        <DetailHeader title="뉴스 상세" />
        <div className="flex items-center justify-center h-60 text-slate-400 text-sm animate-pulse">
          뉴스 불러오는 중...
        </div>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="min-h-dvh bg-white">
        <DetailHeader title="뉴스 상세" />
        <div className="flex items-center justify-center h-60 text-slate-400 text-sm">
          뉴스를 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  const tags: string[] = Array.isArray(news.tags) ? news.tags : []

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

        {/* 카테고리 + 태그 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
            {news.category}
          </span>
          <div className="flex items-center gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="text-[11px] font-bold text-blue-400">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        </div>

        {/* 헤드라인 + 원문/북마크 버튼 */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight break-keep">
            {news.headline}
          </h2>
          <div className="flex flex-col gap-2 shrink-0">
            {news.original_url && (
              <a
                href={news.original_url.startsWith("http") ? news.original_url : `https://${news.original_url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                원문보기 <ExternalLink className="w-3 h-3" />
              </a>
            )}
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

        {/* 출처 + 시간 */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mb-8">
          {news.source && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> {news.source}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatDate(news.published_at)}
          </span>
        </div>

        {/* AI 요약 — ai_summary 있을 때만 표시 */}
        {news.ai_summary && <DukguAiSummary summary={news.ai_summary} />}

        {/* 본문 — content 있으면 본문, 없으면 summary 대체 */}
        <article className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium mb-8">
          {news.content ?? news.summary}
        </article>

        <AiDisclaimer />

        <DukguReaction
          initialGood={news.good_count}
          initialBad={news.bad_count}
          viewCount={liveViewCount}
          commentCount={liveCommentCount}
          newsId={news.id}
        />

        <NewsCommentSection newsId={id} onCountChange={setLiveCommentCount} />
      </main>
    </div>
  )
}
