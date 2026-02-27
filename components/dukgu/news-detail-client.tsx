"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
// 💡 [수정 1] Edit2(수정), Trash2(삭제) 아이콘을 추가로 불러옵니다.
import { Home, ExternalLink, Clock, Globe, Bookmark, Share2, Loader2, Eye, Edit2, Trash2 } from "lucide-react"
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
// 💡 [수정 2] 뉴스를 삭제하기 위해 우리가 만든 도구함을 불러옵니다.
import { useNewsAdmin } from "@/hooks/use-news-admin"

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

/** 💡 시간 포맷팅: YYYY-MM-DD HH:mm */
function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${day} ${h}:${min}`
}

/** 💡 상대 시간 표시: n분 전, n시간 전 등 */
function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "방금 전"
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

  // 💡 [수정 3] 관리자 권한 확인 및 삭제 도구 꺼내기
  const { deleteNews } = useNewsAdmin()
  const isAdmin = profile?.is_admin === true

  // 💡 [핵심] 조회수 중복 방지: 입구에서 바로 사인을 하고 문을 잠급니다.
  const hasIncremented = useRef(false);

  useEffect(() => {
    // 💡 [수정] 비동기 함수(load) 밖에서 즉시 체크하고 잠급니다.
    if (!id || hasIncremented.current) return;
    hasIncremented.current = true; // "나 조회수 올리러 들어간다!" 하고 즉시 사인

    const load = async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .single()
      
      if (error || !data) {
        setNews(null)
        // 만약 에러로 실패했다면 나중에 다시 시도할 수 있게 열어줄 수 있습니다.
        // hasIncremented.current = false; 
        return
      }

      setNews(data)
      setLiveCommentCount(data.comment_count ?? 0)
      
      // UI 즉시 반영 (DB 값 + 1)
      setLiveViewCount((data.view_count ?? 0) + 1)
      
      // DB RPC 함수 호출 (송장 이름: target_news_id)
      try {
        await supabase.rpc('increment_news_view_count', { target_news_id: id })
      } catch (rpcError) {
        console.error("RPC 조회수 증가 실패:", rpcError)
      }
    }

    load()
  }, [id])

  // 💡 [수정 4] 관리자용 삭제 실행 함수
  const handleDelete = async () => {
    if (!window.confirm("정말 이 뉴스를 삭제하시겠습니까? (복구 불가) 🚨")) return;
    
    try {
      await deleteNews(id)
      toast.success("뉴스가 깔끔하게 삭제되었다냥! 🗑️")
      router.replace("/") // 삭제 후 피드(홈)로 이동
    } catch (error) {
      console.error("삭제 에러:", error)
      toast.error("삭제 중 오류가 발생했다냥.")
    }
  }

  const isBookmarked = news ? isSaved(news.id) : false

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
          <div className="flex items-center gap-1">
            {/* 💡 [수정 5] 관리자에게만 보이는 비밀 메뉴 (수정 / 삭제) */}
            {isAdmin && (
              <>
                <button 
                  onClick={() => router.push(`/news/${news.id}/edit`)}
                  className="p-1.5 hover:bg-indigo-50 rounded-full transition-colors group"
                  aria-label="뉴스 수정"
                >
                  <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-1.5 hover:bg-red-50 rounded-full transition-colors group"
                  aria-label="뉴스 삭제"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                </button>
                {/* 구분선 */}
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
              </>
            )}

            <Link href="/" className="p-1.5 hover:bg-emerald-50 rounded-full transition-colors group">
              <Home className="w-5 h-5 text-slate-800 group-hover:text-emerald-600" />
            </Link>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6">
        {/* 카테고리 및 태그 */}
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

        {/* 헤드라인 및 액션 버튼 */}
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

        {/* 메타 정보 (날짜, 조회수) */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mb-8">
          {news.source && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> {news.source}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatDate(news.published_at)}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <Eye className="w-3 h-3 text-slate-300" />
            <span className="font-bold">{liveViewCount}</span>
          </div>
        </div>

        {/* AI 요약 섹션 */}
        {news.ai_summary && (
          <div className="mb-8">
            <DukguAiSummary summary={news.ai_summary} />
          </div>
        )}

        {/* 뉴스 본문 */}
        <article className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium mb-10 break-keep">
          {news.content ?? news.summary}
        </article>

        <AiDisclaimer />

        {/* 리액션 섹션 */}
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

        {/* 댓글 섹션 */}
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