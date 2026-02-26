"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Home, ExternalLink, Clock, Globe, Bookmark, Share2, Loader2 } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { DukguReaction } from "@/components/dukgu/dukgu-reaction"
import { AiDisclaimer } from "@/components/dukgu/ai-disclaimer"
import { DukguAiSummary } from "@/components/dukgu/dukgu-ai-summary"
import { NewsCommentSection } from "@/components/dukgu/news-comment-section"
import { ShareButton } from "@/components/dukgu/share-button"
import { supabase } from "@/lib/supabase"
import { updateCachedCommentCountInFeed } from "@/hooks/use-news-feed"
import { useSavedArticles } from "@/hooks/use-saved-articles"
import { useUser } from "@/context/user-context"

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

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export function NewsDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { profile } = useUser()
  const [news, setNews] = useState<NewsDetail | null | undefined>(undefined)
  const [liveViewCount, setLiveViewCount] = useState(0)
  const [liveCommentCount, setLiveCommentCount] = useState(0)
  const { isSaved, toggleSave } = useSavedArticles()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("news")
        .select("id, category, tags, headline, summary, source, original_url, content, ai_summary, published_at, good_count, bad_count, comment_count, view_count")
        .eq("id", id)
        .single()
      
      setNews(data ?? null)
      
      if (data) {
        setLiveViewCount((data.view_count ?? 0) + 1)
        setLiveCommentCount(data.comment_count ?? 0)
        await supabase.rpc('increment_view_count', { row_id: id })
      }
    }
    load()
  }, [id])

  const isBookmarked = news ? isSaved(news.id) : false

  // 💡 [수정] 북마크 클릭 시 통일된 로그인 팝업 적용
  const toggleBookmark = () => {
    if (!profile) {
      toast("로그인이 필요한 기능이다냥! 🐾", {
        description: "기사를 저장하려면 덕구네 식구가 되어 달라냥.",
        action: {
          label: "로그인하기",
          onClick: () => router.push("/login"),
        },
      })
      return
    }
    if (!news) return
    const tags: string[] = Array.isArray(news.tags) ? news.tags : []
    toggleSave(news.id, {
      headline: news.headline,
      category: news.category as any,
      timeAgo: getTimeAgo(news.published_at),
      tags,
    })
    if (!isBookmarked) toast.success("간식 창고(북마크)에 저장했다냥! 🐾")
  }

  if (news === undefined) {
    return (
      <div className="min-h-dvh bg-white">
        <DetailHeader title="뉴스 상세" />
        <div className="flex flex-col items-center justify-center h-80 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-400 text-xs font-medium">덕구가 뉴스를 가져오고 있다냥...</p>
        </div>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="min-h-dvh bg-white">
        <DetailHeader title="뉴스 상세" />
        <div className="flex items-center justify-center h-60 text-slate-400 text-sm font-medium">
          뉴스를 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  const tags: string[] = Array.isArray(news.tags) ? news.tags : []
  const isDukguPick = news.source === "덕구"

  return (
    <div className="min-h-dvh bg-white pb-24">
      <DetailHeader
        title="뉴스 상세"
        rightElement={
          <Link href="/" className="p-1.5 hover:bg-emerald-50 rounded-full transition-colors group">
            <Home className="w-5 h-5 text-slate-800 group-hover:text-emerald-600" />
          </Link>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-tight">
            {news.category}
          </span>
          {isDukguPick && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white tracking-tight">
              덕구 픽
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="text-[11px] font-bold text-emerald-500/80 tracking-tight">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-start gap-4 mb-3">
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight break-keep tracking-tight">
            {news.headline}
          </h2>
          <div className="flex flex-col gap-2 shrink-0">
            {news.original_url && (
              <a
                href={news.original_url.startsWith("http") ? news.original_url : `https://${news.original_url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors border border-transparent hover:border-emerald-100"
              >
                원문보기 <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={toggleBookmark}
              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                isBookmarked
                  ? "bg-emerald-500 text-white shadow-md transform scale-105"
                  : "bg-white border border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500"
              }`}
            >
              <Bookmark className={`w-3 h-3 ${isBookmarked ? "fill-white" : ""}`} />
              {isBookmarked ? "저장됨" : "저장하기"}
            </button>

            <ShareButton
              title={`[덕구의 뉴스] ${news.headline}`}
              text={news.summary || "매일 아침, 당신을 위한 금융 뉴스 브리핑"}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-white border border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500"
            >
              <Share2 className="w-3 h-3" />
              공유하기
            </ShareButton>
          </div>
        </div>

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

        {news.ai_summary && (
          <div className="mb-8">
            <DukguAiSummary summary={news.ai_summary} />
          </div>
        )}

        <article className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium mb-10 break-keep">
          {news.content ?? news.summary}
        </article>

        <AiDisclaimer />

        <div className="my-10 border-t border-b border-slate-50 py-6">
          <DukguReaction
            initialGood={news.good_count}
            initialBad={news.bad_count}
            viewCount={liveViewCount}
            commentCount={liveCommentCount}
            newsId={news.id}
            snapshot={{ headline: news.headline, category: news.category, timeAgo: getTimeAgo(news.published_at) }}
          />
        </div>

        <NewsCommentSection
          newsId={id}
          onCountChange={(count) => {
            setLiveCommentCount(count)
            updateCachedCommentCountInFeed(id, count)
          }}
        />
      </main>
    </div>
  )
}